import React, { useState } from 'react';
import {
  X,
  Video,
  Download,
  AlertCircle,
  CheckCircle2,
  Square,
  Sparkles,
} from 'lucide-react';
import { RecordingState } from '../types/visualizer';
import { VideoRecorder, downloadVideoFile } from '../utils/recorder';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordingState: RecordingState;
  onStartRecord: (fps: number, preferMp4: boolean, startFromBeginning: boolean) => void;
  onStopRecord: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  recordingState,
  onStartRecord,
  onStopRecord,
}) => {
  const [selectedFps, setSelectedFps] = useState<number>(60);
  const [preferMp4, setPreferMp4] = useState<boolean>(true);
  const [startFromBeginning, setStartFromBeginning] = useState<boolean>(true);

  if (!isOpen) return null;

  const optimalCodec = VideoRecorder.getOptimalMimeType(preferMp4);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg glass-panel rounded-2xl border border-white/10 shadow-2xl p-5 sm:p-6 text-neutral-100 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-display text-white">
                Ekspor Rekaman Video
              </h3>
              <p className="text-xs text-neutral-400">
                Tangkap Canvas 60 FPS + Web Audio Stream langsung ke MP4/WebM
              </p>
            </div>
          </div>
          {!recordingState.isRecording && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Recording in progress view */}
        {recordingState.isRecording ? (
          <div className="py-6 flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-500/50 flex items-center justify-center animate-ping absolute" />
              <div className="w-16 h-16 rounded-full bg-red-500 border border-red-400 flex items-center justify-center text-white shadow-xl shadow-red-500/40 relative z-10">
                <Video className="w-8 h-8" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-2xl font-bold font-mono-code tabular-nums text-white">
                {formatTimer(recordingState.secondsRecorded)}
              </div>
              <p className="text-xs text-red-400 font-medium animate-pulse">
                ● Sedang Merekam Layar Visualizer & Audio...
              </p>
              <p className="text-[11px] text-neutral-400 max-w-xs mx-auto">
                Biarkan musik terus berputar selama proses perekaman. Tekan tombol di bawah jika durasi sudah mencukupi.
              </p>
            </div>

            <button
              onClick={onStopRecord}
              className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-red-600/30 transition-all cursor-pointer"
            >
              <Square className="w-4 h-4 fill-current" />
              <span>Selesai & Ekspor Video</span>
            </button>
          </div>
        ) : recordingState.status === 'completed' ? (
          /* Finished recording view */
          <div className="py-4 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-white">
                Rekaman Berhasil Dibuat!
              </h4>
              <p className="text-xs text-neutral-400">
                Format: <span className="font-mono-code text-cyan-400 uppercase">{recordingState.format}</span> (
                {formatTimer(recordingState.secondsRecorded)})
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              {recordingState.downloadUrl && (
                <button
                  onClick={() =>
                    downloadVideoFile(
                      recordingState.downloadUrl!,
                      recordingState.fileName || `nu-visualizer.${recordingState.format}`
                    )
                  }
                  className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-semibold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh File ({recordingState.format.toUpperCase()})</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-neutral-200 text-xs font-medium transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        ) : (
          /* Pre-record configuration view */
          <div className="space-y-4">
            {/* Format Selection */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
                Target Format Video
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPreferMp4(true)}
                  className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                    preferMp4
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-white'
                      : 'bg-white/5 border-white/5 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <div className="font-semibold text-xs text-white">MP4 (H.264 / AAC)</div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">
                    Kompatibel untuk media sosial & HP
                  </div>
                </button>
                <button
                  onClick={() => setPreferMp4(false)}
                  className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                    !preferMp4
                      ? 'bg-purple-500/20 border-purple-500/50 text-white'
                      : 'bg-white/5 border-white/5 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <div className="font-semibold text-xs text-white">WebM (VP9 / Opus)</div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">
                    Kualitas web tinggi & hemat ukuran
                  </div>
                </button>
              </div>
            </div>

            {/* Framerate Selection */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
                Kecepatan Bingkai (Framerate)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSelectedFps(60)}
                  className={`py-2 px-3 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                    selectedFps === 60
                      ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                      : 'bg-white/5 border-white/5 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  60 FPS (Ultra Halus)
                </button>
                <button
                  onClick={() => setSelectedFps(30)}
                  className={`py-2 px-3 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                    selectedFps === 30
                      ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                      : 'bg-white/5 border-white/5 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  30 FPS (Standar)
                </button>
              </div>
            </div>

            {/* Start from 0:00 (Awal Lagu) Option */}
            <div
              className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                startFromBeginning
                  ? 'bg-cyan-500/10 border-cyan-500/30'
                  : 'bg-white/5 border-white/5 hover:border-white/10'
              }`}
              onClick={() => setStartFromBeginning(!startFromBeginning)}
            >
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="startFromBeginning"
                  checked={startFromBeginning}
                  onChange={(e) => setStartFromBeginning(e.target.checked)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-400 cursor-pointer"
                />
                <div>
                  <label
                    htmlFor="startFromBeginning"
                    className="text-xs font-semibold text-white block cursor-pointer"
                  >
                    Mulai Ekspor dari 00:00 (Awal Lagu)
                  </label>
                  <p className="text-[11px] text-neutral-400">
                    Otomatis mengulang audio ke detik ke-0 saat rekaman dimulai agar video terekam utuh dari awal.
                  </p>
                </div>
              </div>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase shrink-0 ${
                  startFromBeginning ? 'bg-cyan-400 text-neutral-950' : 'bg-white/10 text-neutral-400'
                }`}
              >
                {startFromBeginning ? 'DARI 0' : 'POSISI SAAT INI'}
              </span>
            </div>

            {/* Codec Detection Status */}
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-neutral-300 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Codec Aktif Browser Anda:</span>
              </div>
              <p className="font-mono-code text-[11px] text-cyan-400/90 break-all">
                {optimalCodec.mimeType} ({optimalCodec.ext.toUpperCase()})
              </p>
            </div>

            {/* Error Message if any */}
            {recordingState.status === 'error' && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{recordingState.errorMessage || 'Terjadi kesalahan saat perekaman.'}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-medium transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => onStartRecord(selectedFps, preferMp4, startFromBeginning)}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-neutral-950 font-semibold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
              >
                <Video className="w-4 h-4" />
                <span>Mulai Rekam Sekarang</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
