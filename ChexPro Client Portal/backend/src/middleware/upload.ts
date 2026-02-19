import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { env } from '../config/env';
import { sanitizeFilename } from '../utils/helpers';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/heic',
  'image/heif',
];

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), env.fileStorage.uploadPath);
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const safe = sanitizeFilename(file.originalname);
    cb(null, `${timestamp}-${safe}`);
  },
});

export const upload = multer({
  storage: localStorage,
  limits: { fileSize: env.fileStorage.maxFileSizeMb * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed. Accepted: PDF, JPG, PNG, HEIC`));
    }
  },
});

export const uploadSingle = upload.single('file');
export const uploadMultiple = upload.array('files', 10);
