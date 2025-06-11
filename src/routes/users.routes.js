
const { Router } = require('express');
const {
  loginUser,
  createUser,
  revalidateToken,
  updateUser,
  deleteUser,
  getUser,
  sendPasswordReset,
  sendRedirectToApp,
  resetPassword,
  getUsers,
  getByEmployee
} = require('../controllers/users');
const { validarJWT } = require('../middlewares/validar-jwt');

const router = Router();

router.get('/', getUsers);

router.get('/:user_id', getUser);

router.get('/getByEmployee/:id', getByEmployee);

router.post('/new', createUser);

router.post('/login', loginUser);

router.post('/renew', validarJWT, revalidateToken);

router.put('/delete/:user_id', deleteUser);

router.put('/update/:user_id', updateUser);

router.post('/forgotpassword', sendPasswordReset);

router.get('/redirectpassword/:token', sendRedirectToApp);

router.post('/resetPassword', resetPassword);

module.exports = router;