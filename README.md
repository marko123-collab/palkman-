# 🦁 Kozminski Escape: Polowanie na ECTS

> Dynamiczna, retro-arcade gra przeglądarkowa 2D osadzona w realiach **Akademii Leona Koźmińskiego (ALK)** w Warszawie.

---

## 🎓 Lore i Fabuła Gry

Trwa gorący okres sesji letniej na warszawskim Koźminie. Korytarze budynków A i D, sale wykładowe oraz biblioteka tętnią studenckim życiem. Jako zdeterminowany student stajesz przed najważniejszym wyzwaniem semestru: musisz zgromadzić **30 punktów ECTS**, aby uzyskać upragnione zaliczenie i stypendium rektora.

Twoim tropem podąża jednak bezlitosny **Egzaminator uzbrojony w czerwony długopis**. Z każdym kolejnym zdobytym punktem ECTS profesor przyspiesza i staje się coraz bardziej czujny, wykrzykując bezlitosne pytania o brak formatowania harwardzkiego, bilanse finansowe czy domniemane użycie sztucznej inteligencji. Jeden podpis czerwonym długopisem w indeksie oznacza natychmiastowe skierowanie na **„Kampanię Wrześniową”** (warunek i poprawkę)!

---

## 🎯 Zasady i Elementy Rozgrywki

* **Cel główny**: Zbierz **30 punktów ECTS** i unikaj złapania przez Profesora.
* **Zielone Patio ALK 🌿**: Centralna strefa zieleni uczelni z rzeźbą Lwa Koźmińskiego. Na terenie Patio stamina studenta regeneruje się ponaddwukrotnie szybciej niż na korytarzach!

### 📦 Przedmioty i Power-upy:

| Ikona | Przedmiot | Działanie |
| :---: | :--- | :--- |
| 📜 | **Punkty ECTS** | Dodaje **+1 ECTS** do Twojego indeksu (cel: 30 ECTS). |
| ☕ | **Kawa z Patio ALK** | Daje **5 sekund turbo-prędkości** i nielimitowany sprint! |
| 💻 | **Gemini AI** | Cybernetyczny paraliż: **zamraża Profesora na 3.5 sekundy**. |
| 🪪 | **Legitymacja ALK** | Tworzy błękitną **tarczę ochronną**, która ratuje przed 1 złapaniem. |
| 👨‍🏫🖊️ | **Egzaminator** | Przeciwnik. Z każdym zebranym ECTS porusza się szybciej! |

---

## 🕹️ Sterowanie

### 💻 Komputer (PC / Mac)
* <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> lub <kbd>▲</kbd> <kbd>◀</kbd> <kbd>▼</kbd> <kbd>▶</kbd> — Ruch studenta (góra, lewo, dół, prawo)
* <kbd>Shift</kbd> lub <kbd>Spacja</kbd> — Sprint (zużywa staminę)
* Przycisk **🔊 / 🔇** w prawym górnym rogu paska HUD — Wyciszenie dźwięków

### 📱 Smartfony i Tablety (Mobile-first)
* **Wirtualny D-Pad** (lewy dolny róg) — Dotykowy krzyżak kierunkowy
* **Przycisk ⚡ SPRINT** (prawy dolny róg) — Bieg ze sprintem
* Interfejs automatycznie aktywuje kontrolery dotykowe w widokach poniżej **768px**

4. odpalanie gierki
   pobieramy i rozpakowujemy całe repo i otwieramy plik index.html przeglądarka
   
---

## 📁 Struktura Projektu

Projekt został przygotowany w sposób modularny i bezstanowy, z zerową zależnością od zewnętrznych plików audio:

```text
├── index.html          # Semantyczny szkielet HTML5: HUD, Canvas 800x540, komiksowy dymek, modale
├── css/
│   └── style.css       # Oficjalna paleta ALK (#002244, #f2a900, #004b87), szklany HUD, animacje, RWD
├── js/
│   ├── audio.js        # SoundSystem – 8-bitowe syntezowane audio (Web Audio API, bez zewnętrznych .mp3)
│   └── game.js         # Silnik gry Canvas 2D: kolizje AABB, pościg AI, mechanika staminy, pętla RAF
├── metadata.json       # Metadane projektu AI Studio
├── package.json        # Konfiguracja środowiska i narzędzi deweloperskich
└── README.md           # Dokumentacja projektu
```

---

## 🔊 Technologia Dźwięku
Moduł `js/audio.js` wykorzystuje natywne **Web Audio API** (`AudioContext`, `OscillatorNode`, `GainNode`). Wszystkie efekty dźwiękowe (monety retro, doładowanie kofeiny, cyber-glitch paraliżu, tarcza sinusoidalna, fanfary sukcesu oraz dźwięk faulu) są generowane w locie z czystego kodu.

---
*Projekt dedykowany społeczności Akademii Leona Koźmińskiego (ALK) w Warszawie.*
