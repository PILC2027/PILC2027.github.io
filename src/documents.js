import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
const navy=rgb(.043,.176,.357), gold=rgb(.961,.651,.137), muted=rgb(.34,.42,.51);
const bytes=async path=>{const r=await fetch(path);if(!r.ok)throw Error('asset');return r.arrayBuffer();};
async function setup(template){const pdf=template?await PDFDocument.load(template):await PDFDocument.create();pdf.registerFontkit(fontkit);const font=await pdf.embedFont(await bytes('assets/Montserrat-Regular.ttf'),{subset:true});return {pdf,font};}
function center(page,font,text,y,size=18,color=navy){const fit=Math.min(size,(page.getWidth()-100)/Math.max(font.widthOfTextAtSize(text,1),1));page.drawText(text,{x:(page.getWidth()-font.widthOfTextAtSize(text,fit))/2,y,size:fit,font,color});}
export async function certificate(profile,{demo=false,template=null,settings={}}={}){
  const {pdf,font}=await setup(template);
  const page=template?pdf.getPages()[0]:pdf.addPage([842,595]);
  if(!template){
    page.drawRectangle({x:0,y:0,width:842,height:595,color:rgb(1,1,1)});
    page.drawRectangle({x:0,y:0,width:22,height:595,color:navy});
    page.drawRectangle({x:22,y:0,width:7,height:595,color:gold});
    page.drawEllipse({x:842,y:0,xScale:125,yScale:150,borderWidth:24,borderColor:gold});
    page.drawEllipse({x:0,y:595,xScale:150,yScale:120,borderWidth:30,borderColor:rgb(.231,.561,.839)});
    const logo=await pdf.embedPng(await bytes('assets/pilc-logo.png'));
    page.drawImage(logo,{x:251,y:441,width:340,height:118});
    center(page,font,'POTVRDA O SUDJELOVANJU',411,28);
    center(page,font,'CERTIFICATE OF PARTICIPATION',381,12,muted);
    center(page,font,'Potvrđujemo da je / This certifies that',335,13,muted);
    page.drawLine({start:{x:145,y:263},end:{x:697,y:263},thickness:1,color:gold});
    center(page,font,'sudjelovao/la u programu / participated in the programme of',224,13,muted);
    center(page,font,'PAR International Leadership Conference',192,21);
    center(page,font,'WHERE LEADERS MEET FUTURE LEADERS',157,14);
    center(page,font,'16.–20. 03. 2027.  ·  Rijeka / Opatija, Croatia',120,13,muted);
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
  // Wave artwork stays below the personal details, with a solid slogan area.
  page.drawRectangle({x:0,y:0,width:360,height:120,color:navy});
  page.drawEllipse({x:65,y:115,xScale:230,yScale:72,color:rgb(.231,.561,.839)});
  page.drawEllipse({x:270,y:70,xScale:125,yScale:100,color:gold});
  page.drawEllipse({x:65,y:20,xScale:240,yScale:128,color:navy});
  center(page,font,profile.title||'',345,12,muted);
  center(page,font,profile.firstName,310,29,navy);
  center(page,font,profile.lastName,274,29,navy);
  center(page,font,role.toUpperCase(),240,12,navy);
  center(page,font,profile.affiliation||'',213,12,muted);
  page.drawText('WHERE LEADERS MEET',{x:24,y:78,size:13,font,color:rgb(1,1,1)});
  page.drawText('FUTURE LEADERS',{x:24,y:56,size:17,font,color:gold});
  page.drawText('16–20 MARCH 2027 · RIJEKA / OPATIJA',{x:24,y:30,size:8,font,color:rgb(1,1,1)});
  center(page,font,`ID: ${profile.id}`,10,6,rgb(.8,.86,.93));
  return pdf.save();
}
export function download(data,name,type='application/pdf'){const url=URL.createObjectURL(new Blob([data],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);}
