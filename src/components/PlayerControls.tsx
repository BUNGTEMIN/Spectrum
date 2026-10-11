import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Sliders,
  Video,
  Upload,
  Sparkles,
  Info,
  Download,
  ChevronDown,
  ChevronUp,
  Bookmark,
  Activity,
} from 'lucide-react';
import { AudioState, RecordingState, ThemeMode } from '../types/visualizer';
import { SettingsTab } from './SettingsPanel';

interface PlayerControlsProps {
  theme: ThemeMode;
  audioState: AudioState;
  recordingState: RecordingState;
  onPlayPause: () => void;
  onSeek: (seconds: number) => void;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
  onOpenSettings: (tab?: SettingsTab) => void;
  onOpenExport: () => void;
  onOpenUpload: () => void;
  onOpenCodecInfo: () => void;
  onPlayDemo: () => void;
  onDownloadStandaloneHTML: () => void;
}

/**
 * Interactive Mini Waveform Scrubber
 * Allows visual scrubbing through the audio track with real-time feedback,
 * hover timestamp preview, and responsive touch/mouse drag.
 */
interface WaveformScrubberProps {
  peaks?: number[];
  currentTime: number;
  duration: number;
  fileType: 'audio' | 'video' | 'demo';
  isDark: boolean;
  isPlaying: boolean;
  onSeek: (seconds: number) => void;
  formatTime: (sec: number) => string;
}

