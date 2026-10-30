import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, signOut, setPersistence, browserLocalPersistence, browserSessionPersistence, reload } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc, onSnapshot, collection, getDocs, addDoc, deleteDoc, serverTimestamp, query, where, writeBatch } from 'firebase/firestore';
import { firebaseConfig } from './config.js';
const app=initializeApp(firebaseConfig), auth=getAuth(app), db=getFirestore(app);
export const api={
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
  editSession: (id,data)=>updateDoc(doc(db,'sessions',id),data),
  removeSession: id=>deleteDoc(doc(db,'sessions',id)),
  async presenters(){return (await getDocs(collection(db,'presenters'))).docs.map(d=>({id:d.id,...d.data()}));},
  addPresenter: data=>addDoc(collection(db,'presenters'),data),
  editPresenter: (id,data)=>updateDoc(doc(db,'presenters',id),data),
  removePresenter: id=>deleteDoc(doc(db,'presenters',id)),
  async users(){return (await getDocs(collection(db,'users'))).docs.map(d=>({id:d.id,...d.data()}));},
  updateUser: (uid,data)=>updateDoc(doc(db,'users',uid),{...data,updatedAt:serverTimestamp()}),
  async submission(){const d=await getDoc(doc(db,'submissions',auth.currentUser.uid));return d.exists()?d.data():null;},
  async submissions(){return (await getDocs(collection(db,'submissions'))).docs.map(d=>({id:d.id,...d.data()}));},
  async submit(data){const uid=auth.currentUser.uid;await setDoc(doc(db,'submissions',uid),{...data,ownerId:uid,status:'submitted',updatedAt:serverTimestamp()});},
  review: (uid,status)=>updateDoc(doc(db,'submissions',uid),{status,updatedAt:serverTimestamp()}),
  async certificateSettings(){const d=await getDoc(doc(db,'settings','certificates'));return d.exists()?d.data():null;},
  async saveCertificate(data){await setDoc(doc(db,'settings','certificates'),data);}
};
