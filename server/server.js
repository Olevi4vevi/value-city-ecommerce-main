require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./config/db');
const authRoutes = require('./routes/auth');
const categoryRoutes = require('./routes/categories');
const productRoutes = require('./routes/products');
const stockRoutes = require('./routes/stock');
const inventoryRoutes = require('./routes/inventory');
const uploadRoutes = require('./routes/upload');
const authMiddleware = require('./middleware/auth');
const settingsRoutes = require('./routes/settings');
const notificationRoutes = require('./routes/notifications')
const customerAuthRoutes = require('./routes/customerAuth');
const profileRoutes = require('./routes/profile');
const orderRoutes = require('./routes/orders');
const reportRoutes = require('./routes/reports');
const userRoutes = require('./routes/users');
const customerReportRoutes = require('./routes/customerReports');
const cartRoutes = require('./routes/cart');

const app = express();
const PORT = 5000;

// Only accept requests from the storefront and admin frontends
app.use(cors({
  origin: [
    'http://valuecity.localhost:5173',
    'http://admin.valuecity.localhost:5173',
  ],
}));
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

app.get('/api/db-test', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT NOW() AS currentTime');
    res.json({ connected: true, time: rows[0].currentTime });
  } catch (err) {
    res.status(500).json({ connected: false, error: err.message });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/notifications', notificationRoutes)
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);

// Customer routes -- no authMiddleware here, profile.js/orders.js already
// check the customer's own token internally via verifyCustomerToken
app.use('/api/customer-auth', customerAuthRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/customer-reports', customerReportRoutes);
app.use('/api/cart', cartRoutes);

app.get('/api/dashboard', authMiddleware, (req, res) => {
  res.json({ message: `Welcome, ${req.admin.username}!` });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});