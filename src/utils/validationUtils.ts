// Input validation for Indian mobile numbers, PAN cards, email, and amounts

export function isValidIndianPhone(phone: string): boolean {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s\-\+]/g, '');
  // Match 10-digit number optionally prefixed with 91 or 0
  return /^(?:91|0)?[6-9]\d{9}$/.test(cleaned);
}

export function cleanIndianPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits;
}

export function isValidPAN(pan: string): boolean {
  if (!pan) return true; // PAN is often optional
  const cleaned = pan.trim().toUpperCase();
  return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleaned);
}

export function isValidEmail(email: string): boolean {
  if (!email) return true; // Optional
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function isValidDonationAmount(amount: number): boolean {
  return typeof amount === 'number' && amount >= 11 && amount <= 5000000;
}
