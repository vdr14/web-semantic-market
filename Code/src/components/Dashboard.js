import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import '../styling/Dashboard.css';

const Dashboard = () => {
  const [selectedOrder, setSelectedOrder] = useState(null); // State for the selected order
  const [stockThreshold, setStockThreshold] = useState(null); // State for the stock filter

  const orders = [
    { id: 'OR01', date: '2025-02-01', items: ['Fresh Bananas (1kg)', 'Whole Grain Bread'], total: '€45.99' },
    { id: 'OR02', date: '2025-02-02', items: ['Free Range Eggs (12pcs)', 'Chicken Breast (500g)'], total: '€78.50' },
    { id: 'OR03', date: '2025-02-03', items: ['Pasta Spaghetti (500g)', 'Tomato Sauce (400ml)'], total: '€12.00' },
    { id: 'OR04', date: '2025-02-03', items: ['Parmesan Cheese (200g)', 'Italian Basil (Fresh)'], total: '€15.00' },
  ];

  const inventory = [
    { name: 'Fresh Bananas (1kg)', stock: 5 },
    { name: 'Whole Grain Bread', stock: 2 },
    { name: 'Organic Almond Milk', stock: 1 },
    { name: 'Greek Feta Cheese', stock: 8 },
    { name: 'Free Range Eggs (12pcs)', stock: 10 },
    { name: 'Chicken Breast (500g)', stock: 3 },
    { name: 'Broccoli (1 head)', stock: 0 },
    { name: 'Extra Virgin Olive Oil (500ml)', stock: 4 },
    { name: 'Pasta Spaghetti (500g)', stock: 7 },
    { name: 'Tomato Sauce (400ml)', stock: 6 },
    { name: 'Parmesan Cheese (200g)', stock: 2 },
    { name: 'Italian Basil (Fresh)', stock: 9 },
  ];

  // Aggregate orders by date for the bar chart
  const orderData = orders.reduce((acc, order) => {
    const existingEntry = acc.find((entry) => entry.date === order.date);
    if (existingEntry) {
      existingEntry.count += 1; // Increment count for existing date
    } else {
      acc.push({ date: order.date, count: 1 }); // Add new date with initial count
    }
    return acc;
  }, []);

  // Handle stock threshold change
  const handleStockChange = (e) => {
    const value = e.target.value === "" ? null : Number(e.target.value);
    setStockThreshold(value);
  };

  return (
    <div className="dashboard-page">
      {/* Admin Dashboard Header */}
      <h1 className="dashboard-header">Admin Dashboard</h1>

      {/* Orders Chart */}
      <div className="dashboard-overview">
        <div className="chart-container">
          <h2>Orders Per Day (Last Month)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={orderData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3282fb" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="order-list">
          <h2>Orders</h2>
          <ul>
            {orders.map((order) => (
              <li
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className={`order-item ${selectedOrder?.id === order.id ? 'selected' : ''}`}
              >
                Order ID: {order.id} - Date: {order.date} - Total: {order.total}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Selected Order Items */}
      {selectedOrder && (
        <div className="selected-order">
          <h2>Order Items for {selectedOrder.id}</h2>
          <ul>
            {selectedOrder.items.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
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
          value={stockThreshold === null ? "" : stockThreshold} // Display empty string if null
          onChange={handleStockChange}
          min="0"
          placeholder="number"
        />
        <ul>
          {inventory
            .filter((item) => stockThreshold !== null && item.stock <= stockThreshold)
            .map((item, index) => (
              <li key={index}>
                {item.name} - Stock: {item.stock}
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;
