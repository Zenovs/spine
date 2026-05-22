// Client-only. Compresses videos > 20 MB via FFmpeg.wasm (single-threaded,
// no SharedArrayBuffer required). Uses jsDelivr CDN — cached after first load.

const THRESHOLD = 20 * 1024 * 1024; // 20 MB
const CDN = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ff: any = null;
let loadPromise: Promise<void> | null = null;

async function ensureLoaded(onStage: (s: string) => void): Promise<unknown> {
  if (!ff) {
    const { FFmpeg } = await import('@ffmpeg/ffmpeg');
    ff = new FFmpeg();
  }
  if (!loadPromise) {
    onStage('Kompressions-Engine wird geladen…');
    const { toBlobURL } = await import('@ffmpeg/util');
    loadPromise = (async () => {
      const [coreURL, wasmURL] = await Promise.all([
        toBlobURL(`${CDN}/ffmpeg-core.js`, 'text/javascript'),
        toBlobURL(`${CDN}/ffmpeg-core.wasm`, 'application/wasm'),
      ]);
      await ff.load({ coreURL, wasmURL });
    })();
  }
  await loadPromise;
  return ff;
}

export type CompressResult = {
  file: File;
  originalMB: number;
  compressedMB: number;
  didCompress: boolean;
};

export async function compressVideo(
  file: File,
  onStage: (stage: string) => void,
  onProgress: (pct: number) => void,
): Promise<CompressResult> {
  const originalMB = file.size / 1e6;

  if (file.size < THRESHOLD) {
    return { file, originalMB, compressedMB: originalMB, didCompress: false };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let progressHandler: ((e: any) => void) | undefined;

  const ffmpeg = await ensureLoaded(onStage) as {
    on: (e: string, h: unknown) => void;
    off: (e: string, h: unknown) => void;
    writeFile: (n: string, d: unknown) => Promise<void>;
    exec: (args: string[]) => Promise<void>;
    readFile: (n: string) => Promise<Uint8Array>;
    deleteFile: (n: string) => Promise<void>;
  };

  onStage('Video wird komprimiert…');
  onProgress(0);

  progressHandler = ({ progress }: { progress: number }) => {
    onProgress(Math.round(Math.min(progress * 100, 95)));
  };
  ffmpeg.on('progress', progressHandler);

  try {
    const { fetchFile } = await import('@ffmpeg/util');
    const ext = (file.name.split('.').pop() ?? 'mp4').toLowerCase();
    const inputName = `in.${ext}`;

    await ffmpeg.writeFile(inputName, await fetchFile(file));
    await ffmpeg.exec([
      '-i', inputName,
      '-vf', 'scale=-2:720',
      '-c:v', 'libx264', '-crf', '28', '-preset', 'ultrafast',
      '-c:a', 'aac', '-b:a', '96k',
      '-movflags', '+faststart',
      'out.mp4',
    ]);

    ffmpeg.off('progress', progressHandler);
    progressHandler = undefined;

    const data = await ffmpeg.readFile('out.mp4');
    ffmpeg.deleteFile(inputName).catch(() => {});
    ffmpeg.deleteFile('out.mp4').catch(() => {});

    onProgress(100);
    const compressed = new File(
      [(data as Uint8Array).buffer as ArrayBuffer],
      'video.mp4',
      { type: 'video/mp4' },
    );
    return {
      file: compressed,
      originalMB,
      compressedMB: compressed.size / 1e6,
      didCompress: true,
    };
  } catch (err) {
    if (progressHandler) ffmpeg.off('progress', progressHandler);
    throw err;
  }
}
