import {generateCode, normalizeCode, validCode, DISCOUNTS} from './promo.js';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, signOut, setPersistence, browserLocalPersistence, browserSessionPersistence, reload } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc, onSnapshot, collection, getDocs, addDoc, deleteDoc, serverTimestamp, query, where, writeBatch, runTransaction } from 'firebase/firestore';
import { firebaseConfig } from './config.js';
const app=initializeApp(firebaseConfig), auth=getAuth(app), db=getFirestore(app);
export const api={
 async discountClaim(){const s=await getDoc(doc(db,'discountClaims',auth.currentUser.uid));return s.exists()?s.data():null;},
 async promoCodes(){return (await getDocs(collection(db,'promoCodes'))).docs.map(d=>({id:d.id,...d.data()}));},
 async discountClaims(){return (await getDocs(collection(db,'discountClaims'))).docs.map(d=>({id:d.id,...d.data()}));},
 async checkPromo(value){const code=normalizeCode(value);if(!validCode(code))throw {code:'promo-invalid'};try{const s=await getDoc(doc(db,'promoCodes',code));if(!s.exists()||s.data().usedBy)throw {code:'promo-invalid'};return {code,percent:s.data().percent};}catch(err){if(err.code==='permission-denied')throw {code:'promo-invalid'};throw err;}},
 async generateCodes(percent,count){
   if(!DISCOUNTS.includes(percent)||!Number.isInteger(count)||count<1||count>100)throw {code:'promo-count'};
   for(let attempt=0;attempt<20;attempt++){
     const codes=new Set();while(codes.size<count)codes.add(generateCode(percent));
     const created=await runTransaction(db,async tx=>{
       const refs=[...codes].map(c=>doc(db,'promoCodes',c));
       const snapshots=await Promise.all(refs.map(ref=>tx.get(ref)));
       if(snapshots.some(s=>s.exists()))return false;
       refs.forEach(ref=>tx.set(ref,{percent,year:2027,createdBy:auth.currentUser.uid,createdAt:serverTimestamp(),usedBy:'',usedAt:null}));return true;
     });
     if(created)return [...codes];
   }
   throw {code:'promo-capacity'};
 },
 async guestRegistration(){const snapshot=await getDoc(doc(db,'guestRegistrations',auth.currentUser.uid));return snapshot.exists()?snapshot.data():null;},
 async registerGuest(data){const uid=auth.currentUser.uid;await saveRegistration('guestRegistrations',data);},
 async guestRegistrations(){return (await getDocs(collection(db,'guestRegistrations'))).docs.map(d=>({id:d.id,...d.data()}));},
 reviewGuest:(id,status)=>updateDoc(doc(db,'guestRegistrations',id),{status,updatedAt:serverTimestamp()}),

  async savedSessions(){return (await getDocs(collection(db,'users',auth.currentUser.uid,'savedSessions'))).docs.map(d=>d.id);},
  saveSession: (id,saved)=>saved?setDoc(doc(db,'users',auth.currentUser.uid,'savedSessions',id),{savedAt:serverTimestamp()}):deleteDoc(doc(db,'users',auth.currentUser.uid,'savedSessions',id)),
  async readNotifications(){return (await getDocs(collection(db,'users',auth.currentUser.uid,'notificationReads'))).docs.map(d=>d.id);},
  markRead: id=>setDoc(doc(db,'users',auth.currentUser.uid,'notificationReads',id),{readAt:serverTimestamp()}),
  observeNotifications(role,cb,fail){return onSnapshot(query(collection(db,'notifications'),where('audience','in',['all',`role:${role}`,`user:${auth.currentUser.uid}`])),s=>cb(s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.createdAt?.toMillis()||0)-(a.createdAt?.toMillis()||0))),fail);},
  async sentNotifications(){return (await getDocs(collection(db,'notifications'))).docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.createdAt?.toMillis()||0)-(a.createdAt?.toMillis()||0));},
  async sendNotification(data,audiences){const batch=writeBatch(db);for(const audience of audiences)batch.set(doc(collection(db,'notifications')),{...data,audience,createdBy:auth.currentUser.uid,createdAt:serverTimestamp()});await batch.commit();},
  removeNotification: id=>deleteDoc(doc(db,'notifications',id)),
  setLanguage: language=>{auth.languageCode=language;},
  observeAuth: cb=>onAuthStateChanged(auth,cb),
  observeProfile: (uid,cb,fail)=>onSnapshot(doc(db,'users',uid),s=>cb(s.exists()?{id:s.id,...s.data()}:null),fail),
  async login(email,password,remember){await setPersistence(auth,remember?browserLocalPersistence:browserSessionPersistence);return signInWithEmailAndPassword(auth,email,password);},
  async register(data,password){
    await createUserWithEmailAndPassword(auth,data.email,password);
    await api.completeProfile(data);
  },
  async completeProfile(data){await setDoc(doc(db,'users',auth.currentUser.uid),{...data,email:auth.currentUser.email,role:'guest',status:'pending',attended:false,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});},
  reset: email=>sendPasswordResetEmail(auth,email),
  async refresh(){await reload(auth.currentUser);await auth.currentUser.getIdToken(true);return auth.currentUser;},
  logout: ()=>signOut(auth),
  saveProfile: data=>updateDoc(doc(db,'users',auth.currentUser.uid),{...data,updatedAt:serverTimestamp()}),
  async sessions(){return (await getDocs(collection(db,'sessions'))).docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(a.day+a.time).localeCompare(b.day+b.time));},
  addSession: data=>addDoc(collection(db,'sessions'),data),
  editSession: (id,data)=>setDoc(doc(db,'sessions',id),data),
  removeSession: id=>deleteDoc(doc(db,'sessions',id)),
  async presenters(){return (await getDocs(collection(db,'presenters'))).docs.map(d=>({id:d.id,...d.data()}));},
  addPresenter: data=>addDoc(collection(db,'presenters'),data),
  editPresenter: (id,data)=>updateDoc(doc(db,'presenters',id),data),
  removePresenter: id=>deleteDoc(doc(db,'presenters',id)),
  async users(){return (await getDocs(collection(db,'users'))).docs.map(d=>({id:d.id,...d.data()}));},
  updateUser: (uid,data)=>updateDoc(doc(db,'users',uid),{...data,updatedAt:serverTimestamp()}),
  async submission(){const d=await getDoc(doc(db,'submissions',auth.currentUser.uid));return d.exists()?d.data():null;},
  async submissions(){return (await getDocs(collection(db,'submissions'))).docs.map(d=>({id:d.id,...d.data()}));},
  async submit(data){const uid=auth.currentUser.uid;await saveRegistration('submissions',data);},
  reviewFee: (uid,feeStatus)=>updateDoc(doc(db,'submissions',uid),{feeStatus,updatedAt:serverTimestamp()}),
  review: (uid,status)=>updateDoc(doc(db,'submissions',uid),{status,updatedAt:serverTimestamp()}),
  async certificateSettings(){const d=await getDoc(doc(db,'settings','certificates'));return d.exists()?d.data():null;},
  async saveCertificate(data){await setDoc(doc(db,'settings','certificates'),data);}
};

