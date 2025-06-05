export interface GenerateInvoiceDto {
  filename: string;
  p1: string; // Provider Name
  p2: string; // Provider Email
  p3: string; // Provider Phone
  p4: string; // Code
  p5: string; // Order ID
  p6: string; // Payment ID
  p7: string; // Date
  p8: string; // Payment Mode
  p9: string; // Member Name
  p10: string; // Member Unique ID
  p11?: string; // Member Category
  p12: string; // Member Phone
  p13: string; // FeePlan Name
  p14: string; // Fee Amount
  note?: string; // Optional note field
}

export interface GenerateInvoiceResponseDto {
  success: boolean;
  url?: string;
  error?: string;
}
