import express from "express";
import Table from "../models/Table.js";

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const tables = await Table.find().sort({ createdAt: 1 });

        res.json({
            success: true,
            data: tables
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Cannot get tables",
            error: error.message
        });
    }
});

router.post("/", async (req, res) => {
    try {
        const { name, area, status } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Table name is required"
            });
        }

        const allowedStatuses = ["available", "occupied", "cleaning", "reserved"];

        if (status && !allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid table status"
            });
        }

        const newTable = await Table.create({
            name,
            area: area || "Khu chính",
            status: status || "available"
        });

        res.status(201).json({
            success: true,
            message: "Table created",
            data: newTable
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Cannot create table",
            error: error.message
        });
    }
});

router.patch("/:id/status", async (req, res) => {
    try {
        const { status } = req.body;

        const allowedStatuses = ["available", "occupied", "cleaning", "reserved"];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid table status"
            });
        }

        const updateData = {
            status
        };

        if (status === "available") {
            updateData.currentOrderId = null;
        }

        const updatedTable = await Table.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!updatedTable) {
            return res.status(404).json({
                success: false,
                message: "Table not found"
            });
        }

        res.json({
            success: true,
            message: "Table status updated",
            data: updatedTable
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Cannot update table status",
            error: error.message
        });
    }
});

router.patch("/:id", async (req, res) => {
    try {
        const { name, area, status } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Table name is required"
            });
        }

        const allowedStatuses = ["available", "occupied", "cleaning", "reserved"];

        if (status && !allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid table status"
            });
        }

        const updateData = {
            name,
            area: area || "Khu chính"
        };

        if (status) {
            updateData.status = status;

            if (status === "available") {
                updateData.currentOrderId = null;
            }
        }

        const updatedTable = await Table.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!updatedTable) {
            return res.status(404).json({
                success: false,
                message: "Table not found"
            });
        }

        res.json({
            success: true,
            message: "Table updated",
            data: updatedTable
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Cannot update table",
            error: error.message
        });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const table = await Table.findById(req.params.id);

        if (!table) {
            return res.status(404).json({
                success: false,
                message: "Table not found"
            });
        }

        if (table.status === "occupied") {
            return res.status(400).json({
                success: false,
                message: "Không thể xóa bàn đang có khách"
            });
        }

        const deletedTable = await Table.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: "Table deleted",
            data: deletedTable
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Cannot delete table",
            error: error.message
        });
    }
});

export default router;