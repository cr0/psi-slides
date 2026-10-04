# Migration des Forks auf psi-slides 2.0.0

## Status

**Stand 04.10.2026, 11:00.** Die geplante Aufgabe von 03:00 hat nichts
ausgeführt; die Migration lief ab 10:40 in der Engine-Session, Sonnet-Agenten
haben ausgeführt, die Session hat überwacht.

Erledigt, auf `migrate/2.0.0` im Worktree `.worktrees/migrate-2.0.0`:

- `main` steht auf v2.0.0 (`d56bd35`), Tag `pre-2.0.0` auf `styling/showcase`
  (`eb9ebaf`).
- Merge: alle 18 Konfliktdateien gelöst, getrackte Views neu gebaut.
  **Noch nicht committet** – die Commit-Signatur (SSH über 1Password) ist aus
  der Sandbox nicht erreichbar.
- `npm run gate`: 2099 bestanden, 0 fehlgeschlagen, 1 pending
  (`--shadow-rest` bei `body-scale 1.8`, im Fork-Changelog schon als
  „recorded, not fixed" geführt). `node lint.js lectures/ --strict`: 19
  Dateien, 0 Fehler, 0 Warnungen. Desktop-Staging-Test 5 von 5.
- Kurskorpus (39 Quellen und `example.md`), gelintet und in Kopien gebaut:
  zwei erzwungene Quelländerungen (Logo-Pfad in allen 39; `style:
  {neighbours}` in CYS t00 und t01), danach Exit 0 überall, gleiche
  Chunk- und Schrittzahlen, gleiche Lint-Warnungen wie vorher.
- Über die Konflikte hinaus geändert: Rahmen-ids `psiINT-frame` /
  `psiINT-frame-print`; `identity.logo` und `::: recall` durch die Dateiregel
  in Build und Linter; Font Awesome als reguläre Abhängigkeit; `colour.mjs`
  in der gestagten Desktop-Engine.

Nachtrag 11:40 – Browser-Läufe (außerhalb der Sandbox, die den lokalen Port
sperrt):

- `node test/run.mjs`: 1816 bestanden, 1 fehlgeschlagen; der Fehler war ein
  Merge-Rest in `test/auto-fit.mjs` (fehlender `os`-Import, veralteter
  Selektor `#preview-strip`). Behoben; die Spec läuft danach allein mit 21 von
  21. Die ganze Suite ist nach der Korrektur nicht noch einmal gelaufen.
  Die WebKit-Hälften von `figure-edge` und `frame-fade` sind grün.
- `node test/pdf-export.mjs`: 134 von 134. `node test/reproducible.mjs`: 4
  von 4.
- `node test/settings.mjs`: 1258 bestanden, 3 fehlgeschlagen – alle drei an
  der Schlusszeile `[diagram] N figure warning(s) above`: sie zählt jetzt die
  Leinwand-Meldungen von 2.0.0 mit (eine Figur aus zwei Kästen meldet
  `figure-underfills-canvas`). **Entscheidung des Dozenten**, siehe unten.
- Der Fork-Test zu `style: {neighbours}` prüft jetzt die Ablehnung.
- Skills, `CLAUDE.md`, `README.md`, `HANDOFF.md`, Changelog nachgezogen.
  In `PRD.md` außerhalb §2.1 stehen noch alte Zahlen (Zeilen 140, 284, 290,
  292).

Nachtrag 13:00:

- Merge committet (`610f41f`) und als `migrate/2.0.0` nach `origin` gepusht.
  `styling/showcase` unverändert `eb9ebaf`, `origin/main` noch am alten
  Fork-Punkt.
- Browser-Suite nach den Test-Korrekturen: 1822 bestanden, 0 fehlgeschlagen.
  `test/settings.mjs` 1265 von 1265, Desktop 58 von 58.
- **Entschieden (Dozent): Variante A.** Die Schlusszeile
  `[diagram] N figure warning(s) above` zählt nur Zeichenfehler; die
  Leinwand-Meldungen (`figure-overflows-canvas`, `figure-underfills-canvas`,
  `figure-type-small`) und „exposed run" zählen als
  `[diagram] N figure note(s) above` – beides geparste Verträge.
- **Grundsatz (Dozent):** Hat 2.0.0 ein Feature, das der Fork selbst gebaut
  hatte, gilt Upstream.
- **Figuren (Dozent):** kein kursweiter `figure-type`-Wert, keine pauschalen
  Maße. Die Figuren werden in den Kursen als geführte Migration konzepttreu
  nachgezogen (figure-design.md, Regel 11); `frame WxH` / `{.figure-type-N}`
  nur für ein Schaustück, mit Begründung.
- **Befund aus dem Vorher/Nachher (INFSEC t00 `#schedule`, t01
  `#asymmetry`):** 2.0.0 zeichnet bestehende Figuren nicht nur kleiner,
  sondern anders. Regel „Peers share one size": Kästen, die über
  `right of` / `left of` verbunden sind, teilen Breite und Höhe, über
  `below` / `above` die Breite; ein geschriebenes `w` gilt für die ganze
  Kette. Ein Balken, der `below p1 … w 36.8` unter einer Reihe liegt, macht
  damit `p1` so breit wie sich selbst. Mit reinem Upstream 2.0.0 nachgebaut:
  dasselbe Bild, also kein Merge-Fehler. Der Ausweg im Quelltext ist `{.own}`
  am Balken (beendet die Kette) oder `row a, b, c`. Dafür gibt es **keine**
  Meldung der Engine außer der Leinwand-Meldung, die als Folge entsteht.
  Kandidaten sind die 22 Figuren mit geändertem viewBox; das gehört in die
  geführte Figuren-Migration der Kurse.
- Reihenfolge (Dozent): Engine abschließen → Skills-Session finalisiert die
  Skills → nach Abschluss der Migration werden die Veranstaltungen
  umgestellt. `styling/showcase` bewegt sich nach dem Push der Skills und vor
  dem ersten `update.sh`, auf ausdrückliches Wort des Dozenten.
- Der Fork folgt Upstream nur lesend, keine Rückflüsse.

Offen:

- Bewegung von `styling/showcase` (Wort des Dozenten), danach `origin/main`.
- Element-Meldungen (exposed run, lands inside, overlap) nennen keinen Chunk.
- `cwebp` ist auf diesem Rechner defekt (libtiff fehlt).
- `PRD.md` außerhalb §2.1: alte Zahlen (Zeilen 140, 284, 290, 292).

Der Rest dieses Dokuments ist der Plan, wie er vor der Ausführung stand.

## Ausgangslage

- Upstream `UBA-PSI/psi-slides` hat am 02.10.2026 `v2.0.0` veröffentlicht.
- Der Fork zweigt bei `94d6b9d` (16.09.2026) ab; das ist zugleich das lokale
  `main`. `v2.0.0` liegt 457 Commits davor.
- `styling/showcase` trägt 37 eigene Commits (63 mit Merges). Nicht darin:
  `styling/plan` (+1).
- Probe-Merge `styling/showcase` × `v2.0.0`: 18 Dateien im Konflikt.

| Datei | Stellen | Zeilen |
|---|---|---|
| `build.js` | 25 | 851 |
| `lint.js` | 6 | 336 |
| `test/gates/run.mjs`, `corpus.mjs`, `test/run.mjs` | 5 | 109 |
| `diagram-core.mjs`, `editor.mjs`, `package.json` | 3 | 59 |
| `CHANGELOG.md` | 2 | 1051, mechanisch |
| 7 getrackte Views, `package-lock.json` | – | neu erzeugen |

Die Stellen in `build.js` liegen in: `::: recall` (5), `--check-fit` (4),
audience rendering (3), den Wörtern, die der Build selbst schreibt (2), dem
Rahmen aus `identity:` (2), der Annotation (2), und je einmal in postMessage-
Sync, Kamera, Build-Ausgabe, Fullscreen und WebP.

## Wie die Kurse an die Engine kommen – und was daraus folgt

Jeder Kurs (`/Users/cr/Claude/{CNW,INFSEC,CYS,LAB101,FLAGS1337}`) hat die
Engine als Submodul `.claude/skills/psi-slides`, und `update.sh` zieht es mit
`git submodule update --remote --merge` auf **die Spitze von
`styling/showcase`** des Forks. Ein Push auf `styling/showcase` ist also die
Auslieferung an alle Kurse beim nächsten `update.sh`.

Daraus: Die Migration lebt bis zur Freigabe ausschließlich auf
`migrate/2.0.0`. `styling/showcase` bewegt sich genau einmal, am Ende, und
erst wenn der Prüfkorpus gebaut ist und die Quell-Migrationen der
Skills-Session bereitliegen. Geprüft wird vorher mit
`PSI_SLIDES=/Users/cr/Develop/psi-slides` (so findet
`lecture-oth-ci-slides/scripts/engine.mjs` die Engine) auf dem Zweig
`migrate/2.0.0`.

## Das Logo des Hausstils gegen die neue Dateiregel – der härteste Punkt

2.0.0 liest Dateien nur aus dem Ordner der Vorlesung und dem Ordner eine
Ebene darüber, und nie aus einem Ordner, dessen Name mit einem Punkt beginnt.
Der Hausstil setzt `identity: {logo}` auf
`../../.claude/skills/lecture-oth-ci-slides/assets/logo.png`: zwei Ebenen
hoch und in einem Punkt-Ordner – zweifach außerhalb der Regel. In der CI
liegt dasselbe Logo unter `/opt/skills`, außerhalb des Unit-Repos.

**Entschieden** (Dozent am 02.10.2026, in dieser Session bestätigt): Die Sicherheitsregel wird
nicht erweitert – „ich würde nur ungern die Sicherheitsfeatures
manipulieren". Kein Schalter, keine Umgebungsvariable, keine Ausnahme für
`identity: {logo}`.

Stattdessen liegt das Logo als Kopie neben der Quelle (Arbeitsname
`house-logo.png` im Ordner der `source.md`), ist im Kurs per `.gitignore`
ausgenommen und wird nur zum Bauen hingelegt: lokal von den Skills-Skripten,
in der CI vom Job-Skript aus `/opt/skills`.

Für den Merge heißt das:

- `identity.logo` läuft durch `resolveAssetUrl` und bekommt dort die normale
  Dateiregel von 2.0.0, ohne Sonderfall.
- Ein bloßer Dateiname mit Endung neben der `source.md` genügt: er gilt nicht
  als Kurzform, wird relativ zum Quellordner aufgelöst und in der Vorgabe als
  `data:`-URI eingebettet – die gebauten Views brauchen die Kopie danach nicht
  mehr. Unter `--no-inline-images` verweist das HTML auf die Datei; dann muss
  sie mit ausgeliefert werden.
- Fehlt die Datei, liefert `resolveAssetUrl` heute `null`, und die Vorlesung
  baut stumm ohne Logo. Nach dem Merge prüfen, ob das ein Build-Fehler werden
  soll; der Linter meldet es schon (`identity.logo … names a file that is not
  beside this source.md`).
- **Kein Übergang in der Engine nötig.** Eine Datei neben der Quelle ist schon
  mit der heutigen Engine gültig. Die Umstellung in den Skills und Kursen
  (Kopie hinlegen, Pfad ändern) geht deshalb **vor** der Bewegung von
  `styling/showcase` hinaus und funktioniert auf der alten wie der neuen
  Engine. Nur die CI braucht das neue Job-Skript zugleich mit den
  umgestellten Quellen, sonst baut sie ohne Logo.

Dasselbe gilt für alles, was der Hausstil sonst von außerhalb liest
(`::: recall <pfad>`) – nach dem Merge an `example.md` und CNW t00 prüfen.

## CI-Image

Das Image `lecture-ci` (`cs/infra/tools`) backt die Skills an einem festen
Commit ein (`SKILLS_REF`, derzeit `bd644bc`) und die Engine an dem Commit, den
das Skills-Repo dort vermerkt – ohne `--remote`. Die CI folgt also nicht der
Spitze von `styling/showcase`, die Kurse lokal schon.

- Nach der Auslieferung laufen lokal 2.0.0 und in der CI die alte Engine,
  bis ein neues Image gebaut ist. **Quell-Migrationen in den Kursen und das
  neue Image gehen zusammen hinaus**, sonst bricht eine Seite.
- Reihenfolge nach der Freigabe: Skills-Repo vermerkt den Engine-Commit samt
  angepasstem `check-all.mjs` → in `cs/infra/tools` `SKILLS_REF` und
  `LECTURE_CI_IMAGE` → `build-ci`, `smoke-test` → der Dozent taggt `vN` →
  Unit-Repos auf `ref: vN` (`lecture-gitlab-release/SKILL.md`).
- Basis-Image `node:22-bookworm-slim` genügt: 2.0.0 verlangt `node >= 22`,
  ohne engere Angabe. Die Abhängigkeiten sind unverändert; nur
  `playwright-core ^1.61.1` ist von `devDependencies` nach
  `optionalDependencies` gewandert. Das `ci/Dockerfile` ruft `npm ci --no-audit
  --no-fund` ohne `--omit` (Zeile 43, von der Skills-Session nachgesehen) –
  es wird weiter installiert, nichts zu tun. Chromium kommt aus dem
  Basis-Image. Der Fork bringt `@fortawesome/fontawesome-free`
  dazu.
- `cs/infra/tools` und das Taggen sind Sache des Dozenten bzw. einer Session
  dort; diese Migration fasst es nicht an.

## Prüfkorpus

1. `claude-skills-lecture/lecture-oth-ci-slides/reference/example.md` und
   `slide-types.md` – die Hausstil-Referenz.
2. CNW t00, INFSEC t00 und t01 – die gehaltenen Vorlesungen, zuerst.
3. Die übrigen Kursquellen. Sammelprüfung:
   `lecture-render-psi-slides/scripts/check-all.mjs` (build, lint, check-fit,
   scaling, house-check, layers).

Die Kurse gehören eigenen Sessions. Diese Migration liest sie und ändert
dort nichts.

### Vorprüfung mit dem unveränderten 2.0.0-Linter (02.10.2026)

Über die 39 Dateien namens `source.md` in den fünf Kursen (ohne `.claude/`,
ohne `.agents/`) und `example.md`. Das ist der ganze Korpus: Vorlesungsquellen
heißen immer `source.md` (bestätigt von der Skills-Session). Nicht einzeln
erfasst sind die geteilten Folien in `<Kurs>/.claude/shared/slides` (Klon von
`cs/shared/slides`); ihre Chunks stehen generiert in den Vorlesungen.

- Fast alle Fehler sind Fork-Vokabular, das 2.0.0 nicht kennt und der Merge
  mitbringt: `style.elevation`, `edge`, `fill`, `line`, `ink-soft`,
  `slide-bold`, `print-pages`; `section: poster`; `.tone-N`, `.tones`,
  `.dashed`, `.number` an `::: cards` / `::: rows`; Chunk-Typ `recall:`;
  `stray-directive-close` als Folgefehler unbekannter Direktiven.
- Von den Regeln, die 2.0.0 selbst neu erzwingt, schlägt in den Kursquellen
  **keine** an: kein offener Fence, kein Tail-Token ohne Sigill, kein
  `::: draw`-Kopf mit geschweiften Klammern, kein `empty-beat`.
- `::: flip without an enclosing ::: side` in CNW t00 (Zeile 876) und INFSEC
  t00 (Zeile 806) ist eine Quelle: die geteilte Folie `reading` aus
  `cs/shared/slides`. Aufbau `::: slide` → `::: side` → drei `::: activity` →
  `::: flip` → zwei `::: activity`. Vermutung: der 2.0.0-Parser kennt
  `::: activity` nicht und schließt `::: side` mit dessen `:::`. Dann
  verschwindet der Fehler, sobald `::: activity` in der Verschachtelungs-
  tabelle steht – nach dem Merge als Erstes prüfen. Bleibt er, gehört die
  Korrektur nach `cs/shared/slides`, nicht in die Kurse.
- `neighbours` steht in einer Kursquelle; der Hausstil setzt es nicht.
- 78 `::: draw`-Figuren in diesen Dateien. Sie sind über Rastergrößen
  (60x16, 88x36, 96x30 …) auf Lesbarkeit eingestellt; die feste Leinwand von
  2.0.0 trifft jede davon. Das ist das eigentliche Risiko dieser Migration,
  nicht der Merge.

## Entscheidungen

1. **Merge, kein Rebase.** 37 Commits einzeln über 457 zu ziehen löst
   dieselben Konflikte mehrfach. Ein Merge-Commit, Konflikte einmal.
2. **`neighbours` geht auf die Upstream-Schreibweise.** Upstream:
   Frontmatter-Schlüssel `neighbours: dim | hidden`, Vorgabe `hidden` unter
   `transition: cut | fade`. Der Fork-Schlüssel `style: {neighbours}` entfällt;
   der Linter nennt beim alten Schlüssel den neuen.
3. **Die Fork-Prüfung „Labels unter 70 %" in `--check-fit` entfällt.**
   Upstream setzt Labels auf Fließtextgröße und meldet `figure-type-small` und
   `figure-overflows-canvas`.
4. **Alles andere aus dem Fork bleibt** und wird in die 2.0.0-Strukturen
   eingetragen (siehe Schritt 4).
5. **Vom Hausstil genutzt und deshalb zuerst gesichert:** `identity:`
   (accent, ink, logo, logo-place, logo-print, footer-left, footer-right),
   `palette:` (tone-1…4, link, info, task, example, takeaway), `icons:`,
   `section: outline` mit `section-caption: item`, `style: {elevation, edge,
   slide-bold, question-body, ink-soft, print-pages}`, alle fünf
   `::: activity`-Arten, `::: recall`, `::: table {.tone-N}`, `{.number}`,
   `{.tones}`. Nachrangig: `section: poster` (nur CNW t11), `neighbours`.
   Die Lint-Regeln `accent-contrast` und `tone-contrast` bleiben Warnungen –
   der Hausstil schaltet sie per `linter: ignore` ab, und das greift in 2.0.0
   nur noch bei Warnungen.
6. **Der Fork bekommt keine eigene Hauptversion.** `package.json` nimmt
   `2.0.0` von Upstream; die Fork-Einträge bleiben im Changelog unter
   `[Unreleased]`.

## Vorher (bis Samstagabend)

- `styling/plan` nach `styling/showcase` mergen oder bewusst liegen lassen.
- Sicherungs-Tag: `git tag pre-2.0.0 styling/showcase`.
- Remote `upstream`: von Hand einzurichten, weil die Sandbox `.git/config`
  nicht schreiben lässt – mit abgeschaltetem Push, damit „nur lesend" auch
  technisch gilt:
  `git remote add upstream https://github.com/UBA-PSI/psi-slides.git` und
  `git remote set-url --push upstream DISABLED-read-only`. Nicht nötig für
  Sonntag; die Aufgabe holt per URL.
- **Der Arbeitsbaum bleibt, wie er ist.** Die Migration läuft in einem
  eigenen Arbeitsverzeichnis `/Users/cr/Develop/psi-slides/.worktrees/migrate-2.0.0`
  (git worktree, Zweig `migrate/2.0.0`); die uncommitteten Dateien im
  Hauptverzeichnis werden weder committet noch zurückgestellt. Für die
  Prüfung mit den Skills-Skripten zeigt `PSI_SLIDES` deshalb auf dieses
  Verzeichnis.
- **Start:** geplante Aufgabe `psi-slides-migrate-2-0-0`, Sonntag 04.10.2026,
  03:00. Ein Sonnet-5.5-Agent führt aus, abschnittsweise; die Sitzung selbst
  (Opus 5.5) überwacht – liest nach jedem Abschnitt den Diff, fährt die Gates
  selbst nach und prüft die Grenzen. Schritte 1–8, ohne Auslieferung; sie
  bewegt `styling/showcase` nicht und pusht nichts.
- Ausgangswerte festhalten, gegen die nachher verglichen wird: `npm run gate`,
  `node test/run.mjs`, `node lint.js lectures/`, und `--check-fit` samt
  `--squint` für jede Lektion des Prüfkorpus.
- Vorher-Bilder der Figurenfolien aus `example.md` und CNW t00
  (`--frames`-Ersatz im Fork: Screenshots aus `--check-fit`-Lauf bzw.
  `--squint`), damit die Leinwand-Änderung als Vorher/Nachher vorliegt.
- Skills-Session: A und E sind gelandet (`fc0b6bc`, `b97ae86`); C und D
  ruhen auf Anweisung des Dozenten vollständig bis zum Abschluss, B ist nicht
  freigegeben. Sie ändert bis zur Freigabe nichts an `claude-skills-lecture`.
- **Freeze der Kursquellen** bis zur Freigabe, vom Dozenten bestätigt –
  außer CYS. Für CYS gilt: kein `update.sh` nötig zu verbieten, weil
  `styling/showcase` sich bis zur Auslieferung nicht bewegt; aber was dort
  bis Sonntag entsteht, ist in der Vorprüfung nicht enthalten.

## Sonntag

1. **`main` vorziehen.** `git checkout main && git merge --ff-only
   refs/upstream/v2.0.0`. Reiner Fast-forward. `npm install` (Node ≥ 22,
   `devDependencies` sind jetzt `optionalDependencies`), dann `npm run gate`
   auf unverändertem Upstream – der Nullpunkt.
2. **Zweig.** `git checkout -b migrate/2.0.0 styling/showcase`,
   `git merge main`.
3. **Konflikte, in dieser Reihenfolge:**
   1. `tails.mjs` (merged ohne Konflikt, aber Upstream hat den einen
      strengen Parser hineingelegt): die Fork-Tokens `.tone-N`, `.number`,
      `.row-N`, `.col-N`, `.cell-R-C`, `.dashed`, `.show` gegen die Slot-
      Tabellen prüfen.
   2. `diagram-core.mjs`: `opts.lift` und `.dg-lift` auf die neue Leinwand
      setzen; der Elbow „dreht einmal" gegen die neuen Elbow-Regeln.
   3. `build.js`, Abschnitt für Abschnitt nach der Liste oben. Upstream-
      Struktur gewinnt, Fork-Verhalten wird hineingetragen.
   4. `lint.js` – unmittelbar nach `build.js`, Konstante für Konstante
      (`VALID_TAGS`, `STYLE_SPEC`, `VIEW_DEFAULT_SPEC`, `THEME_NAMES`,
      `ICON_RE`, `KNOWN_FRONTMATTER_KEYS`).
   5. `editor.mjs`, Tests, `package.json` (Font Awesome zu den
      `optionalDependencies`), `package-lock.json` neu erzeugen.
   6. `CHANGELOG.md`: Upstream-Text, Fork-Einträge darüber unter
      `[Unreleased]`.
   7. Getrackte Views nicht mergen: Upstream-Fassung nehmen, in Schritt 6 neu
      bauen.
4. **Was 2.0.0 neu verlangt, für jede Fork-Funktion:**
   - Frontmatter: `identity:`, `palette:`, `icons:`, `section-caption:` in
     `KNOWN_FRONTMATTER_KEYS`; Upstream hat ein Gate, das die Liste gegen
     `build.js` hält. Frontmatter ist jetzt YAML – die Fork-Leser lesen das
     geparste Objekt.
   - Verschachtelung: `::: activity`, `::: table`, `::: recall` in die
     Tabelle „was darf worin öffnen". Die beiden Lint-Fehler
     `stray-directive-close` in `lectures/activity` und
     `lectures/advanced-styling` sind der Test dafür.
   - Tasten: `S`/`P` (Geschwister-Views) in `commands.mjs`.
   - Sicherheit: `identity: {logo}` und `::: recall <pfad>` lesen Dateien –
     beide durch die neue Wurzelprüfung (eigener Ordner, eine Ebene höher,
     kein Punkt-Ordner, kein Link).
   - Desktop: `colour.mjs` und jede weitere Datei, die `build.js` liest, in
     `FILES` in `desktop/scripts/stage-engine.mjs`.
   - Ruhiger Text: `ink-soft` und `question-body` nach dem Merge neu messen;
     Upstream mischt `.muted`/`.dim` jetzt gegen die Tinte und zentriert
     `question:` nicht mehr.
5. **Skills und Doku:** `.claude/skills/psi-slides-*`, `ARCHITECTURE.md`,
   `CLAUDE.md`, `HANDOFF.md`, `README.md` (Abschnitt „was dieser Fork
   hinzufügt"), `PRD.md` §2.1 für `statement:`.
6. **Prüfen:** `npm run gate` → `npm run build:tracked` → `node lint.js
   lectures/ --strict` → `node test/run.mjs` (etwa 8 Minuten, jetzt mit
   `test/pdf-export.mjs`) → `desktop/`-Tests. WebKit-Hälften von
   `test/figure-edge.mjs` und `test/frame-fade.mjs` laufen lassen.
7. **Prüfkorpus** in der Reihenfolge von oben, mit
   `PSI_SLIDES` auf `migrate/2.0.0`: lint, build, `--check-fit`, `--squint`,
   dann `check-all.mjs`. Vorher/Nachher für `example.md` und CNW t00:
   Figurenfolien, Klickzahl je Folie (die Notiz-Zeitrechnung in `layers.mjs`
   hängt daran), eine `question:`-Folie.
   Aufruf je Vorlesung, vom Kurs-Wurzelverzeichnis:
   `PSI_SLIDES=/Users/cr/Develop/psi-slides node
   .claude/skills/lecture-render-psi-slides/scripts/check-all.mjs
   <pfad>/source.md` (`--no-chrome`, `--with-shared`); einen Sammelaufruf gibt
   es nicht, also Schleife.

   **`check-all.mjs` liest die Ausgabe von `--check-fit` wörtlich.** Zeile 78
   sucht „figure labels under" (die Fork-Prüfung, die entfällt – dann meldet
   es dort stumm nichts mehr), Zeile 91 sucht `[check-fit] N state` (ändert
   sich diese Zeile, meldet es „nothing was measured" als Fehler). Geprüft:
   die Zeile `[check-fit] N state(s) at …` ist am Fork-Punkt, in 2.0.0 und im
   Fork wortgleich – im Merge so lassen. Der Skills-Session die neuen
   Zeilen nennen (`figure-type-small`, `figure-overflows-canvas`, Median).
   `scaling.mjs`, `shot.mjs` und `contact-sheet.mjs` lesen `audience.html`
   per Chrome – geänderte DOM-Klassen ebenfalls melden.
8. **Liste der erzwungenen Quelländerungen** (alt → neu, mechanisch oder
   nicht) an die Skills-Session. Daraus schreibt sie die Migrationen 0007 ff.
   (`migrations/`, Läufer `migrate.mjs`).
9. **Vorlage an den Dozenten:** die Vorher/Nachher-Bilder und der Wert für
   `style: {figure-type}`, mit dem die Figuren des Hausstils wieder stehen wie
   vorher. Er entscheidet, ob das trägt.
10. **Auslieferung**, erst nach seinem Ja, in dieser Reihenfolge:
    Freigabe an die Skills-Session → sie stellt Logo-Kopie und Pfad um und
    liefert die Quell-Migrationen (beides läuft auch auf der alten Engine) →
    `migrate/2.0.0` nach
    `styling/showcase`, Push durch den Dozenten, dann Freigabe an die
    Skills-Session für C, D und die FIGURE-DIM-Schwellen.

## Was am Vormittag fertig sein muss, und was nicht

Schritte 1–3 und der Teil von Schritt 6 ohne Browser sind das Ziel für den
Vormittag: der Zweig baut, `npm run gate` ist grün. Die Schätzung für alles
zusammen war 2–4 Arbeitstage; sie ist nicht durch einen Versuch gedeckt.

**Die Migration wird durchgeführt** (Dozent, 02.10.2026): langfristig muss
der Fork auf 2.0.0 und Upstream enger folgen. Es gibt deshalb keinen
Abbruch, nur eine Reihenfolge: Ist `build.js` bis Mittag nicht konfliktfrei,
geht die Arbeit auf `migrate/2.0.0` weiter, `styling/showcase` bleibt der
Stand, mit dem gelehrt wird, und die Skills-Session bekommt ihre Freigabe
später. Nichts wird halbfertig nach `styling/showcase` gemergt.

## Danach: Upstream enger folgen

- `upstream` bleibt als Remote; `main` ist ab jetzt immer ein Fast-forward
  von Upstream und trägt keinen eigenen Commit.
- Upstream-Releases zeitnah nach `styling/showcase` mergen, statt 457
  Commits auflaufen zu lassen.
- Die Fork-Differenz klein halten: wo 2.0.0 dasselbe kann, die
  Upstream-Fassung nehmen (hier: `neighbours`, Figuren-Lesbarkeit).
- **Nur lesend, keine Rückflüsse** (Dozent, 02.10.2026). Der Fork holt von
  Upstream und gibt nichts zurück: keine Pull Requests, keine Issues, kein
  Push. Stand am 02.10.2026: kein PR vom Fork bei Upstream, kein Remote
  `upstream` eingerichtet; geholt wird per URL nach `refs/upstream/*`.

## Was sich an bestehenden Decks verschiebt, und der Rückweg

| Änderung in 2.0.0 | Rückweg |
|---|---|
| Figuren-Labels auf Fließtextgröße, feste Leinwand | `style: {figure-type: N}`, `{.figure-type-N}` |
| Jedes `---` ist ein Beat | leeres Segment aus der Quelle nehmen |
| `question:` nicht mehr zentriert | `style: {headings: center}` oder `{.center}` |
| `slide-numbers` waagrecht | `slide-numbers: vertical` |
| `{…}`-Tail: jedes Token mit Sigill | Quelle korrigieren, kein Rückweg |
| `<!-- linter: ignore -->` nur noch für Warnungen | Fehler beheben, kein Rückweg |
| `::: draw`-Kopf ohne geschweifte Klammern | Quelle korrigieren |

## Zurück

`git checkout styling/showcase` – der Zweig wird bis zur Freigabe nicht
berührt. `main` zurück: `git branch -f main 94d6b9d`. Tag `pre-2.0.0` hält den
Stand zusätzlich.

## Offen – Entscheidungen des Dozenten

1. Was mit `CLAUDE.md`, `ARCHITECTURE.md`, `AGENTS.md`, `.agents/` im
   Arbeitsbaum geschieht. Für den Merge nicht mehr nötig (eigenes
   Arbeitsverzeichnis), aber vor der Auslieferung: sie gehören auf
   `styling/showcase` oder nicht.
2. *Bestätigt:* Freeze der Kursquellen bis zur Freigabe – **mit Ausnahme
   von CYS**, dort wird weitergearbeitet. Folge: die Ausgangswerte für CYS
   erst unmittelbar vor der Prüfung nehmen, und CYS zuletzt prüfen.
3. *Bestätigt:* Bildverschiebungen (Figuren-Leinwand, jedes `---` ein Beat)
   werden nach dem Merge per Vorher/Nachher geprüft (Schritte 7 und 9), bevor
   `styling/showcase` bewegt wird; kein Abbruch vorab.
4. *Bestätigt:* Logo als Kopie neben der Quelle, Dateiregel unverändert.
5. *Entschieden:* Start durch die geplante Aufgabe, siehe *Vorher*.

Push nach `origin` läuft über SSH und ist aus der
Sandbox nicht möglich – den Push macht er selbst.
