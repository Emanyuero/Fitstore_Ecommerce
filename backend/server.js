const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const db = require('./db');

// ✅ Multer & path for image uploads
const multer = require('multer');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ============================
// Multer storage config
// ============================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// ============================
// Serve static files
// ============================
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================================
// Inventory log function
// ============================================================
function addInventoryLog(productId, changeType, quantityChanged, callback = () => {}) {
  db.query(
    `SELECT name, stock_quantity FROM products WHERE id = ?`,
    [productId],
    (err, result) => {
      if (err || !result.length) return callback(err);
      const product = result[0];

      db.query(
        `INSERT INTO inventory_logs (product_id, product_name, change_type, quantity_changed, current_stock)
         VALUES (?, ?, ?, ?, ?)`,
        [productId, product.name, changeType, quantityChanged, product.stock_quantity],
        callback
      );
    }
  );
}

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
    db.query(query, [full_name, username, phone, address, gender, dob, email, hashedPassword, role], (err) => {
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
    if (!results.length) return res.json({ status: 'error', message: 'Invalid email or password' });

    const user = results[0];
    try {
      const match = await bcrypt.compare(password, user.password);
      if (!match) return res.json({ status: 'error', message: 'Invalid email or password' });

      const role = user.role || user.user_type || 'customer';
      const name = user.full_name || '';
      const redirectUrl = (role.toLowerCase() === 'business' || role.toLowerCase() === 'owner')
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
app.get('/api/products', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 9;
  const offset = (page - 1) * limit;
  const search = req.query.search ? String(req.query.search).trim() : '';
  const category = req.query.category ? String(req.query.category).trim() : '';

  // Count total products
  // Build dynamic WHERE clause and params for search/category
  let where = 'WHERE is_active = 1';
  const paramsForCount = [];
  if (search) {
    where += ' AND (name LIKE ? OR description LIKE ?)';
    paramsForCount.push(`%${search}%`, `%${search}%`);
  }
  if (category) {
    where += ' AND category = ?';
    paramsForCount.push(category);
  }

  db.query(`SELECT COUNT(*) AS total FROM products ${where}`, paramsForCount, (err, countResult) => {
    if (err) return res.status(500).json({ status: 'error', message: err.message });

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    // Get paginated products with same filters
    const sql = `SELECT *, IF(stock_quantity > 0, "available", "unavailable") AS status
                 FROM products ${where} LIMIT ? OFFSET ?`;
    const paramsForQuery = paramsForCount.concat([limit, offset]);

    db.query(sql, paramsForQuery, (err2, products) => {
      if (err2) return res.status(500).json({ status: 'error', message: err2.message });

      res.json({
        status: 'success',
        products,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          limit
        }
      });
    });
  });
});


app.get('/api/products/:id', (req, res) => {
  db.query('SELECT * FROM products WHERE id = ?', [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ status: 'error', message: err.message });
    if (!results.length) return res.status(404).json({ status: 'error', message: 'Product not found' });
    res.json({ status: 'success', product: results[0] });
  });
});

// ✅ Add new product with optional image upload
app.post('/api/products', upload.single('image'), (req, res) => {
  const { name, price, description, category, stock_quantity } = req.body;
  const image = req.file ? `http://localhost:3000/uploads/${req.file.filename}` : null;

  if (!name || !price) return res.status(400).json({ status: 'error', message: 'Name and price are required.' });

  const sql = `INSERT INTO products (name, price, description, category, stock_quantity, image, is_active)
               VALUES (?, ?, ?, ?, ?, ?, 1)`;
  db.query(sql, [name, price, description, category, stock_quantity || 0, image], (err, result) => {
    if (err) return res.status(500).json({ status: 'error', message: err.message });
    if (stock_quantity && stock_quantity > 0) addInventoryLog(result.insertId, 'Added', stock_quantity);
    res.json({ status: 'success', message: 'Product added successfully', productId: result.insertId, image });
  });
});

