import { v2 as cloudinary } from 'cloudinary';

let cloudinaryConfigured = false;

// Lazy configuration - only configure when needed
function ensureCloudinaryConfigured() {
  if (cloudinaryConfigured) {
    return;
  }

  // Pročitaj environment varijable - probaj različite načine
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 
                    (typeof window === 'undefined' ? process.env.CLOUDINARY_CLOUD_NAME : undefined);
  const apiKey = process.env.CLOUDINARY_API_KEY || 
                 (typeof window === 'undefined' ? process.env.CLOUDINARY_API_KEY : undefined);
  const apiSecret = process.env.CLOUDINARY_API_SECRET || 
                    (typeof window === 'undefined' ? process.env.CLOUDINARY_API_SECRET : undefined);

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
    // Proveri da li su vrednosti prazne stringove
    if (cloudName.trim() === '' || apiKey.trim() === '' || apiSecret.trim() === '') {
      throw new Error('Cloudinary environment varijable ne mogu biti prazne stringove');
    }
    
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true, // Uvek koristi HTTPS
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

// Direktan HTTP upload koristeći Cloudinary REST API
async function uploadImageDirectHTTP(
  file: File,
  folder: string,
  cloudName: string,
  apiKey: string,
  apiSecret: string
): Promise<{
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
}> {
  console.log('[CLOUDINARY-HTTP] Starting direct HTTP upload...');
  
  // Konvertuj file u buffer
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
  // Generiši timestamp i signature
  const timestamp = Math.round(new Date().getTime() / 1000);
  const uploadParams: Record<string, string> = {
    folder: `KŽK_Partizan/${folder}`,
    timestamp: timestamp.toString(),
  };
  
  // Sortiraj parametre za signature
  const sortedParams = Object.keys(uploadParams)
    .sort()
    .map(key => `${key}=${uploadParams[key]}`)
    .join('&');
  
  // Generiši signature
  const crypto = await import('crypto');
  const signature = crypto
    .createHash('sha1')
    .update(sortedParams + apiSecret)
    .digest('hex');
  
  // Koristi base64 string direktno (Cloudinary prihvata data URI)
  const base64String = buffer.toString('base64');
  const dataUri = `data:${file.type};base64,${base64String}`;
  
  // Kreiraj FormData (Next.js ima globalni FormData)
  const formData = new FormData();
  formData.append('file', dataUri);
  formData.append('folder', uploadParams.folder);
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp.toString());
  formData.append('signature', signature);
  
  // Pošalji HTTP zahtev
  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  console.log('[CLOUDINARY-HTTP] Uploading to:', uploadUrl);
  
  const response = await fetch(uploadUrl, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('[CLOUDINARY-HTTP] Upload failed:', {
      status: response.status,
      statusText: response.statusText,
      errorText: errorText.substring(0, 500),
    });
    
    // Pokušaj da parsiraj JSON error ako postoji
    try {
      const errorJson = JSON.parse(errorText);
      throw new Error(`Cloudinary upload failed: ${errorJson.error?.message || errorText}`);
    } catch {
      throw new Error(`Cloudinary upload failed (${response.status}): ${errorText.substring(0, 200)}`);
    }
  }
  
  const result = await response.json();
  console.log('[CLOUDINARY-HTTP] Upload successful:', {
    publicId: result.public_id,
    url: result.secure_url,
  });
  
  return {
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width || 0,
    height: result.height || 0,
    format: result.format || 'unknown',
  };
}

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

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
  const apiKey = process.env.CLOUDINARY_API_KEY!;
  const apiSecret = process.env.CLOUDINARY_API_SECRET!;

  // U serverless okruženju (Vercel), koristi direktan HTTP upload umesto SDK-a
  // SDK ima problema sa HTML odgovorima umesto JSON-a
  const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;
  
  if (isVercel) {
    console.log('[CLOUDINARY] Using direct HTTP upload (Vercel serverless)');
    try {
      return await uploadImageDirectHTTP(file, folder, cloudName, apiKey, apiSecret);
    } catch (httpError: any) {
      console.error('[CLOUDINARY] Direct HTTP upload failed, trying SDK fallback:', httpError.message);
      // Fallback na SDK ako HTTP ne radi
    }
  }

  let bytes: ArrayBuffer;
  try {
    bytes = await file.arrayBuffer();
  } catch (arrayBufferError: any) {
    console.error('Error reading file:', arrayBufferError);
    throw new Error(`Greška pri čitanju fajla: ${arrayBufferError.message}`);
  }

  const buffer = Buffer.from(bytes);
  
  // Timeout za upload (60 sekundi)
  const uploadTimeout = 60000;
  let timeoutId: NodeJS.Timeout | null = null;

  return new Promise((resolve, reject) => {
    let isResolved = false;
    
    // Timeout handler
    timeoutId = setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        reject(new Error('Upload timeout - Cloudinary nije odgovorio u roku od 60 sekundi'));
      }
    }, uploadTimeout);
    
    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };
    
    try {
      console.log('[CLOUDINARY] Starting upload stream...', {
        folder: `KŽK_Partizan/${folder}`,
        cloudName: cloudinary.config().cloud_name,
        hasApiKey: !!cloudinary.config().api_key,
        hasApiSecret: !!cloudinary.config().api_secret,
      });
      
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `KŽK_Partizan/${folder}`,
          resource_type: 'image',
          // Dodaj dodatne opcije za bolju kompatibilnost
          use_filename: false,
          unique_filename: true,
          overwrite: false,
        },
        (error: any, result: any) => {
          console.log('[CLOUDINARY] Upload callback invoked', {
            hasError: !!error,
            hasResult: !!result,
            errorType: error?.name,
            errorHttpCode: error?.http_code,
          });
          if (isResolved) return;
          
          cleanup();
          
          if (error) {
            console.error('Cloudinary upload error:', error);
            console.error('Error details:', {
              http_code: error.http_code,
              message: error.message,
              name: error.name,
              error: error.error,
              statusCode: error.statusCode,
              status: error.status,
            });
            
            // Extract error message - Cloudinary može vratiti različite formate greške
            let errorMessage = 'Nepoznata greška pri upload-u';
            
            // Proveri različite načine na koje Cloudinary može vratiti grešku
            if (error.message) {
              errorMessage = error.message;
              // Ako poruka sadrži "invalid JSON" ili "DOCTYPE", to znači da je dobio HTML
              if (errorMessage.includes('invalid JSON') || errorMessage.includes('DOCTYPE')) {
                errorMessage = 'Cloudinary server je vratio HTML umesto JSON-a. Proverite Cloudinary konfiguraciju i environment varijable.';
              }
            } else if (error.error) {
              if (typeof error.error === 'string') {
                errorMessage = error.error;
              } else if (error.error.message) {
                errorMessage = error.error.message;
              } else if (typeof error.error === 'object') {
                errorMessage = JSON.stringify(error.error);
              }
            }
            
            // Get HTTP code from different possible locations
            const httpCode = error.http_code || error.statusCode || error.status;
            
            // Provide more specific error messages based on HTTP code
            if (httpCode === 401) {
              errorMessage = 'Cloudinary autentifikacija neuspešna. Proverite API key i secret u environment varijablama.';
            } else if (httpCode === 400) {
              errorMessage = `Cloudinary greška (400): ${errorMessage}`;
            } else if (httpCode === 403) {
              errorMessage = 'Cloudinary pristup odbijen. Proverite dozvole i API key.';
            } else if (httpCode === 404) {
              errorMessage = 'Cloudinary resurs nije pronađen.';
            } else if (httpCode === 500 || httpCode === 502 || httpCode === 503) {
              // Za 500 greške, možda je problem sa konfiguracijom
              if (errorMessage.includes('invalid JSON') || errorMessage.includes('DOCTYPE')) {
                errorMessage = 'Cloudinary server greška - proverite da li su environment varijable (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) pravilno podešene u produkciji.';
              } else {
                errorMessage = `Cloudinary server greška (${httpCode}): ${errorMessage}`;
              }
            } else if (httpCode) {
              errorMessage = `Cloudinary greška (${httpCode}): ${errorMessage}`;
            } else {
              // Ako nema HTTP code ali ima poruku o JSON grešci
              if (errorMessage.includes('invalid JSON') || errorMessage.includes('DOCTYPE')) {
                errorMessage = 'Cloudinary server greška - proverite environment varijable i Cloudinary konfiguraciju.';
              }
            }
            
            isResolved = true;
            reject(new Error(errorMessage));
          } else if (!result) {
            isResolved = true;
            reject(new Error('Cloudinary nije vratio rezultat upload-a'));
          } else if (!result.secure_url) {
            isResolved = true;
            reject(new Error('Cloudinary nije vratio URL slike'));
          } else {
            isResolved = true;
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
        if (isResolved) return;
        
        cleanup();
        console.error('[CLOUDINARY] Upload stream error event:', streamError);
        console.error('[CLOUDINARY] Stream error details:', {
          message: streamError?.message,
          error: streamError?.error,
          code: streamError?.code,
          statusCode: streamError?.statusCode,
          errno: streamError?.errno,
          syscall: streamError?.syscall,
          hostname: streamError?.hostname,
          type: streamError?.type,
        });
        
        let streamErrorMessage = 'Nepoznata greška pri upload stream-u';
        if (streamError?.message) {
          streamErrorMessage = streamError.message;
          // Proveri da li je HTML error
          if (streamErrorMessage.includes('invalid JSON') || streamErrorMessage.includes('DOCTYPE')) {
            streamErrorMessage = 'Cloudinary server je vratio HTML umesto JSON-a. Proverite Cloudinary konfiguraciju.';
          }
        } else if (streamError?.error?.message) {
          streamErrorMessage = streamError.error.message;
        } else if (streamError?.error && typeof streamError.error === 'string') {
          streamErrorMessage = streamError.error;
        }
        
        // Ako je network error, dodaj dodatne informacije
        if (streamError?.code === 'ECONNREFUSED' || streamError?.code === 'ENOTFOUND') {
          streamErrorMessage = `Cloudinary network greška (${streamError.code}). Proverite internet konekciju i Cloudinary dostupnost.`;
        } else if (streamError?.code === 'ETIMEDOUT') {
          streamErrorMessage = 'Cloudinary upload timeout. Pokušajte ponovo sa manjom slikom.';
        }
        
        isResolved = true;
        reject(new Error(`Greška pri upload stream-u: ${streamErrorMessage}`));
      });
      
      uploadStream.on('end', () => {
        console.log('[CLOUDINARY] Upload stream ended');
      });
      
      uploadStream.on('close', () => {
        console.log('[CLOUDINARY] Upload stream closed');
      });
      
      uploadStream.on('finish', () => {
        console.log('[CLOUDINARY] Upload stream finished');
      });

      console.log('[CLOUDINARY] Writing buffer to stream...', {
        bufferLength: buffer.length,
        bufferType: buffer.constructor.name,
        isValidBuffer: Buffer.isBuffer(buffer),
      });
      
      try {
        // Cloudinary SDK očekuje buffer u end() metodi
        uploadStream.end(buffer);
        console.log('[CLOUDINARY] Buffer sent to stream');
      } catch (writeError: any) {
        cleanup();
        if (isResolved) return;
        console.error('[CLOUDINARY] Error writing to stream:', writeError);
        isResolved = true;
        reject(new Error(`Greška pri slanju podataka: ${writeError.message || 'Nepoznata greška'}`));
      }
    } catch (uploadError: any) {
      cleanup();
      if (isResolved) return;
      
      console.error('Error creating upload stream:', uploadError);
      isResolved = true;
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

