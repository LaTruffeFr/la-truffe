const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/**
 * Returns a proxied image URL that bypasses hotlink protection (e.g. LeBonCoin).
 * Falls back to a brand-specific placeholder if no image URL is provided.
 */
export function getProxiedImageUrl(imageUrl: string | undefined | null, brand?: string): string {
  if (!imageUrl || imageUrl === '/placeholder.svg') {
    return getBrandPlaceholder(brand);
  }

  // Only proxy external URLs that need it (LeBonCoin, etc.)
  if (imageUrl.includes('leboncoin.fr') || imageUrl.includes('lbc')) {
    return `${SUPABASE_URL}/functions/v1/proxy-image?apikey=${SUPABASE_KEY}&url=${encodeURIComponent(imageUrl)}`;
  }

  return imageUrl;
}

export function getBrandPlaceholder(brand?: string): string {
  const b = (brand || 'car').toLowerCase();
  return `https://placehold.co/800x600/1e293b/f8fafc?text=${encodeURIComponent(b.toUpperCase())}`;
}
