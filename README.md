
# 🛒 E-Commerce Backend API

This is a **Node.js/Express backend API** for an e-commerce system with products, cart, orders, checkout, inventory logs, and sales reports. It uses **MySQL** for the database, **Multer** for image uploads, and **bcrypt** for password hashing.

---

## 🔹 Features

- **User Authentication**
  - Register and login
  - Password hashing with bcrypt
  - Role-based redirect (customer, owner/business)
  
- **Products**
  - CRUD operations
  - Optional image upload
  - Stock tracking with inventory logs
  
- **Cart**
  - Add, update, remove items
  - Stock is managed at checkout
  - Cart auto-creation by user email

- **Checkout & Orders**
  - Create orders from cart items
  - Stock reduction and inventory logging
  - Order status update (Pending, Processing, Delivered, Cancelled)
  - Cancel order with stock restoration

- **Inventory & Sales Reports**
  - Inventory logs with changes
  - Clear inventory logs
  - Sales reports with generator info

---

## 🔹 Technologies

- **Node.js** & **Express**
- **MySQL**
- **bcrypt** for password hashing
- **Multer** for file/image uploads
- **CORS** and **body-parser**
- RESTful API design

---

## 🔹 Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/ecommerce-backend.git
cd ecommerce-backend
````

2. **Install dependencies**

```bash
npm install
```

3. **Configure database**

* Create a MySQL database
* Import `schema.sql` (your tables)
* Update `db.js` with your database credentials

4. **Create uploads folder**

```bash
mkdir uploads
```

5. **Run the server**

```bash
node server.js
# or
nodemon server.js
```

Server will run at: `http://localhost:3000`

---

## 🔹 API Endpoints

### **Auth**

* `POST /api/register` – Register new user
* `POST /api/login` – Login user

### **Products**

* `GET /api/products` – List products with filters
* `GET /api/products/:id` – Get product by ID
* `POST /api/products` – Add product (image optional)
* `PUT /api/products/:id` – Update product
* `DELETE /api/products/:id` – Delete product

### **Cart**

* `GET /api/cart/:email` – Get user's cart
* `POST /api/cart/add` – Add item to cart
* `PUT /api/cart/update` – Update cart item
* `DELETE /api/cart/remove/:email/:productId` – Remove item from cart

### **Checkout & Orders**

* `POST /api/checkout` – Checkout cart and create order
* `GET /api/orders` – All orders
* `GET /api/orders/:email` – User orders
* `GET /api/orders/:id/details` – Specific order with items
* `PUT /api/orders/:id/status` – Update order status
* `PUT /api/orders/cancel/:orderId` – Cancel order

### **Inventory & Sales**

* `GET /api/inventory` – View inventory logs
* `DELETE /api/inventory/clear` – Clear logs
* `GET /api/sales-reports` – Get sales reports

---

## 🔹 Folder Structure

```
ecommerce-backend/
│
├─ uploads/              # Product images
├─ db.js                 # MySQL connection
├─ server.js              # Main Express server
├─ package.json          # Dependencies
└─ README.md
```

---

## 🔹 Notes

* **Stock Management:** Stock is reduced only at checkout, not on adding items to cart.
* **Inventory Logs:** Logs are created on product add/update/delete and checkout.
* **Authentication:** No JWT yet, just session-less login responses (can be extended).

---

## 🔹 License

This project is open-source under the **MIT License**.

