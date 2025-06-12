
const { Router } = require('express');
const {
  getBills,
  createBill,
  updateBill,
  deleteBill,
  getBillsByUser,
  getBillsLimit,
  getBillsByUserLimit
} = require('../controllers/bills');

const router = Router();

router.get('/', getBills);

router.get('/:id', getBillsByUser);

router.get('/limit/admin', getBillsLimit);

router.get('/limit/:id', getBillsByUserLimit);

router.post('/new', createBill);

router.put('/update/:id', updateBill);

router.put('/delete/:id', deleteBill);


module.exports = router;