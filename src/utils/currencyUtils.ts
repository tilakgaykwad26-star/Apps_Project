// Currency utilities with Indian formatting (Lakhs / Crores) and Marathi words

export function formatINR(amount: number): string {
  if (isNaN(amount)) return '₹ ०';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatMarathiCurrency(amount: number): string {
  if (isNaN(amount)) return '₹ ०';
  const formatted = formatINR(amount).replace('₹', '₹ ');
  return formatted;
}

// Convert amount in numbers to words in Marathi
export function numberToMarathiWords(amount: number): string {
  if (!amount || amount === 0) return 'शून्य रुपये फक्त';

  const units = ['', 'एक', 'दोन', 'तीन', 'चार', 'पाच', 'सहा', 'सात', 'आठ', 'नऊ', 'दहा',
    'अकरा', 'बारा', 'तेरा', 'चौदा', 'पंधरा', 'सोळा', 'सतरा', 'अठरा', 'एकोणीस', 'वीस',
    'एकवीस', 'बावीस', 'तेवीस', 'चोवीस', 'पंचवीस', 'सव्वीस', 'सत्तावीस', 'अठ्ठावीस', 'एकोणतीस', 'तीस',
    'एकतीस', 'बत्तीस', 'तेहेतीस', 'चौतीस', 'पस्तीस', 'छत्तीस', 'सदतीस', 'अडतीस', 'एकोणचाळीस', 'चाळीस',
    'एक्केचाळीस', 'बेचाळीस', 'त्रेचाळीस', 'चव्वेचाळीस', 'पंचेचाळीस', 'शेहेचाळीस', 'सत्तेचाळीस', 'अठ्ठेचाळीस', 'एकोणपन्नास', 'पन्नास',
    'एक्कावन्न', 'बावन्न', 'त्रेपन्न', 'चोपन्न', 'पंचावन्न', 'छप्पन्न', 'सत्तावन्न', 'अठ्ठावन्न', 'एकोणसाठ', 'साठ',
    'एकसष्ठ', 'बासष्ठ', 'त्रेसष्ठ', 'चौसष्ठ', 'पासष्ठ', 'सहासष्ठ', 'सत्त्यासष्ठ', 'अडुसष्ठ', 'एकोणसत्तर', 'सत्तर',
    'एकाहत्तर', 'बाहत्तर', 'त्र्याहत्तर', 'चौर्‍याहत्तर', 'पंच्याहत्तर', 'शहात्तर', 'सत्त्याहत्तर', 'अठ्ठ्याहत्तर', 'एकोणऐंशी', 'ऐंशी',
    'एक्क्याऐंशी', 'ब्याऐंशी', 'त्र्याऐंशी', 'चौऱ्याऐंशी', 'पंच्याऐंशी', 'शहाऐंशी', 'सत्त्याऐंशी', 'अठ्ठाऐंशी', 'एकोणनव्वद', 'नव्वद',
    'एक्क्याण्णव', 'ब्याण्णव', 'त्र्याण्णव', 'चौऱ्याण्णव', 'पंच्याण्णव', 'शहाण्णव', 'सत्त्याण्णव', 'अठ्ठाण्णव', 'नव्व्याण्णव', 'शंभर'];

  function convertLessThousand(n: number): string {
    let str = '';
    if (n >= 100) {
      const h = Math.floor(n / 100);
      str += (h === 1 ? 'एकशे ' : units[h] + 'शे ');
      n %= 100;
    }
    if (n > 0) {
      str += units[n] + ' ';
    }
    return str;
  }

  let words = '';
  const crore = Math.floor(amount / 10000000);
  amount %= 10000000;

  const lakh = Math.floor(amount / 100000);
  amount %= 100000;

  const thousand = Math.floor(amount / 1000);
  amount %= 1000;

  if (crore > 0) {
    words += convertLessThousand(crore) + 'कोटी ';
  }
  if (lakh > 0) {
    words += convertLessThousand(lakh) + 'लाख ';
  }
  if (thousand > 0) {
    words += convertLessThousand(thousand) + 'हजार ';
  }
  if (amount > 0) {
    words += convertLessThousand(amount);
  }

  return words.trim() + ' रुपये फक्त';
}

// Convert amount in numbers to words in English
export function numberToEnglishWords(amount: number): string {
  if (!amount || amount === 0) return 'Zero Rupees Only';

  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ',
    'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convert(n: number): string {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : ' ');
    if (n < 1000) return a[Math.floor(n / 100)] + 'Hundred ' + (n % 100 !== 0 ? 'and ' + convert(n % 100) : '');
    return '';
  }

  let words = '';
  const crore = Math.floor(amount / 10000000);
  amount %= 10000000;

  const lakh = Math.floor(amount / 100000);
  amount %= 100000;

  const thousand = Math.floor(amount / 1000);
  amount %= 1000;

  if (crore > 0) words += convert(crore) + 'Crore ';
  if (lakh > 0) words += convert(lakh) + 'Lakh ';
  if (thousand > 0) words += convert(thousand) + 'Thousand ';
  if (amount > 0) words += convert(amount);

  return 'Rupees ' + words.trim() + ' Only';
}
