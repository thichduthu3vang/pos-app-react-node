import { useEffect, useState } from "react";
import api from "../api";

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
                <h2 style={{ margin: 0, fontSize: 32 }}>
                    Admin - Báo cáo doanh thu
                </h2>

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
                    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
                    gap: 14,
                    alignItems: "end"
                }}
            >
                <label style={labelStyle}>
                    Từ ngày
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        style={inputStyle}
                    />
                </label>

                <label style={labelStyle}>
                    Đến ngày
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        style={inputStyle}
                    />
                </label>

                <label style={labelStyle}>
                    Chi nhánh
                    {isStaff ? (
                        <input
                            value={branchLabel}
                            disabled
                            style={{
                                ...inputStyle,
                                opacity: 0.8,
                                cursor: "not-allowed"
                            }}
                        />
                    ) : (
                        <select
                            value={selectedBranchCode}
                            onChange={(e) => setSelectedBranchCode(e.target.value)}
                            style={inputStyle}
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

                <button
                    onClick={() => {
                        loadReport();
                        loadBranchTodayReport();
                    }}
                    style={{
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

            <div
                style={{
                    background: "white",
                    border: "1px solid var(--border)",
                    borderRadius: 24,
                    padding: 20,
                    marginBottom: 24,
                    boxShadow: "0 14px 35px rgba(80, 52, 27, 0.08)"
                }}
            >
                <h3 style={{ margin: "0 0 16px", fontSize: 22 }}>
                    Biểu đồ doanh thu theo ngày - {branchLabel}
                </h3>

                {loading ? (
                    <div style={emptyStyle}>Đang tải báo cáo...</div>
                ) : report.revenueByDay.length === 0 ? (
                    <div style={emptyStyle}>Không có doanh thu trong khoảng ngày này.</div>
                ) : (
                    <div style={{ display: "grid", gap: 14 }}>
                        {report.revenueByDay.map((item) => (
                            <div key={item.date}>
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        gap: 12,
                                        marginBottom: 7,
                                        fontWeight: 900
                                    }}
                                >
                                    <span>{item.date}</span>
                                    <span>
                                        {formatMoney(item.revenue)} · {item.orders} đơn
                                    </span>
                                </div>

                                <div
                                    style={{
                                        height: 16,
                                        background: "var(--soft)",
                                        border: "1px solid var(--border)",
                                        borderRadius: 999,
                                        overflow: "hidden"
                                    }}
                                >
                                    <div
                                        style={{
                                            height: "100%",
                                            width: `${Math.max(
                                                (Number(item.revenue || 0) / maxRevenueByDay) * 100,
                                                4
                                            )}%`,
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

            {isOwner && (
                <div
                    style={{
                        background: "white",
                        border: "1px solid var(--border)",
                        borderRadius: 24,
                        padding: 20,
                        marginBottom: 24,
                        boxShadow: "0 14px 35px rgba(80, 52, 27, 0.08)"
                    }}
                >
                    <h3 style={{ margin: "0 0 16px", fontSize: 22 }}>
                        So sánh doanh thu chi nhánh hôm nay
                    </h3>

                    {branchTodayReport.branches.length === 0 ? (
                        <div style={emptyStyle}>Hôm nay chưa có doanh thu chi nhánh.</div>
                    ) : (
                        <div style={{ display: "grid", gap: 14 }}>
                            {branchTodayReport.branches.map((branch) => (
                                <div key={branch.branchCode}>
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            gap: 12,
                                            marginBottom: 7,
                                            fontWeight: 900
                                        }}
                                    >
                                        <span>
                                            {branch.branchName} - {branch.branchCode}
                                        </span>
                                        <span>
                                            {formatMoney(branch.totalRevenue)} ·{" "}
                                            {branch.totalPaidOrders} đơn
                                        </span>
                                    </div>

                                    <div
                                        style={{
                                            height: 16,
                                            background: "var(--soft)",
                                            border: "1px solid var(--border)",
                                            borderRadius: 999,
                                            overflow: "hidden"
                                        }}
                                    >
                                        <div
                                            style={{
                                                height: "100%",
                                                width: `${Math.max(
                                                    (Number(branch.totalRevenue || 0) /
                                                        maxBranchRevenue) *
                                                    100,
                                                    4
                                                )}%`,
                                                background: "var(--primary)",
                                                borderRadius: 999
                                            }}
                                        />
                                    </div>
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
                    marginBottom: 24,
                    boxShadow: "0 14px 35px rgba(80, 52, 27, 0.08)",
                    overflowX: "auto"
                }}
            >
                <h3 style={{ margin: "0 0 16px", fontSize: 22 }}>
                    Danh sách đơn trong báo cáo - {branchLabel}
                </h3>

                {loading ? (
                    <div style={emptyStyle}>Đang tải danh sách đơn...</div>
                ) : report.orders.length === 0 ? (
                    <div style={emptyStyle}>Không có đơn nào trong báo cáo.</div>
                ) : (
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
                            {report.orders.map((order) => (
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

                                    <td style={tdStyle}>{order.customerName || "Không có"}</td>

                                    <td style={tdStyle}>
                                        <strong>{formatMoney(order.totalAmount)}</strong>
                                    </td>

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
                )}
            </div>
        </section>
    );
}

const labelStyle = {
    display: "grid",
    gap: 7,
    fontWeight: 800
};

const inputStyle = {
    border: "1px solid var(--border)",
    background: "var(--soft)",
    padding: 12,
    borderRadius: 14,
    fontWeight: 800
};

const emptyStyle = {
    border: "1px dashed var(--border)",
    borderRadius: 18,
    padding: 30,
    textAlign: "center",
    color: "var(--muted)",
    fontWeight: 900
};

const thStyle = {
    textAlign: "left",
    padding: "12px 10px",
    borderBottom: "1px solid var(--border)",
    color: "var(--muted)",
    fontSize: 13
};

const tdStyle = {
    padding: "12px 10px",
    borderBottom: "1px solid var(--border)",
    verticalAlign: "top"
};

export default AdminReports;