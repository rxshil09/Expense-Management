import { writeFile, mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '5242880'); // 5MB

// Ensure upload directory exists
export async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }
  
  // Check file type
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'application/pdf',
  ];
  
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Only images (JPEG, PNG, GIF) and PDFs are allowed.',
    };
  }
  
  return { valid: true };
}

export async function saveFile(file: File): Promise<string> {
  await ensureUploadDir();
  
  const validation = validateFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }
  
  // Generate unique filename
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1e9);
  const extension = path.extname(file.name);
  const filename = `${timestamp}-${random}${extension}`;
  const filepath = path.join(UPLOAD_DIR, filename);
  
  // Convert File to Buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  // Save file
  await writeFile(filepath, buffer);
  
  return filename;
}

export async function deleteFile(filename: string): Promise<void> {
  try {
    const filepath = path.join(UPLOAD_DIR, filename);
    await unlink(filepath);
  } catch (error) {
    // File might not exist, which is okay
    console.warn('Could not delete file:', filename);
  }
}

export function getFileUrl(filename: string): string {
  return `/uploads/${filename}`;
}

export function getFilePath(filename: string): string {
  return path.join(UPLOAD_DIR, filename);
}