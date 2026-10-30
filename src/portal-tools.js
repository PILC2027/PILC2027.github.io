export const escapeHtml = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function safeLink(value){try{const u=new URL(value);return ['https:','http:','mailto:'].includes(u.protocol)?u.href:null;}catch{return null;}}
// Both pasted content and content read from Firestore cross this allowlist.
export function cleanRichText(html){
  const doc=new DOMParser().parseFromString(String(html),'text/html');
  const allowed=new Set(['P','DIV','BR','STRONG','B','EM','I','U','UL','OL','LI','A']);
  function walk(node){
    if(node.nodeType===3){return escapeHtml(node.textContent).replace(/https?:\/\/[^\s<>]+/g,url=>`<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`);}
    if(node.nodeType!==1||['SCRIPT','STYLE','IFRAME','OBJECT','SVG','MATH'].includes(node.tagName))return '';
    if(node.tagName==='A'){const href=safeLink(node.getAttribute('href'));return href?`<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(node.textContent)}</a>`:escapeHtml(node.textContent);}
    const body=[...node.childNodes].map(walk).join('');
    return allowed.has(node.tagName)?node.tagName==='BR'?'<br>':`<${node.tagName.toLowerCase()}>${body}</${node.tagName.toLowerCase()}>`:body;
  }
  return [...doc.body.childNodes].map(walk).join('');
}
export function googleCalendarUrl(session,language='en'){
  const params=new URLSearchParams({action:'TEMPLATE',text:session?(language==='hr'?session.titleHr:session.titleEn):'PILC 2027 — Where leaders meet future leaders',dates:session?`202703${session.day}T${session.time.replace(':','')}00/202703${session.day}T${session.end.replace(':','')}00`:'20270318/20270321',ctz:'Europe/Zagreb',location:session?`${session.room} · Hilton Rijeka Costabella Beach Resort & Spa`:'Hilton Rijeka Costabella Beach Resort & Spa, Rijeka / Opatija',details:'PILC 2027 · '+(language==='hr'?'Provjerite aktualnu satnicu u portalu.':'Check the portal for the latest programme.')});
  return 'https://calendar.google.com/calendar/render?'+params;
}
export function participantsCsv(users){
  const cell=value=>{let text=String(value??'');if(/^[\s]*[=+\-@\t\r]/.test(text))text="'"+text;return '"'+text.replace(/"/g,'""')+'"';};
  return '\ufeff'+[['First name / Ime','Last name / Prezime','Title / Titula','Affiliation / Ustanova','Email','Role / Uloga','Status','Attended / Prisutan'],...users.map(u=>[u.firstName,u.lastName,u.title,u.affiliation,u.email,u.role,u.status,u.attended?'Yes / Da':'No / Ne'])].map(row=>row.map(cell).join(',')).join('\r\n');
}
