require("dotenv").config();
const cors = require("cors");
const express = require("express");
const db = require("../database"); // Import SQLite database
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const app = express();

app.use(express.json());

app.use(cors());

// **Nodemailer Setup**
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// **Generate Random OTP**
function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

// **Send OTP Email**
async function sendOTPEmail(userMail, otp) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userMail,
    subject: "Your OTP for Sign-In",
    text: `Your OTP is ${otp}. It is valid for 1 hour.`,
  };
  await transporter.sendMail(mailOptions);
}

// **Sign-In API**
app.post("/signin", async (req, res) => {
  const { userMail } = req.body;

  if (!userMail) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    // Generate OTP
    const otp = generateOTP();
    const createdAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1-hour expiry

    // Check if the user already exists
    db.get("SELECT * FROM user_otps WHERE userMail = ?", [userMail], async (err, row) => {
      if (err) {
        console.error("❌ Database Error:", err.message);
        return res.status(500).json({ message: "Database error" });
      }

      if (row) {
        // Update existing OTP
        db.run("UPDATE user_otps SET otp = ?, createdAt = ?, expiresAt = ? WHERE userMail = ?",
          [otp, createdAt, expiresAt, userMail],
          async (updateErr) => {
            if (updateErr) {
              console.error("❌ Error updating OTP:", updateErr.message);
              return res.status(500).json({ message: "Failed to update OTP" });
            }
            await sendOTPEmail(userMail, otp);
            res.json({ message: "OTP updated and sent successfully" });
          }
        );
      } else {
        // Insert new user and OTP
        db.run("INSERT INTO user_otps (userMail, otp, createdAt, expiresAt) VALUES (?, ?, ?, ?)",
          [userMail, otp, createdAt, expiresAt],
          async (insertErr) => {
            if (insertErr) {
              console.error("❌ Error inserting OTP:", insertErr.message);
              return res.status(500).json({ message: "Failed to insert OTP" });
            }
            await sendOTPEmail(userMail, otp);
            res.json({ message: "OTP generated and sent successfully" });
          }
        );
      }
    });
  } catch (error) {
    console.error("❌ Error processing sign-in:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// **Verify OTP API**
app.post("/verify-otp", (req, res) => {
  const { userMail, otp } = req.body;

  if (!userMail || !otp) {
    return res.status(400).json({ message: "Email and OTP are required" });
  }

  db.get(
    "SELECT * FROM user_otps WHERE userMail = ? AND otp = ? AND expiresAt > ?",
    [userMail, otp, new Date().toISOString()],
    (err, row) => {
      if (err) {
        console.error("❌ Database Error:", err.message);
        return res.status(500).json({ message: "Database error" });
      }

      if (!row) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }

      res.json({ message: "OTP verified successfully" });
    }
  );
});
//Food map
app.get("/foodcourts", (req, res) => {
  db.all(
    `
    SELECT 
      id, 
      name, 
      loc AS location, 
      coordinates
    FROM foodcourts
    `,
    (err, rows) => {
      if (err) {
        console.error("❌ Database Error:", err.message);
        return res.status(500).json({ message: "Failed to fetch food courts" });
      }

      res.json({ foodCourts: rows });
    }
  );
});
// **Recent Orders API**
app.get("/dashboard/recent-orders", (req, res) => {
  const userMail = req.query.userMail;

  if (!userMail) {
    return res.status(400).json({ message: "User email is required" });
  }

  db.all(
    `
    SELECT 
      orders.*, 
      fooditems.name AS foodName, 
      foodcourts.name AS foodCourtName, 
      foodcourts.coordinates AS foodCourtCoordinates
    FROM orders
    JOIN user_otps ON orders.userid = user_otps.userId
    JOIN fooditems ON orders.foodid = fooditems.id
    JOIN foodcourts ON orders.foodcourtid = foodcourts.id
    WHERE user_otps.userMail = ?
    ORDER BY orders.orderid DESC LIMIT 5
    `,
    [userMail],
    (err, rows) => {
      if (err) {
        console.error("❌ Database Error:", err.message);
        return res.status(500).json({ message: "Database error" });
      }

      res.json({ recentOrders: rows });
    }
  );
});

// **Favorites API**
app.get("/dashboard/favorites", (req, res) => {
  const userMail = req.query.userMail;

  if (!userMail) {
    return res.status(400).json({ message: "User email is required" });
  }

  db.all(
    `
    SELECT 
      fooditems.name AS foodName, 
      SUM(orders.quantity) AS totalQuantity
    FROM orders
    JOIN user_otps ON orders.userid = user_otps.userId
    JOIN fooditems ON orders.foodid = fooditems.id
    WHERE user_otps.userMail = ?
    GROUP BY fooditems.name
    ORDER BY totalQuantity DESC
    `,
    [userMail],
    (err, rows) => {
      if (err) {
        console.error("❌ Database Error:", err.message);
        return res.status(500).json({ message: "Database error" });
      }

      res.json({ favorites: rows });
    }
  );
});

// **Dashboard Stats API**
app.get("/dashboard/stats", (req, res) => {
  const userMail = req.query.userMail;

  if (!userMail) {
    return res.status(400).json({ message: "User email is required" });
  }

  db.get(
    `
    SELECT 
      (SELECT COUNT(*) FROM orders WHERE userid = (SELECT userId FROM user_otps WHERE userMail = ?)) AS totalOrders,
      (SELECT COUNT(*) FROM orders WHERE userid = (SELECT userId FROM user_otps WHERE userMail = ?) AND status = 'pending') AS pendingOrders,
      (SELECT COUNT(*) FROM favorites WHERE user_id = (SELECT userId FROM user_otps WHERE userMail = ?)) AS favoriteItems,
      (SELECT COUNT(DISTINCT foodcourts.id) 
       FROM favorites 
       JOIN foodcourts ON favorites.foodcourt_id = foodcourts.id
       WHERE favorites.user_id = (SELECT userId FROM user_otps WHERE userMail = ?)) AS savedRestaurants
    `,
    [userMail, userMail, userMail, userMail],
    (err, row) => {
      if (err) {
        console.error("❌ Database Error:", err.message);
        return res.status(500).json({ message: "Database error" });
      }

      res.json({ stats: row });
    }
  );
});

// **User Info API**
app.get("/user-info", (req, res) => {
  const userMail = req.query.userMail;

  if (!userMail) {
    return res.status(400).json({ message: "User email is required" });
  }

  db.get(
    "SELECT userId, userMail FROM user_otps WHERE userMail = ?",
    [userMail],
    (err, row) => {
      if (err) {
        console.error("❌ Database Error:", err.message);
        return res.status(500).json({ message: "Database error" });
      }

      if (!row) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ user: row });
    }
  );
});

