// Format dates in Indian standard and Marathi formats

const MARATHI_MONTHS = [
  'जानेवारी', 'फेब्रुवारी', 'मार्च', 'एप्रिल', 'मे', 'जून',
  'जुलै', 'ऑगस्ट', 'सप्टेंबर', 'ऑक्टोबर', 'नोव्हेंबर', 'डिसेंबर'
];

const MARATHI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];

export function toMarathiDigits(num: number | string): string {
  return String(num).replace(/\d/g, (d) => MARATHI_DIGITS[parseInt(d, 10)]);
}

export function formatIndianDate(dateString: string | Date): string {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return String(dateString);

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatMarathiDate(dateString: string | Date): string {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return String(dateString);

  const day = d.getDate();
  const month = MARATHI_MONTHS[d.getMonth()];
  const year = d.getFullYear();
  return `${toMarathiDigits(day)} ${month} ${toMarathiDigits(year)}`;
}

export function formatDateTimeIST(dateString: string | Date): string {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return String(dateString);

  const datePart = formatIndianDate(d);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${datePart} ${hours}:${minutes} IST`;
}

export function getFinancialYear(date: Date = new Date()): string {
  const currentMonth = date.getMonth(); // 0 = Jan, 3 = April
  const currentYear = date.getFullYear();
  
  if (currentMonth >= 3) {
    // April (3) onwards is CurrentYear - (CurrentYear + 1)
    const nextYearShort = String(currentYear + 1).slice(-2);
    return `${currentYear}-${nextYearShort}`;
  } else {
    // Jan to March is (CurrentYear - 1) - CurrentYear
    const currentYearShort = String(currentYear).slice(-2);
    return `${currentYear - 1}-${currentYearShort}`;
  }
}

export function getAvailableFinancialYears(): string[] {
  const currentFY = getFinancialYear();
  const [startYearStr] = currentFY.split('-');
  const startYear = parseInt(startYearStr, 10);
  
  return [
    `${startYear}-${String(startYear + 1).slice(-2)}`,
    `${startYear - 1}-${String(startYear).slice(-2)}`,
    `${startYear - 2}-${String(startYear - 1).slice(-2)}`,
    `${startYear - 3}-${String(startYear - 2).slice(-2)}`,
  ];
}
