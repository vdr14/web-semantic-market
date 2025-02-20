import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Categories from './components/Categories';
import Subcategories from './components/Subcategories';
import Products from './components/Products';
import ProductDetails from './components/ProductDetails';
import AccountDetails from './components/AccountDetails';
import Dashboard from './components/Dashboard';
import InsertProduct from './components/InsertProducts';
import Account from './components/Account';
import Cart from './components/Cart';
import { CartProvider } from './context/CartContext';
import { UserProvider } from './context/UserContext';
import './App.css';

function App() {
  return (
    <UserProvider>
      <CartProvider>
        <Router>
          <div className="App">
            <Header />
            <Routes>
              <Route path="/" element={<Categories />} />
              <Route path="/subcategories/:category" element={<Subcategories />} />
              <Route path="/products/:subcategory" element={<Products />} />
              <Route path="/products" element={<Products />} />
              <Route path="/product-details" element={<ProductDetails />} />
              <Route path="/product-details/:productName" element={<ProductDetails />} />
              <Route path="/account" element={<Account />} />
              <Route path="/account-details" element={<AccountDetails />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/insert-products" element={<InsertProduct />} />
              <Route path="/cart" element={<Cart />} />
            </Routes>
          </div>
        </Router>
      </CartProvider>
    </UserProvider>
  );
}

export default App;
