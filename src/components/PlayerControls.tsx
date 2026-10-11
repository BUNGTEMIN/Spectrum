import React, { useState, useEffect } from 'react';
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
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPlayPause, onToggleMute, onOpenSettings]);

  const formatTime = (sec: number): string => {
    if (isNaN(sec) || sec < 0) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const currentPercent = audioState.duration > 0
    ? (audioState.currentTime / audioState.duration) * 100
    : 0;

  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-4xl transition-all duration-300 z-30 ${
        isMinimized ? 'translate-y-[calc(100%-3rem)]' : 'translate-y-0'
      }`}
    >
      <div
        className={`glass-panel rounded-2xl p-3 sm:p-4 shadow-2xl border flex flex-col gap-3 relative transition-colors duration-300 ${
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

        {/* Timeline Bar & Duration */}
        <div
          className={`flex items-center gap-3 text-xs font-mono-code tabular-nums px-1 ${
            isDark ? 'text-neutral-400' : 'text-neutral-500'
          }`}
        >
          <span className="w-11 text-right">{formatTime(audioState.currentTime)}</span>
          <div className="relative flex-1 flex items-center group cursor-pointer">
            <input
              type="range"
              min={0}
              max={audioState.duration || 100}
              step={0.1}
              value={audioState.currentTime}
              onChange={(e) => onSeek(parseFloat(e.target.value))}
              disabled={audioState.fileType === 'demo'}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer disabled:opacity-40"
              style={{
                background: `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${currentPercent}%, ${
                  isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'
                } ${currentPercent}%, ${
                  isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'
                } 100%)`,
              }}
            />
          </div>
          <span className="w-11">
            {audioState.fileType === 'demo' ? '∞ Loop' : formatTime(audioState.duration)}
          </span>
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between flex-wrap gap-2 sm:gap-4">
          {/* Left: Playback & Track Info */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onPlayPause}
              className="w-11 h-11 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-neutral-950 flex items-center justify-center shadow-lg shadow-cyan-500/25 transition-all cursor-pointer font-semibold"
              title={audioState.isPlaying ? 'Jeda (Spasi)' : 'Putar (Spasi)'}
            >
              {audioState.isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>

            <div className="flex flex-col">
              <span
                className={`text-sm font-semibold truncate max-w-[140px] sm:max-w-[220px] ${
                  isDark ? 'text-white' : 'text-neutral-900'
                }`}
              >
                {audioState.fileName || 'Demo Synthwave Beat'}
              </span>
              <span className="text-xs text-neutral-400 capitalize">
                {audioState.fileType === 'video'
                  ? 'Video Ekstrak Audio'
                  : audioState.fileType === 'audio'
                  ? 'Audio File'
                  : 'Synthesized Beat'}
              </span>
            </div>

            {/* Quick Demo Button */}
            <button
              onClick={onPlayDemo}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                audioState.fileType === 'demo' && audioState.isPlaying
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-500'
                  : isDark
                  ? 'bg-white/5 border-white/10 hover:bg-white/10 text-neutral-300'
                  : 'bg-neutral-100 border-neutral-300 hover:bg-neutral-200 text-neutral-700'
              }`}
              title="Putar beat elektronik otomatis dari Web Audio synth"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
              <span>Demo Beat</span>
            </button>
          </div>

          {/* Right: Actions, Volume, Presets, Settings & Export */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Volume */}
            <div
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${
                isDark ? 'bg-white/5 border-white/10' : 'bg-neutral-100 border-neutral-300'
              }`}
            >
              <button
                onClick={onToggleMute}
                className="text-neutral-400 hover:text-cyan-500 cursor-pointer"
                title={audioState.isMuted ? 'Nyalakan Suara' : 'Bisukan'}
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
                className="w-16 h-1 rounded-full cursor-pointer"
              />
            </div>

            {/* Presets Quick Button */}
            <button
              onClick={() => onOpenSettings('presets')}
              className={`px-2.5 sm:px-3 py-2 rounded-lg active:scale-95 border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                isDark
                  ? 'bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/30 text-cyan-300'
                  : 'bg-cyan-50 hover:bg-cyan-100 border-cyan-300 text-cyan-700'
              }`}
              title="Buka Koleksi Preset Visualizer (P)"
            >
              <Bookmark className="w-4 h-4 text-cyan-500" />
              <span className="hidden sm:inline">Preset</span>
            </button>

            {/* Skin / Visualizer Quick Button */}
            <button
              onClick={() => onOpenSettings('visualizer')}
              className={`px-2.5 sm:px-3 py-2 rounded-lg active:scale-95 border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                isDark
                  ? 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30 text-purple-300'
                  : 'bg-purple-50 hover:bg-purple-100 border-purple-300 text-purple-700'
              }`}
              title="Pilih Varian Skin Visualizer (Waveform, Shards, Circular, Hex, Grid)"
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="hidden md:inline">Skin</span>
            </button>

            {/* Upload Media */}
            <button
              onClick={onOpenUpload}
              className={`px-2.5 sm:px-3 py-2 rounded-lg active:scale-95 border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                isDark
                  ? 'bg-white/5 hover:bg-white/10 border-white/10 text-neutral-200'
                  : 'bg-white hover:bg-neutral-100 border-neutral-300 text-neutral-700 shadow-sm'
              }`}
              title="Upload File Audio, Video, Cover, atau Background"
            >
              <Upload className="w-4 h-4 text-cyan-500" />
              <span className="hidden sm:inline">Upload</span>
            </button>

            {/* Settings */}
            <button
              onClick={() => onOpenSettings()}
              className={`px-2.5 sm:px-3 py-2 rounded-lg active:scale-95 border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                isDark
                  ? 'bg-white/5 hover:bg-white/10 border-white/10 text-neutral-200'
                  : 'bg-white hover:bg-neutral-100 border-neutral-300 text-neutral-700 shadow-sm'
              }`}
              title="Buka Panel Pengaturan Visualizer (S)"
            >
              <Sliders className="w-4 h-4 text-purple-500" />
              <span className="hidden sm:inline">Kustom</span>
            </button>

            {/* Video Record / Export */}
            <button
              onClick={onOpenExport}
              className={`px-3 py-2 rounded-lg active:scale-95 border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                recordingState.isRecording
                  ? 'bg-red-500 hover:bg-red-600 border-red-400 text-white animate-pulse'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 border-cyan-400/40 text-neutral-950 shadow-md shadow-cyan-500/20'
              }`}
              title="Rekam dan Ekspor Visualizer ke Video MP4 / WebM"
            >
              <Video className="w-4 h-4" />
              <span>{recordingState.isRecording ? 'Merekam...' : 'Ekspor MP4'}</span>
            </button>

            {/* Standalone HTML Exporter */}
            <button
              onClick={onDownloadStandaloneHTML}
              className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                isDark
                  ? 'bg-white/5 hover:bg-white/10 border-white/10 text-neutral-300 hover:text-white'
                  : 'bg-white hover:bg-neutral-100 border-neutral-300 text-neutral-700 shadow-sm'
              }`}
              title="Unduh 1 File index.html Mandiri (Standalone Offline)"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Codec Info */}
            <button
              onClick={onOpenCodecInfo}
              className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                isDark
                  ? 'bg-white/5 hover:bg-white/10 border-white/10 text-neutral-400 hover:text-white'
                  : 'bg-white hover:bg-neutral-100 border-neutral-300 text-neutral-600 shadow-sm'
              }`}
              title="Info Kompatibilitas Codec Browser"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

