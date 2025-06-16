const CouponModel = require('../../models/couponModel');

class AdminCouponController {
    
    static async createCoupon(req, res) {
        console.log("amdin coupon", req.body);
        try {
            const newCouponId = await CouponModel.create(req.body);
            res.status(201).json({ message: 'Coupon created successfully', couponId: newCouponId });
        } catch (error) {
            console.error('Error creating coupon:', error);
            res.status(500).json({ message: 'Failed to create coupon', error: error.message });
        }
    }

    static async getAllCoupons(req, res) {
        try {
            const coupons = await CouponModel.getAll();
            res.status(200).json(coupons);
        } catch (error) {
            console.error('Error fetching coupons:', error);
            res.status(500).json({ message: 'Failed to fetch coupons', error: error.message });
        }
    }

    static async getCouponById(req, res) {
        try {
            const { id } = req.params;
            const coupon = await CouponModel.getById(id);
            if (!coupon) {
                return res.status(404).json({ message: 'Coupon not found' });
            }
            res.status(200).json(coupon);
        } catch (error) {
            console.error('Error fetching coupon by ID:', error);
            res.status(500).json({ message: 'Failed to fetch coupon', error: error.message });
        }
    }

    static async updateCoupon(req, res) {
        try {
            const { id } = req.params;
            const updated = await CouponModel.update(id, req.body);
            if (!updated) {
                return res.status(404).json({ message: 'Coupon not found or no changes made' });
            }
            res.status(200).json({ message: 'Coupon updated successfully' });
        } catch (error) {
            console.error('Error updating coupon:', error);
            res.status(500).json({ message: 'Failed to update coupon', error: error.message });
        }
    }

    static async deleteCoupon(req, res) {
        try {
            const { id } = req.params;
            const deleted = await CouponModel.delete(id);
            if (!deleted) {
                return res.status(404).json({ message: 'Coupon not found' });
            }
            res.status(200).json({ message: 'Coupon deleted successfully' });
        } catch (error) {
            console.error('Error deleting coupon:', error);
            res.status(500).json({ message: 'Failed to delete coupon', error: error.message });
        }
    }
}

module.exports = AdminCouponController;