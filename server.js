const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Database connection
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Convert pool to promise-based operations
const promisePool = db.promise();

// Test database connection
db.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to database:', err);
    process.exit(1);
  }
  console.log('Connected to MySQL database');
  connection.release();
});

// Routes
// User Routes
app.post('/api/user/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    
    // Validate input
    if (!username || !password || !email) {
      return res.status(400).json({ error: 'Username, password, and email are required' });
    }
    
    // Check if username or email already exists
    const [existingUsers] = await promisePool.query('SELECT * FROM users WHERE username = ? OR email = ?', [username, email]);
    
    if (existingUsers.length > 0) {
      const existingUser = existingUsers[0];
      if (existingUser.username === username) {
        return res.status(409).json({ error: 'Username already exists' });
      }
      if (existingUser.email === email) {
        return res.status(409).json({ error: 'Email already exists' });
      }
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [result] = await promisePool.query('INSERT INTO users (username, password, email) VALUES (?, ?, ?)', 
      [username, hashedPassword, email]);
    
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Admin Registration Route
app.post('/api/admin/register', async (req, res) => {
  try {
    const { username, password, email, phone } = req.body;
    
    // Validate input
    if (!username || !password || !email || !phone) {
      return res.status(400).json({ error: 'Username, password, email, and phone are required' });
    }
    
    // Check if username or email already exists in admin table
    const [existingAdmins] = await promisePool.query('SELECT * FROM admin WHERE username = ? OR email = ?', [username, email]);
    
    if (existingAdmins.length > 0) {
      const existingAdmin = existingAdmins[0];
      if (existingAdmin.username === username) {
        return res.status(409).json({ error: 'Admin username already exists' });
      }
      if (existingAdmin.email === email) {
        return res.status(409).json({ error: 'Admin email already exists' });
      }
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [result] = await promisePool.query('INSERT INTO admin (username, password, email, phone) VALUES (?, ?, ?, ?)', 
      [username, hashedPassword, email, phone]);
    
    res.status(201).json({ message: 'Admin registered successfully' });
  } catch (error) {
    console.error('Admin registration error:', error);
    res.status(500).json({ error: 'Server error during admin registration' });
  }
});

app.post('/api/user/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    const [results] = await promisePool.query('SELECT * FROM users WHERE username = ?', [username]);
    
    if (results.length === 0) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    
    const user = results[0];
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    
    const token = jwt.sign({ userId: user.id, role: 'user' }, process.env.JWT_SECRET);
    res.json({ token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Admin Login Route
app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    const [results] = await promisePool.query('SELECT * FROM admin WHERE username = ?', [username]);
    
    if (results.length === 0) {
      res.status(401).json({ error: 'Invalid admin credentials' });
      return;
    }
    
    const admin = results[0];
    const validPassword = await bcrypt.compare(password, admin.password);
    
    if (!validPassword) {
      res.status(401).json({ error: 'Invalid admin credentials' });
      return;
    }
    
    const token = jwt.sign({ adminId: admin.id, role: 'admin' }, process.env.JWT_SECRET);
    res.json({ token });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Server error during admin login' });
  }
});

// Menu Routes
app.get('/api/menu', (req, res) => {
  db.query('SELECT * FROM menu_items', (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Error fetching menu' });
      return;
    }
    res.json(results);
  });
});

// Order Routes
app.post('/api/orders', async (req, res) => {
  const { items, totalAmount, delivery_address, contact_phone } = req.body;
  
  try {
    // Extract user ID from JWT token if available
    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.userId;
      } catch (tokenError) {
        console.log('Invalid or expired token, proceeding with guest order');
      }
    }

    // Check inventory for each item before placing order
    const outOfStockItems = [];
    for (const item of items) {
      // Get the menu item ID
      const [menuItems] = await promisePool.query('SELECT id FROM menu_items WHERE name = ?', [item.name]);
      
      if (menuItems.length === 0) {
        return res.status(404).json({ error: `Item not found: ${item.name}` });
      }
      
      const menuItemId = menuItems[0].id;
      
      // Check if there's enough quantity in stock
      const [quantityResult] = await promisePool.query(
        'SELECT quantity FROM menu_quantity WHERE menu_item_id = ?', 
        [menuItemId]
      );
      
      if (quantityResult.length === 0 || quantityResult[0].quantity < item.quantity) {
        outOfStockItems.push(item.name);
      }
    }
    
    if (outOfStockItems.length > 0) {
      return res.status(400).json({
        error: 'Some items are out of stock',
        outOfStockItems: outOfStockItems
      });
    }

    // Simplify items to only include name and quantity
    const simplifiedItems = items.map(item => ({
      name: item.name,
      quantity: item.quantity
    }));

    // Update inventory quantities
    for (const item of items) {
      const [menuItems] = await promisePool.query('SELECT id FROM menu_items WHERE name = ?', [item.name]);
      const menuItemId = menuItems[0].id;
      
      await promisePool.query(
        'UPDATE menu_quantity SET quantity = quantity - ? WHERE menu_item_id = ?',
        [item.quantity, menuItemId]
      );
    }

    const [result] = await promisePool.query(
      'INSERT INTO orders (user_id, items, total_amount, status, delivery_address, contact_phone) VALUES (?, ?, ?, ?, ?, ?)', 
      [userId, JSON.stringify(simplifiedItems), totalAmount, 'pending', delivery_address, contact_phone]
    );
    
    res.status(201).json({ message: 'Order placed successfully' });
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({ error: 'Error placing order' });
  }
});

