
const { Router } = require('express');
const {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  getTasksByUser
} = require('../controllers/tasks');

const router = Router();

router.get('/geyByUser/:id', getTasksByUser);

router.get('/', getTasks);

router.post('/new', createTask);

router.put('/update/:id', updateTask);

router.put('/delete/:id', deleteTask);


module.exports = router;