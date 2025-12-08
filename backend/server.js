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

// Get all active products (customers only see active ones)
app.get('/api/products', (req, res) => {
  db.query(
    'SELECT *, IF(stock_quantity > 0, "available", "unavailable") AS status FROM products WHERE is_active = 1',
    (err, results) => {
      if (err) return res.status(500).json({ status: 'error', message: err.message });
      res.json({ status: 'success', products: results });
    }
  );
});

// Get single product by ID
app.get('/api/products/:id', (req, res) => {
  db.query('SELECT * FROM products WHERE id = ?', [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ status: 'error', message: err.message });
    if (!results.length) return res.status(404).json({ status: 'error', message: 'Product not found' });
    res.json({ status: 'success', product: results[0] });
  });
});

// Add new product
app.post('/api/products', (req, res) => {
  const { name, price, description, category, stock_quantity } = req.body;
  if (!name || !price) return res.status(400).json({ status: 'error', message: 'Name and price are required.' });

  const sql = `INSERT INTO products (name, price, description, category, stock_quantity, is_active) VALUES (?, ?, ?, ?, ?, 1)`;
  db.query(sql, [name, price, description, category, stock_quantity || 0], (err, result) => {
    if (err) return res.status(500).json({ status: 'error', message: err.message });
    res.json({ status: 'success', message: 'Product added successfully', productId: result.insertId });
  });
});

// Update product
app.put('/api/products/:id', (req, res) => {
  const productId = req.params.id;
  const { name, price, description, category, stock_quantity } = req.body;
  const sql = `UPDATE products SET name=?, price=?, description=?, category=?, stock_quantity=? WHERE id=?`;
  db.query(sql, [name, price, description, category, stock_quantity, productId], (err) => {
    if (err) return res.status(500).json({ status: 'error', message: err.message });
    res.json({ status: 'success', message: 'Product updated successfully' });
  });
});

