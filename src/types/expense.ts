export type ExpenseCategory =
  | 'mandap_decoration'
  | 'sound_lighting'
  | 'mahaprasad_food'
  | 'puja_havan'
  | 'printing_advertising'
  | 'cultural_prizes'
  | 'administrative_misc'
  | 'other';

export interface Expense {
  id: string;
  financialYear: string;
  title: string;
  titleMarathi?: string;
  category: ExpenseCategory;
  categoryMarathi?: string;
  amount: number;
  date: string; // ISO date
  payeeName: string; // Vendor or person paid
  payeePhone?: string;
  paymentMethod: 'cash' | 'upi' | 'bank_transfer' | 'cheque';
  voucherNumber?: string;
  billReceiptUrl?: string;
  recordedBy: string;
  recordedByName?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}
