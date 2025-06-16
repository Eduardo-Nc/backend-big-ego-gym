const { response } = require('express');
const Checkin = require('../models/checkIn');

const getCheckinsByPeriod = async (req, res = response) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ ok: false, msg: 'La fecha es obligatoria' });
    }

    const startDate = new Date(`${date}T00:00:00.000Z`);
    const endDate = new Date(`${date}T23:59:59.999Z`);

    // Traer todos los checkins del día
    const checkins = await Checkin.find({
      createdAt: { $gte: startDate, $lte: endDate }
    });

    // Inicializar contadores
    let manana = 0;
    let tarde = 0;
    let noche = 0;

    // Clasificar por horario
    for (const checkin of checkins) {
      const hora = new Date(checkin.createdAt).getHours();

      if (hora >= 6 && hora < 12) {
        manana++;
      } else if (hora >= 12 && hora < 18) {
        tarde++;
      } else {
        noche++;
      }
    }

    // Estructura final
    const result = [
      { value: manana, label: 'Mañana' },
      { value: tarde, label: 'Tarde' },
      { value: noche, label: 'Noche' }
    ];

    if (manana === 0 && tarde === 0 && noche === 0) {
      return res.status(400).json({ ok: false, msg: 'No hay información' });
    } else if (manana && tarde === 0 && noche === 0) {
      return res.status(200).json([
        { value: manana, label: 'Mañana' }
      ]);
    } else if (manana && tarde && noche === 0) {
      return res.status(200).json([
        { value: manana, label: 'Mañana' },
        { value: tarde, label: 'Tarde' },
      ]);
    }

    return res.status(200).json(result);

  } catch (error) {
    console.error('Error al obtener los check-ins:', error);
    return res.status(500).json({
      ok: false,
      msg: 'Ocurrió un error al procesar la solicitud'
    });
  }
};

module.exports = {
  getCheckinsByPeriod,
}