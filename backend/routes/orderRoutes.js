import express from "express";
import Order from "../models/Order.js";
import Table from "../models/Table.js";

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });

        res.json({
            success: true,
            data: orders
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Cannot get orders",
            error: error.message
        });
    }
});

router.post("/", async (req, res) => {
    try {
        const { tableId, tableName, customerName, items, paymentMethod } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Order must have at least one item"
            });
        }

        let selectedTable = null;

        if (tableId) {
            selectedTable = await Table.findById(tableId);

            if (!selectedTable) {
                return res.status(404).json({
                    success: false,
                    message: "Table not found"
                });
            }

            if (selectedTable.status !== "available") {
                return res.status(400).json({
                    success: false,
                    message: `${selectedTable.name} hiện không trống`
                });
            }
        }

        const totalAmount = items.reduce((sum, item) => {
            return sum + item.price * item.quantity;
        }, 0);

        const newOrder = await Order.create({
            tableId: selectedTable ? selectedTable._id : null,
            tableName: selectedTable ? selectedTable.name : tableName || "Takeaway",
            customerName,
            items,
            totalAmount,
            paymentMethod: paymentMethod || "cash",
            paymentStatus: "unpaid",
            paidAt: null
        });

        if (selectedTable) {
            selectedTable.status = "occupied";
            selectedTable.currentOrderId = newOrder._id;
            await selectedTable.save();
        }

        res.status(201).json({
            success: true,
            message: "Order created successfully",
            data: newOrder
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Cannot create order",
            error: error.message
        });
    }
});

router.patch("/:id/status", async (req, res) => {
    try {
        const { status } = req.body;

        const allowedStatuses = ["pending", "preparing", "completed", "cancelled"];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order status"
            });
        }

        const updatedOrder = await Order.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!updatedOrder) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        if (updatedOrder.tableId) {
            if (status === "completed") {
                await Table.findByIdAndUpdate(updatedOrder.tableId, {
                    status: "cleaning"
                });
            }

            if (status === "cancelled") {
                await Table.findByIdAndUpdate(updatedOrder.tableId, {
                    status: "available",
                    currentOrderId: null
                });
            }
        }

        res.json({
            success: true,
            message: "Order status updated",
            data: updatedOrder
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Cannot update order status",
            error: error.message
        });
    }
});

router.patch("/:id/pay", async (req, res) => {
    try {
        const { paymentMethod } = req.body;

        const allowedPaymentMethods = ["cash", "bank", "card", "momo", "zalopay"];

        if (!allowedPaymentMethods.includes(paymentMethod)) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment method"
            });
        }

        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        if (order.status === "cancelled") {
            return res.status(400).json({
                success: false,
                message: "Không thể thanh toán đơn đã hủy"
            });
        }

        if (order.paymentStatus === "paid") {
            return res.status(400).json({
                success: false,
                message: "Đơn này đã thanh toán rồi"
            });
        }

        order.paymentMethod = paymentMethod;
        order.paymentStatus = "paid";
        order.paidAt = new Date();

        await order.save();

        if (order.tableId) {
            await Table.findByIdAndUpdate(order.tableId, {
                status: "available",
                currentOrderId: null
            });
        }

        res.json({
            success: true,
            message: "Order paid successfully",
            data: order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Cannot pay order",
            error: error.message
        });
    }
});

export default router;