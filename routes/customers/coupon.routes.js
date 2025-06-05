const express = require('express');
const router = express.Router();
const CustomerCouponController = require('../../controllers/customers/coupon.controller');

// User authentication middleware (you'll need to implement this)
// const authenticateUser = (req, res, next) => {
//     // For demonstration, we'll assume userId is directly in req.body for now.
//     // In production, you'd extract userId from req.user after authentication.
//     if (!req.body.userId) { // Or req.user.id if using proper auth
//         return res.status(401).json({ message: 'Authentication required.' });
//     }
//     next();
// };

// router.use(authenticateUser);

router.post('/eligible', CustomerCouponController.getEligibleCoupons);
router.post('/track-usage', CustomerCouponController.trackCouponUsageOnOrder);
router.post('/revert-usage', CustomerCouponController.revertCouponUsageOnRefund);

module.exports = router;