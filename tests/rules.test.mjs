import {readFileSync} from 'node:fs';
import {before,after,test} from 'node:test';
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {doc,setDoc,getDoc,getDocs,collection,updateDoc,serverTimestamp,Timestamp,writeBatch,runTransaction} from 'firebase/firestore';
let env;
const data=(extra={})=>({firstName:'Ana',lastName:'Horvat',title:'',affiliation:'PAR',email:'person@example.com',requestedRole:'guest',role:'guest',status:'pending',attended:false,createdAt:serverTimestamp(),updatedAt:serverTimestamp(),...extra});
const ctx=(uid,verified=false)=>env.authenticatedContext(uid,{email:'person@example.com',email_verified:verified});
before(async()=>{env=await initializeTestEnvironment({projectId:'demo-pilc',firestore:{rules:readFileSync('firestore.rules','utf8')}});await env.clearFirestore();await env.withSecurityRulesDisabled(async c=>{for(const [id,extra] of Object.entries({admin:{role:'admin',status:'approved'},guest:{status:'approved'},presenter:{status:'approved',role:'presenter'},pending:{},rejected:{status:'rejected'},unverified:{status:'approved'},attended:{status:'approved',attended:true}}))await setDoc(doc(c.firestore(),'users',id),data(extra));await setDoc(doc(c.firestore(),'settings','certificates'),{x:50,y:51,fontSize:30,published:true,hasTemplate:true,templatePath:'assets/documents/certificate-demo.pdf'});});});
after(async()=>env?.cleanup());
test('anonymous access is denied',async()=>{await assertFails(getDocs(collection(env.unauthenticatedContext().firestore(),'users')));await assertSucceeds(getDocs(collection(env.unauthenticatedContext().firestore(),'sessions')));});
test('registration creates only a pending guest profile',async()=>{const db=ctx('new',false).firestore();await assertSucceeds(setDoc(doc(db,'users','new'),data()));await assertFails(updateDoc(doc(db,'users','new'),{role:'admin',updatedAt:serverTimestamp()}));await assertFails(updateDoc(doc(db,'users','new'),{status:'approved',updatedAt:serverTimestamp()}));await assertFails(updateDoc(doc(db,'users','new'),{attended:true,updatedAt:serverTimestamp()}));});
test('cannot self-register as admin or approve own profile',async()=>{await assertFails(setDoc(doc(ctx('evil').firestore(),'users','evil'),data({role:'admin',status:'approved'})));await assertFails(setDoc(doc(ctx('wrong-email').firestore(),'users','wrong-email'),data({email:'other@example.com'})));});
test('own profile is readable and editable; other profiles and lists are private',async()=>{const db=ctx('guest').firestore();await assertSucceeds(getDoc(doc(db,'users','guest')));await assertSucceeds(updateDoc(doc(db,'users','guest'),{firstName:'Željka',updatedAt:serverTimestamp()}));await assertFails(getDoc(doc(db,'users','presenter')));await assertFails(getDocs(collection(db,'users')));await assertFails(updateDoc(doc(db,'users','guest'),{email:'changed@example.com',updatedAt:serverTimestamp()}));await assertFails(updateDoc(doc(db,'users','guest'),{unexpected:'field',updatedAt:serverTimestamp()}));});
test('admin approval allows access without email verification; pending and rejected remain blocked',async()=>{await assertSucceeds(getDocs(collection(ctx('guest').firestore(),'sessions')));for(const id of ['pending','rejected'])await assertFails(getDocs(collection(ctx(id).firestore(),'users',id,'savedSessions')));await assertSucceeds(getDocs(collection(ctx('unverified',false).firestore(),'sessions')));});
test('admin approval and revocation are enforced immediately',async()=>{const db=ctx('admin').firestore();await assertSucceeds(getDocs(collection(db,'users')));await assertSucceeds(updateDoc(doc(db,'users','pending'),{status:'approved',updatedAt:serverTimestamp()}));await assertSucceeds(getDocs(collection(ctx('pending').firestore(),'sessions')));await assertSucceeds(updateDoc(doc(db,'users','pending'),{status:'rejected',updatedAt:serverTimestamp()}));await assertFails(getDocs(collection(ctx('pending').firestore(),'users','pending','savedSessions')));await assertFails(updateDoc(doc(db,'users','admin'),{role:'guest',updatedAt:serverTimestamp()}));});
test('programme and presenter writes are admin only with validation',async()=>{const row={day:'18',time:'09:00',end:'10:00',titleEn:'Session',titleHr:'Sesija',room:'A',type:'Panel'};await assertFails(setDoc(doc(ctx('guest').firestore(),'sessions','one'),row));await assertSucceeds(setDoc(doc(ctx('admin').firestore(),'sessions','one'),row));await assertFails(setDoc(doc(ctx('admin').firestore(),'sessions','bad'),{...row,end:'08:00'}));const p={name:'Demo',titleEn:'Role',titleHr:'Uloga',bioEn:'Bio',bioHr:'Bio',photo:''};await assertSucceeds(setDoc(doc(ctx('admin').firestore(),'presenters','one'),p));await assertFails(setDoc(doc(ctx('admin').firestore(),'presenters','bad'),{...p,photo:'javascript:alert(1)'}));});
test('presenters may submit only their own papers; review is admin only',async()=>{const s={title:'Paper',authors:'Ana',abstract:'Abstract',paperUrl:'https://example.com/paper.pdf',ownerId:'presenter',status:'submitted',updatedAt:serverTimestamp()};await assertSucceeds(setDoc(doc(ctx('presenter').firestore(),'submissions','presenter'),s));await assertFails(setDoc(doc(ctx('guest').firestore(),'submissions','guest'),{...s,ownerId:'guest'}));await assertFails(updateDoc(doc(ctx('presenter').firestore(),'submissions','presenter'),{status:'accepted',updatedAt:serverTimestamp()}));await assertSucceeds(updateDoc(doc(ctx('admin').firestore(),'submissions','presenter'),{status:'accepted',updatedAt:serverTimestamp()}));await assertFails(getDoc(doc(ctx('guest').firestore(),'submissions','presenter')));});
test('only admins can publish valid static PDF template settings',async()=>{const settings={x:50,y:51,fontSize:30,published:true,hasTemplate:true,templatePath:'assets/documents/certificate-demo.pdf'};await assertFails(setDoc(doc(ctx('guest').firestore(),'settings','certificates'),settings));await assertSucceeds(setDoc(doc(ctx('admin').firestore(),'settings','certificates'),settings));for(const path of ['https://evil.example/template.pdf','../private.pdf','assets/documents/../../private.pdf'])await assertFails(setDoc(doc(ctx('admin').firestore(),'settings','certificates'),{...settings,templatePath:path}));});
test('paper links require HTTPS and are not public',async()=>{const s={title:'Paper',authors:'Ana',abstract:'Abstract',ownerId:'presenter',status:'submitted',updatedAt:serverTimestamp(),paperUrl:'javascript:alert(1)'};await assertFails(setDoc(doc(ctx('presenter').firestore(),'submissions','presenter'),s));await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(),'submissions','presenter')));});
test('targeted notifications are private and only admins publish',async()=>{
 const notice={titleEn:'Hello',titleHr:'Pozdrav',bodyEn:'<p>News</p>',bodyHr:'<p>Novost</p>',audience:'role:presenter',createdBy:'admin',createdAt:serverTimestamp()};
 await assertSucceeds(setDoc(doc(ctx('admin').firestore(),'notifications','targeted'),notice));
 await assertSucceeds(getDoc(doc(ctx('presenter').firestore(),'notifications','targeted')));
 await assertFails(getDoc(doc(ctx('guest').firestore(),'notifications','targeted')));
 await assertFails(setDoc(doc(ctx('guest').firestore(),'notifications','forged'),{...notice,createdBy:'guest'}));
 await assertSucceeds(setDoc(doc(ctx('admin').firestore(),'notifications','private'),{...notice,audience:'user:guest'}));
 await assertSucceeds(getDoc(doc(ctx('guest').firestore(),'notifications','private')));
 await assertFails(getDoc(doc(ctx('presenter').firestore(),'notifications','private')));
});
test('saved programme and read markers belong to their owner',async()=>{
 const db=ctx('guest').firestore();
 await assertSucceeds(setDoc(doc(db,'users','guest','savedSessions','one'),{savedAt:serverTimestamp()}));
 await assertFails(getDocs(collection(ctx('presenter').firestore(),'users','guest','savedSessions')));
 await assertSucceeds(setDoc(doc(db,'users','guest','notificationReads','private'),{readAt:serverTimestamp()}));
 await assertFails(setDoc(doc(db,'users','guest','notificationReads','targeted'),{readAt:serverTimestamp()}));
});
test('five-day programme allows unknown times but rejects partial times',async()=>{
 const row={day:'16',time:'',end:'',titleEn:'Academy',titleHr:'Akademija',room:'',type:'ALA'};
 await assertSucceeds(setDoc(doc(ctx('admin').firestore(),'sessions','academy'),row));
 await assertFails(setDoc(doc(ctx('admin').firestore(),'sessions','partial'),{...row,time:'09:00'}));
 await assertFails(setDoc(doc(ctx('guest').firestore(),'sessions','forged-academy'),row));
});
test('registration data and PAR fee waiver are validated and admin-controlled',async()=>{
 const registration={institution:'PAR',address:'Test 1',city:'Rijeka',country:'Croatia',vat:'',contactEmail:'test@example.com',phone:'123',registrationType:'par',payingAs:'person',keywords:'Leadership,Education',termsAccepted:true};
 const row={title:'Research',authors:'Ana',abstract:'A short abstract',paperUrl:'',ownerId:'presenter',status:'submitted',updatedAt:serverTimestamp(),registration,feeStatus:'pending'};
 const ref=doc(ctx('presenter').firestore(),'submissions','presenter');
 await assertSucceeds(setDoc(ref,row));
 await assertFails(updateDoc(ref,{feeStatus:'approved',updatedAt:serverTimestamp()}));
 await assertFails(setDoc(ref,{...row,registration:{...registration,termsAccepted:false}}));
 await assertFails(setDoc(ref,{...row,registration:{...registration,keywords:'a,b,c,d,e,f'}}));
 await assertFails(setDoc(ref,{...row,abstract:Array(401).fill('word').join(' ')}));
 await assertFails(setDoc(ref,{...row,registration:{...registration,payingAs:'company'}}));
 await assertSucceeds(updateDoc(doc(ctx('admin').firestore(),'submissions','presenter'),{feeStatus:'approved',updatedAt:serverTimestamp()}));
 await assertFails(getDoc(doc(ctx('guest').firestore(),'submissions','presenter')));
});

