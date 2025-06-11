
const { Router } = require('express');
const {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProducts
} = require('../controllers/products');

const router = Router();

router.get('/', getProducts);

router.post('/new', createProduct);

router.put('/update/:id', updateProduct);

router.put('/delete/:id', deleteProduct);

router.get('/all', getAllProducts);


module.exports = router;