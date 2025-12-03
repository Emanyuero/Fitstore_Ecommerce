const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const db = require('./db');

const app = express();
app.use(cors());
app.use(bodyParser.json());

/* ============================================================
   REGISTER
============================================================ */
app.post('/api/register', async (req, res) => {
  const { full_name, username, phone, address, gender, dob, email, password } = req.body;
  const role = req.body.role || req.body.user_type || 'customer';

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = `
      INSERT INTO users (full_name, username, phone, address, gender, dob, email, password, user_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [full_name, username, phone, address, gender, dob, email, hashedPassword, role];

    db.query(query, params, (err) => {
      if (err) return res.json({ status: 'error', message: err.message });
      res.json({ status: 'success', message: 'User registered successfully' });
    });
  } catch (error) {
    res.json({ status: 'error', message: error.message });
  }
});

/* ============================================================
   LOGIN
============================================================ */
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  db.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email], async (err, results) => {
    if (err) return res.json({ status: 'error', message: err.message });
    if (!results || results.length === 0)
      return res.json({ status: 'error', message: 'Invalid email or password' });

    const user = results[0];
    try {
      const match = await bcrypt.compare(password, user.password);
      if (!match) return res.json({ status: 'error', message: 'Invalid email or password' });

      const role = user.role || user.user_type || 'customer';
      const name = user.full_name || '';

      const redirectUrl =
        role.toLowerCase() === 'business' || role.toLowerCase() === 'owner'
          ? '/owner-dashboard'
          : '/customer-dashboard';

      res.json({ status: 'success', message: 'Login successful', role, name, redirectUrl });
    } catch (error) {
      res.json({ status: 'error', message: error.message });
    }
  });
});

/* ============================================================
   PRODUCTS
============================================================ */

// GET all products with status
app.get('/api/products', (req, res) => {
  db.query('SELECT *, IF(stock_quantity > 0, "available", "unavailable") AS status FROM products', (err, results) => {
    if (err) return res.status(500).json({ status: 'error', message: err.message });
    res.json({ status: 'success', products: results });
  });
});

// GET product by ID
app.get('/api/products/:id', (req, res) => {
  db.query('SELECT * FROM products WHERE id = ?', [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ status: 'error', message: err.message });
    if (!results.length) return res.status(404).json({ status: 'error', message: 'Product not found' });
    res.json({ status: 'success', product: results[0] });
  });
});

// CREATE PRODUCT
app.post('/api/products', (req, res) => {
  const { name, price, description, category, stock_quantity } = req.body;

  if (!name || !price) {
    return res.status(400).json({ status: 'error', message: 'Name and price are required.' });
  }

  const sql = `
    INSERT INTO products (name, price, description, category, stock_quantity)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(sql, [name, price, description, category, stock_quantity || 0], (err, result) => {
    if (err) return res.status(500).json({ status: 'error', message: err.message });

    res.json({ status: 'success', message: 'Product added successfully', productId: result.insertId });
  });
});

// UPDATE PRODUCT
app.put('/api/products/:id', (req, res) => {
  const productId = req.params.id;
  const { name, price, description, category, stock_quantity } = req.body;

  const sql = `
    UPDATE products
    SET name=?, price=?, description=?, category=?, stock_quantity=?
    WHERE id=?
  `;

  db.query(sql, [name, price, description, category, stock_quantity, productId], (err) => {
    if (err) return res.status(500).json({ status: 'error', message: err.message });

    res.json({ status: 'success', message: 'Product updated successfully' });
  });
});

// DELETE PRODUCT
app.delete('/api/products/:id', (req, res) => {
  const productId = req.params.id;

  db.query('DELETE FROM products WHERE id=?', [productId], (err) => {
    if (err) return res.status(500).json({ status: 'error', message: err.message });
    res.json({ status: 'success', message: 'Product deleted successfully' });
  });
});

/* ============================================================
   CART / STOCK LOGIC
============================================================ */
const getOrCreateCartByEmail = (email, callback) => {
  db.query('SELECT id FROM users WHERE email = ?', [email], (err, users) => {
    if (err) return callback(err);
    if (users.length === 0) return callback(new Error('User not found'));
    const userId = users[0].id;

    db.query('SELECT * FROM carts WHERE user_id = ?', [userId], (err2, carts) => {
      if (err2) return callback(err2);
      if (carts.length > 0) return callback(null, carts[0].id);

      db.query('INSERT INTO carts (user_id) VALUES (?)', [userId], (err3, created) => {
        if (err3) return callback(err3);
        callback(null, created.insertId);
      });
    });
  });
};