// **Order History API**
app.get("/dashboard/history", (req, res) => {
  const userMail = req.query.userMail;

  if (!userMail) {
    return res.status(400).json({ message: "User email is required" });
  }

  db.all(
    `
    SELECT orders.*, fooditems.name AS foodName, foodcourts.name AS foodCourtName
    FROM orders
    JOIN user_otps ON orders.userid = user_otps.userId
    JOIN fooditems ON orders.foodid = fooditems.id
    JOIN foodcourts ON orders.foodcourtid = foodcourts.id
    WHERE user_otps.userMail = ?
    AND orders.status IN ('completed', 'cancelled')
    ORDER BY orders.date DESC
    `,
    [userMail],
    (err, rows) => {
      if (err) {
        console.error("❌ Database Error:", err.message);
        return res.status(500).json({ message: "Database error" });
      }

      res.json({ history: rows });
    }
  );
});

// **Orders API**
app.get("/dashboard/orders", (req, res) => {
  const userMail = req.query.userMail;

  if (!userMail) {
    return res.status(400).json({ message: "User email is required" });
  }

  db.all(
    `
    SELECT orders.*, fooditems.name AS foodName, foodcourts.name AS foodCourtName
    FROM orders
    JOIN user_otps ON orders.userid = user_otps.userId
    JOIN fooditems ON orders.foodid = fooditems.id
    JOIN foodcourts ON orders.foodcourtid = foodcourts.id
    WHERE user_otps.userMail = ?
    ORDER BY orders.date DESC
    `,
    [userMail],
    (err, rows) => {
      if (err) {
        console.error("❌ Database Error:", err.message);
        return res.status(500).json({ message: "Database error" });
      }

      res.json({ orders: rows });
    }
  );
});

