'use client';

import { useState } from 'react';
import Image from 'next/image';
import { optimizeCloudinaryUrl, getCloudinaryBlurPlaceholder, isCloudinaryUrl } from '@/lib/cloudinary-utils';

interface CloudinaryImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  priority?: boolean;
  placeholder?: 'blur' | 'skeleton' | 'none';
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  sizes?: string;
  onLoadingComplete?: () => void;
}

/**
 * Optimizovana Image komponenta za Cloudinary slike
 * - Automatski dodaje f_auto i q_auto za optimizaciju
 * - Podržava blur placeholder
 * - Podržava skeleton loading
 */
export default function CloudinaryImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className = '',
  priority = false,
  placeholder = 'blur',
  objectFit = 'cover',
  sizes,
  onLoadingComplete,
}: CloudinaryImageProps) {
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Optimizuj URL ako je Cloudinary
  // Za fill mode, koristimo responsive approach sa boljim quality
  const optimizedSrc = isCloudinaryUrl(src)
    ? optimizeCloudinaryUrl(
        src,
        fill ? undefined : width,
        fill ? undefined : height,
        objectFit === 'cover' ? 'c_fill' : objectFit === 'contain' ? 'c_scale' : undefined,
        'auto:good' // Bolja kompresija bez vidljivog gubitka kvaliteta
      )
    : src;

  // Generiši blur placeholder ako je potrebno
  const blurDataURL =
    placeholder === 'blur' && isCloudinaryUrl(src)
      ? getCloudinaryBlurPlaceholder(src)
      : undefined;

  const handleLoadingComplete = () => {
    setLoading(false);
    onLoadingComplete?.();
  };

  const handleError = () => {
    setImageError(true);
    setLoading(false);
  };

  // Ako je greška, prikaži placeholder
  if (imageError) {
    return (
      <div
        className={`bg-gray-800 flex items-center justify-center ${className}`}
        style={fill ? {} : { width, height }}
      >
        <span className="text-gray-500 text-sm">Slika</span>
      </div>
    );
  }

  // Skeleton loading overlay
  const showSkeleton = placeholder === 'skeleton' && loading;

  return (
    <div className={`relative ${fill ? 'w-full h-full' : ''} ${className}`}>
      {/* Skeleton Loading */}
      {showSkeleton && (
        <div className="absolute inset-0 bg-gray-800 animate-pulse z-10" />
      )}

      {/* Optimizovana slika */}
      {fill ? (
        <Image
          src={optimizedSrc}
          alt={alt}
          fill
          className={`${objectFit === 'cover' ? 'object-cover' : objectFit === 'contain' ? 'object-contain' : ''} ${loading && placeholder === 'skeleton' ? 'opacity-0' : ''} transition-opacity duration-300`}
          priority={priority}
          placeholder={placeholder === 'blur' && blurDataURL ? 'blur' : 'empty'}
          blurDataURL={blurDataURL}
          sizes={sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}
          loading={priority ? undefined : 'lazy'}
          onLoadingComplete={handleLoadingComplete}
          onError={handleError}
        />
      ) : (
        <Image
          src={optimizedSrc}
          alt={alt}
          width={width}
          height={height}
          className={`${objectFit === 'cover' ? 'object-cover' : objectFit === 'contain' ? 'object-contain' : ''} ${loading && placeholder === 'skeleton' ? 'opacity-0' : ''} transition-opacity duration-300`}
          priority={priority}
          placeholder={placeholder === 'blur' && blurDataURL ? 'blur' : 'empty'}
          blurDataURL={blurDataURL}
          loading={priority ? undefined : 'lazy'}
          onLoadingComplete={handleLoadingComplete}
          onError={handleError}
        />
      )}
    </div>
  );
}

