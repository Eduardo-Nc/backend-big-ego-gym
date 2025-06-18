const { response } = require('express');
const Task = require('../models/tasks');

const getTasks = async (req, res = response) => {
  // Normaliza la fecha recibida al inicio del día en UTC
  const inputDate = new Date();
  const targetDate = new Date(Date.UTC(
    inputDate.getUTCFullYear(),
    inputDate.getUTCMonth(),
    inputDate.getUTCDate()
  ));

  try {
    const resTask = await Task.find({
      status: true,
      startDate: { $lte: targetDate },
      endDate: { $gte: targetDate }
    })
      .populate('userProgress.user')
      .sort({ createdAt: -1 });

    if (!resTask || resTask.length === 0) {
      return res.status(404).json({
        ok: false,
        msg: 'Tareas no encontradas'
      });
    }

    return res.status(200).json(resTask);

  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      msg: 'Un error fue detectado, por favor habla con el administrador'
    });
  }
}

const markTaskComplete = async (req, res = response) => {
  const { id } = req.params;
  const { userId } = req.body;

  try {
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ ok: false, msg: 'Tarea no encontrada' });
    }

    const progress = task.userProgress.find(p => p.user.toString() === userId);
    if (!progress) {
      return res.status(404).json({ ok: false, msg: 'Progreso de usuario no encontrado en esta tarea' });
    }

    // Cambiar el estado actual (true -> false, false -> true)
    progress.completed = !progress.completed;
    await task.save();

    return res.status(200).json({
      ok: true,
      msg: `Tarea marcada como ${progress.completed ? 'completada' : 'incompleta'}`,
      task
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, msg: 'Error en el servidor' });
  }
};

const getTasksByUser = async (req, res = response) => {
  const { id } = req.params;
  const { date } = req.query;

  try {
    if (!date) {
      return res.status(400).json({ ok: false, msg: 'Fecha no proporcionada' });
    }

    const inputDate = new Date(date);
    const targetDate = new Date(Date.UTC(
      inputDate.getUTCFullYear(),
      inputDate.getUTCMonth(),
      inputDate.getUTCDate()
    ));

    const tasks = await Task.find({
      status: true,
      startDate: { $lte: targetDate },
      endDate: { $gte: targetDate },
      'userProgress.user': id
    }).populate('userProgress.user');
    console.log(tasks)
    return res.status(200).json(tasks);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      msg: 'Un error fue detectado, por favor habla con el administrador'
    });
  }
};



const getTasksByAdmin = async (req, res = response) => {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({
      ok: false,
      msg: 'La fecha (date) es obligatoria en la query',
    });
  }

  try {
    // Normaliza la fecha recibida al inicio del día en UTC
    const inputDate = new Date(date);
    const targetDate = new Date(Date.UTC(
      inputDate.getUTCFullYear(),
      inputDate.getUTCMonth(),
      inputDate.getUTCDate()
    ));

    // Buscar tareas vigentes en esa fecha
    const tasks = await Task.find({
      status: true,
      startDate: { $lte: targetDate },
      endDate: { $gte: targetDate }
    }).populate('userProgress.user');

    if (!tasks.length) {
      return res.status(404).json({
        ok: false,
        msg: 'No hay tareas vigentes en esta fecha',
      });
    }

    // Calcular progreso por usuario
    const userTaskMap = {};

    tasks.forEach(task => {
      task.userProgress.forEach(progress => {
        const userId = progress.user._id.toString();

        if (!userTaskMap[userId]) {
          userTaskMap[userId] = {
            user: progress.user,
            totalTasks: 0,
            completedTasks: 0,
            createdAt: task.createdAt,
            endDate: task.endDate,
          };
        }

        userTaskMap[userId].totalTasks += 1;
        if (progress.completed) {
          userTaskMap[userId].completedTasks += 1;
        }
      });
    });

    const usersWithProgress = Object.values(userTaskMap).map(entry => ({
      user: entry.user,
      totalTasks: entry.totalTasks,
      completedTasks: entry.completedTasks,
      progress: Math.round((entry.completedTasks / entry.totalTasks) * 100),
      createdAt: entry.createdAt,
      endDate: entry.endDate
    }));

    return res.status(200).json(usersWithProgress);

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      ok: false,
      msg: 'Error al obtener las tareas por usuario',
    });
  }
};