app.get("/explore/foodcourts", (req, res) => {
  db.all(
    `
    SELECT 
      fc.id, 
      fc.name, 
      fc.loc AS location, 
      fc.coordinates, 
      '8 AM - 8 PM' AS timings, -- Constant timings for all food courts
      GROUP_CONCAT(DISTINCT fi.name) AS popularItems -- Ensure unique food items
    FROM foodcourts fc
    LEFT JOIN orders o ON fc.id = o.foodcourtid
    LEFT JOIN fooditems fi ON o.foodid = fi.id
    GROUP BY fc.id
    `,
    (err, rows) => {
      if (err) {
        console.error("❌ Database Error:", err.message);
        return res.status(500).json({ message: "Database error" });
      }

      res.json({ foodCourts: rows });
    }
  );
});
app.get("/explore/foodcourt/:id", (req, res) => {
  const foodCourtId = req.params.id;

  db.get(
    `
    SELECT 
      id, 
      name, 
      loc AS location, 
      coordinates, 
      '8 AM - 8 PM' AS timings
    FROM foodcourts
    WHERE id = ?
    `,
    [foodCourtId],
    (err, foodCourt) => {
      if (err) {
        console.error("❌ Database Error:", err.message);
        return res.status(500).json({ message: "Database error" });
      }

      if (!foodCourt) {
        return res.status(404).json({ message: "Food court not found" });
      }

      db.all(
        `
        SELECT 
        fi.id, 
        fi.name, 
        fi.price, 
        fq.quantity
      FROM fooditem_quantities fq
      JOIN fooditems fi ON fq.fooditem_id = fi.id
      WHERE fq.foodcourt_id = ?
        `,
        [foodCourtId],
        (err, foodItems) => {
          if (err) {
            console.error("❌ Database Error:", err.message);
            return res.status(500).json({ message: "Database error" });
          }

          res.json({ foodCourt, foodItems });
        }
      );
    }
  );
});
app.get("/explore/fooditems", (req, res) => {
  const foodCourtArea = req.query.area; // Get the food court area from query params

  let query = `
    SELECT 
      fi.id, 
      fi.name, 
      fi.price, 
      fq.quantity, 
      fc.id AS foodCourtId, -- Include foodCourtId
      fc.loc AS foodCourtArea
    FROM fooditem_quantities fq
    JOIN fooditems fi ON fq.fooditem_id = fi.id
    JOIN foodcourts fc ON fq.foodcourt_id = fc.id
  `;

  const params = [];

  // If a specific area is provided, filter by it
  if (foodCourtArea) {
    query += ` WHERE fc.loc = ?`;
    params.push(foodCourtArea);
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error("❌ Database Error:", err.message);
      return res.status(500).json({ message: "Database error" });
    }

    res.json({ foodItems: rows });
  });
});

