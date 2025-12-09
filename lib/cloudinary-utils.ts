/**
 * Helper funkcije za optimizaciju Cloudinary slika
 */

/**
 * Optimizuje Cloudinary URL dodavanjem f_auto i q_auto parametara
 * @param url - Originalni Cloudinary URL
 * @param width - Opciona širina (w_XXX)
 * @param height - Opciona visina (h_XXX)
 * @param crop - Opcioni crop mode (c_fill, c_scale, itd.)
 * @returns Optimizovani URL sa f_auto i q_auto
 */
export function optimizeCloudinaryUrl(
  url: string,
  width?: number,
  height?: number,
  crop?: string
): string {
  if (!url || !url.includes('cloudinary.com')) {
    return url;
  }

  // Ako URL već ima transformacije, dodaj na postojeće
  const urlParts = url.split('/upload/');
  if (urlParts.length !== 2) {
    return url;
  }

  const baseUrl = urlParts[0];
  const path = urlParts[1];

  // Kreiraj transformacije
  const transformations: string[] = [];

  if (width) {
    transformations.push(`w_${width}`);
  }
  if (height) {
    transformations.push(`h_${height}`);
  }
  if (crop) {
    transformations.push(crop);
  }

  // Dodaj optimizacije
  transformations.push('f_auto', 'q_auto', 'dpr_auto');

  const transformString = transformations.join(',');

  return `${baseUrl}/upload/${transformString}/${path}`;
}

/**
 * Generiše mali blur placeholder URL iz Cloudinary slike
 * @param url - Originalni Cloudinary URL
 * @returns URL za mali blur placeholder (20x20px)
 */
export function getCloudinaryBlurPlaceholder(url: string): string {
  if (!url || !url.includes('cloudinary.com')) {
    // Fallback na mali base64 blur ako nije Cloudinary
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjMzMzIi8+PC9zdmc+';
  }

  const urlParts = url.split('/upload/');
  if (urlParts.length !== 2) {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjMzMzIi8+PC9zdmc+';
  }

  const baseUrl = urlParts[0];
  const path = urlParts[1];

  // Generiši mali blur placeholder (20x20, blur, low quality)
  return `${baseUrl}/upload/w_20,h_20,c_fill,e_blur:1000,q_auto,f_auto/${path}`;
}

/**
 * Proverava da li je URL Cloudinary URL
 */
export function isCloudinaryUrl(url: string): boolean {
  return url?.includes('cloudinary.com') ?? false;
}

