import { useEffect, useState } from "react";
import api from "../api";
import "./AdminDashboard.css";

const emptyDashboard = {
    totalRevenue: 0,
    totalOrders: 0,
    totalPaidOrders: 0,
    totalUnpaidOrders: 0,
    totalCancelledOrders: 0,
    bestBranch: null,
    branches: [],
    recentOrders: []
};

function AdminDashboard() {
    const [dashboard, setDashboard] = useState(emptyDashboard);
    const [loading, setLoading] = useState(true);

    const formatMoney = (amount) => {
        return Number(amount || 0).toLocaleString("vi-VN") + "đ";
    };

    const getOrderStatusText = (status) => {
        if (status === "pending") return "Đơn mới";
        if (status === "preparing") return "Đang pha chế";
        if (status === "completed") return "Hoàn thành";
        if (status === "cancelled") return "Đã hủy";
        return status || "Không rõ";
    };

    const getPaymentText = (status) => {
        if (status === "paid") return "Đã thanh toán";
        if (status === "unpaid") return "Chưa thanh toán";
        return status || "Không rõ";
    };

    const loadDashboard = async () => {
        try {
            setLoading(true);

            const response = await api.get("/api/reports/dashboard");

            setDashboard(response.data.data || emptyDashboard);
        } catch (error) {
            console.error("Cannot load dashboard:", error);
            alert("Không thể tải dashboard tổng");
            setDashboard(emptyDashboard);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboard();
    }, []);

    const maxRevenue = Math.max(
        ...dashboard.branches.map((branch) => Number(branch.totalRevenue || 0)),
        1
    );

    return (
        <section className="admin-dashboard-page">
            <div className="admin-dashboard-hero">
                <div>
                    <h2>Dashboard tổng</h2>
                    <p>Toàn cảnh doanh thu và hoạt động hôm nay của tất cả chi nhánh.</p>
                </div>

                <button onClick={loadDashboard}>Làm mới</button>
            </div>

            {loading ? (
                <div className="admin-dashboard-empty">Đang tải dashboard...</div>
            ) : (
                <>
                    <div className="dashboard-stats-grid">
                        <div className="dashboard-stat-card revenue">
                            <span>Doanh thu hôm nay</span>
                            <strong>{formatMoney(dashboard.totalRevenue)}</strong>
                        </div>

                        <div className="dashboard-stat-card">
                            <span>Tổng đơn hôm nay</span>
                            <strong>{dashboard.totalOrders || 0}</strong>
                        </div>

                        <div className="dashboard-stat-card">
                            <span>Đã thanh toán</span>
                            <strong>{dashboard.totalPaidOrders || 0}</strong>
                        </div>

                        <div className="dashboard-stat-card">
                            <span>Chưa thanh toán</span>
                            <strong>{dashboard.totalUnpaidOrders || 0}</strong>
                        </div>

                        <div className="dashboard-stat-card">
                            <span>Đơn đã hủy</span>
                            <strong>{dashboard.totalCancelledOrders || 0}</strong>
                        </div>

                        <div className="dashboard-stat-card best">
                            <span>Chi nhánh tốt nhất</span>
                            <strong>
                                {dashboard.bestBranch
                                    ? dashboard.bestBranch.branchName
                                    : "Chưa có"}
                            </strong>
                        </div>
                    </div>

                    <div className="dashboard-layout">
                        <div className="dashboard-card">
                            <div className="dashboard-card-header">
                                <div>
                                    <h3>Doanh thu theo chi nhánh</h3>
                                    <p>So sánh doanh thu hôm nay giữa các chi nhánh.</p>
                                </div>
                            </div>

                            {dashboard.branches.length === 0 ? (
                                <div className="admin-dashboard-empty small">
                                    Hôm nay chưa có dữ liệu chi nhánh.
                                </div>
                            ) : (
                                <div className="branch-performance-list">
                                    {dashboard.branches.map((branch) => (
                                        <div
                                            className="branch-performance-item"
                                            key={branch.branchCode}
                                        >
                                            <div className="branch-performance-top">
                                                <div>
                                                    <h4>{branch.branchName}</h4>
                                                    <p>
                                                        {branch.branchCode} · {branch.totalOrders} đơn ·{" "}
                                                        {branch.paidOrders} đã thanh toán
                                                    </p>
                                                </div>

                                                <strong>{formatMoney(branch.totalRevenue)}</strong>
                                            </div>

                                            <div className="branch-progress">
                                                <div
                                                    style={{
                                                        width: `${Math.max(
                                                            (Number(branch.totalRevenue || 0) / maxRevenue) *
                                                            100,
                                                            4
                                                        )}%`
                                                    }}
                                                />
                                            </div>

                                            <div className="branch-mini-stats">
                                                <span>Chưa thanh toán: {branch.unpaidOrders}</span>
                                                <span>Đã hủy: {branch.cancelledOrders}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="dashboard-card">
                            <div className="dashboard-card-header">
                                <div>
                                    <h3>Đơn mới gần đây</h3>
                                    <p>Các đơn phát sinh mới nhất trong hôm nay.</p>
                                </div>
                            </div>

                            {dashboard.recentOrders.length === 0 ? (
                                <div className="admin-dashboard-empty small">
                                    Hôm nay chưa có đơn nào.
                                </div>
                            ) : (
                                <div className="recent-order-list">
                                    {dashboard.recentOrders.map((order) => (
                                        <div className="recent-order-item" key={order._id}>
                                            <div>
                                                <h4>{order.tableName || "Takeaway"}</h4>
                                                <p>
                                                    {order.branchName || order.branchCode || "Chưa gán"} ·{" "}
                                                    {order.createdAt
                                                        ? new Date(order.createdAt).toLocaleTimeString(
                                                            "vi-VN"
                                                        )
                                                        : "Không rõ"}
                                                </p>
                                            </div>

                                            <div className="recent-order-side">
                                                <strong>{formatMoney(order.totalAmount)}</strong>
                                                <span>{getPaymentText(order.paymentStatus)}</span>
                                                <em>{getOrderStatusText(order.status)}</em>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </section>
    );
}

export default AdminDashboard;