const WaveformScrubber: React.FC<WaveformScrubberProps> = ({
  peaks,
  currentTime,
  duration,
  fileType,
  isDark,
  isPlaying,
  onSeek,
  formatTime,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [hoverPercent, setHoverPercent] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPercent, setDragPercent] = useState<number | null>(null);

  // Effective duration: if duration is 0 and it's demo, treat as 30s loop
  const effectiveDuration = duration > 0 ? duration : (fileType === 'demo' ? 30 : 100);

  // Active playback ratio (0..1)
  const currentRatio = effectiveDuration > 0
    ? (fileType === 'demo' && duration === 0
        ? (currentTime % 30) / 30
        : Math.min(1, Math.max(0, currentTime / effectiveDuration)))
    : 0;

  const activePercent = isDragging && dragPercent !== null
    ? dragPercent
    : currentRatio * 100;

  // Compute percentage (0..100) from clientX relative to container
  const computePercentFromX = useCallback((clientX: number): number => {
    if (!containerRef.current) return 0;
    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width <= 0) return 0;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return ratio * 100;
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const percent = computePercentFromX(e.clientX);
    setIsDragging(true);
    setDragPercent(percent);
    const targetSeconds = (percent / 100) * effectiveDuration;
    onSeek(targetSeconds);

    const onPointerMove = (moveEvent: PointerEvent) => {
      const p = computePercentFromX(moveEvent.clientX);
      setDragPercent(p);
      const targetSec = (p / 100) * effectiveDuration;
      onSeek(targetSec);
    };

    const onPointerUp = () => {
      setIsDragging(false);
      setDragPercent(null);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) return;
    const percent = computePercentFromX(e.clientX);
    setHoverPercent(percent);
  };

  const handlePointerEnter = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsHovering(true);
    setHoverPercent(computePercentFromX(e.clientX));
  };

  const handlePointerLeave = () => {
    if (!isDragging) {
      setIsHovering(false);
      setHoverPercent(null);
    }
  };

  const hoverTimeSeconds = hoverPercent !== null
    ? (hoverPercent / 100) * effectiveDuration
    : null;

  // Fallback peaks if empty
  const barData = peaks && peaks.length >= 20 ? peaks : Array.from({ length: 90 }, (_, i) => {
    const ph = i / 90;
    return 0.18 + 0.62 * Math.sin(ph * Math.PI) * (i % 4 === 0 ? 0.95 : i % 2 === 0 ? 0.7 : 0.45);
  });

  const totalBars = barData.length;
  // SVG viewBox settings
  const svgWidth = 1000;
  const svgHeight = 44;
  const centerY = svgHeight / 2;
  const barStep = svgWidth / totalBars;
  const barWidth = Math.max(2.4, barStep * 0.62);

  return (
    <div className="w-full flex flex-col gap-1.5 pt-2 border-t border-white/10 dark:border-white/10 select-none">
      {/* Waveform track interactive visual scrubbing container */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        className="relative w-full h-11 flex items-center cursor-pointer group rounded-xl px-1 py-0.5 transition-colors overflow-visible select-none touch-none"
        title="Klik atau geser untuk scrubbing visual melalui lagu"
      >
        {/* Floating Timestamp Tooltip while hovering or dragging */}
        {(isHovering || isDragging) && (hoverPercent !== null || dragPercent !== null) && (
          <div
            className="absolute -top-7 z-30 pointer-events-none -translate-x-1/2 flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold shadow-xl border backdrop-blur-md transition-[left] duration-75 animate-in fade-in"
            style={{
              left: `${Math.max(4, Math.min(96, isDragging && dragPercent !== null ? dragPercent : (hoverPercent ?? 0)))}%`,
              backgroundColor: isDark ? 'rgba(15, 23, 42, 0.96)' : 'rgba(255, 255, 255, 0.96)',
              borderColor: 'rgba(6, 182, 212, 0.55)',
              color: isDark ? '#38bdf8' : '#0284c7',
              boxShadow: '0 4px 14px rgba(6, 182, 212, 0.35)',
            }}
          >
            <span>▶</span>
            <span>
              {formatTime(
                isDragging && dragPercent !== null
                  ? (dragPercent / 100) * effectiveDuration
                  : (hoverTimeSeconds ?? 0)
              )}
            </span>
          </div>
        )}

        {/* Hover ghost hairline indicator */}
        {isHovering && !isDragging && hoverPercent !== null && (
          <div
            className="absolute top-0 bottom-0 w-[1.5px] pointer-events-none z-10 bg-white/50 shadow-sm"
            style={{ left: `${hoverPercent}%` }}
          />
        )}

        {/* Interactive Waveform SVG visualization */}
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          preserveAspectRatio="none"
          className="w-full h-full block overflow-visible"
        >
          <defs>
            <linearGradient id="waveformPlayedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="45%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
            <linearGradient id="waveformHoverGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(6, 182, 212, 0.65)" />
              <stop offset="100%" stopColor="rgba(59, 130, 246, 0.65)" />
            </linearGradient>
            <filter id="waveformGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {barData.map((peak, idx) => {
            const barCenterRatio = (idx + 0.5) / totalBars;
            const barPercent = barCenterRatio * 100;
            const isPlayed = barPercent <= activePercent;
            const isHoverPreview =
              !isPlayed &&
              isHovering &&
              hoverPercent !== null &&
              barPercent <= hoverPercent;

            // Centered bipolar amplitude height
            const barHeight = Math.max(3.5, peak * (svgHeight - 6));
            const y = centerY - barHeight / 2;
            const x = idx * barStep + (barStep - barWidth) / 2;

            let fillColor: string;
            if (isPlayed) {
              fillColor = 'url(#waveformPlayedGradient)';
            } else if (isHoverPreview) {
              fillColor = 'url(#waveformHoverGradient)';
            } else {
              fillColor = isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(15, 23, 42, 0.18)';
            }

            return (
              <rect
                key={idx}
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={barWidth / 2}
                fill={fillColor}
                filter={isPlayed ? 'url(#waveformGlow)' : undefined}
                className="transition-colors duration-100"
              />
            );
          })}
        </svg>

        {/* Playhead Scrubber Needle */}
        <div
          className={`absolute top-0 bottom-0 pointer-events-none z-20 -translate-x-1/2 flex flex-col items-center justify-between ${
            isDragging ? '' : 'transition-[left] duration-75'
          }`}
          style={{ left: `${activePercent}%` }}
        >
          {/* Top Scrubber Pin */}
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-300 ring-2 ring-cyan-500 shadow-md shadow-cyan-500/60 -mt-1" />
          {/* Vertical Needle Line */}
          <div className="w-[2px] flex-1 bg-cyan-400 shadow-[0_0_10px_#06b6d4]" />
          {/* Bottom Scrubber Pin */}
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-sm -mb-0.5" />
        </div>
      </div>

      {/* Scrubbing Info & Time Markers */}
      <div className="flex items-center justify-between text-[11px] font-mono-code tabular-nums px-1 text-neutral-400">
        <span className="font-semibold text-cyan-400">
          {formatTime(
            isDragging && dragPercent !== null
              ? (dragPercent / 100) * effectiveDuration
              : currentTime
          )}
        </span>

        <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 tracking-wider">
          <Activity className="w-3 h-3 text-cyan-400 animate-pulse" />
          <span className="hidden sm:inline font-medium">Mini Waveform Visual Scrubber</span>
          <span className="sm:hidden font-medium">Waveform</span>
        </div>

        <span>
          {fileType === 'demo' && duration === 0 ? '∞ Synth Loop' : formatTime(effectiveDuration)}
        </span>
      </div>
    </div>
  );
};

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  theme,
  audioState,
  recordingState,
  onPlayPause,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onOpenSettings,
  onOpenExport,
  onOpenUpload,
  onOpenCodecInfo,
  onPlayDemo,
  onDownloadStandaloneHTML,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const isDark = theme === 'dark';

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is in an input or text field
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        onPlayPause();
      } else if (e.key === 'm' || e.key === 'M') {
        onToggleMute();
      } else if (e.key === 's' || e.key === 'S') {
        onOpenSettings();
      } else if (e.key === 'p' || e.key === 'P') {
        onOpenSettings('presets');
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onSeek(Math.max(0, audioState.currentTime - 5));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const maxDur = audioState.duration > 0 ? audioState.duration : 30;
        onSeek(Math.min(maxDur, audioState.currentTime + 5));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPlayPause, onToggleMute, onOpenSettings, onSeek, audioState.currentTime, audioState.duration]);

  const formatTime = (sec: number): string => {
    if (isNaN(sec) || sec < 0) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-4xl transition-all duration-300 z-30 ${
        isMinimized ? 'translate-y-[calc(100%-3rem)]' : 'translate-y-0'
      }`}
    >
      <div
        className={`glass-panel rounded-2xl p-3 sm:p-4 shadow-2xl border flex flex-col gap-2.5 relative transition-colors duration-300 ${
          isDark
            ? 'border-white/10 text-neutral-100 shadow-cyan-950/20'
            : 'border-neutral-200/80 text-neutral-900 shadow-neutral-300/40'
        }`}
      >
        {/* Toggle Minimize Button */}
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className={`absolute -top-3.5 right-6 px-2.5 py-0.5 rounded-full border text-xs flex items-center gap-1 shadow-lg transition-colors cursor-pointer ${
            isDark
              ? 'bg-neutral-900 border-white/15 text-neutral-400 hover:text-white'
              : 'bg-white border-neutral-300 text-neutral-600 hover:text-neutral-900'
          }`}
          title={isMinimized ? 'Tampilkan Kontrol' : 'Sembunyikan Kontrol'}
        >
          {isMinimized ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          <span>{isMinimized ? 'Panel Kontrol' : 'Sembunyikan'}</span>
        </button>

        {/* Controls Row */}
        <div className="flex items-center justify-between gap-3 sm:gap-6">
          {/* Left: Album Art & Track Info */}
          <div className="flex items-center gap-3 min-w-0 flex-1 sm:flex-initial">
            {/* Mini Cover Thumbnail */}
            <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-neutral-900 border border-white/10 shrink-0 shadow-md">
              {audioState.coverUrl ? (
                <img
                  src={audioState.coverUrl}
                  alt="Track Cover"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-900 via-neutral-800 to-cyan-950/40 text-cyan-400">
                  <span className="text-base">✦</span>
                </div>
              )}
            </div>

            <div className="flex flex-col min-w-0">
              <span
                className={`text-sm font-semibold truncate max-w-[150px] sm:max-w-[220px] ${
                  isDark ? 'text-white' : 'text-neutral-900'
                }`}
                title={audioState.fileName || 'Synthesized Beat'}
              >
                {audioState.fileName || 'Synthesized Beat'}
              </span>
              <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                <span className="truncate max-w-[100px] sm:max-w-[140px]">
                  {audioState.fileType === 'video'
                    ? 'Video Ekstrak Audio'
                    : audioState.fileType === 'audio'
                    ? 'Audio MP3 / File'
                    : 'Live Web Audio Synth'}
                </span>

                {/* Automated BPM Detection Badge */}
                {audioState.isDetectingBpm ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 animate-pulse">
                    <span>⚡ Deteksi BPM...</span>
                  </span>
                ) : audioState.bpm ? (
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-cyan-300 bg-cyan-500/15 px-1.5 py-0.5 rounded border border-cyan-500/30 shadow-sm shadow-cyan-500/20"
                    title={`Tempo terdeteksi: ${audioState.bpm} BPM (Akurasi ${(
                      (audioState.bpmConfidence ?? 0.9) * 100
                    ).toFixed(0)}%)`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse inline-block" />
                    <span>{audioState.bpm} BPM</span>
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {/* Center: Play/Pause Button */}
          <div className="flex items-center justify-center">
            <button
              onClick={onPlayPause}
              className="w-11 h-11 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:scale-95 text-neutral-950 flex items-center justify-center shadow-lg shadow-cyan-500/25 transition-all cursor-pointer font-semibold shrink-0"
              title={audioState.isPlaying ? 'Jeda (Spasi)' : 'Putar (Spasi)'}
            >
              {audioState.isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>
          </div>

          {/* Right: Volume, Upload, Presets & Settings */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Volume Control */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border ${
                isDark ? 'bg-white/5 border-white/10' : 'bg-neutral-100 border-neutral-300'
              }`}
            >
              <button
                onClick={onToggleMute}
                className="text-neutral-400 hover:text-cyan-400 cursor-pointer"
                title={audioState.isMuted ? 'Nyalakan Suara (M)' : 'Bisukan (M)'}
              >
                {audioState.isMuted || audioState.volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-red-500" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={audioState.isMuted ? 0 : audioState.volume}
                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                className="w-14 sm:w-18 h-1 rounded-full cursor-pointer"
              />
            </div>

            {/* Presets Quick Button */}
            <button
              onClick={() => onOpenSettings('presets')}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                isDark
                  ? 'bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/30 text-cyan-300'
                  : 'bg-cyan-50 hover:bg-cyan-100 border-cyan-300 text-cyan-700'
              }`}
              title="Koleksi Preset Visualizer (P)"
            >
              <Bookmark className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Preset</span>
            </button>

            {/* Upload Media */}
            <button
              onClick={onOpenUpload}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                isDark
                  ? 'bg-white/5 hover:bg-white/10 border-white/10 text-neutral-200'
                  : 'bg-white hover:bg-neutral-100 border-neutral-300 text-neutral-700 shadow-sm'
              }`}
              title="Upload Audio, Cover, atau Background"
            >
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Upload</span>
            </button>

            {/* Settings */}
            <button
              onClick={() => onOpenSettings()}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                isDark
                  ? 'bg-white/5 hover:bg-white/10 border-white/10 text-neutral-200'
                  : 'bg-white hover:bg-neutral-100 border-neutral-300 text-neutral-700 shadow-sm'
              }`}
              title="Pengaturan Visualizer (S)"
            >
              <Sliders className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">Studio</span>
            </button>

            {/* Codec Info */}
            <button
              onClick={onOpenCodecInfo}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                isDark
                  ? 'bg-white/5 hover:bg-white/10 border-white/10 text-neutral-400 hover:text-white'
                  : 'bg-white hover:bg-neutral-100 border-neutral-300 text-neutral-600 shadow-sm'
              }`}
              title="Info Codec Browser"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Mini Waveform Visualization & Visual Scrubbing at the bottom of PlayerControls */}
        <WaveformScrubber
          peaks={audioState.waveformPeaks}
          currentTime={audioState.currentTime}
          duration={audioState.duration}
          fileType={audioState.fileType}
          isDark={isDark}
          isPlaying={audioState.isPlaying}
          onSeek={onSeek}
          formatTime={formatTime}
        />
      </div>
    </div>
  );
};


