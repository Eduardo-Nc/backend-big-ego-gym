const QRCode = require('qrcode');
const { uploadImageFromBuffer } = require('./cloudinary');

const generateAndUploadQR = async (userId) => {
  try {
    // 1. Generar buffer del QR con mayor resolución
    const qrBuffer = await QRCode.toBuffer(userId, {
      type: 'png',
      errorCorrectionLevel: 'H',
      scale: 10, // Aumenta la resolución (por defecto es 4)
      margin: 2, // Puedes ajustar el margen también
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    // 2. Subir a Cloudinary
    const imageUrl = await uploadImageFromBuffer(qrBuffer, 'user_qrcodes', userId);

    return imageUrl;
  } catch (error) {
    console.error('Error generando o subiendo el QR:', error);
    throw error;
  }
};


module.exports = {
  generateAndUploadQR,
};