test('public visitors only read public programme and presenters',async()=>{const db=env.unauthenticatedContext().firestore();await assertSucceeds(getDocs(collection(db,'presenters')));for(const name of ['users','submissions','notifications'])await assertFails(getDocs(collection(db,name)));await assertFails(setDoc(doc(db,'sessions','attack'),{titleEn:'Forged'}));});
test('guest registration stores requests privately and cannot self-approve',async()=>{
 const row={name:'Ana',institution:'PAR',email:'a@example.com',plan:'par',code:'TEST',terms:true,ownerId:'guest',status:'submitted',updatedAt:serverTimestamp()};
 const ref=doc(ctx('guest').firestore(),'guestRegistrations','guest');await assertSucceeds(setDoc(ref,row));
 await assertFails(updateDoc(ref,{status:'accepted',updatedAt:serverTimestamp()}));
 await assertFails(getDocs(collection(env.unauthenticatedContext().firestore(),'guestRegistrations')));
 await assertFails(getDoc(doc(ctx('presenter').firestore(),'guestRegistrations','guest')));
 await assertSucceeds(updateDoc(doc(ctx('admin').firestore(),'guestRegistrations','guest'),{status:'accepted',updatedAt:serverTimestamp()}));
});

const promoRow=(percent=20)=>({percent,year:2027,createdBy:'admin',createdAt:serverTimestamp(),usedBy:'',usedAt:null});
const guestRow=(uid,code)=>({name:'Ana Horvat',institution:'PAR',email:'person@example.com',plan:'standard',code,promoCode:code,terms:true,ownerId:uid,status:'submitted',updatedAt:serverTimestamp()});
async function promoUser(id){await env.withSecurityRulesDisabled(c=>setDoc(doc(c.firestore(),'users',id),data({status:'approved'})));}
function claimBatch(db,uid,code,percent=20,{registration=true,claim=true}={}){const b=writeBatch(db);b.update(doc(db,'promoCodes',code),{usedBy:uid,usedAt:serverTimestamp()});if(claim)b.set(doc(db,'discountClaims',uid),{code,percent,year:2027,target:'guestRegistrations',ownerId:uid,name:'Ana Horvat',email:'person@example.com',claimedAt:serverTimestamp()});if(registration)b.set(doc(db,'guestRegistrations',uid),guestRow(uid,code));return b.commit();}
test('promo creation is admin only and percentages must match the code',async()=>{
 const admin=ctx('admin').firestore();await assertSucceeds(setDoc(doc(admin,'promoCodes','P20ABC'),promoRow()));
 await assertFails(setDoc(doc(ctx('guest').firestore(),'promoCodes','P50ABC'),{...promoRow(50),createdBy:'guest'}));
 await assertFails(setDoc(doc(admin,'promoCodes','P50BAD'),promoRow(20)));
 await assertFails(setDoc(doc(admin,'promoCodes','P20ABC'),promoRow()));
 await assertFails(getDocs(collection(ctx('guest').firestore(),'promoCodes')));
 await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(),'promoCodes','P20ABC')));
});
test('redemption requires atomic registration, code and immutable matching account claim',async()=>{
 await promoUser('promo-one');const db=ctx('promo-one').firestore();
 await assertFails(claimBatch(db,'promo-one','P20ABC',100));
 await assertFails(claimBatch(db,'promo-one','P20ABC',20,{registration:false}));
 await assertFails(claimBatch(db,'promo-one','P20ABC',20,{claim:false}));
 await assertSucceeds(claimBatch(db,'promo-one','P20ABC'));
 await assertFails(updateDoc(doc(db,'discountClaims','promo-one'),{percent:100}));
 await assertFails(updateDoc(doc(ctx('admin').firestore(),'discountClaims','promo-one'),{percent:100}));
 await assertFails(updateDoc(doc(db,'guestRegistrations','promo-one'),{promoCode:'',updatedAt:serverTimestamp()}));
 await assertSucceeds(updateDoc(doc(db,'guestRegistrations','promo-one'),{name:'Updated participant',updatedAt:serverTimestamp()}));
 await assertFails(getDoc(doc(ctx('guest').firestore(),'discountClaims','promo-one')));
 await assertFails(getDoc(doc(ctx('guest').firestore(),'promoCodes','P20ABC')));
 await promoUser('promo-two');await assertFails(claimBatch(ctx('promo-two').firestore(),'promo-two','P20ABC'));
 await assertSucceeds(setDoc(doc(ctx('admin').firestore(),'promoCodes','P50XYZ'),promoRow(50)));
 await assertFails(claimBatch(db,'promo-one','P50XYZ',50));
});
test('two simultaneous claims cannot consume the same code twice',async()=>{
 await promoUser('race-a');await promoUser('race-b');await setDoc(doc(ctx('admin').firestore(),'promoCodes','P20RAC'),promoRow());
 const results=await Promise.allSettled([claimBatch(ctx('race-a').firestore(),'race-a','P20RAC'),claimBatch(ctx('race-b').firestore(),'race-b','P20RAC')]);
 if(results.filter(r=>r.status==='fulfilled').length!==1)throw Error('Expected exactly one successful redemption');
 const loser=results[0].status==='rejected'?'race-a':'race-b';await assertSucceeds(getDoc(doc(ctx(loser).firestore(),'discountClaims',loser))).then(s=>{if(s.exists())throw Error('Loser must not have a claim');});
});