app.post("/orders", (req, res) => {
  const { userMail, items, payment, status } = req.body;

  if (!userMail || !items || items.length === 0) {
    return res.status(400).json({ message: "User email and cart items are required" });
  }

  // Fetch the userId from the userMail
  db.get("SELECT userId FROM user_otps WHERE userMail = ?", [userMail], (err, row) => {
    if (err) {
      console.error("❌ Database Error:", err.message);
      return res.status(500).json({ message: "Database error" });
    }

    if (!row) {
      return res.status(404).json({ message: "User not found" });
    }

    const userId = row.userId; // Extract userId
    const uniqueCode = crypto.randomBytes(4).toString("hex");

    const queries = items.map(
      (item) =>
        new Promise((resolve, reject) => {
          // Insert the order into the orders table
          db.run(
            `
            INSERT INTO orders (userid, foodid, foodcourtid, quantity, payment, status, uniquecode)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `,
            [
              userId, // Use the fetched userId
              item.id, // Food Item ID
              item.foodCourtId, // Food Court ID
              item.quantity, // Quantity
              payment, // Payment Status
              status, // Order Status
              uniqueCode, // Unique Code
            ],
            (err) => {
              if (err) {
                reject(err);
              } else {
                // Reduce the quantity in the fooditem_quantities table
                db.run(
                  `
                  UPDATE fooditem_quantities
                  SET quantity = quantity - ?
                  WHERE fooditem_id = ? AND foodcourt_id = ?
                `,
                  [item.quantity, item.id, item.foodCourtId],
                  (updateErr) => {
                    if (updateErr) {
                      reject(updateErr);
                    } else {
                      resolve();
                    }
                  }
                );
              }
            }
          );
        })
    );

    Promise.all(queries)
      .then(() => res.json({ message: "Order placed successfully" }))
      .catch((err) => {
        console.error("❌ Error placing order:", err.message);
        res.status(500).json({ message: "Failed to place order" });
      });
  });
});

app.get("/orders", (req, res) => {
  const { userMail } = req.query;

  if (!userMail) {
    return res.status(400).json({ message: "User email is required" });
  }

  db.all(
    `
    SELECT 
      o.orderid, 
      o.quantity, 
      o.payment, 
      o.status, 
      o.date, 
      o.uniquecode, 
      fi.name AS foodName, 
      fc.name AS foodCourtName, 
      fc.coordinates AS foodCourtCoordinates
    FROM orders o
    JOIN fooditems fi ON o.foodid = fi.id
    JOIN foodcourts fc ON o.foodcourtid = fc.id
    WHERE o.userid = (SELECT userId FROM user_otps WHERE userMail = ?)
    ORDER BY o.date DESC
  `,
    [userMail],
    (err, rows) => {
      if (err) {
        console.error("Error fetching orders:", err.message);
        return res.status(500).json({ message: "Failed to fetch orders" });
      }

      res.json({ orders: rows });
    }
  );
});

//Vendor
// Login route
app.post("/login", (req, res) => {
  const { fcid, password } = req.body;
  
  db.get("SELECT * FROM foodcourts WHERE id = ?", [fcid], (err, row) => {
    if (err || !row) {
      return res.status(401).json({ error: "Invalid Food Court ID" });
    }
    
    if (password !== "admin123") { // Replace with hashed password in production
      return res.status(401).json({ error: "Incorrect Password" });
    }

    res.json({ message: "Login successful", fcid: row.id, name: row.name });
  });
});

// Get orders for a specific food court
// Get orders for a specific food court
app.get("/orders/:fcid", (req, res) => {
  const { fcid } = req.params;

  db.all(
    `
    SELECT 
      orders.orderid,
      orders.quantity,
      orders.status,
      orders.uniquecode,
      fooditems.name AS itemName
    FROM orders
    JOIN fooditems ON orders.foodid = fooditems.id
    WHERE orders.foodcourtid = ?
    `,
    [fcid],
    (err, rows) => {
      if (err) {
        console.error("❌ Database Error:", err.message);
        return res.status(500).json({ error: "Failed to fetch orders" });
      }

      res.json(rows);
    }
  );
});

