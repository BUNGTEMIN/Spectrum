import React, { useRef } from 'react';
import {
  X,
  Music,
  Video,
  Image as ImageIcon,
  CheckCircle2,
  UploadCloud,
} from 'lucide-react';
import { AudioState } from '../types/visualizer';

interface MediaUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  audioState: AudioState;
  onAudioVideoSelected: (file: File) => void;
  onCoverImageSelected: (file: File) => void;
  onBackgroundImageSelected: (file: File) => void;
  onResetCover: () => void;
  onResetBackground: () => void;
}

export const MediaUploadModal: React.FC<MediaUploadModalProps> = ({
  isOpen,
  onClose,
  audioState,
  onAudioVideoSelected,
  onCoverImageSelected,
  onBackgroundImageSelected,
  onResetCover,
  onResetBackground,
}) => {
  const audioInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const [isAudioDragging, setIsAudioDragging] = React.useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg glass-panel rounded-2xl border border-white/10 shadow-2xl p-5 sm:p-6 text-neutral-100 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-display text-white">
                Kelola Media & Latar Belakang
              </h3>
              <p className="text-xs text-neutral-400">
                Pilih lagu, video MP4 pengiring, cover art, atau background kustom
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Audio / Video Track File Input */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
            <Music className="w-3.5 h-3.5 text-cyan-400" />
            <span>1. File Audio / Video Lagu</span>
          </label>

          <input
            ref={audioInputRef}
            type="file"
            accept="audio/*,video/*,audio/mpeg,audio/mp3,audio/wav,audio/x-m4a,audio/m4a,audio/aac,audio/flac,audio/ogg,video/mp4,video/webm,.mp3,.wav,.flac,.m4a,.aac,.ogg,.mp4,.webm"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                onAudioVideoSelected(e.target.files[0]);
                e.target.value = '';
              }
            }}
          />

          <div
            onClick={() => audioInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsAudioDragging(true);
            }}
            onDragLeave={() => setIsAudioDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsAudioDragging(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                onAudioVideoSelected(e.dataTransfer.files[0]);
              }
            }}
            className={`p-4 rounded-xl border border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-2 group ${
              isAudioDragging
                ? 'border-cyan-400 bg-cyan-500/20 scale-[1.01]'
                : 'border-white/20 hover:border-cyan-400/60 bg-white/5 hover:bg-white/10'
            }`}
          >
            <div className="p-2.5 rounded-full bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition-transform">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-white">
                {isAudioDragging ? 'Lepaskan file MP3 / Audio di sini!' : 'Klik atau Tarik File MP3 / Audio ke sini'}
              </div>
              <div className="text-[11px] text-neutral-400 mt-0.5">
                Dukungan format: MP3, WAV, FLAC, M4A, AAC, OGG, MP4, WebM
              </div>
            </div>

            {audioState.fileName && (
              <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="truncate max-w-[260px]">{audioState.fileName}</span>
              </div>
            )}
          </div>
        </div>

        {/* 2. Cover Art Tengah & Background Image */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Cover Art */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1">
                <ImageIcon className="w-3 h-3 text-purple-400" />
                <span>Cover Art Tengah</span>
              </label>
              {audioState.coverUrl && (
                <button
                  onClick={onResetCover}
                  className="text-[10px] text-red-400 hover:text-red-300 cursor-pointer"
                >
                  Hapus
                </button>
              )}
            </div>

            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  onCoverImageSelected(e.target.files[0]);
                }
              }}
            />

            <button
              onClick={() => coverInputRef.current?.click()}
              className="w-full p-3 rounded-xl border border-white/10 hover:border-purple-400/50 bg-white/5 hover:bg-white/10 text-left transition-colors cursor-pointer flex items-center gap-2.5"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium text-white truncate">
                  {audioState.coverUrl ? 'Ganti Cover' : 'Upload Cover'}
                </div>
                <div className="text-[10px] text-neutral-400 truncate">
                  {audioState.coverUrl ? 'Cover kustom aktif' : 'PNG, JPG, WebP'}
                </div>
              </div>
            </button>
          </div>

          {/* Background Image */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1">
                <ImageIcon className="w-3 h-3 text-amber-400" />
                <span>Background Gambar</span>
              </label>
              {audioState.bgUrl && (
                <button
                  onClick={onResetBackground}
                  className="text-[10px] text-red-400 hover:text-red-300 cursor-pointer"
                >
                  Hapus
                </button>
              )}
            </div>

            <input
              ref={bgInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  onBackgroundImageSelected(e.target.files[0]);
                }
              }}
            />

            <button
              onClick={() => bgInputRef.current?.click()}
              className="w-full p-3 rounded-xl border border-white/10 hover:border-amber-400/50 bg-white/5 hover:bg-white/10 text-left transition-colors cursor-pointer flex items-center gap-2.5"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium text-white truncate">
                  {audioState.bgUrl ? 'Ganti Background' : 'Upload Wallpaper'}
                </div>
                <div className="text-[10px] text-neutral-400 truncate">
                  {audioState.bgUrl ? 'Wallpaper aktif' : 'Resolusi 1080p/4k'}
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Video Background Notice */}
        {audioState.fileType === 'video' && (
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-neutral-300 flex items-start gap-2.5">
            <Video className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed text-neutral-300">
              <strong>Video MP4 Terdeteksi:</strong> Video ini sedang diputar sebagai sumber audio visualizer dan dapat dijadikan latar belakang bergerak otomatis di menu Pengaturan → Latar → Video Pengiring.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-semibold text-xs transition-colors cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
