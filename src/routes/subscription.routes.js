const { Router } = require('express');
const { createSubscription, getSubscription, deactivateSubscription, updatedSubscription } = require('../controllers/subscription');

const router = Router();

router.get('/', getSubscription);

router.post('/new', createSubscription);

router.put('/delete/:id', deactivateSubscription);

router.put('/update/:id', updatedSubscription);


module.exports = router;