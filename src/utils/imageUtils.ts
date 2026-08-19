// Image helper with SVG fallback placeholders for temple themes

export const FALLBACK_TEMPLE_IMG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23871C1C"/><circle cx="300" cy="200" r="120" fill="%236F1616" stroke="%23D4AF37" stroke-width="4"/><path d="M300 120 L300 280 M270 150 C270 200 300 220 300 220 C300 220 330 200 330 150 M300 120 L285 145 L315 145 Z" stroke="%23D4AF37" stroke-width="8" fill="%23D4AF37"/><circle cx="300" cy="100" r="10" fill="%23FF9800"/><text x="300" y="340" font-family="sans-serif" font-size="22" font-weight="bold" fill="%23FAF7F2" text-anchor="middle">॥ श्री दुर्गा मंडळ, कसबा पेठ ॥</text></svg>`;

export const FALLBACK_AVATAR_IMG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%23F5F1EB"/><circle cx="100" cy="75" r="40" fill="%23871C1C"/><path d="M40 180 C40 135 70 125 100 125 C130 125 160 135 160 180 Z" fill="%23871C1C"/><circle cx="100" cy="100" r="95" fill="none" stroke="%23D4AF37" stroke-width="4"/></svg>`;

export function handleImageError(e: React.SyntheticEvent<HTMLImageElement, Event>, isAvatar: boolean = false) {
  e.currentTarget.onerror = null;
  e.currentTarget.src = isAvatar ? FALLBACK_AVATAR_IMG : FALLBACK_TEMPLE_IMG;
}

/**
 * Compresses and resizes an image file client-side using HTML Canvas.
 * Reduces 5MB-15MB raw phone photos down to ~50KB-120KB so they save instantly in LocalStorage without QuotaExceededError.
 */
export function compressImageFile(
  file: File,
  maxWidth: number = 1200,
  quality: number = 0.75
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Selected file is not an image'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to decode image'));
      img.onload = () => {
        let { width, height } = img;

        if (width > maxWidth || height > maxWidth) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxWidth) / height);
            height = maxWidth;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
