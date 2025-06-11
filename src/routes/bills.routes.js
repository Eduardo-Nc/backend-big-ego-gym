
const { Router } = require('express');
const {
  getBills,
  createBill,
  updateBill,
  deleteBill
} = require('../controllers/bills');

const router = Router();

router.get('/', getBills);

router.post('/new', createBill);

router.put('/update/:id', updateBill);

router.put('/delete/:id', deleteBill);


module.exports = router;