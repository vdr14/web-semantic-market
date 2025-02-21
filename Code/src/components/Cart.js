import React from 'react';
import { useCart } from '../context/CartContext';
import { useUser } from '../context/UserContext';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../styling/Cart.css';

const Cart = () => {
  const { cartItems, addToCart, removeFromCart, clearCart } = useCart();
  const { loggedInUser } = useUser();

  // Calculate total price of the cart based on quantity
  const totalPrice = cartItems.reduce((sum, item) => {
    const price = parseFloat(item.price?.value) || 0; // Default to 0 if undefined
    const itemCount = parseInt(item.quantity?.value || 1, 10); // Default quantity to 1 if undefined
    return sum + price * itemCount;
  }, 0);

  const placeOrder = async (currentUser) => {
    try {
      if (cartItems.length === 0) {
        alert('Your cart is empty. Please add some products before placing an order.');
        return;
      }
  
      if (!currentUser || !currentUser.username) {
        alert('You must be logged in to place an order.');
        return;
      }
  
      // Step 1: Find the NormalUser instance linked to the username
      const fetchUserQuery = `
        PREFIX base: <http://www.semanticweb.org/My_Super/>
        PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
        PREFIX rdf: <http://www.w3.org/1999/02/rdf-syntax-ns#>
  
        SELECT ?user WHERE {
          ?user a base:NormalUser ;
                base:hasUsername "${currentUser.username}"^^xsd:string .
        }
      `;
  
      const userResponse = await axios.get('/repositories/Super_Market', {
        params: { query: fetchUserQuery },
        headers: { 'Accept': 'application/sparql-results+json' },
      });
  
      if (!userResponse.data.results.bindings.length || !userResponse.data.results.bindings[0].user) {
        alert('User not found or invalid response from the database.');
        return;
      }
  
      const normalUserInstance = userResponse.data.results.bindings[0].user.value;
      console.log('Normal User Instance:', normalUserInstance);
  
      // Step 2: Fetch the highest order ID and order item ID from the database
      const fetchMaxIdsQuery = `
        PREFIX base: <http://www.semanticweb.org/My_Super/>
        PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
        PREFIX rdf: <http://www.w3.org/1999/02/rdf-syntax-ns#>
  
        SELECT 
          (MAX(?orderNumber) AS ?maxOrderNumber)
          (MAX(?orderItemNumber) AS ?maxOrderItemNumber)
        WHERE {
          ?order a base:Order ;
                 base:hasOrderID ?orderID .
          BIND(xsd:integer(SUBSTR(?orderID, 3)) AS ?orderNumber) .
  
          ?orderItem a base:OrderItem ;
                     base:hasOrderItemID ?orderItemID .
          BIND(xsd:integer(SUBSTR(?orderItemID, 10)) AS ?orderItemNumber) .
        }
      `;
  
      const maxIdsResponse = await axios.get('/repositories/Super_Market', {
        params: { query: fetchMaxIdsQuery },
        headers: { 'Accept': 'application/sparql-results+json' },
      });
  
      let maxOrderNumber = 0;
      let maxOrderItemNumber = 0;
  
      if (maxIdsResponse.data.results.bindings.length > 0) {
        maxOrderNumber = parseInt(maxIdsResponse.data.results.bindings[0]?.maxOrderNumber?.value || "0", 10);
        maxOrderItemNumber = parseInt(maxIdsResponse.data.results.bindings[0]?.maxOrderItemNumber?.value || "0", 10);
      }
  
      console.log('Max Order Number:', maxOrderNumber);
      console.log('Max Order Item Number:', maxOrderItemNumber);
  
      // Generate sequential Order ID (OR04, OR05, etc.)
      const orderId = `Order${maxOrderNumber + 1}`;
      const orderCode = `OR${(maxOrderNumber + 1).toString().padStart(2, '0')}`;
      const orderDate = new Date().toISOString();
  
      // Base URI
      const baseURI = 'http://www.semanticweb.org/My_Super/';
  
      // Construct SPARQL query for inserting the new order
      let query = `
        PREFIX base: <http://www.semanticweb.org/My_Super/>
        PREFIX rdf: <http://www.w3.org/1999/02/rdf-syntax-ns#>
        PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
  
        INSERT DATA {
          <${baseURI}${orderId}> a <${baseURI}Order> ;
                      <${baseURI}hasOrderID> "${orderCode}"^^xsd:string ;
                      <${baseURI}hasOrderDate> "${orderDate}"^^xsd:dateTime ;
                      <${baseURI}hasTotalPrice> "${totalPrice.toFixed(2)}"^^xsd:double ;
                      <${baseURI}isFinalized> "true"^^xsd:boolean ;
                      <${baseURI}hasNormalUser> <${normalUserInstance}> .
      `;
  
      cartItems.forEach((item, index) => {
        if (!item.productId?.value) {
          console.error(`Missing productId for item at index ${index}:`, item);
          alert('Error: One or more items in the cart have missing product IDs.');
          return;
        }
  
        const orderItemId = `OrderItem${maxOrderItemNumber + index + 1}`;
        const itemCount = parseInt(item.quantity?.value || 1, 10);
        const totalItemPrice = (parseFloat(item.price?.value) * itemCount).toFixed(2);
        const ProductUri = item.name?.value.replace(/\s/g, '_');
  
        query += `

          <${baseURI}${orderId}> <${baseURI}hasOrderItem> <${baseURI}${orderItemId}> .
  
          <${baseURI}${orderItemId}> a <${baseURI}OrderItem> ;
                          <${baseURI}hasOrderItemID> "${orderItemId}"^^xsd:string ;
                          <${baseURI}hasOrderQuantity> "${itemCount}"^^xsd:integer ;
                          <${baseURI}hasOrderPrice> "${totalItemPrice}"^^xsd:double ;
                          <${baseURI}hasProduct> <${baseURI}${ProductUri}> .
        `;
      });
      
      query +=`}`;
      console.log('SPARQL Query:', query);

      // Send SPARQL query to GraphDB
      const response = await axios.post(
        '/repositories/Super_Market/statements',
        query,
        {
          headers: { 'Content-Type': 'application/sparql-update' },
        }
      );
  
      if (response.status === 204) {
        alert('Order placed successfully!');
        clearCart(); // Clear cart after successful order
      } else {
        console.error('Failed to place order:', response);
        alert('Failed to place order. Please try again.');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      alert('An error occurred while placing the order. Please try again.');
    }
  };
  

  if (!loggedInUser) {
    return (
      <div className="cart-container">
        <div className="cart-top">
          <h2>Your Shopping Cart</h2>
        </div>
        <div className="cart-empty">
          <p>
            Login to start shopping. <Link to="/account">Click here to log in</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <div className="cart-top">
        <h2>Your Shopping Cart</h2>
      </div>
      {cartItems.length === 0 ? (
        <div className="cart-empty">
          <p>Your cart is empty. <Link to="/">Continue shopping</Link></p>
        </div>
      ) : (
        <>
          <div className="cart-items">
            {cartItems.map((item, index) => (
              <div key={index} className="cart-item">
                <div>
                  <h3>
                    {item.name?.value} <span className="item-quantity">x{item.quantity?.value || 1}</span>
                  </h3>
                  <p>Price (per item): {item.price?.value} €</p>
                  <p>Brand: {item.brand?.value}</p>
                </div>
                <div className="quantity-buttons">
                  <button
                    className="increase-button"
                    onClick={() =>
                      addToCart({
                        name: item.name?.value,
                        price: item.price?.value,
                        brand: item.brand?.value,
                        productId: item.productId?.value,
                        stock: item.stock?.value,
                        available: item.available?.value,
                      })
                    }
                  >
                    +
                  </button>
                  <button
                    className="decrease-button"
                    onClick={() => removeFromCart(item.productId?.value)}
                  >
                    -
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="total-price">
            <h3>Total Price: {totalPrice.toFixed(2)} €</h3>
          </div>
          <div className="cart-buttons">
            <button className="place-order-button" onClick={() => placeOrder(loggedInUser)}>
              Place Order
            </button>
            <button className="empty-cart-button" onClick={() => clearCart()}>
              Empty Cart
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;
