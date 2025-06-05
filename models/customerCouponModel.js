const db = require('../config/db');

class UserCouponModel {
    static async createOrUpdate(userId, couponId, connection = db) {
        // Use provided connection or default db
        const query = `
            INSERT INTO customer_coupons (user_id, coupon_id, usage_count, last_used_at, is_used_at_least_once)
            VALUES (?, ?, 1, NOW(), TRUE)
            ON DUPLICATE KEY UPDATE
                usage_count = usage_count + 1,
                last_used_at = NOW(),
                is_used_at_least_once = TRUE
        `;
        const [result] = await connection.execute(query, [userId, couponId]);
        return result;
    }

    static async getByUserIdAndCouponId(userId, couponId) {
        const [rows] = await db.execute(
            'SELECT * FROM customer_coupons WHERE user_id = ? AND coupon_id = ?',
            [userId, couponId]
        );
        return rows[0];
    }

    static async getAllByUserId(userId) {
        const [rows] = await db.execute(
            'SELECT uc.*, c.coupon_code, c.coupon_name, c.uses_limit FROM customer_coupons uc JOIN coupons c ON uc.coupon_id = c.id WHERE uc.user_id = ?',
            [userId]
        );
        return rows;
    }

    // NEW: Function to decrement coupon usage
    static async decrementUsage(userId, couponId, connection = db) {
        const query = `
            UPDATE customer_coupons
            SET usage_count = GREATEST(0, usage_count - 1),
                last_used_at = CASE WHEN usage_count - 1 = 0 THEN NULL ELSE last_used_at END,
                is_used_at_least_once = CASE WHEN usage_count - 1 = 0 THEN FALSE ELSE TRUE END
            WHERE user_id = ? AND coupon_id = ? AND usage_count > 0
        `;
        const [result] = await connection.execute(query, [userId, couponId]);
        return result.affectedRows > 0;
    }
}

module.exports = UserCouponModel;