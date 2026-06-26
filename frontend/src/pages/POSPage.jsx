import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api";
import InvoiceModal from "../components/pos/InvoiceModal";
import BranchSelectPage from "./BranchSelectPage";

function POSPage() {
    const { branchCode } = useParams();

    const normalizedBranchCode = branchCode ? branchCode.toUpperCase() : "";

    const [branchChecking, setBranchChecking] = useState(
        Boolean(normalizedBranchCode)
    );
    const [branchNotFound, setBranchNotFound] = useState(false);
    const [currentBranch, setCurrentBranch] = useState(null);

    const [menuItems, setMenuItems] = useState([]);
    const [orders, setOrders] = useState([]);
    const [cart, setCart] = useState([]);
    const [tables, setTables] = useState([]);
    const [selectedTableId, setSelectedTableId] = useState("");
    const [tableName, setTableName] = useState("Takeaway");
    const [customerName, setCustomerName] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("Tất cả");
    const [loading, setLoading] = useState(true);
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    const [todayReport, setTodayReport] = useState({
        totalRevenue: 0,
        totalPaidOrders: 0,
        totalUnpaidOrders: 0
    });

    const branchLabel = currentBranch
        ? `${currentBranch.name} - ${currentBranch.code}`
        : normalizedBranchCode
            ? `Chi nhánh ${normalizedBranchCode}`
            : "POS tổng";

    const formatMoney = (amount) => {
        return Number(amount || 0).toLocaleString("vi-VN") + "đ";
    };

    const loadCurrentBranch = async () => {
        if (!normalizedBranchCode) {
            setCurrentBranch(null);
            setBranchNotFound(false);
            return true;
        }

        try {
            setBranchChecking(true);

            const response = await api.get("/api/branches");
            const branches = response.data.data || [];

            const foundBranch = branches.find(
                (branch) =>
                    branch.code === normalizedBranchCode && branch.isActive === true
            );

            if (!foundBranch) {
                setCurrentBranch(null);
                setBranchNotFound(true);
                return false;
            }

            setCurrentBranch(foundBranch);
            setBranchNotFound(false);
            return true;
        } catch (error) {
            console.error("Cannot load current branch:", error);
            setCurrentBranch(null);
            setBranchNotFound(true);
            return false;
        } finally {
            setBranchChecking(false);
        }
    };

    const loadMenu = async () => {
        try {
            setLoading(true);
            const response = await api.get("/api/menu");
            setMenuItems(response.data.data || []);
        } catch (error) {
            console.error("Cannot load menu:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadOrders = async () => {
        try {
            const response = await api.get("/api/orders", {
                params: normalizedBranchCode ? { branchCode: normalizedBranchCode } : {}
            });

            setOrders(response.data.data || []);
        } catch (error) {
            console.error("Cannot load orders:", error);
        }
    };

    const loadTables = async () => {
        try {
            const response = await api.get("/api/tables", {
                params: normalizedBranchCode ? { branchCode: normalizedBranchCode } : {}
            });

            setTables(response.data.data || []);
        } catch (error) {
            console.error("Cannot load tables:", error);
        }
    };

    const loadTodayReport = async () => {
        try {
            const response = await api.get("/api/reports/today", {
                params: normalizedBranchCode ? { branchCode: normalizedBranchCode } : {}
            });

            setTodayReport(
                response.data.data || {
                    totalRevenue: 0,
                    totalPaidOrders: 0,
                    totalUnpaidOrders: 0
                }
            );
        } catch (error) {
            console.error("Cannot load today report:", error);
        }
    };

    const reloadDashboardData = async () => {
        const isValidBranch = await loadCurrentBranch();

        if (!isValidBranch) {
            setMenuItems([]);
            setOrders([]);
            setTables([]);
            setTodayReport({
                totalRevenue: 0,
                totalPaidOrders: 0,
                totalUnpaidOrders: 0
            });
            setLoading(false);
            return;
        }

        loadMenu();
        loadOrders();
        loadTables();
        loadTodayReport();
    };

    useEffect(() => {
        setSelectedTableId("");
        setCart([]);
        setTableName("Takeaway");
        reloadDashboardData();
    }, [normalizedBranchCode]);

    const categories = useMemo(() => {
        const list = menuItems.map((item) => item.category);
        return ["Tất cả", ...new Set(list)];
    }, [menuItems]);

    const filteredMenu = useMemo(() => {
        if (selectedCategory === "Tất cả") {
            return menuItems;
        }

        return menuItems.filter((item) => item.category === selectedCategory);
    }, [menuItems, selectedCategory]);

    const selectedTable = tables.find((table) => table._id === selectedTableId);

    const getTableStatusText = (status) => {
        if (status === "available") return "Trống";
        if (status === "occupied") return "Có khách";
        if (status === "cleaning") return "Chờ dọn";
        if (status === "reserved") return "Đã đặt";
        return status;
    };

    const getOrderStatusText = (status) => {
        if (status === "pending") return "Đơn mới";
        if (status === "preparing") return "Đang pha chế";
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

    const addToCart = (item) => {
        if (!item.isAvailable) {
            alert("Món này đang tạm hết");
            return;
        }

        const existedItem = cart.find((cartItem) => cartItem.menuItemId === item._id);

        if (existedItem) {
            setCart(
                cart.map((cartItem) =>
                    cartItem.menuItemId === item._id
                        ? { ...cartItem, quantity: cartItem.quantity + 1 }
                        : cartItem
                )
            );
        } else {
            setCart([
                ...cart,
                {
                    menuItemId: item._id,
                    name: item.name,
                    category: item.category,
                    price: item.price,
                    quantity: 1,
                    note: "",
                    image: item.image
                }
            ]);
        }
    };

    const updateQuantity = (menuItemId, quantity) => {
        if (quantity <= 0) {
            setCart(cart.filter((item) => item.menuItemId !== menuItemId));
            return;
        }

        setCart(
            cart.map((item) =>
                item.menuItemId === menuItemId ? { ...item, quantity } : item
            )
        );
    };

    const updateNote = (menuItemId, note) => {
        setCart(
            cart.map((item) =>
                item.menuItemId === menuItemId ? { ...item, note } : item
            )
        );
    };

    const totalAmount = cart.reduce((sum, item) => {
        return sum + item.price * item.quantity;
    }, 0);

    const createOrder = async () => {
        if (cart.length === 0) {
            alert("Vui lòng chọn món trước");
            return;
        }

        try {
            await api.post("/api/orders", {
                branchCode: normalizedBranchCode || selectedTable?.branchCode || "",
                tableId: selectedTableId || null,
                tableName: selectedTable ? selectedTable.name : tableName,
                customerName,
                items: cart,
                paymentMethod: "cash"
            });

            alert("Tạo đơn thành công");

            setCart([]);
            setCustomerName("");
            setTableName("Takeaway");
            setSelectedTableId("");

            loadOrders();
            loadTables();
            loadTodayReport();
        } catch (error) {
            console.error("Cannot create order:", error);
            alert(error.response?.data?.message || "Tạo đơn thất bại");
        }
    };

    const updateOrderStatus = async (orderId, status) => {
        try {
            await api.patch(`/api/orders/${orderId}/status`, { status });
            loadOrders();
            loadTables();
            loadTodayReport();
        } catch (error) {
            console.error("Cannot update order:", error);
            alert("Không thể cập nhật trạng thái đơn");
        }
    };

    const updateTableStatus = async (tableId, status) => {
        try {
            await api.patch(`/api/tables/${tableId}/status`, { status });
            loadTables();
        } catch (error) {
            console.error("Cannot update table status:", error);
            alert("Không thể cập nhật trạng thái bàn");
        }
    };

    const payOrder = async (orderId, paymentMethod) => {
        try {
            await api.patch(`/api/orders/${orderId}/pay`, { paymentMethod });
            alert("Thanh toán thành công");
            loadOrders();
            loadTables();
            loadTodayReport();
        } catch (error) {
            console.error("Cannot pay order:", error);
            alert(error.response?.data?.message || "Không thể thanh toán đơn");
        }
    };

    if (branchChecking) {
        return (
            <div className="branch-select-page">
                <div className="branch-select-card">
                    <div className="branch-empty">Đang kiểm tra chi nhánh...</div>
                </div>
            </div>
        );
    }

    if (branchNotFound) {
        return (
            <BranchSelectPage
                message={`Chi nhánh ${normalizedBranchCode} không tồn tại hoặc đang tạm tắt. Vui lòng chọn chi nhánh hợp lệ.`}
            />
        );
    }

    return (
        <div className="app">
            <aside className="sidebar">
                <div className="brand">
                    <div className="brand-icon">☕</div>
                    <div>
                        <h1>Rivius POS</h1>
                        <p>Luxury self order</p>
                    </div>
                </div>

                <div className="side-nav">
                    <Link
                        className="active"
                        to={normalizedBranchCode ? `/pos/${normalizedBranchCode}` : "/"}
                    >
                        POS bán hàng
                    </Link>

                    <Link to="/admin">Trang Admin</Link>
                </div>

                <div className="sidebar-box">
                    <span className="label">Chi nhánh</span>
                    <strong>{branchLabel}</strong>
                </div>

                <div className="sidebar-box">
                    <span className="label">Tổng đơn</span>
                    <strong>{orders.length}</strong>
                </div>

                <div className="sidebar-box">
                    <span className="label">Doanh thu hôm nay</span>
                    <strong>{formatMoney(todayReport.totalRevenue)}</strong>
                </div>

                <div className="sidebar-box">
                    <span className="label">Đơn đã thanh toán</span>
                    <strong>{todayReport.totalPaidOrders}</strong>
                </div>

                <div className="sidebar-box">
                    <span className="label">Chưa thanh toán</span>
                    <strong>{todayReport.totalUnpaidOrders}</strong>
                </div>

                <div className="sidebar-box">
                    <span className="label">Giỏ hiện tại</span>
                    <strong>{cart.length} món</strong>
                </div>

                <div className="sidebar-box">
                    <span className="label">Bàn có khách</span>
                    <strong>
                        {tables.filter((table) => table.status === "occupied").length}
                    </strong>
                </div>
            </aside>

            <main className="main">
                <section className="topbar">
                    <div>
                        <h2>
                            Menu đồ uống {normalizedBranchCode ? `- ${branchLabel}` : ""}
                        </h2>

                        <p>
                            {normalizedBranchCode
                                ? `Bạn đang bán hàng tại ${branchLabel}.`
                                : "Bạn đang ở POS tổng. Vào /pos/DN01 hoặc /pos/HA01 để bán theo từng chi nhánh."}
                        </p>
                    </div>

                    <button className="refresh-button" onClick={reloadDashboardData}>
                        Làm mới dữ liệu
                    </button>
                </section>

                <section className="tables-section">
                    <div className="section-heading">
                        <div>
                            <h2>Sơ đồ bàn</h2>
                            <p>
                                {normalizedBranchCode
                                    ? `Danh sách bàn của ${branchLabel}.`
                                    : "Chọn bàn trước khi tạo order."}
                            </p>
                        </div>

                        <button className="refresh-button small" onClick={loadTables}>
                            Làm mới bàn
                        </button>
                    </div>

                    <div className="tables-grid">
                        <button
                            className={
                                selectedTableId === ""
                                    ? "table-card takeaway selected"
                                    : "table-card takeaway"
                            }
                            onClick={() => setSelectedTableId("")}
                        >
                            <strong>Takeaway</strong>
                            <span>Mang đi</span>
                        </button>

                        {tables.map((table) => (
                            <div
                                className={
                                    selectedTableId === table._id
                                        ? `table-card ${table.status} selected`
                                        : `table-card ${table.status}`
                                }
                                key={table._id}
                            >
                                <button
                                    className="table-main-button"
                                    onClick={() => {
                                        if (
                                            table.status === "cleaning" ||
                                            table.status === "reserved"
                                        ) {
                                            alert(`${table.name} hiện chưa thể nhận order`);
                                            return;
                                        }

                                        setSelectedTableId(table._id);
                                    }}
                                >
                                    <strong>{table.name}</strong>
                                    <span>{table.area}</span>

                                    {table.branchCode && (
                                        <small>{table.branchName || table.branchCode}</small>
                                    )}

                                    <em>{getTableStatusText(table.status)}</em>
                                </button>

                                <div className="table-actions">
                                    <button
                                        onClick={() => updateTableStatus(table._id, "available")}
                                    >
                                        Trống
                                    </button>

                                    <button
                                        onClick={() => updateTableStatus(table._id, "cleaning")}
                                    >
                                        Chờ dọn
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {normalizedBranchCode && tables.length === 0 && (
                        <div className="empty-box">
                            Chi nhánh {normalizedBranchCode} chưa có bàn nào. Hãy vào Admin bàn
                            để tạo bàn cho chi nhánh này.
                        </div>
                    )}
                </section>

                <section className="content-layout">
                    <div className="menu-area">
                        <div className="section-heading">
                            <div>
                                <h2>Menu</h2>
                                <p>Chọn món để thêm nhanh vào đơn hiện tại.</p>
                            </div>
                        </div>

                        <div className="category-tabs">
                            {categories.map((category) => (
                                <button
                                    key={category}
                                    className={
                                        selectedCategory === category
                                            ? "category-button active"
                                            : "category-button"
                                    }
                                    onClick={() => setSelectedCategory(category)}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>

                        {loading ? (
                            <div className="empty-box">Đang tải menu...</div>
                        ) : filteredMenu.length === 0 ? (
                            <div className="empty-box">
                                Chưa có món nào. Hãy thêm món trong Admin menu.
                            </div>
                        ) : (
                            <div className="menu-grid">
                                {filteredMenu.map((item) => (
                                    <article className="menu-card" key={item._id}>
                                        <div className="menu-image-wrap">
                                            {item.image ? (
                                                <img src={item.image} alt={item.name} />
                                            ) : (
                                                <div className="image-placeholder">No image</div>
                                            )}

                                            <span className="category-badge">{item.category}</span>
                                        </div>

                                        <div className="menu-info">
                                            <h3>{item.name}</h3>
                                            <p>{item.isAvailable ? "Đang bán" : "Tạm hết"}</p>

                                            <div className="menu-bottom">
                                                <strong>{formatMoney(item.price)}</strong>

                                                <button
                                                    disabled={!item.isAvailable}
                                                    onClick={() => addToCart(item)}
                                                >
                                                    {item.isAvailable ? "+ Thêm" : "Tạm hết"}
                                                </button>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </div>

                    <aside className="order-panel">
                        <div className="panel-card">
                            <h2>Đơn hiện tại</h2>

                            <div className="selected-table-note">
                                Chi nhánh: <strong>{branchLabel}</strong>
                            </div>

                            <div className="selected-table-note">
                                Đang chọn:{" "}
                                <strong>{selectedTable ? selectedTable.name : "Takeaway"}</strong>
                            </div>

                            <div className="form-grid">
                                <input
                                    value={selectedTable ? selectedTable.name : tableName}
                                    onChange={(e) => setTableName(e.target.value)}
                                    placeholder="Tên bàn / Takeaway"
                                    disabled={!!selectedTable}
                                />

                                <input
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    placeholder="Tên khách hàng"
                                />
                            </div>

                            <div className="cart-list">
                                {cart.length === 0 ? (
                                    <div className="empty-cart">
                                        <span>🛒</span>
                                        <p>Chưa chọn món</p>
                                    </div>
                                ) : (
                                    cart.map((item) => (
                                        <div className="cart-item" key={item.menuItemId}>
                                            <div className="cart-top">
                                                <div>
                                                    <h4>{item.name}</h4>
                                                    <p>{formatMoney(item.price)}</p>
                                                </div>

                                                <div className="quantity-control">
                                                    <button
                                                        onClick={() =>
                                                            updateQuantity(item.menuItemId, item.quantity - 1)
                                                        }
                                                    >
                                                        -
                                                    </button>

                                                    <span>{item.quantity}</span>

                                                    <button
                                                        onClick={() =>
                                                            updateQuantity(item.menuItemId, item.quantity + 1)
                                                        }
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>

                                            <input
                                                value={item.note}
                                                onChange={(e) =>
                                                    updateNote(item.menuItemId, e.target.value)
                                                }
                                                placeholder="Ghi chú: ít đá, không đường..."
                                            />
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="total-box">
                                <span>Tổng tiền</span>
                                <strong>{formatMoney(totalAmount)}</strong>
                            </div>

                            <button className="order-button" onClick={createOrder}>
                                Xác nhận Order
                            </button>
                        </div>

                        <div className="panel-card orders-card">
                            <div className="section-heading">
                                <div>
                                    <h2>Đơn đã tạo</h2>
                                    <p>Hiển thị 8 đơn mới nhất của chi nhánh hiện tại.</p>
                                </div>
                            </div>

                            {orders.length === 0 ? (
                                <div className="empty-box">Chưa có đơn nào.</div>
                            ) : (
                                orders.slice(0, 8).map((order) => (
                                    <div className="order-card" key={order._id}>
                                        <div className="order-header">
                                            <strong>{order.tableName}</strong>

                                            <span className={`status ${order.status}`}>
                                                {getOrderStatusText(order.status)}
                                            </span>
                                        </div>

                                        {order.branchCode && (
                                            <p className="order-customer">
                                                Chi nhánh: {order.branchName || order.branchCode}
                                            </p>
                                        )}

                                        <p className="order-customer">
                                            Khách: {order.customerName || "Không có"}
                                        </p>

                                        <p className="payment-line">
                                            Thanh toán:{" "}
                                            <strong>
                                                {order.paymentStatus === "paid"
                                                    ? `Đã thanh toán - ${getPaymentMethodText(
                                                        order.paymentMethod
                                                    )}`
                                                    : "Chưa thanh toán"}
                                            </strong>
                                        </p>

                                        <div className="order-items">
                                            {order.items.map((item, index) => (
                                                <p key={index}>
                                                    {item.quantity} x {item.name}
                                                    {item.note ? ` — ${item.note}` : ""}
                                                </p>
                                            ))}
                                        </div>

                                        <div className="order-footer">
                                            <strong>{formatMoney(order.totalAmount || 0)}</strong>
                                        </div>

                                        <div className="status-buttons">
                                            <button
                                                onClick={() =>
                                                    updateOrderStatus(order._id, "preparing")
                                                }
                                            >
                                                Pha chế
                                            </button>

                                            <button
                                                onClick={() =>
                                                    updateOrderStatus(order._id, "completed")
                                                }
                                            >
                                                Xong
                                            </button>

                                            <button
                                                onClick={() =>
                                                    updateOrderStatus(order._id, "cancelled")
                                                }
                                            >
                                                Hủy
                                            </button>
                                        </div>

                                        {order.paymentStatus !== "paid" &&
                                            order.status !== "cancelled" && (
                                                <div className="payment-buttons">
                                                    <button onClick={() => payOrder(order._id, "cash")}>
                                                        Tiền mặt
                                                    </button>

                                                    <button onClick={() => payOrder(order._id, "bank")}>
                                                        Chuyển khoản
                                                    </button>

                                                    <button onClick={() => payOrder(order._id, "card")}>
                                                        Thẻ
                                                    </button>
                                                </div>
                                            )}

                                        <div className="invoice-buttons">
                                            <button onClick={() => setSelectedInvoice(order)}>
                                                Xem hóa đơn
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </aside>
                </section>
            </main>

            <InvoiceModal
                invoice={selectedInvoice}
                onClose={() => setSelectedInvoice(null)}
            />
        </div>
    );
}

export default POSPage;