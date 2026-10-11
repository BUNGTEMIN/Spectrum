import { VisualizerConfig, ParticleType, ThemeMode } from '../types/visualizer';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  maxAlpha: number;
  color: string;
  angle: number;
  speed: number;
}

export class VisualizerRenderer {
  private particles: Particle[] = [];
  private currentRotation: number = 0;
  private coverRotation: number = 0;
  private smoothedBass: number = 0;
  private beatPulseIntensity: number = 0;
  private defaultCoverCanvas: HTMLCanvasElement | null = null;

  // High-frequency transient detection & visual shake physics
  private lastHighFreqEnergy: number = 0;
  private hfRunningAvg: number = 0;
  private transientShakeEnergy: number = 0;
  private transientShakeAngle: number = 0;
  private transientRotationalVelocity: number = 0;
  private transientFlashIntensity: number = 0;

  constructor() {
    this.createDefaultCoverArt();
  }

  /**
   * Generates a procedural high-res Avee Player album cover art
   * (glowing neon glyph with vinyl ridges and gradient)
   */
  private createDefaultCoverArt() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Deep dark vinyl disc background
    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();

    // Subtle concentric vinyl grooves
    for (let r = 80; r < size / 2 - 20; r += 14) {
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Inner glowing ring
    const grad = ctx.createLinearGradient(100, 100, 400, 400);
    grad.addColorStop(0, '#06b6d4');
    grad.addColorStop(0.5, '#8b5cf6');
    grad.addColorStop(1, '#ec4899');

    ctx.beginPath();
    ctx.arc(size / 2, size / 2, 130, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = grad;
    ctx.stroke();

    // Center emblem (Stylized Avee Player Audio Waveform Bars)
    ctx.save();
    ctx.translate(size / 2, size / 2);
    const barCount = 7;
    const barHeights = [24, 48, 72, 96, 72, 48, 24];
    const totalW = barCount * 14;
    for (let i = 0; i < barCount; i++) {
      const x = -totalW / 2 + i * 14;
      const h = barHeights[i];
      const barGrad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
      barGrad.addColorStop(0, '#22d3ee');
      barGrad.addColorStop(1, '#c084fc');
      ctx.fillStyle = barGrad;
      ctx.beginPath();
      ctx.roundRect(x, -h / 2, 8, h, 4);
      ctx.fill();
    }
    ctx.restore();

    this.defaultCoverCanvas = canvas;
  }

  public initParticles(width: number, height: number, count: number, _type: ParticleType) {
    this.particles = [];
    const centerX = width / 2;
    const centerY = height / 2;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * Math.max(width, height) * 0.6;
      const speed = 0.4 + Math.random() * 1.6;

      this.particles.push({
        x: centerX + Math.cos(angle) * dist,
        y: centerY + Math.sin(angle) * dist,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 1 + Math.random() * 2.5,
        alpha: Math.random() * 0.6 + 0.2,
        maxAlpha: Math.random() * 0.5 + 0.4,
        color: Math.random() > 0.4 ? '#38bdf8' : '#c084fc',
        angle,
        speed,
      });
    }
  }

