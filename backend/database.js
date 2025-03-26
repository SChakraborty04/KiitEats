const sqlite3 = require("sqlite3").verbose();

// Create or open the SQLite database
const db = new sqlite3.Database("./kiiteats.db", (err) => {
  if (err) {
    console.error("❌ Error opening database:", err.message);
  } else {
    console.log("✅ Connected to SQLite database.");

    // Create user_otps table
    db.run(`
      CREATE TABLE IF NOT EXISTS user_otps (
        userId INTEGER PRIMARY KEY AUTOINCREMENT,
        userMail TEXT UNIQUE NOT NULL,
        otp TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        expiresAt TEXT NOT NULL
      )
    `);

    // Create foodcourts table
    db.run(`
      CREATE TABLE IF NOT EXISTS foodcourts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        loc TEXT NOT NULL,
        coordinates TEXT NOT NULL,
        timings TEXT,
        popular_items TEXT
      )
    `);

    // Create fooditems table
    db.run(`
      CREATE TABLE IF NOT EXISTS fooditems (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price REAL NOT NULL
      )
    `);

    

    // Create fooditem_quantities table (junction table)
    db.run(`
      CREATE TABLE IF NOT EXISTS fooditem_quantities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fooditem_id INTEGER NOT NULL,
        foodcourt_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        FOREIGN KEY (fooditem_id) REFERENCES fooditems (id),
        FOREIGN KEY (foodcourt_id) REFERENCES foodcourts (id)
      )
    `);

    // Insert fooditem_quantities data
    

    // Create orders table
    db.run(`
        CREATE TABLE IF NOT EXISTS orders (
          orderid INTEGER PRIMARY KEY AUTOINCREMENT,
          userid INTEGER NOT NULL,
          foodid INTEGER NOT NULL,
          foodcourtid INTEGER NOT NULL,
          quantity INTEGER NOT NULL,
          payment TEXT CHECK(payment IN ('pending', 'completed')) NOT NULL,
          status TEXT CHECK(status IN ('cancelled', 'pending', 'accepted', 'completed')) NOT NULL,
          uniquecode TEXT NOT NULL,
          date TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
          FOREIGN KEY (userid) REFERENCES user_otps (userId),
          FOREIGN KEY (foodid) REFERENCES fooditems (id),
          FOREIGN KEY (foodcourtid) REFERENCES foodcourts (id)
        )
      `);

    // Create favorites table
    db.run(`
      CREATE TABLE IF NOT EXISTS favorites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        fooditem_id INTEGER NOT NULL,
        foodcourt_id INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES user_otps (userId),
        FOREIGN KEY (fooditem_id) REFERENCES fooditems (id),
        FOREIGN KEY (foodcourt_id) REFERENCES foodcourts (id)
      )
    `);



    console.log("✅ Tables created and data inserted successfully.");
  }
});

module.exports = db;