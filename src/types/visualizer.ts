export type VisualizerSkin =
  | 'circular-bars'
  | 'waveform-lines'
  | 'geometric-shards'
  | 'cyber-hex'
  | 'equalizer-grid';

export type VisualizerStyle =
  | 'radial-bars'
  | 'radial-mirror'
  | 'radial-curve'
  | 'radial-dots'
  | 'linear-bars'
  | 'dual-ring';

export type ParticleType = 'stars' | 'dust' | 'circles' | 'diamonds';

export type BackgroundType = 'solid' | 'ambient' | 'image' | 'video';

export interface VisualizerConfig {
  skin: VisualizerSkin;
  style: VisualizerStyle;
  barCount: number;
  innerRadius: number;
  maxBarHeight: number;
  barWidth: number;
  roundCaps: boolean;
  rotationSpeed: number;
  reactRotation: boolean;
  glowIntensity: number;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  bassSensitivity: number;
  pulseSensitivity: number;
  pulseIntensity: number;
  cameraShake: boolean;
  transientShake?: boolean;
  transientShakeIntensity?: number;
  bassBoost?: number;
  fftSize: number;
  smoothing: number;
  particleCount: number;
  particleSpeed: number;
  particleType: ParticleType;
  particleExplosion: boolean;
  particleTrails: boolean;
  trailPersistence?: number;
  showCoverArt: boolean;
  spinCover: boolean;
  coverSpinSpeed: number;
  bgType: BackgroundType;
  bgDim: number;
  bgBlur: number;
  showTrackInfo: boolean;
  trackTitle: string;
  trackArtist: string;
}

export interface AudioState {
  fileName: string;
  fileType: 'audio' | 'video' | 'demo';
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  coverUrl: string | null;
  bgUrl: string | null;
  videoElement: HTMLVideoElement | null;
}

export interface RecordingState {
  isRecording: boolean;
  secondsRecorded: number;
  format: 'mp4' | 'webm';
  status: 'idle' | 'recording' | 'processing' | 'completed' | 'error';
  errorMessage?: string;
  downloadUrl?: string;
  fileBlob?: Blob;
  fileName?: string;
}

export type ThemeMode = 'dark' | 'light';

export interface VisualizerPreset {
  id: string;
  name: string;
  description?: string;
  isBuiltIn?: boolean;
  createdAt: number;
  config: VisualizerConfig;
}

export interface ColorPreset {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  bgGradient: string;
}
