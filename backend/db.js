const sqlite3 = require('sqlite3').verbose();
const path = require('path'); // Import the path module

// Construct path relative to this file (db.js) to reach the project root's db.sqlite
// __dirname gives the directory of db.js (i.e., /backend)
// path.resolve(__dirname, '..', 'db.sqlite') goes up one level ('..') and targets db.sqlite
const DBSOURCE = path.resolve(__dirname, '..', 'db.sqlite');

console.log(`Using database file at: ${DBSOURCE}`); // Add log to confirm path

let db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
      // Cannot open database
      console.error(err.message);
      throw err;
    } else {
        console.log('Connected to the SQLite database.');
        // Create users table if it doesn't exist
        db.run(`CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email text UNIQUE,
            password text, 
            onboarding_completed BOOLEAN DEFAULT false,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT email_unique UNIQUE (email)
            )`, 
        (err) => {
            if (err) {
                // Table already created
                console.log('Users table already exists.');
            } else {
                // Table just created
                console.log('Users table created.');
                // You could optionally insert default user data here
            }
        });  

        // Create settings table if it doesn't exist
        db.run(`CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY NOT NULL,
            value TEXT
            )`, 
        (err) => {
            if (err) {
                console.error("Error creating settings table:", err.message);
            } else {
                console.log('Checked/Created settings table.');
                // Optionally insert a placeholder row if needed
                // db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`, ['geminiApiKey', null]);
            }
        });

        // Create user_documents table if it doesn't exist
        db.run(`CREATE TABLE IF NOT EXISTS user_documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            original_filename TEXT NOT NULL,
            upload_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            identified_type TEXT, -- e.g., 'salary_slip', 'form_16', 'other'
            parsed_data_json TEXT, -- Store the full JSON from Gemini/parsing
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )`, 
        (err) => {
            if (err) {
                console.error("Error creating user_documents table:", err.message);
            } else {
                console.log('Checked/Created user_documents table.');
            }
        });
    }
});

module.exports = db; 