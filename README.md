# PILC 2027 · Participant portal

Dvojezični portal (EN/HR), responzivan za mobitel i računalo, sa svijetlom i tamnom temom. Zadano: EN + light. Prijava je na `index.html`; nakon odobrenja otvara se početna. Podstranice koriste hash navigaciju, pa rade na GitHub Pages bez preusmjeravanja.

## Što radi

- Firebase Authentication: e-mail/lozinka, registracija, potvrda e-maila, reset lozinke, opcija pamćenja prijave, odjava.
- Novi korisnik uvijek dobiva `role: guest` i `status: pending`. Odabrana uloga izlagača je samo zahtjev. Administrator odobrava pristup i dodjeljuje uloge.
- Firestore i Storage pravila provjeravaju ovlasti neovisno o prikazu stranice.
- Profil: ime, prezime, titula, ustanova; digitalna akreditacija s automatskim podacima i PDF preuzimanjem.
- Automatske PDF potvrde: administrator učita predložak i odredi položaj imena. Za svakog sudionika umeću se ime i prezime iz profila. Podržani su hrvatski znakovi.
- Konačna potvrda dostupna je od **21. 3. 2027. u 00:00 po vremenu Zagreba**, samo uz odobren račun, potvrđen e-mail, evidentiranu prisutnost i objavljen predložak. Storage provjerava vrijeme poslužitelja. Demo potvrda dostupna je ranije, vidljivo označena kao neslužbena.
- Admin: odobrenje/ukidanje pristupa, dodjela uloga, prisutnost, pretraživanje sudionika, unos/uređivanje/brisanje sesija i izlagača, pregled radova, postavke potvrda.
- Program: demo satnica i primjeri panela; administratori mogu učitati demo u bazu i urediti ga ili unositi vlastiti raspored.
- Predaja radova: PDF do 10 MB, naslov, autori, sažetak. Samo odobreni izlagači i administratori. Izmjena rada vraća status na pregled.

## 1. Postavite Firebase

Projekt je `pilc2027`. Web konfiguracija je već unesena u `src/config.js`. Firebase web API ključ nije administratorska tajna; zaštita podataka ovisi o pravilima.

