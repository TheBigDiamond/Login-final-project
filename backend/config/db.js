const mysql = require("mysql2/promise");
require("dotenv").config();
const path = require("path");
const fs = require("fs");

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "user_auth",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log("Successfully connected to MySQL database");
    connection.release();
    return true;
  } catch (error) {
    console.error("Error connecting to MySQL database:", error);
    return false;
  }
}

async function initializeDatabase() {
  // Create a separate connection without database for initialization
  const initConnection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
  });

  try {
    const sqlPath = path.join(__dirname, "../db/db.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");
    const statements = sql
      .split(";")
      .map((stmt) => stmt.trim())
      .filter(
        (stmt) => stmt && !stmt.startsWith("--") && !stmt.startsWith("/*")
      );

    for (const statement of statements) {
      if (statement) {
        await initConnection.query(statement);
      }
    }
    console.log("Database initialized from SQL file");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  } finally {
    await initConnection.end();
  }
}

module.exports = {
  pool,
  testConnection,
  initializeDatabase,
};
