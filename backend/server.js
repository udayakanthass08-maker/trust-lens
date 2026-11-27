const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

// ── Database setup ──
const db = new sqlite3.Database('./trustlens.db', (err) => {
    if (err) console.error('❌ Database connection failed:', err.message);
    else console.log('✅ Connected to SQLite database.');
});

// ── Create history table ──
db.run(`
  CREATE TABLE IF NOT EXISTS history (
    id TEXT PRIMARY KEY,
    type TEXT,
    time TEXT,
    trust INTEGER,
    confidence INTEGER,
    duration TEXT,
    signals TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`, (err) => {
    if (err) console.error('❌ Error creating history table:', err.message);
    else console.log('✅ History table ready.');
});
// ── Create reports table ──
db.run(`
  CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    type TEXT,
    platform TEXT,
    signal TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`, (err) => {
    if (err) console.error('❌ Error creating reports table:', err.message);
    else console.log('✅ Reports table ready.');
});
// ── Seed the database with initial data (only if empty) ──
const seedData = [
    { type: "Video call", time: "09:42", trust: 91, confidence: 94, duration: "4m 12s", signals: [] },
    { type: "Voice call", time: "09:18", trust: 42, confidence: 88, duration: "2m 07s", signals: ["Voice spectral anomaly", "A/V sync degradation"] },
    { type: "Video call", time: "08:57", trust: 18, confidence: 91, duration: "6m 33s", signals: ["AI voice signature", "Facial motion anomaly", "Lip-sync mismatch"] },
    { type: "Voice call", time: "Yesterday 16:22", trust: 87, confidence: 92, duration: "1m 48s", signals: [] },
    { type: "Video call", time: "Yesterday 11:05", trust: 64, confidence: 79, duration: "8m 21s", signals: ["Temporal inconsistency"] },
    { type: "Video call", time: "Yesterday 09:30", trust: 95, confidence: 97, duration: "3m 55s", signals: [] },
];

db.get('SELECT COUNT(*) as count FROM history', (err, row) => {
    if (err) { console.error('❌ Error checking count:', err.message); return; }
    if (row.count === 0) {
        const stmt = db.prepare('INSERT INTO history (id, type, time, trust, confidence, duration, signals) VALUES (?, ?, ?, ?, ?, ?, ?)');
        seedData.forEach((entry) => {
            stmt.run(uuidv4(), entry.type, entry.time, entry.trust, entry.confidence, entry.duration, JSON.stringify(entry.signals));
        });
        stmt.finalize();
        console.log(`✅ Seeded ${seedData.length} history entries.`);
    } else {
        console.log(`✅ History table already has ${row.count} entries.`);
    }
});

// ── GET all history ──
app.get('/api/history', (req, res) => {
    db.all('SELECT * FROM history ORDER BY created_at DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const formatted = rows.map(r => ({
            ...r,
            signals: JSON.parse(r.signals || '[]'),
        }));
        res.json(formatted);
    });
});

// ── POST new history entry ──
app.post('/api/history', (req, res) => {
    const { type, time, trust, confidence, duration, signals } = req.body;
    const id = uuidv4();
    db.run(
        'INSERT INTO history (id, type, time, trust, confidence, duration, signals) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, type, time, trust, confidence, duration, JSON.stringify(signals || [])],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id, type, time, trust, confidence, duration, signals });
        }
    );
});
// ── POST new report ──
app.post('/api/reports', (req, res) => {
    const { type, platform, signal, desc } = req.body;
    const id = uuidv4();
    db.run(
        'INSERT INTO reports (id, type, platform, signal, description) VALUES (?, ?, ?, ?, ?)',
        [id, type, platform, signal, desc || ''],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id, type, platform, signal, desc });
        }
    );
});

// ── GET all reports ──
app.get('/api/reports', (req, res) => {
    db.all('SELECT * FROM reports ORDER BY created_at DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});
// ── Test route ──
app.get('/', (req, res) => {
    res.send('✅ Trust Lens Backend is running!');
});

// ── Start server ──
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});