const { response } = require('express');
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

    // Crear Inventory base
    const resInventory = new Inventory({
      name,
      type,
      quantity: parseFloat(quantity),
      condition: parseFloat(condition),
      price,
      brand,
      status: true,
    });

    await resInventory.save();

    return res.status(201).json({
      ok: true,
      msg: 'Artículo creado correctamente',
    });

  } catch (error) {
    console.error('Error al crear gasto:', error);
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

    // Primero actualizamos los datos normales (sin la foto)
    let resInventory = await Inventory.findByIdAndUpdate(id, {
      name,
      type,
      quantity: parseFloat(quantity),
      condition: parseFloat(condition),
      price,
      brand,
    }, {
      new: true,
      runValidators: true,
    });

    if (!resInventory) {
      return res.status(404).json({
        ok: false,
        msg: 'Artículo no encontrado',
      });
    }

    await resInventory.save();

    return res.status(200).json({
      ok: true,
      msg: 'Artículo actualizado correctamente',
      user: resInventory,
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