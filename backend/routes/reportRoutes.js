import express from "express";
import Order from "../models/Order.js";

const router = express.Router();

const getDateRange = (startDate, endDate) => {
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date();

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return { start, end };
};

const getBranchFilter = (branchCode) => {
    if (!branchCode) return {};

    return {
        branchCode: branchCode.trim().toUpperCase()
    };
};

router.get("/dashboard", async (req, res) => {
    try {
        const { start, end } = getDateRange();

        const orders = await Order.find({
            createdAt: {
                $gte: start,
                $lte: end
            }
        }).sort({ createdAt: -1 });

        const paidOrders = orders.filter(
            (order) => order.paymentStatus === "paid" && order.status !== "cancelled"
        );

        const unpaidOrders = orders.filter(
            (order) =>
                order.paymentStatus === "unpaid" && order.status !== "cancelled"
        );

        const cancelledOrders = orders.filter(
            (order) => order.status === "cancelled"
        );

        const totalRevenue = paidOrders.reduce((sum, order) => {
            return sum + Number(order.totalAmount || 0);
        }, 0);

        const branchMap = {};

        orders.forEach((order) => {
            const branchCode = order.branchCode || "NO_BRANCH";
            const branchName = order.branchName || "Chưa gán chi nhánh";

            if (!branchMap[branchCode]) {
                branchMap[branchCode] = {
                    branchCode,
                    branchName,
                    totalRevenue: 0,
                    totalOrders: 0,
                    paidOrders: 0,
                    unpaidOrders: 0,
                    cancelledOrders: 0
                };
            }

            branchMap[branchCode].totalOrders += 1;

            if (order.status === "cancelled") {
                branchMap[branchCode].cancelledOrders += 1;
                return;
            }

            if (order.paymentStatus === "paid") {
                branchMap[branchCode].paidOrders += 1;
                branchMap[branchCode].totalRevenue += Number(order.totalAmount || 0);
            }

            if (order.paymentStatus === "unpaid") {
                branchMap[branchCode].unpaidOrders += 1;
            }
        });

        const branches = Object.values(branchMap).sort(
            (a, b) => b.totalRevenue - a.totalRevenue
        );

        const bestBranch = branches.length > 0 ? branches[0] : null;

        res.json({
            success: true,
            data: {
                totalRevenue,
                totalOrders: orders.length,
                totalPaidOrders: paidOrders.length,
                totalUnpaidOrders: unpaidOrders.length,
                totalCancelledOrders: cancelledOrders.length,
                bestBranch,
                branches,
                recentOrders: orders.slice(0, 8)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Cannot get dashboard report",
            error: error.message
        });
    }
});

router.get("/today", async (req, res) => {
    try {
        const { branchCode } = req.query;

        const { start, end } = getDateRange();

        const baseFilter = {
            createdAt: {
                $gte: start,
                $lte: end
            },
            ...getBranchFilter(branchCode)
        };

        const paidFilter = {
            ...baseFilter,
            paymentStatus: "paid",
            status: { $ne: "cancelled" }
        };

        const unpaidFilter = {
            ...baseFilter,
            paymentStatus: "unpaid",
            status: { $ne: "cancelled" }
        };

        const paidOrders = await Order.find(paidFilter);
        const unpaidOrders = await Order.find(unpaidFilter);

        const totalRevenue = paidOrders.reduce((sum, order) => {
            return sum + Number(order.totalAmount || 0);
        }, 0);

        res.json({
            success: true,
            data: {
                branchCode: branchCode ? branchCode.trim().toUpperCase() : "",
                totalRevenue,
                totalPaidOrders: paidOrders.length,
                totalUnpaidOrders: unpaidOrders.length,
                totalOrders: paidOrders.length + unpaidOrders.length
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
        const { startDate, endDate, branchCode } = req.query;

        const { start, end } = getDateRange(startDate, endDate);

        const baseFilter = {
            createdAt: {
                $gte: start,
                $lte: end
            },
            ...getBranchFilter(branchCode)
        };

        const orders = await Order.find(baseFilter).sort({ createdAt: -1 });

        const paidOrders = orders.filter(
            (order) => order.paymentStatus === "paid" && order.status !== "cancelled"
        );

        const unpaidOrders = orders.filter(
            (order) =>
                order.paymentStatus === "unpaid" && order.status !== "cancelled"
        );

        const cancelledOrders = orders.filter(
            (order) => order.status === "cancelled"
        );

        const totalRevenue = paidOrders.reduce((sum, order) => {
            return sum + Number(order.totalAmount || 0);
        }, 0);

        const averageOrderValue =
            paidOrders.length > 0 ? Math.round(totalRevenue / paidOrders.length) : 0;

        const revenueByDayMap = {};

        paidOrders.forEach((order) => {
            const day = order.createdAt.toISOString().slice(0, 10);

            if (!revenueByDayMap[day]) {
                revenueByDayMap[day] = {
                    date: day,
                    revenue: 0,
                    orders: 0
                };
            }

            revenueByDayMap[day].revenue += Number(order.totalAmount || 0);
            revenueByDayMap[day].orders += 1;
        });

        const revenueByDay = Object.values(revenueByDayMap).sort((a, b) =>
            a.date.localeCompare(b.date)
        );

        res.json({
            success: true,
            data: {
                branchCode: branchCode ? branchCode.trim().toUpperCase() : "",
                startDate: start,
                endDate: end,
                totalOrders: orders.length,
                totalRevenue,
                totalPaidOrders: paidOrders.length,
                totalUnpaidOrders: unpaidOrders.length,
                totalCancelledOrders: cancelledOrders.length,
                averageOrderValue,
                revenueByDay,
                orders
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

router.get("/branches/today", async (req, res) => {
    try {
        const { start, end } = getDateRange();

        const orders = await Order.find({
            createdAt: {
                $gte: start,
                $lte: end
            },
            paymentStatus: "paid",
            status: { $ne: "cancelled" },
            branchCode: { $ne: "" }
        });

        const branchMap = {};

        orders.forEach((order) => {
            const code = order.branchCode || "UNKNOWN";

            if (!branchMap[code]) {
                branchMap[code] = {
                    branchCode: code,
                    branchName: order.branchName || code,
                    totalRevenue: 0,
                    totalPaidOrders: 0
                };
            }

            branchMap[code].totalRevenue += Number(order.totalAmount || 0);
            branchMap[code].totalPaidOrders += 1;
        });

        const branches = Object.values(branchMap).sort(
            (a, b) => b.totalRevenue - a.totalRevenue
        );

        const totalRevenue = branches.reduce((sum, branch) => {
            return sum + branch.totalRevenue;
        }, 0);

        res.json({
            success: true,
            data: {
                totalRevenue,
                branches
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Cannot get branch today report",
            error: error.message
        });
    }
});

export default router;