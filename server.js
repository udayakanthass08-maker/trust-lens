const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');

// ── Create the Express app ──
const app = express();
const PORT = 5001;

// ── Middleware ──
app.use(cors());        // Allows React to talk to this server
app.use(express.json()); // Automatically parses JSON data sent from React

// ── Database setup ──
const db = new sqlite3.Database('./trustlens.db', (err) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
    } else {
        console.log('✅ Connected to SQLite database.');
    }
});

// ── Create the "history" table (if it doesn't exist) ──
db.run(`
  CREATE TABLE IF NOT EXISTS history (
    id TEXT PRIMARY KEY,
    type TEXT,
    time TEXT,
    trust INTEGER,
    confidence INTEGER,
    duration TEXT,
    signals TEXT,  -- We'll store signals as a JSON string
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`, (err) => {
    if (err) {
        console.error('❌ Error creating history table:', err.message);
    } else {
        console.log('✅ History table ready.');
    }
});

// ── Simple test route ──
app.get('/', (req, res) => {
    res.send('✅ Trust Lens Backend is running!');
});

// ── Start the server ──
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});