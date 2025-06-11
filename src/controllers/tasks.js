const { response } = require('express');
const Task = require('../models/tasks');

const getTasks = async (req, res = response) => {
  try {
    const resTask = await Task.find({
      status: true
    }).populate('selectedUsers');

    if (!resTask || resTask.length === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Tareas no encontradas'
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

const getTasksByUser = async (req, res = response) => {
  const { id } = req.params;

  try {
    const resTask = await Task.find({
      status: true,
      selectedUsers: id
    }).populate('selectedUsers');

    if (!resTask || resTask.length === 0) {
      return res.status(404).json({
        ok: false,
        msg: 'Tareas no encontradas para este usuario'
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


const createTask = async (req, res = response) => {
  try {
    const {
      name,
      description,
      startDate,
      endDate,
      selectedUsers
    } = req.body;

    // Crear Task base
    const nuevaTarea = new Task({
      name,
      description,
      startDate,
      endDate,
      selectedUsers,
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
    selectedUsers,
  } = req.body;

  try {

    // Primero actualizamos los datos normales (sin la foto)
    let resTask = await Task.findByIdAndUpdate(id, {
      name,
      description,
      startDate,
      endDate,
      selectedUsers,
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
  getTasksByUser
}