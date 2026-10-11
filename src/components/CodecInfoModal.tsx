import React from 'react';
import { X, Check, AlertTriangle, ShieldCheck, Terminal, Info } from 'lucide-react';
import { VideoRecorder } from '../utils/recorder';

interface CodecInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CodecInfoModal: React.FC<CodecInfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const codecs = VideoRecorder.getSupportedCodecs();

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl glass-panel rounded-2xl border border-white/10 shadow-2xl p-5 sm:p-6 text-neutral-100 flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-display text-white">
                Catatan Kompatibilitas Codec Video Browser
              </h3>
              <p className="text-xs text-neutral-400">
                Spesifikasi teknis MediaRecorder API & format ekspor (Chrome, Edge, Firefox)
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

        {/* Live Detected Support in Current Browser */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Hasil Deteksi Live di Browser Anda</span>
          </div>
          <div className="rounded-xl border border-white/10 bg-neutral-950/60 overflow-hidden divide-y divide-white/5">
            {codecs.map((c, i) => (
              <div key={i} className="p-2.5 flex items-center justify-between text-xs gap-3">
                <div className="min-w-0">
                  <div className="font-mono-code font-medium text-white truncate">
                    {c.mimeType}
                  </div>
                  <div className="text-[11px] text-neutral-400 truncate">
                    {c.description}
                  </div>
                </div>
                <div className="shrink-0">
                  {c.isSupported ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <Check className="w-3 h-3" /> Didukung
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] text-neutral-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                      Tidak Aktif
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Technical Explanations per Browser */}
        <div className="space-y-3 pt-1 text-xs text-neutral-300 leading-relaxed">
          <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
            <div className="font-semibold text-white flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              Google Chrome & Microsoft Edge (Chromium Engine)
            </div>
            <p className="text-neutral-400 text-[11px]">
              Sejak Chromium v107+, Chrome & Edge mendukung MediaRecorder dengan enkoder MP4 hardware (H.264/AVC1 + AAC). Hasil rekaman menghasilkan file <span className="font-mono text-cyan-300">.mp4</span> murni yang langsung kompatibel di Premiere Pro, After Effects, CapCut, TikTok, YouTube Shorts, WhatsApp, iOS, dan Windows Media Player.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
            <div className="font-semibold text-white flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-400"></span>
              Mozilla Firefox (Gecko Engine)
            </div>
            <p className="text-neutral-400 text-[11px]">
              Firefox secara default mengutamakan format open-source <span className="font-mono text-purple-300">video/webm</span> dengan codec VP9 / VP8 dan audio Opus. Jika pengguna memilih MP4 pada Firefox, aplikasi ini secara otomatis menerapkan graceful fallback ke WebM beresolusi tinggi tanpa crash.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
            <div className="font-semibold text-white flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Apple Safari (WebKit)
            </div>
            <p className="text-neutral-400 text-[11px]">
              Safari versi 14.1+ mendukung perekaman stream canvas dengan dukungan MP4 H.264. Audio stream dikombinasikan melalui <span className="font-mono text-emerald-300">AudioContext.createMediaStreamDestination()</span>.
            </p>
          </div>
        </div>

        {/* Pro Tip Box */}
        <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-200 flex items-start gap-2.5">
          <Terminal className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            <strong>Tips Pengembang:</strong> Jika memerlukan konversi WebM ke MP4 offline secara lossless, Anda dapat menjalankan perintah cepat FFmpeg:
            <code className="block mt-1 font-mono-code bg-black/40 p-1.5 rounded text-cyan-300">
              ffmpeg -i visualizer.webm -c:v libx264 -c:a aac output.mp4
            </code>
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-1">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs transition-colors cursor-pointer"
          >
            Mengerti & Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
