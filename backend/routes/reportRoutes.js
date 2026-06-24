import express from "express";
import Order from "../models/Order.js";

const router = express.Router();

router.get("/today", async (req, res) => {
    try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const paidOrders = await Order.find({
            paymentStatus: "paid",
            paidAt: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        }).sort({ paidAt: -1 });

        const unpaidOrders = await Order.find({
            paymentStatus: {
                $ne: "paid"
            },
            status: {
                $ne: "cancelled"
            }
        });

        const totalRevenue = paidOrders.reduce((sum, order) => {
            return sum + order.totalAmount;
        }, 0);

        res.json({
            success: true,
            data: {
                totalRevenue,
                totalPaidOrders: paidOrders.length,
                totalUnpaidOrders: unpaidOrders.length,
                paidOrders
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Cannot get today report",
            error: error.message
        });
    }
});

export default router;