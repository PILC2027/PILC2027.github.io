# Integracija stare stranice — odgođeno

Datum: 19. studenoga 2026. Korisnik je zatražio da se nalazi sačuvaju za kasnije; ne uključivati plaćanje ili slanje poruka samo na temelju ovog plana.

## Izvori i potvrđeni nalazi

- Lokalna kopija WordPress datoteka: `D:/public_html`.
- Lokalni SQL backup: `D:/parconference__1013.sql`, baza navedena u konfiguraciji stare stranice. Backupi mogu sadržavati osobne podatke i tajne: ne dodavati ih u Git ni javne pakete.
- Aktivni Contact Form 7 i SMTP Mailer. WooCommerce nije na popisu aktivnih dodataka; pregledane tablice order_items i wpforms_payments nemaju zapisa. To nije dokaz da nikada nije bilo drugih načina naplate.
- Autorski obrazac 4404: podaci autora i ustanove, adresa, grad, države, VAT/OIB, kontakt prvog autora, paket, naslov rada, ključne riječi, sažetak, osoba/ustanova kao platitelj i prihvaćanje uvjeta.
- Aktivna poruka obrasca 4404 šalje potvrdu prijavitelju i organizatorima (conference@par.hr), podatke prijave, iznos i upute za bankovnu uplatu. Traži slanje potvrde uplate organizatorima. Navodi Veleučilište PAR kao primatelja.
- Pojedini gostujući obrasci (npr. 7852, 7882) navode PAR d.o.o. i drugačiji račun. Postoje studentske/PAR studentske opcije i stari promo kodovi. Ne prenositi stare kodove niti automatski uključivati stare tarife.
- Neki gostujući obrasci računaju 100 EUR + PDV = 125 EUR; za novu aplikaciju korisnik je prethodno naveo 100 EUR. Potrebna potvrda konačne cijene.
- Rane autorske cijene u obrascu 4404: 240/370/480 EUR. Druge povijesne varijante imaju drukčije iznose. Rokovi i predmeti poruka još sadrže 2026. i nisu važeća potvrda za 2027.
- Obrazac 5519 razlikuje sažetak/cijeli rad i dopušta DOC/DOCX/PDF do 2 MB.
- Autorska poruka referencira `uploads/2023/10/Template.docx`; provjeriti sadržaj i aktualnost dokumenta prije prijenosa.
- Postoje stranice privacy-policy i guidelines-for-formatting-papers te smještaj, odbori, pokrovitelji, arhiva i novosti. Njihov sadržaj treba pregledati i odabrati što vrijedi za 2027.

## Predloženi redoslijed integracije

1. Usporediti postojeća polja i ponašanje nove aplikacije s obrascima; zadržati aktualni sustav računa, odobrenja, jednokratnih popusta i admin pregleda. Ne vraćati stare javne prijave ili ograničenja broja riječi u imenima/državama.
2. Prenijeti provjerene upute, predložak i sadržaj privatnosti na vlastite putanje. Osigurati da stare poveznice rade i nakon uklanjanja WordPressa; ne kopirati zastarjele datume, cijene i pravne tvrdnje bez provjere.
3. Nakon potvrde primatelja i cijena napraviti konfiguraciju kotizacija za 2027: primatelj po vrsti prijave, PDV, valjana tarifa, popust i konačan iznos. Iznos računati i provjeravati na poslužitelju, sačuvati izračun uz prijavu. Za 100% popusta ne slati zahtjev za uplatu.
4. Dodati hrvatske i engleske predloške potvrde prijave/uputa za uplatu, uz pregled prije aktivacije. Prijava, odobrenje sudjelovanja i evidentirana uplata moraju ostati odvojena stanja; potvrda prijave ne znači potvrdu plaćanja.
5. Slanje preko zaštićenog serverskog dijela i SMTP-a (ne izravno iz preglednika). Lozinke držati izvan javnog direktorija i Gita. Provjeravati identitet i vlasništvo prijave, spriječiti ponovljeno slanje, imati evidenciju uspjeha/pogreške i mogućnost ponavljanja. SMTP host je ranije dostavljen kao mail.par-conference.com, port 465 TLS, račun info@par-conference.com; pristup i isporuku tek provjeriti. Ne koristiti glavnu cPanel lozinku.
6. Ako se odabere izravni upload rada: privatna pohrana izvan javnog direktorija, ograničenje veličine i tipa, serverska provjera sadržaja, kontrolirani download za vlasnika/admina. Zasad postojeći HTTPS link ostaje važeći način predaje; upload je zasebna odluka.
7. Admin evidencija uplate i izvještaji: odvojiti ručnu potvrdu uplate od prihvaćanja rada; audit promjena i obračun popusta. Bez automatskog označavanja uplate na osnovi poslane potvrde ili uspješne e-poruke.
8. Testirati HR/EN, sve pakete i popuste (uključujući 100%), neuspjelo slanje, dvostruki submit i neovlašteni pristup. Stvarno slanje poruka uključiti tek nakon konfiguracije i dogovorenog testa.

## Otvorene odluke

