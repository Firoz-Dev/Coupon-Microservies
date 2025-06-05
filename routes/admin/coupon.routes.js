const express = require('express');
const router = express.Router();
const AdminCouponController = require('../../controllers/admin/coupon.controller');


// Admin authentication middleware (you'll need to implement this)
// const authenticateAdmin = (req, res, next) => {
//     // For demonstration, we'll assume adminId is directly in req.body for now.
//     // In production, you'd verify admin role/permissions based on authenticated user.
//     if (!req.body.adminId) { // Or req.user.role === 'admin'
//         return res.status(403).json({ message: 'Admin access required.' });
//     }
//     next();
// };

// router.use(authenticateAdmin); // Apply admin authentication middleware to all admin routes

router.post('/', AdminCouponController.createCoupon);
router.get('/', AdminCouponController.getAllCoupons);
router.get('/:id', AdminCouponController.getCouponById);
router.put('/:id', AdminCouponController.updateCoupon);
router.delete('/:id', AdminCouponController.deleteCoupon);

module.exports = router;