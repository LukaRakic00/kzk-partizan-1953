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
    const missingVars = [];
    if (!cloudName) missingVars.push('CLOUDINARY_CLOUD_NAME');
    if (!apiKey) missingVars.push('CLOUDINARY_API_KEY');
    if (!apiSecret) missingVars.push('CLOUDINARY_API_SECRET');
    
    console.error('Cloudinary configuration missing:', {
      missing: missingVars,
      hasCloudName: !!cloudName,
      hasApiKey: !!apiKey,
      hasApiSecret: !!apiSecret,
      nodeEnv: process.env.NODE_ENV,
      vercel: process.env.VERCEL,
    });
    
    throw new Error(
      `Cloudinary konfiguracija nije podešena. Nedostaju: ${missingVars.join(', ')}. Proverite environment varijable.`
    );
  }

  try {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });

    cloudinaryConfigured = true;
    console.log('Cloudinary uspešno konfigurisan');
  } catch (configError: any) {
    console.error('Cloudinary config error:', configError);
    cloudinaryConfigured = false;
    throw new Error(`Greška pri konfigurisanju Cloudinary: ${configError.message}`);
  }
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
  try {
    // Ensure Cloudinary is configured before use
    ensureCloudinaryConfigured();
  } catch (configError: any) {
    console.error('Cloudinary configuration error:', configError);
    throw new Error(`Cloudinary konfiguracija neuspešna: ${configError.message}`);
  }

  let bytes: ArrayBuffer;
  try {
    bytes = await file.arrayBuffer();
  } catch (arrayBufferError: any) {
    console.error('Error reading file:', arrayBufferError);
    throw new Error(`Greška pri čitanju fajla: ${arrayBufferError.message}`);
  }

  const buffer = Buffer.from(bytes);

  return new Promise((resolve, reject) => {
    try {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `KŽK_Partizan/${folder}`,
          resource_type: 'image',
        },
        (error: any, result: any) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            console.error('Error details:', {
              http_code: error.http_code,
              message: error.message,
              name: error.name,
            });
            
            // Provide more specific error messages
            if (error.http_code === 401) {
              reject(new Error('Cloudinary autentifikacija neuspešna. Proverite API key i secret.'));
            } else if (error.http_code === 400) {
              reject(new Error(`Cloudinary greška: ${error.message || 'Neispravan zahtev'}`));
            } else if (error.http_code === 500) {
              reject(new Error(`Cloudinary server greška: ${error.message || 'Server error'}`));
            } else {
              reject(new Error(`Cloudinary upload greška: ${error.message || 'Nepoznata greška'}`));
            }
          } else if (!result) {
            reject(new Error('Cloudinary nije vratio rezultat upload-a'));
          } else if (!result.secure_url) {
            reject(new Error('Cloudinary nije vratio URL slike'));
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
      );

      uploadStream.on('error', (streamError: any) => {
        console.error('Upload stream error:', streamError);
        reject(new Error(`Greška pri upload stream-u: ${streamError.message || 'Nepoznata greška'}`));
      });

      uploadStream.end(buffer);
    } catch (uploadError: any) {
      console.error('Error creating upload stream:', uploadError);
      reject(new Error(`Greška pri kreiranju upload stream-a: ${uploadError.message || 'Nepoznata greška'}`));
    }
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

