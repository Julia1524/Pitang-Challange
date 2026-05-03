import multer from 'multer';
import path from 'path';

import type { Request } from 'express';

const storage = multer.diskStorage({
    destination: (request, file, callback) => {
        callback(null, 'uploads/');
    },
    filename: (request, file, callback) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
        callback(null, uniqueName);
    },
});

function fileFilter(request: Request, file: Express.Multer.File, callback: multer.FileFilterCallback) {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];

    if (allowedTypes.includes(file.mimetype)) {
        callback(null, true);
    } else {
        callback(new Error('Invalid file type. Only PDF, JPG and PNG are allowed'));
    }
}

export const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
});
