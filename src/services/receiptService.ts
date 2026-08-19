import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Donation } from '../types/donation';
import { MemberPayment } from '../types/payment';
import { MANDAL_CONFIG } from '../config/constants';
import { formatIndianDate } from '../utils/dateUtils';
import { numberToEnglishWords } from '../utils/currencyUtils';

// Helper to format currency cleanly for PDF without unsupported unicode symbols
function formatAmountForPDF(amount: number): string {
  return `Rs. ${amount.toLocaleString('en-IN')}`;
}

const DONATION_TYPE_LABELS_EN: Record<string, string> = {
  general: 'GENERAL DONATION (Sarvajanik Utsav)',
  annadaan: 'ANNADAAN SEVA (Mahaprasad Fund)',
  aarti: 'MAHA AARTI SEVA (Deepotsav)',
  puja: 'SPECIAL PUJA & HAVAN SEVA',
  infrastructure: 'MANDAP & INFRASTRUCTURE FUND',
  flower: 'FLOWER DECORATION SEVA',
  other: 'SPECIAL VOLUNTARY CONTRIBUTION'
};

export function generateDonationReceiptPDF(donation: Donation): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5' // A5 size is standard and convenient for temple receipts
  });

  // 1. Decorative Borders (Double Border: Maroon & Gold)
  doc.setDrawColor(135, 28, 28); // Deep Maroon
  doc.setLineWidth(1.2);
  doc.rect(5, 5, 138, 200);

  doc.setDrawColor(212, 175, 55); // Temple Gold
  doc.setLineWidth(0.6);
  doc.rect(7, 7, 134, 196);

  // 2. Mandal Trust Header
  doc.setTextColor(135, 28, 28);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text(MANDAL_CONFIG.nameEnglish.toUpperCase() || 'SHREE DURGA MANDAL TRUST', 74, 16, { align: 'center' });

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(90, 90, 90);
  doc.text(`Reg. No: ${MANDAL_CONFIG.registrationNumber} | Estd: ${MANDAL_CONFIG.establishedYear}`, 74, 22, { align: 'center' });
  doc.text(MANDAL_CONFIG.addressEnglish, 74, 27, { align: 'center' });
  doc.text(`Contact: ${MANDAL_CONFIG.phonePrimary} | UPI: ${MANDAL_CONFIG.officialUpiId}`, 74, 32, { align: 'center' });

  // 3. Divider Line
  doc.setDrawColor(135, 28, 28);
  doc.setLineWidth(0.6);
  doc.line(10, 35, 138, 35);

  // 4. Receipt Badge Header
  doc.setFillColor(135, 28, 28);
  doc.roundedRect(38, 38, 72, 7.5, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('OFFICIAL DONATION RECEIPT', 74, 43.2, { align: 'center' });

  // 5. Metadata (Receipt No, Date, Mode, Status)
  doc.setTextColor(33, 33, 33);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`Receipt No: ${donation.receiptNumber}`, 12, 52);
  doc.text(`Date: ${formatIndianDate(donation.createdAt)}`, 136, 52, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.text(`Payment Mode: ${donation.paymentMethod.toUpperCase()}`, 12, 57);
  doc.setTextColor(22, 163, 74);
  doc.setFont('helvetica', 'bold');
  doc.text(`Status: VERIFIED & CONFIRMED`, 136, 57, { align: 'right' });

  if (donation.razorpayPaymentId) {
    doc.setFontSize(8);
    doc.setTextColor(70, 70, 70);
    const utrDisplay = donation.razorpayPaymentId.replace('UTR_', '');
    doc.text(`UPI Ref / UTR No: ${utrDisplay}`, 12, 62);
  }

  // 6. Donor Details Box
  const boxY = donation.razorpayPaymentId ? 66 : 63;
  doc.setDrawColor(210, 210, 210);
  doc.setFillColor(250, 248, 245); // Soft ivory
  doc.roundedRect(12, boxY, 124, 52, 2.5, 2.5, 'FD');

  doc.setFontSize(9);
  doc.setTextColor(135, 28, 28);
  doc.setFont('helvetica', 'bold');
  doc.text('DONOR PARTICULARS', 16, boxY + 7);

  doc.setTextColor(40, 40, 40);
  doc.setFont('helvetica', 'normal');
  doc.text('Donor Name:', 16, boxY + 15);
  doc.setFont('helvetica', 'bold');
  doc.text(donation.isAnonymous ? 'Anonymous Devotee (Gupt Daan)' : (donation.donorName || 'Devotee'), 44, boxY + 15);

  doc.setFont('helvetica', 'normal');
  doc.text('Mobile No:', 16, boxY + 23);
  doc.text(donation.donorPhone || 'N/A', 44, boxY + 23);

  if (donation.donorPan) {
    doc.text('PAN No:', 85, boxY + 23);
    doc.setFont('helvetica', 'bold');
    doc.text(donation.donorPan.toUpperCase(), 102, boxY + 23);
  }

  doc.setFont('helvetica', 'normal');
  doc.text('Seva Category:', 16, boxY + 31);
  doc.setFont('helvetica', 'bold');
  const catLabel = DONATION_TYPE_LABELS_EN[donation.donationType] || donation.donationType.toUpperCase();
  doc.text(catLabel, 44, boxY + 31);

  doc.setFont('helvetica', 'normal');
  doc.text('City / Village:', 16, boxY + 39);
  doc.text(donation.donorCity || 'Chop / Koregaon', 44, boxY + 39);

  // 7. Amount Highlight Box
  const amountY = boxY + 56;
  doc.setFillColor(255, 243, 224); // Saffron soft tint
  doc.setDrawColor(255, 152, 0);
  doc.roundedRect(12, amountY, 124, 22, 2.5, 2.5, 'FD');

  doc.setFontSize(10);
  doc.setTextColor(135, 28, 28);
  doc.setFont('helvetica', 'bold');
  doc.text('AMOUNT RECEIVED:', 16, amountY + 8);
  doc.setFontSize(13);
  doc.text(formatAmountForPDF(donation.amount), 132, amountY + 9, { align: 'right' });

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(70, 70, 70);
  doc.text(`In Words: Rupees ${numberToEnglishWords(donation.amount)} Only`, 16, amountY + 17);

  // 8. Footer Disclaimers
  const footerY = amountY + 29;
  doc.setFontSize(7.5);
  doc.setTextColor(110, 110, 110);
  doc.text('* This is a computer-generated official receipt verified with digital banking audit trail.', 12, footerY);
  doc.text('* Donations are utilized towards Navratri Utsav, Mahaprasad Annadaan, and social welfare.', 12, footerY + 4);

  // 9. Signatures Block
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.5);
  doc.line(16, 184, 52, 184);
  doc.line(96, 184, 132, 184);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(50, 50, 50);
  doc.text('Hon. Treasurer', 34, 189, { align: 'center' });
  doc.text('Hon. President', 114, 189, { align: 'center' });

  return doc;
}

