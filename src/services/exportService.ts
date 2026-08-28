import { Donation } from '../types/donation';
import { MemberPayment } from '../types/payment';
import { Member } from '../types/auth';
import { Expense } from '../types/expense';
import { formatIndianDate } from '../utils/dateUtils';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { MANDAL_CONFIG } from '../config/constants';

// Export to CSV
export function exportToCSV(data: any[], filename: string, headers: { label: string; key: string }[]) {
  const headerRow = headers.map((h) => `"${h.label}"`).join(',');
  const rows = data.map((item) => {
    return headers
      .map((h) => {
        let val = item[h.key];
        if (val === undefined || val === null) val = '';
        if (typeof val === 'string') val = val.replace(/"/g, '""');
        return `"${val}"`;
      })
      .join(',');
  });

  const csvContent = '\uFEFF' + [headerRow, ...rows].join('\n'); // UTF-8 BOM for Marathi text compatibility in Excel
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportDonationsCSV(donations: Donation[]) {
  const headers = [
    { label: 'पावती क्र. (Receipt No)', key: 'receiptNumber' },
    { label: 'दिनांक (Date)', key: 'formattedDate' },
    { label: 'देणगीदार नाव (Donor Name)', key: 'donorName' },
    { label: 'मोबाईल (Phone)', key: 'donorPhone' },
    { label: 'पॅन नंबर (PAN)', key: 'donorPan' },
    { label: 'प्रकार (Type)', key: 'donationTypeMarathi' },
    { label: 'रक्कम (Amount in Rs)', key: 'amount' },
    { label: 'पेमेंट प्रकार (Mode)', key: 'paymentMethod' },
    { label: 'स्थिती (Status)', key: 'paymentStatus' },
  ];

  const formatted = donations.map((d) => ({
    ...d,
    formattedDate: formatIndianDate(d.createdAt),
    donorName: d.isAnonymous ? 'गुप्त दान (Anonymous)' : d.donorName,
  }));

  exportToCSV(formatted, 'Durga_Mandal_Donations_Report', headers);
}

export function exportMembersCSV(members: Member[]) {
  const headers = [
    { label: 'सभासद क्र. (Member No)', key: 'memberNumber' },
    { label: 'पूर्ण नाव (Full Name)', key: 'fullNameMarathi' },
    { label: 'मोबाईल (Mobile)', key: 'phone' },
    { label: 'वर्गणी प्रकार (Type)', key: 'memberType' },
    { label: 'श्रेणी (Category)', key: 'category' },
    { label: 'गाव/शहर (City/Village)', key: 'cityVillage' },
    { label: 'पत्ता (Address)', key: 'address' },
    { label: 'नोंदणी तारीख (Joined Date)', key: 'joinedDate' },
    { label: 'स्थिती (Status)', key: 'status' },
  ];

  const formatted = members.map((m) => ({
    ...m,
    fullNameMarathi: m.fullNameMarathi || m.fullName,
  }));

  exportToCSV(formatted, 'Durga_Mandal_Members_Directory', headers);
}

export function exportExpensesCSV(expenses: Expense[]) {
  const headers = [
    { label: 'व्हाउचर क्र. (Voucher No)', key: 'voucherNumber' },
    { label: 'दिनांक (Date)', key: 'formattedDate' },
    { label: 'खर्चाचे शीर्षक (Title)', key: 'title' },
    { label: 'प्रवर्ग (Category)', key: 'categoryMarathi' },
    { label: 'देयक व्यक्ती/फर्म (Payee)', key: 'payeeName' },
    { label: 'रक्कम (Amount in Rs)', key: 'amount' },
    { label: 'पेमेंट पद्धत (Mode)', key: 'paymentMethod' },
    { label: 'नोंदणीकर्ता (Recorded By)', key: 'recordedByName' },
    { label: 'शेरा (Notes)', key: 'notes' },
  ];

  const formatted = expenses.map((e) => ({
    ...e,
    formattedDate: formatIndianDate(e.date || e.createdAt),
    categoryMarathi: e.categoryMarathi || e.category,
    recordedByName: e.recordedByName || e.recordedBy
  }));

  exportToCSV(formatted, 'Durga_Mandal_Expenses_Report', headers);
}

export function generateFinancialBalanceSheetPDF(
  fy: string,
  donations: Donation[],
  payments: MemberPayment[],
  metrics: any,
  expenses: Expense[] = []
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const formatPdfAmount = (amt: number) => `Rs. ${(amt || 0).toLocaleString('en-IN')}`;

  // 1. Header
  doc.setTextColor(135, 28, 28);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('SHREE DURGA MANDAL CHOP, GADCHIROLI', 105, 18, { align: 'center' });

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Reg. No: ${MANDAL_CONFIG.registrationNumber} | Estd: ${MANDAL_CONFIG.establishedYear}`, 105, 24, { align: 'center' });

  doc.setFontSize(11.5);
  doc.setTextColor(33, 33, 33);
  doc.setFont('helvetica', 'bold');
  doc.text(`ANNUAL AUDITED BALANCE SHEET & INCOME-EXPENSE STATEMENT (FY ${fy})`, 105, 32, { align: 'center' });

  doc.setDrawColor(135, 28, 28);
  doc.setLineWidth(0.8);
  doc.line(14, 36, 196, 36);

  // 2. High-Level Summary Box
  const netSurplus = (metrics.totalCollection || 0) - (metrics.totalExpenses || 0);
  (doc as any).autoTable({
    startY: 40,
    head: [['Financial Summary Head', 'Details / Count', 'Amount (INR)']],
    body: [
      ['Total Annual Membership Subscriptions (Income)', `${metrics.paidMembersCount || 0} Members Paid`, formatPdfAmount(metrics.totalSubscriptions || 0)],
      ['Total Donations & Seva Collections (Income)', `${donations.length} Contributions`, formatPdfAmount(metrics.totalDonations || 0)],
      ['GROSS TOTAL INCOME / COLLECTIONS (A)', '100% Verified Bank / Cash', formatPdfAmount(metrics.totalCollection || 0)],
      ['TOTAL FESTIVAL & MANDAL EXPENSES (B)', `${expenses.length} Vouchers Cleared`, formatPdfAmount(metrics.totalExpenses || 0)],
      ['NET SURPLUS / CLOSING BALANCE (A - B)', netSurplus >= 0 ? 'Surplus Reserve' : 'Deficit', formatPdfAmount(netSurplus)],
      ['Total Outstanding Membership Dues', `${metrics.pendingMembersCount || 0} Pending Members`, formatPdfAmount(metrics.pendingDues || 0)],
    ],
    theme: 'striped',
    headStyles: { fillColor: [135, 28, 28], textColor: 255 },
    styles: { font: 'helvetica', fontSize: 8.5 }
  });

  // 3. Itemized Expenses Summary Table
  const expenseRows = expenses.map((e) => [
    formatIndianDate(e.date || e.createdAt),
    e.voucherNumber || 'N/A',
    e.title || 'Expense',
    e.payeeName || 'Vendor',
    e.paymentMethod.toUpperCase(),
    formatPdfAmount(e.amount)
  ]);

  (doc as any).autoTable({
    startY: (doc as any).lastAutoTable.finalY + 8,
    head: [['Date', 'Voucher No', 'Expense Description', 'Payee / Vendor', 'Mode', 'Amount']],
    body: expenseRows.length > 0 ? expenseRows : [['-', '-', 'No expenses recorded for this period', '-', '-', 'Rs. 0']],
    theme: 'grid',
    headStyles: { fillColor: [70, 70, 70], textColor: 255 },
    styles: { font: 'helvetica', fontSize: 8 }
  });

  // 4. Signatures
  const finalY = Math.min(265, (doc as any).lastAutoTable.finalY + 22);

  // Digital Signatures Ink
  doc.setFont('times', 'bolditalic');
  doc.setFontSize(10);
  doc.setTextColor(20, 60, 130);
  doc.text('S. G. Nagpurkar', 42.5, finalY - 2, { align: 'center' });
  doc.text('V. M. Bavane', 102.5, finalY - 2, { align: 'center' });
  doc.text('S. I. Kuthe', 162.5, finalY - 2, { align: 'center' });

  // Verification Badge
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(22, 163, 74);
  doc.text('[Digitally Signed]', 42.5, finalY + 1.5, { align: 'center' });
  doc.text('[Digitally Signed]', 102.5, finalY + 1.5, { align: 'center' });
  doc.text('[Digitally Signed]', 162.5, finalY + 1.5, { align: 'center' });

  doc.setDrawColor(160, 160, 160);
  doc.setLineWidth(0.5);
  doc.line(18, finalY + 3, 67, finalY + 3);
  doc.line(78, finalY + 3, 127, finalY + 3);
  doc.line(138, finalY + 3, 187, finalY + 3);

  // Left: President
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 40, 40);
  doc.text(MANDAL_CONFIG.authorities.presidentName, 42.5, finalY + 7.5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(90, 90, 90);
  doc.text(MANDAL_CONFIG.authorities.presidentTitle, 42.5, finalY + 11, { align: 'center' });

  // Middle: Secretary
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 40, 40);
  doc.text(MANDAL_CONFIG.authorities.secretaryName, 102.5, finalY + 7.5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(90, 90, 90);
  doc.text(MANDAL_CONFIG.authorities.secretaryTitle, 102.5, finalY + 11, { align: 'center' });

  // Right: Treasurer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 40, 40);
  doc.text(MANDAL_CONFIG.authorities.treasurerName, 162.5, finalY + 7.5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(90, 90, 90);
  doc.text(MANDAL_CONFIG.authorities.treasurerTitle, 162.5, finalY + 11, { align: 'center' });

  return doc;
}
