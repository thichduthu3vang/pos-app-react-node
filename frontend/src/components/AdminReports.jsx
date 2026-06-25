import { useEffect, useState } from "react";
import api from "../api";
import "./AdminReports.css";

function AdminReports() {
    const today = new Date().toISOString().slice(0, 10);

    const [fromDate, setFromDate] = useState(today);
    const [toDate, setToDate] = useState(today);
    const [loading, setLoading] = useState(true);

    const [report, setReport] = useState({
        totalRevenue: 0,
        totalPaidOrders: 0,
        totalCreatedOrders: 0,
        totalUnpaidOrders: 0,
        totalCancelledOrders: 0,
        paymentMethods: {
            cash: 0,
            bank: 0,
            card: 0,
            momo: 0,
            zalopay: 0
        },
        dailyRevenue: [],
        paidOrders: [],
        unpaidOrders: [],
        cancelledOrders: []
    });

    const loadReport = async () => {
        try {
            setLoading(true);

            const response = await api.get("/api/reports/summary", {
                params: {
                    from: fromDate,
                    to: toDate
                }
            });

            setReport(response.data.data || report);
        } catch (error) {
            console.error("Cannot load report:", error);
            alert("Không thể tải báo cáo");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReport();
    }, []);

    const formatMoney = (value) => {
        return Number(value || 0).toLocaleString("vi-VN") + "đ";
    };

    const getPaymentMethodText = (method) => {
        if (method === "cash") return "Tiền mặt";
        if (method === "bank") return "Chuyển khoản";
        if (method === "card") return "Thẻ";
        if (method === "momo") return "MoMo";
        if (method === "zalopay") return "ZaloPay";
        return method;
    };

    return (
        <section className="admin-reports-page">
            <div className="admin-reports-header">
                <div>
                    <h2>Admin - Báo cáo doanh thu</h2>
                    <p>Xem doanh thu, đơn hàng và phương thức thanh toán theo khoảng ngày.</p>
                </div>

                <button className="admin-reports-refresh" onClick={loadReport}>
                    Làm mới
                </button>
            </div>

            <div className="admin-reports-filter">
                <label>
                    Từ ngày
                    <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                    />
                </label>

                <label>
                    Đến ngày
                    <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                    />
                </label>

                <button onClick={loadReport}>Xem báo cáo</button>
            </div>

            {loading ? (
                <div className="admin-report-empty">Đang tải báo cáo...</div>
            ) : (
                <>
                    <div className="admin-report-stats">
                        <div>
                            <span>Tổng doanh thu</span>
                            <strong>{formatMoney(report.totalRevenue)}</strong>
                        </div>

                        <div>
                            <span>Đơn đã thanh toán</span>
                            <strong>{report.totalPaidOrders}</strong>
                        </div>

                        <div>
                            <span>Đơn tạo trong kỳ</span>
                            <strong>{report.totalCreatedOrders}</strong>
                        </div>

                        <div>
                            <span>Đơn chưa thanh toán</span>
                            <strong>{report.totalUnpaidOrders}</strong>
                        </div>

                        <div>
                            <span>Đơn đã hủy</span>
                            <strong>{report.totalCancelledOrders}</strong>
                        </div>
                    </div>

                    <div className="admin-report-section">
                        <div className="admin-report-section-header">
                            <h3>Doanh thu theo phương thức thanh toán</h3>
                        </div>

                        <div className="payment-method-grid">
                            {Object.entries(report.paymentMethods || {}).map(([method, amount]) => (
                                <div className="payment-method-card" key={method}>
                                    <span>{getPaymentMethodText(method)}</span>
                                    <strong>{formatMoney(amount)}</strong>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="admin-report-section">
                        <div className="admin-report-section-header">
                            <h3>Doanh thu theo ngày</h3>
                        </div>

                        {report.dailyRevenue.length === 0 ? (
                            <div className="admin-report-empty">Chưa có doanh thu trong khoảng này.</div>
                        ) : (
                            <div className="daily-revenue-list">
                                {report.dailyRevenue.map((item) => (
                                    <div className="daily-revenue-row" key={item.date}>
                                        <span>{item.date}</span>
                                        <strong>{formatMoney(item.revenue)}</strong>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="admin-report-section">
                        <div className="admin-report-section-header">
                            <h3>Danh sách đơn đã thanh toán</h3>
                            <span>{report.paidOrders.length} đơn</span>
                        </div>

                        {report.paidOrders.length === 0 ? (
                            <div className="admin-report-empty">Chưa có đơn đã thanh toán.</div>
                        ) : (
                            <div className="report-order-list">
                                {report.paidOrders.map((order) => (
                                    <div className="report-order-item" key={order._id}>
                                        <div>
                                            <h4>{order.tableName}</h4>
                                            <p>Mã đơn: {order._id.slice(-8).toUpperCase()}</p>
                                            <p>
                                                Thời gian thu:{" "}
                                                {order.paidAt
                                                    ? new Date(order.paidAt).toLocaleString("vi-VN")
                                                    : "Không có"}
                                            </p>
                                            <p>
                                                Phương thức: {getPaymentMethodText(order.paymentMethod)}
                                            </p>
                                        </div>

                                        <strong>{formatMoney(order.totalAmount)}</strong>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </section>
    );
}

export default AdminReports;