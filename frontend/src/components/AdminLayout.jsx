import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import AdminMenu from "./AdminMenu";
import AdminTables from "./AdminTables";
import AdminOrders from "./AdminOrders";
import AdminReports from "./AdminReports";
import "./AdminLayout.css";

function AdminLayout({ onMenuChanged, onTablesChanged, onOrdersChanged }) {
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
                    <Route index element={<Navigate to="/admin/menu" replace />} />

                    <Route
                        path="menu"
                        element={<AdminMenu onMenuChanged={onMenuChanged} />}
                    />

                    <Route
                        path="tables"
                        element={<AdminTables onTablesChanged={onTablesChanged} />}
                    />

                    <Route
                        path="orders"
                        element={<AdminOrders onOrdersChanged={onOrdersChanged} />}
                    />

                    <Route path="reports" element={<AdminReports />} />
                </Routes>
            </main>
        </div>
    );
}

export default AdminLayout;