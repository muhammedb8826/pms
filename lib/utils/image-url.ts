/**
 * Utility function to resolve image URLs consistently across the application
 * 
 * Handles:
 * - Absolute URLs (http/https) - returns as-is
 * - Relative paths starting with /uploads/ - normalizes to full URL using API origin
 * - Data URLs - returns as-is
 * 
 * @param imagePath - The image path from the API (e.g., "/uploads/products/...")
 * @returns The resolved URL that can be used with next/image
 */
export function resolveImageUrl(imagePath: string | null | undefined): string | null {
  if (!imagePath) return null;
  
  // Data URLs are fine as-is
  if (imagePath.startsWith('data:')) return imagePath;
  
  // Absolute URLs are fine as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Normalize relative /uploads paths to API origin
  let path = imagePath;
  if (!path.startsWith('/')) {
    path = `/${path}`;
  }
  
  if (path.startsWith('/uploads/')) {
    const base = process.env.NEXT_PUBLIC_API_URL;
    if (base) {
      try {
        const url = new URL(base);
        // Use only the origin (protocol + hostname + port) to avoid adding /api
        // The path already starts with /uploads/, so we just need the origin
        return `${url.origin}${path}`;
      } catch {
        // fall through to return path
      }
    }
    
    // Fallback to window origin if API URL is not set
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${path}`;
    }
  }
  
  return path;
}

