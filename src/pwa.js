let installPrompt=null;
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;});
export function syncAppBadge(count){
  try{const result=count>0?navigator.setAppBadge?.(count):navigator.clearAppBadge?.();result?.catch(()=>{});}catch{}
}
export async function installApp(hr=false){
  if(window.matchMedia('(display-mode: standalone)').matches||navigator.standalone)return hr?'Aplikacija je već otvorena kao instalirana aplikacija.':'The installed app is already open.';
  if(installPrompt){const prompt=installPrompt;installPrompt=null;await prompt.prompt();const result=await prompt.userChoice;return result.outcome==='accepted'?(hr?'Instalacija je pokrenuta.':'Installation started.'):(hr?'Instalaciju možete pokrenuti kasnije.':'You can install later.');}
  return hr?'U izborniku preglednika odaberite „Instaliraj aplikaciju” ili „Dodaj na početni zaslon”. Na iPhoneu: Safari → Podijeli → Dodaj na početni zaslon.':'In your browser menu, choose “Install app” or “Add to Home Screen”. On iPhone: Safari → Share → Add to Home Screen.';
}
export async function enableBadge(hr=false){
  if(!('setAppBadge' in navigator))return hr?'Ovaj preglednik ne podržava broj na ikoni aplikacije. Broj nepročitanih ostaje vidljiv u portalu.':'This browser does not support app-icon badges. Unread counts remain available in the portal.';
  if('Notification' in window&&Notification.permission==='default')await Notification.requestPermission();
  return hr?'Broj na ikoni ažurira se dok je aplikacija aktivna, gdje sustav to podržava.':'The icon badge updates while the app is active, where supported by the system.';
}
if('serviceWorker' in navigator&&window.isSecureContext){window.addEventListener('load',()=>{navigator.serviceWorker.register('./sw.js').catch(()=>{});});}
