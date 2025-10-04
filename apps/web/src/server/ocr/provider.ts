// Mock OCR provider implementation
export interface OCRResult {
  text: string;
  confidence: number;
  boundingBoxes?: Array<{
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
}

export async function processImage(imageBuffer: Buffer): Promise<OCRResult> {
  // Mock implementation - replace with actual OCR service
  // This could integrate with Tesseract.js, Google Vision API, AWS Textract, etc.
  
  return new Promise((resolve) => {
    setTimeout(() => {
      // Mock extracted text from a receipt
      const mockText = `
        RESTAURANT ABC
        123 Main St
        City, State 12345
        
        Date: ${new Date().toLocaleDateString()}
        Time: ${new Date().toLocaleTimeString()}
        
        1x Lunch Special     $15.99
        1x Coffee           $3.50
        Tax                 $1.95
        
        Total: $21.44
        
        Thank you for dining with us!
      `;
      
      resolve({
        text: mockText,
        confidence: 0.95,
      });
    }, 1000); // Simulate processing time
  });
}

export async function extractReceiptData(imageBuffer: Buffer) {
  const ocrResult = await processImage(imageBuffer);
  
  // Basic text parsing to extract structured data
  const text = ocrResult.text.toLowerCase();
  
  // Extract amount using regex
  const amountMatch = text.match(/total[:\s]*\$?([0-9]+\.?[0-9]*)/i);
  const amount = amountMatch ? parseFloat(amountMatch[1]) : null;
  
  // Extract date
  const dateMatch = text.match(/date[:\s]*([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{2,4})/i);
  const date = dateMatch ? new Date(dateMatch[1]) : null;
  
  // Extract merchant name (first line that's not empty)
  const lines = ocrResult.text.split('\n').map(line => line.trim()).filter(line => line);
  const merchant = lines[0] || null;
  
  return {
    amount,
    date,
    merchant,
    rawText: ocrResult.text,
    confidence: ocrResult.confidence,
  };
}