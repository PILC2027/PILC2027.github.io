import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
const navy=rgb(.067,.176,.314), gold=rgb(1,.647,.067), muted=rgb(.34,.42,.51);
const bytes=async path=>{const r=await fetch(path);if(!r.ok)throw Error('asset');return r.arrayBuffer();};
async function setup(template){const pdf=template?await PDFDocument.load(template):await PDFDocument.create();pdf.registerFontkit(fontkit);const font=await pdf.embedFont(await bytes('assets/Lato-Regular.ttf'),{subset:true});return {pdf,font};}
function center(page,font,text,y,size=18,color=navy){const fit=Math.min(size,(page.getWidth()-100)/Math.max(font.widthOfTextAtSize(text,1),1));page.drawText(text,{x:(page.getWidth()-font.widthOfTextAtSize(text,fit))/2,y,size:fit,font,color});}
export async function certificate(profile,{demo=false,template=null,settings={}}={}){
  const {pdf,font}=await setup(template);
  const page=template?pdf.getPages()[0]:pdf.addPage([842,595]);
  if(!template){
    page.drawRectangle({x:0,y:0,width:842,height:595,color:rgb(1,1,1)});
    page.drawRectangle({x:0,y:0,width:22,height:595,color:navy});
    page.drawRectangle({x:22,y:0,width:7,height:595,color:gold});
    const logo=await pdf.embedPng(await bytes('assets/pilc-logo.png'));
    page.drawImage(logo,{x:251,y:441,width:340,height:118});
    center(page,font,'POTVRDA O SUDJELOVANJU',411,28);
    center(page,font,'CERTIFICATE OF PARTICIPATION',381,12,muted);
    center(page,font,'Potvrđujemo da je / This certifies that',335,13,muted);
    page.drawLine({start:{x:145,y:263},end:{x:697,y:263},thickness:1,color:gold});
    center(page,font,'sudjelovao/la na konferenciji / participated in',224,13,muted);
    center(page,font,'PAR International Leadership Conference',192,21);
    center(page,font,'WHERE LEADERS MEET FUTURE LEADERS',157,14);
    center(page,font,'18.–20. 03. 2027.  ·  Rijeka / Opatija, Croatia',120,13,muted);
    center(page,font,'PAR University of Applied Sciences · Veleučilište PAR',70,11,muted);
  }
  const name=`${profile.firstName} ${profile.lastName}`;
  // Coordinates are fractions of the PDF page; y is measured from the top.
  const x=Number(settings.x??50)/100*page.getWidth(), y=(1-Number(settings.y??51)/100)*page.getHeight();
  const availableWidth=Math.min(page.getWidth()*.75,2*Math.min(x-20,page.getWidth()-x-20));
  const size=Math.min(Number(settings.fontSize??30),availableWidth/Math.max(font.widthOfTextAtSize(name,1),1));
  page.drawText(name,{x:x-font.widthOfTextAtSize(name,size)/2,y,size,font,color:navy});
  if(demo)center(page,font,'DEMO · OGLEDNI PRIMJER · NIJE SLUŽBENA POTVRDA',28,11,rgb(.65,.23,.12));
  return pdf.save();
}
export async function badge(profile,role){
  const {pdf,font}=await setup();const page=pdf.addPage([360,510]);
  const logo=await pdf.embedPng(await bytes('assets/pilc-logo.png'));
  page.drawImage(logo,{x:20,y:382,width:320,height:111});
  page.drawRectangle({x:0,y:0,width:360,height:377,color:navy});
  page.drawRectangle({x:0,y:370,width:360,height:7,color:gold});
  center(page,font,'PILC 2027 · AKREDITACIJA / BADGE',335,10,rgb(1,1,1));
  center(page,font,profile.title||'',280,14,rgb(.8,.86,.93));
  center(page,font,profile.firstName,242,30,rgb(1,1,1));
  center(page,font,profile.lastName,201,30,rgb(1,1,1));
  center(page,font,profile.affiliation,162,13,rgb(.8,.86,.93));
  center(page,font,role.toUpperCase(),114,13,gold);
  center(page,font,'18–20 MARCH 2027 · RIJEKA / OPATIJA',62,10,rgb(1,1,1));
  center(page,font,`ID: ${profile.id}`,34,8,rgb(.8,.86,.93));
  return pdf.save();
}
export function download(data,name,type='application/pdf'){const url=URL.createObjectURL(new Blob([data],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);}
