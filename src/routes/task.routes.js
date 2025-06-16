
const { Router } = require('express');
const {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  getTasksByUser,
  getTasksByAdmin,
  markTaskComplete,
  getTasksByEmployee
} = require('../controllers/tasks');

const router = Router();

router.get('/getByUser/:id', getTasksByUser);

router.get('/getByAdmin', getTasksByAdmin);

router.get('/getByEmployee/:userId', getTasksByEmployee);

router.put('/markcomplete/:id', markTaskComplete);

router.get('/', getTasks);

router.post('/new', createTask);

router.put('/update/:id', updateTask);

router.put('/delete/:id', deleteTask);


module.exports = router;