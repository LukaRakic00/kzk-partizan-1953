import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

// Funkcija za učitavanje svih slika iz Cloudinary foldera
export const listImagesFromCloudinary = async (folder: string) => {
  try {
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
            reject(error);
          } else {
            resolve({
              url: result!.secure_url,
              publicId: result!.public_id,
              width: result!.width,
              height: result!.height,
              format: result!.format,
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
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw error;
  }
};

