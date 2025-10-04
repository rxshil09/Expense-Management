import { NextRequest } from 'next/server';
import { requireUser, createApiError, createApiSuccess } from '../../../server/auth/guard';
import { extractReceiptData } from '../../../server/ocr/provider';
import { parseReceiptText } from '../../../server/ocr/parse';
import { saveFile } from '../../../server/storage/uploads';

export async function POST(request: NextRequest) {
  try {
    await requireUser();
    
    const formData = await request.formData();
    const file = formData.get('receipt') as File;
    
    if (!file) {
      return createApiError('No file provided', 400);
    }
    
    // Save the uploaded file
    const filename = await saveFile(file);
    
    // Convert file to buffer for OCR processing
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Extract text from image
    const ocrResult = await extractReceiptData(buffer);
    
    // Parse the extracted text into structured data
    const parsedData = parseReceiptText(ocrResult.rawText);
    
    return createApiSuccess({
      filename,
      ocrResult,
      parsedData,
    });
  } catch (error: any) {
    return createApiError(error.message, 400);
  }
}