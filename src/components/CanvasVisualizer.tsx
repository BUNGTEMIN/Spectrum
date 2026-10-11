import React, { useEffect, useRef, useState } from 'react';
import {
  VisualizerConfig,
  AudioState,
  ThemeMode,
  VisualizerSkin,
} from '../types/visualizer';
import { VisualizerRenderer } from '../utils/visualizerRenderer';
import { AudioEngine } from '../utils/audioEngine';
import {
  Sparkles,
  ChevronRight,
  X,
  Flame,
  Check,
  Palette,
  Eye,
  EyeOff,
  Sliders,
  Zap,
  Volume2,
} from 'lucide-react';
import { POPULAR_NEON_SWATCHES } from './SettingsPanel';

const SKIN_DATA: Record<
  VisualizerSkin,
  { name: string; icon: string; badge: string }
> = {
  'circular-bars': {
    name: 'Circular Bars',
    icon: '📊',
    badge: 'Nu Classic',
  },
  'waveform-lines': {
    name: 'Waveform Lines',
    icon: '〰️',
    badge: 'Oscilloscope',
  },
  'geometric-shards': {
    name: 'Geometric Shards',
    icon: '💎',
    badge: 'Polygonal',
  },
  'cyber-hex': {
    name: 'Cyber Hex',
    icon: '⬡',
    badge: 'Techno HUD',
  },
  'equalizer-grid': {
    name: 'Equalizer Grid',
    icon: '▦',
    badge: 'Digital Matrix',
  },
};

const ORDERED_SKINS: VisualizerSkin[] = [
  'circular-bars',
  'waveform-lines',
  'geometric-shards',
  'cyber-hex',
  'equalizer-grid',
];

interface CanvasVisualizerProps {
  config: VisualizerConfig;
  audioEngine: AudioEngine;
  audioState: AudioState;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  theme: ThemeMode;
  onChangeSkin?: (skin: VisualizerSkin) => void;
  onToggleParticleTrails?: () => void;
  onChangeGlowIntensity?: (glow: number) => void;
  onChangeBassBoost?: (bassBoost: number) => void;
  onToggleTransientShake?: () => void;
  onChangeTransientShakeIntensity?: (intensity: number) => void;
  onChangePrimaryColor?: (color: string) => void;
  onOpenSettings?: () => void;
}

