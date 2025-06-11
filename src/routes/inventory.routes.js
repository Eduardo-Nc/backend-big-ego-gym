
const { Router } = require('express');
const {
  getInventorys,
  createInventory,
  updateInventory,
  deleteInventory
} = require('../controllers/inventory');

const router = Router();

router.get('/', getInventorys);

router.post('/new', createInventory);

router.put('/update/:id', updateInventory);

router.put('/delete/:id', deleteInventory);


module.exports = router;