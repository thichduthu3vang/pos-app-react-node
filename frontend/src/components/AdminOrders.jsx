import { useEffect, useMemo, useState } from "react";
import api from "../api";

function AdminOrders({ onOrdersChanged }) {
    const adminRole = localStorage.getItem("adminRole");
    const adminBranchCode = localStorage.getItem("adminBranchCode");
    const adminBranchName = localStorage.getItem("adminBranchName");

    const isStaff = adminRole === "staff";
    const staffBranchCode = adminBranchCode ? adminBranchCode.toUpperCase() : "";

    const [branches, setBranches] = useState([]);
    const [selectedBranchCode, setSelectedBranchCode] = useState(
        isStaff ? staffBranchCode : ""
    );
    const [orders, setOrders] = useState([]);
    const [statusFilter, setStatusFilter] = useState("all");
    const [paymentFilter, setPaymentFilter] = useState("all");
    const [loading, setLoading] = useState(true);

    const currentBranchCode = isStaff ? staffBranchCode : selectedBranchCode;

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

    const loadOrders = async () => {
        try {
            setLoading(true);

            if (isStaff && !staffBranchCode) {
                alert("Tài khoản nhân viên này chưa được gán chi nhánh");
                setOrders([]);
                return;
            }

            const response = await api.get("/api/orders", {
                params: currentBranchCode ? { branchCode: currentBranchCode } : {}
            });

            setOrders(response.data.data || []);
        } catch (error) {
            console.error("Cannot load orders:", error);
            alert(error.response?.data?.message || "Không thể tải danh sách đơn hàng");
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBranches();
    }, []);

    useEffect(() => {
        loadOrders();
    }, [currentBranchCode]);

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

    const filteredOrders = useMemo(() => {
        return orders.filter((order) => {
            const matchStatus =
                statusFilter === "all" ? true : order.status === statusFilter;

            const matchPayment =
                paymentFilter === "all"
                    ? true
                    : order.paymentStatus === paymentFilter;

            return matchStatus && matchPayment;
        });
    }, [orders, statusFilter, paymentFilter]);

    const summary = useMemo(() => {
        const paidOrders = filteredOrders.filter(
            (order) => order.paymentStatus === "paid" && order.status !== "cancelled"
        );

        const unpaidOrders = filteredOrders.filter(
            (order) =>
                order.paymentStatus === "unpaid" && order.status !== "cancelled"
        );

        const cancelledOrders = filteredOrders.filter(
            (order) => order.status === "cancelled"
        );

        const revenue = paidOrders.reduce((sum, order) => {
            return sum + Number(order.totalAmount || 0);
        }, 0);

        return {
            totalOrders: filteredOrders.length,
            paidOrders: paidOrders.length,
            unpaidOrders: unpaidOrders.length,
            cancelledOrders: cancelledOrders.length,
            revenue
        };
    }, [filteredOrders]);

    const updateOrderStatus = async (orderId, status) => {
        try {
            await api.patch(`/api/orders/${orderId}/status`, { status });

            loadOrders();

            if (onOrdersChanged) {
                onOrdersChanged();
            }
        } catch (error) {
            console.error("Cannot update order status:", error);
            alert(error.response?.data?.message || "Không thể cập nhật trạng thái đơn");
        }
    };

    const payOrder = async (orderId, paymentMethod) => {
        try {
            await api.patch(`/api/orders/${orderId}/pay`, { paymentMethod });

            alert("Thanh toán thành công");
            loadOrders();

            if (onOrdersChanged) {
                onOrdersChanged();
            }
        } catch (error) {
            console.error("Cannot pay order:", error);
            alert(error.response?.data?.message || "Không thể thanh toán đơn");
        }
    };

    const selectedBranch = branches.find(
        (branch) => branch.code === currentBranchCode
    );

    const branchTitle = isStaff
        ? `${adminBranchName || selectedBranch?.name || "Chi nhánh"} - ${staffBranchCode}`
        : selectedBranch
            ? `${selectedBranch.name} - ${selectedBranch.code}`
            : "Tất cả chi nhánh";

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
                <h2 style={{ margin: 0, fontSize: 32 }}>Admin - Quản lý đơn hàng</h2>
                <p style={{ margin: "8px 0 0", color: "var(--muted)" }}>
                    Xem, lọc, cập nhật trạng thái và thanh toán đơn hàng theo từng chi
                    nhánh.
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
                    gap: 14,
                    alignItems: "end"
                }}
            >
                <label style={labelStyle}>
                    Chi nhánh
                    {isStaff ? (
                        <input
                            value={branchTitle}
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

                <label style={labelStyle}>
                    Trạng thái đơn
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={inputStyle}
                    >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="pending">Đơn mới</option>
                        <option value="preparing">Đang pha chế</option>
                        <option value="completed">Hoàn thành</option>
                        <option value="cancelled">Đã hủy</option>
                    </select>
                </label>

                <label style={labelStyle}>
                    Thanh toán
                    <select
                        value={paymentFilter}
                        onChange={(e) => setPaymentFilter(e.target.value)}
                        style={inputStyle}
                    >
                        <option value="all">Tất cả thanh toán</option>
                        <option value="paid">Đã thanh toán</option>
                        <option value="unpaid">Chưa thanh toán</option>
                    </select>
                </label>

                <button
                    onClick={loadOrders}
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
                    background: "white",
                    border: "1px solid var(--border)",
                    borderRadius: 24,
                    padding: 18,
                    marginBottom: 24,
                    boxShadow: "0 14px 35px rgba(80, 52, 27, 0.08)"
                }}
            >
                <h3 style={{ margin: "0 0 6px", fontSize: 22 }}>
                    Đơn hàng của {branchTitle}
                </h3>

                <p style={{ margin: 0, color: "var(--muted)" }}>
                    Đang hiển thị {filteredOrders.length} đơn theo bộ lọc hiện tại.
                </p>
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
                    <strong>{formatMoney(summary.revenue)}</strong>
                </div>

                <div className="sidebar-box" style={{ margin: 0 }}>
                    <span className="label">Tổng đơn</span>
                    <strong>{summary.totalOrders}</strong>
                </div>

                <div className="sidebar-box" style={{ margin: 0 }}>
                    <span className="label">Đã thanh toán</span>
                    <strong>{summary.paidOrders}</strong>
                </div>

                <div className="sidebar-box" style={{ margin: 0 }}>
                    <span className="label">Chưa thanh toán</span>
                    <strong>{summary.unpaidOrders}</strong>
                </div>

                <div className="sidebar-box" style={{ margin: 0 }}>
                    <span className="label">Đã hủy</span>
                    <strong>{summary.cancelledOrders}</strong>
                </div>
            </div>

            {loading ? (
                <div style={emptyStyle}>Đang tải đơn hàng...</div>
            ) : filteredOrders.length === 0 ? (
                <div style={emptyStyle}>Không có đơn hàng nào theo bộ lọc này.</div>
            ) : (
                <div style={{ display: "grid", gap: 14 }}>
                    {filteredOrders.map((order) => (
                        <article
                            key={order._id}
                            style={{
                                background: "white",
                                border: "1px solid var(--border)",
                                borderRadius: 22,
                                padding: 18,
                                boxShadow: "0 14px 35px rgba(80, 52, 27, 0.08)"
                            }}
                        >
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr auto",
                                    gap: 16,
                                    marginBottom: 14
                                }}
                            >
                                <div>
                                    <h3 style={{ margin: "0 0 6px", fontSize: 22 }}>
                                        {order.tableName || "Takeaway"}
                                    </h3>

                                    <p style={{ margin: "4px 0", color: "var(--muted)" }}>
                                        Chi nhánh:{" "}
                                        <strong>
                                            {order.branchName || order.branchCode || "Chưa gán"}
                                        </strong>
                                    </p>

                                    <p style={{ margin: "4px 0", color: "var(--muted)" }}>
                                        Khách: {order.customerName || "Không có"}
                                    </p>

                                    <p style={{ margin: "4px 0", color: "var(--muted)" }}>
                                        Thời gian:{" "}
                                        {order.createdAt
                                            ? new Date(order.createdAt).toLocaleString("vi-VN")
                                            : "Không rõ"}
                                    </p>
                                </div>

                                <div style={{ textAlign: "right" }}>
                                    <strong style={{ display: "block", fontSize: 24 }}>
                                        {formatMoney(order.totalAmount)}
                                    </strong>

                                    <span
                                        style={{
                                            display: "inline-block",
                                            marginTop: 8,
                                            background:
                                                order.paymentStatus === "paid" ? "#ddf7e8" : "#fff1d6",
                                            color:
                                                order.paymentStatus === "paid"
                                                    ? "var(--green)"
                                                    : "#9a6500",
                                            padding: "8px 11px",
                                            borderRadius: 999,
                                            fontWeight: 900,
                                            fontSize: 12
                                        }}
                                    >
                                        {getPaymentStatusText(order.paymentStatus)}
                                    </span>

                                    <br />

                                    <span
                                        style={{
                                            display: "inline-block",
                                            marginTop: 8,
                                            background:
                                                order.status === "cancelled" ? "#ffe6e3" : "var(--soft)",
                                            color:
                                                order.status === "cancelled"
                                                    ? "var(--red)"
                                                    : "var(--text)",
                                            padding: "8px 11px",
                                            borderRadius: 999,
                                            fontWeight: 900,
                                            fontSize: 12
                                        }}
                                    >
                                        {getOrderStatusText(order.status)}
                                    </span>
                                </div>
                            </div>

                            <div
                                style={{
                                    background: "var(--soft)",
                                    border: "1px solid var(--border)",
                                    borderRadius: 16,
                                    padding: 14,
                                    marginBottom: 14
                                }}
                            >
                                {(order.items || []).map((item, index) => (
                                    <p key={index} style={{ margin: "5px 0" }}>
                                        <strong>
                                            {item.quantity} x {item.name}
                                        </strong>{" "}
                                        · {formatMoney(item.price)}
                                        {item.note ? ` · ${item.note}` : ""}
                                    </p>
                                ))}
                            </div>

                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                                    gap: 8
                                }}
                            >
                                <button
                                    style={buttonStyle}
                                    onClick={() => updateOrderStatus(order._id, "preparing")}
                                >
                                    Pha chế
                                </button>

                                <button
                                    style={buttonStyle}
                                    onClick={() => updateOrderStatus(order._id, "completed")}
                                >
                                    Xong
                                </button>

                                <button
                                    style={dangerButtonStyle}
                                    onClick={() => updateOrderStatus(order._id, "cancelled")}
                                >
                                    Hủy
                                </button>

                                {order.paymentStatus !== "paid" &&
                                    order.status !== "cancelled" && (
                                        <>
                                            <button
                                                style={greenButtonStyle}
                                                onClick={() => payOrder(order._id, "cash")}
                                            >
                                                Tiền mặt
                                            </button>

                                            <button
                                                style={greenButtonStyle}
                                                onClick={() => payOrder(order._id, "bank")}
                                            >
                                                Chuyển khoản
                                            </button>

                                            <button
                                                style={greenButtonStyle}
                                                onClick={() => payOrder(order._id, "card")}
                                            >
                                                Thẻ
                                            </button>
                                        </>
                                    )}
                            </div>

                            {order.paymentStatus === "paid" && (
                                <p style={{ margin: "12px 0 0", color: "var(--muted)" }}>
                                    Phương thức:{" "}
                                    <strong>{getPaymentMethodText(order.paymentMethod)}</strong>
                                </p>
                            )}
                        </article>
                    ))}
                </div>
            )}
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
    background: "white",
    border: "1px dashed var(--border)",
    borderRadius: 24,
    padding: 40,
    textAlign: "center",
    color: "var(--muted)",
    fontWeight: 900
};

const buttonStyle = {
    background: "#21170f",
    color: "white",
    padding: 12,
    borderRadius: 12,
    fontWeight: 900
};

const greenButtonStyle = {
    background: "var(--green)",
    color: "white",
    padding: 12,
    borderRadius: 12,
    fontWeight: 900
};

const dangerButtonStyle = {
    background: "var(--red)",
    color: "white",
    padding: 12,
    borderRadius: 12,
    fontWeight: 900
};

export default AdminOrders;