export const CanvasVisualizer: React.FC<CanvasVisualizerProps> = ({
  config,
  audioEngine,
  audioState,
  canvasRef,
  theme,
  onChangeSkin,
  onToggleParticleTrails,
  onChangeGlowIntensity,
  onChangeBassBoost,
  onToggleTransientShake,
  onChangeTransientShakeIntensity,
  onChangePrimaryColor,
  onOpenSettings,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<VisualizerRenderer | null>(null);
  const coverImgRef = useRef<HTMLImageElement | null>(null);
  const bgImgRef = useRef<HTMLImageElement | null>(null);
  const bgLayerRef = useRef<HTMLDivElement>(null);
  const smoothedAmpRef = useRef(0);

  const [isFxPanelOpen, setIsFxPanelOpen] = useState(false);
  const [fxActiveTab, setFxActiveTab] = useState<'color' | 'glow' | 'bass' | 'shake'>('color');
  const [isHudHidden, setIsHudHidden] = useState(false);

  // Keep live references to avoid tearing down requestAnimationFrame on config updates
  const configRef = useRef<VisualizerConfig>(config);
  configRef.current = config;

  const themeRef = useRef<ThemeMode>(theme);
  themeRef.current = theme;

  const videoElementRef = useRef<HTMLVideoElement | null>(audioState.videoElement);
  videoElementRef.current = audioState.videoElement;

  // Initialize renderer
  if (!rendererRef.current) {
    rendererRef.current = new VisualizerRenderer();
  }

  // Load custom cover image
  useEffect(() => {
    if (audioState.coverUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = audioState.coverUrl;
      img.onload = () => {
        coverImgRef.current = img;
      };
    } else {
      coverImgRef.current = null;
    }
  }, [audioState.coverUrl]);

  // Load custom background image
  useEffect(() => {
    if (audioState.bgUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = audioState.bgUrl;
      img.onload = () => {
        bgImgRef.current = img;
      };
    } else {
      bgImgRef.current = null;
    }
  }, [audioState.bgUrl]);

  // Main Render Animation Loop: decoupled from config re-renders for fluid 60fps
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animId: number;

    const handleResize = () => {
      const container = containerRef.current;
      if (!container || !canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = container.clientWidth;
      const height = container.clientHeight;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const loop = () => {
      if (canvas && rendererRef.current) {
        const curConfig = configRef.current;
        const curTheme = themeRef.current;
        const curVideo = videoElementRef.current;

        // PARTICLE TRAILS MOTION BLUR:
        // When enabled, modify the CanvasVisualizer to use a semi-transparent clearRect approach
        // (e.g., fillRect with alpha) instead of a full clear (clearRect), creating a motion blur trail
        // effect behind moving visual elements (particles, spectrum bars, waveforms, rotating shards).
        const ctx = canvas.getContext('2d');
        if (ctx) {
          if (curConfig.particleTrails) {
            const trailAlpha = curConfig.trailPersistence ?? 0.2;
            ctx.fillStyle = curTheme === 'dark'
              ? `rgba(6, 8, 16, ${trailAlpha})`
              : `rgba(248, 250, 252, ${trailAlpha})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          } else {
            // Full clear when particle trails is disabled
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
        }

        const freqData = audioEngine.getFrequencyData();
        const timeData = audioEngine.getTimeDomainData();
        const bassEnergy = audioEngine.getBassEnergy(curConfig.bassSensitivity);

        // Automated Beat Detection & BPM rhythm tracker state
        const beatData = audioEngine.getBeatData(audioState.currentTime);

        // Dynamically calculate average amplitude of the audio for the background pulsing depth effect
        let ampSum = 0;
        const timeLen = timeData.length;
        if (timeLen > 0) {
          for (let i = 0; i < timeLen; i++) {
            ampSum += Math.abs(timeData[i] - 128);
          }
        }
        const rawAmp = timeLen > 0 ? (ampSum / timeLen) / 128 : 0;
        // Smooth amplitude for fluid depth pulsing
        smoothedAmpRef.current += (rawAmp - smoothedAmpRef.current) * 0.22;
        const avgAmplitude = smoothedAmpRef.current;

        // Dynamically scale background image size based on average amplitude and synchronized beat rhythm
        if (bgLayerRef.current) {
          const beatDepth = (curConfig.bpmSyncPulse ?? true) ? (beatData.beatPulse * 0.08) : 0;
          const bgScale = 1.0 + avgAmplitude * 0.16 + beatDepth;
          bgLayerRef.current.style.transform = `scale(${bgScale.toFixed(4)})`;
        }

        // Core visualizer drawing logic executing the active skin variant
        rendererRef.current.render(
          canvas,
          freqData,
          timeData,
          bassEnergy,
          curConfig,
          coverImgRef.current,
          bgImgRef.current,
          curVideo,
          curTheme,
          avgAmplitude,
          beatData
        );
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [audioEngine, canvasRef]);

  // Cycle to next skin variant
  const handleCycleSkin = () => {
    if (!onChangeSkin) return;
    const curSkin = config.skin || 'circular-bars';
    const curIdx = ORDERED_SKINS.indexOf(curSkin);
    const nextIdx = (curIdx + 1) % ORDERED_SKINS.length;
    onChangeSkin(ORDERED_SKINS[nextIdx]);
  };

  const currentSkinMeta = SKIN_DATA[config.skin || 'circular-bars'] || SKIN_DATA['circular-bars'];
  const isDark = theme === 'dark';

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 w-full h-full overflow-hidden flex items-center justify-center cursor-default select-none transition-colors duration-500 ${
        isDark ? 'bg-neutral-950' : 'bg-slate-100'
      }`}
    >
      {/* Dynamic Background Image Layer with audio-reactive pulsing depth effect */}
      {config.bgType === 'image' && audioState.bgUrl && (
        <div
          ref={bgLayerRef}
          className="absolute inset-0 w-full h-full pointer-events-none -z-10 bg-center bg-cover transition-transform duration-75 will-change-transform"
          style={{
            backgroundImage: `url(${audioState.bgUrl})`,
            transformOrigin: 'center center',
          }}
        />
      )}

      <canvas
        ref={canvasRef}
        className="w-full h-full block object-contain pointer-events-none"
      />

      {/* Floating Canvas HUD */}
      {isHudHidden ? (
        <div className="absolute top-16 left-4 sm:top-18 sm:left-6 z-20 pointer-events-auto">
          <button
            type="button"
            onClick={() => setIsHudHidden(false)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold backdrop-blur-md transition-all cursor-pointer shadow-lg active:scale-95 ${
              isDark
                ? 'bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border-white/10'
                : 'bg-white/85 hover:bg-white text-neutral-700 hover:text-neutral-900 border-black/10'
            }`}
            title="Tampilkan Panel Cepat Visualizer"
          >
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px]">Tampilkan HUD</span>
          </button>
        </div>
      ) : (
        <div className="absolute top-16 left-4 sm:top-18 sm:left-6 z-20 flex items-center gap-2 pointer-events-auto">
          {/* Active Skin Variant Quick-Cycle Pill */}
          <button
            type="button"
            onClick={handleCycleSkin}
            title={`Skin Aktif: ${currentSkinMeta.name} (${currentSkinMeta.badge}) • Klik untuk beralih varian skin berikutnya`}
            className={`group flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold backdrop-blur-md transition-all cursor-pointer shadow-lg active:scale-95 ${
              isDark
                ? 'bg-neutral-900/80 hover:bg-neutral-800/90 text-neutral-200 hover:text-white border-white/10 hover:border-cyan-400/50'
                : 'bg-white/90 hover:bg-white text-neutral-800 hover:text-black border-black/10 hover:border-cyan-500/50'
            }`}
            style={{
              boxShadow: `0 4px 20px ${config.primaryColor}25`,
            }}
          >
            <span className="text-sm leading-none flex items-center justify-center">
              {currentSkinMeta.icon}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold tracking-tight">
                {currentSkinMeta.name}
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full uppercase tracking-wider font-mono opacity-75 bg-white/10">
                {currentSkinMeta.badge}
              </span>
            </div>
            <ChevronRight className="w-3 h-3 text-cyan-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
          </button>

          {/* Quick FX Popover Trigger Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsFxPanelOpen(!isFxPanelOpen)}
              title="Kustomisasi Cepat: Warna Neon, Glow, Bass & Shake"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold backdrop-blur-md transition-all cursor-pointer shadow-lg active:scale-95 ${
                isFxPanelOpen
                  ? isDark
                    ? 'bg-neutral-800 text-cyan-300 border-cyan-400/60 shadow-cyan-500/20'
                    : 'bg-cyan-50 text-cyan-800 border-cyan-400'
                  : isDark
                  ? 'bg-neutral-900/80 hover:bg-neutral-800/90 text-neutral-200 hover:text-white border-white/10 hover:border-cyan-400/50'
                  : 'bg-white/90 hover:bg-white text-neutral-800 hover:text-black border-black/10 hover:border-cyan-500/50'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                style={{
                  backgroundColor: config.primaryColor,
                  boxShadow: `0 0 8px ${config.primaryColor}`,
                }}
              />
              <span className="text-[11px] font-bold tracking-tight">Tweak FX</span>
              <Sliders className="w-3 h-3 text-cyan-400 opacity-80" />
            </button>

            {/* Unified Quick FX Popover */}
            {isFxPanelOpen && (
              <div
                className={`absolute top-full left-0 mt-2 w-72 sm:w-80 p-3.5 rounded-2xl border shadow-2xl backdrop-blur-xl z-30 transition-all ${
                  isDark
                    ? 'bg-neutral-950/95 border-white/15 text-neutral-100 shadow-cyan-950/40 ring-1 ring-cyan-500/20'
                    : 'bg-white/95 border-neutral-300 text-neutral-900 shadow-neutral-400/50'
                }`}
              >
                {/* Popover Header */}
                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                      Tweak FX & Audio
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsFxPanelOpen(false)}
                    className="p-1 rounded-md opacity-60 hover:opacity-100 hover:bg-white/10 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Sub-Tabs: Color, Glow, Bass, Shake */}
                <div className="grid grid-cols-4 gap-1 p-0.5 rounded-xl bg-white/5 border border-white/10 mb-3 text-center">
                  {[
                    { id: 'color', label: 'Neon', icon: '🎨' },
                    { id: 'glow', label: 'Glow', icon: '✨' },
                    { id: 'bass', label: 'Bass', icon: '🔊' },
                    { id: 'shake', label: 'Shake', icon: '⚡' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setFxActiveTab(tab.id as 'color' | 'glow' | 'bass' | 'shake')}
                      className={`py-1 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        fxActiveTab === tab.id
                          ? 'bg-cyan-500 text-neutral-950 font-bold shadow-sm'
                          : isDark
                          ? 'text-neutral-400 hover:text-white'
                          : 'text-neutral-600 hover:text-black'
                      }`}
                    >
                      <span className="leading-none">{tab.icon}</span>
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>

                {/* Tab 1: Neon Color */}
                {fxActiveTab === 'color' && (
                  <div className="space-y-2.5 animate-in fade-in duration-150">
                    <div className="flex items-center gap-2.5 bg-white/5 p-2 rounded-xl border border-white/10">
                      <input
                        type="color"
                        value={config.primaryColor}
                        onChange={(e) => onChangePrimaryColor?.(e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer border border-white/20 p-0.5 bg-neutral-900 shrink-0"
                        title="Pilih warna bebas"
                      />
                      <div className="flex items-center gap-1 font-mono-code text-xs bg-black/40 border border-white/10 px-2 py-1 rounded-md text-white flex-1">
                        <span className="text-neutral-500 font-bold">#</span>
                        <input
                          type="text"
                          value={config.primaryColor.replace('#', '').toUpperCase()}
                          onChange={(e) => {
                            const hex = e.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6);
                            if (hex.length === 6) {
                              onChangePrimaryColor?.(`#${hex}`);
                            }
                          }}
                          maxLength={6}
                          className="w-full bg-transparent outline-none font-bold uppercase tracking-wider"
                        />
                      </div>
                      <span
                        className="w-4 h-4 rounded-full border border-white/40 shadow-sm shrink-0"
                        style={{
                          backgroundColor: config.primaryColor,
                          boxShadow: `0 0 10px ${config.primaryColor}`,
                        }}
                      />
                    </div>

                    <div>
                      <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1">
                        Preset Neon Populer:
                      </span>
                      <div className="grid grid-cols-6 gap-1.5">
                        {POPULAR_NEON_SWATCHES.map((swatch) => {
                          const isSel = config.primaryColor.toLowerCase() === swatch.hex.toLowerCase();
                          return (
                            <button
                              key={swatch.hex}
                              type="button"
                              onClick={() => onChangePrimaryColor?.(swatch.hex)}
                              title={`${swatch.name} (${swatch.hex})`}
                              className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                                isSel
                                  ? 'ring-2 ring-white scale-110 shadow-md'
                                  : 'hover:scale-105 border-white/20'
                              }`}
                              style={{
                                backgroundColor: swatch.hex,
                                boxShadow: isSel ? `0 0 10px ${swatch.hex}` : undefined,
                              }}
                            >
                              {isSel && (
                                <Check
                                  className={`w-3.5 h-3.5 stroke-[3] ${
                                    swatch.hex === '#ffffff' ? 'text-black' : 'text-white'
                                  }`}
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 2: Glow & Trail */}
                {fxActiveTab === 'glow' && (
                  <div className="space-y-3 animate-in fade-in duration-150">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[11px] text-neutral-400">Glow shadowBlur</span>
                        <span
                          className="font-mono text-cyan-400 font-bold text-xs px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20"
                          style={{
                            textShadow: config.glowIntensity > 0 ? `0 0 8px ${config.primaryColor}` : 'none',
                          }}
                        >
                          {config.glowIntensity}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={50}
                        step={1}
                        value={config.glowIntensity}
                        onChange={(e) => onChangeGlowIntensity?.(parseInt(e.target.value))}
                        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                        style={{ accentColor: config.primaryColor || '#06b6d4' }}
                      />
                      <div className="grid grid-cols-4 gap-1 pt-1">
                        {[
                          { label: 'Off', val: 0 },
                          { label: 'Soft', val: 12 },
                          { label: 'Neon', val: 24 },
                          { label: 'Ultra', val: 40 },
                        ].map((preset) => (
                          <button
                            key={preset.val}
                            type="button"
                            onClick={() => onChangeGlowIntensity?.(preset.val)}
                            className={`px-1.5 py-1 rounded text-[10px] font-mono font-semibold border transition-all cursor-pointer ${
                              config.glowIntensity === preset.val
                                ? 'bg-cyan-500 text-neutral-950 border-cyan-400 shadow-sm'
                                : isDark
                                ? 'bg-white/5 hover:bg-white/10 border-white/10 text-neutral-300'
                                : 'bg-slate-100 hover:bg-slate-200 border-neutral-200 text-neutral-700'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Particle Trails Toggle */}
                    {onToggleParticleTrails && (
                      <div className="flex items-center justify-between pt-2 border-t border-white/10">
                        <div>
                          <span className="text-xs font-semibold block text-white">Motion Trail Blur</span>
                          <span className="text-[10px] text-neutral-400">Jejak pendaran partikel lembut</span>
                        </div>
                        <button
                          type="button"
                          onClick={onToggleParticleTrails}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                            config.particleTrails
                              ? 'bg-cyan-500 text-neutral-950 border-cyan-400 shadow-sm'
                              : 'bg-white/5 border-white/10 text-neutral-400'
                          }`}
                        >
                          {config.particleTrails ? 'ON' : 'OFF'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 3: Bass Boost */}
                {fxActiveTab === 'bass' && (
                  <div className="space-y-2 animate-in fade-in duration-150">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[11px] text-neutral-400">Low-Shelf (&lt;150Hz)</span>
                      <span className="font-mono text-amber-400 font-bold text-xs px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                        +{config.bassBoost || 0} dB
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={18}
                      step={1}
                      value={config.bassBoost || 0}
                      onChange={(e) => onChangeBassBoost?.(parseInt(e.target.value))}
                      className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                      style={{ accentColor: '#f59e0b' }}
                    />
                    <div className="grid grid-cols-4 gap-1 pt-1">
                      {[
                        { label: 'Flat', val: 0 },
                        { label: '+6dB', val: 6 },
                        { label: '+10dB', val: 10 },
                        { label: '+16dB', val: 16 },
                      ].map((preset) => (
                        <button
                          key={preset.val}
                          type="button"
                          onClick={() => onChangeBassBoost?.(preset.val)}
                          className={`px-1.5 py-1 rounded text-[10px] font-mono font-semibold border transition-all cursor-pointer ${
                            (config.bassBoost || 0) === preset.val
                              ? 'bg-amber-500 text-neutral-950 border-amber-400 shadow-sm'
                              : isDark
                              ? 'bg-white/5 hover:bg-white/10 border-white/10 text-neutral-300'
                              : 'bg-slate-100 hover:bg-slate-200 border-neutral-200 text-neutral-700'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-neutral-400 pt-1 leading-snug">
                      Meningkatkan hentakan sub-bass & reaktivitas spektrum secara live.
                    </p>
                  </div>
                )}

                {/* Tab 4: Transient Shake */}
                {fxActiveTab === 'shake' && (
                  <div className="space-y-2 animate-in fade-in duration-150">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[11px] text-neutral-400">Puncak Nada Tinggi (&gt;3.2kHz)</span>
                      <button
                        type="button"
                        onClick={() => onToggleTransientShake?.()}
                        className={`font-mono text-xs px-2 py-0.5 rounded font-bold border transition-colors cursor-pointer ${
                          (config.transientShake ?? true)
                            ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                            : 'bg-white/5 border-white/10 text-neutral-400'
                        }`}
                      >
                        {(config.transientShake ?? true) ? 'AKTIF' : 'NONAKTIF'}
                      </button>
                    </div>

                    {(config.transientShake ?? true) && (
                      <>
                        <div className="flex justify-between items-center text-xs pt-1">
                          <span className="text-[11px] text-neutral-400">Intensitas Shake</span>
                          <span className="font-mono text-cyan-400 font-bold text-xs px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                            {(config.transientShakeIntensity ?? 1.2).toFixed(1)}x
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0.2}
                          max={3.0}
                          step={0.1}
                          value={config.transientShakeIntensity ?? 1.2}
                          onChange={(e) => onChangeTransientShakeIntensity?.(parseFloat(e.target.value))}
                          className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                          style={{ accentColor: '#06b6d4' }}
                        />
                        <div className="grid grid-cols-4 gap-1 pt-1">
                          {[
                            { label: '0.5x', val: 0.5 },
                            { label: '1.0x', val: 1.0 },
                            { label: '1.5x', val: 1.5 },
                            { label: '2.5x', val: 2.5 },
                          ].map((preset) => (
                            <button
                              key={preset.val}
                              type="button"
                              onClick={() => onChangeTransientShakeIntensity?.(preset.val)}
                              className={`px-1.5 py-1 rounded text-[10px] font-mono font-semibold border transition-all cursor-pointer ${
                                Math.abs((config.transientShakeIntensity ?? 1.2) - preset.val) < 0.05
                                  ? 'bg-cyan-500 text-neutral-950 border-cyan-400 shadow-sm'
                                  : isDark
                                  ? 'bg-white/5 hover:bg-white/10 border-white/10 text-neutral-300'
                                  : 'bg-slate-100 hover:bg-slate-200 border-neutral-200 text-neutral-700'
                              }`}
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Zen / Focus Mode Toggle (Hide HUD) */}
          <button
            type="button"
            onClick={() => setIsHudHidden(true)}
            title="Sembunyikan HUD (Mode Layar Bersih)"
            className={`p-1.5 rounded-full border backdrop-blur-md transition-all cursor-pointer ${
              isDark
                ? 'bg-neutral-900/60 hover:bg-neutral-800 border-white/10 text-neutral-400 hover:text-white'
                : 'bg-white/80 hover:bg-white border-black/10 text-neutral-600 hover:text-black shadow-sm'
            }`}
          >
            <EyeOff className="w-3.5 h-3.5" />
          </button>

          {/* Open Full Studio Settings */}
          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              title="Buka Pengaturan Visualizer Lengkap"
              className={`p-1.5 rounded-full border backdrop-blur-md transition-all cursor-pointer ${
                isDark
                  ? 'bg-neutral-900/60 hover:bg-neutral-800 border-white/10 text-neutral-400 hover:text-cyan-400'
                  : 'bg-white/80 hover:bg-white border-black/10 text-neutral-600 hover:text-cyan-600 shadow-sm'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
