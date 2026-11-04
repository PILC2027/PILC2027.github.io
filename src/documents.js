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

export async function submissionReport(rows,language='en'){
 const {pdf,font}=await setup();const hr=language==='hr';let page,y;
 const tr=(en,cr)=>hr?cr:en;
 function next(){page=pdf.addPage([595,842]);y=785;page.drawRectangle({x:42,y:807,width:511,height:4,color:gold});page.drawText('PILC 2027 · '+tr('Submission report','Pregled prijava'),{x:42,y:818,size:10,font,color:navy});page.drawText(String(pdf.getPageCount()),{x:540,y:22,size:9,font,color:muted});}
 function text(value,size=10,color=navy){
   const raw=String(value??'—').replace(/[\u0000-\u0008\u000b-\u001f]/g,'');
   const lines=[];for(const paragraph of raw.split('\n')){let line='';for(const word of paragraph.split(/\s+/)){let pieces=[''];for(const char of word){let i=pieces.length-1;if(font.widthOfTextAtSize(pieces[i]+char,size)>505)pieces.push(char);else pieces[i]+=char;}for(const piece of pieces){if(line&&font.widthOfTextAtSize(line+' '+piece,size)>511){lines.push(line);line=piece;}else line+=(line?' ':'')+piece;}}lines.push(line);}
   for(const line of lines){if(y<52)next();page.drawText(line,{x:42,y,size,font,color});y-=size*1.55;}y-=6;
 }
 next();text(tr('All submitted papers and author details','Svi prijavljeni radovi i podaci o autorima'),18);
 text(tr('Private organiser copy. Full papers remain available at the links supplied by their authors.','Privatni primjerak organizatora. Cjeloviti radovi dostupni su putem poveznica koje su dostavili autori.'),10,muted);
 text(tr('Number of submissions: ','Broj prijava: ')+rows.length);
 for(let i=0;i<rows.length;i++){
   if(i||y<600)next();const s=rows[i],r=s.registration||{};
   text((i+1)+'. '+s.title,17);text(tr('Authors: ','Autori: ')+s.authors,12);
   const fields=[['institution','Institution / Company','Ustanova / tvrtka'],['address','Billing address','Adresa za račun'],['city','City','Grad'],['country','Countries','Države'],['vat','VAT / Tax ID','OIB / porezni broj'],['contactEmail','First author email','E-mail prvog autora'],['phone','First author phone','Telefon prvog autora'],['registrationType','Registration type','Vrsta registracije'],['payingAs','Paying as','Plaćanje kao'],['keywords','Keywords','Ključne riječi']];
   const labels={one:tr('1 author','1 autor'),two:tr('2 authors','2 autora'),three:tr('3+ authors','3+ autora'),par:tr('PAR professor','Profesor PAR-a'),company:tr('Company / institution','Tvrtka / ustanova'),person:tr('Person','Fizička osoba')};
   for(const [key,en,cr] of fields)text(tr(en,cr)+': '+(['registrationType','payingAs'].includes(key)?labels[r[key]]||'—':r[key]||'—'));
   text(tr('Paper status: ','Status rada: ')+(s.status||'—'));
   text(tr('Fee waiver status: ','Status oslobođenja od kotizacije: ')+(r.registrationType==='par'?(s.feeStatus||'pending'):tr('Not requested','Nije zatraženo')));
   text(tr('Terms accepted: ','Uvjeti prihvaćeni: ')+(r.termsAccepted?tr('Yes','Da'):'—'));
   text(tr('Abstract','Sažetak'),13);text(s.abstract);
   text(tr('Full paper link','Poveznica na cjeloviti rad'),12);text(s.paperUrl||tr('Not supplied','Nije dostavljena'),9,muted);
 }
 return pdf.save();
}