// Soft-delete product (mark as inactive)
app.delete('/api/products/:id', (req, res) => {
  const productId = req.params.id;
  db.query('UPDATE products SET is_active = 0 WHERE id = ?', [productId], (err, result) => {
    if (err) return res.status(500).json({ status: 'error', message: err.message });
    if (result.affectedRows === 0)
      return res.status(404).json({ status: 'error', message: 'Product not found' });
    res.json({ status: 'success', message: 'Product marked as unavailable' });
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

app.put('/api/cart/update', (req, res) => {
  const { email, product_id, quantity } = req.body;

  if (isNaN(product_id) || isNaN(quantity)) {
    return res.status(400).json({ status: "error", message: "Invalid product_id or quantity" });
  }

  getOrCreateCartByEmail(email, (err, cartId) => {
    if (err) return res.status(500).json({ status: 'error', message: err.message });

    db.query("SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?", [cartId, product_id], (err2, items) => {
      if (err2) return res.json({ status: "error", message: err2.message });
      if (!items.length) return res.json({ status: "error", message: "Cart item not found" });

      const oldQty = items[0].quantity;
      const diff = quantity - oldQty;

      if (diff > 0) {
        db.query(
          "UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ? AND stock_quantity >= ?",
          [diff, product_id, diff],
          (err3, result) => {
            if (err3) return res.json({ status: "error", message: err3.message });
            if (result.affectedRows === 0)
              return res.json({ status: "failed", message: "Not enough stock" });

            db.query("UPDATE cart_items SET quantity = ? WHERE id = ?", [quantity, items[0].id]);
            res.json({ status: "success" });
          }
        );
      } else {
        const restore = Math.abs(diff);
        db.query("UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?", [restore, product_id]);
        db.query("UPDATE cart_items SET quantity = ? WHERE id = ?", [quantity, items[0].id]);
        res.json({ status: "success" });
      }
    });
  });
});


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

    // 1. Get cart items
    db.query("SELECT * FROM cart_items WHERE cart_id = ?", [cartId], (err2, cartItems) => {
      if (err2) return res.json({ status: "error", message: err2.message });
      if (!cartItems.length) return res.json({ status: "error", message: "Cart is empty" });

      // 2. Get user_id
      db.query("SELECT id FROM users WHERE email = ?", [email], (err3, users) => {
        if (err3 || !users.length) return res.json({ status: "error", message: "User not found" });
        const userId = users[0].id;

        // 3. Create order
        db.query("INSERT INTO orders (user_id, order_date) VALUES (?, NOW())", [userId], (err4, orderResult) => {
          if (err4) return res.json({ status: "error", message: err4.message });
          const orderId = orderResult.insertId;

          // 4. Move cart_items to order_items
          const values = cartItems.map(ci => [orderId, ci.product_id, ci.quantity]);
          db.query("INSERT INTO order_items (order_id, product_id, quantity) VALUES ?", [values], (err5) => {
            if (err5) return res.json({ status: "error", message: err5.message });

            // 5. Clear cart
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
  db.query(`
    SELECT o.*, u.full_name AS customer_name
    FROM orders o
    JOIN users u ON u.id = o.user_id
    ORDER BY o.order_date DESC
  `, (err, results) => {
    if(err) return res.json({status:'error', message: err.message});
    res.json({status:'success', orders: results});
  });
});
// GET orders by customer email
app.get('/api/orders/:email', (req, res) => {
  const email = req.params.email;

  db.query(`
    SELECT o.*, u.full_name AS customer_name
    FROM orders o
    JOIN users u ON u.id = o.user_id
    WHERE u.email = ?
    ORDER BY o.order_date DESC
  `, [email], (err, orders) => {
    if (err) return res.json({ status: 'error', message: err.message });

    if (!orders.length) return res.json({ status: 'success', orders: [] });

    // Fetch items for each order
    const orderIds = orders.map(o => o.id);
    const sqlItems = `
      SELECT oi.*, p.name AS product_name, p.price, p.is_active
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id IN (?)
    `;
    db.query(sqlItems, [orderIds], (err2, items) => {
      if (err2) return res.json({ status: 'error', message: err2.message });

      // Map items to orders
      const ordersWithItems = orders.map(order => ({
        ...order,
        items: items.filter(i => i.order_id === order.id)
      }));

      res.json({ status: 'success', orders: ordersWithItems });
    });
  });
});

// GET order items by order ID
app.get('/api/order_items/:orderId', (req, res) => {
  const orderId = req.params.orderId;

  const sql = `
    SELECT oi.*, p.name AS product_name, p.price
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id = ?
  `;

  db.query(sql, [orderId], (err, results) => {
    if (err) return res.status(500).json({ status: 'error', message: err.message });
    res.json({ status: 'success', items: results });
  });
});
// GET single order with all items (includes product's is_active)
app.get('/api/orders/:id/details', (req, res) => {
  const orderId = req.params.id;

  const sql = `
    SELECT oi.id AS order_item_id, oi.quantity, p.id AS product_id, p.name AS product_name,
           p.price, p.is_active
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = ?
  `;

  db.query(sql, [orderId], (err, items) => {
    if (err) return res.status(500).json({ status: 'error', message: err.message });

    const orderSql = `SELECT * FROM orders WHERE id = ?`;
    db.query(orderSql, [orderId], (err2, orders) => {
      if (err2) return res.status(500).json({ status: 'error', message: err2.message });
      if (!orders.length) return res.status(404).json({ status: 'error', message: 'Order not found' });

      res.json({
        status: 'success',
        order: orders[0],
        items: items
      });
    });
  });
});

// ============================================================
//   CANCEL ORDER
// ============================================================
app.put('/api/orders/cancel/:orderId', (req, res) => {
  const orderId = req.params.orderId;

  // 1. Check if order exists
  db.query('SELECT * FROM orders WHERE id = ?', [orderId], (err, orders) => {
    if (err) return res.json({ status: 'error', message: err.message });
    if (orders.length === 0)
      return res.status(404).json({ status: 'error', message: 'Order not found' });

    // 2. Get the items of the order
    db.query('SELECT * FROM order_items WHERE order_id = ?', [orderId], (err2, items) => {
      if (err2) return res.json({ status: 'error', message: err2.message });

      // 3. Restore the product stock
      if (items.length > 0) {
        items.forEach(item => {
          db.query(
            'UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?',
            [item.quantity, item.product_id]
          );
        });
      }

      // 4. Update order status to CANCELLED
      db.query(
        'UPDATE orders SET status = "Cancelled" WHERE id = ?',
        [orderId],
        (err3) => {
          if (err3) return res.json({ status: 'error', message: err3.message });

          return res.json({
            status: 'success',
            message: 'Order cancelled successfully. Stock restored.'
          });
        }
      );
    });
  });
});


/* ============================================================
   INVENTORY LOGS
============================================================ */
app.get('/api/inventory', (req, res) => {
  db.query(`
    SELECT il.*, p.name AS product_name, p.stock_quantity AS current_stock
    FROM inventory_logs il
    JOIN products p ON p.id = il.product_id
    ORDER BY il.timestamp DESC
  `, (err, results) => {
    if(err) return res.json({status:'error', message: err.message});
    res.json({status:'success', logs: results});
  });
});


/* ============================================================
   SALES REPORTS
============================================================ */
app.get('/api/sales-reports', (req, res) => {
  db.query(`
    SELECT sr.*, u.full_name AS generated_by_name
    FROM sales_reports sr
    JOIN users u ON u.id = sr.generated_by
    ORDER BY sr.date_generated DESC
  `, (err, results) => {
    if(err) return res.json({status:'error', message: err.message});
    res.json({status:'success', reports: results});
  });
});

app.listen(3000, () => console.log("🚀 API running at http://localhost:3000"));
