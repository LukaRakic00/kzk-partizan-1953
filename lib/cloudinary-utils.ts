/**
 * Helper funkcije za optimizaciju Cloudinary slika
 */

/**
 * Optimizuje Cloudinary URL dodavanjem f_auto i q_auto parametara
 * @param url - Originalni Cloudinary URL
 * @param width - Opciona širina (w_XXX)
 * @param height - Opciona visina (h_XXX)
 * @param crop - Opcioni crop mode (c_fill, c_scale, itd.)
 * @param quality - Quality parametar (default: 'auto:good' za bolju kompresiju bez vidljivog gubitka)
 * @returns Optimizovani URL sa f_auto i q_auto
 */
export function optimizeCloudinaryUrl(
  url: string,
  width?: number,
  height?: number,
  crop?: string,
  quality: string = 'auto:good'
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

  // Proveri da li već postoje transformacije u URL-u
  const existingTransformMatch = path.match(/^([^\/]+)\/(.+)$/);
  let existingTransforms = '';
  let cleanPath = path;

  if (existingTransformMatch) {
    existingTransforms = existingTransformMatch[1];
    cleanPath = existingTransformMatch[2];
  }

  // Kreiraj nove transformacije
  const transformations: string[] = [];

  // Dodaj postojeće transformacije ako postoje
  if (existingTransforms && !existingTransforms.includes('w_') && !existingTransforms.includes('h_')) {
    transformations.push(existingTransforms);
  }

  // Dodaj dimenzije
  if (width) {
    transformations.push(`w_${width}`);
  }
  if (height) {
    transformations.push(`h_${height}`);
  }
  if (crop) {
    transformations.push(crop);
  }

  // Dodaj optimizacije - koristi auto:good za bolju kompresiju
  transformations.push('f_auto', `q_${quality}`, 'dpr_auto', 'fl_progressive');

  const transformString = transformations.join(',');

  return `${baseUrl}/upload/${transformString}/${cleanPath}`;
}

/**
 * Generiše responsive transformacije za fill mode slike
 * Koristi responsive breakpoints za optimalno učitavanje
 */
export function getResponsiveCloudinaryUrl(
  url: string,
  sizes?: string
): string {
  if (!url || !url.includes('cloudinary.com')) {
    return url;
  }

  // Za fill mode bez eksplicitnih dimenzija, koristimo responsive approach
  // Cloudinary će automatski optimizovati na osnovu device pixel ratio
  return optimizeCloudinaryUrl(url, undefined, undefined, undefined, 'auto:good');
}

/**
 * Generiše mali blur placeholder URL iz Cloudinary slike
 * @param url - Originalni Cloudinary URL
 * @returns URL za mali blur placeholder (10x10px za brže učitavanje)
 */
export function getCloudinaryBlurPlaceholder(url: string): string {
  if (!url || !url.includes('cloudinary.com')) {
    // Fallback na mali base64 blur ako nije Cloudinary
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMzMzIi8+PC9zdmc+';
  }

  const urlParts = url.split('/upload/');
  if (urlParts.length !== 2) {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMzMzIi8+PC9zdmc+';
  }

  const baseUrl = urlParts[0];
  const path = urlParts[1];

  // Ekstraktuj clean path ako ima postojeće transformacije
  const existingTransformMatch = path.match(/^([^\/]+)\/(.+)$/);
  const cleanPath = existingTransformMatch ? existingTransformMatch[2] : path;

  // Generiši mali blur placeholder (10x10, blur, najmanji quality za brže učitavanje)
  return `${baseUrl}/upload/w_10,h_10,c_fill,e_blur:1000,q_auto:lowest,f_auto/${cleanPath}`;
}

/**
 * Proverava da li je URL Cloudinary URL
 */
export function isCloudinaryUrl(url: string): boolean {
  return url?.includes('cloudinary.com') ?? false;
}

