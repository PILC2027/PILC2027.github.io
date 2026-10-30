const scenario=new URLSearchParams(location.search).get('test')||'signedout';
const base={id:'test-person',firstName:'Željka',lastName:'Šimić',title:'dr. sc.',affiliation:'Veleučilište PAR',email:'test@example.com',role:scenario==='admin'?'admin':scenario==='presenter'?'presenter':'guest',requestedRole:'guest',status:scenario==='pending'?'pending':'approved',attended:false};
let profile=base,user=scenario==='signedout'?null:{uid:base.id,email:base.email,emailVerified:false},authCallback,profileCallback;
let sessions=[],presenters=[],submissions=[],submission=null,settings=null;
let users=[base,{...base,id:'pending-person',firstName:'Ana',lastName:'Horvat',role:'guest',requestedRole:'presenter',status:'pending',email:'ana@example.com'}];
let saved=JSON.parse(localStorage.getItem('mock-saved')||'[]'),reads=[],notices=[],noticeCallback;
const notify=()=>noticeCallback?.(notices.filter(n=>['all','role:'+profile.role,'user:'+profile.id].includes(n.audience)));
export const api={
 async savedSessions(){return [...saved];},async saveSession(id,value){saved=value?[...saved,id]:saved.filter(s=>s!==id);localStorage.setItem('mock-saved',JSON.stringify(saved));},
 async readNotifications(){return [...reads];},async markRead(id){reads.push(id);},
 observeNotifications(role,cb){noticeCallback=cb;setTimeout(notify,0);return ()=>{noticeCallback=null;};},
 async sentNotifications(){return [...notices];},async sendNotification(data,audiences){for(const audience of audiences)notices.unshift({...data,audience,id:'notice-'+notices.length});notify();},async removeNotification(id){notices=notices.filter(n=>n.id!==id);notify();},
 observeAuth(cb){authCallback=cb;setTimeout(()=>cb(user),0);return ()=>{};},
 observeProfile(uid,cb){profileCallback=cb;setTimeout(()=>cb(profile),0);return ()=>{};},
 async login(email,password){if(password==='incorrect')throw {code:'auth/invalid-credential'};user={uid:base.id,email,emailVerified:false};authCallback(user);},
 async register(data){profile={...base,...data,status:'pending'};user={uid:base.id,email:data.email,emailVerified:false};authCallback(user);},
 async completeProfile(data){profile={...base,...data,status:'pending'};profileCallback(profile);},
 async reset(){},async refresh(){return user;},async logout(){user=null;authCallback(null);},
 async saveProfile(data){profile={...profile,...data};profileCallback(profile);},
 async sessions(){return [...sessions];},async addSession(data){sessions.push({...data,id:'session-'+sessions.length});},async editSession(id,data){sessions=sessions.map(s=>s.id===id?{...s,...data}:s);},async removeSession(id){sessions=sessions.filter(s=>s.id!==id);},
 async presenters(){return [...presenters];},async addPresenter(data){presenters.push({...data,id:'presenter-'+presenters.length});},async editPresenter(id,data){presenters=presenters.map(p=>p.id===id?{...p,...data}:p);},async removePresenter(id){presenters=presenters.filter(p=>p.id!==id);},
 async users(){return [...users];},async updateUser(uid,data){users=users.map(u=>u.id===uid?{...u,...data}:u);},
 async submissions(){return [...submissions];},async submission(){return submission;},async submit(data){submission={...data,status:'submitted'};},async review(){},
 async certificateSettings(){return settings;},async saveCertificate(data){settings=data;}
};
