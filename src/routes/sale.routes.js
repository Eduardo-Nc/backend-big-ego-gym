
const { Router } = require('express');
const {
  getSales,
  createSale,
  updateSale,
  deleteSale,
  createReport,
  getSaleByAdmin,
  getSalessByUser,
  getPendingSales
} = require('../controllers/sale');

const router = Router();

router.get('/', getSales);

router.get('/pending', getPendingSales);

router.post('/new', createSale);

router.put('/update/:id', updateSale);

router.put('/delete/:id', deleteSale);

router.post('/reports/generate', createReport);

router.get('/admin', getSaleByAdmin);

router.get('/user/:id', getSalessByUser);


module.exports = router;