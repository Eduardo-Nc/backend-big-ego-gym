const { response } = require('express');
const Sale = require('../models/sale');
const Product = require('../models/products');
const Users = require('../models/users');
const Subscription = require("../models/subscription");

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

    const buyerUser = await Users.findById(buyer).session(session);
    if (!buyerUser) {
      throw new Error('Usuario comprador no encontrado');
    }

    // Iterar sobre cada ítem para validar y actualizar lo necesario
    for (const saleItem of items) {
      if (saleItem.itemType === 'Product') {
        const product = await Product.findById(saleItem.item).session(session);
        if (!product) throw new Error(`Producto con ID ${saleItem.item} no encontrado`);

        if (product.stock < saleItem.quantity) {
          throw new Error(`Stock insuficiente para el producto "${product.name}". Disponible: ${product.stock}`);
        }

        // Descontar stock
        product.stock -= saleItem.quantity;
        await product.save({ session });
      }

      if (saleItem.itemType === 'membership') {
        const now = new Date();

        const hasActiveMembership =
          buyerUser.subscription &&
          buyerUser.membershipEnd &&
          new Date(buyerUser.membershipEnd) > now;

        if (hasActiveMembership) {
          throw new Error('El usuario ya tiene una membresía activa. No puede comprar otra hasta que expire.');
        }

        const subscription = await Subscription.findById(saleItem.item).session(session);
        if (!subscription) {
          throw new Error('La suscripción indicada no existe');
        }

        // Duraciones según typeSubscription
        const durations = {
          diaria: 1,
          semanal: 7,
          quincenal: 15,
          mensual: 30,
          anual: 365
        };

        const durationDays = durations[subscription.typeSubscription.toLowerCase()];
        if (!durationDays) {
          throw new Error(`Tipo de suscripción no válido: ${subscription.typeSubscription}`);
        }

        // Calcular fecha final
        const membershipEnd = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

        // Actualizar usuario
        buyerUser.subscription = subscription._id;
        buyerUser.membershipStart = now;
        buyerUser.membershipEnd = membershipEnd;

        await buyerUser.save({ session });
      }
    }

    // Guardar venta
    const resSale = new Sale({
      items,
      total: parseFloat(total),
      paymentMethod,
      buyer,
      seller,
      status: true,
    });

    await resSale.save({ session });

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