  /**
   * Main render loop executing each animation frame
   */
  public render(
    canvas: HTMLCanvasElement,
    freqData: Uint8Array,
    timeData: Uint8Array,
    bassEnergy: { bass: number; mid: number; treble: number },
    config: VisualizerConfig,
    coverImg: HTMLImageElement | null,
    bgImg: HTMLImageElement | null,
    bgVideo: HTMLVideoElement | null,
    theme: ThemeMode = 'dark'
  ) {
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    // Smooth bass transition for fluid bounce
    this.smoothedBass += (bassEnergy.bass - this.smoothedBass) * 0.28;
    const bass = this.smoothedBass;

    // HIGH-FREQUENCY TRANSIENT PEAK DETECTION & VISUAL SHAKE:
    // Analyzes high-frequency spectrum bands (>3.2kHz) and waveform derivatives to detect
    // sharp percussive attacks (snares, claps, hi-hats, rimshots, clicks, electronic stabs).
    const isTransientShakeEnabled = config.transientShake ?? true;
    const transientSens = config.pulseSensitivity ?? 1.0;
    const transientIntensity = config.transientShakeIntensity ?? 1.2;

    const transientPeak = this.detectHighFrequencyTransient(freqData, timeData, transientSens);

    if (isTransientShakeEnabled && transientPeak > 0.08) {
      // Inject instant high-velocity transient impulse
      const impulse = transientPeak * transientIntensity;
      this.transientShakeEnergy = Math.min(3.5, this.transientShakeEnergy + impulse * 1.35);
      // Sharp randomized directional vector for electric jitter
      this.transientShakeAngle = Math.random() * Math.PI * 2;
      // Rotational jolt around canvas center
      this.transientRotationalVelocity = (Math.random() - 0.5) * 0.045 * Math.min(2.0, impulse);
      // High-frequency electric flash intensity
      this.transientFlashIntensity = Math.min(1.0, this.transientFlashIntensity + impulse * 0.45);
    } else {
      // Snappy exponential release (~50-80ms envelope for crisp percussive feel)
      this.transientShakeEnergy *= 0.82;
      this.transientRotationalVelocity *= 0.80;
      this.transientFlashIntensity *= 0.84;
    }

    // Camera shake offset & high-frequency transient jitter calculations
    let offsetX = 0;
    let offsetY = 0;
    let rotShake = 0;
    let transientScale = 1.0;

    // 1. Bass Rumble Shake (if cameraShake is enabled on heavy kicks)
    if (config.cameraShake && bass > 0.55) {
      const shakeMag = (bass - 0.55) * 8;
      offsetX += (Math.random() - 0.5) * shakeMag;
      offsetY += (Math.random() - 0.5) * shakeMag;
    }

    // 2. High-Frequency Transient Peak Shake (fast electric jitter + rotational jolt + micro-zoom shock)
    if (isTransientShakeEnabled && this.transientShakeEnergy > 0.02) {
      const now = performance.now();
      const fastOsc = Math.sin(now * 0.065);
      const fastOsc2 = Math.cos(now * 0.088);
      const tMag = this.transientShakeEnergy * 10.5 * transientIntensity;

      // Fast multi-directional jitter
      offsetX += (Math.cos(this.transientShakeAngle) * 0.65 + fastOsc * 0.35 + (Math.random() - 0.5) * 0.45) * tMag;
      offsetY += (Math.sin(this.transientShakeAngle) * 0.65 + fastOsc2 * 0.35 + (Math.random() - 0.5) * 0.45) * tMag;

      // Angular micro-rotation jolt
      rotShake += this.transientRotationalVelocity * (0.85 + 0.15 * fastOsc);

      // Micro-zoom bounce surge
      transientScale += Math.min(0.08, this.transientShakeEnergy * 0.025 * transientIntensity);
    }

    // 1. Draw Background / Motion Blur Trail Clear
    // When particleTrails is enabled, uses semi-transparent fillRect with alpha instead of full opaque clear
    this.drawBackground(ctx, width, height, config, bgImg, bgVideo, bass, theme);

    // Apply Center-Pivot Multi-Axis Shake (Translation + Rotation + Zoom Surge)
    ctx.save();
    ctx.translate(centerX + offsetX, centerY + offsetY);
    if (rotShake !== 0) {
      ctx.rotate(rotShake);
    }
    if (transientScale !== 1.0) {
      ctx.scale(transientScale, transientScale);
    }
    ctx.translate(-centerX, -centerY);

    // High-frequency transient shockwave ripple on sharp peaks
    if (isTransientShakeEnabled && this.transientShakeEnergy > 0.4) {
      const shockwaveAlpha = Math.min(0.35, (this.transientShakeEnergy - 0.4) * 0.22 * transientIntensity);
      ctx.save();
      ctx.beginPath();
      const waveRadius = config.innerRadius * (1.1 + (1 - this.transientShakeEnergy / 3.5) * 0.85);
      ctx.arc(centerX, centerY, waveRadius, 0, Math.PI * 2);
      ctx.strokeStyle = config.accentColor || '#ec4899';
      ctx.lineWidth = Math.max(1, 2.5 * this.transientShakeEnergy * transientIntensity);
      ctx.globalAlpha = shockwaveAlpha;
      ctx.stroke();
      ctx.restore();
    }

    // High-frequency transient electric flash
    if (isTransientShakeEnabled && this.transientFlashIntensity > 0.3) {
      const flashAlpha = Math.min(0.18, (this.transientFlashIntensity - 0.3) * 0.2 * transientIntensity);
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = config.accentColor || '#38bdf8';
      ctx.globalAlpha = flashAlpha;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }

    // 2. Draw Floating & Bursting Particles
    this.drawParticles(ctx, width, height, config, bass, theme);

    // 3. Update Visualizer Rotations
    let rotSpeed = (config.rotationSpeed * 0.003);
    if (config.reactRotation) {
      rotSpeed += bass * 0.008;
    }
    this.currentRotation += rotSpeed;

    if (config.spinCover) {
      this.coverRotation += config.coverSpinSpeed * 0.008;
    }

    // 4. Draw Radial / Linear Spectrum Visualizer
    ctx.save();
    ctx.translate(centerX, centerY);

    // PULSE SENSITIVITY & BEAT THRESHOLD DETECTION:
    // Adjusts the threshold of detected beat frequencies to trigger visual size shifts more accurately.
    const pulseSens = Math.max(0.1, config.pulseSensitivity ?? 1.0);
    // Dynamic threshold: higher sensitivity lowers threshold (triggers on subtler beats);
    // lower sensitivity raises threshold (requires powerful kick beats).
    const beatThreshold = Math.max(0.06, Math.min(0.85, 0.68 - (pulseSens - 0.5) * 0.26));
    
    // Check if instantaneous low-frequency beat energy exceeds the threshold
    const rawBeatEnergy = bassEnergy.bass;
    let targetPulse = 0;
    if (rawBeatEnergy > beatThreshold) {
      const excess = rawBeatEnergy - beatThreshold;
      targetPulse = Math.min(1.8, (excess / Math.max(0.1, 1 - beatThreshold)) * Math.sqrt(pulseSens) * 1.4);
    }

    // Dynamic attack/decay envelope for clean, punchy rhythmic size shifts
    if (targetPulse > this.beatPulseIntensity) {
      this.beatPulseIntensity += (targetPulse - this.beatPulseIntensity) * 0.72; // Snappy attack on kick
    } else {
      this.beatPulseIntensity *= 0.86; // Smooth musical decay
    }

    // Visual size shift (pulseScale) triggered accurately by detected beat frequencies exceeding threshold
    const pulseShift = this.beatPulseIntensity * config.pulseIntensity;
    const pulseScale = 1 + pulseShift;
    ctx.scale(pulseScale, pulseScale);

    // Draw Spectrum Bars
    this.drawSpectrum(ctx, freqData, timeData, config, bass);

    // Draw Center Album Cover Art with Glow Border
    if (config.showCoverArt && config.style !== 'linear-bars') {
      this.drawCenterCover(ctx, config, coverImg, bass);
    }

    ctx.restore();

    // 5. Draw Track Title / Artist if enabled
    if (config.showTrackInfo && (config.trackTitle || config.trackArtist)) {
      this.drawTrackMetadata(ctx, width, height, config, theme);
    }

    ctx.restore();
  }

