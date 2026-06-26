import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api";
import "./CustomerOrderPage.css";

function CustomerOrderPage() {
    const { branchCode, tableId } = useParams();

    const normalizedBranchCode = branchCode ? branchCode.toUpperCase() : "";

    const [branch, setBranch] = useState(null);
    const [table, setTable] = useState(null);
    const [menuItems, setMenuItems] = useState([]);
    const [cart, setCart] = useState([]);
    const [customerName, setCustomerName] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("Tất cả");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [pageError, setPageError] = useState("");

    const loadData = async () => {
        try {
            setLoading(true);
            setPageError("");

            if (!normalizedBranchCode || !tableId) {
                setPageError("QR không hợp lệ. Vui lòng gọi nhân viên.");
                return;
            }

            const branchesResponse = await api.get("/api/branches");
            const branches = branchesResponse.data.data || [];

            const foundBranch = branches.find(
                (item) =>
                    item.code === normalizedBranchCode && item.isActive === true
            );

            if (!foundBranch) {
                setPageError(
                    `Chi nhánh ${normalizedBranchCode} không tồn tại hoặc đang tạm tắt. Vui lòng gọi nhân viên.`
                );
                return;
            }

            const [tableResponse, menuResponse] = await Promise.all([
                api.get(`/api/tables/${tableId}`),
                api.get("/api/menu")
            ]);

            const foundTable = tableResponse.data.data;

            if (!foundTable) {
                setPageError("Không tìm thấy bàn. Vui lòng gọi nhân viên.");
                return;
            }

            if (foundTable.branchCode !== normalizedBranchCode) {
                setPageError(
                    "QR này không thuộc đúng chi nhánh. Vui lòng gọi nhân viên."
                );
                return;
            }

            if (
                foundTable.status === "cleaning" ||
                foundTable.status === "reserved"
            ) {
                setPageError(
                    `${foundTable.name} hiện chưa thể nhận order. Vui lòng gọi nhân viên.`
                );
                return;
            }

            setBranch(foundBranch);
            setTable(foundTable);
            setMenuItems(menuResponse.data.data || []);
        } catch (error) {
            console.error("Cannot load customer order page:", error);
            setPageError("Không thể tải trang order. Vui lòng gọi nhân viên.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [normalizedBranchCode, tableId]);

    const categories = useMemo(() => {
        const list = menuItems
            .filter((item) => item.isAvailable)
            .map((item) => item.category);

        return ["Tất cả", ...new Set(list)];
    }, [menuItems]);

    const filteredMenu = useMemo(() => {
        const availableItems = menuItems.filter((item) => item.isAvailable);

        if (selectedCategory === "Tất cả") {
            return availableItems;
        }

        return availableItems.filter((item) => item.category === selectedCategory);
    }, [menuItems, selectedCategory]);

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
        return sum + Number(item.price || 0) * Number(item.quantity || 0);
    }, 0);

    const submitOrder = async () => {
        if (!branch || !table) {
            alert("QR không hợp lệ. Vui lòng gọi nhân viên.");
            return;
        }

        if (cart.length === 0) {
            alert("Vui lòng chọn món trước");
            return;
        }

        try {
            setSubmitting(true);

            await api.post("/api/orders", {
                branchCode: normalizedBranchCode,
                tableId: table._id,
                tableName: table.name,
                customerName,
                items: cart,
                paymentMethod: "cash"
            });

            alert("Gửi order thành công. Nhân viên sẽ xử lý đơn của bạn.");

            setCart([]);
            setCustomerName("");

            loadData();
        } catch (error) {
            console.error("Cannot submit customer order:", error);
            alert(error.response?.data?.message || "Không thể gửi order");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="customer-order-loading">Đang tải menu...</div>;
    }

    if (pageError) {
        return (
            <div className="customer-order-page">
                <header className="customer-order-header">
                    <div>
                        <h1>POS Coffee</h1>
                        <p>QR Order</p>
                    </div>
                </header>

                <section className="customer-info-card">
                    <h2 style={{ marginTop: 0 }}>Không thể order</h2>
                    <p style={{ color: "#7b6b5c", lineHeight: 1.6 }}>{pageError}</p>

                    <button className="customer-submit-button" onClick={loadData}>
                        Tải lại
                    </button>
                </section>
            </div>
        );
    }

    if (!branch || !table) {
        return (
            <div className="customer-order-loading">
                Không tìm thấy thông tin bàn.
            </div>
        );
    }

    return (
        <div className="customer-order-page">
            <header className="customer-order-header">
                <div>
                    <h1>POS Coffee</h1>
                    <p>{branch.name}</p>
                </div>

                <div className="customer-table-badge">
                    <span>Bàn</span>
                    <strong>{table.name}</strong>
                </div>
            </header>

            <section className="customer-info-card">
                <label>
                    Tên khách hàng
                    <input
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Nhập tên của bạn nếu muốn"
                    />
                </label>
            </section>

            <section className="customer-category-tabs">
                {categories.map((category) => (
                    <button
                        key={category}
                        className={selectedCategory === category ? "active" : ""}
                        onClick={() => setSelectedCategory(category)}
                    >
                        {category}
                    </button>
                ))}
            </section>

            <main className="customer-menu-list">
                {filteredMenu.length === 0 ? (
                    <div className="customer-empty">Chưa có món đang bán.</div>
                ) : (
                    filteredMenu.map((item) => (
                        <article className="customer-menu-card" key={item._id}>
                            <div className="customer-menu-image">
                                {item.image ? (
                                    <img src={item.image} alt={item.name} />
                                ) : (
                                    <span>No image</span>
                                )}
                            </div>

                            <div className="customer-menu-info">
                                <h3>{item.name}</h3>
                                <p>{item.category}</p>
                                <strong>{item.price.toLocaleString("vi-VN")}đ</strong>
                            </div>

                            <button onClick={() => addToCart(item)}>Thêm</button>
                        </article>
                    ))
                )}
            </main>

            <section className="customer-cart">
                <h2>Giỏ order</h2>

                {cart.length === 0 ? (
                    <div className="customer-empty">Bạn chưa chọn món nào.</div>
                ) : (
                    <div className="customer-cart-list">
                        {cart.map((item) => (
                            <div className="customer-cart-item" key={item.menuItemId}>
                                <div className="customer-cart-top">
                                    <div>
                                        <h4>{item.name}</h4>
                                        <p>{item.price.toLocaleString("vi-VN")}đ</p>
                                    </div>

                                    <div className="customer-quantity">
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
                                    onChange={(e) => updateNote(item.menuItemId, e.target.value)}
                                    placeholder="Ghi chú: ít đá, ít đường..."
                                />
                            </div>
                        ))}
                    </div>
                )}

                <div className="customer-total">
                    <span>Tổng tiền</span>
                    <strong>{totalAmount.toLocaleString("vi-VN")}đ</strong>
                </div>

                <button
                    className="customer-submit-button"
                    onClick={submitOrder}
                    disabled={submitting}
                >
                    {submitting ? "Đang gửi order..." : "Gửi order"}
                </button>
            </section>
        </div>
    );
}

export default CustomerOrderPage;