const getTasksByEmployee = async (req, res = response) => {
  const { date } = req.query;
  const { userId } = req.params;


  if (!date || !userId) {
    return res.status(400).json({
      ok: false,
      msg: 'La fecha (date) y el userId son obligatorios en la query',
    });
  }

  try {
    const inputDate = new Date(date);
    const targetDate = new Date(Date.UTC(
      inputDate.getUTCFullYear(),
      inputDate.getUTCMonth(),
      inputDate.getUTCDate()
    ));

    // Solo tareas que están vigentes ese día y contienen al usuario
    const tasks = await Task.find({
      status: true,
      startDate: { $lte: targetDate },
      endDate: { $gte: targetDate },
      'userProgress.user': userId
    }).populate('userProgress.user');


    if (!tasks.length) {
      return res.status(404).json({
        ok: false,
        msg: 'No hay tareas vigentes en esta fecha para el usuario',
      });
    }

    // Calcular el progreso del usuario
    let totalTasks = 0;
    let completedTasks = 0;
    let createdAt = null;
    let endDateValue = null;

    tasks.forEach(task => {
      const userProgress = task.userProgress.find(p => p.user._id.toString() === userId);
      if (userProgress) {
        totalTasks += 1;
        if (userProgress.completed) {
          completedTasks += 1;
        }
        createdAt = task.createdAt;
        endDateValue = task.endDate;
      }
    });

    return res.status(200).json({
      user: tasks[0].userProgress.find(p => p.user._id.toString() === userId).user,
      totalTasks,
      completedTasks,
      progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      createdAt,
      endDate: endDateValue,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      ok: false,
      msg: 'Error al obtener las tareas del usuario',
    });
  }
};

const createTask = async (req, res = response) => {
  try {
    const {
      name,
      description,
      startDate,
      endDate,
      userProgress
    } = req.body;

    // Crear Task base
    const nuevaTarea = new Task({
      name,
      description,
      startDate,
      endDate,
      userProgress,
      status: true,
    });

    await nuevaTarea.save();

    return res.status(201).json({
      ok: true,
      msg: 'Tarea creada correctamente',
    });

  } catch (error) {
    console.error('Error al crear tarea:', error);
    return res.status(500).json({
      ok: false,
      msg: 'Error del servidor. Por favor, contacta al administrador.'
    });
  }
};

const updateTask = async (req, res = response) => {
  const { id } = req.params;
  const {
    name,
    description,
    startDate,
    endDate,
    userProgress,
  } = req.body;

  try {

    // Primero actualizamos los datos normales (sin la foto)
    let resTask = await Task.findByIdAndUpdate(id, {
      name,
      description,
      startDate,
      endDate,
      userProgress
    }, {
      new: true,
      runValidators: true,
    });

    if (!resTask) {
      return res.status(404).json({
        ok: false,
        msg: 'Tarea no encontrada',
      });
    }

    await resTask.save();

    return res.status(200).json({
      ok: true,
      msg: 'Tarea actualizada correctamente',
      user: resTask,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      ok: false,
      msg: 'Error del servidor, habla con el administrador',
    });
  }
};


const deleteTask = async (req, res = response) => {

  const { id } = req.params;

  try {

    const resTask = await Task.findByIdAndUpdate(
      id,
      { status: false },
      {
        new: true,
      }
    );


    if (!resTask) {
      return res.status(404).json({
        ok: false,
        msg: 'Tarea no encontrada'
      })
    }
    else {

      return res.status(200).json({
        ok: true,
        msg: 'Tarea fue eliminada correctamente'
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
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  getTasksByUser,
  getTasksByAdmin,
  markTaskComplete,
  getTasksByEmployee
}