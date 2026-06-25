import express from "express";
import Branch from "../models/Branch.js";

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const branches = await Branch.find().sort({ createdAt: -1 });

        res.json({
            success: true,
            data: branches
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Cannot get branches",
            error: error.message
        });
    }
});

router.post("/", async (req, res) => {
    try {
        const { name, code, address, phone, isActive } = req.body;

        if (!name || !code) {
            return res.status(400).json({
                success: false,
                message: "Branch name and code are required"
            });
        }

        const existedBranch = await Branch.findOne({
            code: code.trim().toUpperCase()
        });

        if (existedBranch) {
            return res.status(400).json({
                success: false,
                message: "Mã chi nhánh đã tồn tại"
            });
        }

        const newBranch = await Branch.create({
            name,
            code: code.trim().toUpperCase(),
            address,
            phone,
            isActive
        });

        res.status(201).json({
            success: true,
            message: "Branch created",
            data: newBranch
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Cannot create branch",
            error: error.message
        });
    }
});

router.patch("/:id", async (req, res) => {
    try {
        const { name, code, address, phone, isActive } = req.body;

        if (!name || !code) {
            return res.status(400).json({
                success: false,
                message: "Branch name and code are required"
            });
        }

        const normalizedCode = code.trim().toUpperCase();

        const existedBranch = await Branch.findOne({
            code: normalizedCode,
            _id: { $ne: req.params.id }
        });

        if (existedBranch) {
            return res.status(400).json({
                success: false,
                message: "Mã chi nhánh đã tồn tại"
            });
        }

        const updatedBranch = await Branch.findByIdAndUpdate(
            req.params.id,
            {
                name,
                code: normalizedCode,
                address,
                phone,
                isActive
            },
            { new: true }
        );

        if (!updatedBranch) {
            return res.status(404).json({
                success: false,
                message: "Branch not found"
            });
        }

        res.json({
            success: true,
            message: "Branch updated",
            data: updatedBranch
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Cannot update branch",
            error: error.message
        });
    }
});

router.patch("/:id/toggle", async (req, res) => {
    try {
        const branch = await Branch.findById(req.params.id);

        if (!branch) {
            return res.status(404).json({
                success: false,
                message: "Branch not found"
            });
        }

        branch.isActive = !branch.isActive;
        await branch.save();

        res.json({
            success: true,
            message: "Branch status updated",
            data: branch
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Cannot toggle branch",
            error: error.message
        });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const deletedBranch = await Branch.findByIdAndDelete(req.params.id);

        if (!deletedBranch) {
            return res.status(404).json({
                success: false,
                message: "Branch not found"
            });
        }

        res.json({
            success: true,
            message: "Branch deleted",
            data: deletedBranch
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Cannot delete branch",
            error: error.message
        });
    }
});

export default router;