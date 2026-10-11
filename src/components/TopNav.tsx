import React from 'react';
import { Sparkles, Video, Sun, Moon, Bookmark, Sliders, Upload, Download } from 'lucide-react';
import { ThemeMode } from '../types/visualizer';
import { SettingsTab } from './SettingsPanel';

interface TopNavProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  onOpenUpload: () => void;
  onOpenSettings: (tab?: SettingsTab) => void;
  onOpenExport: () => void;
  onPlayDemo: () => void;
  onDownloadStandaloneHTML: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  theme,
  onToggleTheme,
  onOpenUpload,
  onOpenSettings,
  onOpenExport,
  onPlayDemo,
  onDownloadStandaloneHTML,
}) => {
  const isDark = theme === 'dark';

  return (
    <header
      className={`fixed top-0 inset-x-0 h-14 z-30 px-4 sm:px-8 flex items-center justify-between border-b glass-panel-subtle select-none transition-colors duration-300 ${
        isDark ? 'border-white/10 text-white' : 'border-neutral-200 text-neutral-900'
      }`}
    >
      {/* Zone 1: Single text element wordmark in display font */}
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
        }}
        className="text-xl font-black tracking-tight font-display flex items-center gap-2 group cursor-pointer shrink-0 whitespace-nowrap"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_12px_#06b6d4] group-hover:scale-125 transition-transform" />
        <span className="font-extrabold tracking-wider bg-gradient-to-r from-white via-cyan-100 to-cyan-400 bg-clip-text text-transparent">
          Nu
        </span>
      </a>

      {/* Zone 2: Clean single-line text navigation links */}
      <nav
        className={`hidden md:flex items-center gap-7 text-xs font-semibold ${
          isDark ? 'text-neutral-400' : 'text-neutral-600'
        }`}
      >
        <button
          onClick={() => onOpenSettings('presets')}
          className="hover:text-cyan-400 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <Bookmark className="w-3.5 h-3.5 text-cyan-400" />
          <span>Preset</span>
        </button>
        <button
          onClick={() => onOpenSettings('visualizer')}
          className="hover:text-cyan-400 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <Sliders className="w-3.5 h-3.5 text-purple-400" />
          <span>Kustomisasi</span>
        </button>
        <button
          onClick={onOpenUpload}
          className="hover:text-cyan-400 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <Upload className="w-3.5 h-3.5 text-cyan-400" />
          <span>Media & Cover</span>
        </button>
        <button
          onClick={onDownloadStandaloneHTML}
          className="hover:text-cyan-400 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 text-cyan-400/90 font-medium"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          <span>Standalone HTML</span>
        </button>
      </nav>

      {/* Zone 3: Actions + Theme Toggle */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Dark / Light Mode Switcher */}
        <button
          onClick={onToggleTheme}
          className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
            isDark
              ? 'bg-white/5 hover:bg-white/10 border-white/10 text-amber-300 hover:text-amber-200'
              : 'bg-white hover:bg-neutral-100 border-neutral-300 text-neutral-800 shadow-sm'
          }`}
          title={isDark ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
        >
          {isDark ? (
            <Sun className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-indigo-600" />
          )}
        </button>

        <button
          onClick={onPlayDemo}
          className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
            isDark
              ? 'bg-white/5 hover:bg-white/10 border-white/10 text-neutral-200'
              : 'bg-white hover:bg-neutral-100 border-neutral-300 text-neutral-700 shadow-sm'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Demo Beat</span>
        </button>

        <button
          onClick={onOpenExport}
          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:scale-95 text-neutral-950 font-bold text-xs transition-all shadow-md shadow-cyan-500/25 cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
        >
          <Video className="w-3.5 h-3.5 text-black" />
          <span>Ekspor Video</span>
        </button>
      </div>
    </header>
  );
};
