const { v2: cloudinary } = require('cloudinary');
const fs = require('fs');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Sube una imagen a Cloudinary desde un archivo local
 * @param {string} tempFilePath - Ruta temporal del archivo (ej. req.file.path)
 * @param {string} folder - Carpeta de Cloudinary (opcional)
 * @param {string} publicId - Nombre del archivo sin extensión (opcional)
 * @returns {Promise<string>} URL de la imagen subida
 */
const saveFileToCloudinary = async (tempFilePath, folder = 'user_photos', publicId = '') => {
  try {
    const uploadOptions = {
      folder,
      resource_type: 'image',
    };

    if (publicId) uploadOptions.public_id = publicId;

    const result = await cloudinary.uploader.upload(tempFilePath, uploadOptions);

    // Eliminar el archivo local temporal después de subir
    fs.unlinkSync(tempFilePath);

    return result.secure_url;
  } catch (error) {
    console.error('Error subiendo imagen a Cloudinary:', error);
    throw error;
  }
};

module.exports = {
  saveFileToCloudinary,
};
