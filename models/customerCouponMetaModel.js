
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


    static async updateOrderStats(userId, connection = db) {
        const conn = connection || await db.getConnection(); // Use provided connection or get a new one
        try {
            // Step 1: Get current meta data to check existing order count and first_coupon_order_date
            const [currentMetaRows] = await conn.execute(
                'SELECT total_orders_for_coupons, first_coupon_order_date FROM customer_coupon_meta WHERE user_id = ?',
                [userId]
            );
            const currentMeta = currentMetaRows[0];

            let updateQuery = `
                UPDATE customer_coupon_meta
                SET total_orders_for_coupons = total_orders_for_coupons + 1,
                    last_order_date_for_coupons = NOW()
            `;
            let params = [userId]; // Parameter for WHERE clause

            // Step 2: Conditionally set first_coupon_order_date ONLY if it's the very first order
            // (i.e., total_orders_for_coupons was 0 AND first_coupon_order_date is currently NULL)
            if (currentMeta && currentMeta.total_orders_for_coupons === 0 && currentMeta.first_coupon_order_date === null) {
                updateQuery += `, first_coupon_order_date = NOW()`;
            }
            
            updateQuery += ` WHERE user_id = ?`;

            const [result] = await conn.execute(updateQuery, params);
            return result.affectedRows > 0;
        } finally {
            if (!connection) conn.release(); // Only release if we got the connection ourselves
        }
    }

    static async decrementOrderStats(userId, connection = db) {
        const conn = connection || await db.getConnection();
        try {
            // Step 1: Get current meta data to check existing order count
            const [currentMetaRows] = await conn.execute(
                'SELECT total_orders_for_coupons FROM customer_coupon_meta WHERE user_id = ?',
                [userId]
            );
            const currentMeta = currentMetaRows[0];

            if (!currentMeta || currentMeta.total_orders_for_coupons <= 0) {
                // Cannot decrement if already 0 or no meta found
                return false;
            }

            let updateSetClauses = []; // Use an array to build SET clauses safely
            let params = [];

            // Add the base decrement for total_orders_for_coupons
            updateSetClauses.push('total_orders_for_coupons = GREATEST(0, total_orders_for_coupons - 1)');

            // If this cancellation makes total_orders_for_coupons go from 1 to 0,
            // then reset first_coupon_order_date AND last_order_date_for_coupons to NULL.
            if (currentMeta.total_orders_for_coupons === 1) {
                updateSetClauses.push('last_order_date_for_coupons = NULL');
                updateSetClauses.push('first_coupon_order_date = NULL');
            } else {
                // If there are still orders left (> 1 before decrement),
                // last_order_date_for_coupons and first_coupon_order_date remain as they were.
                // No explicit update needed for them in this case.
            }

            // Construct the full query string by joining the SET clauses with commas
            const updateQuery = `
                UPDATE customer_coupon_meta
                SET ${updateSetClauses.join(', ')}
                WHERE user_id = ? AND total_orders_for_coupons > 0
            `;
            params.push(userId); // Add userId for the WHERE clause

            const [result] = await conn.execute(updateQuery, params);
            return result.affectedRows > 0;

        } finally {
            if (!connection) conn.release();
        }
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