import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import AdminDashboard from "./AdminDashboard";
import AdminBranches from "./AdminBranches";
import AdminUsers from "./AdminUsers";
import AdminMenu from "./AdminMenu";
import AdminTables from "./AdminTables";
import AdminOrders from "./AdminOrders";
import AdminReports from "./AdminReports";
import "./AdminLayout.css";

function AdminLayout() {
    const adminEmail = localStorage.getItem("adminEmail");
    const adminRole = localStorage.getItem("adminRole");
    const adminBranchName = localStorage.getItem("adminBranchName");
    const adminBranchCode = localStorage.getItem("adminBranchCode");

    const isOwner = adminRole === "owner";
    const isStaff = adminRole === "staff";

    const logout = () => {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminEmail");
        localStorage.removeItem("adminName");
        localStorage.removeItem("adminRole");
        localStorage.removeItem("adminBranchCode");
        localStorage.removeItem("adminBranchName");
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

                <div className="sidebar-box">
                    <span className="label">Vai trò</span>
                    <strong>{isOwner ? "Owner" : "Staff"}</strong>
                </div>

                {isStaff && (
                    <div className="sidebar-box">
                        <span className="label">Chi nhánh</span>
                        <strong>{adminBranchName || adminBranchCode}</strong>
                    </div>
                )}

                <div className="admin-nav">
                    {isOwner && (
                        <>
                            <NavLink to="/admin/dashboard">Dashboard tổng</NavLink>
                            <NavLink to="/admin/chi-nhanh">Admin chi nhánh</NavLink>
                            <NavLink to="/admin/users">Admin tài khoản</NavLink>
                        </>
                    )}

                    <NavLink to="/admin/menu">Admin menu</NavLink>
                    <NavLink to="/admin/tables">Admin bàn</NavLink>
                    <NavLink to="/admin/orders">Admin đơn hàng</NavLink>
                    <NavLink to="/admin/reports">Admin báo cáo</NavLink>

                    <NavLink
                        to={isStaff && adminBranchCode ? `/pos/${adminBranchCode}` : "/"}
                    >
                        ← Quay lại POS
                    </NavLink>

                    <button className="admin-logout-button" onClick={logout}>
                        Đăng xuất
                    </button>
                </div>
            </aside>

            <main className="main">
                <Routes>
                    <Route
                        index
                        element={
                            isOwner ? (
                                <Navigate to="/admin/dashboard" replace />
                            ) : (
                                <Navigate to="/admin/orders" replace />
                            )
                        }
                    />

                    {isOwner && (
                        <>
                            <Route path="dashboard" element={<AdminDashboard />} />
                            <Route path="chi-nhanh" element={<AdminBranches />} />
                            <Route
                                path="branches"
                                element={<Navigate to="/admin/chi-nhanh" replace />}
                            />
                            <Route path="users" element={<AdminUsers />} />
                        </>
                    )}

                    <Route path="menu" element={<AdminMenu />} />

                    <Route path="tables" element={<AdminTables />} />

                    <Route path="orders" element={<AdminOrders />} />

                    <Route path="reports" element={<AdminReports />} />

                    <Route
                        path="*"
                        element={
                            isOwner ? (
                                <Navigate to="/admin/dashboard" replace />
                            ) : (
                                <Navigate to="/admin/orders" replace />
                            )
                        }
                    />
                </Routes>
            </main>
        </div>
    );
}

export default AdminLayout;