import React from 'react';
import { Sparkles, Video, Sun, Moon, Bookmark } from 'lucide-react';
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
      className={`fixed top-0 inset-x-0 h-16 z-30 px-4 sm:px-8 flex items-center justify-between border-b glass-panel-subtle select-none transition-colors duration-300 ${
        isDark ? 'border-white/10 text-white' : 'border-neutral-200 text-neutral-900'
      }`}
    >
      {/* Zone 1: Single text element wordmark in display font */}
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
        }}
        className="text-lg font-bold tracking-tight font-display flex items-center gap-2 group cursor-pointer"
      >
        <span className="text-cyan-400 group-hover:scale-110 transition-transform">✦</span>
        <span>AveeFlow</span>
      </a>

      {/* Zone 2: 4-6 clean text navigation links */}
      <nav
        className={`hidden md:flex items-center gap-6 text-xs font-semibold ${
          isDark ? 'text-neutral-400' : 'text-neutral-600'
        }`}
      >
        <button
          onClick={() => onOpenSettings('presets')}
          className="hover:text-cyan-400 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Bookmark className="w-3.5 h-3.5 text-cyan-400" />
          <span>Preset Visualizer</span>
        </button>
        <button
          onClick={onOpenUpload}
          className="hover:text-cyan-400 transition-colors cursor-pointer"
        >
          Media & Audio
        </button>
        <button
          onClick={() => onOpenSettings('visualizer')}
          className="hover:text-cyan-400 transition-colors cursor-pointer"
        >
          Skin & Spektrum
        </button>
        <button
          onClick={() => onOpenSettings('colors')}
          className="hover:text-cyan-400 transition-colors cursor-pointer"
        >
          Palet Neon
        </button>
        <button
          onClick={() => onOpenSettings('reactivity')}
          className="hover:text-cyan-400 transition-colors cursor-pointer"
        >
          Respon Bass
        </button>
        <button
          onClick={onDownloadStandaloneHTML}
          className="hover:text-cyan-400 transition-colors cursor-pointer text-cyan-500 font-bold"
        >
          HTML Standalone
        </button>
      </nav>

      {/* Zone 3: Actions + Theme Toggle */}
      <div className="flex items-center gap-2 sm:gap-2.5">
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
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600" />
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
          className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-neutral-950 font-bold text-xs transition-all shadow-md shadow-cyan-500/20 cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
        >
          <Video className="w-3.5 h-3.5" />
          <span>Ekspor Video</span>
        </button>
      </div>
    </header>
  );
};
