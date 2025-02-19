import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styling/Header.css';
import { useCart } from '../context/CartContext';
import { useUser } from '../context/UserContext';

const Header = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { getTotalItemsCount, clearCart } = useCart();
  const { loggedInUser, setLoggedInUser } = useUser();

  const handleSearch = async (e) => {
    if (e.key === 'Enter' && searchQuery.trim() !== '') {
      try {
        const query = `
          PREFIX base: <http://www.semanticweb.org/My_Super/>
          PREFIX gr: <http://purl.org/goodrelations/v1#>

          SELECT ?instance ?name ?brand ?price ?discountPrice ?productId 
                 ?quantity ?stock ?available
          WHERE {
            ?instance gr:name ?name ;
                      base:hasBrand ?brand ;
                      base:hasPrice ?price ;
                      base:hasDiscountPrice ?discountPrice ;
                      base:hasProductID ?productId ;
                      base:hasQuantity ?quantity ;
                      base:hasStock ?stock ;
                      base:isAvailable ?available .
            FILTER(CONTAINS(LCASE(?name), LCASE("${searchQuery.trim()}")))
          }
        `;

        const response = await axios.get('/repositories/Super_Market', {
          params: { query },
          headers: { 'Accept': 'application/sparql-results+json' },
        });

        const products = response.data.results.bindings.map((item) => ({
          instance: item.instance?.value,
          name: item.name?.value,
          brand: item.brand?.value,
          price: item.price?.value,
          discountPrice: item.discountPrice?.value,
          productId: item.productId?.value,
          quantity: item.quantity?.value,
          stock: item.stock?.value,
          available: item.available?.value === 'true',
        }));

        if (products.length > 0) {
          navigate('/product-details', { state: { products, keyword: searchQuery.trim() } });
        } else {
          alert(`No products found for "${searchQuery.trim()}".`);
        }
      } catch (error) {
        console.error('Error fetching search results:', error);
        alert('An error occurred while searching. Please try again.');
      }

      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('loggedInUser'); // Clear logged-in user from localStorage
    setLoggedInUser(null); // Update the global state
    clearCart(); // Clear the cart when the user logs out
    navigate('/'); // Redirect to the homepage
  };

  return (
    <header className="header">
      {/* Logo Section */}
      <div
        className="logo clickable"
        onClick={() => navigate('/')}
        role="button"
        tabIndex={0}
        onKeyUp={(e) => e.key === 'Enter' && navigate('/')}
      >
        <i className="fa-solid fa-cart-shopping"></i>
        <span>My Super</span>
      </div>

      {/* Search Section */}
      <div className="search">
        <i className="fa-solid fa-magnifying-glass"></i>
        <input
          type="text"
          placeholder="Search products..."
          aria-label="Search products"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearch}
        />
      </div>

      {/* Account Section */}
      {loggedInUser ? (
        <div className="user-logged-in">
          <span
            onClick={() =>
              navigate(loggedInUser.role === "customer" ? "/account-details" : "/dashboard")
            }
            role="button"
            tabIndex={0}
            onKeyDown={(e) =>
              e.key === 'Enter' &&
              navigate(loggedInUser.role === "customer" ? "/account-details" : "/dashboard")
            }
          >
            {loggedInUser.username}
          </span>
          <button onClick={handleLogout}>Log Out</button>
        </div>
      ) : (
        <div
          className="account clickable"
          onClick={() => navigate('/account')}
          role="button"
          tabIndex={0}
          onKeyUp={(e) => e.key === 'Enter' && navigate('/account')}
        >
          <span>Account</span>
          <i className="fa-solid fa-circle-user"></i>
        </div>
      )}

      {/* Cart Section */}
      <div className="cart-header-container">
        <div
          className="cart clickable"
          onClick={() => navigate('/cart')}
          role="button"
          tabIndex={0}
          onKeyUp={(e) => e.key === 'Enter' && navigate('/cart')}
        >
          <span>Cart</span>
          <i className="fa-solid fa-bag-shopping"></i>
        </div>
        {getTotalItemsCount() > 0 && <span className="cart-badge">{getTotalItemsCount()}</span>}
      </div>
    </header>
  );
};

export default Header;
