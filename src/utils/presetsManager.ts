import { VisualizerConfig, VisualizerPreset } from '../types/visualizer';

export const BUILT_IN_PRESETS: VisualizerPreset[] = [
  {
    id: 'cyberpunk-nu',
    name: 'Cyberpunk Nu',
    description: 'Spektrum radial neon cyan & ungu dengan hentakan bass punchy',
    isBuiltIn: true,
    createdAt: 1700000000000,
    config: {
      skin: 'circular-bars',
      style: 'radial-bars',
      barCount: 96,
      innerRadius: 110,
      maxBarHeight: 140,
      barWidth: 5,
      roundCaps: true,
      rotationSpeed: 0.5,
      reactRotation: true,
      glowIntensity: 18,
      bloomEffect: true,
      bloomIntensity: 0.85,
      bloomRadius: 18,
      primaryColor: '#06b6d4',
      secondaryColor: '#8b5cf6',
      accentColor: '#ec4899',
      bassSensitivity: 1.35,
      pulseSensitivity: 1.2,
      pulseIntensity: 0.16,
      cameraShake: true,
      transientShake: true,
      transientShakeIntensity: 1.2,
      bassBoost: 6,
      fftSize: 1024,
      smoothing: 0.82,
      particleCount: 70,
      particleSpeed: 1.2,
      particleType: 'stars',
      particleExplosion: true,
      particleTrails: false,
      trailPersistence: 0.2,
      showCoverArt: true,
      spinCover: false,
      coverSpinSpeed: 0.6,
      bgType: 'solid',
      bgDim: 0.65,
      bgBlur: 0,
      showTrackInfo: true,
      trackTitle: 'Cyberpunk Nu',
      trackArtist: 'Electronic Bass Visualizer',
      bpmSyncPulse: true,
    },
  },
  {
    id: 'solar-edm-blast',
    name: 'Solar EDM Blast',
    description: 'Cincin ganda memancar ke luar-dalam dengan rona amber & api membara',
    isBuiltIn: true,
    createdAt: 1700000001000,
    config: {
      skin: 'geometric-shards',
      style: 'dual-ring',
      barCount: 112,
      innerRadius: 115,
      maxBarHeight: 155,
      barWidth: 4,
      roundCaps: true,
      rotationSpeed: 0.8,
      reactRotation: true,
      glowIntensity: 22,
      bloomEffect: true,
      bloomIntensity: 1.1,
      bloomRadius: 22,
      primaryColor: '#eab308',
      secondaryColor: '#f97316',
      accentColor: '#ffffff',
      bassSensitivity: 1.6,
      pulseSensitivity: 1.4,
      pulseIntensity: 0.22,
      cameraShake: true,
      transientShake: true,
      transientShakeIntensity: 1.5,
      bassBoost: 9,
      fftSize: 1024,
      smoothing: 0.78,
      particleCount: 85,
      particleSpeed: 1.6,
      particleType: 'diamonds',
      particleExplosion: true,
      particleTrails: false,
      trailPersistence: 0.2,
      showCoverArt: true,
      spinCover: true,
      coverSpinSpeed: 0.9,
      bgType: 'ambient',
      bgDim: 0.6,
      bgBlur: 0,
      showTrackInfo: true,
      trackTitle: 'Solar EDM Blast',
      trackArtist: 'Heavy Drop Preset',
    },
  },
  {
    id: 'matrix-waveform',
    name: 'Emerald Matrix Curve',
    description: 'Gelombang kurva halus neon hijau emerald ala oscilloscope sci-fi',
    isBuiltIn: true,
    createdAt: 1700000002000,
    config: {
      skin: 'waveform-lines',
      style: 'radial-curve',
      barCount: 120,
      innerRadius: 125,
      maxBarHeight: 130,
      barWidth: 4,
      roundCaps: true,
      rotationSpeed: 0.3,
      reactRotation: false,
      glowIntensity: 24,
      bloomEffect: true,
      bloomIntensity: 0.9,
      bloomRadius: 16,
      primaryColor: '#10b981',
      secondaryColor: '#06b6d4',
      accentColor: '#a7f3d0',
      bassSensitivity: 1.15,
      pulseSensitivity: 1.0,
      pulseIntensity: 0.12,
      cameraShake: false,
      transientShake: false,
      transientShakeIntensity: 0.8,
      bassBoost: 4,
      fftSize: 2048,
      smoothing: 0.88,
      particleCount: 50,
      particleSpeed: 0.9,
      particleType: 'dust',
      particleExplosion: false,
      particleTrails: false,
      trailPersistence: 0.2,
      showCoverArt: true,
      spinCover: false,
      coverSpinSpeed: 0.4,
      bgType: 'solid',
      bgDim: 0.7,
      bgBlur: 0,
      showTrackInfo: true,
      trackTitle: 'Emerald Matrix Curve',
      trackArtist: 'Oscilloscope Mode',
    },
  },
  {
    id: 'vaporwave-sunset',
    name: 'Vaporwave Sunset',
    description: 'Spektrum simetris cermin dengan nuansa senja retro 80an ungu-oranye',
    isBuiltIn: true,
    createdAt: 1700000003000,
    config: {
      skin: 'circular-bars',
      style: 'radial-mirror',
      barCount: 84,
      innerRadius: 105,
      maxBarHeight: 150,
      barWidth: 6,
      roundCaps: true,
      rotationSpeed: 0.4,
      reactRotation: true,
      glowIntensity: 20,
      bloomEffect: true,
      bloomIntensity: 1.0,
      bloomRadius: 20,
      primaryColor: '#f97316',
      secondaryColor: '#ec4899',
      accentColor: '#fbbf24',
      bassSensitivity: 1.4,
      pulseSensitivity: 1.2,
      pulseIntensity: 0.18,
      cameraShake: false,
      transientShake: true,
      transientShakeIntensity: 1.1,
      bassBoost: 6,
      fftSize: 1024,
      smoothing: 0.83,
      particleCount: 65,
      particleSpeed: 1.1,
      particleType: 'stars',
      particleExplosion: true,
      particleTrails: false,
      trailPersistence: 0.2,
      showCoverArt: true,
      spinCover: true,
      coverSpinSpeed: 0.5,
      bgType: 'ambient',
      bgDim: 0.55,
      bgBlur: 0,
      showTrackInfo: true,
      trackTitle: 'Vaporwave Sunset',
      trackArtist: 'Retro Synthwave Edition',
    },
  },
  {
    id: 'deep-space-minimal',
    name: 'Deep Space Minimal',
    description: 'Titik pin spektrum melingkar estetik dengan visual bersih dan elegan',
    isBuiltIn: true,
    createdAt: 1700000004000,
    config: {
      skin: 'cyber-hex',
      style: 'radial-dots',
      barCount: 72,
      innerRadius: 130,
      maxBarHeight: 110,
      barWidth: 6,
      roundCaps: true,
      rotationSpeed: 0.2,
      reactRotation: false,
      glowIntensity: 12,
      bloomEffect: true,
      bloomIntensity: 0.5,
      bloomRadius: 12,
      primaryColor: '#e0e7ff',
      secondaryColor: '#38bdf8',
      accentColor: '#ffffff',
      bassSensitivity: 1.1,
      pulseSensitivity: 0.9,
      pulseIntensity: 0.08,
      cameraShake: false,
      transientShake: false,
      transientShakeIntensity: 0.6,
      bassBoost: 2,
      fftSize: 1024,
      smoothing: 0.89,
      particleCount: 40,
      particleSpeed: 0.7,
      particleType: 'circles',
      particleExplosion: false,
      particleTrails: false,
      trailPersistence: 0.2,
      showCoverArt: true,
      spinCover: false,
      coverSpinSpeed: 0.3,
      bgType: 'solid',
      bgDim: 0.8,
      bgBlur: 0,
      showTrackInfo: true,
      trackTitle: 'Deep Space Minimal',
      trackArtist: 'Ambient Chillout',
    },
  },
  {
    id: 'trap-bass-banger',
    name: 'Trap 808 Bass Banger',
    description: 'Respon bass ekstrem 2.2x dengan guncangan kamera dan ledakan partikel',
    isBuiltIn: true,
    createdAt: 1700000005000,
    config: {
      skin: 'equalizer-grid',
      style: 'radial-bars',
      barCount: 128,
      innerRadius: 95,
      maxBarHeight: 180,
      barWidth: 4,
      roundCaps: true,
      rotationSpeed: 1.0,
      reactRotation: true,
      glowIntensity: 26,
      bloomEffect: true,
      bloomIntensity: 1.3,
      bloomRadius: 24,
      primaryColor: '#ef4444',
      secondaryColor: '#a855f7',
      accentColor: '#facc15',
      bassSensitivity: 2.2,
      pulseSensitivity: 1.8,
      pulseIntensity: 0.3,
      cameraShake: true,
      transientShake: true,
      transientShakeIntensity: 2.0,
      bassBoost: 14,
      fftSize: 512,
      smoothing: 0.72,
      particleCount: 110,
      particleSpeed: 2.2,
      particleType: 'stars',
      particleExplosion: true,
      particleTrails: true,
      trailPersistence: 0.18,
      showCoverArt: true,
      spinCover: true,
      coverSpinSpeed: 1.2,
      bgType: 'solid',
      bgDim: 0.65,
      bgBlur: 0,
      showTrackInfo: true,
      trackTitle: 'Trap 808 Bass Banger',
      trackArtist: 'Maximum Sub-Bass Overdrive',
    },
  },
];

