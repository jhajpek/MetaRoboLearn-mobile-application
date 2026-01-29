# MetaRoboLearn mobilna aplikacija

Repozitorij predstavlja razvoj mobilne aplikacije za upravljanje ROS2 robotom pomoću pametnog telefona.<br/>
Projekt je razvijen u **React Native** radnom okviru i podržava više načina upravljanja robotom.<br/>
Osim toga, aplikacija je podržana i na Android i iOS uređajima.

---

## Funkcionalni zahtjevi

* Korisničke upute i intuitivnost korištenja aplikacije
* Slanje naredbi za pokret i zaustavljanje robota
* Upravljanje robotom nagibom uređaja
* Detekcija pada uređaja
* Prikaz emitiranja s kamere robota

---

## Nefunkcionalni zahtjevi

* Odziv robota na slanje naredbe za pokretanje mora biti unutar jedne sekunde
* Odziv robota na slanje naredbe za zaustavljanje mora biti unutar jedne sekunde
* Količina uzastopno poslanih naredbi ne utječe na kvalitetu upravljanja robotom

---

## Ustroj aplikacije

Aplikacija je zamišljena kao **izbornik igara**, pri čemu svaka igra uz kontroler pruža i dodatnu vrstu interakcije s robotom.<br/>
Ovisno o odabranoj igri, korisniku se prikazuje pripadajući kontroler kojem se dinamički nadodaju dodatne značajke.

---

## Git grane

Repozitorij sadrži **dvije glavne implementacije upravljanja robotom**:

### ◉ `button-version` grana
Prva verzija aplikacije koja koristi klasične gumbove za upravljanje robotom.

**Značajke:**
* početna i jednostavna implementacija
* gumbovi za kretanje unaprijed, unazad, ulijevo, udesno
* gumb za bezuvjetno zaustavljanje robota
* manualna modifikacija parametara brzine i trajanja izvođenja kretnje
* skretanje ulijevo i udesno nagibom mobilnog uređaja uz uključenu opciju `Žiroskop`
* prikaz slike s kamere robota preko protokola WebSocket
* unit testiranje komponenti

### 🕹️ `thumbstick-version` grana
Druga verzija aplikacije koja koristi **virtualni thumbstick** za kontinuirano upravljanje robotom.

**Značajke:**
* gumbovi za kretanje pretvoreni u jedan pomični gumb
* kontinuirano slanje naredbi za kretanje dok je pomični gumb pomaknut
* promjena vrste naredbe u ovisnosti o položaju pomičnog gumba
* promjena brzine kretanja robota u ovisnosti pomaka gumba od njegovog početnog položaja
* automatsko zaustavljanje robota kada korisnik ispusti prst s gumba
* tzv. 'dead-zone' oko početnog položaja gumba

---

## Lokalno pokretanje

Preduvjeti / instalacije:
* Node.js
* Expo CLI
* paketi iz **package.json**
* mobilna aplikacija Expo Go

Nakon kloniranja željene grane repozitorija, potrebno je pokrenuti:

* `cd \<direktorij u koji je kloniran repozitorij\>`
* `npm install`
* `npm start`

Na ovaj način pokreće se razvojni poslužitelj koji pruža mnoštvo opcija:
* Press a │ open Android
* Press w │ open web
* Press j │ open debugger
* Press r │ reload app
* Press m │ toggle menu
* shift+m │ more tools
* Press o │ open project code in your editor
* QR kod s kojim se kroz Expo Go može testirati aplikacija

---

## Puštanje aplikacije u pogon

Puštanje aplikacije u pogon (deployment) provedeno je nad verzijom button-version korištenjem Expo Application Services (EAS).<br/>
Iako je aplikacija razvijana kao višestruka platforma (Android i iOS), u okviru ovog projekta izrađena je isključivo Android verzija.<br/>
iOS verzija aplikacije u razvojnom okruženju ima određena ograničenja vezana uz distribuciju i instalaciju aplikacije izvan App Storea.

Preduvjeti / instalacije:
* globalno instaliran eas-cli
* Expo račun

Ako preduvjeti nisu zadovoljeni, potrebno je pokrenuti:
* `npm install -g eas-cli`
* `eas login`

Nakon toga, potrebno je pokrenuti:
* `eas build:configure` (ovdje odabrati platformu Android)
* `eas build -p android --profile preview`

Rezultat ovog procesa je .apk datoteka koja se može ručno instalirati na Android uređaje.

---

## Varijable okruženja

* BACKEND_URL=http://<BACKEND_IP_ADDRESS>
* BACKEND_PORT=\<PORT\>

U produkciji dodati još:
* PROJECT_ID=<EXPO_PROJECT_ID>

---

## Nastavak projekta
* dotjerivanje responzivnosti thumbstick kontrolera
* korištenje prepoznavanja objekata i displayja u igrama
* prelazak s WebSocketa na drugi način emitiranja s kamere robota
