import { useEffect, useMemo, useState } from "react";
import api from "./api";
import "./App.css";

function App() {
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]);
  const [tables, setTables] = useState([]);
  const [selectedTableId, setSelectedTableId] = useState("");
  const [tableName, setTableName] = useState("Takeaway");
  const [customerName, setCustomerName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [loading, setLoading] = useState(true);

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
      const response = await api.get("/api/orders");
      setOrders(response.data.data || []);
    } catch (error) {
      console.error("Cannot load orders:", error);
    }
  };

  const loadTables = async () => {
    try {
      const response = await api.get("/api/tables");
      setTables(response.data.data || []);
    } catch (error) {
      console.error("Cannot load tables:", error);
    }
  };

  useEffect(() => {
    loadMenu();
    loadOrders();
    loadTables();
  }, []);

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

  const addToCart = (item) => {
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
    } catch (error) {
      console.error("Cannot create order:", error);
      alert(error.response?.data?.message || "Tạo đơn thất bại");
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await api.patch(`/api/orders/${orderId}/status`, {
        status
      });

      loadOrders();
      loadTables();
    } catch (error) {
      console.error("Cannot update order:", error);
      alert("Không thể cập nhật trạng thái đơn");
    }
  };

  const updateTableStatus = async (tableId, status) => {
    try {
      await api.patch(`/api/tables/${tableId}/status`, {
        status
      });

      loadTables();
    } catch (error) {
      console.error("Cannot update table status:", error);
      alert("Không thể cập nhật trạng thái bàn");
    }
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">☕</div>
          <div>
            <h1>POS Coffee</h1>
            <p>React + Node + MongoDB</p>
          </div>
        </div>

        <div className="sidebar-box">
          <span className="label">Hôm nay</span>
          <strong>{orders.length} đơn</strong>
        </div>

        <div className="sidebar-box">
          <span className="label">Giỏ hiện tại</span>
          <strong>{cart.length} món</strong>
        </div>

        <div className="sidebar-box">
          <span className="label">Bàn đang có khách</span>
          <strong>
            {tables.filter((table) => table.status === "occupied").length}
          </strong>
        </div>
      </aside>

      <main className="main">
        <section className="topbar">
          <div>
            <h2>Menu đồ uống</h2>
            <p>Chọn bàn, chọn món, thêm ghi chú và tạo order cho khách.</p>
          </div>

          <button
            className="refresh-button"
            onClick={() => {
              loadMenu();
              loadOrders();
              loadTables();
            }}
          >
            Làm mới
          </button>
        </section>

        <section className="tables-section">
          <div className="section-heading">
            <div>
              <h2>Sơ đồ bàn</h2>
              <p>Chọn bàn trước khi tạo order.</p>
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
                    if (table.status !== "available") {
                      alert(`${table.name} hiện không trống`);
                      return;
                    }

                    setSelectedTableId(table._id);
                  }}
                >
                  <strong>{table.name}</strong>
                  <span>{table.area}</span>
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
        </section>

        <section className="content-layout">
          <div className="menu-area">
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
                Chưa có món nào. Hãy thêm món bằng API trước.
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
                        <strong>{item.price.toLocaleString("vi-VN")}đ</strong>
                        <button onClick={() => addToCart(item)}>+ Thêm</button>
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
                          <p>{item.price.toLocaleString("vi-VN")}đ</p>
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
                <strong>{totalAmount.toLocaleString("vi-VN")}đ</strong>
              </div>

              <button className="order-button" onClick={createOrder}>
                Xác nhận Order
              </button>
            </div>

            <div className="panel-card orders-card">
              <h2>Đơn đã tạo</h2>

              {orders.length === 0 ? (
                <p className="muted">Chưa có đơn nào.</p>
              ) : (
                orders.slice(0, 8).map((order) => (
                  <div className="order-card" key={order._id}>
                    <div className="order-header">
                      <strong>{order.tableName}</strong>
                      <span className={`status ${order.status}`}>
                        {getOrderStatusText(order.status)}
                      </span>
                    </div>

                    <p className="order-customer">
                      Khách: {order.customerName || "Không có"}
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
                      <strong>
                        {order.totalAmount.toLocaleString("vi-VN")}đ
                      </strong>
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
                  </div>
                ))
              )}
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}

export default App;