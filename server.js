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

    // Simplify items to only include name and quantity
    const simplifiedItems = items.map(item => ({
      name: item.name,
      quantity: item.quantity
    }));

    const [result] = await promisePool.query(
      'INSERT INTO orders (user_id, items, total_amount, status, delivery_address, contact_phone) VALUES (?, ?, ?, ?, ?, ?)', 
      [userId, JSON.stringify(simplifiedItems), totalAmount, 'pending', delivery_address, contact_phone]
    );
    
    res.status(201).json({ message: 'Order placed successfully' });}
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

// Admin Routes
app.get('/api/admin/orders', (req, res) => {
  db.query('SELECT * FROM orders', (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Error fetching orders' });
      return;
    }
    res.json(results);
  });
});

app.get('/api/admin/bookings', (req, res) => {
  db.query('SELECT * FROM bookings ORDER BY date ASC', (err, results) => {
    if (err) {
      console.error('Error fetching bookings:', err);
      res.status(500).json({ error: 'Error fetching bookings' });
      return;
    }
    res.json(results);
  });
});

app.patch('/api/admin/bookings/:id', (req, res) => {
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

app.get('/api/admin/table-bookings', (req, res) => {
  db.query('SELECT * FROM table_bookings ORDER BY date ASC', (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Error fetching table bookings' });
      return;
    }
    res.json(results);
  });
});

app.patch('/api/admin/table-bookings/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  db.query('UPDATE table_bookings SET status = ? WHERE id = ?', 
    [status, id], 
    (err, result) => {
      if (err) {
        res.status(500).json({ error: 'Error updating table booking status' });
        return;
      }
      res.json({ message: 'Table booking status updated successfully' });
    });
});

app.get('/api/admin/feedback', (req, res) => {
  db.query('SELECT * FROM user_feedback ORDER BY created_at DESC', (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Error fetching feedback' });
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