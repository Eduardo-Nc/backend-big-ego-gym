const { response } = require('express');
const Bill = require('../models/bills');

const getBills = async (req, res = response) => {
  try {
    const resBills = await Bill.find({
      status: true
    });

    if (!resBills) {
      return res.status(404).json({
        ok: false,
        message: 'Gastos no encontrados'
      })
    } else {
      return res.status(200).json(resBills);
    }

  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      msg: 'Un error fue detectado, por favor habla con el administrador'
    })
  }
}

const createBill = async (req, res = response) => {
  try {
    const {
      amount,
      quantity,
      description,
      name,
      typePay
    } = req.body;

    // Crear Bill base
    const nuevoGasto = new Bill({
      amount: parseFloat(amount),
      quantity: parseFloat(quantity),
      description,
      name,
      typePay: typePay ? "Efectivo" : "Transferencia",
      status: true,
    });

    await nuevoGasto.save();

    return res.status(201).json({
      ok: true,
      msg: 'Gasto creado correctamente',
    });

  } catch (error) {
    console.error('Error al crear gasto:', error);
    return res.status(500).json({
      ok: false,
      msg: 'Error del servidor. Por favor, contacta al administrador.'
    });
  }
};

const updateBill = async (req, res = response) => {
  const { id } = req.params;
  const {
    amount,
    quantity,
    description,
    name,
    typePay
  } = req.body;

  try {

    // Primero actualizamos los datos normales (sin la foto)
    let resBills = await Bill.findByIdAndUpdate(id, {
      amount: parseFloat(amount),
      quantity: parseFloat(quantity),
      description,
      name,
      typePay: typePay ? "Efectivo" : "Transferencia",
    }, {
      new: true,
      runValidators: true,
    });

    if (!resBills) {
      return res.status(404).json({
        ok: false,
        msg: 'Gasto no encontrado',
      });
    }

    await resBills.save();

    return res.status(200).json({
      ok: true,
      msg: 'Gasto actualizado correctamente',
      user: resBills,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      ok: false,
      msg: 'Error del servidor, habla con el administrador',
    });
  }
};


const deleteBill = async (req, res = response) => {

  const { id } = req.params;

  try {

    const resBills = await Bill.findByIdAndUpdate(
      id,
      { status: false },
      {
        new: true,
      }
    );


    if (!resBills) {
      return res.status(404).json({
        ok: false,
        msg: 'Gasto no encontrado'
      })
    }
    else {

      return res.status(200).json({
        ok: true,
        msg: 'Gasto fue eliminado correctamente'
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
  getBills,
  createBill,
  updateBill,
  deleteBill
}