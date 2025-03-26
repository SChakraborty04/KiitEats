const db = require("./database");

// Insert foodcourts data
const foodcourtsData = [
  ["Food court 1", "QC enclave", "20.352682034437876, 85.81917948767007"],
  ["Food court 2", "Mechanical", "20.352157737184907, 85.81976216860303"],
  ["Food court 3", "Law", "20.362261582040848, 85.82316449561576"],
  ["Food court 4", "KP7", "20.350916691832182, 85.81591689311402"],
  ["Food court 6", "Civil", "20.353531149925736, 85.8179594628798"],
  ["Food court 7", "CSE", "20.349210635922113, 85.81566558852401"],
  ["Food court 8", "Electronics", "20.357345720828132, 85.81990989561565"],
  ["Food court 9", "MBA", "20.34939167293087, 85.82018836977099"],
  ["Food court 10", "KIMS", "20.3512417482653, 85.81414119008953"],
];

foodcourtsData.forEach(([name, loc, coordinates]) => {
  db.run(
    `INSERT INTO foodcourts (name, loc, coordinates) VALUES (?, ?, ?)`,
    [name, loc, coordinates],
    (err) => {
      if (err) {
        console.error("❌ Error inserting foodcourt:", err.message);
      }
    }
  );
});

// Insert fooditems data
const fooditemsData = [
  ["Green Lays", 20],
  ["Blue Lays", 20],
  ["Coffee", 30],
  ["Tea", 20],
  ["Hot Chocolate", 50],
  ["Chicken Patties", 40],
  ["Paneer Patties", 35],
  ["Brownies", 60],
  ["Cup Cakes", 50],
  ["Caffe Mocha", 70],
  ["Cold Coffee", 60],
];

fooditemsData.forEach(([name, price]) => {
  db.run(
    `INSERT INTO fooditems (name, price) VALUES (?, ?)`,
    [name, price],
    (err) => {
      if (err) {
        console.error("❌ Error inserting fooditem:", err.message);
      }
    }
  );
});

// Insert fooditem_quantities data
const fooditemQuantitiesData = [
  [1, 1, 50],
  [1, 2, 30],
  [2, 3, 40],
  [3, 4, 100],
  [4, 5, 80],
  [5, 6, 30],
  [6, 7, 25],
  [7, 8, 20],
  [8, 9, 15],
  [9, 1, 10],
  [10, 2, 12],
  [11, 3, 18],
];

fooditemQuantitiesData.forEach(([fooditem_id, foodcourt_id, quantity]) => {
  db.run(
    `INSERT INTO fooditem_quantities (fooditem_id, foodcourt_id, quantity) VALUES (?, ?, ?)`,
    [fooditem_id, foodcourt_id, quantity],
    (err) => {
      if (err) {
        console.error("❌ Error inserting fooditem quantity:", err.message);
      }
    }
  );
});

// Insert favorites data
const favoritesData = [
  [1, 1, 1],
  [1, 2, 3],
  [2, 3, 4],
  [2, 4, 5],
];

favoritesData.forEach(([user_id, fooditem_id, foodcourt_id]) => {
  db.run(
    `INSERT INTO favorites (user_id, fooditem_id, foodcourt_id) VALUES (?, ?, ?)`,
    [user_id, fooditem_id, foodcourt_id],
    (err) => {
      if (err) {
        console.error("❌ Error inserting favorite:", err.message);
      }
    }
  );
});

// Insert orders data
// Insert dummy orders data
const ordersData = [
  [1, 1, 1, 2, "completed", "accepted", "123456", "2025-03-26 10:00:00"], // User 1 ordered Green Lays from Food court 2
  [2, 2, 3, 4, "pending", "pending", "654321", "2025-03-26 11:00:00"],   // User 2 ordered Coffee from Food court 6
  [1, 5, 6, 1, "completed", "completed", "789012", "2025-03-26 12:00:00"], // User 1 ordered Chicken Patties from Food court 4
  [2, 7, 8, 3, "pending", "cancelled", "345678", "2025-03-26 13:00:00"], // User 2 ordered Paneer Patties from Food court 3
];

ordersData.forEach(([userid, foodid, foodcourtid, quantity, payment, status, uniquecode, date]) => {
  db.run(
    `INSERT INTO orders (userid, foodid, foodcourtid, quantity, payment, status, uniquecode, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [userid, foodid, foodcourtid, quantity, payment, status, uniquecode, date],
    (err) => {
      if (err) {
        console.error("❌ Error inserting order:", err.message);
      }
    }
  );
});