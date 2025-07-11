const { response } = require('express');
const Sale = require('../models/sale');
const Product = require('../models/products');
const Users = require('../models/users');
const Subscription = require("../models/subscription");
const Checkin = require('../models/checkIn');
const Bill = require('../models/bills');
const Task = require('../models/tasks');
const moment = require('moment-timezone');
const path = require('path');
const fs = require('fs');

const { membershipTemplate } = require('../helpers/sendEmail');
const { generarReportePDF } = require('../helpers/createReport');


const getSales = async (req, res = response) => {
  try {
    const resSale = await Sale.find({
      status: true,
      paid: true
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

const getPendingSales = async (req, res = response) => {
  try {
    const resSale = await Sale.find({
      status: true,
      paid: false
    }).sort({ createdAt: -1 }).populate('buyer')
      .populate('seller')
      .lean();

    // Poblamos manualmente los items
    for (const venta of resSale) {
      for (const item of venta.items) {
        const modelo = item.itemType === 'products'
          ? require('../models/products')
          : require('../models/subscription');

        item.item = await modelo.findById(item.item).lean();
      }
    }

    const formatSales = resSale.map(venta => {
      return {
        id: venta._id,
        fecha: venta.createdAt,
        cliente: venta.buyer?.nombreUsuario + " " + venta.buyer?.apellidosUsuario || 'Sin nombre',
        vendedor: venta.seller?.nombreUsuario + " " + venta.seller?.apellidosUsuario || 'Sin vendedor',
        metodoPago: venta.paymentMethod,
        total: venta.total,
        paid: venta?.paid ? venta.paid : false,
        items: venta.items.map(i => ({
          tipo: i.itemType === "products" ? "Producto" : "Membresía",
          nombre: i.itemType === "products" ? i.item.name : "Membresía " + i.item.name,
          cantidad: i.quantity,
          precioUnitario: i.item.price,
          subtotal: i.quantity * i.item.price
        }))
      };
    });

    if (!formatSales) {
      return res.status(404).json({
        ok: false,
        msg: 'Venta no encontrada'
      })
    } else {
      return res.status(200).json(formatSales);
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

        const subscription = await Subscription.findById(saleItem.item).session(session);
        if (!subscription) {
          throw new Error('La suscripción indicada no existe');
        }

        const durations = {
          diaria: 1,
          semanal: 7,
          quincenal: 15,
          Bimestral: 60,
          Trimestral: 90,
          Semestral: 180,
          mensual: 30,
          anual: 365
        };

        const durationDays = durations[subscription.typeSubscription.toLowerCase()];
        if (!durationDays) {
          throw new Error(`Tipo de suscripción no válido: ${subscription.typeSubscription}`);
        }

        let membershipStart = now;
        let membershipEnd;

        // Si tiene membresía activa
        if (
          buyerUser.subscription &&
          buyerUser.membershipEnd &&
          new Date(buyerUser.membershipEnd) > now
        ) {
          const remainingTime = new Date(buyerUser.membershipEnd).getTime() - now.getTime();
          const oneDayInMs = 24 * 60 * 60 * 1000;

          if (remainingTime > oneDayInMs) {
            throw new Error('El usuario posee una membresía activa. Para adquirir una nueva, debe estar a un día o menos de su vencimiento');
          }

          membershipStart = new Date(buyerUser.membershipEnd);
        }

        if (subscription.typeSubscription.toLowerCase() === "semanal") {
          // La membresía termina el sábado de esa semana
          const dayOfWeek = membershipStart.getDay(); // domingo=0, lunes=1, ..., sábado=6

          let daysToAdd;
          if (dayOfWeek === 0) {
            // Si compra en domingo, termina el sábado siguiente
            daysToAdd = 6;
          } else {
            // Si compra lunes-sábado, termina este sábado
            daysToAdd = 6 - dayOfWeek;
          }

          // Ajustar la hora a las 23:59:59
          membershipEnd = new Date(
            membershipStart.getFullYear(),
            membershipStart.getMonth(),
            membershipStart.getDate() + daysToAdd,
            23, 59, 59
          );

        } else {
          // Para otros tipos, sumar días
          // Sumar días desde membershipStart
          membershipEnd = new Date(
            membershipStart.getTime() + durationDays * 24 * 60 * 60 * 1000
          );
        }

        // Enviar correo
        await membershipTemplate(
          buyerUser.correo,
          buyerUser.nombreUsuario,
          buyerUser.qrUsuario,
          subscription.name,
          moment(membershipEnd).tz('America/Mexico_City').format('DD-MM-YYYY, h:mm:ss a')
        );

        // Actualizar usuario
        buyerUser.subscription = subscription._id;
        buyerUser.membershipStart = membershipStart;
        buyerUser.membershipEnd = membershipEnd;

        await buyerUser.save({ session });
      }
    }

    // Guardar venta
    const timezone = 'America/Mexico_City';
    const resSale = new Sale({
      items,
      total: parseFloat(total),
      paymentMethod,
      buyer,
      seller,
      paid: paymentMethod === "Pendiente" ? false : true,
      paymentDate: moment().tz(timezone).toDate(),
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
  const { paid, paymentMethod, seller } = req.body;

  const timezone = 'America/Mexico_City';
  const now = moment().tz(timezone).toDate();

  try {
    const sale = await Sale.updateOne(
      { _id: id },
      {
        $set: {
          paymentDate: now,
          paid,
          paymentMethod,
          seller
        }
      }
    );

    if (!sale) {
      return res.status(404).json({
        ok: false,
        msg: 'Venta no encontrada',
      });
    }

    return res.status(200).json({
      ok: true,
      msg: 'Venta actualizada correctamente',
      sale: sale,
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

const obtenerRangoFechas = (tipo, fechaInicioManual, fechaFinManual) => {
  const timezone = 'America/Mexico_City';
  let inicio;
  let fin;

  if (fechaInicioManual && fechaFinManual) {
    // Si se pasaron fechas manuales
    inicio = moment.tz(fechaInicioManual, timezone).startOf('day');
    fin = moment.tz(fechaFinManual, timezone).endOf('day');
  } else {
    // Si no se pasaron fechas manuales, usar el tipo
    fin = moment.tz(timezone).endOf('day');

    switch (tipo) {
      case 'diario':
        inicio = moment.tz(timezone).startOf('day');
        break;
      case 'semanal':
        inicio = moment.tz(timezone).startOf('week'); // Lunes
        break;
      case 'mensual':
        inicio = moment.tz(timezone).startOf('month');
        break;
      case 'anual':
        inicio = moment.tz(timezone).startOf('year');
        break;
      default:
        throw new Error('Tipo de intervalo inválido o faltan fechas manuales');
    }
  }

  return { inicio: inicio.toDate(), fin: fin.toDate() };
};

const createReport = async (req, res = response) => {
  try {
    const { tipo = 'diario', user = '', tel = '' } = req.body;
    // '2025-07-01', '2025-07-01'
    const { inicio, fin } = obtenerRangoFechas(tipo);

    const nombreArchivo = `reporte_${Date.now()}`;
    const folderPath = path.join(__dirname, '../reportes');

    const tareas = await Task.find({
      createdAt: { $gte: inicio, $lte: fin },
      status: true
    }).populate('userProgress.user').lean();

    const cumplimientoPorEmpleado = {};
    tareas.forEach(t => {
      t.userProgress.forEach(p => {
        const userId = p.user._id.toString();
        if (!cumplimientoPorEmpleado[userId]) {
          cumplimientoPorEmpleado[userId] = {
            nombre: `${p.user.nombreUsuario} ${p.user.apellidosUsuario}`,
            completadas: 0,
            total: 0
          };
        }

        cumplimientoPorEmpleado[userId].total += 1;
        if (p.completed) {
          cumplimientoPorEmpleado[userId].completadas += 1;
        }
      });
    });

    const dataCumplimiento = Object.values(cumplimientoPorEmpleado).map(info => ({
      nombre: info.nombre,
      completadas: info.completadas,
      total: info.total,
      porcentaje: info.total === 0 ? 0 : Math.round((info.completadas / info.total) * 100)
    }));

    // ===> Ingresos desde ventas
    const ventas = await Sale.find({
      paymentDate: { $gte: inicio, $lte: fin },
      status: true,
      paid: true
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

    const productosVendidos = {};
    ventas.forEach(v => {
      v.items.forEach(item => {
        if (item.itemType === 'products') {
          const id = item.item._id.toString();
          if (!productosVendidos[id]) {
            productosVendidos[id] = {
              nombre: item.item.name,
              cantidad: 0
            };
          }
          productosVendidos[id].cantidad += item.quantity;
        }
      });
    });
    const topProductos = Object.values(productosVendidos)
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5); // Top 5


    const conteoMetodos = {};
    ventas.forEach(v => {
      conteoMetodos[v.paymentMethod] = (conteoMetodos[v.paymentMethod] || 0) + 1;
    });
    const metodoPagoPreferido = Object.entries(conteoMetodos).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    let totalVentas = 0;
    let productos = 0;
    let membresias = 0;
    let tipoReporte = tipo ? tipo : "Diario";
    let date = "Del " + moment(inicio).format("DD/MM/YYYY") + " Al " + moment(fin).format("DD/MM/YYYY");
    let labels = [];
    let values = [];
    let responsable = user;
    let telefono = tel;
    // console.log(JSON.stringify(ventas))

    ventas.forEach(v => {
      totalVentas += v.total;
      v.items.forEach(item => {
        if (item.itemType === 'products') {
          productos += (item.quantity * item.item.price);
        }
        if (item.itemType === 'membership') {
          membresias += item.item.price;
        }
      });
    });
    // console.log("total productos final ", productos)
    // console.log("total membresias final ", membresias)
    // console.log("totalVentas final ", totalVentas)


    // Agrupación según tipo
    if (tipo === 'diario' || tipo === 'semanal') {
      const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      labels = tipo === 'diario'
        ? [dias[moment().day()]]
        : dias;

      const acumulado = {};

      dias.forEach(d => (acumulado[d] = 0));
      ventas.forEach(v => {
        const dia = dias[moment(v.paymentDate).day()];
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
        const mes = moment(v.paymentDate).month(); // 0-11
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
    const checkins = await Checkin.find({ createdAt: { $gte: inicio, $lte: fin } }).populate('user');

    const visitasPorCliente = {};
    checkins.forEach(c => {
      const uid = c.user._id.toString();
      if (!visitasPorCliente[uid]) {
        visitasPorCliente[uid] = {
          nombre: c.user.nombreUsuario,
          visitas: 0
        };
      }
      visitasPorCliente[uid].visitas += 1;
    });

    const clientesFrecuentes = Object.values(visitasPorCliente)
      .sort((a, b) => b.visitas - a.visitas)
      .slice(0, 5);

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
        const h = moment(c.createdAt).tz('America/Mexico_City').hour();
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
      pdfUrl: `${process.env.URL_SERVER}reportes/${nombreArchivo}.pdf`,
      labels,
      values,
      responsable,
      telefono,
      dataCumplimiento,
      topProductos,
      clientesFrecuentes,
      metodoPagoPreferido
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

const getSaleByAdmin = async (req, res = response) => {
  const { date } = req.query;

  try {
    let filter = {
      status: true
    };

    if (date) {
      const timeZone = 'America/Mexico_City';

      // Parsear la fecha en tu timezone
      const startDate = moment.tz(date, timeZone).startOf('day').toDate();
      const endDate = moment.tz(date, timeZone).endOf('day').toDate();

      filter.paymentDate = {
        $gte: startDate,
        $lte: endDate
      };
    }
    const resSale = await Sale.find(filter).sort({ paymentDate: -1 }).populate('buyer')
      .populate('seller')
      .lean();

    // Poblamos manualmente los items
    for (const venta of resSale) {
      for (const item of venta.items) {
        const modelo = item.itemType === 'products'
          ? require('../models/products')
          : require('../models/subscription');

        item.item = await modelo.findById(item.item).lean();
      }
    }

    const formatSales = resSale.map(venta => {
      return {
        id: venta._id,
        fecha: venta.paymentDate,
        cliente: venta.buyer?.nombreUsuario + " " + venta.buyer?.apellidosUsuario || 'Sin nombre',
        vendedor: venta.seller?.nombreUsuario + " " + venta.seller?.apellidosUsuario || 'Sin vendedor',
        metodoPago: venta.paymentMethod,
        total: venta.total,
        paid: venta?.paid ? venta.paid : false,
        items: venta.items.map(i => ({
          tipo: i.itemType === "products" ? "Producto" : "Membresía",
          nombre: i.itemType === "products" ? i.item.name : "Membresía " + i.item.name,
          cantidad: i.quantity,
          precioUnitario: i.item.price,
          subtotal: i.quantity * i.item.price
        }))
      };
    });

    if (!formatSales) {
      return res.status(404).json({
        ok: false,
        msg: 'Ventas no encontradas'
      })
    } else {
      return res.status(200).json(formatSales);
    }

  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      msg: 'Un error fue detectado, por favor habla con el administrador'
    })
  }
}

const getSalessByUser = async (req, res = response) => {
  const { id } = req.params;
  const { date } = req.query;

  try {
    let filter = {
      status: true,
      seller: id
    };

    if (date) {
      const timeZone = 'America/Mexico_City';

      // Parsear la fecha en tu timezone
      const startDate = moment.tz(date, timeZone).startOf('day').toDate();
      const endDate = moment.tz(date, timeZone).endOf('day').toDate();

      filter.paymentDate = {
        $gte: startDate,
        $lte: endDate
      };
    }


    const resSale = await Sale.find(filter).sort({ paymentDate: -1 }).populate('buyer')
      .populate('seller')
      .lean();

    // Poblamos manualmente los items
    for (const venta of resSale) {
      for (const item of venta.items) {
        const modelo = item.itemType === 'products'
          ? require('../models/products')
          : require('../models/subscription');

        item.item = await modelo.findById(item.item).lean();
      }
    }

    const formatSales = resSale.map(venta => {
      return {
        id: venta._id,
        fecha: venta.paymentDate,
        cliente: venta.buyer?.nombreUsuario + " " + venta.buyer?.apellidosUsuario || 'Sin nombre',
        vendedor: venta.seller?.nombreUsuario + " " + venta.seller?.apellidosUsuario || 'Sin vendedor',
        metodoPago: venta.paymentMethod,
        total: venta.total,
        paid: venta?.paid ? venta.paid : false,
        items: venta.items.map(i => ({
          tipo: i.itemType === "products" ? "Producto" : "Membresía",
          nombre: i.itemType === "products" ? i.item.name : "Membresía " + i.item.name,
          cantidad: i.quantity,
          precioUnitario: i.item.price,
          subtotal: i.quantity * i.item.price
        }))
      };
    });

    if (!formatSales) {
      return res.status(404).json({
        ok: false,
        msg: 'Ventas no encontradas'
      })
    } else {
      return res.status(200).json(formatSales);
    }

  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      msg: 'Un error fue detectado, por favor habla con el administrador'
    })
  }
};

module.exports = {
  getSales,
  createSale,
  updateSale,
  deleteSale,
  createReport,
  getSaleByAdmin,
  getSalessByUser,
  getPendingSales
}