export function generateSubscriptionReceiptPDF(payment: MemberPayment): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5'
  });

  // 1. Decorative Borders (Double Border: Maroon & Gold)
  doc.setDrawColor(135, 28, 28);
  doc.setLineWidth(1.2);
  doc.rect(5, 5, 138, 200);

  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.6);
  doc.rect(7, 7, 134, 196);

  // 2. Header Title
  doc.setTextColor(135, 28, 28);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text(MANDAL_CONFIG.nameEnglish.toUpperCase() || 'SHREE DURGA MANDAL TRUST', 74, 16, { align: 'center' });

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(90, 90, 90);
  doc.text(`Reg. No: ${MANDAL_CONFIG.registrationNumber} | Estd: ${MANDAL_CONFIG.establishedYear}`, 74, 22, { align: 'center' });
  doc.text(MANDAL_CONFIG.addressEnglish, 74, 27, { align: 'center' });
  doc.text(`Contact: ${MANDAL_CONFIG.phonePrimary} | Email: ${MANDAL_CONFIG.email}`, 74, 32, { align: 'center' });

  // 3. Divider Line
  doc.setDrawColor(135, 28, 28);
  doc.setLineWidth(0.6);
  doc.line(10, 35, 138, 35);

  // 4. Badge Header
  doc.setFillColor(135, 28, 28);
  doc.roundedRect(32, 38, 84, 7.5, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.text('ANNUAL MEMBERSHIP SUBSCRIPTION RECEIPT', 74, 43.2, { align: 'center' });

  // 5. Metadata
  doc.setTextColor(33, 33, 33);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`Receipt No: ${payment.receiptNumber}`, 12, 52);
  doc.text(`Date: ${formatIndianDate(payment.createdAt)}`, 136, 52, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.text(`Financial Year: ${payment.financialYear}`, 12, 57);
  doc.setTextColor(22, 163, 74);
  doc.setFont('helvetica', 'bold');
  doc.text(`Status: VERIFIED & CONFIRMED`, 136, 57, { align: 'right' });

  if (payment.razorpayPaymentId) {
    doc.setFontSize(8);
    doc.setTextColor(70, 70, 70);
    const utrDisplay = payment.razorpayPaymentId.replace('UTR_', '');
    doc.text(`UPI Ref / UTR No: ${utrDisplay}`, 12, 62);
  }

  // 6. Member Details Box
  const boxY = payment.razorpayPaymentId ? 66 : 63;
  doc.setDrawColor(210, 210, 210);
  doc.setFillColor(250, 248, 245);
  doc.roundedRect(12, boxY, 124, 48, 2.5, 2.5, 'FD');

  doc.setFontSize(9);
  doc.setTextColor(135, 28, 28);
  doc.setFont('helvetica', 'bold');
  doc.text('MEMBER DETAILS', 16, boxY + 7);

  doc.setTextColor(40, 40, 40);
  doc.setFont('helvetica', 'normal');
  doc.text('Member Name:', 16, boxY + 15);
  doc.setFont('helvetica', 'bold');
  doc.text(payment.memberName || 'Mandal Member', 44, boxY + 15);

  doc.setFont('helvetica', 'normal');
  doc.text('Mobile No:', 16, boxY + 23);
  doc.text(payment.memberPhone || 'N/A', 44, boxY + 23);

  doc.text('Payment For:', 16, boxY + 31);
  doc.setFont('helvetica', 'bold');
  doc.text(`Annual Subscription (Vargani) FY ${payment.financialYear}`, 44, boxY + 31);

  doc.setFont('helvetica', 'normal');
  doc.text('Recorded By:', 16, boxY + 39);
  doc.text(payment.recordedByName || payment.recordedBy || 'Online Banking', 44, boxY + 39);

  // 7. Amount Box
  const amountY = boxY + 53;
  doc.setFillColor(232, 245, 233); // Soft green tint
  doc.setDrawColor(76, 175, 80);
  doc.roundedRect(12, amountY, 124, 22, 2.5, 2.5, 'FD');

  doc.setFontSize(10);
  doc.setTextColor(46, 125, 50);
  doc.setFont('helvetica', 'bold');
  doc.text('AMOUNT RECEIVED:', 16, amountY + 8);
  doc.setFontSize(13);
  doc.text(formatAmountForPDF(payment.amount), 132, amountY + 9, { align: 'right' });

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(70, 70, 70);
  doc.text(`In Words: Rupees ${numberToEnglishWords(payment.amount)} Only`, 16, amountY + 17);

  // 8. Footer Disclaimers
  const footerY = amountY + 28;
  doc.setFontSize(7.5);
  doc.setTextColor(110, 110, 110);
  doc.text('* This is an official computer-generated receipt verified with digital banking audit trail.', 12, footerY);
  doc.text('* Thank you for your continued support and dedicated service towards the Mandal.', 12, footerY + 4);

  // 9. Signatures Block
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.5);
  doc.line(16, 184, 52, 184);
  doc.line(96, 184, 132, 184);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(50, 50, 50);
  doc.text('Hon. Treasurer', 34, 189, { align: 'center' });
  doc.text('Hon. President', 114, 189, { align: 'center' });

  return doc;
}

