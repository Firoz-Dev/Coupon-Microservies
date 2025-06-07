
const moment = require('moment');

class EligibilityHelpers {
    // Now accepts 'user' (for birthday) and 'userMeta' (for order history)
    static async checkCouponEligibility(coupon, birthday, userMeta, userCouponUsage) {
        const today = moment();

        // 1. Basic Coupon Validity Checks
        if (coupon.status !== 'active' || moment(coupon.expiry_date).isBefore(today) || moment(coupon.start_date).isAfter(today)) {
            return false;
        }

        // 2. Uses Limit Check (per user limit)
        if (coupon.uses_limit !== null && userCouponUsage && userCouponUsage.usage_count >= coupon.uses_limit) {
            return false;
        }

        // Ensure user and userMeta exist for history-based eligibility checks
        if (!birthday || !userMeta) {
            // If either user or userMeta is missing, only general coupons (without history-based rules) are eligible
            return coupon.is_general_coupon;
        }

        // 3. Category/Type Specific Eligibility (based on user history/status)
        switch (coupon.category) {
            case 'WELCOME':
                return userMeta.first_coupon_order_date === null;
            case 'COMEBACK':
                if (userMeta.total_orders_for_coupons < 1) return false;
                const lastOrderDateComeback = moment(userMeta.last_order_date_for_coupons);
                const daysSinceLastOrderComeback = today.diff(lastOrderDateComeback, 'days');
                return daysSinceLastOrderComeback >= 90;
            case 'LOYAL':
                if (userMeta.total_orders_for_coupons < 3) return false;
                const loyalLastOrderDate = moment(userMeta.last_order_date_for_coupons);
                const loyalDaysSinceLastOrder = today.diff(loyalLastOrderDate, 'days');
                return loyalDaysSinceLastOrder >= 60;
            case 'BIRTHDAY':
                // Access birthday directly from the 'user' object
                if (!birthday) return false;
                const userBirthday = moment(birthday);
                return userBirthday.date() === today.date() && userBirthday.month() === today.month();
            case 'GENERAL':
                return true;
            case 'FESTIVAL':
                return true;
            default:
                if (coupon.is_for_new_customer) {
                    return userMeta.total_orders_for_coupons >= 1 && userMeta.total_orders_for_coupons < 3;
                }
                if (coupon.is_for_existing_customer) {
                    return userMeta.total_orders_for_coupons >= 1;
                }
                return true;
        }
    }
}

module.exports = EligibilityHelpers;