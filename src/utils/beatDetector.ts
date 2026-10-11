/**
 * Nu Beat Detection & BPM Tracking Engine
 *
 * Provides:
 * 1. Offline automated BPM detection on uploaded audio tracks using
 *    low-pass filtering, energy onset flux, adaptive peak picking,
 *    and weighted autocorrelation with phase alignment.
 * 2. Real-time beat tracking and phase synchronization for canvas
 *    visualizer elements to pulse in perfect musical rhythm.
 */

export interface BeatAnalysisResult {
  bpm: number;
  confidence: number;
  beatOffset: number; // time in seconds of the first aligned downbeat
  beatInterval: number; // seconds per beat (60 / bpm)
  waveformPeaks?: number[]; // normalized 0..1 values for visual scrubbing
}

/**
 * Automatically analyzes an AudioBuffer to detect tempo (BPM) and beat alignment.
 */
export async function detectBpmFromAudioBuffer(
  audioBuffer: AudioBuffer
): Promise<BeatAnalysisResult> {
  const sampleRate = audioBuffer.sampleRate;
  const numChannels = audioBuffer.numberOfChannels;
  const totalLength = audioBuffer.length;

  // 1. Select representative analysis window (up to 45 seconds, starting at 10s if track is long)
  const maxDuration = 45; // seconds
  const startOffsetSeconds = totalLength / sampleRate > 30 ? 10 : 0;
  const startSample = Math.floor(startOffsetSeconds * sampleRate);
  const analysisLength = Math.min(
    totalLength - startSample,
    Math.floor(maxDuration * sampleRate)
  );

  if (analysisLength < sampleRate * 3) {
    // Too short for reliable analysis, fallback to default 124 BPM
    return {
      bpm: 124,
      confidence: 0.5,
      beatOffset: 0,
      beatInterval: 60 / 124,
    };
  }

  // 2. Mix to mono into a downsampled buffer (target downsampled rate ~11,025 Hz)
  const downsampleRatio = Math.max(1, Math.floor(sampleRate / 11025));
  const effectiveSampleRate = sampleRate / downsampleRatio;
  const downsampledLength = Math.floor(analysisLength / downsampleRatio);
  const monoData = new Float32Array(downsampledLength);

  const ch0 = audioBuffer.getChannelData(0);
  const ch1 = numChannels > 1 ? audioBuffer.getChannelData(1) : null;

  for (let i = 0; i < downsampledLength; i++) {
    const srcIdx = startSample + i * downsampleRatio;
    if (ch1) {
      monoData[i] = (ch0[srcIdx] + ch1[srcIdx]) * 0.5;
    } else {
      monoData[i] = ch0[srcIdx];
    }
  }

  // 3. Low-Pass Filter: Kick and sub-bass frequencies (approx 150 Hz) dominate beat onsets
  // Simple 2nd-order low-pass filter (IIR)
  const cutoffHz = 160;
  const rc = 1.0 / (2.0 * Math.PI * cutoffHz);
  const dt = 1.0 / effectiveSampleRate;
  const alpha = dt / (rc + dt);

  const filtered = new Float32Array(downsampledLength);
  let prevSample = 0;
  let prev2Sample = 0;
  for (let i = 0; i < downsampledLength; i++) {
    prevSample = prevSample + alpha * (monoData[i] - prevSample);
    prev2Sample = prev2Sample + alpha * (prevSample - prev22(prevSample, prev2Sample));
    filtered[i] = prev2Sample;
  }

  function prev22(curr: number, prev: number): number {
    return prev + alpha * (curr - prev);
  }

  // 4. Compute Energy Envelope and Onset Detection Function (ODF)
  // Hop size: ~20ms
  const hopSize = Math.max(16, Math.floor(effectiveSampleRate * 0.02));
  const winSize = hopSize * 2;
  const numFrames = Math.floor((downsampledLength - winSize) / hopSize);
  const energy = new Float32Array(numFrames);

  for (let f = 0; f < numFrames; f++) {
    let sumSquares = 0;
    const offset = f * hopSize;
    for (let j = 0; j < winSize; j++) {
      const s = filtered[offset + j];
      sumSquares += s * s;
    }
    energy[f] = Math.sqrt(sumSquares / winSize);
  }

  // Half-wave rectified flux: max(0, energy[f] - energy[f-1])
  const odf = new Float32Array(numFrames);
  for (let f = 1; f < numFrames; f++) {
    const diff = energy[f] - energy[f - 1];
    odf[f] = diff > 0 ? diff : 0;
  }

  // 5. Autocorrelation over realistic BPM range: 60 BPM to 190 BPM
  // Min BPM 60 => lag max = effectiveSampleRate / (hopSize * 1) = secondsPerFrame
  const secondsPerFrame = hopSize / effectiveSampleRate;
  const minBpm = 68;
  const maxBpm = 188;

  const minLag = Math.floor(60 / (maxBpm * secondsPerFrame));
  const maxLag = Math.ceil(60 / (minBpm * secondsPerFrame));

  if (maxLag >= numFrames / 2) {
    return {
      bpm: 126,
      confidence: 0.6,
      beatOffset: 0,
      beatInterval: 60 / 126,
    };
  }

  const lagsCount = maxLag - minLag + 1;
  const corr = new Float32Array(lagsCount);

  // Compute normalized autocorrelation for each lag
  for (let lagIdx = 0; lagIdx < lagsCount; lagIdx++) {
    const lag = minLag + lagIdx;
    let sum = 0;
    const nSamples = numFrames - lag;
    for (let i = 0; i < nSamples; i++) {
      sum += odf[i] * odf[i + lag];
    }
    // Perceptual prior weighting: humans dance/groove most naturally between 110 and 135 BPM
    const testBpm = 60 / (lag * secondsPerFrame);
    // Gaussian weight centered at 124 BPM (sigma = 35)
    const weight = Math.exp(-Math.pow((testBpm - 124) / 45, 2));
    corr[lagIdx] = (sum / nSamples) * (0.6 + 0.4 * weight);
  }

  // Find highest correlation peak
  let bestLagIdx = 0;
  let maxCorr = -Infinity;
  for (let i = 1; i < lagsCount - 1; i++) {
    if (corr[i] > corr[i - 1] && corr[i] > corr[i + 1] && corr[i] > maxCorr) {
      maxCorr = corr[i];
      bestLagIdx = i;
    }
  }

  // Parabolic interpolation for sub-frame accuracy
  let peakLag = minLag + bestLagIdx;
  if (bestLagIdx > 0 && bestLagIdx < lagsCount - 1) {
    const y0 = corr[bestLagIdx - 1];
    const y1 = corr[bestLagIdx];
    const y2 = corr[bestLagIdx + 1];
    const denom = 2 * (2 * y1 - y0 - y2);
    if (Math.abs(denom) > 1e-6) {
      const delta = (y2 - y0) / denom;
      peakLag += Math.max(-0.5, Math.min(0.5, delta));
    }
  }

  let calculatedBpm = 60 / (peakLag * secondsPerFrame);

  // Resolve octave ambiguity (e.g., if detected tempo is < 70, check if doubling fits standard tempo)
  if (calculatedBpm < 74) {
    calculatedBpm *= 2;
  } else if (calculatedBpm > 185) {
    calculatedBpm /= 2;
  }

  // Round to 1 decimal place (e.g. 128.0 BPM)
  const finalBpm = Math.round(calculatedBpm * 10) / 10;
  const beatInterval = 60 / finalBpm;

  // 6. Calculate Beat Phase (downbeat alignment offset in seconds)
  // Test candidate offsets t0 in [0, beatInterval) in 10ms steps
  const testSteps = 40;
  let bestOffset = 0;
  let bestAlignmentScore = -Infinity;

  for (let s = 0; s < testSteps; s++) {
    const candidateOffset = (s / testSteps) * beatInterval;
    let score = 0;
    let count = 0;

    for (let t = startOffsetSeconds + candidateOffset; t < startOffsetSeconds + 20; t += beatInterval) {
      const frameIdx = Math.floor((t - startOffsetSeconds) / secondsPerFrame);
      if (frameIdx >= 0 && frameIdx < numFrames) {
        score += odf[frameIdx] + energy[frameIdx] * 0.5;
        count++;
      }
    }

    if (count > 0 && score / count > bestAlignmentScore) {
      bestAlignmentScore = score / count;
      bestOffset = candidateOffset;
    }
  }

  // Confidence calculation based on peak saliency relative to mean correlation
  let meanCorr = 0;
  for (let i = 0; i < lagsCount; i++) meanCorr += corr[i];
  meanCorr /= lagsCount;
  const saliency = maxCorr > 0 && meanCorr > 0 ? (maxCorr - meanCorr) / maxCorr : 0.5;
  const confidence = Math.max(0.4, Math.min(0.98, saliency * 1.5));

  return {
    bpm: finalBpm,
    confidence,
    beatOffset: bestOffset,
    beatInterval,
  };
}

