const { get, run } = require('../db');
const bcrypt = require('bcrypt');

class User {
  static async findByEmail(email) {
    try {
      const row = await get('SELECT * FROM users WHERE email = ?', [email]);
      return row;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  static async create(userData) {
    const { username, email, password } = userData;
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    try {
      const result = await run(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        [username, email, hashedPassword]
      );
      return { id: result.lastID, username, email };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  static async comparePassword(providedPassword, storedPassword) {
    return await bcrypt.compare(providedPassword, storedPassword);
  }
}

module.exports = User;
