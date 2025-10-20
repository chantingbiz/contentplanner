/**
 * Image Processing Utilities
 * 
 * Client-side image compression and processing for thumbnails
 * Optimized for localStorage storage with 9:16 vertical format
 */

interface ImageDataURLResult {
  dataUrl: string;
  bytes: number;
  width: number;
  height: number;
}

interface ImageOptions {
  maxW?: number;
  maxH?: number;
  quality?: number;
  mime?: string;
}

/**
 * Read a File and return an HTMLImageElement
 */
export async function fileToImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Downscale and compress image to data URL
 * Optimized for 9:16 vertical format
 * 
 * @param img - Source HTMLImageElement
 * @param opts - Compression options
 * @returns Data URL with metadata
 */
export async function imageToDataURL(
  img: HTMLImageElement,
  opts: ImageOptions = {}
): Promise<ImageDataURLResult> {
  const {
    maxW = 1080,
    maxH = 1920,
    quality = 0.72,
    mime = 'image/webp',
  } = opts;

  // Calculate dimensions maintaining aspect ratio
  let width = img.width;
  let height = img.height;

  if (width > maxW || height > maxH) {
    const ratio = Math.min(maxW / width, maxH / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  // Create canvas and draw scaled image
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Use high-quality scaling
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);

  // Try WebP first, fallback to JPEG if not supported
  let dataUrl: string;

  try {
    dataUrl = canvas.toDataURL(mime, quality);
    
    // Check if WebP is actually supported (some browsers return empty or PNG)
    if (mime === 'image/webp' && !dataUrl.startsWith('data:image/webp')) {
      // Fallback to JPEG
      dataUrl = canvas.toDataURL('image/jpeg', quality);
    }
  } catch {
    // Fallback to JPEG if WebP fails
    dataUrl = canvas.toDataURL('image/jpeg', quality);
  }

  // Calculate byte size (rough estimate)
  const bytes = Math.round((dataUrl.length * 3) / 4);

  return {
    dataUrl,
    bytes,
    width,
    height,
  };
}

/**
 * Estimate localStorage usage
 * Assumes 5MB limit (conservative; actual varies by browser)
 */
export function estimateLocalStorageUsage(): {
  used: number;
  limit: number;
  percent: number;
} {
  const limit = 5 * 1024 * 1024; // 5MB conservative estimate
  let used = 0;

  try {
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        const value = localStorage.getItem(key);
        if (value) {
          // Each character is ~2 bytes in UTF-16
          used += key.length * 2 + value.length * 2;
        }
      }
    }
  } catch (error) {
    console.warn('Failed to estimate localStorage usage:', error);
  }

  const percent = Math.round((used / limit) * 100);

  return { used, limit, percent };
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Check if file is an image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * Read image from clipboard
 */
export async function getImageFromClipboard(
  event: ClipboardEvent
): Promise<File | null> {
  const items = event.clipboardData?.items;
  if (!items) return null;

  for (const item of Array.from(items)) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile();
      return file;
    }
  }

  return null;
}