/**
 * Real-time Beat Tracker:
 * Computes instantaneous beat phase and rhythm pulse for canvas animation frames.
 */
export class RealtimeBeatTracker {
  private bpm: number = 126; // Default demo beat BPM
  private beatInterval: number = 60 / 126;
  private beatOffset: number = 0;
  private confidence: number = 0.85;
  private isLocked: boolean = false;

  // Real-time dynamic beat onset estimator for live audio / fallback
  private energyHistory: number[] = [];
  private lastBeatTime: number = 0;
  private dynamicPulseIntensity: number = 0;
  private lastFrameTime: number = performance.now();

  constructor(initialBpm: number = 126) {
    this.setBpm(initialBpm, 0, 0.85, false);
  }

  public setBpm(
    bpm: number,
    offset: number = 0,
    confidence: number = 0.9,
    locked: boolean = true
  ) {
    if (bpm > 40 && bpm < 250) {
      this.bpm = Math.round(bpm * 10) / 10;
      this.beatInterval = 60 / this.bpm;
      this.beatOffset = offset;
      this.confidence = confidence;
      this.isLocked = locked;
    }
  }

  public getBpm(): number {
    return this.bpm;
  }

  public isTempoLocked(): boolean {
    return this.isLocked;
  }

  public getConfidence(): number {
    return this.confidence;
  }

