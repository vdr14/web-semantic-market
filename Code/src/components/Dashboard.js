import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styling/Dashboard.css';

const Dashboard = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [stockThreshold, setStockThreshold] = useState(null);
  const navigate = useNavigate();
  const goToInsertProduct = () => {navigate('/insert-products');};

  // Fetch Orders from DB
  useEffect(() => {
    const fetchOrders = async () => {
      const orderQuery = `
        PREFIX base: <http://www.semanticweb.org/My_Super/>
        PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

        SELECT ?orderID ?orderDate ?totalPrice
        WHERE {
          ?order a base:Order ;
                 base:hasOrderID ?orderID ;
                 base:hasOrderDate ?orderDate ;
                 base:hasTotalPrice ?totalPrice .
        }
        ORDER BY DESC(?orderDate)
      `;

      try {
        const response = await axios.get('/repositories/Super_Market', {
          params: { query: orderQuery },
          headers: { 'Accept': 'application/sparql-results+json' },
        });

        if (response.data.results.bindings.length > 0) {
          const ordersData = response.data.results.bindings.map(order => ({
            id: order.orderID.value,
            date: formatDate(order.orderDate.value),
            total: `€${parseFloat(order.totalPrice.value).toFixed(2)}`,
          }));

          setOrders(ordersData);
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
      }
    };

    fetchOrders();
  }, []);

  //Fetch Order Items when clicking an order
  const fetchOrderItems = async (orderID) => {
    setSelectedOrder(orderID);
    
    const orderItemsQuery = `
      PREFIX base: <http://www.semanticweb.org/My_Super/>
      PREFIX gr: <http://purl.org/goodrelations/v1#>

      SELECT ?productName ?quantity
      WHERE {
        ?order a base:Order ;
               base:hasOrderID "${orderID}" ;
               base:hasOrderItem ?orderItem .

        ?orderItem base:hasProduct ?product ;
                   base:hasOrderQuantity ?quantity .

        ?product gr:name ?productName .
      }
    `;

    try {
      const response = await axios.get('/repositories/Super_Market', {
        params: { query: orderItemsQuery },
        headers: { 'Accept': 'application/sparql-results+json' },
      });

      if (response.data.results.bindings.length > 0) {
        const itemsData = response.data.results.bindings.map(item => ({
          productName: item.productName.value,
          quantity: item.quantity.value,
        }));

        setOrderItems(itemsData);
      } else {
        setOrderItems([]); // No items found
      }
    } catch (error) {
      console.error("Error fetching order items:", error);
    }
  };

  //Fetch Inventory from DB
  useEffect(() => {
    const fetchInventory = async () => {
      const inventoryQuery = `
        PREFIX base: <http://www.semanticweb.org/My_Super/>
        PREFIX gr: <http://purl.org/goodrelations/v1#>

        SELECT DISTINCT ?productName ?stock
        WHERE {
          ?product a ?type ;
                   gr:name ?productName ;
                   base:hasStock ?stock .
        }
      `;

      try {
        const response = await axios.get('/repositories/Super_Market', {
          params: { query: inventoryQuery },
          headers: { 'Accept': 'application/sparql-results+json' },
        });

        if (response.data.results.bindings.length > 0) {
          const inventoryData = response.data.results.bindings.map(item => ({
            name: item.productName.value,
            stock: parseInt(item.stock.value, 10),
          }));

          setInventory(inventoryData);
        }
      } catch (error) {
        console.error("Error fetching inventory:", error);
      }
    };

    fetchInventory();
  }, []);

  //Helper Function to Format Date
  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };
  

  // Aggregate orders by date for the bar chart
// Aggregate orders by date for the bar chart
const orderData = orders.reduce((acc, order) => {
  const isoDate = order.date; // Original format (YYYY-MM-DD)
  const formattedDate = new Date(isoDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  const existingEntry = acc.find((entry) => entry.date === formattedDate);
  if (existingEntry) {
    existingEntry.count += 1;
  } else {
    acc.push({ date: formattedDate, isoDate, count: 1 });
  }
  return acc;
}, []);

// Sort orderData by ISO date to maintain proper chronological order
orderData.sort((a, b) => new Date(a.isoDate) - new Date(b.isoDate));


// Sort orderData by date (chronological order)
orderData.sort((a, b) => {
  const [dayA, monthA, yearA] = a.date.split("-").map(Number);
  const [dayB, monthB, yearB] = b.date.split("-").map(Number);
  
  return new Date(yearA, monthA - 1, dayA) - new Date(yearB, monthB - 1, dayB);
});


  return (
    <div className="dashboard-page">
      <h1 className="dashboard-header">Admin Dashboard</h1>

      {/* Orders Chart */}
      <div className="dashboard-overview">
        <div className="chart-container">
          <h2>Orders Per Day</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={orderData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" angle={-45} textAnchor="end" interval="preserveStartEnd" tickMargin={10} />
              <YAxis allowDecimals={false} domain={[0, "dataMax"]} />
              <Tooltip />
              <Bar dataKey="count" fill="#3282fb" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="order-list">
          <h2>Orders</h2>
          <ul>
            {orders.map((order) => (
              <li key={order.id} onClick={() => fetchOrderItems(order.id)} className={`order-item ${selectedOrder === order.id ? 'selected' : ''}`}>
                Order ID: {order.id} - Date: {order.date} - Total: {order.total}
              </li>
            ))}
          </ul>
        </div>
        <div className="product-management">
          <button className="insert-product-btn" onClick={goToInsertProduct}>Insert New Product</button>
        </div>
      </div>

      {/* Selected Order Items */}
      {selectedOrder && (
        <div className="selected-order">
          <h2>Order Items for {selectedOrder}</h2>
          <ul>
            {orderItems.length > 0 ? (
              orderItems.map((item, index) => <li key={index}>{item.quantity} × {item.productName}</li>)
            ) : (
              <p>No items found in this order.</p>
            )}
          </ul>
        </div>
      )}

      {/* Stock Filter */}
      <div className="stock-filter">
        <h2>Low Stock Items</h2>
        <label htmlFor="stock-threshold">Show items with stock </label>
        <input
          type="number"
          id="stock-threshold"
          value={stockThreshold === null ? "" : stockThreshold}
          onChange={(e) => setStockThreshold(e.target.value === "" ? null : Number(e.target.value))}
          min="0"
          placeholder="number"
        />
        <ul>
          {inventory.filter(item => stockThreshold !== null && item.stock <= stockThreshold).map((item, index) => (
            <li key={index}>{item.name} - Stock: {item.stock}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;
