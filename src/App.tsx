/**
 * Nu - Web Audio Visualizer & Video Exporter
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  VisualizerConfig,
  AudioState,
  RecordingState,
  ThemeMode,
  VisualizerPreset,
} from './types/visualizer';
import { BUILT_IN_PRESETS } from './utils/presetsManager';
import { globalAudioEngine } from './utils/audioEngine';
import { VideoRecorder, downloadVideoFile } from './utils/recorder';
import { generateStandaloneHTML } from './utils/standaloneHtmlGenerator';
import { TopNav } from './components/TopNav';
import { CanvasVisualizer } from './components/CanvasVisualizer';
import { PlayerControls } from './components/PlayerControls';
import { SettingsPanel, SettingsTab } from './components/SettingsPanel';
import { ExportModal } from './components/ExportModal';
import { CodecInfoModal } from './components/CodecInfoModal';
import { MediaUploadModal } from './components/MediaUploadModal';

const DEFAULT_PRESET = BUILT_IN_PRESETS[0];

export default function App() {
  // Theme state: dark / light
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('nu_theme') || localStorage.getItem('aveeflow_theme');
    return saved === 'light' ? 'light' : 'dark';
  });

  const [activePresetId, setActivePresetId] = useState<string | null>(DEFAULT_PRESET.id);
  const [config, setConfig] = useState<VisualizerConfig>(DEFAULT_PRESET.config);

  const [audioState, setAudioState] = useState<AudioState>({
    fileName: 'Synthesized EDM Beat (Klik Play)',
    fileType: 'demo',
    duration: 0,
    currentTime: 0,
    isPlaying: false,
    volume: 0.85,
    isMuted: false,
    coverUrl: null,
    bgUrl: null,
    videoElement: null,
    bpm: 126,
    isDetectingBpm: false,
    bpmConfidence: 1.0,
    waveformPeaks: globalAudioEngine.getDemoWaveform(120),
  });

  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    secondsRecorded: 0,
    format: 'mp4',
    status: 'idle',
  });

  // Modal open states
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('presets');
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isCodecInfoOpen, setIsCodecInfoOpen] = useState(false);
  const [isWindowDragging, setIsWindowDragging] = useState(false);

  // Hidden audio/video elements and canvas
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const recorderRef = useRef<VideoRecorder>(new VideoRecorder());

  // Toggle Theme
  const handleToggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('nu_theme', next);
      return next;
    });
  }, []);

  // Update theme class on HTML element
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('theme-light');
      document.documentElement.classList.remove('theme-dark');
    } else {
      document.documentElement.classList.add('theme-dark');
      document.documentElement.classList.remove('theme-light');
    }
  }, [theme]);

  // Apply FFT, smoothing, and IIRFilter Bass Boost updates to audio engine
  useEffect(() => {
    globalAudioEngine.updateSettings(config.fftSize, config.smoothing);
    globalAudioEngine.setBassBoost(config.bassBoost ?? 0);
  }, [config.fftSize, config.smoothing, config.bassBoost]);

  // Apply volume updates
  useEffect(() => {
    const vol = audioState.isMuted ? 0 : audioState.volume;
    globalAudioEngine.setVolume(vol);
    if (audioElementRef.current) audioElementRef.current.volume = vol;
    if (videoElementRef.current) videoElementRef.current.volume = vol;
  }, [audioState.volume, audioState.isMuted]);

  // Handle Play/Pause
  const handlePlayPause = useCallback(() => {
    const audioCtx = globalAudioEngine.getAudioContext();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }

    if (audioState.fileType === 'demo') {
      // Toggle demo track
      if (globalAudioEngine.isDemoActive()) {
        globalAudioEngine.stopDemo();
        setAudioState((prev) => ({ ...prev, isPlaying: false }));
      } else {
        globalAudioEngine.startDemoTrack();
        setAudioState((prev) => ({
          ...prev,
          isPlaying: true,
          fileName: 'Synthesized EDM Beat (Live AudioContext)',
        }));
      }
      return;
    }

    const activeEl = audioState.fileType === 'video' ? videoElementRef.current : audioElementRef.current;
    if (!activeEl) return;

    if (activeEl.paused) {
      globalAudioEngine.connectMediaElement(activeEl);
      activeEl.play().then(() => {
        setAudioState((prev) => ({ ...prev, isPlaying: true }));
      }).catch((err) => {
        console.warn('Play was prevented:', err);
      });
    } else {
      activeEl.pause();
      setAudioState((prev) => ({ ...prev, isPlaying: false }));
    }
  }, [audioState.fileType]);

  // Handle Play Demo Track explicitly
  const handlePlayDemo = useCallback(() => {
    if (audioElementRef.current) audioElementRef.current.pause();
    if (videoElementRef.current) videoElementRef.current.pause();

    const audioCtx = globalAudioEngine.getAudioContext();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }

    globalAudioEngine.stopDemo();
    globalAudioEngine.startDemoTrack();

    setAudioState((prev) => ({
      ...prev,
      fileName: 'Synthesized 126 BPM EDM Beat',
      fileType: 'demo',
      isPlaying: true,
      currentTime: 0,
      duration: 0,
      bpm: 126,
      isDetectingBpm: false,
      bpmConfidence: 1.0,
      waveformPeaks: globalAudioEngine.getDemoWaveform(120),
    }));

    setConfig((prev) => ({
      ...prev,
      trackTitle: 'Neon Cyber Beat',
      trackArtist: 'Synthesized Audio Engine',
    }));
  }, []);

  // Handle Seek
  const handleSeek = (seconds: number) => {
    const activeEl = audioState.fileType === 'video' ? videoElementRef.current : audioElementRef.current;
    if (activeEl && !isNaN(seconds)) {
      activeEl.currentTime = seconds;
      setAudioState((prev) => ({ ...prev, currentTime: seconds }));
    } else if (audioState.fileType === 'demo' && !isNaN(seconds)) {
      setAudioState((prev) => ({ ...prev, currentTime: seconds }));
    }
  };

  // Handle Volume change
  const handleVolumeChange = (volume: number) => {
    setAudioState((prev) => ({
      ...prev,
      volume,
      isMuted: volume === 0,
    }));
  };

  // Toggle Mute
  const handleToggleMute = () => {
    setAudioState((prev) => ({
      ...prev,
      isMuted: !prev.isMuted,
    }));
  };

  // Apply a Preset
  const handleApplyPreset = (preset: VisualizerPreset) => {
    setConfig({
      ...preset.config,
      // Preserve current uploaded title if user customized it
      trackTitle: audioState.fileName && audioState.fileType !== 'demo'
        ? audioState.fileName.replace(/\.[^/.]+$/, '')
        : preset.config.trackTitle,
      trackArtist: audioState.fileType !== 'demo' ? 'Uploaded Track' : preset.config.trackArtist,
    });
    setActivePresetId(preset.id);
  };

  // Open settings with optional specific tab
  const handleOpenSettings = (tab: SettingsTab = 'presets') => {
    setSettingsTab(tab);
    setIsSettingsOpen(true);
  };

  // Media file loaded (Audio or Video)
  const handleAudioVideoSelected = (file: File) => {
    globalAudioEngine.stopDemo();

    const audioCtx = globalAudioEngine.getAudioContext();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }

    const isVideo = file.type.startsWith('video') || file.name.endsWith('.mp4') || file.name.endsWith('.webm');
    const objectUrl = URL.createObjectURL(file);

    if (isVideo) {
      if (audioElementRef.current) audioElementRef.current.pause();
      const videoEl = videoElementRef.current;
      if (videoEl) {
        videoEl.src = objectUrl;
        videoEl.load();
        globalAudioEngine.connectMediaElement(videoEl);
        videoEl.play().then(() => {
          setAudioState((prev) => ({ ...prev, isPlaying: true }));
        }).catch((err) => {
          console.warn('Autoplay error on video upload:', err);
          setAudioState((prev) => ({ ...prev, isPlaying: false }));
        });
      }

      setAudioState((prev) => ({
        ...prev,
        fileName: file.name,
        fileType: 'video',
        videoElement: videoEl,
        isDetectingBpm: true,
      }));

      // Automatically switch background to video if requested
      setConfig((prev) => ({
        ...prev,
        bgType: 'video',
        trackTitle: file.name.replace(/\.[^/.]+$/, ''),
        trackArtist: 'MP4 Video Audio',
      }));
    } else {
      if (videoElementRef.current) videoElementRef.current.pause();
      const audioEl = audioElementRef.current;
      if (audioEl) {
        audioEl.src = objectUrl;
        audioEl.load();
        globalAudioEngine.connectMediaElement(audioEl);
        audioEl.play().then(() => {
          setAudioState((prev) => ({ ...prev, isPlaying: true }));
        }).catch((err) => {
          console.warn('Autoplay error on audio upload:', err);
          setAudioState((prev) => ({ ...prev, isPlaying: false }));
        });
      }

      setAudioState((prev) => ({
        ...prev,
        fileName: file.name,
        fileType: 'audio',
        videoElement: null,
        isDetectingBpm: true,
      }));

      setConfig((prev) => ({
        ...prev,
        trackTitle: file.name.replace(/\.[^/.]+$/, ''),
        trackArtist: 'Uploaded MP3 Audio',
      }));
    }

    // Automated beat detection algorithm: Analyze uploaded track buffer for BPM tempo tracking
    globalAudioEngine
      .analyzeTrackBpm(file)
      .then((result) => {
        setAudioState((prev) => ({
          ...prev,
          isDetectingBpm: false,
          bpm: result.bpm,
          bpmConfidence: result.confidence,
          waveformPeaks: result.waveformPeaks || prev.waveformPeaks,
        }));
      })
      .catch((err) => {
        console.warn('BPM track analysis failed:', err);
        setAudioState((prev) => ({
          ...prev,
          isDetectingBpm: false,
          bpm: 124,
          waveformPeaks: prev.waveformPeaks || globalAudioEngine.getDemoWaveform(120),
        }));
      });

    setIsUploadOpen(false);
  };

  // Cover image selected
  const handleCoverImageSelected = (file: File) => {
    const url = URL.createObjectURL(file);
    setAudioState((prev) => ({ ...prev, coverUrl: url }));
    setConfig((prev) => ({ ...prev, showCoverArt: true }));
  };

  // Background image selected
  const handleBackgroundImageSelected = (file: File) => {
    const url = URL.createObjectURL(file);
    setAudioState((prev) => ({ ...prev, bgUrl: url }));
    setConfig((prev) => ({ ...prev, bgType: 'image' }));
  };

  // Window Drag and Drop Listener for easy MP3 / Audio loading
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer?.types?.includes('Files')) {
        setIsWindowDragging(true);
      }
    };
    const handleDragLeave = (e: DragEvent) => {
      if (e.clientX <= 0 || e.clientY <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
        setIsWindowDragging(false);
      }
    };
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsWindowDragging(false);
      const file = e.dataTransfer?.files?.[0];
      if (file) {
        if (file.type.startsWith('image/')) {
          handleCoverImageSelected(file);
        } else {
          handleAudioVideoSelected(file);
        }
      }
    };

    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);
    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, []);

  // Start Video Recording
  const handleStartRecord = (
    fps: number = 60,
    preferMp4: boolean = true,
    startFromBeginning: boolean = true
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const audioCtx = globalAudioEngine.getAudioContext();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }

    const activeEl = audioState.fileType === 'video' ? videoElementRef.current : audioElementRef.current;

    // Reset playback position to 0 (detik 00:00) when export starts
    if (startFromBeginning) {
      if (activeEl) {
        activeEl.currentTime = 0;
        globalAudioEngine.connectMediaElement(activeEl);
        activeEl.play().catch(() => {});
      } else if (audioState.fileType === 'demo') {
        globalAudioEngine.stopDemo();
        globalAudioEngine.startDemoTrack();
      }
      setAudioState((prev) => ({ ...prev, isPlaying: true, currentTime: 0 }));
    } else {
      if (activeEl) {
        if (activeEl.paused) {
          globalAudioEngine.connectMediaElement(activeEl);
          activeEl.play().catch(() => {});
          setAudioState((prev) => ({ ...prev, isPlaying: true }));
        }
      } else if (audioState.fileType === 'demo' && !globalAudioEngine.isDemoActive()) {
        globalAudioEngine.startDemoTrack();
        setAudioState((prev) => ({ ...prev, isPlaying: true }));
      }
    }

    setRecordingState({
      isRecording: true,
      secondsRecorded: 0,
      format: preferMp4 ? 'mp4' : 'webm',
      status: 'recording',
    });

    recorderRef.current.startRecording(
      canvas,
      globalAudioEngine,
      fps,
      preferMp4,
      (sec) => {
        setRecordingState((prev) => ({ ...prev, secondsRecorded: sec }));
      },
      (_blob, ext, downloadUrl) => {
        setRecordingState((prev) => ({
          ...prev,
          isRecording: false,
          status: 'completed',
          format: ext,
          downloadUrl,
          fileName: `nu-visualizer-${Date.now()}.${ext}`,
        }));
      },
      (error) => {
        setRecordingState((prev) => ({
          ...prev,
          isRecording: false,
          status: 'error',
          errorMessage: error,
        }));
      }
    );
  };

  // Stop Video Recording
  const handleStopRecord = () => {
    recorderRef.current.stopRecording();
  };

  // Download Standalone Single-File HTML bundle
  const handleDownloadStandaloneHTML = () => {
    const htmlContent = generateStandaloneHTML();
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    downloadVideoFile(url, 'nu-visualizer-standalone.html');
  };

  const isDark = theme === 'dark';

  return (
    <div
      className={`relative w-screen h-screen overflow-hidden font-sans select-none transition-colors duration-300 ${
        isDark ? 'theme-dark bg-neutral-950 text-neutral-100' : 'theme-light bg-slate-100 text-neutral-900'
      }`}
    >
      {/* Top 3-Zone Navigation */}
      <TopNav
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenSettings={handleOpenSettings}
        onOpenExport={() => setIsExportOpen(true)}
        onPlayDemo={handlePlayDemo}
        onDownloadStandaloneHTML={handleDownloadStandaloneHTML}
      />

      {/* Main HTML5 Canvas Visualizer */}
      <CanvasVisualizer
        config={config}
        audioEngine={globalAudioEngine}
        audioState={audioState}
        canvasRef={canvasRef}
        theme={theme}
        onChangeSkin={(newSkin) => {
          setConfig((prev) => ({ ...prev, skin: newSkin }));
          setActivePresetId(null);
        }}
        onToggleParticleTrails={() => {
          setConfig((prev) => ({ ...prev, particleTrails: !prev.particleTrails }));
        }}
        onChangeGlowIntensity={(newGlow) => {
          setConfig((prev) => ({ ...prev, glowIntensity: newGlow }));
        }}
        onChangeBassBoost={(newBassBoost) => {
          setConfig((prev) => ({ ...prev, bassBoost: newBassBoost }));
        }}
        onToggleTransientShake={() => {
          setConfig((prev) => ({ ...prev, transientShake: !(prev.transientShake ?? true) }));
        }}
        onChangeTransientShakeIntensity={(intensity) => {
          setConfig((prev) => ({ ...prev, transientShakeIntensity: intensity }));
        }}
        onChangePrimaryColor={(color) => {
          setConfig((prev) => ({ ...prev, primaryColor: color }));
        }}
        onOpenSettings={() => handleOpenSettings('visualizer')}
      />

      {/* Live Recording Floating Badge if Recording */}
      {recordingState.isRecording && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 bg-red-600/95 text-white px-4 py-1.5 rounded-full border border-red-400 shadow-xl flex items-center gap-2.5 animate-pulse text-xs font-semibold">
          <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
          <span>MEREKAM CANVAS: {recordingState.secondsRecorded}s</span>
          <button
            onClick={handleStopRecord}
            className="ml-2 px-2.5 py-0.5 rounded-md bg-white text-red-600 hover:bg-neutral-100 text-[11px] font-bold cursor-pointer"
          >
            Selesai
          </button>
        </div>
      )}

      {/* Bottom Floating Glassmorphism Player Controls */}
      <PlayerControls
        theme={theme}
        audioState={audioState}
        recordingState={recordingState}
        onPlayPause={handlePlayPause}
        onSeek={handleSeek}
        onVolumeChange={handleVolumeChange}
        onToggleMute={handleToggleMute}
        onOpenSettings={handleOpenSettings}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenCodecInfo={() => setIsCodecInfoOpen(true)}
        onPlayDemo={handlePlayDemo}
        onDownloadStandaloneHTML={handleDownloadStandaloneHTML}
      />

      {/* Settings Drawer (with Presets tab & management) */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onChangeConfig={setConfig}
        onResetDefaults={() => {
          setConfig(DEFAULT_PRESET.config);
          setActivePresetId(DEFAULT_PRESET.id);
        }}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        activePresetId={activePresetId}
        onApplyPreset={handleApplyPreset}
        initialTab={settingsTab}
        audioState={audioState}
      />

      {/* Export / Record Video Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        recordingState={recordingState}
        onStartRecord={handleStartRecord}
        onStopRecord={handleStopRecord}
      />

      {/* Media & Audio / Video Uploader Modal */}
      <MediaUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        audioState={audioState}
        onAudioVideoSelected={handleAudioVideoSelected}
        onCoverImageSelected={handleCoverImageSelected}
        onBackgroundImageSelected={handleBackgroundImageSelected}
        onResetCover={() => setAudioState((prev) => ({ ...prev, coverUrl: null }))}
        onResetBackground={() => {
          setAudioState((prev) => ({ ...prev, bgUrl: null }));
          setConfig((prev) => ({ ...prev, bgType: 'solid' }));
        }}
      />

      {/* Browser Codec Compatibility Information Modal */}
      <CodecInfoModal
        isOpen={isCodecInfoOpen}
        onClose={() => setIsCodecInfoOpen(false)}
      />

      {/* Full-screen Drag & Drop Overlay */}
      {isWindowDragging && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center pointer-events-none animate-in fade-in duration-150">
          <div className="w-24 h-24 rounded-full bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center text-cyan-300 mb-4 animate-bounce">
            <span className="text-4xl">🎵</span>
          </div>
          <h2 className="text-2xl font-bold font-display text-white mb-2">
            Lepaskan File MP3 / Audio Di Sini!
          </h2>
          <p className="text-sm text-neutral-300 max-w-md">
            File akan otomatis dimuat dan divisualisasikan dengan ketukan bass dan spektrogram neon secara instan.
          </p>
        </div>
      )}

      {/* Hidden media elements for Web Audio API playback and visualization */}
      <audio
        ref={audioElementRef}
        preload="auto"
        playsInline
        className="hidden"
        onPlay={() => setAudioState((prev) => ({ ...prev, isPlaying: true }))}
        onPause={() => setAudioState((prev) => ({ ...prev, isPlaying: false }))}
        onTimeUpdate={(e) => {
          const el = e.currentTarget;
          setAudioState((prev) => ({
            ...prev,
            currentTime: el.currentTime,
            duration: el.duration || prev.duration || 0,
          }));
        }}
        onLoadedMetadata={(e) => {
          const el = e.currentTarget;
          setAudioState((prev) => ({
            ...prev,
            duration: el.duration || 0,
          }));
        }}
        onEnded={() => {
          setAudioState((prev) => ({ ...prev, isPlaying: false, currentTime: 0 }));
        }}
        onError={(e) => {
          console.error('Audio playback error:', e);
        }}
      />
      <video
        ref={videoElementRef}
        preload="auto"
        playsInline
        className="hidden"
        onPlay={() => setAudioState((prev) => ({ ...prev, isPlaying: true }))}
        onPause={() => setAudioState((prev) => ({ ...prev, isPlaying: false }))}
        onTimeUpdate={(e) => {
          const el = e.currentTarget;
          setAudioState((prev) => ({
            ...prev,
            currentTime: el.currentTime,
            duration: el.duration || prev.duration || 0,
          }));
        }}
        onLoadedMetadata={(e) => {
          const el = e.currentTarget;
          setAudioState((prev) => ({
            ...prev,
            duration: el.duration || 0,
          }));
        }}
        onEnded={() => {
          setAudioState((prev) => ({ ...prev, isPlaying: false, currentTime: 0 }));
        }}
        onError={(e) => {
          console.error('Video playback error:', e);
        }}
      />
    </div>
  );
}
