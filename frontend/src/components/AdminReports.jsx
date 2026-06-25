import { useEffect, useState } from "react";
import api from "../api";

const getTodayInputValue = () => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
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
    const [branches, setBranches] = useState([]);
    const [selectedBranchCode, setSelectedBranchCode] = useState("");
    const [startDate, setStartDate] = useState(getTodayInputValue());
    const [endDate, setEndDate] = useState(getTodayInputValue());
    const [report, setReport] = useState(emptyReport);
    const [branchTodayReport, setBranchTodayReport] = useState({
        totalRevenue: 0,
        branches: []
    });
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

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

    const loadReport = async () => {
        try {
            setLoading(true);
            setErrorMessage("");

            const params = {
                startDate,
                endDate
            };

            if (selectedBranchCode) {
                params.branchCode = selectedBranchCode;
            }

            const response = await api.get("/api/reports/summary", {
                params
            });

            setReport(response.data.data || emptyReport);
        } catch (error) {
            console.error("Cannot load report:", error);
            setReport(emptyReport);
            setErrorMessage(
                error.response?.data?.message || "Không thể tải báo cáo doanh thu"
            );
        } finally {
            setLoading(false);
        }
    };

    const loadBranchTodayReport = async () => {
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

    const reloadAllReports = () => {
        loadReport();
        loadBranchTodayReport();
    };

    useEffect(() => {
        loadBranches();
    }, []);

    useEffect(() => {
        reloadAllReports();
    }, [startDate, endDate, selectedBranchCode]);

    const revenueByDay = report.revenueByDay || [];
    const orders = report.orders || [];
    const maxRevenue = Math.max(
        ...revenueByDay.map((item) => Number(item.revenue || 0)),
        1
    );

    return (
        <section style={{ minHeight: "100vh" }}>
            <div
                style={{
                    background: "white",
                    border: "1px solid var(--border)",
                    borderRadius: 24,
                    padding: 22,
                    marginBottom: 24,
                    boxShadow: "0 14px 35px rgba(80, 52, 27, 0.08)"
                }}
            >
                <h2 style={{ margin: 0, fontSize: 32 }}>Admin - Báo cáo doanh thu</h2>
                <p style={{ margin: "8px 0 0", color: "var(--muted)" }}>
                    Xem doanh thu tổng hoặc lọc theo từng chi nhánh.
                </p>
            </div>

            <div
                style={{
                    background: "white",
                    border: "1px solid var(--border)",
                    borderRadius: 24,
                    padding: 20,
                    marginBottom: 24,
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: 14
                }}
            >
                <label style={{ display: "grid", gap: 7, fontWeight: 800 }}>
                    Từ ngày
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        style={{
                            border: "1px solid var(--border)",
                            background: "var(--soft)",
                            padding: 12,
                            borderRadius: 14
                        }}
                    />
                </label>

                <label style={{ display: "grid", gap: 7, fontWeight: 800 }}>
                    Đến ngày
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        style={{
                            border: "1px solid var(--border)",
                            background: "var(--soft)",
                            padding: 12,
                            borderRadius: 14
                        }}
                    />
                </label>

                <label style={{ display: "grid", gap: 7, fontWeight: 800 }}>
                    Chi nhánh
                    <select
                        value={selectedBranchCode}
                        onChange={(e) => setSelectedBranchCode(e.target.value)}
                        style={{
                            border: "1px solid var(--border)",
                            background: "var(--soft)",
                            padding: 12,
                            borderRadius: 14
                        }}
                    >
                        <option value="">Tất cả chi nhánh</option>

                        {branches.map((branch) => (
                            <option key={branch._id} value={branch.code}>
                                {branch.name} - {branch.code}
                            </option>
                        ))}
                    </select>
                </label>

                <button
                    onClick={reloadAllReports}
                    style={{
                        alignSelf: "end",
                        background: "var(--primary)",
                        color: "white",
                        padding: 13,
                        borderRadius: 14,
                        fontWeight: 900
                    }}
                >
                    Làm mới
                </button>
            </div>

            {errorMessage && (
                <div
                    style={{
                        background: "#ffe6e3",
                        color: "var(--red)",
                        borderRadius: 18,
                        padding: 16,
                        marginBottom: 20,
                        fontWeight: 900
                    }}
                >
                    {errorMessage}
                </div>
            )}

            {loading ? (
                <div
                    style={{
                        background: "white",
                        border: "1px dashed var(--border)",
                        borderRadius: 24,
                        padding: 40,
                        textAlign: "center",
                        color: "var(--muted)",
                        fontWeight: 900
                    }}
                >
                    Đang tải báo cáo...
                </div>
            ) : (
                <>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                            gap: 16,
                            marginBottom: 24
                        }}
                    >
                        <div className="sidebar-box" style={{ margin: 0 }}>
                            <span className="label">Doanh thu</span>
                            <strong>{formatMoney(report.totalRevenue)}</strong>
                        </div>

                        <div className="sidebar-box" style={{ margin: 0 }}>
                            <span className="label">Tổng đơn</span>
                            <strong>{report.totalOrders || 0}</strong>
                        </div>

                        <div className="sidebar-box" style={{ margin: 0 }}>
                            <span className="label">Đã thanh toán</span>
                            <strong>{report.totalPaidOrders || 0}</strong>
                        </div>

                        <div className="sidebar-box" style={{ margin: 0 }}>
                            <span className="label">Chưa thanh toán</span>
                            <strong>{report.totalUnpaidOrders || 0}</strong>
                        </div>

                        <div className="sidebar-box" style={{ margin: 0 }}>
                            <span className="label">Đơn đã hủy</span>
                            <strong>{report.totalCancelledOrders || 0}</strong>
                        </div>

                        <div className="sidebar-box" style={{ margin: 0 }}>
                            <span className="label">Trung bình / đơn</span>
                            <strong>{formatMoney(report.averageOrderValue)}</strong>
                        </div>
                    </div>

                    {!selectedBranchCode && (
                        <div
                            style={{
                                background: "white",
                                border: "1px solid var(--border)",
                                borderRadius: 24,
                                padding: 20,
                                marginBottom: 24
                            }}
                        >
                            <h3 style={{ marginTop: 0 }}>Doanh thu hôm nay theo chi nhánh</h3>

                            {branchTodayReport.branches.length === 0 ? (
                                <p style={{ color: "var(--muted)" }}>
                                    Hôm nay chưa có doanh thu theo chi nhánh.
                                </p>
                            ) : (
                                <div style={{ display: "grid", gap: 12 }}>
                                    {branchTodayReport.branches.map((branch) => (
                                        <div
                                            key={branch.branchCode}
                                            style={{
                                                border: "1px solid var(--border)",
                                                borderRadius: 16,
                                                padding: 14,
                                                display: "grid",
                                                gridTemplateColumns: "1fr auto",
                                                gap: 12,
                                                alignItems: "center"
                                            }}
                                        >
                                            <div>
                                                <strong>{branch.branchName}</strong>
                                                <p style={{ margin: "5px 0 0", color: "var(--muted)" }}>
                                                    {branch.branchCode} · {branch.totalPaidOrders} đơn
                                                </p>
                                            </div>

                                            <strong>{formatMoney(branch.totalRevenue)}</strong>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div
                        style={{
                            background: "white",
                            border: "1px solid var(--border)",
                            borderRadius: 24,
                            padding: 20,
                            marginBottom: 24
                        }}
                    >
                        <h3 style={{ marginTop: 0 }}>Biểu đồ doanh thu theo ngày</h3>

                        {revenueByDay.length === 0 ? (
                            <p style={{ color: "var(--muted)" }}>
                                Chưa có dữ liệu doanh thu trong khoảng thời gian này.
                            </p>
                        ) : (
                            <div style={{ display: "grid", gap: 12 }}>
                                {revenueByDay.map((item) => (
                                    <div key={item.date}>
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                gap: 12,
                                                marginBottom: 6
                                            }}
                                        >
                                            <strong>{item.date}</strong>
                                            <span>
                                                {formatMoney(item.revenue)} · {item.orders} đơn
                                            </span>
                                        </div>

                                        <div
                                            style={{
                                                height: 14,
                                                background: "var(--soft)",
                                                borderRadius: 999,
                                                overflow: "hidden"
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: `${Math.max(
                                                        (Number(item.revenue || 0) / maxRevenue) * 100,
                                                        3
                                                    )}%`,
                                                    height: "100%",
                                                    background: "var(--green)",
                                                    borderRadius: 999
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div
                        style={{
                            background: "white",
                            border: "1px solid var(--border)",
                            borderRadius: 24,
                            padding: 20
                        }}
                    >
                        <h3 style={{ marginTop: 0 }}>Danh sách đơn trong báo cáo</h3>

                        {orders.length === 0 ? (
                            <p style={{ color: "var(--muted)" }}>
                                Không có đơn nào trong khoảng thời gian này.
                            </p>
                        ) : (
                            <div style={{ overflowX: "auto" }}>
                                <table
                                    style={{
                                        width: "100%",
                                        borderCollapse: "collapse",
                                        minWidth: 900
                                    }}
                                >
                                    <thead>
                                        <tr>
                                            <th style={thStyle}>Thời gian</th>
                                            <th style={thStyle}>Chi nhánh</th>
                                            <th style={thStyle}>Bàn</th>
                                            <th style={thStyle}>Khách</th>
                                            <th style={thStyle}>Tổng tiền</th>
                                            <th style={thStyle}>Thanh toán</th>
                                            <th style={thStyle}>Trạng thái</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {orders.map((order) => (
                                            <tr key={order._id}>
                                                <td style={tdStyle}>
                                                    {order.createdAt
                                                        ? new Date(order.createdAt).toLocaleString("vi-VN")
                                                        : "Không rõ"}
                                                </td>

                                                <td style={tdStyle}>
                                                    {order.branchName || order.branchCode || "Chưa gán"}
                                                </td>

                                                <td style={tdStyle}>{order.tableName || "Takeaway"}</td>

                                                <td style={tdStyle}>
                                                    {order.customerName || "Không có"}
                                                </td>

                                                <td style={tdStyle}>{formatMoney(order.totalAmount)}</td>

                                                <td style={tdStyle}>
                                                    {getPaymentStatusText(order.paymentStatus)}
                                                    <br />
                                                    <small>{getPaymentMethodText(order.paymentMethod)}</small>
                                                </td>

                                                <td style={tdStyle}>{getOrderStatusText(order.status)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}
        </section>
    );
}

const thStyle = {
    textAlign: "left",
    padding: "12px",
    borderBottom: "1px solid var(--border)",
    color: "var(--muted)",
    fontSize: 13
};

const tdStyle = {
    padding: "12px",
    borderBottom: "1px solid var(--border)",
    verticalAlign: "top"
};

export default AdminReports;