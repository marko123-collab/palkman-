/**
 * @license
 * Kozminski Escape: Polowanie na ECTS
 * Akademia Leona Koźmińskiego (ALK) w Warszawie
 * Serce gry: Silnik Canvas 2D (800x540), kolizje AABB, AI pościgu, stany i audio
 */

import { audio } from './audio.js';

// Główne stałe gry
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 540;
const TARGET_ECTS = 30;

// Oficjalne barwy ALK i planszy
const ALK = {
  navyDark: '#0a1128',
  navy: '#002244',
  navyLight: '#004b87',
  gold: '#f2a900',
  goldLight: '#ffc740',
  patioGreen: '#2d6a4f',
  patioGrass: '#357a5b',
  floorTile: '#0f2038',
  wallBorder: '#00172e',
  wallTop: '#003a6b',
  redPen: '#d90429'
};

// Cytaty Profesora wyświetlane w komiksowym dymku
const ACADEMIC_QUOTES = [
  "A gdzie przypis harwardzki?!",
  "Ten bilans się nie zamyka!",
  "Widzę Pana we wrześniu!",
  "Czy ten esej pisał Pan, czy ChatGPT?!",
  "Brak obecności na ćwiczeniach o 8:00!",
  "Czerwony długopis nie wybacza takich błędów!",
  "Gdzie Pan biegnie?! Zaraz sprawdzamy listę!",
  "Do dziekanatu po podanie o warunek!"
];

const AI_FROZEN_QUOTES = [
  "Gemini AI rozwiązało egzamin w 2 sekundy?!",
  "Błąd systemu USOS... paraliż akademicki!",
  "Zarządzenie Rektora: egzamin chwilowo wstrzymany!"
];

/**
 * 1. Układ kampusu na Canvasie:
 * Aule, Biblioteka, Dziekanat, Lab Komputerowy i centralne Patio ALK
 */
class Campus {
  constructor() {
    this.width = CANVAS_WIDTH;
    this.height = CANVAS_HEIGHT;

    // Centralny plac: „Patio ALK 🌿”
    this.patio = {
      x: 240,
      y: 135,
      w: 320,
      h: 270,
      label: "Patio ALK 🌿"
    };

    // Strefy sal z etykietami
    this.zones = [
      { name: "Aula A", x: 20, y: 20, w: 180, h: 190, color: "rgba(0, 75, 135, 0.35)", accent: ALK.goldLight },
      { name: "Biblioteka", x: 600, y: 20, w: 180, h: 190, color: "rgba(45, 106, 79, 0.3)", accent: "#74c69d" },
      { name: "Dziekanat", x: 20, y: 330, w: 180, h: 190, color: "rgba(242, 169, 0, 0.2)", accent: ALK.gold },
      { name: "Lab Komputerowy", x: 600, y: 330, w: 180, h: 190, color: "rgba(0, 180, 216, 0.25)", accent: "#48cae4" }
    ];

    // Ściany i przeszkody AABB (Axis-Aligned Bounding Box)
    this.walls = [
      // Zewnętrzne ściany kampusu
      { x: 0, y: 0, w: CANVAS_WIDTH, h: 14 },
      { x: 0, y: CANVAS_HEIGHT - 14, w: CANVAS_WIDTH, h: 14 },
      { x: 0, y: 0, w: 14, h: CANVAS_HEIGHT },
      { x: CANVAS_WIDTH - 14, y: 0, w: 14, h: CANVAS_HEIGHT },

      // Aula A (lewa górna sala - ściany z drzwiami)
      { x: 200, y: 14, w: 14, h: 80 },
      { x: 200, y: 145, w: 14, h: 80 },
      { x: 14, y: 215, w: 120, h: 14 },

      // Biblioteka (prawa górna sala - ściany z drzwiami)
      { x: 586, y: 14, w: 14, h: 80 },
      { x: 586, y: 145, w: 14, h: 80 },
      { x: 666, y: 215, w: 120, h: 14 },

      // Dziekanat (lewa dolna sala z drzwiami)
      { x: 14, y: 315, w: 120, h: 14 },
      { x: 200, y: 315, w: 14, h: 80 },
      { x: 200, y: 445, w: 14, h: 81 },

      // Lab Komputerowy (prawa dolna sala z drzwiami)
      { x: 666, y: 315, w: 120, h: 14 },
      { x: 586, y: 315, w: 14, h: 80 },
      { x: 586, y: 445, w: 14, h: 81 },

      // Fontanna i Pomnik Lwa w centrum Patio
      { x: 375, y: 245, w: 50, h: 50 }
    ];
  }