  /**
   * Calculates real-time beat phase and pulse intensity for canvas rendering
   * @param currentTime Current playback time of the audio/video track in seconds
   * @param bassLevel Instantaneous low-frequency bass energy (0.0 to 1.5+)
   */
  public getBeatState(currentTime: number, bassLevel: number = 0): {
    bpm: number;
    isBeat: boolean;
    beatPhase: number;
    beatPulse: number;
    confidence: number;
    tempoLock: boolean;
  } {
    const now = performance.now() / 1000;
    const dt = Math.min(0.1, (performance.now() - this.lastFrameTime) / 1000);
    this.lastFrameTime = performance.now();

    // Use media element's currentTime if valid, otherwise fallback to local clock
    const trackTime = !isNaN(currentTime) && currentTime > 0 ? currentTime : now;

    // 1. Calculate locked beat phase based on BPM grid: [0.0 (onset) to 1.0 (next beat)]
    const timeSinceOffset = trackTime - this.beatOffset;
    let beatPhase = (timeSinceOffset % this.beatInterval) / this.beatInterval;
    if (beatPhase < 0) {
      beatPhase += 1.0;
    }

    // 2. Detect beat tick (near phase 0)
    const isNearBeat = beatPhase < 0.12 || beatPhase > 0.95;
    const isNewBeatTick = isNearBeat && (trackTime - this.lastBeatTime > this.beatInterval * 0.65);
    if (isNewBeatTick) {
      this.lastBeatTime = trackTime;
    }

    // 3. Compute musical rhythmic pulse envelope:
    // A punchy exponential decay locked to the beat tempo
    let targetRhythmicPulse = 0;
    if (beatPhase < 0.25) {
      // Sharp attack & immediate initial punch
      targetRhythmicPulse = Math.pow(1 - beatPhase / 0.25, 2.2);
    } else {
      // Subtle rhythmic groove floor
      targetRhythmicPulse = Math.max(0, 0.15 * Math.cos(beatPhase * Math.PI * 2));
    }

    // Modulate with instantaneous bass energy:
    // When a kick lands on the beat, pulse reaches maximum power;
    // during breakdowns, maintains rhythmic breathing without chaotic jitter.
    const energeticAmplification = 0.5 + Math.min(1.5, bassLevel * 0.9);
    const combinedPulse = targetRhythmicPulse * energeticAmplification;

    // Smooth envelope attack and decay
    if (combinedPulse > this.dynamicPulseIntensity) {
      this.dynamicPulseIntensity += (combinedPulse - this.dynamicPulseIntensity) * 0.75;
    } else {
      // Decay proportional to BPM tempo
      const decayRate = Math.min(0.92, Math.max(0.78, 1 - (this.bpm / 60) * 0.08 * (dt * 60)));
      this.dynamicPulseIntensity *= decayRate;
    }

    return {
      bpm: this.bpm,
      isBeat: isNewBeatTick,
      beatPhase,
      beatPulse: Math.min(2.0, this.dynamicPulseIntensity),
      confidence: this.confidence,
      tempoLock: this.isLocked,
    };
  }
}

