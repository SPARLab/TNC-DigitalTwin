import React from 'react';

interface ThumbnailImageProps {
  src: string | null | undefined;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fallbackLabel?: string;
  rounded?: boolean;
}

const ThumbnailImage: React.FC<ThumbnailImageProps> = ({
  src,
  alt,
  width = 48,
  height = 48,
  className = '',
  fallbackLabel = 'No photo',
  rounded = true
}) => {
  const borderRadius = rounded ? '0.5rem' : '0px';

  if (!src) {
    return (
      <div
        id="thumbnail-image-fallback"
        className={`bg-gray-200 flex items-center justify-center text-gray-400 text-xs ${className}`}
        style={{ width, height, borderRadius }}
      >
        {fallbackLabel}
      </div>
    );
  }

  return (
    <img
      id="thumbnail-image"
      src={src}
      alt={alt}
      loading="lazy"
      className={`object-cover ${className}`}
      style={{ width, height, borderRadius }}
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.style.display = 'none';
        const sibling = target.nextElementSibling as HTMLElement | null;
        if (sibling) sibling.style.display = 'flex';
      }}
    />
  );
};

export default ThumbnailImage;