export function sendDonationReceiptWhatsApp(donation: Donation) {
  const cleanPhone = (donation.donorPhone || '').replace(/\D/g, '').slice(-10);
  const text = `॥ श्री दुर्गा प्रसन्न ॥ 🙏
🚩 *${MANDAL_CONFIG.nameMarathi} — अधिकृत देणगी पावती* 🚩

प्रिय *${donation.isAnonymous ? 'भाविक' : donation.donorName}*,
दुर्गा मंडळ चोप नवरात्रोत्सवासाठी आपली *₹${donation.amount.toLocaleString('en-IN')}* देणगी यशस्वीरित्या जमा झाली आहे!

📋 *पावती तपशील:*
• पावती क्र: *${donation.receiptNumber}*
• दिनांक: *${formatIndianDate(donation.createdAt)}*
• देणगी प्रकार: *${donation.donationTypeMarathi || donation.donationType}*
• रक्कम: *₹ ${donation.amount.toLocaleString('en-IN')}*
• पेमेंट पद्धत: *UPI (Google Pay / PhonePe)*
${donation.razorpayPaymentId ? `• Ref/UTR No: *${donation.razorpayPaymentId.replace('UTR_', '')}*` : ''}

देवी दुर्गेचा कृपाप्रसाद आपल्या कुटुंबावर सदैव राहो! जय माता दी! 🌺🙏
— *${MANDAL_CONFIG.nameMarathi} (कार्यकारणी समिती)*
संपर्क: ${MANDAL_CONFIG.phonePrimary}`;

  if (cleanPhone) {
    const url = `https://api.whatsapp.com/send?phone=91${cleanPhone}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }
}

export function sendSubscriptionReceiptWhatsApp(payment: MemberPayment) {
  const cleanPhone = (payment.memberPhone || '').replace(/\D/g, '').slice(-10);
  const text = `॥ श्री दुर्गा प्रसन्न ॥ 🙏
🚩 *${MANDAL_CONFIG.nameMarathi} — वार्षिक वर्गणी पावती* 🚩

प्रिय सभासद *${payment.memberName}*,
आपली *वार्षिक सभासद वर्गणी (FY ${payment.financialYear})* रक्कम *₹${payment.amount.toLocaleString('en-IN')}* यशस्वीरित्या जमा झाली आहे!

📋 *पावती तपशील:*
• पावती क्र: *${payment.receiptNumber}*
• दिनांक: *${formatIndianDate(payment.createdAt)}*
• आर्थिक वर्ष: *${payment.financialYear}*
• रक्कम: *₹ ${payment.amount.toLocaleString('en-IN')}*
• पेमेंट पद्धत: *UPI (Google Pay / PhonePe)*
${payment.razorpayPaymentId ? `• Ref/UTR No: *${payment.razorpayPaymentId.replace('UTR_', '')}*` : ''}

मंडळाच्या कार्यात आपले योगदान व सहकार्य बहुमूल्य आहे. धन्यवाद! 🌺🙏
— *${MANDAL_CONFIG.nameMarathi} (कार्यकारणी समिती)*
संपर्क: ${MANDAL_CONFIG.phonePrimary}`;

  if (cleanPhone) {
    const url = `https://api.whatsapp.com/send?phone=91${cleanPhone}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }
}
