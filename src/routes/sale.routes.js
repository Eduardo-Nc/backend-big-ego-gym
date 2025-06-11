
const { Router } = require('express');
const {
  getSales,
  createSale,
  updateSale,
  deleteSale
} = require('../controllers/sale');

const router = Router();

router.get('/', getSales);

router.post('/new', createSale);

router.put('/update/:id', updateSale);

router.put('/delete/:id', deleteSale);


module.exports = router;