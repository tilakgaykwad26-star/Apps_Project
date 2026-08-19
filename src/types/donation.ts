export type DonationType = 
  | 'general'          // सर्वसाधारण देणगी
  | 'maharati'         // महाआरती देणगी
  | 'annadaan'         // अन्नदान / महाप्रसाद
  | 'special_utsav'    // विशेष उत्सव देणगी
  | 'murti_decoration' // मूर्ती व सजावट
  | 'other';           // इतर

export type PaymentMethod = 
  | 'razorpay_upi'
  | 'razorpay_card'
  | 'razorpay_netbanking'
  | 'cash'
  | 'direct_upi'
  | 'bank_transfer'
  | 'upi'
  | 'upi_qr'
  | 'online'
  | 'cheque';

export type PaymentStatus = 'successful' | 'pending' | 'failed' | 'refunded';

export interface Donation {
  id: string;
  amount: number;
  donorName: string;
  donorPhone: string;
  donorEmail?: string;
  donorPan?: string;
  donorAddress?: string;
  donorCity?: string;
  donationType: DonationType;
  donationTypeMarathi?: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  receiptNumber: string; // e.g. "DM/2026-27/DON-1024"
  receiptUrl?: string;
  isAnonymous: boolean;
  notes?: string;
  createdAt: string; // ISO string
}
