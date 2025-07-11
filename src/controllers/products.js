const { response } = require('express');
const Product = require('../models/products');
const Subscription = require("../models/subscription");
const { saveFileToCloudinary } = require('../helpers/saveFiles');

const getProducts = async (req, res = response) => {
  try {
    const resProduct = await Product.find({
      status: true
    }).sort({ createdAt: -1 });

    if (!resProduct) {
      return res.status(404).json({
        ok: false,
        msg: 'Productos no encontrados'
      })
    } else {
      return res.status(200).json(resProduct);
    }

  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      msg: 'Un error fue detectado, por favor habla con el administrador'
    })
  }
}

const createProduct = async (req, res = response) => {
  try {
    const {
      category,
      price,
      stock,
      description,
      name,
      creationDate
    } = req.body;

    // Verificar si ya existe
    const productExistente = await Product.findOne({ status: true, name: name });
    if (productExistente) {
      return res.status(409).json({
        ok: false,
        msg: 'El producto ya se encuentra registrado'
      });
    }

    // Crear producto base
    const nuevoProduct = new Product({
      category,
      price: parseFloat(price),
      stock: parseFloat(stock),
      description,
      name,
      creationDate,
      status: true,
    });

    const productoGuardado = await nuevoProduct.save();

    // Subir foto si se envió
    if (req.files && req.files.image_url) {
      const file = req.files.image_url;
      const imageUrl = await saveFileToCloudinary(file.tempFilePath, 'products_photos', productoGuardado._id.toString());
      productoGuardado.image_url = imageUrl;
    } else {
      productoGuardado.image_url = "https://res.cloudinary.com/ddkofntrk/image/upload/v1750991205/Proyecto_nuevo_tbkyvt.png";
    }

    // Guardar cambios
    await productoGuardado.save();

    return res.status(201).json({
      ok: true,
      msg: 'Producto creado correctamente',
    });

  } catch (error) {
    console.error('Error al crear producto:', error);
    return res.status(500).json({
      ok: false,
      msg: 'Error del servidor. Por favor, contacta al administrador.'
    });
  }
};

const updateProduct = async (req, res = response) => {
  const { id } = req.params;
  const {
    category,
    price,
    stock,
    description,
    name
  } = req.body;

  try {
    // Clonamos el body y eliminamos el campo image_url si viene como objeto
    const dataToUpdate = { ...req.body };
    if (dataToUpdate.image_url && typeof dataToUpdate.image_url === 'object') {
      delete dataToUpdate.image_url;
    }

    // Traer producto actual antes de actualizar
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res.status(404).json({
        ok: false,
        msg: 'Producto no encontrado',
      });
    }

    const previousStock = existingProduct.stock ?? 0;
    const newStock = parseFloat(stock);

    // Actualizar datos normales
    let resProduct = await Product.findByIdAndUpdate(id, {
      category,
      price: parseFloat(price),
      stock: newStock,
      description,
      name,
    }, {
      new: true,
      runValidators: true,
    });

    // Si el stock cambió, registrar StockLog
    if (newStock !== previousStock) {
      const StockLog = require('../models/StockLog'); // Asegúrate de importar bien tu modelo

      await StockLog.create({
        product: resProduct._id,
        quantityChange: newStock - previousStock, // Diferencia
        reason: 'manual_adjustment',
        description: `Ajuste manual de stock de ${previousStock} a ${newStock}`
      });
    }

    // Procesar imagen si viene
    if (req.files && req.files.image_url) {
      const file = req.files.image_url;
      const imageUrl = await saveFileToCloudinary(
        file.tempFilePath,
        'products_photos',
        resProduct._id.toString()
      );

      resProduct.image_url = imageUrl;
      await resProduct.save(); // Guardamos con la nueva URL de imagen
    }

    return res.status(200).json({
      ok: true,
      msg: 'Producto actualizado correctamente',
      user: resProduct,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      ok: false,
      msg: 'Error del servidor, habla con el administrador',
    });
  }
};



const deleteProduct = async (req, res = response) => {

  const { id } = req.params;

  try {

    const resProduct = await Product.findByIdAndUpdate(
      id,
      { status: false },
      {
        new: true,
      }
    );


    if (!resProduct) {
      return res.status(404).json({
        ok: false,
        msg: 'Producto no encontrado'
      })
    }
    else {

      return res.status(200).json({
        ok: true,
        msg: 'Producto fue eliminado correctamente'
      });
    }

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      ok: false,
      msg: 'Un error fue detectado, por favor habla con el administrador'
    })
  }
}


const getAllProducts = async (req, res = response) => {
  try {
    // 1. Obtener productos
    const products = await Product.find(
      {
        status: true
      }
    ).lean();
    // 2. Obtener membresías
    const memberships = await Subscription.find(
      {
        status: true
      }
    ).lean();

    // 3. Normalizar formato
    const formattedProducts = products.map(p => ({
      id: p._id,
      name: p.name,
      category: 'products',
      price: p.price,
      stock: p.stock,
      description: p.description,
      image_url: p.image_url,
    }));

    const formattedMemberships = memberships.map(m => ({
      id: m._id,
      name: m.name,
      category: 'membership',
      price: m.price,
      stock: null,
      description: "",
      image_url: ""
    }));

    // 4. Combinar todo
    const allItems = [...formattedProducts, ...formattedMemberships];

    res.status(200).json(allItems);

  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      msg: 'Un error fue detectado, por favor habla con el administrador'
    })
  }
}


module.exports = {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProducts
}