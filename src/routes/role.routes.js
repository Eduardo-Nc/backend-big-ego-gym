const { Router } = require('express');
const { createRole, getRoles, deactivateRol, updatedRol } = require('../controllers/role');

const router = Router();


router.get('/', getRoles);

router.post('/new', createRole);

router.put('/delete/:id_rol', deactivateRol);

router.put('/:id_rol', updatedRol);


module.exports = router;