test('author registration claims a code through a transaction and keeps it on resubmission',async()=>{
 await env.withSecurityRulesDisabled(c=>setDoc(doc(c.firestore(),'users','promo-author'),data({status:'approved',role:'presenter'})));
 await setDoc(doc(ctx('admin').firestore(),'promoCodes','P50AUT'),promoRow(50));
 const db=ctx('promo-author').firestore();
 await assertSucceeds(runTransaction(db,async tx=>{
   const code=await tx.get(doc(db,'promoCodes','P50AUT'));const p=await tx.get(doc(db,'users','promo-author'));await tx.get(doc(db,'discountClaims','promo-author'));
   tx.update(code.ref,{usedBy:'promo-author',usedAt:serverTimestamp()});
   tx.set(doc(db,'discountClaims','promo-author'),{code:code.id,percent:code.data().percent,year:2027,target:'submissions',ownerId:'promo-author',name:p.data().firstName+' '+p.data().lastName,email:p.data().email,claimedAt:serverTimestamp()});
   tx.set(doc(db,'submissions','promo-author'),{title:'Research',authors:'Ana',abstract:'Abstract',paperUrl:'',ownerId:'promo-author',status:'submitted',updatedAt:serverTimestamp(),promoCode:code.id});
 }));
 await assertSucceeds(updateDoc(doc(db,'submissions','promo-author'),{title:'Updated paper',updatedAt:serverTimestamp()}));
 await assertFails(setDoc(doc(db,'guestRegistrations','promo-author'),guestRow('promo-author','P50AUT')));
});
test('PAR guest registration only accepts a 100 percent code',async()=>{
 await promoUser('par-guest');const db=ctx('par-guest').firestore();
 await setDoc(doc(ctx('admin').firestore(),'promoCodes','P20PAR'),promoRow());await setDoc(doc(ctx('admin').firestore(),'promoCodes','P100PAR'),promoRow(100));
 async function submit(code,percent){const b=writeBatch(db);b.update(doc(db,'promoCodes',code),{usedBy:'par-guest',usedAt:serverTimestamp()});b.set(doc(db,'discountClaims','par-guest'),{code,percent,year:2027,target:'guestRegistrations',ownerId:'par-guest',name:'Ana Horvat',email:'person@example.com',claimedAt:serverTimestamp()});b.set(doc(db,'guestRegistrations','par-guest'),{...guestRow('par-guest',code),plan:'par'});return b.commit();}
 await assertFails(submit('P20PAR',20));await assertSucceeds(submit('P100PAR',100));
});
