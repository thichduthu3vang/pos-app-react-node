import { useEffect, useMemo, useState } from "react";
import api from "../api";
import "./AdminOrders.css";

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
        <section className="admin-orders-page">
            <div className="admin-orders-hero">
                <div>
                    <h2>Admin - Quản lý đơn hàng</h2>
                    <p>
                        Xem, lọc, cập nhật trạng thái và thanh toán đơn hàng theo từng chi nhánh.
                    </p>
                </div>

                <button onClick={loadOrders}>Làm mới</button>
            </div>

            <div className="admin-orders-filters">
                <label>
                    Chi nhánh
                    {isStaff ? (
                        <input value={branchTitle} disabled />
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

                <label>
                    Trạng thái đơn
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="pending">Đơn mới</option>
                        <option value="preparing">Đang pha chế</option>
                        <option value="completed">Hoàn thành</option>
                        <option value="cancelled">Đã hủy</option>
                    </select>
                </label>

                <label>
                    Thanh toán
                    <select
                        value={paymentFilter}
                        onChange={(e) => setPaymentFilter(e.target.value)}
                    >
                        <option value="all">Tất cả thanh toán</option>
                        <option value="paid">Đã thanh toán</option>
                        <option value="unpaid">Chưa thanh toán</option>
                    </select>
                </label>
            </div>

            <div className="admin-orders-branch-card">
                <h3>Đơn hàng của {branchTitle}</h3>
                <p>Đang hiển thị {filteredOrders.length} đơn theo bộ lọc hiện tại.</p>
            </div>

            <div className="admin-orders-summary">
                <div className="admin-order-stat revenue">
                    <span>Doanh thu</span>
                    <strong>{formatMoney(summary.revenue)}</strong>
                </div>

                <div className="admin-order-stat">
                    <span>Tổng đơn</span>
                    <strong>{summary.totalOrders}</strong>
                </div>

                <div className="admin-order-stat">
                    <span>Đã thanh toán</span>
                    <strong>{summary.paidOrders}</strong>
                </div>

                <div className="admin-order-stat">
                    <span>Chưa thanh toán</span>
                    <strong>{summary.unpaidOrders}</strong>
                </div>

                <div className="admin-order-stat cancelled">
                    <span>Đã hủy</span>
                    <strong>{summary.cancelledOrders}</strong>
                </div>
            </div>

            {loading ? (
                <div className="admin-orders-empty">Đang tải đơn hàng...</div>
            ) : filteredOrders.length === 0 ? (
                <div className="admin-orders-empty">
                    Không có đơn hàng nào theo bộ lọc này.
                </div>
            ) : (
                <div className="admin-orders-list">
                    {filteredOrders.map((order) => (
                        <article className="admin-order-card" key={order._id}>
                            <div className="admin-order-head">
                                <div>
                                    <h3>{order.tableName || "Takeaway"}</h3>

                                    <p>
                                        Chi nhánh:{" "}
                                        <strong>
                                            {order.branchName || order.branchCode || "Chưa gán"}
                                        </strong>
                                    </p>

                                    <p>Khách: {order.customerName || "Không có"}</p>

                                    <p>
                                        Thời gian:{" "}
                                        {order.createdAt
                                            ? new Date(order.createdAt).toLocaleString("vi-VN")
                                            : "Không rõ"}
                                    </p>
                                </div>

                                <div className="admin-order-price-box">
                                    <strong>{formatMoney(order.totalAmount)}</strong>

                                    <span className={`payment-pill ${order.paymentStatus}`}>
                                        {getPaymentStatusText(order.paymentStatus)}
                                    </span>

                                    <span className={`order-status-pill ${order.status}`}>
                                        {getOrderStatusText(order.status)}
                                    </span>
                                </div>
                            </div>

                            <div className="admin-order-items">
                                {(order.items || []).map((item, index) => (
                                    <p key={index}>
                                        <strong>
                                            {item.quantity} x {item.name}
                                        </strong>{" "}
                                        · {formatMoney(item.price)}
                                        {item.note ? ` · ${item.note}` : ""}
                                    </p>
                                ))}
                            </div>

                            <div className="admin-order-actions">
                                <button onClick={() => updateOrderStatus(order._id, "preparing")}>
                                    Pha chế
                                </button>

                                <button onClick={() => updateOrderStatus(order._id, "completed")}>
                                    Xong
                                </button>

                                <button
                                    className="danger"
                                    onClick={() => updateOrderStatus(order._id, "cancelled")}
                                >
                                    Hủy
                                </button>

                                {order.paymentStatus !== "paid" &&
                                    order.status !== "cancelled" && (
                                        <>
                                            <button
                                                className="pay"
                                                onClick={() => payOrder(order._id, "cash")}
                                            >
                                                Tiền mặt
                                            </button>

                                            <button
                                                className="pay"
                                                onClick={() => payOrder(order._id, "bank")}
                                            >
                                                Chuyển khoản
                                            </button>

                                            <button
                                                className="pay"
                                                onClick={() => payOrder(order._id, "card")}
                                            >
                                                Thẻ
                                            </button>
                                        </>
                                    )}
                            </div>

                            {order.paymentStatus === "paid" && (
                                <p className="admin-order-method">
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

export default AdminOrders;