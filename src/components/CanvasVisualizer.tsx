import React, { useEffect, useRef, useState } from 'react';
import {
  VisualizerConfig,
  AudioState,
  ThemeMode,
  VisualizerSkin,
} from '../types/visualizer';
import { VisualizerRenderer } from '../utils/visualizerRenderer';
import { AudioEngine } from '../utils/audioEngine';
import { Sparkles, ChevronRight, X, Flame } from 'lucide-react';

const SKIN_DATA: Record<
  VisualizerSkin,
  { name: string; icon: string; badge: string }
> = {
  'circular-bars': {
    name: 'Circular Bars',
    icon: '📊',
    badge: 'Avee Classic',
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
  onOpenSettings,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<VisualizerRenderer | null>(null);
  const coverImgRef = useRef<HTMLImageElement | null>(null);
  const bgImgRef = useRef<HTMLImageElement | null>(null);

  const [isGlowOpen, setIsGlowOpen] = useState(false);
  const [isBassBoostOpen, setIsBassBoostOpen] = useState(false);
  const [isShakeOpen, setIsShakeOpen] = useState(false);

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
          curTheme
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
      <canvas
        ref={canvasRef}
        className="w-full h-full block object-contain pointer-events-none"
      />

      {/* Floating Canvas HUD: Active Skin Variant Indicator & Quick-Cycle Pill */}
      <div className="absolute top-16 left-4 sm:top-18 sm:left-6 z-20 flex items-center gap-2 pointer-events-auto">
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

        {/* Quick Particle Trail Motion Blur Toggle Button */}
        {onToggleParticleTrails && (
          <button
            type="button"
            onClick={onToggleParticleTrails}
            title={
              config.particleTrails
                ? 'Particle Trail: AKTIF (Klik untuk mematikan jejak blur)'
                : 'Particle Trail: NONAKTIF (Klik untuk menyalakan efek motion blur trail)'
            }
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-semibold backdrop-blur-md transition-all cursor-pointer shadow-md active:scale-95 ${
              config.particleTrails
                ? isDark
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/60 shadow-cyan-500/20'
                  : 'bg-cyan-100 text-cyan-800 border-cyan-400 shadow-cyan-500/10'
                : isDark
                ? 'bg-neutral-900/60 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 border-white/10'
                : 'bg-white/80 hover:bg-white text-neutral-600 hover:text-neutral-900 border-black/10'
            }`}
          >
            <span className="text-[12px] leading-none">💫</span>
            <span className="text-[11px] font-medium hidden sm:inline">Trail</span>
            <span
              className={`text-[9px] px-1 py-0.2 rounded font-mono font-bold uppercase ${
                config.particleTrails
                  ? 'bg-cyan-400 text-neutral-950'
                  : 'bg-white/10 text-neutral-400'
              }`}
            >
              {config.particleTrails ? 'ON' : 'OFF'}
            </span>
          </button>
        )}

        {/* Quick Glow Intensity (shadowBlur) Popover Control */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsGlowOpen(!isGlowOpen)}
            title={`Intensitas Glow Neon: ${config.glowIntensity}px (shadowBlur) • Klik untuk mengatur`}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-semibold backdrop-blur-md transition-all cursor-pointer shadow-md active:scale-95 ${
              config.glowIntensity > 0
                ? isDark
                  ? 'bg-neutral-900/80 text-cyan-300 border-cyan-400/50 hover:bg-neutral-800'
                  : 'bg-white/90 text-cyan-700 border-cyan-400/60 hover:bg-white'
                : isDark
                ? 'bg-neutral-900/60 hover:bg-neutral-800 text-neutral-400 border-white/10'
                : 'bg-white/80 hover:bg-white text-neutral-600 border-black/10'
            }`}
            style={{
              boxShadow: config.glowIntensity > 0 ? `0 0 ${Math.min(16, config.glowIntensity)}px ${config.primaryColor}40` : undefined,
            }}
          >
            <span className="text-[12px] leading-none">✨</span>
            <span className="text-[11px] font-medium hidden sm:inline">Glow</span>
            <span className="text-[9px] px-1 py-0.2 rounded font-mono font-bold bg-white/10">
              {config.glowIntensity}px
            </span>
          </button>

          {/* Glow Intensity Popover Slider directly on the Canvas */}
          {isGlowOpen && (
            <div
              className={`absolute top-full left-0 mt-2 w-64 p-3.5 rounded-2xl border shadow-2xl backdrop-blur-xl z-30 transition-all ${
                isDark
                  ? 'bg-neutral-950/95 border-cyan-500/30 text-neutral-100 shadow-cyan-950/50 ring-1 ring-cyan-500/20'
                  : 'bg-white/95 border-cyan-400/40 text-neutral-900 shadow-neutral-400/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">✨</span>
                  <span className="text-xs font-bold">Glow Intensity (shadowBlur)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsGlowOpen(false)}
                  className="p-1 rounded-md opacity-60 hover:opacity-100 hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[11px] text-neutral-400">Canvas shadowBlur</span>
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
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (onChangeGlowIntensity) {
                      onChangeGlowIntensity(val);
                    }
                  }}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{
                    accentColor: config.primaryColor || '#06b6d4',
                  }}
                />

                {/* Quick preset buttons */}
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

                <p className="text-[10px] text-neutral-400 pt-1 leading-snug border-t border-white/5">
                  Memetakan langsung ke <code>canvas.shadowBlur</code> & <code>shadowColor</code> untuk pendaran neon otentik.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Bass Boost (IIRFilter) Popover Control */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsBassBoostOpen(!isBassBoostOpen)}
            title={`Bass Boost (IIRFilter): +${config.bassBoost || 0} dB • Klik untuk mengatur`}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-semibold backdrop-blur-md transition-all cursor-pointer shadow-md active:scale-95 ${
              (config.bassBoost || 0) > 0
                ? isDark
                  ? 'bg-neutral-900/80 text-amber-300 border-amber-500/50 hover:bg-neutral-800'
                  : 'bg-white/90 text-amber-700 border-amber-400/60 hover:bg-white'
                : isDark
                ? 'bg-neutral-900/60 hover:bg-neutral-800 text-neutral-400 border-white/10'
                : 'bg-white/80 hover:bg-white text-neutral-600 border-black/10'
            }`}
          >
            <span className="text-[12px] leading-none">🔊</span>
            <span className="text-[11px] font-medium hidden sm:inline">Bass</span>
            <span className="text-[9px] px-1 py-0.2 rounded font-mono font-bold bg-white/10">
              +{config.bassBoost || 0}dB
            </span>
          </button>

          {/* Bass Boost Popover Slider directly on the Canvas */}
          {isBassBoostOpen && (
            <div
              className={`absolute top-full left-0 mt-2 w-64 p-3.5 rounded-2xl border shadow-2xl backdrop-blur-xl z-30 transition-all ${
                isDark
                  ? 'bg-neutral-950/95 border-amber-500/30 text-neutral-100 shadow-amber-950/50 ring-1 ring-amber-500/20'
                  : 'bg-white/95 border-amber-400/40 text-neutral-900 shadow-neutral-400/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">🔊</span>
                  <span className="text-xs font-bold">Bass Boost (IIRFilter)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBassBoostOpen(false)}
                  className="p-1 rounded-md opacity-60 hover:opacity-100 hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[11px] text-neutral-400">Low-Shelf &lt; 150Hz</span>
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
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (onChangeBassBoost) {
                      onChangeBassBoost(val);
                    }
                  }}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{
                    accentColor: '#f59e0b',
                  }}
                />

                {/* Quick preset buttons */}
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

                <p className="text-[10px] text-neutral-400 pt-1 leading-snug border-t border-white/5">
                  Menerapkan IIRFilter Web Audio untuk mendongkrak sub-bass dan reaktivitas visual.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Transient Peak Shake Control */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsShakeOpen(!isShakeOpen)}
            title={`Guncangan Transien Frekuensi Tinggi: ${(config.transientShake ?? true) ? 'AKTIF' : 'NONAKTIF'} • Klik untuk mengatur`}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-semibold backdrop-blur-md transition-all cursor-pointer shadow-md active:scale-95 ${
              (config.transientShake ?? true)
                ? isDark
                  ? 'bg-neutral-900/80 text-cyan-300 border-cyan-500/50 hover:bg-neutral-800'
                  : 'bg-white/90 text-cyan-700 border-cyan-400/60 hover:bg-white'
                : isDark
                ? 'bg-neutral-900/60 hover:bg-neutral-800 text-neutral-400 border-white/10'
                : 'bg-white/80 hover:bg-white text-neutral-600 border-black/10'
            }`}
          >
            <span className="text-[12px] leading-none">⚡</span>
            <span className="text-[11px] font-medium hidden sm:inline">Shake</span>
            <span className="text-[9px] px-1 py-0.2 rounded font-mono font-bold bg-white/10">
              {(config.transientShake ?? true) ? `${(config.transientShakeIntensity ?? 1.2).toFixed(1)}x` : 'OFF'}
            </span>
          </button>

          {isShakeOpen && (
            <div
              className={`absolute top-full left-0 mt-2 w-64 p-3.5 rounded-2xl border shadow-2xl backdrop-blur-xl z-30 transition-all ${
                isDark
                  ? 'bg-neutral-950/95 border-cyan-500/30 text-neutral-100 shadow-cyan-950/50 ring-1 ring-cyan-500/20'
                  : 'bg-white/95 border-cyan-400/40 text-neutral-900 shadow-neutral-400/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">⚡</span>
                  <span className="text-xs font-bold">Transient Peak Shake</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsShakeOpen(false)}
                  className="p-1 rounded-md opacity-60 hover:opacity-100 hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[11px] text-neutral-400">High-Freq Onset (&gt;3.2kHz)</span>
                  <button
                    type="button"
                    onClick={() => onToggleTransientShake?.()}
                    className={`font-mono text-xs px-2 py-0.5 rounded font-bold border transition-colors cursor-pointer ${
                      (config.transientShake ?? true)
                        ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                        : 'bg-white/5 border-white/10 text-neutral-400'
                    }`}
                  >
                    {(config.transientShake ?? true) ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>

                {(config.transientShake ?? true) && (
                  <>
                    <div className="flex justify-between items-center text-xs pt-1">
                      <span className="text-[11px] text-neutral-400">Intensitas Guncangan</span>
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
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        onChangeTransientShakeIntensity?.(val);
                      }}
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

                <p className="text-[10px] text-neutral-400 pt-1 leading-snug border-t border-white/5">
                  Memicu getaran elektrik multi-arah saat snare, rimshot, dan hi-hat memuncak.
                </p>
              </div>
            </div>
          )}
        </div>

        {onOpenSettings && (
          <button
            type="button"
            onClick={onOpenSettings}
            title="Buka Kustomisasi Skin di Pengaturan"
            className={`p-1.5 rounded-full border backdrop-blur-md transition-all cursor-pointer ${
              isDark
                ? 'bg-neutral-900/60 hover:bg-neutral-800 border-white/10 text-neutral-400 hover:text-cyan-400'
                : 'bg-white/80 hover:bg-white border-black/10 text-neutral-600 hover:text-cyan-600 shadow-sm'
            }`}
          >
            <Sparkles className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};
