const db = require('../config/db');

async function syncStatus(id) {
  const [rows] = await db.query('SELECT stock_quantity, status FROM products WHERE id = ?', [id]);
  if (rows.length === 0) return;

  const { stock_quantity, status } = rows[0];

  if (stock_quantity === 0 && status === 'available') {
    await db.query('UPDATE products SET status = ? WHERE id = ?', ['sold', id]);
  } else if (stock_quantity > 0 && status === 'sold') {
    await db.query('UPDATE products SET status = ? WHERE id = ?', ['available', id]);
  }
}

exports.getStockLevels = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.id, p.name, p.stock_quantity, p.status, p.image_url,
             p.category_id, c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      ORDER BY p.name ASC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addStock = async (req, res) => {
  const qty = Number(req.body.amount);
  if (!qty || qty <= 0) {
    return res.status(400).json({ error: 'Amount must be a positive number' });
  }
  try {
    await db.query('UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?', [qty, req.params.id]);
    await syncStatus(req.params.id);
    const [rows] = await db.query('SELECT stock_quantity, status FROM products WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.removeStock = async (req, res) => {
  const qty = Number(req.body.amount);
  if (!qty || qty <= 0) {
    return res.status(400).json({ error: 'Amount must be a positive number' });
  }
  try {
    const [existing] = await db.query('SELECT stock_quantity FROM products WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Product not found' });

    const newQty = Math.max(0, existing[0].stock_quantity - qty);
    await db.query('UPDATE products SET stock_quantity = ? WHERE id = ?', [newQty, req.params.id]);
    await syncStatus(req.params.id);

    const [rows] = await db.query('SELECT stock_quantity, status FROM products WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.setStock = async (req, res) => {
  const qty = Number(req.body.quantity);
  if (qty === undefined || qty < 0 || Number.isNaN(qty)) {
    return res.status(400).json({ error: 'Quantity must be zero or a positive number' });
  }
  try {
    await db.query('UPDATE products SET stock_quantity = ? WHERE id = ?', [qty, req.params.id]);
    await syncStatus(req.params.id);
    res.json({ stock_quantity: qty });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};