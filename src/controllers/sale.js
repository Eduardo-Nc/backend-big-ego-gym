const { response } = require('express');
const Sale = require('../models/sale');
const Product = require('../models/products');
const Users = require('../models/users');
const Subscription = require("../models/subscription");
const Checkin = require('../models/checkIn');
const Bill = require('../models/bills');
const moment = require('moment');
const path = require('path');
const fs = require('fs');

const { membershipTemplate } = require('../helpers/sendEmail');
const { generarReportePDF } = require('../helpers/createReport');


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
      if (saleItem.itemType === 'products') {
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
        console.log(saleItem)
        console.log(subscription)
        console.log(buyerUser)
        await membershipTemplate(buyerUser.correo, buyerUser.nombreUsuario, buyerUser.qrUsuario, subscription.name, moment(membershipEnd).format('DD-MM-YYYY, h:mm:ss a'));

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

const obtenerRangoFechas = (tipo) => {
  const fin = moment().endOf('day');
  let inicio;

  switch (tipo) {
    case 'diario':
      inicio = moment().startOf('day');
      break;
    case 'semanal':
      inicio = moment().startOf('week'); // Lunes
      break;
    case 'mensual':
      inicio = moment().startOf('month');
      break;
    case 'anual':
      inicio = moment().startOf('year');
      break;
    default:
      throw new Error('Tipo de intervalo inválido');
  }

  return { inicio: inicio.toDate(), fin: fin.toDate() };
};

const createReport = async (req, res = response) => {
  try {
    const { tipo = 'diario', user, tel } = req.body;
    const { inicio, fin } = obtenerRangoFechas(tipo);

    const nombreArchivo = `reporte_${Date.now()}`;
    const folderPath = path.join(__dirname, '../reportes');

    // ===> Ingresos desde ventas
    const ventas = await Sale.find({
      createdAt: { $gte: inicio, $lte: fin },
      status: true
    })
      .populate('buyer', 'nombreUsuario')
      .populate('seller', 'nombreUsuario')
      .lean();

    // Poblamos manualmente los items
    for (const venta of ventas) {
      for (const item of venta.items) {
        const modelo = item.itemType === 'products'
          ? require('../models/products')
          : require('../models/subscription');

        item.item = await modelo.findById(item.item).lean();
      }
    }

    let totalVentas = 0;
    let productos = 0;
    let membresias = 0;
    let tipoReporte = tipo ? tipo : "Diario";
    let date = "Del " + moment(inicio).format("DD/MM/YYYY") + " Al " + moment(fin).format("DD/MM/YYYY");
    let labels = [];
    let values = [];
    let responsable = user;
    let telefono = tel;

    ventas.forEach(v => {
      totalVentas += v.total;
      v.items.forEach(item => {
        if (item.itemType === 'products') productos += item.item.price;
        if (item.itemType === 'membership') membresias += item.item.price;
      });
    });

    // Agrupación según tipo
    if (tipo === 'diario' || tipo === 'semanal') {
      const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      labels = tipo === 'diario'
        ? [dias[moment().day()]]
        : dias;

      const acumulado = {};

      dias.forEach(d => (acumulado[d] = 0));
      ventas.forEach(v => {
        const dia = dias[moment(v.createdAt).day()];
        acumulado[dia] += v.total;
      });

      values = labels.map(dia => acumulado[dia]);
    }

    if (tipo === 'mensual' || tipo === 'anual') {
      const meses = [
        'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
        'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
      ];
      labels = tipo === 'mensual'
        ? [meses[moment().month()]]
        : meses;

      const acumulado = {};
      meses.forEach((m, i) => (acumulado[i] = 0));

      ventas.forEach(v => {
        const mes = moment(v.createdAt).month(); // 0-11
        acumulado[mes] += v.total;
      });

      values = tipo === 'mensual' ? [totalVentas] : labels.map((_, i) => acumulado[i]);
    }


    // ===> Gastos
    const gastos = await Bill.find({
      createdAt: { $gte: inicio, $lte: fin },
      status: true
    });

    const totalGastos = gastos.reduce((acc, g) => acc + g.amount, 0);

    // ===> Check-ins por bloques de 3 horas
    const checkins = await Checkin.find({ createdAt: { $gte: inicio, $lte: fin } });

    const bloques = [
      { label: '4am - 7am', inicio: 4, fin: 7 },
      { label: '7am - 10am', inicio: 7, fin: 10 },
      { label: '10am - 1pm', inicio: 10, fin: 13 },
      { label: '1pm - 4pm', inicio: 13, fin: 16 },
      { label: '4pm - 7pm', inicio: 16, fin: 19 },
      { label: '7pm - 10pm', inicio: 19, fin: 22 },
      { label: '10pm - 1am', inicio: 22, fin: 1 }
    ];

    const checkInPorHora = bloques.map(b => {
      const total = checkins.filter(c => {
        const h = moment(c.createdAt).hour();
        if (b.inicio < b.fin) return h >= b.inicio && h < b.fin;
        return h >= b.inicio || h < b.fin; // Para el bloque noche
      }).length;

      return { hora: b.label, total };
    });

    // ===> Construcción de datos para el PDF
    const data = {
      ingresos: totalVentas,
      gastos: totalGastos,
      productos,
      membresias,
      tipo: tipoReporte,
      date: date,
      checkIns: checkInPorHora,
      flujoCaja: (totalVentas - totalGastos),
      pdfUrl: `${process.env.URL_SERVER}/reportes/${nombreArchivo}.pdf`,
      labels,
      values,
      responsable,
      telefono
    };

    // console.log(data)

    // Asegúrate que la carpeta existe
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    // Limpiar archivos PDF anteriores
    const archivos = fs.readdirSync(folderPath);
    archivos.forEach(archivo => {
      if (archivo.endsWith('.pdf')) {
        fs.unlinkSync(path.join(folderPath, archivo));
      }
    });

    const pdfPath = await generarReportePDF(data, nombreArchivo);
    console.log("pdfPath ", pdfPath)

    res.status(200).json({
      ok: true,
      data: data
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, msg: 'Error generando el reporte' });
  }
}

module.exports = {
  getSales,
  createSale,
  updateSale,
  deleteSale,
  createReport
}