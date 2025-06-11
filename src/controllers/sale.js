const { response } = require('express');
const Sale = require('../models/sale');
const Product = require('../models/products');

const getSales = async (req, res = response) => {
  try {
    const resSale = await Sale.find({
      status: true
    });

    if (!resSale) {
      return res.status(404).json({
        ok: false,
        msg: 'Venta no encontrada'
      })
    } else {
      return res.status(200).json(resSale);
    }

  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      msg: 'Un error fue detectado, por favor habla con el administrador'
    })
  }
}

const createSale = async (req, res = response) => {
  const session = await Sale.startSession();
  session.startTransaction();

  try {
    const {
      items,
      total,
      paymentMethod,
      buyer,
      seller
    } = req.body;

    // 1. Validar y actualizar stock de productos
    for (const saleItem of items) {
      if (saleItem.itemType === 'products') {
        const product = await Product.findById(saleItem.item).session(session);

        if (!product) {
          throw new Error(`Producto con ID ${saleItem.item} no encontrado`);
        }

        if (product.stock < saleItem.quantity) {
          throw new Error(`Stock insuficiente para el producto "${product.name}". Stock actual: ${product.stock}, solicitado: ${saleItem.quantity}`);
        }

        // Actualizar stock
        product.stock -= saleItem.quantity;
        await product.save({ session });
      }
    }

    // 2. Crear venta
    const resSale = new Sale({
      items,
      total: parseFloat(total),
      paymentMethod,
      buyer,
      seller,
      status: true,
    });

    await resSale.save({ session });

    // 3. Confirmar transacción
    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      ok: true,
      msg: 'Venta creada correctamente',
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error('Error al crear la venta:', error);
    return res.status(400).json({
      ok: false,
      msg: error.message || 'Error al procesar la venta',
    });
  }
};

const updateSale = async (req, res = response) => {
  const { id } = req.params;
  const {
    items,
    total,
    paymentMethod,
    buyer,
    seller
  } = req.body;

  try {

    // Primero actualizamos los datos normales (sin la foto)
    let resSale = await Sale.findByIdAndUpdate(id, {
      items,
      total: parseFloat(total),
      paymentMethod,
      buyer,
      seller
    }, {
      new: true,
      runValidators: true,
    });

    if (!resSale) {
      return res.status(404).json({
        ok: false,
        msg: 'Venta no encontrada',
      });
    }

    await resSale.save();

    return res.status(200).json({
      ok: true,
      msg: 'Venta actualizada correctamente',
      user: resSale,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      ok: false,
      msg: 'Error del servidor, habla con el administrador',
    });
  }
};


const deleteSale = async (req, res = response) => {

  const { id } = req.params;

  try {

    const resSale = await Sale.findByIdAndUpdate(
      id,
      { status: false },
      {
        new: true,
      }
    );


    if (!resSale) {
      return res.status(404).json({
        ok: false,
        msg: 'Venta no encontrada'
      })
    }
    else {

      return res.status(200).json({
        ok: true,
        msg: 'Venta fue eliminada correctamente'
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
  getSales,
  createSale,
  updateSale,
  deleteSale
}