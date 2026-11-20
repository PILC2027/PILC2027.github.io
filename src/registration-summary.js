// Uses existing registration records; no duplicate storage or payment state.
export function registrationSummary(record, kind, lang='en', claim=null) {
 const hr=lang==='hr', t=(en,cr)=>hr?cr:en, r=record.registration||{}, author=kind==='submissions';
 const labels={one:t('1 author','1 autor'),two:t('2 authors','2 autora'),three:t('3+ authors','3+ autora'),par:t('PAR fee waiver request','Zahtjev za PAR oslobođenje'),standard:t('Standard guest','Standardni gost'),company:t('Company / institution','Tvrtka / ustanova'),person:t('Person','Fizička osoba')};
 const lines=['PILC 2027',t('Registration summary','Sažetak prijave'),'',t('This confirms the portal registration only, not payment or acceptance.','Ovo je sažetak prijave u portalu, a ne potvrda uplate ili prihvaćanja.'),''];
 const add=(en,cr,value)=>{if(value)lines.push(t(en,cr)+': '+value);};
 add('Name / authors','Ime / autori',author?record.authors:record.name);
 add('Institution','Ustanova',author?r.institution:record.institution);
 add('Email','E-mail',author?r.contactEmail:record.email);
 add('Package','Paket',labels[author?r.registrationType:record.plan]);
 if(author){lines.push(t('Email the abstract as one .docx file and the full paper as two files (title page and anonymised manuscript) to conference@par.hr. The Programme Committee confirms receipt by email.','Sažetak pošaljite kao jednu .docx datoteku, a cjeloviti rad kao dvije (naslovna stranica i anonimizirani rukopis), na conference@par.hr. Programski odbor potvrđuje primitak e-poštom.'));for(const [key,en,cr] of [['address','Billing address','Adresa za račun'],['city','City','Grad'],['country','Countries','Države'],['vat','Tax ID','Porezni broj'],['phone','Phone','Telefon']])add(en,cr,r[key]);add('Paying as','Plaćanje kao',labels[r.payingAs]);add('Paper title','Naslov rada',record.title);add('Keywords','Ključne riječi',r.keywords);add('Paper category','Kategorija rada',r.paperCategory);add('JEL','JEL',r.jelCodes);add('Abstract','Sažetak',record.abstract);add('Paper link','Poveznica na rad',record.paperUrl);}
 if(claim?.target===kind){add('Discount code','Kod popusta',claim.code);add('Discount','Popust',claim.percent+'%');}
 lines.push('',t('The organising team will confirm the applicable fee and payment instructions. No payment is processed by this form.','Organizacijski tim potvrdit će primjenjivu kotizaciju i upute za uplatu. Ovim obrascem ne provodi se naplata.'),'conference@par.hr');
 return lines.join('\n');
}
export function confirmationDraft(record,kind,lang='en',claim=null){
 const hr=lang==='hr';
 return (hr?'Poštovani,\n\nhvala na prijavi za PILC 2027. Zaprimili smo sljedeće podatke:\n\n':'Dear participant,\n\nThank you for registering for PILC 2027. We have received the following details:\n\n')+registrationSummary(record,kind,lang,claim)+(hr?'\n\nSrdačan pozdrav,\nOrganizacijski tim PILC 2027':'\n\nKind regards,\nPILC 2027 organising team');
}
