import Database from 'better-sqlite3';
import path from 'path';

// Create/open SQLite database file
const dbPath = path.join(process.cwd(), 'Polysentience.db');
const db = new Database(dbPath);

// Initialize tables
export function initDatabase() {
  // Markets table
  db.exec(`
    CREATE TABLE IF NOT EXISTS markets (
      id TEXT PRIMARY KEY,
      question TEXT NOT NULL,
      description TEXT,
      slug TEXT,
      yes_price REAL,
      no_price REAL,
      volume REAL,
      volume_24hr REAL,
      category TEXT,
      end_date TEXT,
      image_url TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Agents table
  db.exec(`
    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      strategy TEXT,
      balance REAL DEFAULT 1000,
      accuracy REAL DEFAULT 0,
      total_predictions INTEGER DEFAULT 0,
      is_celebrity INTEGER DEFAULT 0,
      celebrity_model TEXT,
      avatar TEXT,
      traits TEXT,
      wallet_address TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Predictions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS predictions (
      id TEXT PRIMARY KEY,
      agent_id TEXT,
      market_id TEXT,
      prediction TEXT,
      confidence REAL,
      reasoning TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (agent_id) REFERENCES agents(id),
      FOREIGN KEY (market_id) REFERENCES markets(id)
    )
  `);

  console.log('✅ SQLite database initialized at:', dbPath);
}

// Export database instance
export default db;

