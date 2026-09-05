/**
 * Text utility for Devanagari (Marathi/Hindi) transliteration to Latin script.
 * Ensures PDF receipts and system documents generated with standard fonts
 * (e.g. Helvetica) remain clean, legible, and free of broken glyphs or question marks.
 */

const VOWEL_MAP: Record<string, string> = {
  'अ': 'A', 'आ': 'Aa', 'इ': 'I', 'ई': 'Ee', 'उ': 'U', 'ऊ': 'Oo',
  'ऋ': 'Ri', 'ए': 'E', 'ऐ': 'Ai', 'ओ': 'O', 'औ': 'Au', 'अं': 'An', 'अः': 'Ah'
};

const MATRA_MAP: Record<string, string> = {
  'ा': 'a', 'ि': 'i', 'ी': 'ee', 'ु': 'u', 'ू': 'oo',
  'ृ': 'ri', 'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au',
  'ं': 'n', 'ँ': 'n', 'ः': 'h'
};

const CONSONANT_MAP: Record<string, string> = {
  'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'ng',
  'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'ny',
  'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n',
  'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
  'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm',
  'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v', 'श': 'sh', 'ष': 'sh',
  'स': 's', 'ह': 'h', 'ळ': 'l', 'क्ष': 'ksh', 'ज्ञ': 'dny', 'श्र': 'shr'
};

const COMMON_TITLES_AND_WORDS: Record<string, string> = {
  'श्री.': 'Shri.',
  'श्री': 'Shri',
  'श्रीमती': 'Shrimati',
  'सौ.': 'Sou.',
  'सौ': 'Sou',
  'कु.': 'Ku.',
  'कुमार': 'Kumar',
  'चोप': 'Chop',
  'पुणे': 'Pune',
  'गडचिरोली': 'Gadchiroli',
  'महाराष्ट्र': 'Maharashtra'
};

/**
 * Checks if a string contains any Devanagari Unicode characters (U+0900 to U+097F).
 */
export function containsDevanagari(str: string): boolean {
  return /[\u0900-\u097F]/.test(str);
}

/**
 * Transliterates Devanagari Marathi text into clean Latin/English text for PDFs.
 * If text is already Latin or ASCII, it is returned intact.
 */
export function devanagariToLatin(input: string): string {
  if (!input || !containsDevanagari(input)) {
    return input;
  }

  let text = input.trim();

  // Replace common honorifics & titles first
  for (const [dev, lat] of Object.entries(COMMON_TITLES_AND_WORDS)) {
    text = text.split(dev).join(lat);
  }

  // If no devanagari remains, return early
  if (!containsDevanagari(text)) {
    return text;
  }

  let result = '';
  const len = text.length;

  for (let i = 0; i < len; i++) {
    const char = text[i];
    const nextChar = i + 1 < len ? text[i + 1] : '';

    // 1. Devanagari numerals ०-९
    const code = char.charCodeAt(0);
    if (code >= 0x0966 && code <= 0x096F) {
      result += String(code - 0x0966);
      continue;
    }

    // 2. Full independent vowels
    if (VOWEL_MAP[char]) {
      result += VOWEL_MAP[char];
      continue;
    }

    // 3. Consonants
    if (CONSONANT_MAP[char]) {
      const latinConsonant = CONSONANT_MAP[char];

      // Check for halant (्) -> suppresses default 'a' vowel
      if (nextChar === '्') {
        result += latinConsonant;
        i++; // skip halant
      } else if (MATRA_MAP[nextChar]) {
        // Has explicit vowel sign (matra)
        result += latinConsonant + MATRA_MAP[nextChar];
        i++; // skip matra
      } else if (nextChar === ' ' || nextChar === '' || /[\s\.,\-\/]/.test(nextChar)) {
        // End of word or syllable -> minimal 'a' or suppressed
        result += (latinConsonant.length === 1 ? latinConsonant : latinConsonant + 'a');
      } else {
        // Inherent 'a' sound for continuous pronunciation
        result += latinConsonant + 'a';
      }
      continue;
    }

    // 4. Standalone matras or modifier signs
    if (MATRA_MAP[char]) {
      result += MATRA_MAP[char];
      continue;
    }

    // 5. Normal ASCII or other characters (preserve spaces, dots, dashes)
    result += char;
  }

  // Capitalize words cleanly
  return result
    .split(/\s+/)
    .map(w => w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : '')
    .join(' ');
}

/**
 * Sanitizes donor name or remark specifically for PDF document generation.
 */
export function formatNameForPDF(name: string): string {
  if (!name || !name.trim()) return 'Devotee';
  const clean = name.trim();
  if (containsDevanagari(clean)) {
    return devanagariToLatin(clean);
  }
  return clean;
}