  /**
   * Detects high-frequency transient peaks in audio data (e.g. sharp snares, claps, hi-hats, percussive clicks).
   * Calculates spectral flux across upper bands (>3.2kHz) and waveform derivatives to measure onset strength.
   * Returns a normalized transient onset intensity (0.0 to 2.5+).
   */
  private detectHighFrequencyTransient(
    freqData: Uint8Array,
    timeData: Uint8Array,
    sensitivity: number = 1.0
  ): number {
    const binCount = freqData.length;
    if (binCount === 0) return 0;

    // Upper frequency spectrum: roughly 3.2 kHz to 18+ kHz
    const startBin = Math.max(1, Math.floor(binCount * 0.28));
    const endBin = Math.max(startBin + 1, Math.floor(binCount * 0.92));

    let weightedSum = 0;
    let count = 0;
    for (let i = startBin; i < endBin; i++) {
      const normalizedAmp = freqData[i] / 255;
      // High-frequency weighting curve to balance natural 1/f spectral roll-off in audio
      const weight = 1 + ((i - startBin) / (endBin - startBin)) * 1.8;
      weightedSum += normalizedAmp * weight;
      count++;
    }

    const currentEnergy = count > 0 ? (weightedSum / count) : 0;

    // Spectral flux (positive high-frequency rate of change)
    const flux = Math.max(0, currentEnergy - this.lastHighFreqEnergy);
    this.lastHighFreqEnergy = currentEnergy;

    // Adaptive running average with smooth decay
    if (this.hfRunningAvg === 0) {
      this.hfRunningAvg = currentEnergy;
    } else {
      this.hfRunningAvg = this.hfRunningAvg * 0.88 + currentEnergy * 0.12;
    }

    // Dynamic threshold scaled by sensitivity
    const sensMultiplier = Math.max(0.2, sensitivity);
    const fluxThreshold = 0.038 / sensMultiplier;
    const ratioAboveAvg = this.hfRunningAvg > 0.008 ? (currentEnergy / this.hfRunningAvg) : 1.0;

    // Time domain sharpness check (waveform delta / steep crests)
    let timeDomainTransient = 0;
    if (timeData && timeData.length > 0) {
      let maxDelta = 0;
      const step = Math.max(1, Math.floor(timeData.length / 64));
      for (let i = step; i < timeData.length; i += step) {
        const d = Math.abs(timeData[i] - timeData[i - step]) / 255;
        if (d > maxDelta) maxDelta = d;
      }
      if (maxDelta > 0.26) {
        timeDomainTransient = (maxDelta - 0.26) * 1.6;
      }
    }

    let transientPeakStrength = 0;
    // Trigger condition: significant positive flux AND energy noticeably above local average
    if ((flux > fluxThreshold && ratioAboveAvg > 1.2) || flux > (fluxThreshold * 2.2) || timeDomainTransient > 0.3) {
      const fluxSurge = Math.max(0, flux - fluxThreshold * 0.5);
      const ratioSurge = Math.max(0, ratioAboveAvg - 1.0);
      transientPeakStrength = (fluxSurge * 9.0 + ratioSurge * 0.45 + timeDomainTransient * 0.8) * Math.sqrt(sensMultiplier);
    }

    return Math.min(2.5, transientPeakStrength);
  }

