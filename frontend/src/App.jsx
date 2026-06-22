import { useEffect, useMemo, useState } from "react";
import api from "./api";
import "./App.css";

function App() {
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]);
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

  useEffect(() => {
    loadMenu();
    loadOrders();
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
        tableName,
        customerName,
        items: cart,
        paymentMethod: "cash"
      });

      alert("Tạo đơn thành công");
      setCart([]);
      setCustomerName("");
      setTableName("Takeaway");
      loadOrders();
    } catch (error) {
      console.error("Cannot create order:", error);
      alert("Tạo đơn thất bại");
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await api.patch(`/api/orders/${orderId}/status`, {
        status
      });

      loadOrders();
    } catch (error) {
      console.error("Cannot update order:", error);
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
      </aside>

      <main className="main">
        <section className="topbar">
          <div>
            <h2>Menu đồ uống</h2>
            <p>Chọn món, thêm ghi chú và tạo order cho khách.</p>
          </div>

          <button className="refresh-button" onClick={loadMenu}>
            Làm mới menu
          </button>
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

              <div className="form-grid">
                <input
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  placeholder="Tên bàn / Takeaway"
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
                orders.slice(0, 5).map((order) => (
                  <div className="order-card" key={order._id}>
                    <div className="order-header">
                      <strong>{order.tableName}</strong>
                      <span className={`status ${order.status}`}>
                        {order.status}
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