  // Sprawdza, czy punkt leży w obrębie zielonego Patio ALK
  isInPatio(x, y) {
    return (
      x >= this.patio.x &&
      x <= this.patio.x + this.patio.w &&
      y >= this.patio.y &&
      y <= this.patio.y + this.patio.h
    );
  }

  // Kolizja okręgu z prostokątami AABB ścian
  checkCollision(cx, cy, radius = 12) {
    for (const w of this.walls) {
      const closestX = Math.max(w.x, Math.min(cx, w.x + w.w));
      const closestY = Math.max(w.y, Math.min(cy, w.y + w.h));
      const distSq = (cx - closestX) ** 2 + (cy - closestY) ** 2;

      if (distSq < radius * radius) {
        return true;
      }
    }
    return false;
  }

  draw(ctx) {
    // 1. Kafelki podłogowe korytarzy
    ctx.fillStyle = ALK.floorTile;
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
    ctx.lineWidth = 1;
    for (let x = 0; x < this.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }
    for (let y = 0; y < this.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }

    // 2. Rysowanie stref sal z etykietami
    this.zones.forEach(zone => {
      ctx.fillStyle = zone.color;
      ctx.fillRect(zone.x, zone.y, zone.w, zone.h);

      // Etykieta sali
      ctx.save();
      ctx.font = '800 13px Outfit, sans-serif';
      ctx.fillStyle = zone.accent;
      ctx.textAlign = 'center';
      ctx.fillText(zone.name, zone.x + zone.w / 2, zone.y + 24);
      ctx.restore();
    });

    // Wnętrze Aula A (rzędy ławek)
    ctx.fillStyle = 'rgba(0, 34, 68, 0.7)';
    for (let y = 60; y < 200; y += 26) {
      ctx.fillRect(35, y, 150, 10);
    }

    // Wnętrze Biblioteki (regały)
    ctx.fillStyle = 'rgba(45, 106, 79, 0.6)';
    for (let y = 60; y < 200; y += 30) {
      ctx.fillRect(615, y, 150, 12);
    }

    // Wnętrze Dziekanatu (biurka i stanowiska)
    ctx.fillStyle = 'rgba(242, 169, 0, 0.4)';
    ctx.fillRect(40, 370, 60, 40);
    ctx.fillRect(120, 370, 60, 40);
    ctx.fillRect(40, 440, 140, 12);

    // Wnętrze Lab Komputerowy (stacje PC)
    ctx.fillStyle = 'rgba(0, 180, 216, 0.4)';
    for (let y = 370; y < 500; y += 38) {
      ctx.fillRect(615, y, 150, 16);
      ctx.fillStyle = '#ffffff';
      for (let pcX = 625; pcX < 755; pcX += 30) {
        ctx.fillRect(pcX, y + 2, 10, 8);
      }
      ctx.fillStyle = 'rgba(0, 180, 216, 0.4)';
    }

    // 3. Centralny plac: „Patio ALK 🌿”
    ctx.fillStyle = ALK.patioGrass;
    ctx.fillRect(this.patio.x, this.patio.y, this.patio.w, this.patio.h);

    // Żywopłot Patio
    ctx.strokeStyle = '#1b4332';
    ctx.lineWidth = 5;
    ctx.strokeRect(this.patio.x, this.patio.y, this.patio.w, this.patio.h);

    // Brukowane alejki Patio
    ctx.fillStyle = '#d4c5a9';
    ctx.fillRect(this.patio.x + this.patio.w / 2 - 22, this.patio.y, 44, this.patio.h);
    ctx.fillRect(this.patio.x, this.patio.y + this.patio.h / 2 - 22, this.patio.w, 44);

    // Drzewa i zieleń Patio
    const trees = [
      { x: this.patio.x + 45, y: this.patio.y + 45 },
      { x: this.patio.x + this.patio.w - 45, y: this.patio.y + 45 },
      { x: this.patio.x + 45, y: this.patio.y + this.patio.h - 45 },
      { x: this.patio.x + this.patio.w - 45, y: this.patio.y + this.patio.h - 45 }
    ];
    trees.forEach(t => {
      ctx.fillStyle = '#1b4332';
      ctx.beginPath();
      ctx.arc(t.x, t.y, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#52b788';
      ctx.beginPath();
      ctx.arc(t.x - 3, t.y - 3, 14, 0, Math.PI * 2);
      ctx.fill();
    });

    // Centralna fontanna / rzeźba Lwa
    ctx.fillStyle = ALK.navy;
    ctx.beginPath();
    ctx.arc(400, 270, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = ALK.gold;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.font = '22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🦁', 400, 270);

    // Podpis Patio
    ctx.font = '900 13px Outfit, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(this.patio.label, 400, 155);

    ctx.font = '700 9px monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.fillText('[STREFA SZYBKIEJ REGENERACJI STAMINY]', 400, 172);

    // 4. Rysowanie ścian (AABB)
    for (const w of this.walls) {
      // Cień ściany
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(w.x + 2, w.y + 2, w.w, w.h);

      // Podstawa ściany
      ctx.fillStyle = ALK.wallBorder;
      ctx.fillRect(w.x, w.y, w.w, w.h);

      // Złota/niebieska krawędź
      ctx.fillStyle = ALK.wallTop;
      ctx.fillRect(w.x, w.y, w.w, Math.min(w.h, 4));
    }
  }
}

/**
 * Efekty cząsteczkowe (złote iskry, dym sprintu, napisy)
 */
class Particle {
  constructor(x, y, color, speed = 1.2, life = 28, text = null) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * speed * 2;
    this.vy = (Math.random() - 0.5) * speed * 2;
    this.color = color;
    this.maxLife = life;
    this.life = life;
    this.text = text;
    this.size = Math.random() * 4 + 2;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life--;
  }

