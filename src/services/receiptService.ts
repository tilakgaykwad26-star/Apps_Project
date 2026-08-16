import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Donation } from '../types/donation';
import { MemberPayment } from '../types/payment';
import { MANDAL_CONFIG } from '../config/constants';
import { formatIndianDate, formatDateTimeIST } from '../utils/dateUtils';
import { numberToMarathiWords, numberToEnglishWords, formatINR } from '../utils/currencyUtils';

export function generateDonationReceiptPDF(donation: Donation): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5' // A5 size is standard and convenient for temple receipts
  });

  // Border & Header Design
  doc.setDrawColor(135, 28, 28); // Deep Maroon
  doc.setLineWidth(1.5);
  doc.rect(5, 5, 138, 200);

  doc.setDrawColor(212, 175, 55); // Temple Gold
  doc.setLineWidth(0.6);
  doc.rect(7, 7, 134, 196);

  // Header Title
  doc.setTextColor(135, 28, 28);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('SHREE DURGA MANDAL TRUST', 74, 18, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Reg. No: ${MANDAL_CONFIG.registrationNumber} | Estd: ${MANDAL_CONFIG.establishedYear}`, 74, 24, { align: 'center' });
  doc.text(MANDAL_CONFIG.addressEnglish, 74, 29, { align: 'center' });
  doc.text(`Phone: ${MANDAL_CONFIG.phonePrimary} | UPI: ${MANDAL_CONFIG.officialUpiId}`, 74, 34, { align: 'center' });

  // Divider Line
  doc.setDrawColor(135, 28, 28);
  doc.setLineWidth(0.8);
  doc.line(10, 37, 138, 37);

  // Receipt Badge
  doc.setFillColor(135, 28, 28);
  doc.roundedRect(42, 40, 64, 8, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('OFFICIAL DONATION RECEIPT', 74, 45.5, { align: 'center' });

  // Receipt Metadata
  doc.setTextColor(33, 33, 33);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Receipt No: ${donation.receiptNumber}`, 12, 55);
  doc.text(`Date: ${formatIndianDate(donation.createdAt)}`, 136, 55, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.text(`Payment Mode: ${donation.paymentMethod.toUpperCase()}`, 12, 60);
  doc.text(`Status: ${donation.paymentStatus.toUpperCase()}`, 136, 60, { align: 'right' });

  if (donation.razorpayPaymentId) {
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(`Txn ID: ${donation.razorpayPaymentId}`, 12, 65);
  }

  // Donor Details Box
  doc.setDrawColor(220, 220, 220);
  doc.setFillColor(250, 247, 242); // Warm Cream
  doc.roundedRect(12, 70, 124, 60, 3, 3, 'FD');

  doc.setFontSize(9);
  doc.setTextColor(135, 28, 28);
  doc.setFont('helvetica', 'bold');
  doc.text('DONOR DETAILS / देणगीदार तपशील', 16, 76);

  doc.setTextColor(40, 40, 40);
  doc.setFont('helvetica', 'normal');
  doc.text(`Donor Name:`, 16, 83);
  doc.setFont('helvetica', 'bold');
  doc.text(donation.isAnonymous ? 'Anonymous Devotee / गुप्त दान' : donation.donorName, 45, 83);

  doc.setFont('helvetica', 'normal');
  doc.text(`Mobile:`, 16, 90);
  doc.text(donation.donorPhone || 'N/A', 45, 90);

  if (donation.donorPan) {
    doc.text(`PAN No:`, 85, 90);
    doc.setFont('helvetica', 'bold');
    doc.text(donation.donorPan, 102, 90);
  }

  doc.setFont('helvetica', 'normal');
  doc.text(`Category:`, 16, 97);
  doc.setFont('helvetica', 'bold');
  doc.text(`${donation.donationType.toUpperCase()} (${donation.donationTypeMarathi || 'देणगी'})`, 45, 97);

  doc.setFont('helvetica', 'normal');
  doc.text(`City/Village:`, 16, 104);
  doc.text(donation.donorCity || 'Pune', 45, 104);

  // Amount Highlight
  doc.setFillColor(255, 243, 224); // Saffron soft tint
  doc.setDrawColor(255, 152, 0);
  doc.roundedRect(12, 134, 124, 22, 3, 3, 'FD');

  doc.setFontSize(10);
  doc.setTextColor(135, 28, 28);
  doc.setFont('helvetica', 'bold');
  doc.text('AMOUNT RECEIVED:', 16, 142);
  doc.setFontSize(14);
  doc.text(formatINR(donation.amount), 132, 143, { align: 'right' });

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(`In Words: ${numberToEnglishWords(donation.amount)}`, 16, 151);

  // Footer Disclaimers & Signatures
  doc.setFontSize(7.5);
  doc.setTextColor(110, 110, 110);
  doc.text('* This is a computer-generated official receipt verified with digital signature.', 12, 163);
  doc.text('* Donations are utilized for religious celebrations, Mahaprasad, and community welfare.', 12, 167);

  // Signatures
  doc.setDrawColor(180, 180, 180);
  doc.line(16, 186, 50, 186);
  doc.line(98, 186, 132, 186);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(50, 50, 50);
  doc.text('Hon. Treasurer / खजिनदार', 33, 190, { align: 'center' });
  doc.text('Hon. President / अध्यक्ष', 115, 190, { align: 'center' });

  return doc;
}

