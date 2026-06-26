import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import AdminUser from "../models/AdminUser.js";

const router = express.Router();

const createToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "1d"
    });
};

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({
                success: false,
                message: "JWT_SECRET is missing in .env"
            });
        }

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const cleanEmail = email.trim().toLowerCase();

        const dbUser = await AdminUser.findOne({
            email: cleanEmail
        });

        if (dbUser) {
            if (!dbUser.isActive) {
                return res.status(403).json({
                    success: false,
                    message: "Tài khoản này đang bị tạm tắt"
                });
            }

            const isPasswordCorrect = await bcrypt.compare(
                password,
                dbUser.passwordHash
            );

            if (!isPasswordCorrect) {
                return res.status(401).json({
                    success: false,
                    message: "Email hoặc mật khẩu không đúng"
                });
            }

            const token = createToken({
                id: dbUser._id,
                email: dbUser.email,
                name: dbUser.name,
                role: dbUser.role,
                branchCode: dbUser.branchCode,
                branchName: dbUser.branchName
            });

            return res.json({
                success: true,
                message: "Login successful",
                data: {
                    token,
                    admin: {
                        id: dbUser._id,
                        name: dbUser.name,
                        email: dbUser.email,
                        role: dbUser.role,
                        branchCode: dbUser.branchCode,
                        branchName: dbUser.branchName
                    }
                }
            });
        }

        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (cleanEmail === adminEmail && password === adminPassword) {
            const token = createToken({
                email: adminEmail,
                name: "Owner",
                role: "owner",
                branchCode: "",
                branchName: ""
            });

            return res.json({
                success: true,
                message: "Login successful",
                data: {
                    token,
                    admin: {
                        name: "Owner",
                        email: adminEmail,
                        role: "owner",
                        branchCode: "",
                        branchName: ""
                    }
                }
            });
        }

        return res.status(401).json({
            success: false,
            message: "Email hoặc mật khẩu không đúng"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Cannot login",
            error: error.message
        });
    }
});

export default router;