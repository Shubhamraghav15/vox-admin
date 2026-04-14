import multer from 'multer';
import multerS3 from 'multer-s3';
import s3Client from '../lib/s3';

const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
];

const fileFilter = (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only PDF and image files are allowed'), false);
    }
};

/**
 * Build the multer instance lazily so that env vars (AWS_BUCKET_NAME etc.)
 * are resolved at request time rather than at module evaluation time.
 * Next.js loads modules before all env vars are guaranteed to be present.
 */
function createUpload() {
    if (!process.env.AWS_BUCKET_NAME) {
        throw new Error(
            'AWS_BUCKET_NAME is not set. Add it to your .env.local file.'
        );
    }

    return multer({
        fileFilter,
        limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
        storage: multerS3({
            s3: s3Client,
            bucket: process.env.AWS_BUCKET_NAME,
            contentType: multerS3.AUTO_CONTENT_TYPE,
            key: (_req, file, cb) => {
                const timestamp = Date.now();
                const sanitizedName = file.originalname.replace(/\s+/g, '-');
                cb(null, `invoices/${timestamp}-${sanitizedName}`);
            },
        }),
    });
}

/**
 * Wraps a multer handler in a Next.js-compatible promise.
 *
 * Usage:
 *   await runMiddleware(req, res, 'single', 'invoice');
 */
export function runMiddleware(req, res, method = 'single', fieldName = 'invoice') {
    const upload = createUpload();
    return new Promise((resolve, reject) => {
        upload[method](fieldName)(req, res, (result) => {
            if (result instanceof Error) return reject(result);
            resolve(result);
        });
    });
}

export default createUpload;