app.put('/api/products/:id', (req, res) => {
  const { name, price, description, category, stock_quantity } = req.body;

  // Get current product
  db.query('SELECT * FROM products WHERE id = ?', [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ status: 'error', message: err.message });
    if (!results.length) return res.status(404).json({ status: 'error', message: 'Product not found' });

    const oldProduct = results[0];

    // Update the product
    const sql = `UPDATE products SET name=?, price=?, description=?, category=?, stock_quantity=? WHERE id=?`;
    db.query(sql, [name, price, description, category, stock_quantity, req.params.id], (err2) => {
      if (err2) return res.status(500).json({ status: 'error', message: err2.message });

      // Determine stock change
      const quantityChanged = stock_quantity - oldProduct.stock_quantity;

      // Only create a log if something changed
      if (quantityChanged !== 0 || name !== oldProduct.name || price !== oldProduct.price || description !== oldProduct.description || category !== oldProduct.category) {
        db.query(
          `INSERT INTO inventory_logs (product_id, product_name, change_type, quantity_changed, current_stock)
           VALUES (?, ?, 'Updated', ?, ?)`,
          [req.params.id, name, quantityChanged, stock_quantity],
          (err3) => {
            if (err3) console.error('Inventory log error:', err3.message);
          }
        );
      }

      res.json({ status: 'success', message: 'Product updated successfully' });
    });
  });
});
app.delete('/api/products/:id', (req, res) => {
  const productId = req.params.id;

  // Get product first
  db.query('SELECT * FROM products WHERE id = ?', [productId], (err, results) => {
    if (err) return res.status(500).json({ status: 'error', message: err.message });
    if (!results.length) return res.status(404).json({ status: 'error', message: 'Product not found' });

    const product = results[0];

    // Delete product
    db.query('DELETE FROM products WHERE id = ?', [productId], (err2) => {
      if (err2) return res.status(500).json({ status: 'error', message: err2.message });

      // Log deletion
      db.query(
        `INSERT INTO inventory_logs (product_id, product_name, change_type, quantity_changed, current_stock)
         VALUES (?, ?, 'Deleted', ?, 0)`,
        [productId, product.name, product.stock_quantity],
        (err3) => {
          if (err3) console.error('Failed to log deletion:', err3.message);
          res.json({ status: 'success', message: 'Product deleted successfully' });
        }
      );
    });
  });
});


