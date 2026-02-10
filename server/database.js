const Database = require('better-sqlite3');
const path = require('path');

// Create/open database file
const db = new Database(path.join(__dirname, 'users.db'));

// Create users table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

module.exports = db;

// Function to create a new user
function createUser(username, password) {
  try {
    const stmt = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
    const result = stmt.run(username, password);
    return { success: true, userId: result.lastInsertRowid };
  } catch (error) {
    return { success: false, error: 'Username already exists' };
  }
}

// Function to check login
function checkLogin(username, password) {
  const stmt = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?');
  const user = stmt.get(username, password);
  
  if (user) {
    return { success: true, user: { id: user.id, username: user.username } };
  } else {
    return { success: false, error: 'Invalid username or password' };
  }
}

// Export functions
module.exports = { db, createUser, checkLogin };