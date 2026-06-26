import express from "express";
import bcrypt from "bcryptjs";
import AdminUser from "../models/AdminUser.js";
import Branch from "../models/Branch.js";

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const users = await AdminUser.find()
            .select("-passwordHash")
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Cannot get admin users",
            error: error.message
        });
    }
});

router.post("/", async (req, res) => {
    try {
        const { name, email, password, role, branchCode, isActive } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email và mật khẩu là bắt buộc"
            });
        }

        const cleanEmail = email.trim().toLowerCase();

        const existedUser = await AdminUser.findOne({ email: cleanEmail });

        if (existedUser) {
            return res.status(400).json({
                success: false,
                message: "Email này đã tồn tại"
            });
        }

        const cleanRole = role === "owner" ? "owner" : "staff";

        let branchPayload = {
            branchCode: "",
            branchName: ""
        };

        if (cleanRole === "staff") {
            if (!branchCode) {
                return res.status(400).json({
                    success: false,
                    message: "Tài khoản nhân viên phải chọn chi nhánh"
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

            branchPayload = {
                branchCode: branch.code,
                branchName: branch.name
            };
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const newUser = await AdminUser.create({
            name,
            email: cleanEmail,
            passwordHash,
            role: cleanRole,
            ...branchPayload,
            isActive: isActive === false ? false : true
        });

        const safeUser = await AdminUser.findById(newUser._id).select(
            "-passwordHash"
        );

        res.status(201).json({
            success: true,
            message: "Admin user created",
            data: safeUser
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Cannot create admin user",
            error: error.message
        });
    }
});

router.patch("/:id", async (req, res) => {
    try {
        const { name, email, password, role, branchCode, isActive } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email là bắt buộc"
            });
        }

        const cleanEmail = email.trim().toLowerCase();

        const existedUser = await AdminUser.findOne({
            email: cleanEmail,
            _id: { $ne: req.params.id }
        });

        if (existedUser) {
            return res.status(400).json({
                success: false,
                message: "Email này đã tồn tại"
            });
        }

        const cleanRole = role === "owner" ? "owner" : "staff";

        let branchPayload = {
            branchCode: "",
            branchName: ""
        };

        if (cleanRole === "staff") {
            if (!branchCode) {
                return res.status(400).json({
                    success: false,
                    message: "Tài khoản nhân viên phải chọn chi nhánh"
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

            branchPayload = {
                branchCode: branch.code,
                branchName: branch.name
            };
        }

        const payload = {
            name,
            email: cleanEmail,
            role: cleanRole,
            ...branchPayload,
            isActive: isActive === false ? false : true
        };

        if (password) {
            payload.passwordHash = await bcrypt.hash(password, 10);
        }

        const updatedUser = await AdminUser.findByIdAndUpdate(
            req.params.id,
            payload,
            { new: true }
        ).select("-passwordHash");

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy tài khoản"
            });
        }

        res.json({
            success: true,
            message: "Admin user updated",
            data: updatedUser
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Cannot update admin user",
            error: error.message
        });
    }
});

router.patch("/:id/toggle", async (req, res) => {
    try {
        const user = await AdminUser.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy tài khoản"
            });
        }

        user.isActive = !user.isActive;

        await user.save();

        const safeUser = await AdminUser.findById(user._id).select("-passwordHash");

        res.json({
            success: true,
            message: "Admin user status updated",
            data: safeUser
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Cannot toggle admin user",
            error: error.message
        });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const deletedUser = await AdminUser.findByIdAndDelete(req.params.id).select(
            "-passwordHash"
        );

        if (!deletedUser) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy tài khoản"
            });
        }

        res.json({
            success: true,
            message: "Admin user deleted",
            data: deletedUser
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Cannot delete admin user",
            error: error.message
        });
    }
});

export default router;