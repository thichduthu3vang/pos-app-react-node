import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "./AdminLogin.css";

function AdminLogin() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        email: "admin@pos.com",
        password: "123456"
    });

    const [loading, setLoading] = useState(false);

    const handleChange = (field, value) => {
        setForm({
            ...form,
            [field]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.email || !form.password) {
            alert("Vui lòng nhập email và mật khẩu");
            return;
        }

        try {
            setLoading(true);

            const response = await api.post("/api/auth/login", {
                email: form.email,
                password: form.password
            });

            const token = response.data?.data?.token;

            if (!token) {
                alert("Đăng nhập thành công nhưng không nhận được token");
                return;
            }

            localStorage.setItem("adminToken", token);
            localStorage.setItem("adminEmail", form.email);

            // Chuyển thẳng vào trang Admin menu
            window.location.href = "/admin/menu";
        } catch (error) {
            console.error("Cannot login:", error);
            alert(error.response?.data?.message || "Đăng nhập thất bại");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-login-page">
            <form className="admin-login-card" onSubmit={handleSubmit}>
                <div className="admin-login-icon">⚙️</div>

                <h1>POS Admin</h1>
                <p>Đăng nhập để quản lý menu, bàn, đơn hàng và báo cáo.</p>

                <label>
                    Email
                    <input
                        value={form.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        placeholder="admin@pos.com"
                    />
                </label>

                <label>
                    Mật khẩu
                    <input
                        type="password"
                        value={form.password}
                        onChange={(e) => handleChange("password", e.target.value)}
                        placeholder="Nhập mật khẩu"
                    />
                </label>

                <button type="submit" disabled={loading}>
                    {loading ? "Đang đăng nhập..." : "Đăng nhập Admin"}
                </button>

                <button
                    type="button"
                    className="back-button"
                    onClick={() => navigate("/")}
                >
                    Quay lại POS
                </button>
            </form>
        </div>
    );
}

export default AdminLogin;