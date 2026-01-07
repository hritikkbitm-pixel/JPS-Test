import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import archiver from 'archiver';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3456;

// Ensure directories exist
const uploadsDir = path.join(__dirname, 'uploads');
const processedDir = path.join(__dirname, 'processed');
[uploadsDir, processedDir].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const uniqueId = uuidv4();
        const ext = path.extname(file.originalname);
        cb(null, `${uniqueId}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp|tiff|tif|avif|bmp|svg/;
        const ext = path.extname(file.originalname).toLowerCase().slice(1);
        if (allowedTypes.test(ext) || allowedTypes.test(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'), false);
        }
    }
});

// Upload multiple images - use .any() to be more flexible with field names
app.post('/api/upload', (req, res) => {
    const uploadMiddleware = upload.any();

    uploadMiddleware(req, res, async (err) => {
        if (err) {
            console.error('Upload error:', err);
            return res.status(500).json({ success: false, error: err.message });
        }

        try {
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({ success: false, error: 'No files uploaded' });
            }

            const files = req.files.map(file => ({
                id: path.parse(file.filename).name,
                originalName: file.originalname,
                filename: file.filename,
                path: file.path,
                size: file.size
            }));

            // Get dimensions for each file
            const filesWithDimensions = await Promise.all(files.map(async (file) => {
                try {
                    const metadata = await sharp(file.path).metadata();
                    return {
                        ...file,
                        width: metadata.width,
                        height: metadata.height,
                        format: metadata.format
                    };
                } catch (err) {
                    console.error('Metadata error:', err);
                    return { ...file, width: 0, height: 0, format: 'unknown' };
                }
            }));

            res.json({ success: true, files: filesWithDimensions });
        } catch (error) {
            console.error('Processing error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });
});

// Process images
app.post('/api/process', async (req, res) => {
    const { files, settings } = req.body;
    const {
        outputFormat = 'webp',
        width,
        height,
        quality = 80,
        fitMode = 'contain', // contain, cover, fill, inside, outside
        background = '#ffffff',
        upscale = true
    } = settings;

    const sessionId = uuidv4();
    const sessionDir = path.join(processedDir, sessionId);
    fs.mkdirSync(sessionDir, { recursive: true });

    try {
        const processedFiles = await Promise.all(files.map(async (file) => {
            const inputPath = path.join(uploadsDir, file.filename);
            const outputFilename = `${path.parse(file.originalName).name}.${outputFormat}`;
            const outputPath = path.join(sessionDir, outputFilename);

            try {
                let pipeline = sharp(inputPath);

                // Get original dimensions
                const metadata = await sharp(inputPath).metadata();
                const originalWidth = metadata.width;
                const originalHeight = metadata.height;

                // Determine target dimensions
                let targetWidth = width ? parseInt(width) : null;
                let targetHeight = height ? parseInt(height) : null;

                // Handle resizing based on fit mode
                if (targetWidth || targetHeight) {
                    const resizeOptions = {
                        width: targetWidth || undefined,
                        height: targetHeight || undefined,
                        fit: fitMode,
                        withoutEnlargement: !upscale,
                        background: fitMode === 'contain' ? background : undefined
                    };

                    if (fitMode === 'contain') {
                        pipeline = pipeline.resize(resizeOptions);
                        if (targetWidth && targetHeight) {
                            pipeline = pipeline.extend({
                                top: 0,
                                bottom: 0,
                                left: 0,
                                right: 0,
                                background
                            });
                        }
                    } else {
                        pipeline = pipeline.resize(resizeOptions);
                    }
                }

                // Set output format and quality
                const formatOptions = {
                    quality: parseInt(quality)
                };

                switch (outputFormat) {
                    case 'jpeg':
                    case 'jpg':
                        pipeline = pipeline.jpeg(formatOptions);
                        break;
                    case 'png':
                        pipeline = pipeline.png({ compressionLevel: Math.floor((100 - quality) / 11) });
                        break;
                    case 'webp':
                        pipeline = pipeline.webp(formatOptions);
                        break;
                    case 'avif':
                        pipeline = pipeline.avif(formatOptions);
                        break;
                    case 'tiff':
                        pipeline = pipeline.tiff(formatOptions);
                        break;
                    case 'gif':
                        pipeline = pipeline.gif();
                        break;
                    default:
                        pipeline = pipeline.webp(formatOptions);
                }

                await pipeline.toFile(outputPath);

                // Get processed file info
                const processedStats = fs.statSync(outputPath);
                const processedMetadata = await sharp(outputPath).metadata();

                return {
                    id: file.id,
                    success: true,
                    originalName: file.originalName,
                    processedName: outputFilename,
                    originalSize: file.size,
                    processedSize: processedStats.size,
                    originalDimensions: { width: originalWidth, height: originalHeight },
                    processedDimensions: { width: processedMetadata.width, height: processedMetadata.height }
                };
            } catch (err) {
                console.error(`Error processing file ${file.originalName}:`, err.message);
                return {
                    id: file.id,
                    success: false,
                    originalName: file.originalName,
                    error: err.message
                };
            }
        }));

        res.json({
            success: true,
            sessionId,
            files: processedFiles
        });
    } catch (error) {
        console.error('Processing error:', error);
        // Clean up on error - wrap in try-catch to prevent server crash
        try {
            if (fs.existsSync(sessionDir)) {
                fs.rmSync(sessionDir, { recursive: true, force: true });
            }
        } catch (cleanupErr) {
            console.warn('Could not clean up session dir:', cleanupErr.message);
        }
        res.status(500).json({ success: false, error: error.message });
    }
});

// Download single processed image
app.get('/api/download/:sessionId/:filename', (req, res) => {
    const { sessionId, filename } = req.params;
    const filePath = path.join(processedDir, sessionId, filename);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
    }

    res.download(filePath);
});

// Download all as ZIP
app.get('/api/download-all/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    const sessionDir = path.join(processedDir, sessionId);

    if (!fs.existsSync(sessionDir)) {
        return res.status(404).json({ error: 'Session not found' });
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=converted-images-${sessionId}.zip`);

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);
    archive.directory(sessionDir, false);
    archive.finalize();
});

// Cleanup endpoint
app.delete('/api/cleanup/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    const sessionDir = path.join(processedDir, sessionId);

    if (fs.existsSync(sessionDir)) {
        fs.rmSync(sessionDir, { recursive: true, force: true });
    }

    res.json({ success: true });
});

// Cleanup old files on startup
const cleanupOldFiles = () => {
    const maxAge = 60 * 60 * 1000; // 1 hour
    const now = Date.now();

    [uploadsDir, processedDir].forEach(dir => {
        try {
            if (fs.existsSync(dir)) {
                fs.readdirSync(dir).forEach(file => {
                    try {
                        const filePath = path.join(dir, file);
                        const stats = fs.statSync(filePath);
                        if (now - stats.mtimeMs > maxAge) {
                            fs.rmSync(filePath, { recursive: true, force: true });
                        }
                    } catch (err) {
                        console.log(`Cleanup skipped for ${file}:`, err.message);
                    }
                });
            }
        } catch (err) {
            console.log(`Cleanup error for ${dir}:`, err.message);
        }
    });
};

cleanupOldFiles();

app.listen(PORT, () => {
    console.log(`🖼️  Image Converter Server running at http://localhost:${PORT}`);
});
