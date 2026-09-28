const db = require('../config/db');

exports.getSummary = async (req, res) => {
  try {
    const [[cfg]] = await db.query('SELECT low_stock_threshold FROM settings WHERE id = 1');
    const low = cfg?.low_stock_threshold ?? 5;

    const [[totals]] = await db.query(`
      SELECT
        COUNT(*) AS total_products,
        SUM(status = 'available') AS available_count,
        SUM(status = 'sold') AS sold_count,
        SUM(status = 'reserved') AS reserved_count,
        SUM(stock_quantity = 0) AS out_of_stock_count,
        SUM(stock_quantity > 0 AND stock_quantity <= ?) AS low_stock_count,
        COALESCE(SUM(stock_quantity), 0) AS total_units,
        COALESCE(SUM(price * stock_quantity), 0) AS stock_value
      FROM products
    `, [low]);

    const [productList] = await db.query(`
      SELECT id, name, stock_quantity, condition_grade, status
      FROM products
      ORDER BY name ASC
    `);

    const [categoryBreakdown] = await db.query(`
      SELECT c.id, c.name, COUNT(p.id) AS product_count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id
      GROUP BY c.id
      ORDER BY product_count DESC
    `);

    res.json({ totals, productList, categoryBreakdown, lowThreshold: low });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};