// Get inventory for a specific food court
app.get("/inventory/:fcid", (req, res) => {
  const { fcid } = req.params;
  db.all("SELECT fooditems.name, fooditems.id, fooditem_quantities.quantity FROM fooditem_quantities JOIN fooditems ON fooditem_quantities.fooditem_id = fooditems.id WHERE fooditem_quantities.foodcourt_id = ?", [fcid], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// Accept order
app.post("/orders/accept", (req, res) => {
  const { orderid } = req.body;

  if (!orderid) {
    return res.status(400).json({ error: "Order ID is required" });
  }

  // Check if the order exists
  db.get("SELECT * FROM orders WHERE orderid = ?", [orderid], (err, order) => {
    if (err) {
      console.error("❌ Database Error:", err.message);
      return res.status(500).json({ error: "Database error" });
    }

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Mark the order as accepted
    db.run("UPDATE orders SET status = 'accepted' WHERE orderid = ?", [orderid], (updateErr) => {
      if (updateErr) {
        console.error("❌ Error updating order:", updateErr.message);
        return res.status(500).json({ error: "Failed to accept order" });
      }

      res.json({ message: "Order accepted successfully" });
    });
  });
});

// Reject order
app.post("/orders/reject", (req, res) => {
  const { orderid } = req.body;
  
  db.run("UPDATE orders SET status = 'cancelled' WHERE orderid = ?", [orderid], (updateErr) => {
    if (updateErr) {
      return res.status(500).json({ error: updateErr.message });
    }
    res.json({ message: "Order rejected successfully" });
  });
});
// Complete order
app.post("/orders/complete", (req, res) => {
  const { orderid, uniquecode } = req.body;

  if (!orderid || !uniquecode) {
    return res.status(400).json({ error: "Order ID and unique code are required" });
  }

  // Check if the order exists and the unique code matches
  db.get("SELECT * FROM orders WHERE orderid = ?", [orderid], (err, order) => {
    if (err) {
      console.error("❌ Database Error:", err.message);
      return res.status(500).json({ error: "Database error" });
    }

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.uniquecode !== uniquecode) {
      return res.status(400).json({ error: "Invalid unique code" });
    }

    // Mark the order as completed
    db.run("UPDATE orders SET status = 'completed' WHERE orderid = ?", [orderid], (updateErr) => {
      if (updateErr) {
        console.error("❌ Error updating order:", updateErr.message);
        return res.status(500).json({ error: "Failed to complete order" });
      }

      res.json({ message: "Order completed successfully" });
    });
  });
});
// Add a new item to the inventory
app.post("/inventory/:fcid/add", (req, res) => {
  const { fcid } = req.params;
  const { name, price, quantity } = req.body;

  if (!name || !price || !quantity) {
    return res.status(400).json({ error: "Name, price, and quantity are required" });
  }

  // Insert the new item into the fooditems table and link it to the food court
  db.run(
    `
    INSERT INTO fooditems (name, price)
    VALUES (?, ?)
    `,
    [name, price],
    function (err) {
      if (err) {
        console.error("❌ Error adding item:", err.message);
        return res.status(500).json({ error: "Failed to add item" });
      }

      const fooditemId = this.lastID; // Get the ID of the newly inserted food item

      db.run(
        `
        INSERT INTO fooditem_quantities (fooditem_id, foodcourt_id, quantity)
        VALUES (?, ?, ?)
        `,
        [fooditemId, fcid, quantity],
        (err) => {
          if (err) {
            console.error("❌ Error linking item to inventory:", err.message);
            return res.status(500).json({ error: "Failed to link item to inventory" });
          }

          res.json({ message: "Item added to inventory successfully" });
        }
      );
    }
  );
});
// Update the quantity of an existing item in the inventory
app.put("/inventory/:fcid/update", (req, res) => {
  const { fcid } = req.params;
  const { fooditemId, quantity } = req.body;

  if (!fooditemId || !quantity) {
    return res.status(400).json({ error: "Food item ID and quantity are required" });
  }

  db.run(
    `
    UPDATE fooditem_quantities
    SET quantity = ?
    WHERE fooditem_id = ? AND foodcourt_id = ?
    `,
    [quantity, fooditemId, fcid],
    (err) => {
      if (err) {
        console.error("❌ Error updating quantity:", err.message);
        return res.status(500).json({ error: "Failed to update quantity" });
      }

      res.json({ message: "Quantity updated successfully" });
    }
  );
});
// **Start Server**
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
