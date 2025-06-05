// models/userModel.js
const db = require('../config/db');

class CustomerModel {
    // Add methods for user creation, login, etc., if they don't exist
    // static async createUser(username, email, password) { ... }
    // static async findByUsername(username) { ... }

    // This method will fetch user data, including the new birthday column
    static async getById(userId) {
        const [rows] = await db.execute('SELECT id, username, email, birthday FROM customers WHERE id = ?', [userId]);
        return rows[0];
    }
}

module.exports = CustomerModel;