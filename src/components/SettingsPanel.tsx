import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sliders,
  Palette,
  Activity,
  Image as ImageIcon,
  RotateCcw,
  Bookmark,
  Plus,
  Trash2,
  Check,
  Download,
  Upload,
  Sun,
  Moon,
  Sparkles,
} from 'lucide-react';
import {
  VisualizerConfig,
  ColorPreset,
  VisualizerStyle,
  VisualizerSkin,
  ParticleType,
  BackgroundType,
  VisualizerPreset,
  ThemeMode,
} from '../types/visualizer';
import { PresetsManager, BUILT_IN_PRESETS } from '../utils/presetsManager';

const SKIN_VARIANTS: { id: VisualizerSkin; name: string; desc: string; icon: string; badge: string }[] = [
  {
    id: 'circular-bars',
    name: 'Circular Bars',
    desc: 'Batang spektrum melingkar Avee Player dengan ujung bulat & kilau neon',
    icon: '📊',
    badge: 'Avee Classic',
  },
  {
    id: 'waveform-lines',
    name: 'Waveform Lines',
    desc: 'Kurva pita osiloskop harmonik berlapis dengan konektor fase neon',
    icon: '〰️',
    badge: 'Oscilloscope',
  },
  {
    id: 'geometric-shards',
    name: 'Geometric Shards',
    desc: 'Pecahan kristal geometris bersudut tajam dengan faset hologram & kilatan apeks',
    icon: '💎',
    badge: 'Polygonal',
  },
  {
    id: 'cyber-hex',
    name: 'Cyber Hex',
    desc: 'Matriks heksagonal sci-fi HUD dengan bracket data dan bus sirkuit cyber',
    icon: '⬡',
    badge: 'Techno HUD',
  },
  {
    id: 'equalizer-grid',
    name: 'Equalizer Grid',
    desc: 'Blok LED matrix VU-meter digital bertingkat dengan indikator peak hold',
    icon: '▦',
    badge: 'Digital Matrix',
  },
];

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  config: VisualizerConfig;
  onChangeConfig: (newConfig: VisualizerConfig) => void;
  onResetDefaults: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  activePresetId?: string | null;
  onApplyPreset: (preset: VisualizerPreset) => void;
  initialTab?: SettingsTab;
}

const COLOR_PRESETS: ColorPreset[] = [
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    primary: '#06b6d4',
    secondary: '#8b5cf6',
    accent: '#ec4899',
    bgGradient: 'from-cyan-500 to-purple-600',
  },
  {
    id: 'sunset',
    name: 'Sunset Orange',
    primary: '#f97316',
    secondary: '#ec4899',
    accent: '#fbbf24',
    bgGradient: 'from-orange-500 to-pink-600',
  },
  {
    id: 'matrix',
    name: 'Emerald Matrix',
    primary: '#10b981',
    secondary: '#06b6d4',
    accent: '#a7f3d0',
    bgGradient: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'violet',
    name: 'Deep Violet',
    primary: '#a855f7',
    secondary: '#3b82f6',
    accent: '#f43f5e',
    bgGradient: 'from-purple-500 to-indigo-600',
  },
  {
    id: 'solar',
    name: 'Solar Amber',
    primary: '#eab308',
    secondary: '#f97316',
    accent: '#ffffff',
    bgGradient: 'from-yellow-400 to-amber-600',
  },
];