  private drawBackground(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    config: VisualizerConfig,
    bgImg: HTMLImageElement | null,
    bgVideo: HTMLVideoElement | null,
    bass: number,
    theme: ThemeMode
  ) {
    const isDark = theme === 'dark';
    const trailAlpha = config.trailPersistence ?? 0.2;

    // PARTICLE TRAILS MOTION BLUR:
    // When enabled, modify the CanvasVisualizer to use a semi-transparent clearRect approach
    // (e.g., fillRect with alpha) instead of a full clear, creating a motion blur trail effect.
    if (config.particleTrails) {
      if (config.bgType === 'video' && bgVideo && bgVideo.readyState >= 2) {
        ctx.save();
        ctx.globalAlpha = Math.max(0.1, trailAlpha);
        const vRatio = bgVideo.videoWidth / bgVideo.videoHeight;
        const cRatio = width / height;
        let dw = width;
        let dh = height;
        let dx = 0;
        let dy = 0;
        if (vRatio > cRatio) {
          dw = height * vRatio;
          dx = (width - dw) / 2;
        } else {
          dh = width / vRatio;
          dy = (height - dh) / 2;
        }
        ctx.drawImage(bgVideo, dx, dy, dw, dh);
        ctx.restore();

        if (config.bgDim > 0) {
          ctx.fillStyle = isDark
            ? `rgba(5, 7, 15, ${trailAlpha * (config.bgDim + 0.3)})`
            : `rgba(240, 244, 248, ${trailAlpha * (config.bgDim + 0.3)})`;
          ctx.fillRect(0, 0, width, height);
        }
      } else if (config.bgType === 'image' && bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
        ctx.save();
        ctx.globalAlpha = Math.max(0.1, trailAlpha);
        const iRatio = bgImg.naturalWidth / bgImg.naturalHeight;
        const cRatio = width / height;
        let dw = width;
        let dh = height;
        let dx = 0;
        let dy = 0;
        if (iRatio > cRatio) {
          dw = height * iRatio;
          dx = (width - dw) / 2;
        } else {
          dh = width / iRatio;
          dy = (height - dh) / 2;
        }
        ctx.drawImage(bgImg, dx, dy, dw, dh);
        ctx.restore();

        if (config.bgDim > 0) {
          ctx.fillStyle = isDark
            ? `rgba(5, 7, 15, ${trailAlpha * (config.bgDim + 0.3)})`
            : `rgba(240, 244, 248, ${trailAlpha * (config.bgDim + 0.3)})`;
          ctx.fillRect(0, 0, width, height);
        }
      } else if (config.bgType === 'ambient') {
        const grad = ctx.createRadialGradient(
          width / 2,
          height / 2,
          config.innerRadius * 0.5,
          width / 2,
          height / 2,
          Math.max(width, height) * 0.75
        );
        if (isDark) {
          const alphaGlow = 0.12 + bass * 0.15;
          grad.addColorStop(0, `rgba(14, 165, 233, ${alphaGlow * trailAlpha * 1.6})`);
          grad.addColorStop(0.4, `rgba(139, 92, 246, ${alphaGlow * 0.7 * trailAlpha * 1.6})`);
          grad.addColorStop(1, `rgba(5, 7, 15, ${trailAlpha})`);
        } else {
          const alphaGlow = 0.2 + bass * 0.18;
          grad.addColorStop(0, `rgba(6, 182, 212, ${alphaGlow * trailAlpha * 1.6})`);
          grad.addColorStop(0.45, `rgba(168, 85, 247, ${alphaGlow * 0.6 * trailAlpha * 1.6})`);
          grad.addColorStop(1, `rgba(241, 245, 249, ${trailAlpha})`);
        }
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      } else {
        // Solid background mode: apply semi-transparent clear wash with alpha
        ctx.fillStyle = isDark
          ? `rgba(6, 8, 16, ${trailAlpha})`
          : `rgba(248, 250, 252, ${trailAlpha})`;
        ctx.fillRect(0, 0, width, height);
      }
      return;
    }

    // STANDARD FULL CLEAR / OPAQUE BACKGROUND MODE:
    if (config.bgType === 'video' && bgVideo && bgVideo.readyState >= 2) {
      // Draw video frame to cover canvas
      const vRatio = bgVideo.videoWidth / bgVideo.videoHeight;
      const cRatio = width / height;
      let dw = width;
      let dh = height;
      let dx = 0;
      let dy = 0;

      if (vRatio > cRatio) {
        dw = height * vRatio;
        dx = (width - dw) / 2;
      } else {
        dh = width / vRatio;
        dy = (height - dh) / 2;
      }

      ctx.drawImage(bgVideo, dx, dy, dw, dh);

      // Apply dimming / tint overlay
      if (config.bgDim > 0) {
        ctx.fillStyle = theme === 'dark' ? `rgba(5, 7, 15, ${config.bgDim})` : `rgba(240, 244, 248, ${config.bgDim * 0.8})`;
        ctx.fillRect(0, 0, width, height);
      }
    } else if (config.bgType === 'image' && bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
      // Draw image background
      const iRatio = bgImg.naturalWidth / bgImg.naturalHeight;
      const cRatio = width / height;
      let dw = width;
      let dh = height;
      let dx = 0;
      let dy = 0;

      if (iRatio > cRatio) {
        dw = height * iRatio;
        dx = (width - dw) / 2;
      } else {
        dh = width / iRatio;
        dy = (height - dh) / 2;
      }

      ctx.drawImage(bgImg, dx, dy, dw, dh);

      if (config.bgDim > 0) {
        ctx.fillStyle = theme === 'dark' ? `rgba(5, 7, 15, ${config.bgDim})` : `rgba(240, 244, 248, ${config.bgDim * 0.8})`;
        ctx.fillRect(0, 0, width, height);
      }
    } else if (config.bgType === 'ambient') {
      // Dynamic ambient radial glow reacting to bass
      const grad = ctx.createRadialGradient(
        width / 2,
        height / 2,
        config.innerRadius * 0.5,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.75
      );
      if (theme === 'dark') {
        const alphaGlow = 0.12 + bass * 0.15;
        grad.addColorStop(0, `rgba(14, 165, 233, ${alphaGlow})`);
        grad.addColorStop(0.4, `rgba(139, 92, 246, ${alphaGlow * 0.7})`);
        grad.addColorStop(1, '#05070f');
      } else {
        const alphaGlow = 0.2 + bass * 0.18;
        grad.addColorStop(0, `rgba(6, 182, 212, ${alphaGlow})`);
        grad.addColorStop(0.45, `rgba(168, 85, 247, ${alphaGlow * 0.6})`);
        grad.addColorStop(1, '#f1f5f9');
      }

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    } else {
      // Solid mode
      if (theme === 'dark') {
        // Deep space dark
        ctx.fillStyle = '#060810';
        ctx.fillRect(0, 0, width, height);

        // Subtle center ambient vignette
        const radGrad = ctx.createRadialGradient(
          width / 2,
          height / 2,
          config.innerRadius,
          width / 2,
          height / 2,
          width * 0.65
        );
        radGrad.addColorStop(0, 'rgba(15, 23, 42, 0.45)');
        radGrad.addColorStop(1, '#04060c');
        ctx.fillStyle = radGrad;
        ctx.fillRect(0, 0, width, height);
      } else {
        // Light clean studio mode
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, width, height);

        const radGrad = ctx.createRadialGradient(
          width / 2,
          height / 2,
          config.innerRadius,
          width / 2,
          height / 2,
          width * 0.7
        );
        radGrad.addColorStop(0, 'rgba(226, 232, 240, 0.65)');
        radGrad.addColorStop(1, '#e2e8f0');
        ctx.fillStyle = radGrad;
        ctx.fillRect(0, 0, width, height);
      }
    }
  }

  private drawParticles(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    config: VisualizerConfig,
    bass: number,
    theme: ThemeMode
  ) {
    if (config.particleCount <= 0) return;

    if (this.particles.length !== config.particleCount) {
      this.initParticles(width, height, config.particleCount, config.particleType);
    }

    const centerX = width / 2;
    const centerY = height / 2;
    const isKick = config.particleExplosion && bass > 0.65;
    const isTransientHit = (config.transientShake ?? true) && this.transientShakeEnergy > 0.25;
    const speedMultiplier = config.particleSpeed * (
      (isKick ? 1 + bass * 2.8 : 1) * (isTransientHit ? 1 + this.transientShakeEnergy * 1.4 : 1)
    );

    ctx.save();

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // Update position
      p.x += p.vx * speedMultiplier;
      p.y += p.vy * speedMultiplier;

      // Wrap around screen or respawn from center on burst
      if (p.x < -20 || p.x > width + 20 || p.y < -20 || p.y > height + 20) {
        if (Math.random() > 0.5) {
          // Re-emit from center
          const angle = Math.random() * Math.PI * 2;
          const spawnDist = config.innerRadius + Math.random() * 20;
          p.x = centerX + Math.cos(angle) * spawnDist;
          p.y = centerY + Math.sin(angle) * spawnDist;
          p.vx = Math.cos(angle) * p.speed;
          p.vy = Math.sin(angle) * p.speed;
        } else {
          p.x = Math.random() * width;
          p.y = Math.random() * height;
        }
      }

      const alpha = Math.min(1, p.alpha * (isKick ? 1.6 : 1));
      ctx.globalAlpha = alpha;
      ctx.fillStyle = theme === 'dark' ? p.color : (p.color === '#c084fc' ? '#9333ea' : '#0284c7');

      if (config.particleType === 'stars' || config.particleType === 'diamonds') {
        ctx.beginPath();
        const s = p.size * (isKick ? 1.4 : 1);
        ctx.moveTo(p.x, p.y - s);
        ctx.lineTo(p.x + s, p.y);
        ctx.lineTo(p.x, p.y + s);
        ctx.lineTo(p.x - s, p.y);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (isKick ? 1.3 : 1), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  private drawSpectrum(
    ctx: CanvasRenderingContext2D,
    freqData: Uint8Array,
    timeData: Uint8Array,
    config: VisualizerConfig,
    bass: number
  ) {
    if (config.style === 'linear-bars') {
      this.drawLinearBars(ctx, freqData, timeData, config, bass);
      return;
    }

    ctx.save();
    ctx.rotate(this.currentRotation);

    const barCount = config.barCount;
    const innerRadius = config.innerRadius;
    const maxBarHeight = config.maxBarHeight;

    // Set neon glow if enabled
    if (config.glowIntensity > 0) {
      ctx.shadowBlur = config.glowIntensity;
      ctx.shadowColor = config.primaryColor;
    }

    // Prepare frequency samples mapped evenly around circle
    const samples: number[] = [];
    const dataLen = freqData.length || 1;
    for (let i = 0; i < barCount; i++) {
      let idx: number;
      if (config.style === 'radial-mirror') {
        const half = barCount / 2;
        const norm = i < half ? i / half : (barCount - i) / half;
        idx = Math.floor(Math.pow(norm, 1.4) * (dataLen * 0.7));
      } else {
        const norm = i / barCount;
        idx = Math.floor(Math.pow(norm, 1.35) * (dataLen * 0.75));
      }
      idx = Math.min(dataLen - 1, Math.max(0, idx));
      const val = (freqData[idx] || 0) / 255;
      samples.push(val);
    }

    const angleStep = (Math.PI * 2) / barCount;

    // Route drawing logic by selected Skin variant
    const skin = config.skin || 'circular-bars';

    if (skin === 'waveform-lines') {
      this.drawWaveformLinesSkin(ctx, samples, timeData, innerRadius, maxBarHeight, config, bass, angleStep);
      ctx.restore();
      return;
    }

    if (skin === 'geometric-shards') {
      this.drawGeometricShardsSkin(ctx, samples, innerRadius, maxBarHeight, config, bass, angleStep);
      ctx.restore();
      return;
    }

    if (skin === 'cyber-hex') {
      this.drawCyberHexSkin(ctx, samples, innerRadius, maxBarHeight, config, bass, angleStep);
      ctx.restore();
      return;
    }

    if (skin === 'equalizer-grid') {
      this.drawEqualizerGridSkin(ctx, samples, innerRadius, maxBarHeight, config, bass, angleStep);
      ctx.restore();
      return;
    }

    // Default Skin: 'circular-bars'
    this.drawCircularBarsSkin(ctx, samples, innerRadius, maxBarHeight, config, bass, angleStep);

    ctx.restore();
  }

  /**
   * Skin Variant: Circular Bars (Classic Avee Player Bars)
   */
  private drawCircularBarsSkin(
    ctx: CanvasRenderingContext2D,
    samples: number[],
    innerRadius: number,
    maxBarHeight: number,
    config: VisualizerConfig,
    bass: number,
    angleStep: number
  ) {
    if (config.style === 'radial-curve') {
      this.drawRadialCurve(ctx, samples, innerRadius, maxBarHeight, config, angleStep);
      return;
    }

    const barCount = samples.length;
    const barWidth = config.barWidth;

    for (let i = 0; i < barCount; i++) {
      const angle = i * angleStep;
      const val = samples[i];
      const barHeight = Math.max(3, val * maxBarHeight * (1 + bass * 0.2));

      ctx.save();
      ctx.rotate(angle);

      const grad = ctx.createLinearGradient(0, innerRadius, 0, innerRadius + barHeight);
      grad.addColorStop(0, config.primaryColor);
      grad.addColorStop(0.65, config.secondaryColor);
      grad.addColorStop(1, config.accentColor);
      ctx.fillStyle = grad;

      if (config.style === 'radial-dots') {
        const dotY = innerRadius + barHeight;
        const dotRadius = Math.max(2, barWidth * 0.8);
        ctx.beginPath();
        ctx.arc(0, dotY, dotRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 + val * 0.4})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, innerRadius);
        ctx.lineTo(0, dotY - dotRadius);
        ctx.stroke();
      } else if (config.style === 'dual-ring') {
        const inwardHeight = Math.min(innerRadius * 0.4, barHeight * 0.35);
        ctx.beginPath();
        if (config.roundCaps) {
          ctx.roundRect(-barWidth / 2, innerRadius, barWidth, barHeight, barWidth / 2);
          ctx.roundRect(-barWidth / 2, innerRadius - inwardHeight, barWidth, inwardHeight, barWidth / 2);
        } else {
          ctx.rect(-barWidth / 2, innerRadius, barWidth, barHeight);
          ctx.rect(-barWidth / 2, innerRadius - inwardHeight, barWidth, inwardHeight);
        }
        ctx.fill();
      } else {
        ctx.beginPath();
        if (config.roundCaps) {
          ctx.roundRect(-barWidth / 2, innerRadius, barWidth, barHeight, barWidth / 2);
        } else {
          ctx.rect(-barWidth / 2, innerRadius, barWidth, barHeight);
        }
        ctx.fill();

        if (val > 0.4) {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(0, innerRadius + barHeight, Math.max(1, barWidth * 0.4), 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
    }
  }

  /**
   * Skin Variant: Waveform Lines (Harmonic Oscilloscope Multi-Ribbon)
   */
  private drawWaveformLinesSkin(
    ctx: CanvasRenderingContext2D,
    samples: number[],
    timeData: Uint8Array,
    innerRadius: number,
    maxBarHeight: number,
    config: VisualizerConfig,
    bass: number,
    angleStep: number
  ) {
    const count = samples.length;
    const timeLen = timeData.length || 1;

    // Layer 1: Time-domain Oscilloscope Harmonic Ribbon
    ctx.beginPath();
    const ribbonPoints: { x: number; y: number }[] = [];
    for (let i = 0; i <= count; i++) {
      const idx = i % count;
      const angle = i * angleStep;
      const timeIdx = Math.floor((idx / count) * timeLen);
      const timeVal = ((timeData[timeIdx] || 128) - 128) / 128; // -1 to 1
      const freqVal = samples[idx];

      const r = innerRadius + (freqVal * maxBarHeight * 0.75) + (timeVal * 35 * (1 + bass));
      ribbonPoints.push({
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r,
      });
    }

    ctx.moveTo(ribbonPoints[0].x, ribbonPoints[0].y);
    for (let i = 0; i < ribbonPoints.length - 1; i++) {
      const xc = (ribbonPoints[i].x + ribbonPoints[i + 1].x) / 2;
      const yc = (ribbonPoints[i].y + ribbonPoints[i + 1].y) / 2;
      ctx.quadraticCurveTo(ribbonPoints[i].x, ribbonPoints[i].y, xc, yc);
    }
    ctx.closePath();
    ctx.lineWidth = Math.max(2, config.barWidth * 0.9);
    ctx.strokeStyle = config.primaryColor;
    ctx.stroke();

    // Subtle neon gradient fill between inner ring and outer wave
    const grad = ctx.createRadialGradient(0, 0, innerRadius, 0, 0, innerRadius + maxBarHeight);
    grad.addColorStop(0, `${config.primaryColor}15`);
    grad.addColorStop(0.7, `${config.secondaryColor}25`);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fill();

    // Layer 2: Harmonic Secondary Wave (Echo curve shifted in phase)
    ctx.beginPath();
    const echoPoints: { x: number; y: number }[] = [];
    for (let i = 0; i <= count; i++) {
      const idx = (i + Math.floor(count * 0.25)) % count;
      const angle = i * angleStep;
      const freqVal = samples[idx];
      const r = innerRadius + freqVal * maxBarHeight * 0.9 + (bass * 15);
      echoPoints.push({
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r,
      });
    }
    ctx.moveTo(echoPoints[0].x, echoPoints[0].y);
    for (let i = 0; i < echoPoints.length - 1; i++) {
      const xc = (echoPoints[i].x + echoPoints[i + 1].x) / 2;
      const yc = (echoPoints[i].y + echoPoints[i + 1].y) / 2;
      ctx.quadraticCurveTo(echoPoints[i].x, echoPoints[i].y, xc, yc);
    }
    ctx.closePath();
    ctx.lineWidth = Math.max(1.5, config.barWidth * 0.6);
    ctx.strokeStyle = config.secondaryColor;
    ctx.stroke();

    // Vertical neon phase laser rays connecting inner circle to peak wave nodes
    ctx.lineWidth = 1;
    for (let i = 0; i < count; i += 2) {
      if (samples[i] > 0.25) {
        const angle = i * angleStep;
        const p = ribbonPoints[i];
        ctx.strokeStyle = `rgba(255, 255, 255, ${samples[i] * 0.6})`;
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * innerRadius, Math.sin(angle) * innerRadius);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }
    }
  }

  /**
   * Skin Variant: Geometric Shards (Sharp Polygons & Crystalline Facets)
   */
  private drawGeometricShardsSkin(
    ctx: CanvasRenderingContext2D,
    samples: number[],
    innerRadius: number,
    maxBarHeight: number,
    config: VisualizerConfig,
    bass: number,
    angleStep: number
  ) {
    const barCount = samples.length;
    const baseW = Math.max(3, config.barWidth * 1.5);

    for (let i = 0; i < barCount; i++) {
      const val = samples[i];
      const angle = i * angleStep;
      const tipH = Math.max(4, val * maxBarHeight * (1 + bass * 0.28));

      ctx.save();
      ctx.rotate(angle);

      // Shard geometry: Angular Diamond / Arrowhead
      // Tip at (0, innerRadius + tipH)
      // Left base at (-baseW, innerRadius)
      // Right base at (+baseW, innerRadius)
      // Center waist notch at (0, innerRadius + tipH * 0.45)
      const tipY = innerRadius + tipH;
      const waistY = innerRadius + tipH * 0.45;
      const waistW = baseW * 1.4;

      // Facet A (Left Crystal Wing): Primary color
      ctx.beginPath();
      ctx.moveTo(0, tipY);
      ctx.lineTo(-waistW, waistY);
      ctx.lineTo(-baseW * 0.5, innerRadius);
      ctx.lineTo(0, innerRadius + 2);
      ctx.closePath();

      const gradA = ctx.createLinearGradient(0, innerRadius, -waistW, tipY);
      gradA.addColorStop(0, config.primaryColor);
      gradA.addColorStop(1, config.secondaryColor);
      ctx.fillStyle = gradA;
      ctx.fill();

      // Facet B (Right Crystal Wing): Secondary / Accent color
      ctx.beginPath();
      ctx.moveTo(0, tipY);
      ctx.lineTo(waistW, waistY);
      ctx.lineTo(baseW * 0.5, innerRadius);
      ctx.lineTo(0, innerRadius + 2);
      ctx.closePath();

      const gradB = ctx.createLinearGradient(0, innerRadius, waistW, tipY);
      gradB.addColorStop(0, config.secondaryColor);
      gradB.addColorStop(1, config.accentColor);
      ctx.fillStyle = gradB;
      ctx.fill();

      // Sharp specular diamond highlight edge on apex
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 + val * 0.7})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-waistW, waistY);
      ctx.lineTo(0, tipY);
      ctx.lineTo(waistW, waistY);
      ctx.stroke();

      // High-energy shard tip star flash
      if (val > 0.5) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, tipY, Math.max(1.5, baseW * 0.35), 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  /**
   * Skin Variant: Cyber Hex (Techno HUD Hexagonal Honeycomb Nodes)
   */
  private drawCyberHexSkin(
    ctx: CanvasRenderingContext2D,
    samples: number[],
    innerRadius: number,
    maxBarHeight: number,
    config: VisualizerConfig,
    bass: number,
    angleStep: number
  ) {
    const barCount = samples.length;
    const hexRadius = Math.max(3, config.barWidth * 1.2);

    for (let i = 0; i < barCount; i++) {
      const val = samples[i];
      const angle = i * angleStep;
      const dist = innerRadius + val * maxBarHeight * (1 + bass * 0.22);

      ctx.save();
      ctx.rotate(angle);

      // Connecting cyber bus line
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.15 + val * 0.45})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, innerRadius);
      ctx.lineTo(0, dist - hexRadius);
      ctx.stroke();

      // Hexagon node at peak
      const hx = 0;
      const hy = dist;
      ctx.beginPath();
      for (let h = 0; h < 6; h++) {
        const ha = (h * Math.PI) / 3;
        const px = hx + Math.sin(ha) * hexRadius;
        const py = hy + Math.cos(ha) * hexRadius;
        if (h === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();

      const grad = ctx.createLinearGradient(0, dist - hexRadius, 0, dist + hexRadius);
      grad.addColorStop(0, config.primaryColor);
      grad.addColorStop(1, config.secondaryColor);
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.strokeStyle = val > 0.4 ? '#ffffff' : config.accentColor;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Cyber tech bracket every 6 bars
      if (i % 6 === 0) {
        const bracketR = innerRadius + maxBarHeight * 1.15;
        ctx.strokeStyle = config.accentColor;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(0, 0, bracketR, -0.04, 0.04);
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  /**
   * Skin Variant: Equalizer Grid (Segmented LED Matrix VU-Meter)
   */
  private drawEqualizerGridSkin(
    ctx: CanvasRenderingContext2D,
    samples: number[],
    innerRadius: number,
    maxBarHeight: number,
    config: VisualizerConfig,
    bass: number,
    angleStep: number
  ) {
    const barCount = samples.length;
    const barW = config.barWidth;
    const maxSegments = 12;
    const segH = Math.max(3, (maxBarHeight / maxSegments) - 2.5);

    for (let i = 0; i < barCount; i++) {
      const val = samples[i];
      const angle = i * angleStep;
      const activeSegs = Math.max(1, Math.floor(val * maxSegments * (1 + bass * 0.15)));

      ctx.save();
      ctx.rotate(angle);

      for (let s = 0; s < maxSegments; s++) {
        const segY = innerRadius + s * (segH + 2.5);
        const isActive = s < activeSegs;

        if (isActive) {
          // Color progression from primary -> secondary -> accent
          const ratio = s / maxSegments;
          if (ratio < 0.5) {
            ctx.fillStyle = config.primaryColor;
          } else if (ratio < 0.8) {
            ctx.fillStyle = config.secondaryColor;
          } else {
            ctx.fillStyle = config.accentColor;
          }
          ctx.globalAlpha = 1.0;
        } else {
          // Inactive ghost segment
          ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
          ctx.globalAlpha = 0.4;
        }

        ctx.beginPath();
        if (config.roundCaps) {
          ctx.roundRect(-barW / 2, segY, barW, segH, 1.5);
        } else {
          ctx.rect(-barW / 2, segY, barW, segH);
        }
        ctx.fill();
      }

      // Peak Hold floating chip
      if (val > 0.15) {
        const peakSeg = Math.min(maxSegments - 1, activeSegs);
        const peakY = innerRadius + peakSeg * (segH + 2.5) + 3;
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.rect(-barW / 2, peakY, barW, 2);
        ctx.fill();
      }

      ctx.restore();
    }
    ctx.globalAlpha = 1.0;
  }

  private drawRadialCurve(
    ctx: CanvasRenderingContext2D,
    samples: number[],
    innerRadius: number,
    maxBarHeight: number,
    config: VisualizerConfig,
    angleStep: number
  ) {
    const count = samples.length;
    ctx.beginPath();

    const points: { x: number; y: number }[] = [];
    for (let i = 0; i <= count; i++) {
      const idx = i % count;
      const angle = i * angleStep;
      const r = innerRadius + samples[idx] * maxBarHeight;
      points.push({
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r,
      });
    }

    // Draw smooth Catmull-Rom or Cardinal curve
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 0; i < points.length - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }
    ctx.closePath();

    ctx.lineWidth = config.barWidth;
    ctx.strokeStyle = config.primaryColor;
    ctx.stroke();

    // Translucent fill
    ctx.fillStyle = `rgba(6, 182, 212, 0.15)`;
    ctx.fill();
  }

  private drawLinearBars(
    ctx: CanvasRenderingContext2D,
    freqData: Uint8Array,
    timeData: Uint8Array,
    config: VisualizerConfig,
    bass: number
  ) {
    const barCount = config.barCount;
    const totalWidth = 640;
    const startX = -totalWidth / 2;
    const barW = Math.max(2, (totalWidth / barCount) - 3);
    const skin = config.skin || 'circular-bars';

    // Map glowIntensity to canvas shadowBlur for linear bars neon aesthetic
    if (config.glowIntensity > 0) {
      ctx.shadowBlur = config.glowIntensity;
      ctx.shadowColor = config.primaryColor;
    } else {
      ctx.shadowBlur = 0;
    }

    if (skin === 'waveform-lines') {
      // Linear Waveform Lines Oscilloscope Ribbon
      const step = totalWidth / barCount;
      ctx.beginPath();
      for (let i = 0; i < barCount; i++) {
        const idx = Math.floor((i / barCount) * (freqData.length * 0.7));
        const val = (freqData[idx] || 0) / 255;
        const timeVal = (((timeData[i % timeData.length] || 128) - 128) / 128);
        const y = 100 - (val * config.maxBarHeight * 1.6) - (timeVal * 25 * (1 + bass));
        const x = startX + i * step;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.lineWidth = Math.max(2, config.barWidth * 0.9);
      ctx.strokeStyle = config.primaryColor;
      ctx.stroke();

      // Secondary wave
      ctx.beginPath();
      for (let i = 0; i < barCount; i++) {
        const idx = Math.floor(((i + 10) % barCount / barCount) * (freqData.length * 0.7));
        const val = (freqData[idx] || 0) / 255;
        const y = 100 - (val * config.maxBarHeight * 1.3);
        const x = startX + i * step;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.lineWidth = Math.max(1.5, config.barWidth * 0.6);
      ctx.strokeStyle = config.secondaryColor;
      ctx.stroke();
      return;
    }

    if (skin === 'geometric-shards') {
      // Linear Polygonal Crystalline Shards
      for (let i = 0; i < barCount; i++) {
        const idx = Math.floor((i / barCount) * (freqData.length * 0.7));
        const val = (freqData[idx] || 0) / 255;
        const h = Math.max(4, val * config.maxBarHeight * 1.6 * (1 + bass * 0.25));
        const x = startX + i * (barW + 3);
        const apexX = x + barW / 2;
        const apexY = 100 - h;

        // Left facet
        ctx.beginPath();
        ctx.moveTo(apexX, apexY);
        ctx.lineTo(x, 100);
        ctx.lineTo(apexX, 100);
        ctx.closePath();
        ctx.fillStyle = config.primaryColor;
        ctx.fill();

        // Right facet
        ctx.beginPath();
        ctx.moveTo(apexX, apexY);
        ctx.lineTo(x + barW, 100);
        ctx.lineTo(apexX, 100);
        ctx.closePath();
        ctx.fillStyle = config.secondaryColor;
        ctx.fill();

        // Apex flare
        if (val > 0.45) {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(apexX, apexY, Math.max(1.5, barW * 0.35), 0, Math.PI * 2);
          ctx.fill();
        }
      }
      return;
    }

    if (skin === 'cyber-hex') {
      // Linear Cyber Hex Nodes
      const hexR = Math.max(3, barW * 0.8);
      for (let i = 0; i < barCount; i++) {
        const idx = Math.floor((i / barCount) * (freqData.length * 0.7));
        const val = (freqData[idx] || 0) / 255;
        const h = Math.max(6, val * config.maxBarHeight * 1.5);
        const cx = startX + i * (barW + 3) + barW / 2;
        const cy = 100 - h;

        // Trace line
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.15 + val * 0.45})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(cx, 100);
        ctx.lineTo(cx, cy);
        ctx.stroke();

        // Hex node
        ctx.beginPath();
        for (let k = 0; k < 6; k++) {
          const a = (k * Math.PI) / 3;
          const px = cx + Math.sin(a) * hexR;
          const py = cy + Math.cos(a) * hexR;
          if (k === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = val > 0.4 ? config.accentColor : config.primaryColor;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
      return;
    }

    if (skin === 'equalizer-grid') {
      // Linear Segmented LED VU-Meter Blocks
      const maxSegs = 10;
      for (let i = 0; i < barCount; i++) {
        const idx = Math.floor((i / barCount) * (freqData.length * 0.7));
        const val = (freqData[idx] || 0) / 255;
        const activeSegs = Math.max(1, Math.floor(val * maxSegs));
        const x = startX + i * (barW + 3);
        const segH = Math.max(3, (config.maxBarHeight * 1.4 / maxSegs) - 2);

        for (let s = 0; s < maxSegs; s++) {
          const sy = 100 - (s + 1) * (segH + 2);
          const isActive = s < activeSegs;
          if (isActive) {
            ctx.fillStyle = s / maxSegs < 0.6 ? config.primaryColor : (s / maxSegs < 0.85 ? config.secondaryColor : config.accentColor);
            ctx.globalAlpha = 1.0;
          } else {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.globalAlpha = 0.3;
          }
          ctx.beginPath();
          ctx.rect(x, sy, barW, segH);
          ctx.fill();
        }
        ctx.globalAlpha = 1.0;
      }
      return;
    }

    // Default 'circular-bars' (Standard linear bars)
    for (let i = 0; i < barCount; i++) {
      const idx = Math.floor((i / barCount) * (freqData.length * 0.7));
      const val = (freqData[idx] || 0) / 255;
      const h = Math.max(4, val * config.maxBarHeight * 1.5);
      const x = startX + i * (barW + 3);

      const grad = ctx.createLinearGradient(0, 100, 0, 100 - h);
      grad.addColorStop(0, config.primaryColor);
      grad.addColorStop(1, config.secondaryColor);

      ctx.fillStyle = grad;
      ctx.beginPath();
      if (config.roundCaps && typeof ctx.roundRect === 'function') {
        ctx.roundRect(x, 100 - h, barW, h, barW / 2);
      } else {
        ctx.rect(x, 100 - h, barW, h);
      }
      ctx.fill();
    }
  }

  private drawCenterCover(
    ctx: CanvasRenderingContext2D,
    config: VisualizerConfig,
    coverImg: HTMLImageElement | null,
    bass: number
  ) {
    const radius = config.innerRadius - 8;
    if (radius <= 10) return;

    ctx.save();

    // Apply spin rotation
    if (config.spinCover) {
      ctx.rotate(this.coverRotation);
    }

    // Outer glowing border ring
    ctx.beginPath();
    ctx.arc(0, 0, radius + 2, 0, Math.PI * 2);
    ctx.lineWidth = 3;
    ctx.strokeStyle = config.primaryColor;
    if (config.glowIntensity > 0) {
      ctx.shadowBlur = config.glowIntensity + bass * 12;
      ctx.shadowColor = config.primaryColor;
    }
    ctx.stroke();

    // Clip circular area for cover art
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // Reset shadow for inner image
    ctx.shadowBlur = 0;

    const imgToDraw = (coverImg && coverImg.complete && coverImg.naturalWidth > 0)
      ? coverImg
      : this.defaultCoverCanvas;

    if (imgToDraw) {
      const imgW = (imgToDraw as HTMLImageElement).naturalWidth || (imgToDraw as HTMLCanvasElement).width;
      const imgH = (imgToDraw as HTMLImageElement).naturalHeight || (imgToDraw as HTMLCanvasElement).height;
      const s = Math.min(imgW, imgH);
      const sx = (imgW - s) / 2;
      const sy = (imgH - s) / 2;

      ctx.drawImage(
        imgToDraw,
        sx,
        sy,
        s,
        s,
        -radius,
        -radius,
        radius * 2,
        radius * 2
      );
    }

    // Overlay subtle vinyl concentric ring sheen
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.35, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Center vinyl spindle hole
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  }

  private drawTrackMetadata(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    config: VisualizerConfig,
    theme: ThemeMode
  ) {
    ctx.save();
    ctx.textAlign = 'center';

    // Track Title
    ctx.font = '700 22px "Syne", sans-serif';
    ctx.fillStyle = theme === 'dark' ? '#ffffff' : '#0f172a';
    ctx.shadowBlur = theme === 'dark' ? 12 : 6;
    ctx.shadowColor = theme === 'dark' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)';
    ctx.fillText(config.trackTitle, width / 2, height - 120);

    // Track Artist
    if (config.trackArtist) {
      ctx.font = '500 14px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = theme === 'dark' ? 'rgba(255, 255, 255, 0.75)' : 'rgba(51, 65, 85, 0.85)';
      ctx.fillText(config.trackArtist, width / 2, height - 94);
    }

    ctx.restore();
  }
}
