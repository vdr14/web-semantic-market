# Super Market Web Application

A React-based e-commerce application that integrates a **GraphDB RDF database** for managing product data using SPARQL queries. The platform supports user authentication, product browsing, cart management, and order processing.

---

## 🚀 Getting Started

### 1️⃣ **Setup the Database**
1. Run the Python script to generate RDF data:
   ```sh
   python Products.py
   ```
2. Upload the generated **`Products.ttl`** and **`Shacl_shapes`** files to **GraphDB**.
3. Start the GraphDB server to enable the database.

---

### 2️⃣ **Install Dependencies**
Navigate to the project folder and install the required dependencies:
```sh
yarn install
```

---

### 3️⃣ **Run the Application**
Start the development server:
```sh
yarn start
```
The application will be accessible at: `http://localhost:3000`

---

## 🏷️ Default Users
The application comes with preconfigured user accounts:

### **👤 Normal User**
- **Username:** `user`
- **Password:** `password`

### **👑 Admin User**
- **Username:** `admin`
- **Password:** `password`

Admins have access to the **Dashboard** for managing products and orders.

---

## 📌 Features
✅ **Semantic Search:** Uses SPARQL queries for product searches.
✅ **User Authentication:** Secure login system for customers and admins.
✅ **Shopping Cart & Orders:** Customers can add products to the cart and place orders.
✅ **GraphDB Integration:** Uses RDF & SPARQL for managing product data.
✅ **Admin Dashboard:** Allows product insertion and inventory management.

---

## 🛠️ Tech Stack
- **Frontend:** React.js, Context API, React Router
- **Backend:** GraphDB (SPARQL Queries)
- **Database:** RDF Triple Store (Turtle Format)
- **Styling:** CSS
- **Package Manager:** Yarn

---

## 📜 License
This project is for educational purposes. Modify and extend as needed. 😊