/* ============================================================
   CART / STOCK LOGIC
============================================================ */
const getOrCreateCartByEmail = (email, callback) => {
  db.query('SELECT id FROM users WHERE email = ?', [email], (err, users) => {
    if (err) return callback(err);
    if (!users.length) return callback(new Error('User not found'));
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

app.get('/api/cart/:email', (req, res) => {
  getOrCreateCartByEmail(req.params.email, (err, cartId) => {
    if (err) return res.status(500).json({ status: 'error', message: err.message });
    const sql = `SELECT ci.id AS cart_item_id, p.id AS product_id, p.name, p.price, p.stock_quantity, ci.quantity
                 FROM cart_items ci JOIN products p ON ci.product_id = p.id WHERE ci.cart_id = ?`;
    db.query(sql, [cartId], (err2, results) => {
      if (err2) return res.status(500).json({ status: 'error', message: err2.message });
      res.json({ status: 'success', cart: results });
    });
  });
});

// ✅ Add to cart WITHOUT affecting stock or inventory log
app.post('/api/cart/add', (req, res) => {
  const { email, product_id, quantity } = req.body;
  const qty = quantity || 1;

  getOrCreateCartByEmail(email, (err, cartId) => {
    if (err) return res.status(500).json({ status: 'error', message: err.message });

    // No stock check here, stock only reduced at checkout
    db.query("SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?", [cartId, product_id], (err3, existing) => {
      if (err3) return res.json({ status: "error", message: err3.message });
      if (existing.length > 0) {
        db.query("UPDATE cart_items SET quantity = ? WHERE id = ?", [existing[0].quantity + qty, existing[0].id]);
      } else {
        db.query("INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)", [cartId, product_id, qty]);
      }
      res.json({ status: "success", message: "Item added to cart" });
    });
  });
});


// ✅ Update cart item with stock adjustment
app.put('/api/cart/update', (req, res) => {
  const { email, product_id, quantity } = req.body;
  if (isNaN(product_id) || isNaN(quantity)) return res.status(400).json({ status: "error", message: "Invalid product_id or quantity" });

  getOrCreateCartByEmail(email, (err, cartId) => {
    if (err) return res.status(500).json({ status: 'error', message: err.message });

    db.query("SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?", [cartId, product_id], (err2, items) => {
      if (err2) return res.json({ status: "error", message: err2.message });
      if (!items.length) return res.json({ status: "error", message: "Cart item not found" });

      const oldQty = items[0].quantity;
      const diff = quantity - oldQty;

      if (diff > 0) {
        db.query("UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ? AND stock_quantity >= ?", [diff, product_id, diff], (err3, result) => {
          if (err3) return res.json({ status: "error", message: err3.message });
          if (result.affectedRows === 0) return res.json({ status: "failed", message: "Not enough stock" });
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

// ✅ Remove cart item with stock restore
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

/* ============================================================
   CHECKOUT
============================================================ */
app.post('/api/checkout', (req, res) => {
  const { email } = req.body;
  getOrCreateCartByEmail(email, (err, cartId) => {
    if (err) return res.json({ status: "error", message: err.message });

    db.query("SELECT * FROM cart_items WHERE cart_id = ?", [cartId], (err2, cartItems) => {
      if (err2) return res.json({ status: "error", message: err2.message });
      if (!cartItems.length) return res.json({ status: "error", message: "Cart is empty" });

      db.query("SELECT id FROM users WHERE email = ?", [email], (err3, users) => {
        if (err3 || !users.length) return res.json({ status: "error", message: "User not found" });
        const userId = users[0].id;

        // Create order
        db.query("INSERT INTO orders (user_id, order_date) VALUES (?, NOW())", [userId], (err4, orderResult) => {
          if (err4) return res.json({ status: "error", message: err4.message });
          const orderId = orderResult.insertId;
          const values = cartItems.map(ci => [orderId, ci.product_id, ci.quantity]);

          db.query("INSERT INTO order_items (order_id, product_id, quantity) VALUES ?", [values], (err5) => {
            if (err5) return res.json({ status: "error", message: err5.message });

            // ✅ Reduce stock and create **merged inventory logs per product**
            const productMap = {}; // productId => total quantity
            cartItems.forEach(ci => {
              if (!productMap[ci.product_id]) productMap[ci.product_id] = 0;
              productMap[ci.product_id] += ci.quantity;
            });

            Object.keys(productMap).forEach(productId => {
              const qty = productMap[productId];
              // Reduce stock
              db.query("UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ? AND stock_quantity >= ?", [qty, productId, qty], (err6) => {
                if (!err6) addInventoryLog(productId, 'Sold', qty); // log once per product
              });
            });

            // Clear cart
            db.query("DELETE FROM cart_items WHERE cart_id = ?", [cartId]);
            res.json({ status: "success", message: "Checkout successful!", orderId });
          });
        });
      });
    });
  });
});


/* ============================================================
   ORDERS
============================================================ */
app.get('/api/orders', (req, res) => {
  db.query(`SELECT o.*, u.full_name AS customer_name FROM orders o
            JOIN users u ON u.id = o.user_id ORDER BY o.order_date DESC`, (err, results) => {
    if (err) return res.json({ status: 'error', message: err.message });
    res.json({ status: 'success', orders: results });
  });
});

app.get('/api/orders/:email', (req, res) => {
  const email = req.params.email;
  db.query(`SELECT o.*, u.full_name AS customer_name FROM orders o
            JOIN users u ON u.id = o.user_id
            WHERE u.email = ? ORDER BY o.order_date DESC`, [email], (err, results) => {
    if (err) return res.json({ status: 'error', message: err.message });
    res.json({ status: 'success', orders: results });
  });
});

app.get('/api/order_items/:orderId', (req, res) => {
  const orderId = req.params.orderId;
  const sql = `SELECT oi.*, p.name AS product_name, p.price
               FROM order_items oi JOIN products p ON p.id = oi.product_id
               WHERE oi.order_id = ?`;
  db.query(sql, [orderId], (err, results) => {
    if (err) return res.status(500).json({ status: 'error', message: err.message });
    res.json({ status: 'success', items: results });
  });
});

app.get('/api/orders/:id/details', (req, res) => {
  const orderId = req.params.id;
  const sql = `SELECT oi.id AS order_item_id, oi.quantity, p.id AS product_id, p.name AS product_name,
               p.price, p.is_active FROM order_items oi JOIN products p ON oi.product_id = p.id
               WHERE oi.order_id = ?`;
  db.query(sql, [orderId], (err, items) => {
    if (err) return res.status(500).json({ status: 'error', message: err.message });
    db.query("SELECT * FROM orders WHERE id = ?", [orderId], (err2, orders) => {
      if (err2) return res.status(500).json({ status: 'error', message: err2.message });
      if (!orders.length) return res.status(404).json({ status: 'error', message: 'Order not found' });
      res.json({ status: 'success', order: orders[0], items });
    });
  });
});

// ✅ Update order status
app.put('/api/orders/:id/status', (req, res) => {
  const { status } = req.body;

  db.query("SELECT status FROM orders WHERE id = ?", [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ status: 'error', message: err.message });
    if (!results.length) return res.status(404).json({ status: 'error', message: 'Order not found' });

    const currentStatus = results[0].status;

    // ❌ Block cancelling delivered orders
    if (currentStatus === 'Delivered' && status === 'Cancelled') {
      return res.json({
        status: 'error',
        message: 'Delivered orders cannot be cancelled'
      });
    }

    db.query(
      "UPDATE orders SET status = ? WHERE id = ?",
      [status, req.params.id],
      (err2) => {
        if (err2) return res.status(500).json({ status: 'error', message: err2.message });

        // Handle inventory & logs
        handleOrderStatusChange(req.params.id, status);

        res.json({ status: 'success', message: 'Order status updated' });
      }
    );
  });
});
function handleOrderStatusChange(orderId, status) {
  db.query(
    `SELECT oi.product_id, oi.quantity, p.name, p.stock_quantity
     FROM order_items oi
     JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = ?`,
    [orderId],
    (err, items) => {
      if (err) return;

      items.forEach(item => {

        if (status === 'Processing') {
          db.query(
            `INSERT INTO inventory_logs 
             (product_id, product_name, change_type, quantity_changed, current_stock)
             VALUES (?, ?, 'Processing Order', ?, ?)`,
            [item.product_id, item.name, item.quantity, item.stock_quantity]
          );
        }

        if (status === 'Delivered') {
          db.query(
            `INSERT INTO inventory_logs 
             (product_id, product_name, change_type, quantity_changed, current_stock)
             VALUES (?, ?, 'Delivered', ?, ?)`,
            [item.product_id, item.name, item.quantity, item.stock_quantity]
          );
        }

        if (status === 'Cancelled') {
          // Restore stock
          db.query(
            "UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?",
            [item.quantity, item.product_id]
          );

          db.query(
            `INSERT INTO inventory_logs 
             (product_id, product_name, change_type, quantity_changed, current_stock)
             VALUES (?, ?, 'Cancelled Order', ?, ?)`,
            [item.product_id, item.name, item.quantity, item.stock_quantity + item.quantity]
          );
        }

      });
    }
  );
}


// ✅ Cancel order with stock restore
app.put('/api/orders/cancel/:orderId', (req, res) => {
  const orderId = req.params.orderId;
  db.query('SELECT * FROM orders WHERE id = ?', [orderId], (err, orders) => {
    if (err) return res.json({ status: 'error', message: err.message });
    if (!orders.length) return res.status(404).json({ status: 'error', message: 'Order not found' });

    db.query('SELECT * FROM order_items WHERE order_id = ?', [orderId], (err2, items) => {
      if (err2) return res.json({ status: 'error', message: err2.message });
      items.forEach(item => db.query('UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?', [item.quantity, item.product_id]));
      db.query('UPDATE orders SET status = "Cancelled" WHERE id = ?', [orderId], (err3) => {
        if (err3) return res.json({ status: 'error', message: err3.message });
        res.json({ status: 'success', message: 'Order cancelled successfully. Stock restored.' });
      });
    });
  });
});

/* ============================================================
   INVENTORY LOGS
============================================================ */
app.get('/api/inventory', (req, res) => {
  db.query(`SELECT il.*, p.name AS product_name, p.stock_quantity AS current_stock
            FROM inventory_logs il
            JOIN products p ON p.id = il.product_id
            ORDER BY il.timestamp DESC`, (err, results) => {
    if (err) return res.json({ status: 'error', message: err.message });
    res.json({ status: 'success', logs: results });
  });
});

app.delete('/api/inventory/clear', (req, res) => {
  db.query('DELETE FROM inventory_logs', (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ status: 'error', message: err.message });
    }
    res.json({ status: 'success', message: 'Inventory cleared successfully' });
  });
});


/* ============================================================
   SALES REPORTS
============================================================ */
app.get('/api/sales-reports', (req, res) => {
  db.query(`SELECT sr.*, u.full_name AS generated_by_name
            FROM sales_reports sr
            JOIN users u ON u.id = sr.generated_by
            ORDER BY sr.date_generated DESC`, (err, results) => {
    if (err) return res.json({ status: 'error', message: err.message });
    res.json({ status: 'success', reports: results });
  });
});

app.listen(3000, () => console.log("🚀 API running at http://localhost:3000"));
