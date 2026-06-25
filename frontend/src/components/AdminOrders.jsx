import { useEffect, useMemo, useState } from "react";
import api from "../api";
import "./AdminOrders.css";

function AdminOrders({ onOrdersChanged }) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("all");
    const [paymentFilter, setPaymentFilter] = useState("all");

    const loadOrders = async () => {
        try {
            setLoading(true);
            const response = await api.get("/api/orders");
            setOrders(response.data.data || []);
        } catch (error) {
            console.error("Cannot load orders:", error);
            alert("Không thể tải danh sách đơn hàng");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOrders();
    }, []);

    const getOrderStatusText = (status) => {
        if (status === "pending") return "Đơn mới";
        if (status === "preparing") return "Đang xử lý";
        if (status === "completed") return "Hoàn thành";
        if (status === "cancelled") return "Đã hủy";
        return status;
    };

    const getPaymentMethodText = (method) => {
        if (method === "cash") return "Tiền mặt";
        if (method === "bank") return "Chuyển khoản";
        if (method === "card") return "Thẻ";
        if (method === "momo") return "MoMo";
        if (method === "zalopay") return "ZaloPay";
        return method;
    };

    const filteredOrders = useMemo(() => {
        return orders.filter((order) => {
            const matchStatus =
                statusFilter === "all" || order.status === statusFilter;

            const matchPayment =
                paymentFilter === "all" || order.paymentStatus === paymentFilter;

            return matchStatus && matchPayment;
        });
    }, [orders, statusFilter, paymentFilter]);

    const totalRevenue = filteredOrders
        .filter((order) => order.paymentStatus === "paid")
        .reduce((sum, order) => sum + order.totalAmount, 0);

    const totalUnpaid = filteredOrders
        .filter((order) => order.paymentStatus !== "paid")
        .reduce((sum, order) => sum + order.totalAmount, 0);

    const updateOrderStatus = async (orderId, status) => {
        try {
            await api.patch(`/api/orders/${orderId}/status`, {
                status
            });

            await loadOrders();

            if (onOrdersChanged) {
                onOrdersChanged();
            }
        } catch (error) {
            console.error("Cannot update order:", error);
            alert(error.response?.data?.message || "Không thể cập nhật đơn");
        }
    };

    const payOrder = async (orderId, paymentMethod) => {
        try {
            await api.patch(`/api/orders/${orderId}/pay`, {
                paymentMethod
            });

            alert("Thanh toán thành công");

            await loadOrders();

            if (onOrdersChanged) {
                onOrdersChanged();
            }
        } catch (error) {
            console.error("Cannot pay order:", error);
            alert(error.response?.data?.message || "Không thể thanh toán đơn");
        }
    };

    return (
        <section className="admin-orders-page">
            <div className="admin-orders-header">
                <div>
                    <h2>Admin - Quản lý đơn hàng</h2>
                    <p>Xem, lọc, cập nhật trạng thái và thanh toán đơn hàng.</p>
                </div>

                <button className="admin-orders-refresh" onClick={loadOrders}>
                    Làm mới
                </button>
            </div>

            <div className="admin-orders-stats">
                <div>
                    <span>Tổng đơn đang xem</span>
                    <strong>{filteredOrders.length}</strong>
                </div>

                <div>
                    <span>Đã thu</span>
                    <strong>{totalRevenue.toLocaleString("vi-VN")}đ</strong>
                </div>

                <div>
                    <span>Chưa thu</span>
                    <strong>{totalUnpaid.toLocaleString("vi-VN")}đ</strong>
                </div>
            </div>

            <div className="admin-orders-filters">
                <label>
                    Trạng thái đơn
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">Tất cả</option>
                        <option value="pending">Đơn mới</option>
                        <option value="preparing">Đang xử lý</option>
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
                        <option value="all">Tất cả</option>
                        <option value="paid">Đã thanh toán</option>
                        <option value="unpaid">Chưa thanh toán</option>
                    </select>
                </label>
            </div>

            <div className="admin-orders-card">
                {loading ? (
                    <div className="admin-orders-empty">Đang tải đơn hàng...</div>
                ) : filteredOrders.length === 0 ? (
                    <div className="admin-orders-empty">Không có đơn phù hợp.</div>
                ) : (
                    <div className="admin-orders-list">
                        {filteredOrders.map((order) => (
                            <div className="admin-order-item" key={order._id}>
                                <div className="admin-order-top">
                                    <div>
                                        <h3>{order.tableName}</h3>
                                        <p>
                                            Mã đơn: <strong>{order._id.slice(-8).toUpperCase()}</strong>
                                        </p>
                                        <p>
                                            Khách: <strong>{order.customerName || "Không có"}</strong>
                                        </p>
                                        <p>
                                            Thời gian:{" "}
                                            <strong>
                                                {new Date(order.createdAt).toLocaleString("vi-VN")}
                                            </strong>
                                        </p>
                                    </div>

                                    <div className="admin-order-badges">
                                        <span className={`admin-order-status ${order.status}`}>
                                            {getOrderStatusText(order.status)}
                                        </span>

                                        <span
                                            className={
                                                order.paymentStatus === "paid"
                                                    ? "admin-payment-status paid"
                                                    : "admin-payment-status unpaid"
                                            }
                                        >
                                            {order.paymentStatus === "paid"
                                                ? `Đã thanh toán - ${getPaymentMethodText(
                                                    order.paymentMethod
                                                )}`
                                                : "Chưa thanh toán"}
                                        </span>
                                    </div>
                                </div>

                                <div className="admin-order-items">
                                    {order.items.map((item, index) => (
                                        <div className="admin-order-product" key={index}>
                                            <div>
                                                <strong>
                                                    {item.quantity} x {item.name}
                                                </strong>
                                                {item.note && <p>Ghi chú: {item.note}</p>}
                                            </div>

                                            <span>
                                                {(item.quantity * item.price).toLocaleString("vi-VN")}đ
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="admin-order-total">
                                    <span>Tổng tiền</span>
                                    <strong>{order.totalAmount.toLocaleString("vi-VN")}đ</strong>
                                </div>

                                <div className="admin-order-actions">
                                    <button onClick={() => updateOrderStatus(order._id, "pending")}>
                                        Đơn mới
                                    </button>

                                    <button
                                        onClick={() => updateOrderStatus(order._id, "preparing")}
                                    >
                                        Đang xử lý
                                    </button>

                                    <button
                                        onClick={() => updateOrderStatus(order._id, "completed")}
                                    >
                                        Hoàn thành
                                    </button>

                                    <button
                                        className="danger"
                                        onClick={() => updateOrderStatus(order._id, "cancelled")}
                                    >
                                        Hủy
                                    </button>
                                </div>

                                {order.paymentStatus !== "paid" &&
                                    order.status !== "cancelled" && (
                                        <div className="admin-payment-actions">
                                            <button onClick={() => payOrder(order._id, "cash")}>
                                                Thu tiền mặt
                                            </button>

                                            <button onClick={() => payOrder(order._id, "bank")}>
                                                Thu chuyển khoản
                                            </button>

                                            <button onClick={() => payOrder(order._id, "card")}>
                                                Thu thẻ
                                            </button>
                                        </div>
                                    )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}

export default AdminOrders;