
const { Router } = require('express');
const {
  getBills,
  createBill,
  updateBill,
  deleteBill,
  getBillsByUser
} = require('../controllers/bills');

const router = Router();

router.get('/', getBills);

router.get('/:id', getBillsByUser);

router.post('/new', createBill);

router.put('/update/:id', updateBill);

router.put('/delete/:id', deleteBill);


module.exports = router;