- Primatelji i IBAN-i za autore/goste 2027: ostaju li različiti?
- Je li 100 EUR konačno s PDV-om ili osnovica?
- Potvrđene autorske tarife, razdoblje ranih prijava i rokovi za 2027.
- Koje studentske opcije treba uključiti?
- Aktualnost predloška, pravila privatnosti i uvjeta.
- Termin i opseg migracije Firebasea na PHP/MariaDB; trenutno nova aplikacija još koristi Firebase.

## Objavljivanje

Automatski FTPS GitHub Actions workflow uklonjen je 19. studenoga 2026. (commit de44610) nakon ponovljenih timeouta. Ne vraćati ga bez zahtjeva/rješenja pristupa. GitHub ostaje repozitorij koda. Glavna domena još nije zamijenjena u okviru ovog pregleda. Sačuvati staru stranicu i bazu, provjeriti novu na glavnoj domeni i tek zatim ukloniti testnu domenu. Deployment paketi smiju sadržavati samo javne datoteke aplikacije, nikad SQL ili WordPress konfiguraciju.


## Implementirano nakon korisnikova zahtjeva 19. studenoga

- Jedan postojeći obrazac/prijava po korisniku; nema nove kolekcije ni paralelnog sustava prijava.
- HR/EN sažetak spremljene prijave za preuzimanje, bez tvrdnje da je račun, potvrda uplate ili prihvaćanje rada.
- Admin preuzima HR/EN tekstualni nacrt potvrde iz postojećih podataka. Ne šalje e-poštu i ne obećava slanje; nije zamjena za SMTP integraciju.
- Javna lokalna stranica paper-guidelines objašnjava aktualni tijek predaje i dopune iste prijave. Pravila za 2027. nisu izmišljena.
- Poveznica iz autorskog obrasca vodi na postojeću lokalnu obavijest o privatnosti, umjesto nestajućeg WordPress URL-a. Ne tvrdi da nepotvrđena obavijest predstavlja konačne uvjete poslovanja.
- Statička preusmjeravanja za stare privacy-policy, guidelines-for-formatting-papers, participation, paper-submission i participation-plans URL-ove.
- Stari javni tekstovi sačuvani su u docs/legacy-*.txt samo za urednički pregled; ne uključuju se u paket za hosting niti prikazuju kao aktualna pravila.
- scripts/package-site.py pakira samo javne datoteke i preusmjeravanja s ispravnim dozvolama. --test dodaje noindex. SQL, postavke poslužitelja i docs nisu u paketu.

Još NIJE aktivirano: automatsko slanje e-pošte, bankovni podaci i obračun PDV-a za 2027., evidencija stvarnih uplata, studentski paketi, upload datoteka i migracija baze. Potrebni su organizatorski odgovori i konfiguracija poslužitelja. Ne zamjenjivati produkcijsku stranicu dok ti zahtjevi za otvaranje prijava nisu razriješeni.


## Potvrde iz maila 20. studenoga 2026. i provedene izmjene

Ove potvrde zamjenjuju ranije otvorena pitanja o datumima i cijenama:
- PILC konferencija 18.–20. ožujka; ALA prikaz ostaje 16.–20.
- Registracija sudionika javno pokazuje dvije podopcije i cijene; račun se traži tek nakon odabira paketa. Predaja ostaje dostupna odobrenim računima.
- Gost 200 EUR + PDV rano / 250 EUR + PDV redovno. Autori 290/420/530 rano, 340/470/580 redovno, bez dodatnog PDV-a. Rana prijava do 1. veljače 2027. (u aplikaciji uključivo, Europe/Zagreb).
- Studenti 50% primjenjive kotizacije; PAR studenti i predavači besplatno. Koristi se postojeći provjereni sustav individualnih kodova, bez samostalnog dodjeljivanja popusta i bez novog paralelnog registra.
- Dosadašnji primatelji/računi potvrđeni zasad: Veleučilište PAR za autore, PAR d.o.o. za goste. Ne slati automatske zahtjeve za uplatu dok komunikacija i poslužitelj nisu potvrđeni.
- Sažetak do 19. veljače 2027.; cijeli rad do 30. travnja. Ne objavljivati rok prihvaćanja, prema izričitom mailu, iako ga prilog spominje.
- Objavljeno svih 20 panela po pet cjelina na HR/EN, bez izmišljanja satnice, dvorana ili govornika.
- Nove lokalne HR/EN upute, 200–250 riječi, 3–6 ključnih riječi, 2–3 JEL oznake i kategorija; naslov najviše 15 riječi. Nove prijave pohranjuju kategoriju/JEL u postojećem dokumentu. Pravila zadržavaju kompatibilnost sa starim zapisima bez tih polja.
- Službena predaja: .docx sažetak jednom datotekom; cijeli rad naslovnom stranicom i anonimiziranim rukopisom na conference@par.hr. Programski odbor e-mailom potvrđuje primitak. Portal ne predstavlja spremanje obrasca kao tu potvrdu.
- Prije uploada novog ZIP-a objaviti ažurirani firestore.rules. Pravila nisu automatski objavljena na Firebase.
- Još čekamo potvrdu slanja s info@par-conference.com i konačne uvjete/privatnost. Nema aktivnog SMTP-a, kartične naplate ni migracije baze.