export function generateSubscriptionReceiptPDF(payment: MemberPayment): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5'
  });

  // Border & Header Design
  doc.setDrawColor(135, 28, 28);
  doc.setLineWidth(1.5);
  doc.rect(5, 5, 138, 200);

  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.6);
  doc.rect(7, 7, 134, 196);

  // Header Title
  doc.setTextColor(135, 28, 28);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('SHREE DURGA MANDAL TRUST', 74, 18, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Reg. No: ${MANDAL_CONFIG.registrationNumber} | Estd: ${MANDAL_CONFIG.establishedYear}`, 74, 24, { align: 'center' });
  doc.text(MANDAL_CONFIG.addressEnglish, 74, 29, { align: 'center' });

  doc.setDrawColor(135, 28, 28);
  doc.setLineWidth(0.8);
  doc.line(10, 35, 138, 35);

  // Badge
  doc.setFillColor(135, 28, 28);
  doc.roundedRect(36, 38, 76, 8, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.text('MEMBER SUBSCRIPTION RECEIPT (वर्गणी)', 74, 43.5, { align: 'center' });

  // Metadata
  doc.setTextColor(33, 33, 33);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Receipt No: ${payment.receiptNumber}`, 12, 54);
  doc.text(`Date: ${formatIndianDate(payment.createdAt)}`, 136, 54, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.text(`Financial Year: ${payment.financialYear}`, 12, 60);
  doc.text(`Mode: ${payment.paymentMethod.toUpperCase()}`, 136, 60, { align: 'right' });

  // Member Info Box
  doc.setDrawColor(220, 220, 220);
  doc.setFillColor(250, 247, 242);
  doc.roundedRect(12, 67, 124, 50, 3, 3, 'FD');

  doc.setFontSize(9);
  doc.setTextColor(135, 28, 28);
  doc.setFont('helvetica', 'bold');
  doc.text('MEMBER DETAILS / सभासद तपशील', 16, 73);

  doc.setTextColor(40, 40, 40);
  doc.setFont('helvetica', 'normal');
  doc.text(`Member Name:`, 16, 81);
  doc.setFont('helvetica', 'bold');
  doc.text(payment.memberName, 45, 81);

  doc.setFont('helvetica', 'normal');
  doc.text(`Mobile:`, 16, 88);
  doc.text(payment.memberPhone, 45, 88);

  doc.text(`Payment For:`, 16, 95);
  doc.setFont('helvetica', 'bold');
  doc.text(`Annual Subscription (वार्षिक वर्गणी) FY ${payment.financialYear}`, 45, 95);

  doc.setFont('helvetica', 'normal');
  doc.text(`Recorded By:`, 16, 102);
  doc.text(payment.recordedByName || payment.recordedBy, 45, 102);

  // Amount Highlight
  doc.setFillColor(232, 245, 233); // Soft green
  doc.setDrawColor(76, 175, 80);
  doc.roundedRect(12, 123, 124, 22, 3, 3, 'FD');

  doc.setFontSize(10);
  doc.setTextColor(46, 125, 50);
  doc.setFont('helvetica', 'bold');
  doc.text('AMOUNT RECEIVED:', 16, 131);
  doc.setFontSize(14);
  doc.text(formatINR(payment.amount), 132, 132, { align: 'right' });

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(`In Words: ${numberToEnglishWords(payment.amount)}`, 16, 140);

  // Signatures
  doc.setDrawColor(180, 180, 180);
  doc.line(16, 180, 50, 180);
  doc.line(98, 180, 132, 180);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(50, 50, 50);
  doc.text('Hon. Treasurer / खजिनदार', 33, 185, { align: 'center' });
  doc.text('Hon. President / अध्यक्ष', 115, 185, { align: 'center' });

  return doc;
}
