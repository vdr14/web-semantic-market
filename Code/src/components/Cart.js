import React from 'react';
import { useCart } from '../context/CartContext';
import { useUser } from '../context/UserContext';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../styling/Cart.css';

const Cart = () => {
  const { cartItems, addToCart, removeFromCart, clearCart } = useCart();
  const { loggedInUser } = useUser();

  // Υπολογισμός συνολικής τιμής του καλαθιού
  const totalPrice = cartItems.reduce((sum, item) => {
    const price = parseFloat(item.price?.value) || 0;
    const itemCount = parseInt(item.quantity?.value || 1, 10);
    return sum + price * itemCount;
  }, 0);

  const placeOrder = async (currentUser) => {
    try {
      // Έλεγχος αν το καλάθι είναι άδειο
      if (cartItems.length === 0) {
        alert('Your cart is empty. Please add some products before placing an order.');
        return;
      }

      // Έλεγχος αν ο χρήστης είναι συνδεδεμένος
      if (!currentUser || !currentUser.username) {
        alert('You must be logged in to place an order.');
        return;
      }

      // Βήμα 1: Εύρεση του NormalUser instance με βάση το username
      const fetchUserQuery = `
        PREFIX base: <http://www.semanticweb.org/My_Super/>
        PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
  
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

      // Βήμα 2: Ανάκτηση του τρέχοντος stock για τα προϊόντα στο καλάθι
      const productIds = cartItems.map(item => item.productId.value);
      const fetchStocksQuery = `
        PREFIX base: <http://www.semanticweb.org/My_Super/>
        SELECT ?product ?productId ?stock WHERE {
          VALUES ?productId { ${productIds.map(id => `"${id}"`).join(' ')} }
          ?product base:hasProductID ?productId ;
                   base:hasStock ?stock .
        }
      `;

      const stocksResponse = await axios.get('/repositories/Super_Market', {
        params: { query: fetchStocksQuery },
        headers: { 'Accept': 'application/sparql-results+json' },
      });

      const stockMap = {};
      stocksResponse.data.results.bindings.forEach(binding => {
        const productId = binding.productId.value;
        const productUri = binding.product.value;
        const stock = parseInt(binding.stock.value, 10);
        stockMap[productId] = { uri: productUri, stock };
      });

      // Βήμα 3: Ανάκτηση του μέγιστου order ID και order item ID
      const fetchMaxIdsQuery = `
        PREFIX base: <http://www.semanticweb.org/My_Super/>
        PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
  
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

      // Δημιουργία νέου Order ID (π.χ. OR04, OR05)
      const orderId = `Order${maxOrderNumber + 1}`;
      const orderCode = `OR${(maxOrderNumber + 1).toString().padStart(2, '0')}`;
      const orderDate = new Date().toISOString();

      // Base URI
      const baseURI = 'http://www.semanticweb.org/My_Super/';

      // Κατασκευή του SPARQL update query
      let updateQuery = `
        PREFIX base: <http://www.semanticweb.org/My_Super/>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
  
        INSERT DATA {
          <${baseURI}${orderId}> a <${baseURI}Order> ;
                      <${baseURI}hasOrderID> "${orderCode}"^^xsd:string ;
                      <${baseURI}hasOrderDate> "${orderDate}"^^xsd:dateTime ;
                      <${baseURI}hasTotalPrice> "${totalPrice.toFixed(2)}"^^xsd:double ;
                      <${baseURI}isFinalized> "true"^^xsd:boolean ;
                      <${baseURI}hasNormalUser> <${normalUserInstance}> .
      `;

      // Εισαγωγή των order items
      cartItems.forEach((item, index) => {
        const orderItemId = `OrderItem${maxOrderItemNumber + index + 1}`;
        const itemCount = parseInt(item.quantity?.value || 1, 10);
        const totalItemPrice = (parseFloat(item.price?.value) * itemCount).toFixed(2);
        const productUri = stockMap[item.productId.value].uri;

        updateQuery += `
          <${baseURI}${orderId}> <${baseURI}hasOrderItem> <${baseURI}${orderItemId}> .
  
          <${baseURI}${orderItemId}> a <${baseURI}OrderItem> ;
                          <${baseURI}hasOrderItemID> "${orderItemId}"^^xsd:string ;
                          <${baseURI}hasOrderQuantity> "${itemCount}"^^xsd:integer ;
                          <${baseURI}hasOrderPrice> "${totalItemPrice}"^^xsd:double ;
                          <${baseURI}hasProduct> <${productUri}> .
        `;
      });

      updateQuery += `}`;

      // Ενημέρωση του stock και του isAvailable για κάθε προϊόν
      cartItems.forEach(item => {
        const productId = item.productId.value;
        const orderedQuantity = parseInt(item.quantity?.value || 1, 10);
        const { uri: productUri, stock: currentStock } = stockMap[productId];
        const newStock = currentStock - orderedQuantity;
        const newAvailable = newStock > 0 ? "true" : "false"; // Ορισμός του isAvailable

        updateQuery += `
;
DELETE { <${productUri}> base:hasStock ?oldStock . <${productUri}> base:isAvailable ?oldAvailable . }
INSERT { <${productUri}> base:hasStock "${newStock}"^^xsd:integer . <${productUri}> base:isAvailable "${newAvailable}"^^xsd:boolean . }
WHERE { <${productUri}> base:hasStock ?oldStock . <${productUri}> base:isAvailable ?oldAvailable . }
        `;
      });

      console.log('SPARQL Update Query:', updateQuery);

      // Αποστολή του SPARQL query στο GraphDB
      const response = await axios.post(
        '/repositories/Super_Market/statements',
        updateQuery,
        {
          headers: { 'Content-Type': 'application/sparql-update' },
        }
      );

      if (response.status === 204) {
        alert('Order placed successfully!');
        clearCart(); // Καθαρισμός του καλαθιού μετά την επιτυχή παραγγελία
      } else {
        console.error('Failed to place order:', response);
        alert('Failed to place order. Please try again.');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      alert('An error occurred while placing the order. Please try again.');
    }
  };

  // Rendering του component
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