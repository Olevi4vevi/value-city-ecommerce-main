const express = require('express');
const db = require('../config/db');
const verifyCustomerToken = require('../middleware/customerAuth');

const router = express.Router();
router.use(verifyCustomerToken);

// GET /api/orders -- list all past orders for the logged-in customer
router.get('/', async (req, res) => {
  try {
    const [orders] = await db.query(
      `SELECT order_id, order_date, total_amount, status
       FROM orders
       WHERE user_id = ?
       ORDER BY order_date DESC`,
      [req.customer.user_id]
    );
    res.json(orders);
  } catch (err) {
    console.error('Get orders error:', err);
    res.status(500).json({ message: 'Server error fetching order history.' });
  }
});

// GET /api/orders/:orderId -- view items within a single order,
// including a live product image_url via the product_id link to her products table
router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    const [order] = await db.query(
      'SELECT * FROM orders WHERE order_id = ? AND user_id = ?',
      [orderId, req.customer.user_id]
    );
    if (order.length === 0) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    const [items] = await db.query(
      `SELECT oi.item_name, oi.size, oi.condition_grade, oi.price, oi.quantity, p.image_url
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [orderId]
    );

    res.json({ order: order[0], items });
  } catch (err) {
    console.error('Get order detail error:', err);
    res.status(500).json({ message: 'Server error fetching order detail.' });
  }
});

// PUT /api/orders/:orderId/cancel -- REQ-25: let the customer cancel an
// order that hasn't been picked up yet and request a refund, independent of
// account deactivation/deletion. Same simulated-refund pattern as the
// account-deletion flow (routes/profile.js): flips status to 'cancelled'.
// There's no live payment gateway merged yet, so "refunded" is just that
// status flip plus a message -- whoever wires up real refunds later can
// hook into this same branch.
router.put('/:orderId/cancel', async (req, res) => {
  try {
    const { orderId } = req.params;

    const [rows] = await db.query(
      'SELECT order_id, status FROM orders WHERE order_id = ? AND user_id = ?',
      [orderId, req.customer.user_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    const order = rows[0];
    if (!['pending', 'paid', 'shipped'].includes(order.status)) {
      return res.status(400).json({
        message: order.status === 'cancelled'
          ? 'This order has already been cancelled.'
          : "This order has already been picked up and can't be cancelled."
      });
    }

    await db.query("UPDATE orders SET status = 'cancelled' WHERE order_id = ?", [orderId]);

    res.json({ message: 'Order cancelled and refund requested.' });
  } catch (err) {
    console.error('Cancel order error:', err);
    res.status(500).json({ message: 'Server error cancelling order.' });
  }
});

module.exports = router;
