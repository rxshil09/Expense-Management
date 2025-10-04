export interface ParsedReceiptData {
  amount?: number;
  date?: Date;
  merchant?: string;
  category?: string;
  items?: Array<{
    description: string;
    amount: number;
    quantity?: number;
  }>;
}

export function parseReceiptText(text: string): ParsedReceiptData {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);
  const result: ParsedReceiptData = {};
  
  // Extract total amount
  for (const line of lines) {
    const totalMatch = line.match(/(?:total|amount due|balance)[:\s]*\$?([0-9]+\.?[0-9]*)/i);
    if (totalMatch) {
      result.amount = parseFloat(totalMatch[1]);
      break;
    }
  }
  
  // Extract date
  for (const line of lines) {
    const dateMatch = line.match(/([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{2,4})/i);
    if (dateMatch) {
      const parsedDate = new Date(dateMatch[1]);
      if (!isNaN(parsedDate.getTime())) {
        result.date = parsedDate;
        break;
      }
    }
  }
  
  // Extract merchant (usually the first meaningful line)
  for (const line of lines) {
    if (line.length > 3 && !line.match(/^[0-9\s\$\.\-\/]+$/)) {
      result.merchant = line;
      break;
    }
  }
  
  // Determine category based on merchant name or keywords
  if (result.merchant) {
    result.category = categorizeReceipt(result.merchant, text);
  }
  
  // Extract line items
  result.items = extractLineItems(lines);
  
  return result;
}

function categorizeReceipt(merchant: string, fullText: string): string {
  const merchantLower = merchant.toLowerCase();
  const textLower = fullText.toLowerCase();
  
  // Restaurant/Food keywords
  const foodKeywords = ['restaurant', 'cafe', 'diner', 'grill', 'kitchen', 'bistro', 'pizza', 'burger', 'food'];
  if (foodKeywords.some(keyword => merchantLower.includes(keyword) || textLower.includes(keyword))) {
    return 'Meals & Entertainment';
  }
  
  // Gas/Fuel keywords
  const gasKeywords = ['gas', 'fuel', 'shell', 'exxon', 'chevron', 'bp', 'mobil'];
  if (gasKeywords.some(keyword => merchantLower.includes(keyword))) {
    return 'Transportation';
  }
  
  // Office supplies
  const officeKeywords = ['office', 'staples', 'depot', 'supplies', 'paper', 'pen'];
  if (officeKeywords.some(keyword => merchantLower.includes(keyword) || textLower.includes(keyword))) {
    return 'Office Supplies';
  }
  
  // Travel
  const travelKeywords = ['hotel', 'motel', 'airline', 'airport', 'taxi', 'uber', 'lyft'];
  if (travelKeywords.some(keyword => merchantLower.includes(keyword))) {
    return 'Travel';
  }
  
  return 'Other';
}

function extractLineItems(lines: string[]): Array<{ description: string; amount: number; quantity?: number }> {
  const items: Array<{ description: string; amount: number; quantity?: number }> = [];
  
  for (const line of lines) {
    // Look for lines with item descriptions and amounts
    const itemMatch = line.match(/(.+?)\s+\$?([0-9]+\.?[0-9]*)$/i);
    if (itemMatch) {
      const description = itemMatch[1].trim();
      const amount = parseFloat(itemMatch[2]);
      
      // Skip if it looks like a total or subtotal
      if (!description.toLowerCase().match(/total|subtotal|tax|tip|discount/)) {
        // Try to extract quantity
        const qtyMatch = description.match(/^([0-9]+)x?\s+(.+)/i);
        if (qtyMatch) {
          items.push({
            quantity: parseInt(qtyMatch[1]),
            description: qtyMatch[2].trim(),
            amount,
          });
        } else {
          items.push({
            description,
            amount,
          });
        }
      }
    }
  }
  
  return items;
}