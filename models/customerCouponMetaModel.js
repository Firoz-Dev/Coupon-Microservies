const db = require('../config/db');

class CustomerCouponMetaModel {
    static async getByUserId(userId) {
        const [rows] = await db.execute('SELECT * FROM customer_coupon_meta WHERE user_id = ?', [userId]);
        return rows[0];
    }

    static async create(userId, connection = db) {
        const query = `
            INSERT INTO customer_coupon_meta (user_id)
            VALUES (?)
            ON DUPLICATE KEY UPDATE user_id = user_id -- Do nothing if already exists
        `;
        await connection.execute(query, [userId]);
    }

    // Updated to accept a connection for transactions
    static async updateOrderStats(userId, connection = db) {
        const query = `
            INSERT INTO customer_coupon_meta (user_id, first_coupon_order_date, last_order_date_for_coupons, total_orders_for_coupons)
            VALUES (?, NOW(), NOW(), 1)
            ON DUPLICATE KEY UPDATE
                first_coupon_order_date = COALESCE(first_coupon_order_date, NOW()), -- Set only if NULL
                last_order_date_for_coupons = NOW(),
                total_orders_for_coupons = total_orders_for_coupons + 1
        `;
        await connection.execute(query, [userId]);
        return true;
    }

    // NEW: Function to decrement order stats (for refund/cancellation)
    static async decrementOrderStats(userId, connection = db) {
        const query = `
            UPDATE customer_coupon_meta
            SET total_orders_for_coupons = GREATEST(0, total_orders_for_coupons - 1),
                last_order_date_for_coupons = CASE WHEN total_orders_for_coupons - 1 = 0 THEN NULL ELSE last_order_date_for_coupons END,
                first_coupon_order_date = CASE WHEN total_orders_for_coupons - 1 = 0 AND first_coupon_order_date IS NOT NULL THEN NULL ELSE first_coupon_order_date END
            WHERE user_id = ? AND total_orders_for_coupons > 0
        `;
        await connection.execute(query, [userId]);
        return true;
    }

    static async updateBirthday(userId, birthday, connection = db) {
        const query = `
            INSERT INTO customer_coupon_meta (user_id, birthday)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE birthday = ?
        `;
        await connection.execute(query, [userId, birthday, birthday]);
        return true;
    }
}

module.exports = CustomerCouponMetaModel;