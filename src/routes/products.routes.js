
const { Router } = require('express');
const {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/products');

const router = Router();

router.get('/', getProducts);

router.post('/new', createProduct);

router.put('/update/:id', updateProduct);

router.put('/delete/:id', deleteProduct);


module.exports = router;