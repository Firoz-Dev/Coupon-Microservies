const db = require('../config/db');

class CouponModel {

    static async create(couponData) {
        const {
            coupon_name, coupon_code, discount_type, discount_value,
            minimum_order_value, // minimum_item_quantity and applicable_categories removed
            start_date, expiry_date, uses_limit,
            category, description, status,
            is_for_first_time_user, is_for_comeback_user, is_for_loyal_user,
            is_for_birthday_user, is_general_coupon,
            is_for_new_customer, is_for_existing_customer
        } = couponData;

        const query = `
            INSERT INTO coupons (
                coupon_name, coupon_code, discount_type, discount_value,
                minimum_order_value,
                start_date, expiry_date, uses_limit,
                category, description, status,
                is_for_first_time_user, is_for_comeback_user, is_for_loyal_user,
                is_for_birthday_user, is_general_coupon,
                is_for_new_customer, is_for_existing_customer
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await db.execute(query, [
            coupon_name, coupon_code, discount_type, discount_value,
            minimum_order_value || 0,
            start_date, expiry_date, uses_limit,
            category || null, description || null, status || 'active',
            is_for_first_time_user || false, is_for_comeback_user || false,
            is_for_loyal_user || false, is_for_birthday_user || false,
            is_general_coupon || false,
            is_for_new_customer || false, is_for_existing_customer || false
        ]);
        return result.insertId;
    }

    static async getAll() {
        // No JSON parsing needed anymore
        const [rows] = await db.query('SELECT * FROM coupons ORDER BY created_at DESC');
        return rows;
    }

    static async getById(id) {
        // No JSON parsing needed anymore
        const [rows] = await db.execute('SELECT * FROM coupons WHERE id = ?', [id]);
        return rows[0];
    }

    static async getByCode(code) {
        // No JSON parsing needed anymore
        const [rows] = await db.execute('SELECT * FROM coupons WHERE coupon_code = ?', [code]);
        return rows[0];
    }

    static async update(id, couponData) {
        const fields = [];
        const values = [];
        for (const key in couponData) {
            // No special handling for JSON fields anymore
            fields.push(`${key} = ?`);
            values.push(couponData[key]);
        }
        values.push(id);

        const query = `UPDATE coupons SET ${fields.join(', ')} WHERE id = ?`;
        const [result] = await db.execute(query, values);
        return result.affectedRows > 0;
    }

    static async delete(id) {
        const [result] = await db.execute('DELETE FROM coupons WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }

    static async getActiveCoupons() {
        // No JSON parsing needed anymore
        const [rows] = await db.query(`
            SELECT * FROM coupons
            WHERE status = 'active' AND expiry_date >= NOW() AND start_date <= NOW()
        `);
        return rows;
    }
}

module.exports = CouponModel;