import express from "express";
import jwt from "jsonwebtoken";

const router = express.Router();

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;
        const jwtSecret = process.env.JWT_SECRET;

        if (!adminEmail || !adminPassword || !jwtSecret) {
            return res.status(500).json({
                success: false,
                message: "Admin login config is missing in .env"
            });
        }

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        if (email !== adminEmail || password !== adminPassword) {
            return res.status(401).json({
                success: false,
                message: "Email hoặc mật khẩu không đúng"
            });
        }

        const token = jwt.sign(
            {
                role: "admin",
                email
            },
            jwtSecret,
            {
                expiresIn: "1d"
            }
        );

        res.json({
            success: true,
            message: "Login successful",
            data: {
                token,
                admin: {
                    email,
                    role: "admin"
                }
            }
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