const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const env = require('../config/env');

const dir = path.join(process.cwd(), 'storage', 'private', 'facility-documents');
fs.mkdirSync(dir, { recursive: true });

const allowed = new Map([
  ['application/pdf', '.pdf'],
  ['image/jpeg', '.jpg'],
  ['image/png', '.png']
]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, dir),
  filename: (req, file, cb) => {
    const ext = allowed.get(file.mimetype) || '';
    cb(null, `${crypto.randomUUID()}${ext}`);
  }
});

const facilityDocumentUpload = multer({
  storage,
  limits: { fileSize: env.uploadMaxMb * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (allowed.has(file.mimetype)) return cb(null, true);
    const error = new Error('Chỉ chấp nhận PDF, JPG hoặc PNG.'); error.statusCode = 400; error.isOperational = true; return cb(error);
  }
});

module.exports = { facilityDocumentUpload };
