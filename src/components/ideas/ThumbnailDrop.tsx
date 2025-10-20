import { useRef, useState, type DragEvent, type ClipboardEvent } from 'react';
import {
  fileToImage,
  imageToDataURL,
  estimateLocalStorageUsage,
  formatBytes,
  isImageFile,
  getImageFromClipboard,
} from '../../utils/image';

interface ThumbnailDropProps {
  thumbnail?: string;
  onUpdate: (dataUrl: string) => void;
  onRemove: () => void;
}

/**
 * ThumbnailDrop - Drag & drop / paste image uploader for thumbnails
 * 
 * - Supports drag-and-drop of image files
 * - Supports paste from clipboard
 * - Compresses to data URL for localStorage
 * - Shows preview with Replace/Remove buttons
 * - Displays file size and dimensions
 * - Compact 9:16 portrait format
 */
export default function ThumbnailDrop({ thumbnail, onUpdate, onRemove }: ThumbnailDropProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageInfo, setImageInfo] = useState<{ bytes: number; width: number; height: number } | null>(null);

  const processImageFile = async (file: File) => {
    if (!isImageFile(file)) {
      alert('Please drop an image file (JPEG, PNG, WebP, etc.)');
      return;
    }

    setIsProcessing(true);

    try {
      // Check storage before processing
      const storage = estimateLocalStorageUsage();
      if (storage.percent > 85) {
        const proceed = confirm(
          `Storage is ${storage.percent}% full. Adding this image may exceed limits. Continue?`
        );
        if (!proceed) {
          setIsProcessing(false);
          return;
        }
      }

      // Load image
      const img = await fileToImage(file);

      // Compress with default settings (1080×1920, quality 0.72)
      let result = await imageToDataURL(img, {
        maxW: 1080,
        maxH: 1920,
        quality: 0.72,
      });

      // If result is > 500KB, try lower quality
      if (result.bytes > 500 * 1024) {
        console.warn('Image > 500KB, re-compressing with quality 0.6');
        result = await imageToDataURL(img, {
          maxW: 1080,
          maxH: 1920,
          quality: 0.6,
        });

        if (result.bytes > 500 * 1024) {
          const proceed = confirm(
            `Image is ${formatBytes(result.bytes)} (large for localStorage). Continue anyway?`
          );
          if (!proceed) {
            setIsProcessing(false);
            return;
          }
        }
      }

      // Update thumbnail
      onUpdate(result.dataUrl);
      setImageInfo({ bytes: result.bytes, width: result.width, height: result.height });
    } catch (error) {
      console.error('Failed to process image:', error);
      alert('Failed to process image. Please try a different file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handlePaste = async (e: ClipboardEvent<HTMLDivElement>) => {
    const file = await getImageFromClipboard(e.nativeEvent);
    if (file) {
      e.preventDefault();
      processImageFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    if (confirm('Remove thumbnail?')) {
      onRemove();
      setImageInfo(null);
    }
  };

  return (
    <div className="w-full">
      {/* Preview or Drop Zone */}
      {thumbnail ? (
        <div className="relative rounded-2xl border border-gray-700/70 bg-gray-900/60 w-full max-w-[300px] sm:max-w-[340px] aspect-[9/16] overflow-hidden group">
          {/* Thumbnail Preview */}
          <img
            src={thumbnail}
            alt="Thumbnail preview"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />

          {/* Hover Overlay with Actions */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="flex gap-3">
              <button
                onClick={openFilePicker}
                className="px-4 py-2 text-sm text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors backdrop-blur-sm"
              >
                Replace
              </button>
              <button
                onClick={handleRemove}
                className="px-4 py-2 text-sm text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg transition-colors backdrop-blur-sm"
              >
                Remove
              </button>
            </div>
          </div>

          {/* Image Info - Bottom Corner */}
          {imageInfo && (
            <div className="absolute bottom-2 left-2 text-[10px] text-white/70 bg-black/60 backdrop-blur-sm px-2 py-1 rounded">
              {imageInfo.width}×{imageInfo.height} • {formatBytes(imageInfo.bytes)}
            </div>
          )}
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onPaste={handlePaste}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openFilePicker();
            }
          }}
          className={`relative rounded-2xl border-2 border-dashed w-full max-w-[300px] sm:max-w-[340px] aspect-[9/16] overflow-hidden transition-all cursor-pointer ${
            isDragging
              ? 'border-brand bg-brand/10 ring-2 ring-brand/50'
              : 'border-gray-700/70 hover:border-brand/50 hover:bg-white/5'
          } ${isProcessing ? 'opacity-50 cursor-wait' : ''}`}
          onClick={openFilePicker}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-3 px-4">
              <svg
                className="w-16 h-16 mx-auto text-white/30"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <div className="text-sm text-white/70">
                {isProcessing ? (
                  'Processing image...'
                ) : (
                  <>
                    <div className="font-medium">Drop image or paste (Ctrl/Cmd+V)</div>
                    <div className="text-xs text-white/50 mt-1">
                      Portrait format • 9:16 aspect ratio
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
