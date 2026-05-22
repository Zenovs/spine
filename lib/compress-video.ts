// Only runs in the browser (client component imports only).
// Compresses videos > 20 MB via FFmpeg.wasm: scales to 720p, CRF 28.
// Falls back to the original file silently if anything fails.

const THRESHOLD = 20 * 1024 * 1024; // 20 MB
const CDN = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';

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
    const [coreURL, wasmURL] = await Promise.all([
      toBlobURL(`${CDN}/ffmpeg-core.js`, 'text/javascript'),
      toBlobURL(`${CDN}/ffmpeg-core.wasm`, 'application/wasm'),
    ]);
    loadPromise = ff.load({ coreURL, wasmURL });
  }
  await loadPromise;
  return ff;
}

export async function compressVideo(
  file: File,
  onStage: (stage: string) => void,
  onProgress: (pct: number) => void,
): Promise<File> {
  if (file.size < THRESHOLD) return file;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let progressHandler: ((e: any) => void) | undefined;

  try {
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

    const { fetchFile } = await import('@ffmpeg/util');
    const ext = (file.name.split('.').pop() ?? 'mp4').toLowerCase();
    const inputName = `in.${ext}`;

    await ffmpeg.writeFile(inputName, await fetchFile(file));
    await ffmpeg.exec([
      '-i', inputName,
      '-vf', 'scale=-2:min(720,ih)',
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
    const compressed = new File([data.buffer as ArrayBuffer], 'video.mp4', { type: 'video/mp4' });
    console.info(
      `Compressed: ${(file.size / 1e6).toFixed(1)} MB → ${(compressed.size / 1e6).toFixed(1)} MB`
    );
    return compressed;
  } catch (err) {
    if (progressHandler && ff) ff.off('progress', progressHandler);
    console.warn('Compression failed, uploading original:', err);
    return file;
  }
}
