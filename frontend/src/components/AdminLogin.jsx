import { useState } from "react";
import api from "../api";
import "./AdminLogin.css";

function AdminLogin() {
    const [email, setEmail] = useState("admin@pos.com");
    const [password, setPassword] = useState("123456");
    const [loading, setLoading] = useState(false);

    const login = async (e) => {
        e.preventDefault();

        if (!email || !password) {
            alert("Vui lòng nhập email và mật khẩu");
            return;
        }

        try {
            setLoading(true);

            const response = await api.post("/api/auth/login", {
                email,
                password
            });

            const data = response.data.data;
            const admin = data.admin;

            localStorage.setItem("adminToken", data.token);
            localStorage.setItem("adminEmail", admin.email || "");
            localStorage.setItem("adminName", admin.name || "");
            localStorage.setItem("adminRole", admin.role || "staff");
            localStorage.setItem("adminBranchCode", admin.branchCode || "");
            localStorage.setItem("adminBranchName", admin.branchName || "");

            if (admin.role === "staff" && admin.branchCode) {
                window.location.href = `/pos/${admin.branchCode}`;
            } else {
                window.location.href = "/admin/dashboard";
            }
        } catch (error) {
            console.error("Cannot login:", error);
            alert(error.response?.data?.message || "Đăng nhập thất bại");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-login-page">
            <form className="admin-login-card" onSubmit={login}>
                <div className="admin-login-logo">☕</div>

                <h1>POS Admin</h1>
                <p>Đăng nhập để quản lý hệ thống</p>

                <label>
                    Email
                    <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@pos.com"
                    />
                </label>

                <label>
                    Mật khẩu
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="123456"
                    />
                </label>

                <button type="submit" disabled={loading}>
                    {loading ? "Đang đăng nhập..." : "Đăng nhập"}
                </button>

                <small>
                    Owner mặc định: admin@pos.com / 123456
                </small>
            </form>
        </div>
    );
}

export default AdminLogin;