// Table Booking Routes
app.post('/api/bookings', (req, res) => {
  const { userId, name, email, phone, date, time, guests, special_requests } = req.body;
  
  db.query('INSERT INTO bookings (user_id, name, email, phone, date, time, guests, special_requests) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', 
    [userId, name, email, phone, date, time, guests, special_requests], 
    (err, result) => {
      if (err) {
        console.error('Error booking table:', err);
        res.status(500).json({ error: 'Error booking table' });
        return;
      }
      res.status(201).json({ message: 'Table booked successfully' });
    });
});

// Public Table Booking Routes (no login required)
app.post('/api/public/table-bookings', (req, res) => {
  const { name, email, phone, date, time, guests, special_requests } = req.body;
  
  db.query('INSERT INTO bookings (name, email, phone, date, time, guests, special_requests) VALUES (?, ?, ?, ?, ?, ?, ?)', 
    [name, email, phone, date, time, guests, special_requests], 
    (err, result) => {
      if (err) {
        console.error('Error booking table:', err);
        res.status(500).json({ error: 'Error booking table' });
        return;
      }
      res.status(201).json({ message: 'Table booked successfully' });
    });
});

// User Feedback Routes
app.post('/api/feedback', (req, res) => {
  const { name, email, rating, message } = req.body;
  
  db.query('INSERT INTO CustomerReviews (CustomerName, Email, Rating, Message) VALUES (?, ?, ?, ?)', 
    [name, email, rating, message], 
    (err, result) => {
      if (err) {
        console.error('Error submitting feedback:', err);
        res.status(500).json({ error: 'Error submitting feedback' });
        return;
      }
      res.status(201).json({ message: 'Feedback submitted successfully' });
    });
});

// Get Feedback
app.get('/api/feedback', (req, res) => {
  db.query('SELECT * FROM CustomerReviews ORDER BY SubmittedAt DESC', (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Error fetching feedback' });
      return;
    }
    res.json(results);
  });
});

// Admin Authentication Middleware
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token.' });
  }
};

// Admin Routes - Protected with middleware
app.get('/api/admin/orders', authenticateAdmin, (req, res) => {
  const query = `
    SELECT o.*, u.username as user_name 
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    ORDER BY o.created_at DESC
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching orders:', err);
      res.status(500).json({ error: 'Error fetching orders' });
      return;
    }
    res.json(results);
  });
});

// Admin Inventory Management Routes
app.get('/api/admin/inventory', authenticateAdmin, (req, res) => {
  db.query(
    'SELECT mq.*, mi.image_url FROM menu_quantity mq JOIN menu_items mi ON mq.menu_item_id = mi.id ORDER BY mq.category, mq.name',
    (err, results) => {
      if (err) {
        console.error('Error fetching inventory:', err);
        res.status(500).json({ error: 'Error fetching inventory' });
        return;
      }
      res.json(results);
    }
  );
});

app.post('/api/admin/inventory/restock', authenticateAdmin, async (req, res) => {
  try {
    // Restock all items to default quantity of 20
    await promisePool.query('UPDATE menu_quantity SET quantity = 20');
    res.json({ message: 'All items restocked successfully' });
  } catch (error) {
    console.error('Error restocking inventory:', error);
    res.status(500).json({ error: 'Error restocking inventory' });
  }
});

app.patch('/api/admin/inventory/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    
    if (quantity < 0) {
      return res.status(400).json({ error: 'Quantity cannot be negative' });
    }
    
    await promisePool.query('UPDATE menu_quantity SET quantity = ? WHERE id = ?', [quantity, id]);
    res.json({ message: 'Inventory updated successfully' });
  } catch (error) {
    console.error('Error updating inventory:', error);
    res.status(500).json({ error: 'Error updating inventory' });
  }
});

app.get('/api/admin/bookings', authenticateAdmin, (req, res) => {
  db.query('SELECT * FROM bookings ORDER BY date ASC', (err, results) => {
    if (err) {
      console.error('Error fetching bookings:', err);
      res.status(500).json({ error: 'Error fetching bookings' });
      return;
    }
    res.json(results);
  });
});

app.patch('/api/admin/bookings/:id', authenticateAdmin, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  db.query('UPDATE bookings SET status = ? WHERE id = ?', 
    [status, id], 
    (err, result) => {
      if (err) {
        console.error('Error updating booking status:', err);
        res.status(500).json({ error: 'Error updating booking status' });
        return;
      }
      res.json({ message: 'Booking status updated successfully' });
    });
});

app.patch('/api/admin/orders/:id', authenticateAdmin, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  db.query('UPDATE orders SET status = ? WHERE id = ?', 
    [status, id], 
    (err, result) => {
      if (err) {
        console.error('Error updating order status:', err);
        res.status(500).json({ error: 'Error updating order status' });
        return;
      }
      res.json({ message: 'Order status updated successfully' });
    });
});

app.get('/api/admin/feedback', authenticateAdmin, (req, res) => {
  db.query('SELECT * FROM CustomerReviews ORDER BY SubmittedAt DESC', (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Error fetching customer reviews' });
      return;
    }
    res.json(results);
  });
});

// Start server
const PORT = process.env.PORT || 3003; // Changed port to avoid conflict
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});