export type SettingsTab = 'presets' | 'visualizer' | 'colors' | 'reactivity' | 'background';

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  config,
  onChangeConfig,
  onResetDefaults,
  theme,
  onToggleTheme,
  activePresetId,
  onApplyPreset,
  initialTab = 'presets',
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [presetsList, setPresetsList] = useState<VisualizerPreset[]>([]);
  const [filterPresetTab, setFilterPresetTab] = useState<'all' | 'user' | 'builtin'>('all');

  // New preset input form state
  const [isCreatingPreset, setIsCreatingPreset] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetDesc, setNewPresetDesc] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const importFileInputRef = useRef<HTMLInputElement>(null);

  // Sync tab with initialTab prop if provided
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Load presets on mount or when opened
  const refreshPresets = () => {
    setPresetsList(PresetsManager.getAllPresets());
  };

  useEffect(() => {
    if (isOpen) {
      refreshPresets();
    }
  }, [isOpen]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  if (!isOpen) return null;

  const update = <K extends keyof VisualizerConfig>(key: K, value: VisualizerConfig[K]) => {
    onChangeConfig({
      ...config,
      [key]: value,
    });
  };

  const applyColorPreset = (preset: ColorPreset) => {
    onChangeConfig({
      ...config,
      primaryColor: preset.primary,
      secondaryColor: preset.secondary,
      accentColor: preset.accent,
    });
  };

  const handleSavePreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) {
      showToast('Harap masukkan nama preset');
      return;
    }

    const saved = PresetsManager.saveUserPreset(newPresetName, config, newPresetDesc);
    refreshPresets();
    setNewPresetName('');
    setNewPresetDesc('');
    setIsCreatingPreset(false);
    showToast(`Preset "${saved.name}" berhasil disimpan!`);
  };

  const handleDeletePreset = (id: string, name: string) => {
    if (window.confirm(`Hapus preset "${name}"?`)) {
      PresetsManager.deleteUserPreset(id);
      refreshPresets();
      showToast(`Preset "${name}" telah dihapus.`);
    }
  };

  const handleExportJSON = () => {
    const jsonStr = PresetsManager.exportPresetsAsJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aveeflow-presets-${Date.now()}.json`;
    a.click();
    showToast('File preset JSON berhasil diekspor!');
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = PresetsManager.importPresetsFromJSON(content);
      if (result.success) {
        refreshPresets();
        showToast(`Berhasil mengimpor ${result.count} preset!`);
      } else {
        alert(result.error || 'Gagal mengimpor file preset.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Filtered presets
  const filteredPresets = presetsList.filter((p) => {
    if (filterPresetTab === 'user') return !p.isBuiltIn;
    if (filterPresetTab === 'builtin') return p.isBuiltIn;
    return true;
  });

  const isDark = theme === 'dark';

  return (
    <div
      className={`fixed inset-y-0 right-0 w-full sm:w-[440px] glass-panel z-40 shadow-2xl flex flex-col border-l animate-in slide-in-from-right duration-200 ${
        isDark
          ? 'border-white/10 text-neutral-100'
          : 'border-neutral-200/80 text-neutral-800'
      }`}
    >
      {/* Header */}
      <div
        className={`p-4 sm:p-5 border-b flex items-center justify-between ${
          isDark ? 'border-white/10' : 'border-neutral-200'
        }`}
      >
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold font-display tracking-wide">
              Kustomisasi Visualizer
            </h2>
            <span
              className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full border ${
                isDark
                  ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                  : 'bg-cyan-100 text-cyan-700 border-cyan-300'
              }`}
            >
              Avee Engine
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Sesuaikan spektrum, warna neon, bass & kelola preset
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Theme Quick Toggle Button */}
          <button
            onClick={onToggleTheme}
            className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              isDark
                ? 'bg-white/5 hover:bg-white/10 border-white/10 text-amber-300 hover:text-amber-200'
                : 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-700'
            }`}
            title={isDark ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>

          {/* Reset Defaults */}
          <button
            onClick={onResetDefaults}
            className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1 transition-all cursor-pointer ${
              isDark
                ? 'bg-white/5 hover:bg-white/10 border-white/10 text-neutral-400 hover:text-white'
                : 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-600 hover:text-neutral-900'
            }`}
            title="Reset ke Pengaturan Awal"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className={`p-2 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
              isDark
                ? 'bg-white/5 hover:bg-white/10 border-white/10 text-neutral-400 hover:text-white'
                : 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div
        className={`flex items-center gap-1 p-2 border-b overflow-x-auto ${
          isDark ? 'bg-neutral-950/60 border-white/5' : 'bg-slate-100/70 border-neutral-200'
        }`}
      >
        <button
          onClick={() => setActiveTab('presets')}
          className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'presets'
              ? isDark
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'bg-cyan-500 text-white shadow-sm'
              : isDark
              ? 'text-neutral-400 hover:text-neutral-200'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>Preset</span>
        </button>

        <button
          onClick={() => setActiveTab('visualizer')}
          className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'visualizer'
              ? isDark
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'bg-cyan-500 text-white shadow-sm'
              : isDark
              ? 'text-neutral-400 hover:text-neutral-200'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Spektrum</span>
        </button>

        <button
          onClick={() => setActiveTab('colors')}
          className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'colors'
              ? isDark
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                : 'bg-purple-600 text-white shadow-sm'
              : isDark
              ? 'text-neutral-400 hover:text-neutral-200'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Warna</span>
        </button>

        <button
          onClick={() => setActiveTab('reactivity')}
          className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'reactivity'
              ? isDark
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'bg-emerald-600 text-white shadow-sm'
              : isDark
              ? 'text-neutral-400 hover:text-neutral-200'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Bass</span>
        </button>

        <button
          onClick={() => setActiveTab('background')}
          className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'background'
              ? isDark
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'bg-amber-500 text-white shadow-sm'
              : isDark
              ? 'text-neutral-400 hover:text-neutral-200'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Latar</span>
        </button>
      </div>

      {/* Toast notification */}
      {toastMessage && (
        <div className="mx-4 mt-3 p-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 text-xs flex items-center gap-2 animate-in fade-in duration-200">
          <Check className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
        {/* ======================================================== */}
        {/* TAB 0: PRESET SISTEM (SAVE / LOAD / MANAGE) */}
        {/* ======================================================== */}
        {activeTab === 'presets' && (
          <div className="space-y-4">
            {/* Theme Toggle Banner */}
            <div
              className={`p-3 rounded-2xl border flex items-center justify-between ${
                isDark
                  ? 'bg-white/5 border-white/10'
                  : 'bg-white border-neutral-200 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2 rounded-xl border ${
                    isDark
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                      : 'bg-amber-100 text-amber-700 border-amber-300'
                  }`}
                >
                  {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                </div>
                <div>
                  <div className="text-xs font-semibold">
                    {isDark ? 'Mode Gelap (Cyber Obsidian)' : 'Mode Terang (Crisp Studio)'}
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    {isDark
                      ? 'Aksen neon glow kontras tinggi'
                      : 'Latar cerah elegan dengan spektrum neon'}
                  </div>
                </div>
              </div>

              <button
                onClick={onToggleTheme}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  isDark
                    ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30'
                    : 'bg-neutral-900 border-neutral-900 text-white hover:bg-neutral-800'
                }`}
              >
                Ganti Tema
              </button>
            </div>

            {/* Save Current Settings as Preset Card */}
            <div
              className={`p-3.5 rounded-2xl border ${
                isDark
                  ? 'bg-gradient-to-b from-white/5 to-white/[0.02] border-white/10'
                  : 'bg-white border-neutral-200 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-cyan-400">
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Simpan Pengaturan Saat Ini</span>
                </div>
                {!isCreatingPreset && (
                  <button
                    onClick={() => setIsCreatingPreset(true)}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Preset Baru</span>
                  </button>
                )}
              </div>

              {isCreatingPreset ? (
                <form onSubmit={handleSavePreset} className="space-y-2.5 pt-1">
                  <div>
                    <label className="text-[11px] font-medium text-neutral-400 block mb-1">
                      Nama Preset
                    </label>
                    <input
                      type="text"
                      placeholder="contoh: Heavy EDM Bass 808"
                      value={newPresetName}
                      onChange={(e) => setNewPresetName(e.target.value)}
                      className={`w-full px-3 py-2 text-xs rounded-xl border outline-none focus:border-cyan-400 transition-colors ${
                        isDark
                          ? 'bg-neutral-900/80 border-white/15 text-white'
                          : 'bg-neutral-50 border-neutral-300 text-neutral-900'
                      }`}
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-neutral-400 block mb-1">
                      Deskripsi Singkat (Opsional)
                    </label>
                    <input
                      type="text"
                      placeholder="contoh: Cocok untuk lagu trap & phonk"
                      value={newPresetDesc}
                      onChange={(e) => setNewPresetDesc(e.target.value)}
                      className={`w-full px-3 py-2 text-xs rounded-xl border outline-none focus:border-cyan-400 transition-colors ${
                        isDark
                          ? 'bg-neutral-900/80 border-white/15 text-white'
                          : 'bg-neutral-50 border-neutral-300 text-neutral-900'
                      }`}
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsCreatingPreset(false)}
                      className={`px-3 py-1.5 text-xs rounded-xl border cursor-pointer ${
                        isDark
                          ? 'bg-white/5 border-white/10 text-neutral-300'
                          : 'bg-neutral-100 border-neutral-300 text-neutral-600'
                      }`}
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 flex items-center gap-1.5 shadow-md shadow-cyan-500/20 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Simpan Preset</span>
                    </button>
                  </div>
                </form>
              ) : (
                <p className="text-xs text-neutral-400">
                  Simpan kombinasi gaya batang spektrum, warna neon, sensitivitas bass, dan partikel saat ini agar dapat digunakan kembali kapan saja.
                </p>
              )}
            </div>

            {/* Presets List Filter Tabs */}
            <div className="flex items-center justify-between pt-1">
              <div
                className={`p-1 rounded-xl border flex items-center gap-1 text-xs ${
                  isDark ? 'bg-neutral-950/60 border-white/5' : 'bg-slate-100 border-neutral-200'
                }`}
              >
                <button
                  onClick={() => setFilterPresetTab('all')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                    filterPresetTab === 'all'
                      ? isDark
                        ? 'bg-white/15 text-white'
                        : 'bg-white text-neutral-900 shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  Semua ({presetsList.length})
                </button>
                <button
                  onClick={() => setFilterPresetTab('user')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                    filterPresetTab === 'user'
                      ? isDark
                        ? 'bg-white/15 text-white'
                        : 'bg-white text-neutral-900 shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  Tersimpan ({presetsList.filter((p) => !p.isBuiltIn).length})
                </button>
                <button
                  onClick={() => setFilterPresetTab('builtin')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                    filterPresetTab === 'builtin'
                      ? isDark
                        ? 'bg-white/15 text-white'
                        : 'bg-white text-neutral-900 shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  Bawaan ({BUILT_IN_PRESETS.length})
                </button>
              </div>

              {/* Import / Export JSON buttons */}
              <div className="flex items-center gap-1">
                <input
                  ref={importFileInputRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImportJSON}
                />
                <button
                  onClick={() => importFileInputRef.current?.click()}
                  className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                    isDark
                      ? 'bg-white/5 hover:bg-white/10 border-white/10 text-neutral-300'
                      : 'bg-white hover:bg-neutral-50 border-neutral-300 text-neutral-700'
                  }`}
                  title="Impor Preset dari File JSON"
                >
                  <Upload className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleExportJSON}
                  className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                    isDark
                      ? 'bg-white/5 hover:bg-white/10 border-white/10 text-neutral-300'
                      : 'bg-white hover:bg-neutral-50 border-neutral-300 text-neutral-700'
                  }`}
                  title="Ekspor Semua Preset ke File JSON"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Presets Cards */}
            <div className="space-y-2.5">
              {filteredPresets.map((preset) => {
                const isActive = activePresetId === preset.id;
                return (
                  <div
                    key={preset.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isActive
                        ? isDark
                          ? 'bg-cyan-500/10 border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                          : 'bg-cyan-50/80 border-cyan-400 shadow-sm'
                        : isDark
                        ? 'bg-white/5 hover:bg-white/10 border-white/10'
                        : 'bg-white hover:bg-neutral-50 border-neutral-200 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold truncate">{preset.name}</h4>
                          <span
                            className={`text-[9px] uppercase font-semibold px-2 py-0.5 rounded-full border ${
                              preset.isBuiltIn
                                ? isDark
                                  ? 'bg-purple-500/15 border-purple-500/30 text-purple-300'
                                  : 'bg-purple-100 border-purple-200 text-purple-700'
                                : isDark
                                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                                : 'bg-emerald-100 border-emerald-200 text-emerald-700'
                            }`}
                          >
                            {preset.isBuiltIn ? 'Bawaan' : 'Preset Saya'}
                          </span>
                        </div>

                        {preset.description && (
                          <p className="text-[11px] text-neutral-400 mt-0.5 line-clamp-1">
                            {preset.description}
                          </p>
                        )}
                      </div>

                      {/* Delete button if user preset */}
                      {!preset.isBuiltIn && (
                        <button
                          onClick={() => handleDeletePreset(preset.id, preset.name)}
                          className="p-1 text-neutral-400 hover:text-red-400 transition-colors cursor-pointer shrink-0"
                          title="Hapus Preset"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Meta info & Swatch preview */}
                    <div className="mt-2.5 flex items-center justify-between gap-2 pt-2 border-t border-white/5">
                      <div className="flex items-center gap-2 text-[10px] text-neutral-400">
                        {/* 3 Color Dots */}
                        <div className="flex items-center gap-1">
                          <span
                            className="w-3 h-3 rounded-full border border-white/20"
                            style={{ backgroundColor: preset.config.primaryColor }}
                            title="Warna Utama"
                          />
                          <span
                            className="w-3 h-3 rounded-full border border-white/20"
                            style={{ backgroundColor: preset.config.secondaryColor }}
                            title="Warna Sekunder"
                          />
                          <span
                            className="w-3 h-3 rounded-full border border-white/20"
                            style={{ backgroundColor: preset.config.accentColor }}
                            title="Warna Aksen"
                          />
                        </div>

                        {preset.config.skin && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 capitalize font-mono">
                            {preset.config.skin.replace('-', ' ')}
                          </span>
                        )}
                        <span className="capitalize">{preset.config.style.replace('-', ' ')}</span>
                        <span>•</span>
                        <span>Bass {preset.config.bassSensitivity.toFixed(1)}x</span>
                      </div>

                      <button
                        onClick={() => {
                          onApplyPreset(preset);
                          showToast(`Preset "${preset.name}" diterapkan!`);
                        }}
                        className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                          isActive
                            ? 'bg-cyan-500 text-neutral-950 shadow-md shadow-cyan-500/20'
                            : isDark
                            ? 'bg-white/10 hover:bg-cyan-500/20 hover:text-cyan-300 text-neutral-200'
                            : 'bg-neutral-100 hover:bg-cyan-100 hover:text-cyan-700 text-neutral-800'
                        }`}
                      >
                        {isActive && <Check className="w-3 h-3" />}
                        <span>{isActive ? 'Aktif' : 'Terapkan'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredPresets.length === 0 && (
                <div className="py-8 text-center text-xs text-neutral-400">
                  Belum ada preset tersimpan. Tekan &ldquo;Preset Baru&rdquo; di atas untuk menyimpan konfigurasi visualizer Anda saat ini.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 1: VISUALIZER (BENTUK, SKIN & SPEKTRUM) */}
        {/* ======================================================== */}
        {activeTab === 'visualizer' && (
          <div className="space-y-4">
            {/* 1. VISUALIZER SKIN SELECTOR */}
            <div
              className={`p-3.5 rounded-2xl border transition-all ${
                isDark ? 'bg-neutral-900/60 border-white/10' : 'bg-slate-50 border-neutral-200 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-200">
                      Varian Skin Visualizer
                    </span>
                    <span className="block text-[10px] text-neutral-400">
                      Pilih geometri matematis & arsitektur drawing kanvas
                    </span>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-semibold capitalize">
                  {SKIN_VARIANTS.find((s) => s.id === (config.skin || 'circular-bars'))?.badge || 'Avee Classic'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {SKIN_VARIANTS.map((skin) => {
                  const isSelected = (config.skin || 'circular-bars') === skin.id;
                  return (
                    <button
                      key={skin.id}
                      type="button"
                      onClick={() => {
                        update('skin', skin.id);
                        showToast(`Skin visualizer: ${skin.name}`);
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative group flex flex-col justify-between ${
                        isSelected
                          ? isDark
                            ? 'bg-gradient-to-br from-cyan-950/70 via-neutral-900 to-purple-950/40 border-cyan-400 shadow-md shadow-cyan-500/20 ring-1 ring-cyan-400/40'
                            : 'bg-cyan-50/90 border-cyan-500 shadow-sm ring-1 ring-cyan-500/30'
                          : isDark
                          ? 'bg-white/5 border-white/5 hover:border-white/15 hover:bg-white/[0.08]'
                          : 'bg-white border-neutral-200 hover:border-neutral-300 hover:bg-slate-100/70'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1.5 mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-base p-1 rounded-md bg-white/5 border border-white/10 flex items-center justify-center leading-none">
                            {skin.icon}
                          </span>
                          <div>
                            <div
                              className={`text-xs font-bold leading-tight ${
                                isSelected
                                  ? isDark
                                    ? 'text-cyan-300'
                                    : 'text-cyan-700'
                                  : isDark
                                  ? 'text-white'
                                  : 'text-neutral-900'
                              }`}
                            >
                              {skin.name}
                            </div>
                            <span className="text-[9px] uppercase tracking-wider font-semibold opacity-70">
                              {skin.badge}
                            </span>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-cyan-500 text-neutral-950 flex items-center justify-center shadow-sm">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <p
                        className={`text-[10px] leading-snug line-clamp-2 ${
                          isDark ? 'text-neutral-400' : 'text-neutral-600'
                        }`}
                      >
                        {skin.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Visualizer Style */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
                Gaya Spektrum
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'radial-bars', name: 'Radial Bars (Avee)' },
                  { id: 'radial-mirror', name: 'Symmetrical Mirror' },
                  { id: 'radial-curve', name: 'Neon Waveform Curve' },
                  { id: 'radial-dots', name: 'Pins & Dots' },
                  { id: 'dual-ring', name: 'Dual In/Out Ring' },
                  { id: 'linear-bars', name: 'Linear Classic Bar' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => update('style', s.id as VisualizerStyle)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-colors cursor-pointer ${
                      config.style === s.id
                        ? isDark
                          ? 'bg-cyan-500/20 border-cyan-500/50 text-white shadow-sm'
                          : 'bg-cyan-50 border-cyan-400 text-cyan-800 shadow-sm'
                        : isDark
                        ? 'bg-white/5 border-white/5 text-neutral-400 hover:text-neutral-200 hover:bg-white/10'
                        : 'bg-white border-neutral-200 text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Bar Count Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span>Jumlah Batang Spektrum</span>
                <span className="font-mono-code text-cyan-500 font-semibold">{config.barCount}</span>
              </div>
              <input
                type="range"
                min={32}
                max={200}
                step={4}
                value={config.barCount}
                onChange={(e) => update('barCount', parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Inner Radius */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span>Radius Lingkaran Tengah</span>
                <span className="font-mono-code text-cyan-500 font-semibold">{config.innerRadius}px</span>
              </div>
              <input
                type="range"
                min={50}
                max={200}
                step={5}
                value={config.innerRadius}
                onChange={(e) => update('innerRadius', parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Max Bar Height */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span>Tinggi Maksimal Spektrum</span>
                <span className="font-mono-code text-cyan-500 font-semibold">{config.maxBarHeight}px</span>
              </div>
              <input
                type="range"
                min={40}
                max={260}
                step={5}
                value={config.maxBarHeight}
                onChange={(e) => update('maxBarHeight', parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Bar Width */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span>Lebar & Ketebalan Batang</span>
                <span className="font-mono-code text-cyan-500 font-semibold">{config.barWidth}px</span>
              </div>
              <input
                type="range"
                min={2}
                max={12}
                step={1}
                value={config.barWidth}
                onChange={(e) => update('barWidth', parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Rotation Speed */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span>Kecepatan Rotasi Melingkar</span>
                <span className="font-mono-code text-cyan-500 font-semibold">{config.rotationSpeed}</span>
              </div>
              <input
                type="range"
                min={-3}
                max={3}
                step={0.2}
                value={config.rotationSpeed}
                onChange={(e) => update('rotationSpeed', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Glow Intensity (shadowBlur) */}
            <div className="space-y-1.5 pt-2 border-t border-white/5">
              <div className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-1.5 font-medium">
                  <span>✨</span>
                  <span>Intensitas Glow Neon (Glow Intensity)</span>
                </span>
                <span className="font-mono-code text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                  {config.glowIntensity}px shadowBlur
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={50}
                step={1}
                value={config.glowIntensity}
                onChange={(e) => update('glowIntensity', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-neutral-400">
                <span>0px (Mati)</span>
                <span>25px (Neon Bloom)</span>
                <span>50px (Maksimal)</span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Memetakan langsung ke properti kanvas <code>ctx.shadowBlur</code> & <code>ctx.shadowColor</code> untuk pendaran spektrum neon yang intens.
              </p>
            </div>

            {/* Bass Boost (IIRFilter Low-Frequency Amplification) */}
            <div
              className={`p-3 rounded-xl border transition-all ${
                (config.bassBoost || 0) > 0
                  ? isDark
                    ? 'bg-amber-950/30 border-amber-500/40 shadow-sm'
                    : 'bg-amber-50 border-amber-400 shadow-sm'
                  : isDark
                  ? 'bg-white/5 border-white/5'
                  : 'bg-white border-neutral-200'
              }`}
            >
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="flex items-center gap-1.5 font-medium">
                  <span>🔊</span>
                  <span>Bass Boost (IIRFilter Low-End)</span>
                </span>
                <span className="font-mono-code text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  +{(config.bassBoost || 0)} dB
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={18}
                step={1}
                value={config.bassBoost || 0}
                onChange={(e) => update('bassBoost', parseInt(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{
                  accentColor: '#f59e0b',
                }}
              />
              <div className="flex justify-between text-[10px] text-neutral-400 mt-1">
                <span>0 dB (Bypass)</span>
                <span>+9 dB (Punchy)</span>
                <span>+18 dB (Max Sub-Bass)</span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-1">
                Menerapkan filter IIR (Infinite Impulse Response) pada AudioEngine untuk mendongkrak pita frekuensi rendah (&lt; 150Hz), menghasilkan lonjakan spektrum dan reaksi visual yang jauh lebih dinamis.
              </p>
            </div>

            {/* Checkboxes */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <label className="flex items-center gap-2.5 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.roundCaps}
                  onChange={(e) => update('roundCaps', e.target.checked)}
                  className="rounded bg-white/10 text-cyan-500 focus:ring-0 cursor-pointer"
                />
                <span>Ujung Batang Melengkung (Round Caps)</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.reactRotation}
                  onChange={(e) => update('reactRotation', e.target.checked)}
                  className="rounded bg-white/10 text-cyan-500 focus:ring-0 cursor-pointer"
                />
                <span>Rotasi Berakselerasi Saat Dentuman Beat</span>
              </label>
            </div>

            {/* Particle Trail Motion Blur Toggle Card */}
            <div
              className={`p-3 rounded-xl border transition-all ${
                config.particleTrails
                  ? isDark
                    ? 'bg-cyan-950/40 border-cyan-400/50 shadow-md shadow-cyan-500/10'
                    : 'bg-cyan-50 border-cyan-400 shadow-sm'
                  : isDark
                  ? 'bg-white/5 border-white/5'
                  : 'bg-white border-neutral-200'
              }`}
            >
              <label className="flex items-start justify-between gap-3 cursor-pointer">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold flex items-center gap-1.5">
                      <span>💫</span>
                      <span>Particle Trail (Motion Blur)</span>
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold uppercase tracking-wider ${
                        config.particleTrails
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                          : 'bg-white/10 text-neutral-400'
                      }`}
                    >
                      {config.particleTrails ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-snug">
                    Menggunakan kanvas <em>semi-transparent clearRect/fillRect alpha</em> alih-alih clear penuh, menghasilkan efek ekor jejak gerak (motion blur trail) bercahaya di belakang partikel, batang spektrum, dan garis visualizer.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={config.particleTrails}
                  onChange={(e) => {
                    update('particleTrails', e.target.checked);
                    showToast(
                      e.target.checked
                        ? 'Particle Trail diaktifkan (motion blur)'
                        : 'Particle Trail dinonaktifkan (full clear)'
                    );
                  }}
                  className="mt-1 w-4 h-4 rounded bg-white/10 text-cyan-500 focus:ring-0 cursor-pointer accent-cyan-400"
                />
              </label>

              {config.particleTrails && (
                <div className="mt-3 pt-2.5 border-t border-white/10 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-400">Ketahanan Jejak (Trail Persistence)</span>
                    <span className="font-mono text-cyan-400 font-semibold">
                      {Math.round((1 - (config.trailPersistence ?? 0.2)) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.06}
                    max={0.45}
                    step={0.02}
                    value={config.trailPersistence ?? 0.2}
                    onChange={(e) => update('trailPersistence', parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-[10px] text-neutral-400">
                    <span>Ekor Panjang (Motion Blur)</span>
                    <span>Ekor Singkat</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: WARNA & GLOW */}
        {/* ======================================================== */}
        {activeTab === 'colors' && (
          <div className="space-y-5">
            {/* Color Presets */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
                Preset Neon Cepat
              </label>
              <div className="grid grid-cols-1 gap-2">
                {COLOR_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => applyColorPreset(p)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between transition-colors cursor-pointer ${
                      isDark
                        ? 'border-white/5 bg-white/5 hover:bg-white/10'
                        : 'border-neutral-200 bg-white hover:bg-neutral-50 shadow-sm'
                    }`}
                  >
                    <span className="text-xs font-semibold">{p.name}</span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-4 h-4 rounded-full border border-white/20"
                        style={{ backgroundColor: p.primary }}
                      />
                      <span
                        className="w-4 h-4 rounded-full border border-white/20"
                        style={{ backgroundColor: p.secondary }}
                      />
                      <span
                        className="w-4 h-4 rounded-full border border-white/20"
                        style={{ backgroundColor: p.accent }}
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Pickers */}
            <div className="space-y-3 pt-2 border-t border-white/5">
              <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
                Pilihan Warna Kustom (Color Picker)
              </label>

              <div
                className={`flex items-center justify-between p-2 rounded-xl border ${
                  isDark ? 'bg-white/5 border-white/5' : 'bg-white border-neutral-200 shadow-sm'
                }`}
              >
                <span className="text-xs">Warna Pangkal (Primary)</span>
                <input
                  type="color"
                  value={config.primaryColor}
                  onChange={(e) => update('primaryColor', e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                />
              </div>

              <div
                className={`flex items-center justify-between p-2 rounded-xl border ${
                  isDark ? 'bg-white/5 border-white/5' : 'bg-white border-neutral-200 shadow-sm'
                }`}
              >
                <span className="text-xs">Warna Tengah (Secondary)</span>
                <input
                  type="color"
                  value={config.secondaryColor}
                  onChange={(e) => update('secondaryColor', e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                />
              </div>

              <div
                className={`flex items-center justify-between p-2 rounded-xl border ${
                  isDark ? 'bg-white/5 border-white/5' : 'bg-white border-neutral-200 shadow-sm'
                }`}
              >
                <span className="text-xs">Warna Ujung (Accent)</span>
                <input
                  type="color"
                  value={config.accentColor}
                  onChange={(e) => update('accentColor', e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                />
              </div>
            </div>

            {/* Glow Intensity */}
            <div className="space-y-1.5 pt-2 border-t border-white/5">
              <div className="flex justify-between text-xs">
                <span>Intensitas Glow & Bayangan Neon</span>
                <span className="font-mono-code text-cyan-500 font-semibold">{config.glowIntensity}px</span>
              </div>
              <input
                type="range"
                min={0}
                max={40}
                step={2}
                value={config.glowIntensity}
                onChange={(e) => update('glowIntensity', parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: BASS & RESPON */}
        {/* ======================================================== */}
        {activeTab === 'reactivity' && (
          <div className="space-y-4">
            {/* Bass Boost (IIRFilter Low-Frequency Amplification) */}
            <div
              className={`p-3 rounded-xl border transition-all ${
                (config.bassBoost || 0) > 0
                  ? isDark
                    ? 'bg-amber-950/30 border-amber-500/40 shadow-sm'
                    : 'bg-amber-50 border-amber-400 shadow-sm'
                  : isDark
                  ? 'bg-white/5 border-white/10'
                  : 'bg-white border-neutral-200'
              }`}
            >
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="font-semibold flex items-center gap-1.5 text-white">
                  <span>🔊</span>
                  <span>Bass Boost (IIRFilter Low-End)</span>
                </span>
                <span className="font-mono-code text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  +{(config.bassBoost || 0)} dB
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={18}
                step={1}
                value={config.bassBoost || 0}
                onChange={(e) => update('bassBoost', parseInt(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{
                  accentColor: '#f59e0b',
                }}
              />
              <div className="flex justify-between text-[10px] text-neutral-400 mt-1">
                <span>0 dB (Bypass)</span>
                <span>+9 dB (Punchy)</span>
                <span>+18 dB (Max Sub-Bass)</span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-1 leading-snug">
                Menerapkan filter IIR <code>createIIRFilter</code> pada AudioEngine untuk mendongkrak pita frekuensi rendah (&lt; 150Hz), menghasilkan reaksi visual lonjakan spektrum, dentuman cover, dan semburan partikel yang jauh lebih dinamis.
              </p>
            </div>

            {/* Bass Sensitivity */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span>Sensitivitas Bass (Low Frequency)</span>
                <span className="font-mono-code text-emerald-500 font-semibold">{config.bassSensitivity.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min={0.5}
                max={3.0}
                step={0.1}
                value={config.bassSensitivity}
                onChange={(e) => update('bassSensitivity', parseFloat(e.target.value))}
                className="w-full"
              />
              <p className="text-[11px] text-neutral-400">
                Meningkatkan respon zoom dan pantulan visualizer terhadap dentuman kick drum & 808.
              </p>
            </div>

            {/* Center Cover Pulse Scale */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span>Intensitas Denyut Visual (Pulse Intensity)</span>
                <span className="font-mono-code text-emerald-500 font-semibold">
                  {Math.round(config.pulseIntensity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={0.4}
                step={0.02}
                value={config.pulseIntensity}
                onChange={(e) => update('pulseIntensity', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Pulse Sensitivity (Beat Frequency Threshold) */}
            <div
              className={`p-3 rounded-xl border transition-all ${
                isDark ? 'bg-white/5 border-white/10' : 'bg-white border-neutral-200 shadow-sm'
              }`}
            >
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-semibold flex items-center gap-1.5">
                  <span>💓</span>
                  <span>Sensitivitas Denyut (Pulse Sensitivity)</span>
                </span>
                <span className="font-mono-code text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {config.pulseSensitivity.toFixed(2)}x
                </span>
              </div>
              <input
                type="range"
                min={0.2}
                max={3.0}
                step={0.05}
                value={config.pulseSensitivity}
                onChange={(e) => update('pulseSensitivity', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-neutral-400 mt-1">
                <span>Ambang Tinggi (Kick Keras Saja)</span>
                <span>Ambang Rendah (Ketukan Halus)</span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-1.5 leading-snug">
                Menyesuaikan <em>threshold</em> frekuensi beat yang terdeteksi untuk memicu pergeseran ukuran visual (visual size shifts) secara lebih akurat dan presisi pada ritme lagu.
              </p>
            </div>

            {/* Smoothing */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span>Audio Smoothing (Kehalusan Gerak)</span>
                <span className="font-mono-code text-emerald-500 font-semibold">{config.smoothing.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={0.4}
                max={0.95}
                step={0.02}
                value={config.smoothing}
                onChange={(e) => update('smoothing', parseFloat(e.target.value))}
                className="w-full"
              />
              <p className="text-[11px] text-neutral-400">
                Nilai tinggi menghasilkan pergerakan lebih halus; nilai rendah lebih responsif seketika.
              </p>
            </div>

            {/* FFT Size */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
                FFT Size (Frekuensi Resolusi)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[512, 1024, 2048, 4096].map((size) => (
                  <button
                    key={size}
                    onClick={() => update('fftSize', size)}
                    className={`py-2 rounded-lg border text-xs font-mono-code transition-colors cursor-pointer ${
                      config.fftSize === size
                        ? isDark
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-white font-bold'
                          : 'bg-emerald-50 border-emerald-400 text-emerald-700 font-bold'
                        : isDark
                        ? 'bg-white/5 border-white/5 text-neutral-400 hover:text-neutral-200'
                        : 'bg-white border-neutral-200 text-neutral-600'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Shake Dynamics (Camera Shake & High-Frequency Transient Peak Shake) */}
            <div className="space-y-3 pt-3 border-t border-white/5">
              <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>⚡</span>
                <span>Efek Guncangan Visual (Visual Shake Dynamics)</span>
              </label>

              {/* High-Frequency Transient Peak Shake Card */}
              <div
                className={`p-3.5 rounded-xl border transition-all ${
                  (config.transientShake ?? true)
                    ? isDark
                      ? 'bg-cyan-950/30 border-cyan-500/40 shadow-sm'
                      : 'bg-cyan-50 border-cyan-400 shadow-sm'
                    : isDark
                    ? 'bg-white/5 border-white/5'
                    : 'bg-white border-neutral-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.transientShake ?? true}
                      onChange={(e) => update('transientShake', e.target.checked)}
                      className="rounded bg-white/10 text-cyan-500 focus:ring-0 cursor-pointer mt-0.5"
                    />
                    <div>
                      <span className="text-xs font-bold text-white block">
                        Guncangan Transien Frekuensi Tinggi (Snare, Clap, Hi-Hat)
                      </span>
                      <p className="text-[11px] text-neutral-400 mt-0.5 leading-snug">
                        Mendeteksi lonjakan fluks spektral nada tinggi (&gt;3.2 kHz) untuk memicu sentakan rotasi mikro (*rotational jolt*), getaran elektrik (*multi-directional jitter*), dan gelombang kejut seketika pada hentakan perkusi.
                      </p>
                    </div>
                  </label>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase shrink-0 ${
                    (config.transientShake ?? true) ? 'bg-cyan-400 text-neutral-950' : 'bg-white/10 text-neutral-400'
                  }`}>
                    {(config.transientShake ?? true) ? 'AKTIF' : 'NONAKTIF'}
                  </span>
                </div>

                {(config.transientShake ?? true) && (
                  <div className="mt-3 pt-2.5 border-t border-white/10 space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-neutral-300 font-medium text-[11px]">Intensitas Guncangan Transien</span>
                      <span className="font-mono-code text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 text-xs">
                        {(config.transientShakeIntensity ?? 1.2).toFixed(1)}x
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0.2}
                      max={3.0}
                      step={0.1}
                      value={config.transientShakeIntensity ?? 1.2}
                      onChange={(e) => update('transientShakeIntensity', parseFloat(e.target.value))}
                      className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                      style={{ accentColor: '#06b6d4' }}
                    />
                    <div className="flex justify-between text-[10px] text-neutral-400">
                      <span>Halus (0.2x)</span>
                      <span>Seimbang (1.2x)</span>
                      <span>Intens / Ekstrem (3.0x)</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Low-Frequency Bass Camera Shake Card */}
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <label className="flex items-center gap-2.5 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.cameraShake}
                    onChange={(e) => update('cameraShake', e.target.checked)}
                    className="rounded bg-white/10 text-emerald-500 focus:ring-0 cursor-pointer"
                  />
                  <div>
                    <span className="font-semibold text-white block">Guncangan Layar Bass Rendah (Sub-Bass Rumble)</span>
                    <span className="text-[11px] text-neutral-400">
                      Menambahkan guncangan getar kamera saat bass kick sub-frekuensi (&lt;150Hz) melebihi ambang batas berat.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: LATAR, PARTIKEL & COVER */}
        {/* ======================================================== */}
        {activeTab === 'background' && (
          <div className="space-y-4">
            {/* Background Mode */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
                Mode Latar Belakang (Background)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'solid', label: isDark ? 'Gelap Polos' : 'Terang Polos' },
                  { id: 'ambient', label: 'Ambient Glow Reaktif' },
                  { id: 'image', label: 'Gambar Kustom' },
                  { id: 'video', label: 'Video Pengiring' },
                ].map((bg) => (
                  <button
                    key={bg.id}
                    onClick={() => update('bgType', bg.id as BackgroundType)}
                    className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-colors cursor-pointer ${
                      config.bgType === bg.id
                        ? isDark
                          ? 'bg-amber-500/20 border-amber-500/50 text-white font-bold'
                          : 'bg-amber-50 border-amber-400 text-amber-800 font-bold'
                        : isDark
                        ? 'bg-white/5 border-white/5 text-neutral-400 hover:text-neutral-200'
                        : 'bg-white border-neutral-200 text-neutral-600'
                    }`}
                  >
                    {bg.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Background Dim */}
            {(config.bgType === 'image' || config.bgType === 'video') && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span>Kegelapan Overlay Latar (Dim)</span>
                  <span className="font-mono-code text-amber-500 font-semibold">
                    {Math.round(config.bgDim * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={0.9}
                  step={0.05}
                  value={config.bgDim}
                  onChange={(e) => update('bgDim', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            )}

            {/* Particles */}
            <div className="space-y-3 pt-2 border-t border-white/5">
              <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
                Partikel Bintang / Debu Melayang
              </label>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span>Jumlah Partikel</span>
                  <span className="font-mono-code text-amber-500 font-semibold">{config.particleCount}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={180}
                  step={10}
                  value={config.particleCount}
                  onChange={(e) => update('particleCount', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span>Kecepatan Partikel</span>
                  <span className="font-mono-code text-amber-500 font-semibold">{config.particleSpeed.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min={0.4}
                  max={4.0}
                  step={0.2}
                  value={config.particleSpeed}
                  onChange={(e) => update('particleSpeed', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'stars', label: 'Bintang ✦' },
                  { id: 'circles', label: 'Bulatan Debu ●' },
                ].map((pt) => (
                  <button
                    key={pt.id}
                    onClick={() => update('particleType', pt.id as ParticleType)}
                    className={`py-1.5 px-3 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                      config.particleType === pt.id
                        ? isDark
                          ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                          : 'bg-amber-100 border-amber-300 text-amber-800'
                        : isDark
                        ? 'bg-white/5 border-white/5 text-neutral-400'
                        : 'bg-white border-neutral-200 text-neutral-600'
                    }`}
                  >
                    {pt.label}
                  </button>
                ))}
              </div>

              <label className="flex items-center gap-2.5 text-xs cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={config.particleExplosion}
                  onChange={(e) => update('particleExplosion', e.target.checked)}
                  className="rounded bg-white/10 text-amber-500 focus:ring-0 cursor-pointer"
                />
                <span>Partikel Meledak / Memancar Cepat Saat Beat Drop</span>
              </label>

              {/* Particle Trail Toggle in Background/Particles Tab */}
              <div
                className={`p-2.5 rounded-xl border transition-all mt-2 ${
                  config.particleTrails
                    ? isDark
                      ? 'bg-amber-500/10 border-amber-500/30'
                      : 'bg-amber-50 border-amber-300'
                    : isDark
                    ? 'bg-white/5 border-white/5'
                    : 'bg-white border-neutral-200'
                }`}
              >
                <label className="flex items-center justify-between text-xs cursor-pointer">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.particleTrails}
                      onChange={(e) => update('particleTrails', e.target.checked)}
                      className="rounded bg-white/10 text-amber-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="font-semibold">Particle Trail (Motion Blur Alpha)</span>
                  </div>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold uppercase ${
                      config.particleTrails
                        ? 'bg-amber-400 text-neutral-950'
                        : 'bg-white/10 text-neutral-400'
                    }`}
                  >
                    {config.particleTrails ? 'ON' : 'OFF'}
                  </span>
                </label>

                {config.particleTrails && (
                  <div className="mt-2 pt-2 border-t border-white/5 space-y-1 pl-6">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-neutral-400">Panjang Ekor Jejak (Persistence)</span>
                      <span className="font-mono text-amber-400 font-semibold">
                        {Math.round((1 - (config.trailPersistence ?? 0.2)) * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0.06}
                      max={0.45}
                      step={0.02}
                      value={config.trailPersistence ?? 0.2}
                      onChange={(e) => update('trailPersistence', parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Cover Art Settings */}
            <div className="space-y-3 pt-2 border-t border-white/5">
              <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
                Piringan Cover Art Tengah
              </label>

              <label className="flex items-center gap-2.5 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showCoverArt}
                  onChange={(e) => update('showCoverArt', e.target.checked)}
                  className="rounded bg-white/10 text-amber-500 focus:ring-0 cursor-pointer"
                />
                <span>Tampilkan Cover Art di Tengah</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.spinCover}
                  onChange={(e) => update('spinCover', e.target.checked)}
                  className="rounded bg-white/10 text-amber-500 focus:ring-0 cursor-pointer"
                />
                <span>Putar Cover Seperti Piringan Vinyl</span>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
