const express = require('express');
const router = express.Router();
const db = require('../config/db');
const verifyCustomerToken = require('../middleware/customerAuth');

router.use(verifyCustomerToken);

// GET /api/cart -- return this customer's active (non-expired) reservations
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.product_id, r.quantity, r.expires_at,
              p.name, p.price, p.image_url, p.stock_quantity
       FROM cart_reservations r
       JOIN products p ON p.id = r.product_id
       WHERE r.user_id = ? AND r.expires_at > NOW()`,
      [req.customer.user_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/cart -- add or update a reservation for one product
// body: { product_id, quantity }
router.post('/', async (req, res) => {
  const { product_id, quantity } = req.body;

  if (!product_id || !quantity || quantity < 1) {
    return res.status(400).json({ error: 'product_id and a valid quantity are required' });
  }

  try {
    const [productRows] = await db.query(
      'SELECT stock_quantity, status FROM products WHERE id = ?',
      [product_id]
    );
    if (productRows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const product = productRows[0];

    if (product.status !== 'available') {
      return res.status(400).json({ error: 'Product is currently out of stock' });
    }

    // How much of this product is already reserved by OTHER customers right now
    const [reservedRows] = await db.query(
      `SELECT COALESCE(SUM(quantity), 0) AS total_reserved
       FROM cart_reservations
       WHERE product_id = ? AND user_id != ? AND expires_at > NOW()`,
      [product_id, req.customer.user_id]
    );
    const reservedByOthers = Number(reservedRows[0].total_reserved);
    const trulyAvailable = product.stock_quantity - reservedByOthers;

    if (quantity > trulyAvailable) {
      return res.status(400).json({ error: 'The selected quantity is not available' });
    }

    // 1 day (24 hours) from now
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.query(
      `INSERT INTO cart_reservations (user_id, product_id, quantity, expires_at)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE quantity = ?, expires_at = ?`,
      [req.customer.user_id, product_id, quantity, expiresAt, quantity, expiresAt]
    );

    res.json({ message: 'Reservation saved', expires_at: expiresAt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/cart/:productId -- remove this customer's reservation for one product
router.delete('/:productId', async (req, res) => {
  try {
    await db.query(
      'DELETE FROM cart_reservations WHERE user_id = ? AND product_id = ?',
      [req.customer.user_id, req.params.productId]
    );
    res.json({ message: 'Reservation removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;