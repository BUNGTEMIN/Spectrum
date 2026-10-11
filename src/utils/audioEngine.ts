/**
 * Audio Engine utilizing Web Audio API:
 * - AudioContext & AnalyserNode
 * - MediaElementAudioSourceNode
 * - IIRFilterNode for dynamic low-frequency Bass Boost
 * - MediaStreamAudioDestinationNode for video recording
 * - Built-in procedural demo synth generator (EDM / Synthwave beats)
 */

/**
 * Calculates 2nd-order (biquad) Low-Shelf IIR filter coefficients
 * based on the Audio EQ Cookbook by Robert Bristow-Johnson.
 * Amplifies frequencies below cutoffHz by gainDb while leaving higher bands unaffected.
 */
function calculateLowShelfIIRCoefficients(
  sampleRate: number,
  cutoffHz: number,
  gainDb: number
): { feedforward: number[]; feedback: number[] } {
  if (Math.abs(gainDb) < 0.1) {
    // Pure bypass (unity gain)
    return {
      feedforward: [1, 0, 0],
      feedback: [1, 0, 0],
    };
  }

  const A = Math.pow(10, gainDb / 40);
  const w0 = (2 * Math.PI * cutoffHz) / sampleRate;
  const cosW0 = Math.cos(w0);
  const sinW0 = Math.sin(w0);
  const alpha = (sinW0 / 2) * Math.SQRT2;
  const twoSqrtAAlpha = 2 * Math.sqrt(A) * alpha;

  const b0 = A * ((A + 1) - (A - 1) * cosW0 + twoSqrtAAlpha);
  const b1 = 2 * A * ((A - 1) - (A + 1) * cosW0);
  const b2 = A * ((A + 1) - (A - 1) * cosW0 - twoSqrtAAlpha);

  const a0 = (A + 1) + (A - 1) * cosW0 + twoSqrtAAlpha;
  const a1 = -2 * ((A - 1) + (A + 1) * cosW0);
  const a2 = (A + 1) + (A - 1) * cosW0 - twoSqrtAAlpha;

  return {
    feedforward: [b0 / a0, b1 / a0, b2 / a0],
    feedback: [1, a1 / a0, a2 / a0],
  };
}

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private streamDest: MediaStreamAudioDestinationNode | null = null;
  private gainNode: GainNode | null = null;
  private bassFilterNode: IIRFilterNode | null = null;
  private currentBassBoostDb: number = 0;
  private audioElement: HTMLAudioElement | HTMLVideoElement | null = null;
  private connectedElements: WeakMap<HTMLMediaElement, MediaElementAudioSourceNode> = new WeakMap();
  private dataArray: Uint8Array<ArrayBuffer> | null = null;
  private timeDataArray: Uint8Array<ArrayBuffer> | null = null;

  // Synthesized demo generator state
  private demoOscillators: { stop: () => void }[] = [];
  private isDemoPlaying = false;
  private demoTimer: number | null = null;

  constructor() {
    // AudioContext will be lazily created on user interaction
  }

  public getAudioContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();
      
      this.gainNode = this.ctx.createGain();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 1024;
      this.analyser.smoothingTimeConstant = 0.82;
      
      this.streamDest = this.ctx.createMediaStreamDestination();
      
      // Connect gainNode -> IIRFilter -> analyser -> destinations
      this.applyBassFilter(this.currentBassBoostDb);

      this.analyser.connect(this.ctx.destination);
      this.analyser.connect(this.streamDest);

      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(new ArrayBuffer(bufferLength));
      this.timeDataArray = new Uint8Array(new ArrayBuffer(bufferLength));
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    return this.ctx;
  }

  public setBassBoost(gainDb: number) {
    this.currentBassBoostDb = Math.max(0, Math.min(24, gainDb));
    this.applyBassFilter(this.currentBassBoostDb);
  }

  public getBassBoost(): number {
    return this.currentBassBoostDb;
  }

  private applyBassFilter(gainDb: number) {
    if (!this.ctx || !this.gainNode || !this.analyser) {
      return;
    }

    const sampleRate = this.ctx.sampleRate || 44100;
    const cutoff = 150; // Low-shelf cutoff around 150Hz for punchy sub-bass & bass
    const { feedforward, feedback } = calculateLowShelfIIRCoefficients(sampleRate, cutoff, gainDb);

    try {
      const newFilter = this.ctx.createIIRFilter(feedforward, feedback);

      if (this.bassFilterNode) {
        try {
          this.gainNode.disconnect(this.bassFilterNode);
          this.bassFilterNode.disconnect();
        } catch {
          // ignore
        }
      } else {
        try {
          this.gainNode.disconnect(this.analyser);
        } catch {
          // ignore
        }
      }

      this.bassFilterNode = newFilter;
      this.gainNode.connect(this.bassFilterNode);
      this.bassFilterNode.connect(this.analyser);
    } catch (err) {
      console.warn('Failed to configure IIRFilterNode for bass boost:', err);
    }
  }

  public getStreamDestination(): MediaStreamAudioDestinationNode | null {
    this.getAudioContext();
    return this.streamDest;
  }

  public updateSettings(fftSize: number, smoothing: number) {
    if (this.analyser) {
      if (this.analyser.fftSize !== fftSize) {
        this.analyser.fftSize = fftSize;
        const bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(new ArrayBuffer(bufferLength));
        this.timeDataArray = new Uint8Array(new ArrayBuffer(bufferLength));
      }
      this.analyser.smoothingTimeConstant = Math.max(0, Math.min(0.99, smoothing));
    }
  }

  public connectMediaElement(element: HTMLAudioElement | HTMLVideoElement) {
    const ctx = this.getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    // Stop synth demo if playing
    this.stopDemo();

    this.audioElement = element;

    if (!this.connectedElements.has(element)) {
      try {
        const node = ctx.createMediaElementSource(element);
        if (this.gainNode) {
          node.connect(this.gainNode);
        }
        this.connectedElements.set(element, node);
        this.sourceNode = node;
      } catch (err) {
        console.warn('Could not create MediaElementSource (already connected):', err);
      }
    } else {
      this.sourceNode = this.connectedElements.get(element) || null;
    }
  }

  public setVolume(volume: number) {
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), this.ctx.currentTime);
    }
  }

  public getFrequencyData(): Uint8Array {
    if (this.analyser && this.dataArray) {
      this.analyser.getByteFrequencyData(this.dataArray);
      return this.dataArray;
    }
    return new Uint8Array(0);
  }

  public getTimeDomainData(): Uint8Array {
    if (this.analyser && this.timeDataArray) {
      this.analyser.getByteTimeDomainData(this.timeDataArray);
      return this.timeDataArray;
    }
    return new Uint8Array(0);
  }

  /**
   * Calculates sub-bass energy (roughly 20Hz - 160Hz) normalized between 0.0 and 1.0
   */
  public getBassEnergy(sensitivity: number = 1.0): { bass: number; mid: number; treble: number } {
    if (!this.analyser || !this.dataArray) {
      return { bass: 0, mid: 0, treble: 0 };
    }

    this.analyser.getByteFrequencyData(this.dataArray);
    const binCount = this.analyser.frequencyBinCount;
    if (binCount === 0) return { bass: 0, mid: 0, treble: 0 };

    // Sub-bass & Bass: lower 6% of spectrum (roughly 20 - 250 Hz with 44.1kHz sample rate)
    const bassEnd = Math.max(2, Math.floor(binCount * 0.08));
    let bassSum = 0;
    for (let i = 0; i < bassEnd; i++) {
      bassSum += this.dataArray[i];
    }
    const rawBass = bassSum / (bassEnd * 255);

    // Mid: next 25% of spectrum (roughly 250 - 2000 Hz)
    const midEnd = Math.floor(binCount * 0.35);
    let midSum = 0;
    for (let i = bassEnd; i < midEnd; i++) {
      midSum += this.dataArray[i];
    }
    const rawMid = midSum / ((midEnd - bassEnd) * 255);

    // Treble: high end
    let trebleSum = 0;
    const trebleEnd = Math.floor(binCount * 0.85);
    for (let i = midEnd; i < trebleEnd; i++) {
      trebleSum += this.dataArray[i];
    }
    const rawTreble = trebleSum / ((trebleEnd - midEnd) * 255);

    // Apply sensitivity curve (exponential response gives punchier beat feel)
    const bass = Math.min(1.5, Math.pow(rawBass * 1.3, 1.4) * sensitivity);
    const mid = Math.min(1.2, rawMid * sensitivity);
    const treble = Math.min(1.2, rawTreble * sensitivity);

    return { bass, mid, treble };
  }

  /**
   * Built-in Synthesizer for instant Demo Beat:
   * Generates a 124 BPM synthwave/EDM electronic rhythm (punchy kick, deep bass arp, hi-hats, synth lead)
   * so user can see and hear the visualizer in full glory right away!
   */
  public startDemoTrack(onStep?: (step: number) => void): boolean {
    const ctx = this.getAudioContext();
    this.stopDemo();
    this.isDemoPlaying = true;

    const bpm = 126;
    const stepDuration = 60 / bpm / 4; // 16th note
    let currentStep = 0;

    // Bass notes progression (synthwave in D minor)
    const bassNotes = [36.71, 36.71, 41.20, 43.65, 36.71, 36.71, 49.00, 43.65]; // D1, D1, E1, F1, D1, D1, G1, F1
    const leadNotes = [293.66, 329.63, 349.23, 440.00, 392.00, 349.23, 329.63, 293.66]; // D4, E4, F4, A4, G4, F4, E4, D4

    const playStep = () => {
      if (!this.isDemoPlaying || !this.gainNode || !this.ctx) return;
      const t = this.ctx.currentTime;

      // 1. Kick Drum on beats 0, 4, 8, 12 (Four on the floor)
      if (currentStep % 4 === 0) {
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.frequency.setValueAtTime(140, t);
        kickOsc.frequency.exponentialRampToValueAtTime(32, t + 0.12);
        
        kickGain.gain.setValueAtTime(0.9, t);
        kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

        kickOsc.connect(kickGain);
        kickGain.connect(this.gainNode);
        kickOsc.start(t);
        kickOsc.stop(t + 0.3);
      }

      // 2. Snare / Clap on beats 4, 12
      if (currentStep % 8 === 4) {
        // Noise buffer for snappy snare
        const bufferSize = this.ctx.sampleRate * 0.15;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.setValueAtTime(1000, t);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.4, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.gainNode);
        noise.start(t);
        noise.stop(t + 0.2);
      }

      // 3. Hi-Hat on offbeats (2, 6, 10, 14) and 16ths
      if (currentStep % 2 === 1) {
        const bufferSize = this.ctx.sampleRate * 0.04;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const hat = this.ctx.createBufferSource();
        hat.buffer = buffer;
        const hatFilter = this.ctx.createBiquadFilter();
        hatFilter.type = 'highpass';
        hatFilter.frequency.setValueAtTime(7000, t);

        const hatGain = this.ctx.createGain();
        const isAccent = currentStep % 4 === 2;
        hatGain.gain.setValueAtTime(isAccent ? 0.25 : 0.12, t);
        hatGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

        hat.connect(hatFilter);
        hatFilter.connect(hatGain);
        hatGain.connect(this.gainNode);
        hat.start(t);
        hat.stop(t + 0.06);
      }

      // 4. Heavy Sub Synth Bass (Offbeat pump)
      if (currentStep % 2 === 0) {
        const noteIdx = Math.floor(currentStep / 4) % bassNotes.length;
        const bassFreq = bassNotes[noteIdx];

        const bassOsc = this.ctx.createOscillator();
        bassOsc.type = 'sawtooth';
        bassOsc.frequency.setValueAtTime(bassFreq, t);

        const bassFilter = this.ctx.createBiquadFilter();
        bassFilter.type = 'lowpass';
        bassFilter.frequency.setValueAtTime(450, t);
        bassFilter.frequency.exponentialRampToValueAtTime(120, t + 0.15);

        const bassGain = this.ctx.createGain();
        bassGain.gain.setValueAtTime(0.55, t);
        bassGain.gain.exponentialRampToValueAtTime(0.01, t + 0.22);

        bassOsc.connect(bassFilter);
        bassFilter.connect(bassGain);
        bassGain.connect(this.gainNode);
        bassOsc.start(t);
        bassOsc.stop(t + 0.23);
      }

      // 5. Arpeggio Synth Melody
      if (currentStep % 2 === 0 || currentStep % 3 === 0) {
        const leadIdx = (currentStep + Math.floor(currentStep / 16)) % leadNotes.length;
        const leadFreq = leadNotes[leadIdx];

        const leadOsc = this.ctx.createOscillator();
        leadOsc.type = 'triangle';
        leadOsc.frequency.setValueAtTime(leadFreq, t);

        const leadGain = this.ctx.createGain();
        leadGain.gain.setValueAtTime(0.2, t);
        leadGain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

        leadOsc.connect(leadGain);
        leadGain.connect(this.gainNode);
        leadOsc.start(t);
        leadOsc.stop(t + 0.15);
      }

      if (onStep) onStep(currentStep);

      currentStep = (currentStep + 1) % 64;
      this.demoTimer = window.setTimeout(playStep, stepDuration * 1000);
    };

    playStep();
    return true;
  }

  public stopDemo() {
    this.isDemoPlaying = false;
    if (this.demoTimer !== null) {
      clearTimeout(this.demoTimer);
      this.demoTimer = null;
    }
  }

  public isDemoActive(): boolean {
    return this.isDemoPlaying;
  }
}

export const globalAudioEngine = new AudioEngine();
