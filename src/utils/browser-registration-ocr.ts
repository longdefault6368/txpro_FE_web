import { registrationPlateFromText } from './vehicle-registration';

export async function readRegistrationPlate(file: File, progress: (value: string) => void, signal?: AbortSignal) {
  const { createWorker, PSM } = await import('tesseract.js');
  progress('Đang chuẩn bị bộ đọc biển số…');
  const worker = await createWorker(['eng', 'vie'], 1, {
    workerPath: '/ocr/worker.min.js', corePath: '/ocr', langPath: '/ocr',
    logger: entry => { if (entry.status === 'recognizing text') progress('Đang đọc cà vẹt… ' + Math.round(entry.progress * 100) + '%'); },
  });
  const imageUrl = URL.createObjectURL(file);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let abort: (() => void) | undefined;
  try {
    if (signal?.aborted) throw new DOMException('Đã dừng quét ảnh.', 'AbortError');
    const run = async () => {
      const image = new Image(); image.src = imageUrl; await image.decode();
      const scale = Math.min(2, 3000 / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement('canvas'); canvas.width = Math.round(image.naturalWidth * scale); canvas.height = Math.round(image.naturalHeight * scale);
      const context = canvas.getContext('2d'); if (!context) throw new Error('Trình duyệt không hỗ trợ đọc ảnh.');
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      await worker.setParameters({ tessedit_pageseg_mode: PSM.AUTO });
      const first = await worker.recognize(canvas, { rotateAuto: true });
      try { return registrationPlateFromText(first.data.text); } catch { /* A contrast pass can recover faint printed text, never guessed characters. */ }
      context.filter = 'grayscale(1) contrast(1.7)'; context.drawImage(image, 0, 0, canvas.width, canvas.height);
      await worker.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT });
      const second = await worker.recognize(canvas, { rotateAuto: true });
      return registrationPlateFromText(second.data.text);
    };
    const plateNumber = await Promise.race([run(), new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('Đọc ảnh quá lâu. Vui lòng thử lại bằng ảnh rõ hơn.')), 90000);
      abort = () => reject(new DOMException('Đã dừng quét ảnh.', 'AbortError'));
      signal?.addEventListener('abort', abort, { once: true });
    })]);
    return { source: 'browser_tesseract', version: 1, plateNumber };
  } finally { clearTimeout(timer); if (abort) signal?.removeEventListener('abort', abort); URL.revokeObjectURL(imageUrl); await worker.terminate(); }
}