const STORAGE_KEY = 'nu_user_presets';
const LEGACY_STORAGE_KEY = 'aveeflow_user_presets';

export class PresetsManager {
  public static getUserPresets(): VisualizerPreset[] {
    try {
      let data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        data = localStorage.getItem(LEGACY_STORAGE_KEY);
      }
      if (!data) return [];
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      return [];
    } catch {
      return [];
    }
  }

  public static getAllPresets(): VisualizerPreset[] {
    const userPresets = this.getUserPresets();
    return [...BUILT_IN_PRESETS, ...userPresets];
  }

  public static saveUserPreset(name: string, config: VisualizerConfig, description?: string): VisualizerPreset {
    const newPreset: VisualizerPreset = {
      id: `user-preset-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim() || `Preset ${new Date().toLocaleDateString('id-ID')}`,
      description: description || 'Preset kustom visualizer',
      isBuiltIn: false,
      createdAt: Date.now(),
      config: { ...config },
    };

    const existing = this.getUserPresets();
    const updated = [newPreset, ...existing];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return newPreset;
  }

  public static deleteUserPreset(id: string): boolean {
    const existing = this.getUserPresets();
    const filtered = existing.filter((p) => p.id !== id);
    if (filtered.length !== existing.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      return true;
    }
    return false;
  }

  public static exportPresetsAsJSON(): string {
    const presets = this.getAllPresets();
    return JSON.stringify(presets, null, 2);
  }

  public static importPresetsFromJSON(jsonString: string): { success: boolean; count: number; error?: string } {
    try {
      const parsed = JSON.parse(jsonString);
      const list = Array.isArray(parsed) ? parsed : [parsed];
      const validPresets: VisualizerPreset[] = [];

      for (const item of list) {
        if (item && item.config && typeof item.config === 'object') {
          validPresets.push({
            id: `user-import-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            name: String(item.name || 'Impor Preset'),
            description: item.description ? String(item.description) : 'Preset diimpor dari file JSON',
            isBuiltIn: false,
            createdAt: Date.now(),
            config: item.config,
          });
        }
      }

      if (validPresets.length === 0) {
        return { success: false, count: 0, error: 'Format preset tidak valid atau tidak memiliki konfigurasi.' };
      }

      const existing = this.getUserPresets();
      const merged = [...validPresets, ...existing];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      return { success: true, count: validPresets.length };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, count: 0, error: `Gagal membaca file JSON: ${msg}` };
    }
  }
}
