const { response } = require('express');
const { saveFileToCloudinary } = require('../helpers/saveFiles');
const Inventory = require('../models/inventory');

const getInventorys = async (req, res = response) => {
  try {
    const resInventory = await Inventory.find({
      status: true
    });

    if (!resInventory) {
      return res.status(404).json({
        ok: false,
        msg: 'Inventario vacio'
      })
    } else {
      return res.status(200).json(resInventory);
    }

  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      msg: 'Un error fue detectado, por favor habla con el administrador'
    })
  }
}

const createInventory = async (req, res = response) => {
  try {
    const {
      name,
      type,
      quantity,
      condition,
      price,
      brand
    } = req.body;

    // Verificar si ya existe
    const artExistente = await Inventory.findOne({ status: true, name: name });
    if (artExistente) {
      return res.status(409).json({
        ok: false,
        msg: 'El artículo ya se encuentra registrado'
      });
    }

    // Crear Inventory base
    const nuevoArt = new Inventory({
      name,
      type,
      quantity: parseFloat(quantity),
      condition,
      price: parseFloat(price),
      brand,
      status: true,
    });

    const artGuardado = await nuevoArt.save();

    // Subir foto si se envió
    if (req.files && req.files.image_url) {
      const file = req.files.image_url;
      const imageUrl = await saveFileToCloudinary(file.tempFilePath, 'art_photos', artGuardado._id.toString());
      artGuardado.image_url = imageUrl;
    } else {
      artGuardado.image_url = "";
    }

    // Guardar cambios
    await artGuardado.save();

    return res.status(201).json({
      ok: true,
      msg: 'Articulo creado correctamente',
    });

  } catch (error) {
    console.error('Error al crear artículo:', error);
    return res.status(500).json({
      ok: false,
      msg: 'Error del servidor. Por favor, contacta al administrador.'
    });
  }
};

const updateInventory = async (req, res = response) => {
  const { id } = req.params;
  const {
    name,
    type,
    quantity,
    condition,
    price,
    brand
  } = req.body;

  try {
    // Clonamos el body y eliminamos el campo image_url si viene como objeto
    const dataToUpdate = { ...req.body };
    if (dataToUpdate.image_url && typeof dataToUpdate.image_url === 'object') {
      delete dataToUpdate.image_url;
    }

    // Primero actualizamos los datos normales (sin la foto)
    let resArt = await Inventory.findByIdAndUpdate(id, {
      name,
      type,
      quantity: parseFloat(quantity),
      condition,
      price: parseFloat(price),
      brand,
    }, {
      new: true,
      runValidators: true,
    });

    if (!resArt) {
      return res.status(404).json({
        ok: false,
        msg: 'Artículo no encontrado',
      });
    }

    // Si viene archivo (desde un form con file)
    if (req.files && req.files.image_url) {
      const file = req.files.image_url;
      const imageUrl = await saveFileToCloudinary(
        file.tempFilePath,
        'art_photos',
        resArt._id.toString()
      );

      resArt.image_url = imageUrl;
      await resArt.save(); // Guardamos con la nueva URL de la imagen
    }

    return res.status(200).json({
      ok: true,
      msg: 'Artículo actualizado correctamente',
      art: resArt,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      ok: false,
      msg: 'Error del servidor, habla con el administrador',
    });
  }
};


const deleteInventory = async (req, res = response) => {

  const { id } = req.params;

  try {

    const resInventory = await Inventory.findByIdAndUpdate(
      id,
      { status: false },
      {
        new: true,
      }
    );


    if (!resInventory) {
      return res.status(404).json({
        ok: false,
        msg: 'Artículo no encontrado'
      })
    }
    else {

      return res.status(200).json({
        ok: true,
        msg: 'Artículo fue eliminado correctamente'
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


module.exports = {
  getInventorys,
  createInventory,
  updateInventory,
  deleteInventory
}