const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./data.db");

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS companies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            description TEXT,
            logo TEXT
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS shops (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            description TEXT,
            logo TEXT
        )
    `);
});

module.exports = db;
