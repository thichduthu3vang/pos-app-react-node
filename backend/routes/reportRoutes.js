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

router.get("/summary", async (req, res) => {
    try {
        const { from, to } = req.query;

        const startDate = from ? new Date(from) : new Date();
        startDate.setHours(0, 0, 0, 0);

        const endDate = to ? new Date(to) : new Date();
        endDate.setHours(23, 59, 59, 999);

        const paidOrders = await Order.find({
            paymentStatus: "paid",
            paidAt: {
                $gte: startDate,
                $lte: endDate
            }
        }).sort({ paidAt: -1 });

        const createdOrders = await Order.find({
            createdAt: {
                $gte: startDate,
                $lte: endDate
            }
        }).sort({ createdAt: -1 });

        const unpaidOrders = createdOrders.filter((order) => {
            return order.paymentStatus !== "paid" && order.status !== "cancelled";
        });

        const cancelledOrders = createdOrders.filter((order) => {
            return order.status === "cancelled";
        });

        const totalRevenue = paidOrders.reduce((sum, order) => {
            return sum + order.totalAmount;
        }, 0);

        const paymentMethods = {
            cash: 0,
            bank: 0,
            card: 0,
            momo: 0,
            zalopay: 0
        };

        paidOrders.forEach((order) => {
            const method = order.paymentMethod || "cash";

            if (!paymentMethods[method]) {
                paymentMethods[method] = 0;
            }

            paymentMethods[method] += order.totalAmount;
        });

        const dailyRevenueMap = {};

        paidOrders.forEach((order) => {
            const key = order.paidAt
                ? order.paidAt.toISOString().slice(0, 10)
                : "unknown";

            if (!dailyRevenueMap[key]) {
                dailyRevenueMap[key] = 0;
            }

            dailyRevenueMap[key] += order.totalAmount;
        });

        const dailyRevenue = Object.keys(dailyRevenueMap)
            .sort()
            .map((date) => ({
                date,
                revenue: dailyRevenueMap[date]
            }));

        res.json({
            success: true,
            data: {
                from: startDate,
                to: endDate,
                totalRevenue,
                totalPaidOrders: paidOrders.length,
                totalCreatedOrders: createdOrders.length,
                totalUnpaidOrders: unpaidOrders.length,
                totalCancelledOrders: cancelledOrders.length,
                paymentMethods,
                dailyRevenue,
                paidOrders,
                unpaidOrders,
                cancelledOrders
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Cannot get report summary",
            error: error.message
        });
    }
});

export default router;