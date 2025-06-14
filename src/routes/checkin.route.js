
const { Router } = require('express');
const {
  getCheckinsByPeriod
} = require('../controllers/checkin');

const router = Router();

router.get('/', getCheckinsByPeriod);

module.exports = router;