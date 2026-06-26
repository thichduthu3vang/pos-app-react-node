import express from "express";
import Table from "../models/Table.js";
import Branch from "../models/Branch.js";
import { verifyToken, requireBranchAccess } from "../middleware/authMiddleware.js";

const router = express.Router();

const canAccessTable = (req, table) => {
    if (req.user?.role === "owner") return true;

    const userBranchCode = req.user?.branchCode
        ? req.user.branchCode.toUpperCase()
        : "";

    const tableBranchCode = table.branchCode ? table.branchCode.toUpperCase() : "";

    return userBranchCode && tableBranchCode && userBranchCode === tableBranchCode;
};

router.get("/", verifyToken, requireBranchAccess, async (req, res) => {
    try {
        const branchCode = req.allowedBranchCode || req.query.branchCode;

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

// Route này để QR khách hàng vẫn đọc được thông tin bàn
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

router.post("/", verifyToken, requireBranchAccess, async (req, res) => {
    try {
        const { name, area, status } = req.body;

        const branchCode = req.allowedBranchCode || req.body.branchCode;

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

router.patch("/:id", verifyToken, async (req, res) => {
    try {
        const { name, area, status } = req.body;

        let branchCode = req.body.branchCode;

        const table = await Table.findById(req.params.id);

        if (!table) {
            return res.status(404).json({
                success: false,
                message: "Table not found"
            });
        }

        if (!canAccessTable(req, table)) {
            return res.status(403).json({
                success: false,
                message: "Bạn không có quyền sửa bàn của chi nhánh khác"
            });
        }

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Table name is required"
            });
        }

        if (req.user?.role === "staff") {
            branchCode = req.user.branchCode;
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

        table.name = name;
        table.area = area || "Khu chính";
        table.status = status || table.status;

        if (branchPayload.branchCode) {
            table.branchId = branchPayload.branchId;
            table.branchCode = branchPayload.branchCode;
            table.branchName = branchPayload.branchName;
        }

        await table.save();

        res.json({
            success: true,
            message: "Table updated successfully",
            data: table
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Cannot update table",
            error: error.message
        });
    }
});

router.patch("/:id/status", verifyToken, async (req, res) => {
    try {
        const { status } = req.body;

        const allowedStatuses = ["available", "occupied", "cleaning", "reserved"];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid table status"
            });
        }

        const table = await Table.findById(req.params.id);

        if (!table) {
            return res.status(404).json({
                success: false,
                message: "Table not found"
            });
        }

        if (!canAccessTable(req, table)) {
            return res.status(403).json({
                success: false,
                message: "Bạn không có quyền đổi trạng thái bàn của chi nhánh khác"
            });
        }

        table.status = status;

        if (status === "available") {
            table.currentOrderId = null;
        }

        await table.save();

        res.json({
            success: true,
            message: "Table status updated",
            data: table
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Cannot update table status",
            error: error.message
        });
    }
});

router.delete("/:id", verifyToken, async (req, res) => {
    try {
        const table = await Table.findById(req.params.id);

        if (!table) {
            return res.status(404).json({
                success: false,
                message: "Table not found"
            });
        }

        if (!canAccessTable(req, table)) {
            return res.status(403).json({
                success: false,
                message: "Bạn không có quyền xóa bàn của chi nhánh khác"
            });
        }

        await Table.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: "Table deleted successfully",
            data: table
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