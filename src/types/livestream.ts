export interface LiveStreamConfig {
  id: string;
  isLive: boolean;
  title: string;
  youtubeUrl: string;
  description?: string;
  pranamCount: number;
  updatedAt?: string;
}

export const DEFAULT_LIVESTREAM_CONFIG: LiveStreamConfig = {
  id: 'current',
  isLive: false,
  title: 'सार्वजनिक बाल दुर्गा उत्सव मंडळ - थेट प्रक्षेपण (Live Stream)',
  youtubeUrl: '',
  description: 'मंडळाची दैनिक संध्या आरती व सांस्कृतिक कार्यक्रम थेट पहा.',
  pranamCount: 108,
  updatedAt: new Date().toISOString()
};

/**
 * Extract YouTube Video ID from any URL format or direct ID:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://www.youtube.com/watch?v=VIDEO_ID&t=10s
 * - https://youtu.be/VIDEO_ID?si=123
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/live/VIDEO_ID
 * - VIDEO_ID (11 characters)
 */
export function extractYouTubeId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // If direct 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // 1. Try URL search params (?v=VIDEO_ID)
  try {
    const fullUrl = trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed
      : `https://${trimmed}`;
    const parsed = new URL(fullUrl);

    if (parsed.searchParams.has('v')) {
      const v = parsed.searchParams.get('v');
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) {
        return v;
      }
    }

    // 2. Check path segments (e.g. /live/VIDEO_ID, /embed/VIDEO_ID, /v/VIDEO_ID, /youtu.be/VIDEO_ID)
    const segments = parsed.pathname.split('/').filter(Boolean);
    for (const seg of segments) {
      const cleanSeg = seg.replace(/[^a-zA-Z0-9_-]/g, '');
      if (/^[a-zA-Z0-9_-]{11}$/.test(cleanSeg)) {
        return cleanSeg;
      }
    }
  } catch {
    // Ignore URL parse error and fall back to regex
  }

  // 3. Robust Regex fallback
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|live)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = trimmed.match(regExp);

  return match ? match[1] : null;
}
