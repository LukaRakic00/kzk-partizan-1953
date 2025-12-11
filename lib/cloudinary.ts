import { v2 as cloudinary } from 'cloudinary';

let cloudinaryConfigured = false;

// Lazy configuration - only configure when needed
function ensureCloudinaryConfigured() {
  if (cloudinaryConfigured) {
    return;
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      'Cloudinary konfiguracija nije podešena. Proverite environment varijable CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, i CLOUDINARY_API_SECRET.'
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });

  cloudinaryConfigured = true;
}

export default cloudinary;

// Funkcija za učitavanje svih slika iz Cloudinary foldera
export const listImagesFromCloudinary = async (folder: string) => {
  try {
    ensureCloudinaryConfigured();
    const result = await cloudinary.search
      .expression(`folder:KŽK_Partizan/${folder}`)
      .max_results(500)
      .execute();

    // Sortiraj lokalno po created_at desc
    const sortedResources = result.resources.sort((a: any, b: any) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA; // desc order
    });

    return sortedResources.map((resource: any) => ({
      publicId: resource.public_id,
      url: resource.secure_url,
      width: resource.width,
      height: resource.height,
      format: resource.format,
      folder: folder,
      createdAt: resource.created_at,
    }));
  } catch (error) {
    console.error('Error listing images from Cloudinary:', error);
    throw error;
  }
};

export const uploadImage = async (
  file: File,
  folder: string
): Promise<{
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
}> => {
  // Ensure Cloudinary is configured before use
  ensureCloudinaryConfigured();

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: `KŽK_Partizan/${folder}`,
          resource_type: 'image',
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            // Provide more specific error messages
            if (error.http_code === 401) {
              reject(new Error('Cloudinary autentifikacija neuspešna. Proverite API key i secret.'));
            } else if (error.http_code === 400) {
              reject(new Error(`Cloudinary greška: ${error.message || 'Neispravan zahtev'}`));
            } else {
              reject(new Error(`Cloudinary upload greška: ${error.message || 'Nepoznata greška'}`));
            }
          } else if (!result) {
            reject(new Error('Cloudinary nije vratio rezultat upload-a'));
          } else {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              width: result.width || 0,
              height: result.height || 0,
              format: result.format || 'unknown',
            });
          }
        }
      )
      .end(buffer);
  });
};

// Funkcija za brisanje slike sa Cloudinary
export const deleteImageFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    ensureCloudinaryConfigured();
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw error;
  }
};

