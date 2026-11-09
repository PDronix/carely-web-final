const fs = require('fs/promises');
const crypto = require('crypto');
const path = require('path');
const AppError = require('../utils/AppError');

const ROOT = path.join(process.cwd(), 'storage', 'private', 'facility-documents');

async function signatureOk(filePath, mime) {
  const handle = await fs.open(filePath, 'r');
  try {
    const buffer = Buffer.alloc(8);
    await handle.read(buffer, 0, 8, 0);
    if (mime === 'application/pdf') return buffer.slice(0, 5).toString() === '%PDF-';
    if (mime === 'image/png') return buffer.equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]));
    if (mime === 'image/jpeg') return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    return false;
  } finally { await handle.close(); }
}

class FileStorageService {
  static root() { return ROOT; }

  static async inspectUpload(file) {
    if (!file) throw new AppError('Vui lòng đính kèm giấy phép hoạt động.', 400);
    if (!(await signatureOk(file.path, file.mimetype))) {
      await fs.unlink(file.path).catch(() => {});
      throw new AppError('File giấy phép không đúng định dạng PDF/JPG/PNG.', 400);
    }
    const data = await fs.readFile(file.path);
    return {
      originalName: path.basename(file.originalname),
      storageKey: file.filename,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      sha256: crypto.createHash('sha256').update(data).digest('hex')
    };
  }

  static resolve(storageKey) {
    const safe = path.basename(storageKey);
    return path.join(ROOT, safe);
  }

  static async remove(storageKey) {
    if (!storageKey) return;
    await fs.unlink(this.resolve(storageKey)).catch(() => {});
  }
}

module.exports = FileStorageService;