1. U [Firebase konzoli](https://console.firebase.google.com/project/pilc2027/overview) uključite **Authentication → Sign-in method → Email/Password**.
2. U **Authentication → Settings → Authorized domains** dodajte `pilc2027.github.io`, a za lokalni pregled i `localhost` te `127.0.0.1`.
3. Napravite **Cloud Firestore Standard** bazu `(default)` u zaključanom načinu. Aplikacija koristi Firestore, **ne Realtime Database**.
4. Uključite **Cloud Storage**, bucket `pilc2027.firebasestorage.app`. Firebase može tražiti aktivaciju naplate za Storage; to treba postaviti vlasnik projekta.
5. Objavite pravila iz `firestore.rules` i `storage.rules` u odgovarajućim Rules karticama konzole, ili prijavljeni vlasnik projekta može pokrenuti:

   ```powershell
   npm ci
   npx firebase login
   npx firebase deploy --only firestore:rules,storage --project pilc2027
   ```

   Storage pravila čitaju Firestore profile. Ako Firebase zatraži omogućavanje ovlasti za povezivanje Storage i Firestore, prihvatite to u konzoli. Za eventualni Realtime Database priložen je `database.rules.json` koji odbija sav pristup; aplikacija ga ne koristi.

6. Za preuzimanje PDF-ova kroz SDK postavite CORS na bucketu (Cloud Shell ili računalo s prijavljenim Google Cloud CLI-jem):

   ```sh
   gcloud storage buckets update gs://pilc2027.firebasestorage.app --cors-file=storage-cors.json
   ```

   CORS uključuje GitHub Pages domenu i lokalni pregled. Za drugu domenu ažurirajte datoteku. Ne koriste se trajne javne download poveznice koje bi zaobišle vremensko zaključavanje.

7. Uredite predloške Firebase e-mailova za potvrdu računa i reset lozinke, naziv pošiljatelja i podršku. Preporučena minimalna lozinka: 8 znakova. Predložak poruke konfigurira se u Firebase konzoli; aplikacija ne šalje obavijesti o odobrenju računa.

## 2. Prvi administrator

1. Registrirajte vlastiti račun putem stranice i potvrdite e-mail.
2. U **Authentication → Users** pronađite svoj UID.
3. U **Firestore → users → taj UID** promijenite samo `role` u `admin` i `status` u `approved`. Polja su stringovi. Ostatak profila već je nastao registracijom.
4. Osvježite status na stranici ili se ponovno prijavite. Pojavljuje se navigacijska stavka **Admin**.

Prvi admin postavlja se isključivo u konzoli vlasnika projekta. Nema ugrađenih lozinki, javnog admin e-maila ni mogućnosti samostalne dodjele admin uloge. Administrator kroz portal ne može ukinuti vlastitu ulogu. Nakon dodjele admin uloge drugom korisniku njegov račun i e-mail također moraju biti odobreni/potvrđeni.

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

Testovi pravila traže Java 21+ na PATH-u. Koriste izolirani `demo-pilc` emulator, ne produkciju. UI testovi koriste zasebni API samo unutar testnog preglednika, a završni smoke test učitava produkcijski Firebase SDK. Provjeravaju forme, čekanje odobrenja, uloge, radove, admin uređivanje, PDF preuzimanje, oba jezika/teme i širine 390/1440 px. Rezultati i snimke su u ignoriranoj `tests/generated/` mapi.

**Granica provjere:** lokalni UI i Firebase pravila provjereni su odvojeno. Produkcijska registracija, dostava e-mailova i Storage CORS ne mogu biti potvrđeni bez postavljanja projekta i stvarnog korisničkog računa. Pravila nisu automatski objavljena u produkciju.

## Potvrde — kako koristiti

1. **Admin → Certificates** nudi prazan ogledni PDF predložak u PILC bojama i personalizirani demo. Demo uvijek nosi oznaku `DEMO`.
2. Za službeno izdavanje učitajte odobreni PDF s praznom crtom za ime. Koristite obični, nešifrirani PDF. Službeni potpis organizatora, ako treba, mora biti dio predloška.
3. X je centar imena od lijevog ruba; Y je osnovna crta teksta od gornjeg ruba. Obje vrijednosti su postotci stranice. Zadano X=50, Y=51, slova 30 pt, prilagođeno demo predlošku. Duga imena automatski se smanjuju.
4. **Preview with my name** daje neslužbeni pregled trenutačnog predloška i koordinata prije spremanja.
5. Spremite i uključite objavu; u popisu sudionika potvrdite stvarnu prisutnost. Nakon datuma otključavanja svaki sudionik preuzima svoj PDF.

Umetanje imena je na prvoj stranici; ostale stranice zadržavaju se. To je personalizacija dokumenta, a ne kriptografski potpis ili sustav provjere vjerodostojnosti. Ime dolazi iz profila i korisnik ga može urediti. Ako trebate pravno/verifikacijski strogo izdavanje s nepromjenjivim podacima, potreban je zaseban poslužiteljski sustav izdavanja.

## Sadržaj i izvori

- Novi PILC 2027 logotip je korisnikova dostavljena slika; nije nacrtan novi logo.
- Potvrđeni slogan i datum: dostavljene poruke i vizuali (18.–20. 3. 2027., WHERE LEADERS MEET FUTURE LEADERS).
- [Postojeća PILC stranica](https://par-conference.com/) i [About PILC](https://par-conference.com/about-us/), uz dva dostavljena PDF-a: struktura i sadržaj o konferenciji. Na starom webu postoji drukčiji slogan; nije prenesen.
- Nazivi triju tematskih panela i alumni razgovora u demo programu temelje se na postojećoj stranici. Njihove satnice i raspored po danima su **ogledni**, ne potvrđeni.
- [Fotografija hotela s postojeće PILC stranice](https://par-conference.com/wp-content/uploads/2026/01/hotel-hilt-landing-1536x737.png) koristi se kao zasebna fotografija, a ne kao zalijepljena pozivnica.
- [Arhivska fotografija PILC 2023](https://par-conference.com/wp-content/uploads/2023/06/Konferencija-PAR-PILC-2023-1-1024x682.jpg) jasno je označena godinom. Nije predstavljena kao fotografija 2027. godine.
- Referenca za preglednu strukturu profila i digitalne akreditacije: [Web Summit attendee app](https://websummit.com/blog/how-to/mobile-app-tech-event-guide-tickets/).
- [Firebase rules](https://firebase.google.com/docs/rules), [testiranje pravila](https://firebase.google.com/docs/firestore/security/test-rules-emulator), [preuzimanje datoteka i CORS](https://firebase.google.com/docs/storage/web/download-files).
- Noto Sans i Lato koriste SIL Open Font License; licence su u `assets/`. Za PDF se koristi statični Lato radi ispravnog prikaza hrvatskih znakova.

## Prije javnog otvaranja registracija

Organizator treba potvrditi konačne rokove i upute za radove, satnicu, izlagače i fotografije, sponzore/pakete, službeni predložak potvrde te obavijest o privatnosti s rokovima čuvanja podataka. Te stavke nisu izmišljene ili prikazane kao potvrđene. Nema uključene analitike, newsletter prijave ni plaćanja. Cijene sponzorstava nisu objavljene jer se dostavljeni izvori razlikuju.
