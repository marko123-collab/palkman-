/**
 * @license
 * Kozminski Escape: Polowanie na ECTS
 * Moduł dźwiękowy oparty na Web Audio API (Zero assetów zewnętrznych)
 * Czysta synteza 8-bitowych efektów dźwiękowych retro
 */

export class SoundSystem {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.initialized = false;
  }

  /**
   * Inicjalizuje AudioContext po pierwszej interakcji użytkownika
   * (wymóg przeglądarek dotyczący autoplay)
   */
  init() {
    if (this.initialized && this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
        this.initialized = true;
      }
    } catch (err) {
      console.warn('Web Audio API nie jest obsługiwane w tej przeglądarce:', err);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }

  /**
   * Główna metoda odtwarzania syntetyzowanych efektów 8-bitowych
   * @param {('ects'|'coffee'|'shield'|'freeze'|'hit'|'win')} type
   */
  play(type) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    switch (type) {
      case 'ects':
        this._playEcts(now);
        break;
      case 'coffee':
        this._playCoffee(now);
        break;
      case 'shield':
        this._playShield(now);
        break;
      case 'freeze':
        this._playFreeze(now);
        break;
      case 'hit':
        this._playHit(now);
        break;
      case 'win':
        this._playWin(now);
        break;
      default:
        console.warn(`Nieznany typ dźwięku: ${type}`);
    }
  }

  /**
   * 1. 'ects': melodyjny, wysoki dwuton monety retro (trójkątna fala)
   * Częstotliwości: B5 (987.77 Hz) -> E6 (1318.51 Hz)
   */
  _playEcts(startTime) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';

    // Pierwszy ton monety
    osc.frequency.setValueAtTime(987.77, startTime);
    // Skok do drugiego wyższego tonu
    osc.frequency.setValueAtTime(1318.51, startTime + 0.08);

    // Kształtowanie głośności (obwiednia AR)
    gain.gain.setValueAtTime(0.25, startTime);
    gain.gain.setValueAtTime(0.25, startTime + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.32);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.32);
  }

  /**
   * 2. 'coffee': dźwięk przyspieszenia (rosnąca częstotliwość fali piłokształtnej)
   * Efekt turbo-boostu: 150 Hz -> 880 Hz
   */
  _playCoffee(startTime) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';

    // Płynny sweep częstotliwości w górę (laser/speed ramp)
    osc.frequency.setValueAtTime(150, startTime);
    osc.frequency.exponentialRampToValueAtTime(900, startTime + 0.28);

    gain.gain.setValueAtTime(0.22, startTime);
    gain.gain.linearRampToValueAtTime(0.18, startTime + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.32);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.32);
  }

  /**
   * 3. 'shield': aktywacja tarczy legitymacji studenckiej (akord sinusoidalny)
   * Trójdźwięk harmoniczny (C5, E5, G5)
   */
  _playShield(startTime) {
    const freqs = [523.25, 659.25, 783.99]; // C5, E5, G5
    const masterGain = this.ctx.createGain();

    masterGain.gain.setValueAtTime(0.2, startTime);
    masterGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.45);
    masterGain.connect(this.ctx.destination);

    freqs.forEach(freq => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      osc.frequency.linearRampToValueAtTime(freq * 1.05, startTime + 0.4);
      osc.connect(masterGain);

      osc.start(startTime);
      osc.stop(startTime + 0.45);
    });
  }

  /**
   * 4. 'freeze': cybernetyczny paraliż profesora przez AI (fala prostokątna)
   * Glitchujący, 8-bitowy staccato/arpeggio efekt zamrożenia
   */
  _playFreeze(startTime) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';

    // Cyber-glitch sekwencja częstotliwości
    const tones = [880, 440, 880, 220, 1100, 330];
    const stepDuration = 0.045;

    tones.forEach((tone, idx) => {
      osc.frequency.setValueAtTime(tone, startTime + idx * stepDuration);
    });

    gain.gain.setValueAtTime(0.18, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + tones.length * stepDuration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + tones.length * stepDuration);
  }

  /**
   * 5. 'hit': faul / przegrana „Kampania Wrześniowa” (dramatycznie opadający bas)
   * Pitch bend: 220 Hz -> 40 Hz
   */
  _playHit(startTime) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';

    // Opadający, ciężki bas porażki
    osc.frequency.setValueAtTime(220, startTime);
    osc.frequency.exponentialRampToValueAtTime(42, startTime + 0.48);

    gain.gain.setValueAtTime(0.3, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.5);
  }

  /**
   * 6. 'win': krótka, triumfalna 4-tonowa fanfara zaliczenia sesji
   * Nuty: C5 (523.25 Hz), E5 (659.25 Hz), G5 (783.99 Hz), C6 (1046.50 Hz)
   */
  _playWin(startTime) {
    const notes = [
      { freq: 523.25, dur: 0.12 }, // C5
      { freq: 659.25, dur: 0.12 }, // E5
      { freq: 783.99, dur: 0.12 }, // G5
      { freq: 1046.50, dur: 0.45 } // C6
    ];

    let noteStart = startTime;
    notes.forEach(({ freq, dur }) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteStart);

      gain.gain.setValueAtTime(0.28, noteStart);
      gain.gain.exponentialRampToValueAtTime(0.001, noteStart + dur);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(noteStart);
      osc.stop(noteStart + dur);

      noteStart += dur * 0.9;
    });
  }

  // Pomocnicze aliasy kompatybilności wstecznej
  playCollectEcts() { this.play('ects'); }
  playCoffee() { this.play('coffee'); }
  playShield() { this.play('shield'); }
  playLionRoar() { this.play('freeze'); }
  playFreeze() { this.play('freeze'); }
  playAlert() { this.play('shield'); }
  playGameOver() { this.play('hit'); }
  playVictory() { this.play('win'); }
}

// Eksport instancji oraz klasy
export const audio = new SoundSystem();
export default SoundSystem;

// Rejestracja globalna w oknie przeglądarki
if (typeof window !== 'undefined') {
  window.SoundSystem = SoundSystem;
  window.gameAudio = audio;
}
