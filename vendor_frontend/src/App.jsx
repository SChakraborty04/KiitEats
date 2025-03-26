import React, { useState, useEffect } from "react";
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

const App = () => {
  const [fcid, setFcid] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [foodCourtName, setFoodCourtName] = useState("");
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [newItem, setNewItem] = useState({ name: "", price: "", quantity: "" });

const handleAddItem = async () => {
  try {
    const res = await fetch(`http://localhost:5000/inventory/${fcid}/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newItem),
    });
    const data = await res.json();

    if (res.ok) {
      alert("✅ Item added successfully!");
      fetchInventory(); // Reload the inventory
      setNewItem({ name: "", price: "", quantity: "" }); // Reset the form
    } else {
      alert(data.error);
    }
  } catch (error) {
    console.error("Error adding item:", error);
    alert("Failed to add item.");
  }
};

  const handleLogin = async () => {
    try {
      const res = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fcid, password }),
      });
      const data = await res.json();

      if (res.ok) {
        setIsLoggedIn(true);
        setFoodCourtName(data.name);
        fetchOrders();
        fetchInventory();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Failed to login. Please try again.");
    }
  };
  const handleUpdateQuantity = async (fooditemId, quantity) => {
    try {
      const res = await fetch(`http://localhost:5000/inventory/${fcid}/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fooditemId, quantity }),
      });
      const data = await res.json();
  
      if (res.ok) {
        alert("✅ Quantity updated successfully!");
        fetchInventory(); // Reload the inventory
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
      alert("Failed to update quantity.");
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch(`http://localhost:5000/orders/${fcid}`);
      const data = await res.json();
      setOrders(data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  const fetchInventory = async () => {
    try {
      const res = await fetch(`http://localhost:5000/inventory/${fcid}`);
      const data = await res.json();
      setInventory(data);
    } catch (error) {
      console.error("Error fetching inventory:", error);
    }
  };
  const handleCompleteOrder = async (orderid, enteredCode) => {
    try {
      const res = await fetch("http://localhost:5000/orders/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderid, uniquecode: enteredCode }),
      });
      const data = await res.json();
  
      if (res.ok) {
        alert("✅ Order completed successfully!");
        fetchOrders(); // Reload the orders to reflect the updated status
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("Error completing order:", error);
      alert("Failed to complete order.");
    }
  };
  const handleRejectOrder = async (orderid) => {
    try {
      const res = await fetch("http://localhost:5000/orders/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderid }),
      });
      const data = await res.json();
  
      if (res.ok) {
        alert("❌ Order rejected successfully!");
  
        // Update the order status in the local state
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.orderid === orderid ? { ...order, status: "cancelled" } : order
          )
        );
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("Error rejecting order:", error);
      alert("Failed to reject order.");
    }
  };
  const handleAcceptOrder = async (orderid) => {
    try {
      const res = await fetch("http://localhost:5000/orders/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderid }),
      });
      const data = await res.json();
  
      if (res.ok) {
        alert("✅ Order accepted successfully!");
  
        // Update the order status in the local state
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.orderid === orderid ? { ...order, status: "accepted" } : order
          )
        );
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("Error accepting order:", error);
      alert("Failed to accept order.");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setFcid("");
    setPassword("");
    setFoodCourtName("");
    setOrders([]);
    setInventory([]);
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ color: "#ff5a3c" }}>KIIT-Eats Vendor Dashboard</h1>

      {!isLoggedIn ? (
        <div>
          <h2>Food Court Login</h2>
          <input
            type="text"
            placeholder="Food Court ID"
            value={fcid}
            onChange={(e) => setFcid(e.target.value)}
            style={{ margin: "10px", padding: "10px", width: "200px" }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ margin: "10px", padding: "10px", width: "200px" }}
          />
          <button
            onClick={handleLogin}
            style={{
              background: "#ff5a3c",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Login
          </button>
        </div>
      ) : (
        <div>
          <h2>Welcome, {foodCourtName}</h2>
          <button
            onClick={handleLogout}
            style={{
              background: "#444",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "5px",
              cursor: "pointer",
              marginBottom: "20px",
            }}
          >
            Logout
          </button>

          <h3>Orders</h3>
          <table border="1" style={{ width: "100%", marginBottom: "20px" }}>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Item Name</th> {/* New column for item name */}
              <th>Quantity</th>
              <th>Status</th>
              <th>Unique Code</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
          {orders.map((order) => (
            <tr key={order.orderid}>
              <td>{order.orderid}</td>
              <td>{order.itemName}</td> {/* Display the item name */}
              <td>{order.quantity}</td>
              <td>{order.status}</td>
              <td>
                {order.status === "accepted" && (
                  <input
                    type="text"
                    placeholder="Enter Unique Code"
                    id={`code-${order.orderid}`}
                    style={{ padding: "5px" }}
                  />
                )}
              </td>
              <td>
                {order.status === "pending" ? (
                  <>
                    <button
                      onClick={() => handleAcceptOrder(order.orderid)}
                      style={{
                        background: "#4caf50",
                        color: "white",
                        border: "none",
                        padding: "5px 10px",
                        borderRadius: "5px",
                        cursor: "pointer",
                        marginRight: "5px",
                      }}
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleRejectOrder(order.orderid)}
                      style={{
                        background: "#f44336",
                        color: "white",
                        border: "none",
                        padding: "5px 10px",
                        borderRadius: "5px",
                        cursor: "pointer",
                      }}
                    >
                      Reject
                    </button>
                  </>
                ) : order.status === "accepted" ? (
                  <button
                    onClick={() =>
                      handleCompleteOrder(
                        order.orderid,
                        document.getElementById(`code-${order.orderid}`).value
                      )
                    }
                    style={{
                      background: "#2196f3",
                      color: "white",
                      border: "none",
                      padding: "5px 10px",
                      borderRadius: "5px",
                      cursor: "pointer",
                    }}
                  >
                    Complete
                  </button>
                ) : (
                  <span style={{ color: "gray" }}>No Actions</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
          </table>
          <h3>Inventory</h3>
            <table border="1" style={{ width: "100%", marginBottom: "20px" }}>
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Quantity</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((item, index) => (
                  <tr key={index}>
                    <td>{item.name}</td>
                    <td>
                      <input
                        type="number"
                        defaultValue={item.quantity}
                        onBlur={(e) => handleUpdateQuantity(item.id, e.target.value)}
                        style={{ padding: "5px", width: "80px" }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3>Add New Item</h3>
            <div style={{ marginBottom: "20px" }}>
              <input
                type="text"
                placeholder="Item Name"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                style={{ margin: "5px", padding: "5px", width: "150px" }}
              />
              <input
                type="number"
                placeholder="Price"
                value={newItem.price}
                onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                style={{ margin: "5px", padding: "5px", width: "100px" }}
              />
              <input
                type="number"
                placeholder="Quantity"
                value={newItem.quantity}
                onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                style={{ margin: "5px", padding: "5px", width: "100px" }}
              />
              <button
                onClick={handleAddItem}
                style={{
                  background: "#ff5a3c",
                  color: "white",
                  border: "none",
                  padding: "5px 10px",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
              >
                Add Item
              </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default App;
