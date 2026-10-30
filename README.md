# PILC 2027 · Participant portal

Dvojezični portal (EN/HR), responzivan za mobitel i računalo, sa svijetlom i tamnom temom. Zadano: EN + light. Prijava je na `index.html`; nakon odobrenja otvara se početna. Podstranice koriste hash navigaciju, pa rade na GitHub Pages bez preusmjeravanja.

## Što radi

- Firebase Authentication: e-mail/lozinka, registracija, reset lozinke, opcija pamćenja prijave, odjava.
- Novi korisnik uvijek dobiva `role: guest` i `status: pending`. Odabrana uloga izlagača je samo zahtjev. Administrator odobrava pristup i dodjeljuje uloge.
- Firestore pravila provjeravaju ovlasti neovisno o prikazu stranice.
- Profil: ime, prezime, titula, ustanova; digitalna akreditacija s automatskim podacima i PDF preuzimanjem.
- Automatske PDF potvrde: administrator doda predložak u repozitorij i odredi položaj imena. Za svakog sudionika umeću se ime i prezime iz profila. Podržani su hrvatski znakovi.
- Konačna potvrda dostupna je od **21. 3. 2027. u 00:00 po vremenu Zagreba**, samo uz odobren račun, evidentiranu prisutnost i objavljen predložak. Datum provjerava aplikacija. Prazan predložak na GitHub Pagesu je javan; ovo nije poslužiteljska zaštita javne datoteke. Demo potvrda dostupna je ranije, vidljivo označena kao neslužbena.
- Admin: odobrenje/ukidanje pristupa, dodjela uloga, prisutnost, pretraživanje sudionika, unos/uređivanje/brisanje sesija i izlagača, pregled radova, postavke potvrda.
- Program: demo satnica i primjeri panela; administratori mogu učitati demo u bazu i urediti ga ili unositi vlastiti raspored.
- Predaja radova: HTTPS poveznica na PDF, naslov, autori, sažetak. Autor omogućuje pristup datoteci organizatoru (conference@par.hr). Portal ne prima datoteke; pohranjuje poveznicu. Samo odobreni izlagači i administratori. Izmjena rada vraća status na pregled.

## 1. Postavite Firebase

Projekt je `pilc2027`. Web konfiguracija je već unesena u `src/config.js`. Firebase web API ključ nije administratorska tajna; zaštita podataka ovisi o pravilima.