// Claim and registration commit together: failed forms never consume a code.
async function saveRegistration(target,data){
 const uid=auth.currentUser.uid, claimRef=doc(db,'discountClaims',uid);
 await runTransaction(db,async tx=>{
   const existing=await tx.get(claimRef);
   let code=normalizeCode(data.promoCode);
   if(existing.exists()){
     const claim=existing.data();
     if(claim.target===target){if(code&&code!==claim.code)throw {code:'promo-bound'};code=claim.code;}
     else if(code)throw {code:'promo-bound'};
   }else if(code){
     if(!validCode(code))throw {code:'promo-invalid'};
     const ref=doc(db,'promoCodes',code);
     let snapshot;try{snapshot=await tx.get(ref);}catch(err){if(err.code==='permission-denied')throw {code:'promo-invalid'};throw err;}
     if(!snapshot.exists()||snapshot.data().usedBy)throw {code:'promo-invalid'};
     const p=(await tx.get(doc(db,'users',uid))).data(),percent=snapshot.data().percent;
     if(target==='guestRegistrations'&&data.plan==='par'&&percent!==100)throw {code:'promo-par'};
     tx.update(ref,{usedBy:uid,usedAt:serverTimestamp()});
     tx.set(claimRef,{code,percent,year:2027,target,ownerId:uid,name:p.firstName+' '+p.lastName,email:p.email,claimedAt:serverTimestamp()});
   }
   if(target==='guestRegistrations'&&data.plan==='par'&&!code)throw {code:'promo-par'};
   tx.set(doc(db,target,uid),{...data,promoCode:code,ownerId:uid,status:'submitted',updatedAt:serverTimestamp()});
 });
}
