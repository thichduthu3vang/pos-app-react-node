import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import AdminBranches from "./AdminBranches";
import AdminMenu from "./AdminMenu";
import AdminTables from "./AdminTables";
import AdminOrders from "./AdminOrders";
import AdminReports from "./AdminReports";
import "./AdminLayout.css";

function AdminLayout() {
    const adminEmail = localStorage.getItem("adminEmail");

    const logout = () => {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminEmail");
        window.location.href = "/admin-login";
    };

    return (
        <div className="app">
            <aside className="sidebar">
                <div className="brand">
                    <div className="brand-icon">⚙️</div>
                    <div>
                        <h1>POS Admin</h1>
                        <p>Quản trị hệ thống</p>
                    </div>
                </div>

                <div className="sidebar-box">
                    <span className="label">Tài khoản</span>
                    <strong>{adminEmail || "Admin"}</strong>
                </div>

                <div className="admin-nav">
                    <NavLink to="/admin/chi-nhanh">Admin chi nhánh</NavLink>
                    <NavLink to="/admin/menu">Admin menu</NavLink>
                    <NavLink to="/admin/tables">Admin bàn</NavLink>
                    <NavLink to="/admin/orders">Admin đơn hàng</NavLink>
                    <NavLink to="/admin/reports">Admin báo cáo</NavLink>
                    <NavLink to="/">← Quay lại POS</NavLink>

                    <button className="admin-logout-button" onClick={logout}>
                        Đăng xuất
                    </button>
                </div>
            </aside>

            <main className="main">
                <Routes>
                    <Route index element={<Navigate to="/admin/chi-nhanh" replace />} />

                    <Route path="chi-nhanh" element={<AdminBranches />} />

                    {/* Route cũ, giữ để ai lỡ vào /admin/branches vẫn không lỗi */}
                    <Route path="branches" element={<Navigate to="/admin/chi-nhanh" replace />} />

                    <Route path="menu" element={<AdminMenu />} />

                    <Route path="tables" element={<AdminTables />} />

                    <Route path="orders" element={<AdminOrders />} />

                    <Route path="reports" element={<AdminReports />} />
                </Routes>
            </main>
        </div>
    );
}

export default AdminLayout;