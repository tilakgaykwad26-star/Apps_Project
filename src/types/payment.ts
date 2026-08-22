import { PaymentMethod, PaymentStatus } from './donation';

export type PaymentType = 
  | 'annual_subscription' // वार्षिक वर्गणी
  | 'special_vargani'     // विशेष वर्गणी / वर्गणी वाढ
  | 'festival_fund'       // उत्सव निधी
  | 'other';

export type DuesStatus = 'paid' | 'pending' | 'partial' | 'pending_verification';

export interface MemberPayment {
  id: string;
  memberId: string;
  memberName: string;
  memberPhone: string;
  financialYear: string; // "2026-27"
  amount: number;
  paymentType: PaymentType;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  receiptNumber: string; // "DM/2026-27/SUB-2045"
  receiptUrl?: string;
  recordedBy: string; // Admin UID or "online"
  recordedByName?: string;
  notes?: string;
  createdAt: string; // ISO string
}

export interface MemberFinancialSummary {
  memberId: string;
  financialYear: string;
  totalAnnualDue: number;
  totalPaid: number;
  pendingPaid?: number;
  remainingDue: number;
  status: DuesStatus;
  lastPaymentDate?: string;
  lastReceiptNumber?: string;
}