  draw(ctx) {
    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    if (this.text) {
      ctx.font = '800 13px Outfit, sans-serif';
      ctx.fillStyle = this.color;
      ctx.fillText(this.text, this.x, this.y);
    } else {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

/**
 * Główna klasa silnika gry
 */
export class GameEngine {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.campus = new Campus();

    // Stany gry
    this.isRunning = false;
    this.isGameOver = false;
    this.isVictory = false;
    this.ectsCount = 0;
    this.startTime = 0;

    // 2. Gracz (Student)
    this.player = {
      x: 100,
      y: 270,
      radius: 13,
      baseSpeed: 3.2,
      sprintMultiplier: 1.85,
      angle: 0,
      stamina: 100,
      maxStamina: 100,
      isSprinting: false,
      coffeeTimer: 0,      // Turbo-szybkość z kawy (5s)
      hasShield: false,    // Ochrona legitymacji studenckiej
      walkFrame: 0
    };

    // 3. Przeciwnik (Egzaminator z czerwonym długopisem)
    this.professor = {
      x: 700,
      y: 270,
      radius: 14,
      baseSpeed: 2.3,
      speed: 2.3,
      angle: 0,
      stunTimer: 0,        // Zamrożenie przez Gemini AI (3.5s)
      quoteCooldown: 300   // Klatki do kolejnego tekstu akademickiego
    };

    // 4. Kolekcja przedmiotów i cząsteczek
    this.items = [];
    this.particles = [];

    // Sterowanie
    this.keys = {};
    this.touchDirection = { x: 0, y: 0 };
    this.touchSprintActive = false;

    // Elementy interfejsu HUD i Modali
    this.dom = {
      ectsCount: document.getElementById('ects-count'),
      ectsProgress: document.getElementById('ects-progress'),
      staminaFill: document.getElementById('stamina-fill'),
      staminaText: document.getElementById('stamina-text'),
      gameStatus: document.getElementById('game-status'),
      statusText: document.getElementById('status-text'),
      speechBubble: document.getElementById('professor-dialogue'),
      dialogueText: document.getElementById('dialogue-text'),
      startScreen: document.getElementById('start-screen'),
      gameOverScreen: document.getElementById('game-over-screen'),
      victoryScreen: document.getElementById('victory-screen'),
      btnStart: document.getElementById('btn-start-game'),
      btnRetry: document.getElementById('btn-retry-game'),
      btnRestartWin: document.getElementById('btn-restart-win'),
      btnSound: document.getElementById('btn-sound'),
      soundIcon: document.getElementById('sound-icon'),
      failEcts: document.getElementById('fail-ects-score'),
      failTime: document.getElementById('fail-time-score'),
      winTime: document.getElementById('win-time-score')
    };

    this.speechTimeout = null;

    this.bindControls();
    this.renderPreview();
  }

  bindControls() {
    // Klawiatura (WASD / Strzałki / Spacja / Shift)
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Przyciski ekranowe modali
    this.dom.btnStart.addEventListener('click', () => this.startGame());
    this.dom.btnRetry.addEventListener('click', () => this.restartGame());
    this.dom.btnRestartWin.addEventListener('click', () => this.restartGame());

    // Przycisk wyciszania
    this.dom.btnSound.addEventListener('click', () => {
      const muted = audio.toggleMute();
      this.dom.soundIcon.textContent = muted ? '🔇' : '🔊';
    });

    // Wirtualne kontrolery dotykowe (#mobile-controls)
    const attachDpad = (id, dx, dy) => {
      const btn = document.getElementById(id);
      if (!btn) return;

      const onStart = (e) => {
        e.preventDefault();
        this.touchDirection.x = dx;
        this.touchDirection.y = dy;
        btn.classList.add('pressed');
      };

      const onEnd = (e) => {
        e.preventDefault();
        if (this.touchDirection.x === dx) this.touchDirection.x = 0;
        if (this.touchDirection.y === dy) this.touchDirection.y = 0;
        btn.classList.remove('pressed');
      };

      btn.addEventListener('pointerdown', onStart);
      btn.addEventListener('pointerup', onEnd);
      btn.addEventListener('pointercancel', onEnd);
      btn.addEventListener('pointerleave', onEnd);
    };

    attachDpad('dpad-up', 0, -1);
    attachDpad('dpad-down', 0, 1);
    attachDpad('dpad-left', -1, 0);
    attachDpad('dpad-right', 1, 0);

    const sprintTouchBtn = document.getElementById('btn-touch-sprint');
    if (sprintTouchBtn) {
      const startSprint = (e) => {
        e.preventDefault();
        this.touchSprintActive = true;
        sprintTouchBtn.classList.add('pressed');
      };
      const endSprint = (e) => {
        e.preventDefault();
        this.touchSprintActive = false;
        sprintTouchBtn.classList.remove('pressed');
      };

      sprintTouchBtn.addEventListener('pointerdown', startSprint);
      sprintTouchBtn.addEventListener('pointerup', endSprint);
      sprintTouchBtn.addEventListener('pointercancel', endSprint);
      sprintTouchBtn.addEventListener('pointerleave', endSprint);
    }
  }

  showProfessorBubble(text, duration = 3500) {
    if (!this.dom.speechBubble || !this.dom.dialogueText) return;
    this.dom.dialogueText.textContent = `„${text}”`;
    this.dom.speechBubble.classList.add('active');

    clearTimeout(this.speechTimeout);
    this.speechTimeout = setTimeout(() => {
      this.dom.speechBubble.classList.remove('active');
    }, duration);
  }

  /**
   * 4. Przedmioty – spawnują się bezpiecznie poza ścianami kampusu
   */
  getSafeSpawnPoint() {
    let attempts = 0;
    while (attempts < 80) {
      const x = Math.floor(Math.random() * (CANVAS_WIDTH - 80)) + 40;
      const y = Math.floor(Math.random() * (CANVAS_HEIGHT - 80)) + 40;

      // Sprawdzenie kolizji ze ścianami i marginesu wokół studenta
      const distToPlayer = Math.hypot(x - this.player.x, y - this.player.y);
      if (!this.campus.checkCollision(x, y, 22) && distToPlayer > 80) {
        return { x, y };
      }
      attempts++;
    }
    return { x: 400, y: 350 };
  }

  spawnInitialItems() {
    this.items = [];

    // Gwarantowane punkty 📜 ECTS
    for (let i = 0; i < 9; i++) {
      const pt = this.getSafeSpawnPoint();
      this.items.push({ x: pt.x, y: pt.y, type: 'ects', radius: 11, hoverOffset: Math.random() * Math.PI });
    }

    // ☕ Kawa z Patio ALK
    this.items.push({ x: 340, y: 340, type: 'coffee', radius: 14, hoverOffset: 0 });
    this.items.push({ x: 100, y: 440, type: 'coffee', radius: 14, hoverOffset: 1 });

    // 💻 Gemini AI (paraliż profesora)
    const geminiPt = this.getSafeSpawnPoint();
    this.items.push({ x: geminiPt.x, y: geminiPt.y, type: 'freeze', radius: 14, hoverOffset: 2 });

    // 🪪 Legitymacja ALK (ochrona tarczy)
    const cardPt = this.getSafeSpawnPoint();
    this.items.push({ x: cardPt.x, y: cardPt.y, type: 'shield', radius: 14, hoverOffset: 3 });
  }

  spawnSingleEcts() {
    const pt = this.getSafeSpawnPoint();
    this.items.push({
      x: pt.x,
      y: pt.y,
      type: 'ects',
      radius: 11,
      hoverOffset: Math.random() * Math.PI
    });
  }

  spawnSpecialPowerup() {
    const roll = Math.random();
    const type = roll < 0.4 ? 'coffee' : (roll < 0.75 ? 'freeze' : 'shield');
    const pt = this.getSafeSpawnPoint();
    this.items.push({
      x: pt.x,
      y: pt.y,
      type,
      radius: 14,
      hoverOffset: Math.random() * Math.PI
    });
  }

  startGame() {
    audio.init();
    audio.resume();

    this.dom.startScreen.classList.remove('active');
    this.dom.startScreen.classList.add('hidden');
    this.dom.gameOverScreen.classList.add('hidden');
    this.dom.victoryScreen.classList.add('hidden');

    this.ectsCount = 0;
    this.startTime = Date.now();
    this.isRunning = true;
    this.isGameOver = false;
    this.isVictory = false;

    // Reset studenta
    this.player.x = 100;
    this.player.y = 270;
    this.player.stamina = 100;
    this.player.coffeeTimer = 0;
    this.player.hasShield = false;

    // Reset profesora
    this.professor.x = 700;
    this.professor.y = 270;
    this.professor.speed = this.professor.baseSpeed;
    this.professor.stunTimer = 0;
    this.professor.quoteCooldown = 180;

    this.spawnInitialItems();
    this.showProfessorBubble("Sesja się rozpoczęła! Proszę przygotować indeksy i legitymacje!");

    this.updateHUD();
    requestAnimationFrame(() => this.loop());
  }

  restartGame() {
    this.dom.gameOverScreen.classList.add('hidden');
    this.dom.victoryScreen.classList.add('hidden');
    this.startGame();
  }

  triggerGameOver() {
    this.isRunning = false;
    this.isGameOver = true;

    // 5. Integracja z audio: 'hit'
    audio.play('hit');

    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    this.dom.failEcts.textContent = `${this.ectsCount} / ${TARGET_ECTS}`;
    this.dom.failTime.textContent = `${elapsed}s`;

    this.showProfessorBubble("Czerwony długopis postawił 2.0! Widzimy się w Kampanii Wrześniowej!", 5500);

    setTimeout(() => {
      this.dom.gameOverScreen.classList.remove('hidden');
      this.dom.gameOverScreen.classList.add('active');
    }, 650);
  }

  triggerVictory() {
    this.isRunning = false;
    this.isVictory = true;

    // 5. Integracja z audio: 'win'
    audio.play('win');

    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    this.dom.winTime.textContent = `${elapsed}s`;

    this.showProfessorBubble("Wszystkie 30 ECTS zebrane! Semestr zaliczony na 5.0!", 6000);

    setTimeout(() => {
      this.dom.victoryScreen.classList.remove('hidden');
      this.dom.victoryScreen.classList.add('active');
    }, 700);
  }

  /**
   * 2. Gracz (Student): Ruch wektorowy i mechanika staminy ze sprintem
   */
  updatePlayer() {
    let dx = 0;
    let dy = 0;

    if (this.keys['ArrowUp'] || this.keys['KeyW']) dy -= 1;
    if (this.keys['ArrowDown'] || this.keys['KeyS']) dy += 1;
    if (this.keys['ArrowLeft'] || this.keys['KeyA']) dx -= 1;
    if (this.keys['ArrowRight'] || this.keys['KeyD']) dx += 1;

    // Wektor dotykowy
    dx += this.touchDirection.x;
    dy += this.touchDirection.y;

    const length = Math.hypot(dx, dy);
    if (length > 0) {
      dx /= length;
      dy /= length;
      this.player.angle = Math.atan2(dy, dx);
      this.player.walkFrame += 0.22;
    }

    // Mechanika sprintu
    const wantsSprint = this.keys['ShiftLeft'] || this.keys['ShiftRight'] || this.keys['Space'] || this.touchSprintActive;
    const canSprint = wantsSprint && (this.player.stamina > 4 || this.player.coffeeTimer > 0);
    this.player.isSprinting = canSprint && length > 0;

    let currentSpeed = this.player.baseSpeed;

    // Turbo-szybkość z kawy (5 sekund)
    if (this.player.coffeeTimer > 0) {
      currentSpeed *= 1.8;
      this.player.coffeeTimer -= 1 / 60;
      this.player.stamina = Math.min(this.player.maxStamina, this.player.stamina + 0.3);
    } else if (this.player.isSprinting) {
      // Zużycie staminy w sprincie
      currentSpeed *= this.player.sprintMultiplier;
      this.player.stamina = Math.max(0, this.player.stamina - 0.48);
    } else {
      // Odnawianie staminy: szybsze na Patio ALK 🌿
      const inPatio = this.campus.isInPatio(this.player.x, this.player.y);
      const regenRate = inPatio ? 0.65 : 0.25;
      this.player.stamina = Math.min(this.player.maxStamina, this.player.stamina + regenRate);
    }

    // Obsługa kolizji AABB studenta ze ścianami (niezależnie dla osi X i Y - ślizg)
    const nextX = this.player.x + dx * currentSpeed;
    const nextY = this.player.y + dy * currentSpeed;

    if (!this.campus.checkCollision(nextX, this.player.y, this.player.radius)) {
      this.player.x = nextX;
    }
    if (!this.campus.checkCollision(this.player.x, nextY, this.player.radius)) {
      this.player.y = nextY;
    }

    // Cząsteczki sprintu
    if (this.player.isSprinting && Math.random() > 0.4) {
      this.particles.push(new Particle(
        this.player.x,
        this.player.y + 7,
        this.player.coffeeTimer > 0 ? ALK.gold : 'rgba(255, 255, 255, 0.45)',
        1.1,
        18
      ));
    }
  }

  /**
   * 3. Przeciwnik (Egzaminator):
   * Pościg, przyspieszanie z każdym ECTS, dymek akademicki
   */
  updateProfessor() {
    // Stan zamrożenia przez Gemini AI (3.5 sekundy)
    if (this.professor.stunTimer > 0) {
      this.professor.stunTimer -= 1 / 60;

      // Efekt cyber-iskier
      if (Math.random() > 0.5) {
        this.particles.push(new Particle(
          this.professor.x + (Math.random() - 0.5) * 20,
          this.professor.y + (Math.random() - 0.5) * 20,
          '#00b4d8',
          1.5,
          15
        ));
      }
      return;
    }

    // Profesor przyspiesza z każdym zebranym ECTS!
    this.professor.speed = this.professor.baseSpeed + (this.ectsCount * 0.052);

    // Kąt w stronę gracza
    const angle = Math.atan2(this.player.y - this.professor.y, this.player.x - this.professor.x);
    this.professor.angle = angle;

    // Próba ruchu w kierunku studenta z obsługą kolizji ze ścianami
    const moveX = Math.cos(angle) * this.professor.speed;
    const moveY = Math.sin(angle) * this.professor.speed;

    const nextX = this.professor.x + moveX;
    const nextY = this.professor.y + moveY;

    if (!this.campus.checkCollision(nextX, this.professor.y, this.professor.radius)) {
      this.professor.x = nextX;
    }
    if (!this.campus.checkCollision(this.professor.x, nextY, this.professor.radius)) {
      this.professor.y = nextY;
    }

    // Losowe teksty akademickie w dymku co pewien czas
    this.professor.quoteCooldown--;
    if (this.professor.quoteCooldown <= 0) {
      const quote = ACADEMIC_QUOTES[Math.floor(Math.random() * ACADEMIC_QUOTES.length)];
      this.showProfessorBubble(quote);
      this.professor.quoteCooldown = Math.floor(Math.random() * 220) + 260;
    }

    // Kolizja z graczem
    const distToPlayer = Math.hypot(this.player.x - this.professor.x, this.player.y - this.professor.y);
    if (distToPlayer < this.player.radius + this.professor.radius) {
      // 🪪 Legitymacja ALK chroni przed jednym złapaniem!
      if (this.player.hasShield) {
        this.player.hasShield = false;
        audio.play('shield');

        // Odpychamy profesora
        this.professor.x += Math.cos(angle + Math.PI) * 90;
        this.professor.y += Math.sin(angle + Math.PI) * 90;
        this.professor.stunTimer = 1.8;

        this.particles.push(new Particle(this.player.x, this.player.y, '#00b4d8', 3.5, 35, '🪪 TARCZA URATOWAŁA!'));
        this.showProfessorBubble("Legitymacja ważna?! Tym razem Panu daruję!", 3500);
      } else {
        // Brak tarczy = Kampania Wrześniowa!
        this.triggerGameOver();
      }
    }
  }

  /**
   * 4. Przedmioty i interakcje z dźwiękiem (SoundSystem.play)
   */
  updateItems() {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      item.hoverOffset += 0.055;

      const dist = Math.hypot(this.player.x - item.x, this.player.y - item.y);
      if (dist < this.player.radius + item.radius) {
        // 📜 ECTS (+1 punkt)
        if (item.type === 'ects') {
          this.ectsCount += 1;
          audio.play('ects');
          this.particles.push(new Particle(item.x, item.y, ALK.gold, 2, 25, '+1 ECTS! 📜'));

          if (this.ectsCount >= TARGET_ECTS) {
            this.ectsCount = TARGET_ECTS;
            this.triggerVictory();
            return;
          }

          // Nowy ECTS
          this.spawnSingleEcts();

          // Szansa na zrespawnowanie power-upa
          if (this.ectsCount % 4 === 0) {
            this.spawnSpecialPowerup();
          }
        }
        // ☕ Kawa z Patio ALK (5s turbo-szybkości)
        else if (item.type === 'coffee') {
          this.player.coffeeTimer = 5.0;
          this.player.stamina = 100;
          audio.play('coffee');
          this.particles.push(new Particle(item.x, item.y, '#ffc740', 2.8, 32, '☕ KAWA: TURBO!'));
          this.showProfessorBubble("Espresso z automatu?! Nie ucieknie Pan tak łatwo!");
        }
        // 💻 Gemini AI (zamraża profesora na 3.5s)
        else if (item.type === 'freeze') {
          this.professor.stunTimer = 3.5;
          audio.play('freeze');
          this.particles.push(new Particle(item.x, item.y, '#00b4d8', 3, 35, '💻 GEMINI AI: FREEZE!'));
          const aiQuote = AI_FROZEN_QUOTES[Math.floor(Math.random() * AI_FROZEN_QUOTES.length)];
          this.showProfessorBubble(aiQuote, 3500);
        }
        // 🪪 Legitymacja ALK (ochrona tarczy)
        else if (item.type === 'shield') {
          this.player.hasShield = true;
          audio.play('shield');
          this.particles.push(new Particle(item.x, item.y, '#48cae4', 3, 35, '🪪 TARCZA AKTYWNA!'));
        }

        this.items.splice(i, 1);
      }
    }
  }

  updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.update();
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  updateHUD() {
    // ECTS
    this.dom.ectsCount.textContent = this.ectsCount;
    const progress = Math.min(100, Math.round((this.ectsCount / TARGET_ECTS) * 100));
    this.dom.ectsProgress.style.width = `${progress}%`;

    // Stamina
    const staminaPct = Math.round(this.player.stamina);
    this.dom.staminaText.textContent = `${staminaPct}%`;
    this.dom.staminaFill.style.width = `${staminaPct}%`;

    if (this.player.coffeeTimer > 0) {
      this.dom.staminaFill.classList.add('boost');
    } else {
      this.dom.staminaFill.classList.remove('boost');
    }

    // Status
    const inPatio = this.campus.isInPatio(this.player.x, this.player.y);
    if (this.professor.stunTimer > 0) {
      this.dom.gameStatus.className = 'status-badge status-coffee';
      this.dom.statusText.textContent = `💻 Gemini AI: Profesor zamrożony (${this.professor.stunTimer.toFixed(1)}s)`;
    } else if (this.player.coffeeTimer > 0) {
      this.dom.gameStatus.className = 'status-badge status-coffee';
      this.dom.statusText.textContent = `☕ Turbo Kofeina: ${this.player.coffeeTimer.toFixed(1)}s`;
    } else if (this.player.hasShield) {
      this.dom.gameStatus.className = 'status-badge status-shield';
      this.dom.statusText.textContent = '🪪 Legitymacja ALK (Tarcza aktywna)';
    } else if (inPatio) {
      this.dom.gameStatus.className = 'status-badge status-safe';
      this.dom.statusText.textContent = '🌿 Patio ALK (Regeneracja staminy)';
    } else {
      this.dom.gameStatus.className = 'status-badge status-chase';
      this.dom.statusText.textContent = `⚠️ Egzaminator goni! (V: ${this.professor.speed.toFixed(1)})`;
    }
  }

  drawPlayer() {
    const { x, y, radius, angle, coffeeTimer, hasShield } = this.player;

    this.ctx.save();
    this.ctx.translate(x, y);

    // Poświata tarczy legitymacji studenckiej 🪪
    if (hasShield) {
      this.ctx.strokeStyle = '#00b4d8';
      this.ctx.lineWidth = 3;
      this.ctx.setLineDash([5, 3]);
      this.ctx.beginPath();
      this.ctx.arc(0, 0, radius + 8, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.setLineDash([]);
    }

    // Turbo-poświata kawy
    if (coffeeTimer > 0) {
      this.ctx.strokeStyle = ALK.goldLight;
      this.ctx.lineWidth = 2.5;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, radius + 4, 0, Math.PI * 2);
      this.ctx.stroke();
    }

    // Cień
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    this.ctx.beginPath();
    this.ctx.ellipse(0, 6, radius, radius * 0.6, 0, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.rotate(angle);

    // Plecak studenta z brandem ALK
    this.ctx.fillStyle = ALK.navy;
    this.ctx.beginPath();
    this.ctx.roundRect(-radius * 0.9, -radius * 0.7, radius * 0.6, radius * 1.4, 4);
    this.ctx.fill();

    // Ciało studenta
    this.ctx.fillStyle = '#004b87';
    this.ctx.beginPath();
    this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
    this.ctx.fill();

    // Głowa z czapką
    this.ctx.fillStyle = ALK.gold;
    this.ctx.beginPath();
    this.ctx.arc(radius * 0.4, 0, radius * 0.45, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.restore();
  }

  drawProfessor() {
    const { x, y, radius, angle, stunTimer } = this.professor;

    this.ctx.save();
    this.ctx.translate(x, y);

    // Cień
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    this.ctx.beginPath();
    this.ctx.ellipse(0, 8, radius * 1.1, radius * 0.7, 0, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.rotate(angle);

    // Garnitur Profesora
    this.ctx.fillStyle = '#1e293b';
    this.ctx.beginPath();
    this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
    this.ctx.fill();

    // Siwe włosy
    this.ctx.fillStyle = '#cbd5e1';
    this.ctx.beginPath();
    this.ctx.arc(radius * 0.35, 0, radius * 0.5, 0, Math.PI * 2);
    this.ctx.fill();

    // Krawat
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(radius * 0.1, -2, 5, 4);

    // Czerwony długopis w dłoni 🖊️
    this.ctx.fillStyle = ALK.redPen;
    this.ctx.fillRect(radius * 0.6, 6, 12, 3);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(radius * 0.6 + 12, 7, 3, 1);

    this.ctx.restore();

    // Emotikona nad profesorem
    this.ctx.save();
    this.ctx.font = '16px sans-serif';
    this.ctx.textAlign = 'center';
    if (stunTimer > 0) {
      this.ctx.fillText('💻❄️', x, y - 22);
    } else {
      this.ctx.fillText('🖊️⚡', x, y - 22);
    }
    this.ctx.restore();
  }

  drawItems() {
    this.items.forEach(item => {
      const hoverY = item.y + Math.sin(item.hoverOffset) * 3.5;

      this.ctx.save();
      this.ctx.translate(item.x, hoverY);

      // Cień przedmiotu
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      this.ctx.beginPath();
      this.ctx.ellipse(0, 8, 8, 4, 0, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.font = '20px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';

      // 📜 ECTS
      if (item.type === 'ects') {
        this.ctx.fillText('📜', 0, 0);
      }
      // ☕ Kawa z Patio ALK
      else if (item.type === 'coffee') {
        this.ctx.fillText('☕', 0, 0);
      }
      // 💻 Gemini AI
      else if (item.type === 'freeze') {
        this.ctx.fillText('💻', 0, 0);
      }
      // 🪪 Legitymacja ALK
      else if (item.type === 'shield') {
        this.ctx.fillText('🪪', 0, 0);
      }

      this.ctx.restore();
    });
  }

  renderPreview() {
    this.campus.draw(this.ctx);
    this.drawPlayer();
    this.drawProfessor();
  }

  loop() {
    if (!this.isRunning) return;

    this.updatePlayer();
    this.updateProfessor();
    this.updateItems();
    this.updateParticles();
    this.updateHUD();

    // Czyszczenie i rysowanie planszy
    this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    this.campus.draw(this.ctx);
    this.drawItems();
    this.drawPlayer();
    this.drawProfessor();

    // Rysowanie cząsteczek
    this.particles.forEach(p => p.draw(this.ctx));

    requestAnimationFrame(() => this.loop());
  }
}

// Inicjalizacja gry
window.addEventListener('DOMContentLoaded', () => {
  window.kozminskiEngine = new GameEngine();
});
