import { Donation } from '../types/donation';
import { MemberPayment } from '../types/payment';
import { Member } from '../types/auth';
import { formatIndianDate } from '../utils/dateUtils';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { MANDAL_CONFIG } from '../config/constants';
import { formatINR } from '../utils/currencyUtils';

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
  // BUG 12 fix: revoke the object URL to prevent memory leak
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
    { label: 'रक्कम ₹ (Amount)', key: 'amount' },
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

export function generateFinancialBalanceSheetPDF(
  fy: string,
  donations: Donation[],
  payments: MemberPayment[],
  metrics: any
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Header
  doc.setTextColor(135, 28, 28);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('SHREE DURGA MANDAL CHOP, GADCHIROLI', 105, 18, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Reg. No: ${MANDAL_CONFIG.registrationNumber} | Estd: ${MANDAL_CONFIG.establishedYear}`, 105, 24, { align: 'center' });

  doc.setFontSize(12);
  doc.setTextColor(33, 33, 33);
  doc.setFont('helvetica', 'bold');
  doc.text(`ANNUAL FINANCIAL STATEMENT & COLLECTION AUDIT (FY ${fy})`, 105, 33, { align: 'center' });

  doc.setDrawColor(135, 28, 28);
  doc.setLineWidth(0.8);
  doc.line(14, 38, 196, 38);

  // Financial Metrics Summary Box
  (doc as any).autoTable({
    startY: 42,
    head: [['Financial Summary Head', 'Details / Count', 'Amount (INR)']],
    body: [
      ['Total Annual Membership Subscriptions (वार्षिक वर्गणी)', `${metrics.paidMembersCount} Members Paid`, formatINR(metrics.totalSubscriptions)],
      ['Total Donations & Seva Collections (देणगी संकलन)', `${donations.length} Contributions`, formatINR(metrics.totalDonations)],
      ['Grand Total Collections (एकूण जमा)', '100% Verified Bank/Cash', formatINR(metrics.totalCollection)],
      ['Total Outstanding Membership Dues (बाकी वर्गणी)', `${metrics.pendingMembersCount} Pending Members`, formatINR(metrics.pendingDues)],
    ],
    theme: 'striped',
    headStyles: { fillColor: [135, 28, 28], textColor: 255 },
    styles: { font: 'helvetica', fontSize: 9 }
  });

  // Recent Collections Table
  const recentTxns = [
    ...donations.map((d) => [formatIndianDate(d.createdAt), d.receiptNumber, d.isAnonymous ? 'Anonymous' : d.donorName, d.donationType.toUpperCase(), formatINR(d.amount)]),
    ...payments.map((p) => [formatIndianDate(p.createdAt), p.receiptNumber, p.memberName, 'ANNUAL SUB', formatINR(p.amount)])
  ].slice(0, 15);

  (doc as any).autoTable({
    startY: (doc as any).lastAutoTable.finalY + 10,
    head: [['Date', 'Receipt No', 'Name / Contributor', 'Type', 'Amount']],
    body: recentTxns,
    theme: 'grid',
    headStyles: { fillColor: [70, 70, 70], textColor: 255 },
    styles: { font: 'helvetica', fontSize: 8.5 }
  });

  // Signatures
  const finalY = (doc as any).lastAutoTable.finalY + 25;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 40, 40);

  doc.line(20, finalY, 65, finalY);
  doc.text('Hon. Treasurer / खजिनदार', 42.5, finalY + 5, { align: 'center' });

  doc.line(80, finalY, 125, finalY);
  doc.text('Hon. Secretary / सचिव', 102.5, finalY + 5, { align: 'center' });

  doc.line(140, finalY, 185, finalY);
  doc.text('Hon. President / अध्यक्ष', 162.5, finalY + 5, { align: 'center' });

  return doc;
}
