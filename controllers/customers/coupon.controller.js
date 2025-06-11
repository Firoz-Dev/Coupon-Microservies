
const CouponModel = require('../../models/couponModel');
const CustomerCouponModel = require('../../models/customerCouponModel');
const CustomerCouponMetaModel = require('../../models/customerCouponMetaModel'); 
const EligibilityHelpers = require('../../utils/eligibilityHelpers');
const moment = require('moment');
const db = require('../../config/db');

class ClientCouponController {

    static async getEligibleCoupons(req, res) {
        const { userId, cartTotal,birthday} = req.body;
        console.log("getEligibleCoupons",userId,cartTotal,birthday)

        if (!userId || !cartTotal) {
            return res.status(400).json({ message: 'User ID and Cart Total are required.' });
        }

        try {
            
            // Fetch user coupon metadata from customer_coupon_meta table
            let userMeta = await CustomerCouponMetaModel.getByUserId(userId);
            if (!userMeta) {
                 // If userMeta doesn't exist, create a basic entry for the user in customer_coupon_meta
                 // Birthday is not passed here as it comes from the users table
                 await CustomerCouponMetaModel.create(userId);
                 userMeta = await CustomerCouponMetaModel.getByUserId(userId);
            }

            const activeCoupons = await CouponModel.getActiveCoupons();
            const userCouponUsages = await CustomerCouponModel.getAllByUserId(userId);
            const userCouponUsageMap = new Map();
            userCouponUsages.forEach(usage => userCouponUsageMap.set(usage.coupon_id, usage));

            const eligibleCoupons = [];

            for (const coupon of activeCoupons) {
                if (cartTotal < coupon.minimum_order_value) {
                    continue;
                }

                const currentUserCouponUsage = userCouponUsageMap.get(coupon.id) || { usage_count: 0, is_used_at_least_once: false };

                // Pass both user (for birthday) and userMeta (for order stats) to eligibilityHelpers
                const isEligible = await EligibilityHelpers.checkCouponEligibility(coupon, birthday, userMeta, currentUserCouponUsage);

                if (isEligible) {
                    eligibleCoupons.push(coupon);
                }
            }

            res.status(200).json(eligibleCoupons);
        } catch (error) {
            console.error('Error fetching coupons:', error);
            res.status(500).json({ message: 'Failed to fetch coupons', error: error.message });
        }
    }

    static async trackCouponUsageOnOrder(req, res) {
        const { userId, usedCouponCode } = req.body;

        if (!userId || !usedCouponCode) {
            return res.status(400).json({ message: 'User ID and used Coupon Code are required.' });
        }

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const coupon = await CouponModel.getByCode(usedCouponCode);
            if (!coupon) {
                await connection.rollback();
                return res.status(404).json({ message: 'Coupon not found for tracking.' });
            }

            // Update user's order stats in customer_coupon_meta table
            await CustomerCouponMetaModel.updateOrderStats(userId, connection);
            await CustomerCouponModel.createOrUpdate(userId, coupon.id, connection);

            await connection.commit();
            res.status(200).json({ message: 'Coupon usage tracked and user stats updated successfully.' });

        } catch (error) {
            await connection.rollback();
            console.error('Error tracking coupon usage on order:', error);
            res.status(500).json({ message: 'Failed to track coupon usage', error: error.message });
        } finally {
            connection.release();
        }
    }

    static async revertCouponUsageOnRefund(req, res) {
        const { userId, usedCouponCode } = req.body;

        if (!userId || !usedCouponCode) {
            return res.status(400).json({ message: 'User ID and used Coupon Code are required.' });
        }

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const coupon = await CouponModel.getByCode(usedCouponCode);
            if (!coupon) {
                await connection.rollback();
                return res.status(404).json({ message: 'Coupon not found for reversion.' });
            }

            // Decrement user's order stats in customer_coupon_meta table
            await CustomerCouponMetaModel.decrementOrderStats(userId, connection);
            const decremented = await CustomerCouponModel.decrementUsage(userId, coupon.id, connection);

            if (!decremented) {
                 await connection.rollback();
                 return res.status(400).json({ message: 'Coupon usage not found or already at 0 for this user.' });
            }

            await connection.commit();
            res.status(200).json({ message: 'Coupon usage reverted and user stats decremented successfully.' });

        } catch (error) {
            await connection.rollback();
            console.error('Error reverting coupon usage:', error);
            res.status(500).json({ message: 'Failed to revert coupon usage', error: error.message });
        } finally {
            connection.release();
        }
    }
}

module.exports = ClientCouponController;