1. U [Firebase konzoli](https://console.firebase.google.com/project/pilc2027/overview) uključite **Authentication → Sign-in method → Email/Password**.
2. U **Authentication → Settings → Authorized domains** dodajte `pilc2027.github.io`, a za lokalni pregled i `localhost` te `127.0.0.1`.
3. Napravite **Cloud Firestore Standard** bazu `(default)` u zaključanom načinu. Aplikacija koristi Firestore, **ne Realtime Database**.
4. Objavite pravila iz `firestore.rules` u **Firestore → Rules**, ili prijavljeni vlasnik projekta može pokrenuti:

   ```powershell
   npm ci
   npx firebase login
   npx firebase deploy --only firestore:rules --project pilc2027
   ```

5. Uredite Firebase e-mail za reset lozinke. Registracija ne šalje potvrdu e-maila; dovoljno je administratorsko odobrenje.

**Firebase Storage nije potreban i aplikacija ga ne koristi.** Nema Storage pravila, CORS postavljanja ni uploada datoteka. Firebase Auth i Firestore ostaju za račune, sadržaj i ovlasti; njihove kvote i uvjeti i dalje vrijede.

## 2. Prvi administrator

1. Registrirajte vlastiti račun putem stranice.
2. U **Authentication → Users** pronađite svoj UID.
3. U **Firestore → users → taj UID** promijenite samo `role` u `admin` i `status` u `approved`. Polja su stringovi. Ostatak profila već je nastao registracijom.
4. Osvježite status na stranici ili se ponovno prijavite. Pojavljuje se navigacijska stavka **Admin**.

Prvi admin postavlja se isključivo u konzoli vlasnika projekta. Nema ugrađenih lozinki, javnog admin e-maila ni mogućnosti samostalne dodjele admin uloge. Administrator kroz portal ne može ukinuti vlastitu ulogu. Nakon dodjele admin uloge drugom korisniku njegov račun također mora imati status `approved`. Potvrda e-maila nije uvjet pristupa.

## 3. GitHub Pages

Gotovi `index.html`, `assets/app.js` i ostale datoteke već su u korijenu. Za objavu nije potreban server ni build na GitHubu:

1. Pushajte ovu mapu u repozitorij.
2. **Settings → Pages → Deploy from a branch → vaša grana → /(root)**.
3. Otvorite `https://pilc2027.github.io`.

Nakon izmjene JavaScripta u `src/`, pokrenite `npm run build` i uključite izmijenjeni `assets/app.js` u commit. CSS se uređuje direktno u `assets/styles.css`. `.nojekyll` je uključen. U produkcijski bundle ne ulaze testni računi niti mock API.

## Lokalni rad i provjere

```sh
npm ci
npm run build
npm run dev
```

Otvorite `http://127.0.0.1:4173`. Nemojte otvarati HTML preko `file://`.

```sh
npx playwright install chromium
npm test
npm run test:rules
```

Testovi pravila traže Java 21+ na PATH-u. Koriste izolirani `demo-pilc` emulator, ne produkciju. UI testovi koriste zasebni API samo unutar testnog preglednika, a završni smoke test učitava produkcijski Firebase SDK. Provjeravaju forme, čekanje odobrenja, uloge, radove, admin uređivanje, predaju poveznica, PDF preuzimanje, oba jezika/teme i širine 390/1440 px. Rezultati i snimke su u ignoriranoj `tests/generated/` mapi.

**Granica provjere:** lokalni UI i Firebase pravila provjereni su odvojeno. Produkcijska registracija, dostava e-mailova za reset lozinke ne mogu biti potvrđeni bez postavljanja projekta i stvarnog korisničkog računa. Pravila nisu automatski objavljena u produkciju.

## PDF-ovi na GitHub Pagesu

- Ogledni prazan PDF već je u `assets/documents/certificate-demo.pdf`, s oznakom DEMO.
- Gotovi osobni PDF-ovi **ne spremaju se u GitHub ni Firebase**; stvaraju se i preuzimaju u pregledniku.
- Za službeni predložak stavite PDF s praznom crtom za ime u `assets/documents/certificate-template.pdf`, commitajte/pushajte i pričekajte objavu GitHub Pagesa.
- **Admin → Certificates → Template path**: unesite `assets/documents/certificate-template.pdf`. Naziv datoteke smije sadržavati slova bez dijakritike, brojeve, `_` i `-`. PDF do 10 MB, nešifriran.
- X je centar imena od lijevog ruba; Y je osnovna crta teksta od gornjeg ruba, u postotcima. Zadano X=50, Y=51 i 30 pt odgovara demo predlošku. Duga imena automatski se smanjuju.
- **Preview with my name** provjerava PDF i prikazuje primjer s vašim imenom prije spremanja postavki. Naziv/putanja i postavke spremaju se u Firestore; PDF se učitava sa stranice.
- Spremite i uključite objavu, evidentirajte prisutnost sudionika. Aplikacija prikazuje gumb za službenu potvrdu tek od 21. 3. 2027. i uz odobren račun/potvrđenu prisutnost.

**Važno za ovaj način hostanja:** sve datoteke na GitHub Pagesu su javne, uključujući prazan predložak. Datum zaključava gumb unutar aplikacije, ne pristup javnom PDF-u. Ne stavljajte privatne radove ili osobne potvrde u repozitorij. Personalizacija nije digitalni potpis niti sustav provjere autentičnosti.

## Radovi bez uploada

Izlagač unosi naslov, autore, sažetak i HTTPS poveznicu na PDF na svom Driveu, OneDriveu ili drugom spremištu. Treba omogućiti pristup `conference@par.hr`. Poveznicu u portalu mogu vidjeti samo autor i administratori, dok pristup samoj datoteci određuje njezin pružatelj. Administrator otvara poveznicu i postavlja status pregleda. GitHub Pages ne prima privatne uploadove iz korisničkih obrazaca.

Ako su radovi ranije bili predani putem Storagea, autor treba ponovno predati poveznicu. Stare datoteke u Firebase projektu ne brišu se ovom izmjenom; aplikacija ih više ne dohvaća.

## Sadržaj i izvori

- Novi PILC 2027 logotip je korisnikova dostavljena slika; nije nacrtan novi logo.
- Potvrđeni slogan i datum: dostavljene poruke i vizuali (18.–20. 3. 2027., WHERE LEADERS MEET FUTURE LEADERS).
- [Postojeća PILC stranica](https://par-conference.com/) i [About PILC](https://par-conference.com/about-us/), uz dva dostavljena PDF-a: struktura i sadržaj o konferenciji. Na starom webu postoji drukčiji slogan; nije prenesen.
- Nazivi triju tematskih panela i alumni razgovora u demo programu temelje se na postojećoj stranici. Njihove satnice i raspored po danima su **ogledni**, ne potvrđeni.
- [Fotografija hotela s postojeće PILC stranice](https://par-conference.com/wp-content/uploads/2026/01/hotel-hilt-landing-1536x737.png) koristi se kao zasebna fotografija, a ne kao zalijepljena pozivnica.
- [Arhivska fotografija PILC 2023](https://par-conference.com/wp-content/uploads/2023/06/Konferencija-PAR-PILC-2023-1-1024x682.jpg) jasno je označena godinom. Nije predstavljena kao fotografija 2027. godine.
- Referenca za preglednu strukturu profila i digitalne akreditacije: [Web Summit attendee app](https://websummit.com/blog/how-to/mobile-app-tech-event-guide-tickets/).
- [Firebase rules](https://firebase.google.com/docs/rules), [testiranje pravila](https://firebase.google.com/docs/firestore/security/test-rules-emulator).
- Noto Sans i Lato koriste SIL Open Font License; licence su u `assets/`. Za PDF se koristi statični Lato radi ispravnog prikaza hrvatskih znakova.

## Prije javnog otvaranja registracija

Organizator treba potvrditi konačne rokove i upute za radove, satnicu, izlagače i fotografije, sponzore/pakete, službeni predložak potvrde te obavijest o privatnosti s rokovima čuvanja podataka. Te stavke nisu izmišljene ili prikazane kao potvrđene. Nema uključene analitike, newsletter prijave ni plaćanja. Cijene sponzorstava nisu objavljene jer se dostavljeni izvori razlikuju.
