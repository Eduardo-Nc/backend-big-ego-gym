
const { Router } = require('express');
const {
  loginUser,
  createUser,
  revalidateToken,
  updateUser,
  deleteUser,
  getUser,
  sendPasswordReset,
  resetPassword
} = require('../controllers/users');
const { validarJWT } = require('../middlewares/validar-jwt');

const router = Router();

router.get('/:user_id', getUser);

router.post('/new', createUser);

router.post('/login', loginUser);

router.post('/renew', validarJWT, revalidateToken);

router.put('/delete/:user_id', deleteUser);

router.put('/update/:user_id', updateUser);

router.post('/forgotpassword', sendPasswordReset);

module.exports = router;