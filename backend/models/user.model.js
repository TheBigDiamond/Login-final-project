const { pool } = require("../config/db");
const bcrypt = require("bcryptjs");

class User {
  static async create({ email, password, name }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO users (email, password, name) VALUES (?, ?, ?)",
      [email, hashedPassword, name]
    );
    return this.findById(result.insertId);
  }

  static async findByEmail(email) {
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    return rows[0] || null;
  }

  static async findById(id) {
    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
    return rows[0] || null;
  }

  static async updateUser(id, updates) {
    const { name, email } = updates;

    // Build dynamic query based on provided fields
    const fields = [];
    const values = [];

    if (name !== undefined) {
      fields.push("name = ?");
      values.push(name);
    }

    if (email !== undefined) {
      fields.push("email = ?");
      values.push(email);
    }

    if (fields.length === 0) {
      throw new Error("No fields to update");
    }

    values.push(id);

    await pool.query(
      `UPDATE users SET ${fields.join(", ")} WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  static async deleteUser(id) {
    await pool.query("DELETE FROM users WHERE id = ?", [id]);
    return true;
  }

  static async comparePasswords(candidatePassword, hashedPassword) {
    return await bcrypt.compare(candidatePassword, hashedPassword);
  }

  static async updatePassword(id, currentPassword, newPassword) {
    console.log("updatePassword called with:", {
      id,
      currentPassword: "[HIDDEN]",
      newPassword: "[HIDDEN]",
    });

    const user = await this.findById(id);
    if (!user) {
      console.error("User not found with ID:", id);
      throw new Error("User not found");
    }

    console.log("User found:", { id: user.id, email: user.email });

    const isCurrentPasswordValid = await User.comparePasswords(
      currentPassword,
      user.password
    );
    console.log("Current password valid:", isCurrentPasswordValid);

    if (!isCurrentPasswordValid) {
      console.error("Current password verification failed");
      throw new Error("Current password is incorrect");
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    console.log("New password hashed successfully");

    try {
      await pool.query("UPDATE users SET password = ? WHERE id = ?", [
        hashedNewPassword,
        id,
      ]);
      console.log("Password updated successfully in database");
    } catch (dbError) {
      console.error("Database error during password update:", dbError);
      throw dbError;
    }

    return this.findById(id);
  }
}

module.exports = User;
