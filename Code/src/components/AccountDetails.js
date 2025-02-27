import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styling/AccountDetails.css';
import { useUser } from '../context/UserContext';

const AccountDetails = () => {
  const { loggedInUser } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [userDetails, setUserDetails] = useState({});
  const [editedDetails, setEditedDetails] = useState({ ...userDetails });
  const [addresses, setAddresses] = useState([]);
  const [editingAddress, setEditingAddress] = useState(null);
  const [orders, setOrders] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Define addressQuery outside of useEffect so it can be reused
  const addressQuery = `
    PREFIX base: <http://www.semanticweb.org/My_Super/>
    SELECT ?address WHERE {
      ?user a base:NormalUser ;
            base:hasUsername "${loggedInUser?.username}" ;
            base:hasAddress ?address .
    }
  `;

  // Handle input changes for personal details
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedDetails((prev) => ({ ...prev, [name]: value }));
  };

  // Save updated name and surname
  const saveChanges = async () => {
    const updateQuery = `
      PREFIX base: <http://www.semanticweb.org/My_Super/>
      DELETE {
        ?user base:hasName ?oldName ;
              base:hasSurname ?oldSurname .
      }
      INSERT {
        ?user base:hasName "${editedDetails.name}" ;
              base:hasSurname "${editedDetails.surname}" .
      }
      WHERE {
        ?user a base:NormalUser ;
              base:hasUsername "${loggedInUser.username}" ;
              base:hasName ?oldName ;
              base:hasSurname ?oldSurname .
      }
    `;

    try {
      await axios.post('/repositories/Super_Market/statements', updateQuery, {
        headers: { 'Content-Type': 'application/sparql-update' },
      });

      setUserDetails({ ...editedDetails });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating user details:", error);
    }
  };

  // Handle editing an address
  const handleEditAddress = (index) => {
    setEditingAddress(index);
  };

  // Save edited address
  const saveEditedAddress = async (index) => {
    const updatedAddress = addresses[index];

    const updateQuery = `
      PREFIX base: <http://www.semanticweb.org/My_Super/>
      DELETE {
        ?user base:hasAddress ?oldAddress .
      }
      INSERT {
        ?user base:hasAddress "${updatedAddress}" .
      }
      WHERE {
        ?user a base:NormalUser ;
              base:hasUsername "${loggedInUser.username}" ;
              base:hasAddress ?oldAddress .
      }
    `;

    try {
      await axios.post('/repositories/Super_Market/statements', updateQuery, {
        headers: { 'Content-Type': 'application/sparql-update' },
      });

      // Refresh addresses after saving
      const addressResponse = await axios.get('/repositories/Super_Market', {
        params: { query: addressQuery },
        headers: { 'Accept': 'application/sparql-results+json' },
      });

      if (addressResponse.data.results.bindings.length > 0) {
        const addressList = addressResponse.data.results.bindings.map((row) => row.address.value);
        setAddresses(addressList);
      }

      setEditingAddress(null);
    } catch (error) {
      console.error("Error updating address:", error);
    }
  };

  // Fetch order details
  const fetchOrderDetails = async (orderID) => {
    setIsModalOpen(true);
    setSelectedOrder(orderID);

    const detailsQuery = `
      PREFIX base: <http://www.semanticweb.org/My_Super/>
      PREFIX gr: <http://purl.org/goodrelations/v1#>

      SELECT ?productName ?quantity ?price
      WHERE {
        ?order a base:Order ;
               base:hasOrderID "${orderID}" ;
               base:hasOrderItem ?orderItem .
        ?orderItem base:hasProduct ?product ;
                   base:hasOrderQuantity ?quantity ;
                   base:hasOrderPrice ?price .
        ?product gr:name ?productName .
      }
    `;

    try {
      const response = await axios.get('/repositories/Super_Market', {
        params: { query: detailsQuery },
        headers: { 'Accept': 'application/sparql-results+json' },
      });

      if (response.data.results.bindings.length > 0) {
        const detailsData = response.data.results.bindings.map(item => ({
          productName: item.productName.value,
          quantity: item.quantity.value,
          price: parseFloat(item.price.value).toFixed(2),
        }));
        setOrderDetails(detailsData);
      } else {
        setOrderDetails([]);
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
    }
  };

  // Fetch user details and addresses
  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!loggedInUser) return;

      setIsLoading(true); // Start loading

      const userQuery = `
        PREFIX base: <http://www.semanticweb.org/My_Super/>
        SELECT ?name ?surname WHERE {
          ?user a base:NormalUser ;
                base:hasUsername "${loggedInUser.username}" ;
                base:hasName ?name ;
                base:hasSurname ?surname .
        }
      `;

      try {
        // Fetch user details
        const userResponse = await axios.get('/repositories/Super_Market', {
          params: { query: userQuery },
          headers: { 'Accept': 'application/sparql-results+json' },
        });

        if (userResponse.data.results.bindings.length > 0) {
          const result = userResponse.data.results.bindings[0];
          setUserDetails({
            name: result.name.value,
            surname: result.surname.value,
          });
          setEditedDetails({
            name: result.name.value,
            surname: result.surname.value,
          });
        }

        // Fetch addresses
        const addressResponse = await axios.get('/repositories/Super_Market', {
          params: { query: addressQuery },
          headers: { 'Accept': 'application/sparql-results+json' },
        });

        if (addressResponse.data.results.bindings.length > 0) {
          const addressList = addressResponse.data.results.bindings.map((row) => row.address.value);
          setAddresses(addressList);
        }
      } catch (error) {
        console.error("Error fetching user details or addresses:", error);
      } finally {
        setIsLoading(false); // Stop loading
      }
    };

    fetchUserDetails();
  }, [loggedInUser, addressQuery]);

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      if (!loggedInUser) return;

      setIsLoading(true); // Start loading

      const orderQuery = `
        PREFIX base: <http://www.semanticweb.org/My_Super/>
        PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

        SELECT ?orderID ?orderDate ?isFinalized ?totalPrice
        WHERE {
          ?order a base:Order ;
                 base:hasOrderID ?orderID ;
                 base:hasOrderDate ?orderDate ;
                 base:isFinalized ?isFinalized ;
                 base:hasTotalPrice ?totalPrice ;
                 base:hasNormalUser <http://www.semanticweb.org/My_Super/${loggedInUser.userInstance}> .
        }
        ORDER BY DESC(?orderDate)
      `;

      try {
        const response = await axios.get('/repositories/Super_Market', {
          params: { query: orderQuery },
          headers: { 'Accept': 'application/sparql-results+json' },
        });

        console.log("🔹 Orders Response:", response.data); // Debugging

        if (response.data.results.bindings.length > 0) {
          const ordersData = response.data.results.bindings.map(order => ({
            orderID: order.orderID.value,
            orderDate: formatDate(order.orderDate.value),
            isFinalized: order.isFinalized.value === "true" ? "Delivered" : "Pending",
            totalPrice: parseFloat(order.totalPrice.value).toFixed(2),
          }));

          setOrders(ordersData);
        } else {
          console.error("❌ No orders found for user:", loggedInUser.username);
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setIsLoading(false); // Stop loading
      }
    };

    fetchOrders();
  }, [loggedInUser]);

  // Format date
  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  if (isLoading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="account-details-page">
      <h1>My Account</h1>

      <div className="account-details-grid">
        {/* Personal Details Section */}
        <div className="personal-details card">
          <h2>Personal Details</h2>
          <div className="info-box">
            {isEditing ? (
              <>
                <p><strong>Name:</strong> <input type="text" name="name" value={editedDetails.name} onChange={handleChange} /></p>
                <p><strong>Surname:</strong> <input type="text" name="surname" value={editedDetails.surname} onChange={handleChange} /></p>
                <div className="button-group">
                  <button className="save-button" onClick={saveChanges}>Save</button>
                  <button className="cancel-button" onClick={() => setIsEditing(false)}>Cancel</button>
                </div>
              </>
            ) : (
              <>
                <p><strong>Name:</strong> {userDetails.name}</p>
                <p><strong>Surname:</strong> {userDetails.surname}</p>
                <button className="edit-button" onClick={() => setIsEditing(true)}>Edit Profile</button>
              </>
            )}
          </div>
        </div>

        {/* Order History Section */}
        <div className="order-history card">
          <h2>Order History</h2>
          {orders.length > 0 ? (
            orders.map((order, index) => (
              <div className="order-card" key={index}>
                <p><strong>Order ID:</strong> {order.orderID}</p>
                <p><strong>Date:</strong> {order.orderDate}</p>
                <p><strong>Status:</strong> {order.isFinalized}</p>
                <p><strong>Total:</strong> {order.totalPrice} €</p>
                <button className="details-button" onClick={() => fetchOrderDetails(order.orderID)}>View Details</button>
              </div>
            ))
          ) : (
            <p>No orders found.</p>
          )}
        </div>

        {/* Order Details Modal */}
        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>Order Details (ID: {selectedOrder})</h2>
              {orderDetails.length > 0 ? (
                <div className="order-details-container">
                  <table className="order-details-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th>Price (€)</th>
                      </tr>
                      </thead>
                    <tbody>
                      {orderDetails.map((item, index) => (
                        <tr key={index}>
                          <td>{item.productName}</td>
                          <td>{item.quantity}</td>
                          <td>{item.price}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>No products found in this order.</p>
              )}
              <button className="close-button" onClick={() => setIsModalOpen(false)}>Close</button>
            </div>
          </div>
        )}

        {/* Saved Addresses Section */}
        <div className="saved-addresses card">
          <h2>Saved Addresses</h2>
          {addresses.map((address, index) => (
            <div className="address-item" key={index}>
              {editingAddress === index ? (
                <>
                  <p><strong>Home address:</strong></p>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => {
                      const updatedAddresses = [...addresses];
                      updatedAddresses[index] = e.target.value;
                      setAddresses(updatedAddresses);
                    }}
                  />
                  <div className="button-group">
                    <button className="save-button" onClick={() => saveEditedAddress(index)}>Save</button>
                    <button className="cancel-button" onClick={() => setEditingAddress(null)}>Cancel</button>
                  </div>
                </>
              ) : (
                <>
                  <p><strong>Home address:</strong> {address}</p>
                  <button className="edit-button" onClick={() => handleEditAddress(index)}>Edit Address</button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AccountDetails;