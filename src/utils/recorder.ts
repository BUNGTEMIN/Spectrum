import { AudioEngine } from './audioEngine';
import { RecordingState } from '../types/visualizer';

export interface CodecInfo {
  mimeType: string;
  extension: 'mp4' | 'webm';
  description: string;
  isSupported: boolean;
}

export class VideoRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private recordingTimer: number | null = null;
  private startTime: number = 0;
  private combinedStream: MediaStream | null = null;

  public static getSupportedCodecs(): CodecInfo[] {
    const codecsToTest: { mime: string; ext: 'mp4' | 'webm'; desc: string }[] = [
      {
        mime: 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"',
        ext: 'mp4',
        desc: 'MP4 (H.264 Baseline + AAC Audio) - Standar kompatibilitas tinggi di Chrome & Edge modern',
      },
      {
        mime: 'video/mp4; codecs="avc1.4d401f, mp4a.40.2"',
        ext: 'mp4',
        desc: 'MP4 (H.264 Main Profile + AAC)',
      },
      {
        mime: 'video/mp4',
        ext: 'mp4',
        desc: 'MP4 (Default Container)',
      },
      {
        mime: 'video/webm; codecs="vp9,opus"',
        ext: 'webm',
        desc: 'WebM (VP9 + Opus Audio) - Kualitas tinggi, kompatibel luas di Chrome, Edge, Firefox',
      },
      {
        mime: 'video/webm; codecs="vp8,opus"',
        ext: 'webm',
        desc: 'WebM (VP8 + Opus)',
      },
      {
        mime: 'video/webm',
        ext: 'webm',
        desc: 'WebM (Default Container)',
      },
    ];

    return codecsToTest.map((c) => ({
      mimeType: c.mime,
      extension: c.ext,
      description: c.desc,
      isSupported: typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(c.mime),
    }));
  }

  public static getOptimalMimeType(preferMp4: boolean = true): { mimeType: string; ext: 'mp4' | 'webm' } {
    if (typeof MediaRecorder === 'undefined') {
      return { mimeType: 'video/webm', ext: 'webm' };
    }

    const supported = this.getSupportedCodecs().filter((c) => c.isSupported);

    if (preferMp4) {
      const mp4 = supported.find((c) => c.extension === 'mp4');
      if (mp4) return { mimeType: mp4.mimeType, ext: 'mp4' };
    }

    // Default to best WebM or first supported
    const webm = supported.find((c) => c.extension === 'webm');
    if (webm) return { mimeType: webm.mimeType, ext: 'webm' };

    return supported[0] ? { mimeType: supported[0].mimeType, ext: supported[0].extension } : { mimeType: 'video/webm', ext: 'webm' };
  }

  public startRecording(
    canvas: HTMLCanvasElement,
    audioEngine: AudioEngine,
    fps: number = 60,
    preferMp4: boolean = true,
    onProgress: (seconds: number) => void,
    onComplete: (blob: Blob, ext: 'mp4' | 'webm', url: string) => void,
    onError: (err: string) => void
  ): boolean {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      onError('Perekaman sedang berlangsung.');
      return false;
    }

    try {
      // 1. Capture Canvas Stream
      const canvasStream = canvas.captureStream(fps);
      const videoTracks = canvasStream.getVideoTracks();

      if (videoTracks.length === 0) {
        onError('Gagal menangkap canvas video stream.');
        return false;
      }

      // 2. Capture Audio Stream from AudioEngine
      const streamDest = audioEngine.getStreamDestination();
      const audioTracks = streamDest ? streamDest.stream.getAudioTracks() : [];

      // 3. Combine Streams
      this.combinedStream = new MediaStream([...videoTracks, ...audioTracks]);

      // 4. Select Codec
      const { mimeType, ext } = VideoRecorder.getOptimalMimeType(preferMp4);

      // Bitrate setting: ~8 Mbps for crispy 1080p visualizer
      const options: MediaRecorderOptions = {
        mimeType: mimeType || undefined,
        videoBitsPerSecond: 8_000_000,
        audioBitsPerSecond: 192_000,
      };

      this.recordedChunks = [];
      this.mediaRecorder = new MediaRecorder(this.combinedStream, options);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        if (this.recordingTimer !== null) {
          clearInterval(this.recordingTimer);
          this.recordingTimer = null;
        }

        const blob = new Blob(this.recordedChunks, { type: mimeType });
        const downloadUrl = URL.createObjectURL(blob);
        onComplete(blob, ext, downloadUrl);

        // Stop all tracks to free up hardware encoder
        if (this.combinedStream) {
          this.combinedStream.getTracks().forEach((track) => track.stop());
          this.combinedStream = null;
        }
      };

      this.mediaRecorder.onerror = (e) => {
        if (this.recordingTimer !== null) {
          clearInterval(this.recordingTimer);
          this.recordingTimer = null;
        }
        onError(`Kesalahan encoder perekaman: ${(e as unknown as { error?: Error }).error?.message || 'Unknown error'}`);
      };

      // Request data slice every 1000ms
      this.mediaRecorder.start(1000);
      this.startTime = Date.now();

      this.recordingTimer = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        onProgress(elapsed);
      }, 500);

      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      onError(`Tidak dapat memulai perekaman: ${msg}`);
      return false;
    }
  }

  public stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
  }

  public isRecording(): boolean {
    return !!(this.mediaRecorder && this.mediaRecorder.state === 'recording');
  }
}

export const downloadVideoFile = (url: string, filename: string) => {
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
  }, 100);
};
