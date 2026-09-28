const db = require('../config/db');

const LIMITS = { name: 100, description: 500, image_url: 500 };

function validate(body) {
  const { name, description, price, image_url } = body;

  if (!name || !name.trim()) return 'Product name is required';
  if (name.trim().length > LIMITS.name) return `Name must be ${LIMITS.name} characters or fewer`;
  if (description && description.length > LIMITS.description) {
    return `Description must be ${LIMITS.description} characters or fewer`;
  }
  if (image_url && image_url.length > LIMITS.image_url) return 'Image path is too long';

  const num = Number(price);
  if (price === undefined || price === '' || Number.isNaN(num)) return 'Price must be a number';
  if (num < 0) return 'Price cannot be negative';
  if (num > 999999) return 'Price is too high';

  return null;
}

exports.getAll = async (req, res) => {
  const showDeleted = req.query.deleted === 'true';
  try {
    const [rows] = await db.query(`
      SELECT p.*, c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_deleted = ?
      ORDER BY p.created_at DESC
    `, [showDeleted ? 1 : 0]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.getOne = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  const problem = validate(req.body);
  if (problem) return res.status(400).json({ error: problem });

  const { name, description, category_id, price, condition_grade, image_url, stock_quantity } = req.body;

  try {
    const [result] = await db.query(
      `INSERT INTO products (name, description, category_id, price, condition_grade, image_url, stock_quantity)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name.trim(), description?.trim() || null, category_id || null, Number(price),
       condition_grade || 'good', image_url || null, Number(stock_quantity) || 0]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  const problem = validate(req.body);
  if (problem) return res.status(400).json({ error: problem });

  const { name, description, category_id, price, condition_grade, image_url } = req.body;

  try {
    const [result] = await db.query(
      `UPDATE products SET name=?, description=?, category_id=?, price=?, condition_grade=?, image_url=?
       WHERE id=? AND is_deleted = 0`,
      [name.trim(), description?.trim() || null, category_id || null, Number(price),
       condition_grade, image_url || null, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found or has been removed' });
    }
    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Soft delete: marks the product as removed instead of destroying the row,
// so past orders that reference this product still resolve correctly.
exports.remove = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT status, is_deleted FROM products WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    if (rows[0].is_deleted) return res.status(400).json({ error: 'Product has already been removed' });

    // Restriction: block deletion while a sale is actively in progress.
    if (rows[0].status === 'reserved') {
      return res.status(400).json({
        error: 'Cannot delete a product that is currently reserved in an active order'
      });
    }

    await db.query('UPDATE products SET is_deleted = 1, deleted_at = NOW() WHERE id = ?', [req.params.id]);
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Undo a soft delete — lets an admin bring a product back into active listings.
exports.restore = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT is_deleted FROM products WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    if (!rows[0].is_deleted) return res.status(400).json({ error: 'Product is not deleted' });

    await db.query('UPDATE products SET is_deleted = 0, deleted_at = NULL WHERE id = ?', [req.params.id]);
    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  const { status } = req.body;
  const valid = ['available', 'sold', 'reserved'];

  if (!valid.includes(status)) {
    return res.status(400).json({ error: 'Status must be available, sold, or reserved' });
  }

  try {
    await db.query('UPDATE products SET status = ? WHERE id = ? AND is_deleted = 0', [status, req.params.id]);
    res.json({ id: req.params.id, status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};