/**
 * Extracts normalized peak waveform amplitudes (0.0 to 1.0) from an AudioBuffer
 * for waveform visualization and visual scrubbing.
 */
export function extractWaveformPeaks(
  audioBuffer: AudioBuffer,
  targetBars: number = 120
): number[] {
  const numChannels = audioBuffer.numberOfChannels;
  const length = audioBuffer.length;
  if (length === 0) return new Array(targetBars).fill(0.2);

  const ch0 = audioBuffer.getChannelData(0);
  const ch1 = numChannels > 1 ? audioBuffer.getChannelData(1) : null;
  const blockSize = Math.floor(length / targetBars);
  const peaks: number[] = new Array(targetBars);

  let maxVal = 0.001;

  for (let b = 0; b < targetBars; b++) {
    const start = b * blockSize;
    const end = Math.min(start + blockSize, length);
    let sum = 0;
    let peak = 0;
    const step = Math.max(1, Math.floor((end - start) / 60)); // Fast sample across block

    for (let i = start; i < end; i += step) {
      let val = Math.abs(ch0[i]);
      if (ch1) {
        val = (val + Math.abs(ch1[i])) * 0.5;
      }
      if (val > peak) peak = val;
      sum += val * val;
    }
    const count = Math.max(1, Math.ceil((end - start) / step));
    const rms = Math.sqrt(sum / count);
    // Blend peak and RMS for rich visual dynamic range
    const combined = peak * 0.65 + rms * 0.35;
    peaks[b] = combined;
    if (combined > maxVal) maxVal = combined;
  }

  // Normalize between ~0.08 and 1.0
  return peaks.map((p) => Math.max(0.08, Math.min(1.0, p / maxVal)));
}

/**
 * Generates an aesthetic synthwave waveform profile for the demo track
 */
export function generateDemoWaveform(targetBars: number = 120): number[] {
  const peaks = new Array(targetBars);
  for (let i = 0; i < targetBars; i++) {
    const phase = i / targetBars;
    // Musical narrative: intro rise, energetic build, drop chorus, groove section, outro
    const sectionEnvelope = Math.sin(phase * Math.PI);
    const beatPulse = (i % 4 === 0) ? 0.95 : (i % 2 === 0 ? 0.68 : 0.42);
    const grooveNoise = 0.5 + 0.32 * Math.sin(i * 0.35) * Math.cos(i * 0.18);
    const val = 0.18 + (beatPulse * 0.45 + grooveNoise * 0.35) * (0.35 + 0.65 * sectionEnvelope);
    peaks[i] = Math.max(0.12, Math.min(1.0, val));
  }
  return peaks;
}