// GET CART
app.get('/api/cart/:email', (req, res) => {
  const email = req.params.email;

  getOrCreateCartByEmail(email, (err, cartId) => {
    if (err) return res.status(500).json({ status: 'error', message: err.message });

    const sql = `
      SELECT ci.id AS cart_item_id, p.id AS product_id, p.name, p.price, p.stock_quantity, ci.quantity
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.cart_id = ?
    `;

    db.query(sql, [cartId], (err2, results) => {
      if (err2) return res.status(500).json({ status: 'error', message: err2.message });
      res.json({ status: 'success', cart: results });
    });
  });
});

// ADD TO CART
app.post('/api/cart/add', (req, res) => {
  const { email, product_id, quantity } = req.body;
  const qty = quantity || 1;

  getOrCreateCartByEmail(email, (err, cartId) => {
    if (err) return res.status(500).json({ status: 'error', message: err.message });

    db.query("SELECT stock_quantity FROM products WHERE id = ?", [product_id], (err2, prod) => {
      if (err2) return res.json({ status: "error", message: err2.message });
      if (!prod.length || prod[0].stock_quantity < qty)
        return res.json({ status: "failed", message: "Not enough stock" });

      db.query("UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?", [qty, product_id]);

      db.query("SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?", [cartId, product_id], (err3, existing) => {
        if (err3) return res.json({ status: "error", message: err3.message });

        if (existing.length > 0) {
          const newQty = existing[0].quantity + qty;
          db.query("UPDATE cart_items SET quantity = ? WHERE id = ?", [newQty, existing[0].id]);
        } else {
          db.query("INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)", [cartId, product_id, qty]);
        }

        res.json({ status: "success", message: "Item added to cart" });
      });
    });
  });
});

// UPDATE CART QUANTITY
app.put('/api/cart/update', (req, res) => {
  const { email, product_id, quantity } = req.body;

  getOrCreateCartByEmail(email, (err, cartId) => {
    if (err) return res.status(500).json({ status: 'error', message: err.message });

    db.query("SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?", [cartId, product_id], (err2, items) => {
      if (err2) return res.json({ status: "error", message: err2.message });

      const oldQty = items[0].quantity;
      const diff = quantity - oldQty;

      if (diff > 0) {
        db.query("UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ? AND stock_quantity >= ?", [diff, product_id, diff], (err3, result) => {
          if (result.affectedRows === 0)
            return res.json({ status: "failed", message: "Not enough stock" });

          db.query("UPDATE cart_items SET quantity = ? WHERE id = ?", [quantity, items[0].id]);
          res.json({ status: "success" });
        });
      } else {
        const restore = Math.abs(diff);
        db.query("UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?", [restore, product_id]);
        db.query("UPDATE cart_items SET quantity = ? WHERE id = ?", [quantity, items[0].id]);
        res.json({ status: "success" });
      }
    });
  });
});

// REMOVE FROM CART
app.delete('/api/cart/remove/:email/:productId', (req, res) => {
  const { email, productId } = req.params;

  getOrCreateCartByEmail(email, (err, cartId) => {
    if (err) return res.status(500).json({ status: 'error', message: err.message });

    db.query("SELECT quantity FROM cart_items WHERE cart_id = ? AND product_id = ?", [cartId, productId], (err2, items) => {
      if (!items.length) return res.json({ status: "success" });

      const qty = items[0].quantity;
      db.query("UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?", [qty, productId]);
      db.query("DELETE FROM cart_items WHERE cart_id = ? AND product_id = ?", [cartId, productId]);
      res.json({ status: "success", message: "Item removed" });
    });
  });
});

// CHECKOUT
app.post('/api/checkout', (req, res) => {
  const { email } = req.body;

  getOrCreateCartByEmail(email, (err, cartId) => {
    if (err) return res.json({ status: "error", message: err.message });

    db.query("DELETE FROM cart_items WHERE cart_id = ?", [cartId], () => {
      res.json({ status: "success", message: "Order completed!" });
    });
  });
});

app.listen(3000, () => console.log("🚀 API running at http://localhost:3000"));
