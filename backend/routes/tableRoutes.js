import express from "express";
import Table from "../models/Table.js";
import Branch from "../models/Branch.js";

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const { branchCode } = req.query;

        const filter = {};

        if (branchCode) {
            filter.branchCode = branchCode.trim().toUpperCase();
        }

        const tables = await Table.find(filter).sort({ createdAt: -1 });

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

router.get("/:id", async (req, res) => {
    try {
        const table = await Table.findById(req.params.id);

        if (!table) {
            return res.status(404).json({
                success: false,
                message: "Table not found"
            });
        }

        res.json({
            success: true,
            data: table
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Cannot get table",
            error: error.message
        });
    }
});

router.post("/", async (req, res) => {
    try {
        const { branchCode, name, area, status } = req.body;

        if (!branchCode) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng chọn chi nhánh cho bàn"
            });
        }

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Table name is required"
            });
        }

        const branch = await Branch.findOne({
            code: branchCode.trim().toUpperCase(),
            isActive: true
        });

        if (!branch) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy chi nhánh hoặc chi nhánh đang tạm tắt"
            });
        }

        const newTable = await Table.create({
            branchId: branch._id,
            branchCode: branch.code,
            branchName: branch.name,
            name,
            area,
            status: status || "available"
        });

        res.status(201).json({
            success: true,
            message: "Table created successfully",
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

router.patch("/:id", async (req, res) => {
    try {
        const { branchCode, name, area, status } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Table name is required"
            });
        }

        let branchPayload = {};

        if (branchCode) {
            const branch = await Branch.findOne({
                code: branchCode.trim().toUpperCase(),
                isActive: true
            });

            if (!branch) {
                return res.status(404).json({
                    success: false,
                    message: "Không tìm thấy chi nhánh hoặc chi nhánh đang tạm tắt"
                });
            }

            branchPayload = {
                branchId: branch._id,
                branchCode: branch.code,
                branchName: branch.name
            };
        }

        const updatedTable = await Table.findByIdAndUpdate(
            req.params.id,
            {
                ...branchPayload,
                name,
                area,
                status
            },
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
            message: "Table updated successfully",
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

        const payload = {
            status
        };

        if (status === "available") {
            payload.currentOrderId = null;
        }

        const updatedTable = await Table.findByIdAndUpdate(req.params.id, payload, {
            new: true
        });

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

router.delete("/:id", async (req, res) => {
    try {
        const deletedTable = await Table.findByIdAndDelete(req.params.id);

        if (!deletedTable) {
            return res.status(404).json({
                success: false,
                message: "Table not found"
            });
        }

        res.json({
            success: true,
            message: "Table deleted successfully",
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