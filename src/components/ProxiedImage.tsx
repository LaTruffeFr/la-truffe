import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface ProxiedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string | undefined | null;
  brand?: string;
  fallbackSrc?: string;
}

function getBrandPlaceholder(brand?: string): string {
  const b = (brand || 'car').toLowerCase();
  return `https://placehold.co/800x600/1e293b/f8fafc?text=${encodeURIComponent(b.toUpperCase())}`;
}

function needsProxy(url: string): boolean {
  return url.includes('leboncoin.fr') || url.includes('lbc');
}

// Cache for blob URLs to avoid re-fetching
const blobCache = new Map<string, string>();

export function ProxiedImage({ src, brand, fallbackSrc, alt, ...props }: ProxiedImageProps) {
  const placeholder = fallbackSrc || getBrandPlaceholder(brand);
  const [imageSrc, setImageSrc] = useState<string>(() => {
    if (!src) return placeholder;
    if (!needsProxy(src)) return src;
    // Check cache
    const cached = blobCache.get(src);
    if (cached) return cached;
    return placeholder; // Show placeholder while loading
  });

  useEffect(() => {
    if (!src || !needsProxy(src)) return;
    
    const cached = blobCache.get(src);
    if (cached) {
      setImageSrc(cached);
      return;
    }

    let cancelled = false;

    const fetchImage = async () => {
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/proxy-image?url=${encodeURIComponent(src)}`, {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        });
        
        if (!res.ok) throw new Error('Failed');
        
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        blobCache.set(src, blobUrl);
        
        if (!cancelled) {
          setImageSrc(blobUrl);
        }
      } catch {
        if (!cancelled) {
          setImageSrc(placeholder);
        }
      }
    };

    fetchImage();

    return () => { cancelled = true; };
  }, [src, placeholder]);

  return (
    <img
      src={imageSrc}
      alt={alt}
      onError={(e) => { (e.target as HTMLImageElement).src = placeholder; }}
      {...props}
    />
  );
}

export { getBrandPlaceholder };
