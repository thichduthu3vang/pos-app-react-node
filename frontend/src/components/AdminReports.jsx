import { useEffect, useState } from "react";
import api from "../api";
import "./AdminReports.css";

const getToday = () => {
    return new Date().toISOString().slice(0, 10);
};

const emptyReport = {
    totalOrders: 0,
    totalRevenue: 0,
    totalPaidOrders: 0,
    totalUnpaidOrders: 0,
    totalCancelledOrders: 0,
    averageOrderValue: 0,
    revenueByDay: [],
    orders: []
};

function AdminReports() {
    const adminRole = localStorage.getItem("adminRole");
    const adminBranchCode = localStorage.getItem("adminBranchCode");
    const adminBranchName = localStorage.getItem("adminBranchName");

    const isOwner = adminRole === "owner";
    const isStaff = adminRole === "staff";

    const staffBranchCode = adminBranchCode ? adminBranchCode.toUpperCase() : "";

    const [branches, setBranches] = useState([]);
    const [branchTodayReport, setBranchTodayReport] = useState({
        totalRevenue: 0,
        branches: []
    });

    const [selectedBranchCode, setSelectedBranchCode] = useState(
        isStaff ? staffBranchCode : ""
    );

    const [startDate, setStartDate] = useState(getToday());
    const [endDate, setEndDate] = useState(getToday());
    const [report, setReport] = useState(emptyReport);
    const [loading, setLoading] = useState(true);

    const currentBranchCode = isStaff ? staffBranchCode : selectedBranchCode;

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

    const getPaymentStatusText = (status) => {
        if (status === "paid") return "Đã thanh toán";
        if (status === "unpaid") return "Chưa thanh toán";
        return status || "Không rõ";
    };

    const getPaymentMethodText = (method) => {
        if (method === "cash") return "Tiền mặt";
        if (method === "bank") return "Chuyển khoản";
        if (method === "card") return "Thẻ";
        if (method === "momo") return "MoMo";
        if (method === "zalopay") return "ZaloPay";
        return method || "Chưa có";
    };

    const loadBranches = async () => {
        try {
            const response = await api.get("/api/branches");

            const activeBranches = (response.data.data || []).filter(
                (branch) => branch.isActive
            );

            setBranches(activeBranches);
        } catch (error) {
            console.error("Cannot load branches:", error);
            setBranches([]);
        }
    };

    const loadBranchTodayReport = async () => {
        if (!isOwner) {
            setBranchTodayReport({
                totalRevenue: 0,
                branches: []
            });
            return;
        }

        try {
            const response = await api.get("/api/reports/branches/today");

            setBranchTodayReport(
                response.data.data || {
                    totalRevenue: 0,
                    branches: []
                }
            );
        } catch (error) {
            console.error("Cannot load branch today report:", error);
            setBranchTodayReport({
                totalRevenue: 0,
                branches: []
            });
        }
    };

    const loadReport = async () => {
        try {
            setLoading(true);

            if (isStaff && !staffBranchCode) {
                alert("Tài khoản nhân viên này chưa được gán chi nhánh");
                setReport(emptyReport);
                return;
            }

            const response = await api.get("/api/reports/summary", {
                params: {
                    startDate,
                    endDate,
                    ...(currentBranchCode ? { branchCode: currentBranchCode } : {})
                }
            });

            setReport(response.data.data || emptyReport);
        } catch (error) {
            console.error("Cannot load report:", error);
            alert(error.response?.data?.message || "Không thể tải báo cáo doanh thu");
            setReport(emptyReport);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBranches();
        loadBranchTodayReport();
    }, []);

    useEffect(() => {
        loadReport();
    }, [currentBranchCode, startDate, endDate]);

    const selectedBranch = branches.find(
        (branch) => branch.code === currentBranchCode
    );

    const branchLabel = isStaff
        ? `${adminBranchName || selectedBranch?.name || "Chi nhánh"} - ${staffBranchCode}`
        : selectedBranch
            ? `${selectedBranch.name} - ${selectedBranch.code}`
            : "Tất cả chi nhánh";

    const maxRevenueByDay = Math.max(
        ...report.revenueByDay.map((item) => Number(item.revenue || 0)),
        1
    );

    const maxBranchRevenue = Math.max(
        ...branchTodayReport.branches.map((item) => Number(item.totalRevenue || 0)),
        1
    );

    return (
        <section className="admin-report-page">
            <div className="admin-report-hero">
                <div>
                    <h2>Admin - Báo cáo doanh thu</h2>

                    <p>Xem doanh thu tổng hoặc lọc theo từng chi nhánh.</p>
                </div>

                <button
                    onClick={() => {
                        loadReport();
                        loadBranchTodayReport();
                    }}
                >
                    Làm mới
                </button>
            </div>

            <div className="admin-report-filter-card">
                <label>
                    Từ ngày
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                </label>

                <label>
                    Đến ngày
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                </label>

                <label>
                    Chi nhánh
                    {isStaff ? (
                        <input value={branchLabel} disabled />
                    ) : (
                        <select
                            value={selectedBranchCode}
                            onChange={(e) => setSelectedBranchCode(e.target.value)}
                        >
                            <option value="">Tất cả chi nhánh</option>

                            {branches.map((branch) => (
                                <option key={branch._id} value={branch.code}>
                                    {branch.name} - {branch.code}
                                </option>
                            ))}
                        </select>
                    )}
                </label>
            </div>

            <div className="admin-report-stats">
                <div className="admin-report-stat revenue">
                    <span>Doanh thu</span>
                    <strong>{formatMoney(report.totalRevenue)}</strong>
                </div>

                <div className="admin-report-stat">
                    <span>Tổng đơn</span>
                    <strong>{report.totalOrders || 0}</strong>
                </div>

                <div className="admin-report-stat">
                    <span>Đã thanh toán</span>
                    <strong>{report.totalPaidOrders || 0}</strong>
                </div>

                <div className="admin-report-stat">
                    <span>Chưa thanh toán</span>
                    <strong>{report.totalUnpaidOrders || 0}</strong>
                </div>

                <div className="admin-report-stat cancelled">
                    <span>Đơn đã hủy</span>
                    <strong>{report.totalCancelledOrders || 0}</strong>
                </div>

                <div className="admin-report-stat">
                    <span>Trung bình / đơn</span>
                    <strong>{formatMoney(report.averageOrderValue)}</strong>
                </div>
            </div>

            <div className="admin-report-card">
                <h3>Biểu đồ doanh thu theo ngày - {branchLabel}</h3>

                {loading ? (
                    <div className="admin-report-empty">Đang tải báo cáo...</div>
                ) : report.revenueByDay.length === 0 ? (
                    <div className="admin-report-empty">
                        Không có doanh thu trong khoảng ngày này.
                    </div>
                ) : (
                    <div className="admin-report-chart-list">
                        {report.revenueByDay.map((item) => (
                            <div className="admin-report-bar-item" key={item.date}>
                                <div className="admin-report-bar-top">
                                    <span>{item.date}</span>
                                    <span>
                                        {formatMoney(item.revenue)} · {item.orders} đơn
                                    </span>
                                </div>

                                <div className="admin-report-progress">
                                    <div
                                        className="green"
                                        style={{
                                            width: `${Math.max(
                                                (Number(item.revenue || 0) / maxRevenueByDay) * 100,
                                                4
                                            )}%`
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {isOwner && (
                <div className="admin-report-card">
                    <h3>So sánh doanh thu chi nhánh hôm nay</h3>

                    {branchTodayReport.branches.length === 0 ? (
                        <div className="admin-report-empty">
                            Hôm nay chưa có doanh thu chi nhánh.
                        </div>
                    ) : (
                        <div className="admin-report-chart-list">
                            {branchTodayReport.branches.map((branch) => (
                                <div className="admin-report-bar-item" key={branch.branchCode}>
                                    <div className="admin-report-bar-top">
                                        <span>
                                            {branch.branchName} - {branch.branchCode}
                                        </span>
                                        <span>
                                            {formatMoney(branch.totalRevenue)} ·{" "}
                                            {branch.totalPaidOrders} đơn
                                        </span>
                                    </div>

                                    <div className="admin-report-progress">
                                        <div
                                            className="brown"
                                            style={{
                                                width: `${Math.max(
                                                    (Number(branch.totalRevenue || 0) /
                                                        maxBranchRevenue) *
                                                    100,
                                                    4
                                                )}%`
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <div className="admin-report-card table-card">
                <h3>Danh sách đơn trong báo cáo - {branchLabel}</h3>

                {loading ? (
                    <div className="admin-report-empty">Đang tải danh sách đơn...</div>
                ) : report.orders.length === 0 ? (
                    <div className="admin-report-empty">
                        Không có đơn nào trong báo cáo.
                    </div>
                ) : (
                    <div className="admin-report-table-wrap">
                        <table className="admin-report-table">
                            <thead>
                                <tr>
                                    <th>Thời gian</th>
                                    <th>Chi nhánh</th>
                                    <th>Bàn</th>
                                    <th>Khách</th>
                                    <th>Tổng tiền</th>
                                    <th>Thanh toán</th>
                                    <th>Trạng thái</th>
                                </tr>
                            </thead>

                            <tbody>
                                {report.orders.map((order) => (
                                    <tr key={order._id}>
                                        <td>
                                            {order.createdAt
                                                ? new Date(order.createdAt).toLocaleString("vi-VN")
                                                : "Không rõ"}
                                        </td>

                                        <td>{order.branchName || order.branchCode || "Chưa gán"}</td>

                                        <td>{order.tableName || "Takeaway"}</td>

                                        <td>{order.customerName || "Không có"}</td>

                                        <td>
                                            <strong>{formatMoney(order.totalAmount)}</strong>
                                        </td>

                                        <td>
                                            <span className={`payment-status ${order.paymentStatus}`}>
                                                {getPaymentStatusText(order.paymentStatus)}
                                            </span>

                                            <small>{getPaymentMethodText(order.paymentMethod)}</small>
                                        </td>

                                        <td>
                                            <span className={`order-status ${order.status}`}>
                                                {getOrderStatusText(order.status)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </section>
    );
}

export default AdminReports;