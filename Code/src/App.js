import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Categories from './components/Categories';
import Subcategories from './components/Subcategories';
import Products from './components/Products';
import ProductDetails from './components/ProductDetails';
import AccountDetails from './components/AccountDetails';
import Dashboard from './components/Dashboard';
import Account from './components/Account';
import Cart from './components/Cart';
import { CartProvider } from './context/CartContext';
import { UserProvider } from './context/UserContext'; // Import the UserProvider
import './App.css';

function App() {
  return (
    <UserProvider> {/* Wrap the entire app in UserProvider */}
      <CartProvider>
        <Router>
          <div className="App">
            <Header /> {/* Header can now access logged-in user info */}
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
              <Route path="/cart" element={<Cart />} />
            </Routes>
          </div>
        </Router>
      </CartProvider>
    </UserProvider>
  );
}

export default App;
