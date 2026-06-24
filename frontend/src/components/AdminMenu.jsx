import { useEffect, useState } from "react";
import api from "../api";
import "./AdminMenu.css";

function AdminMenu({ onMenuChanged }) {
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);

    const [form, setForm] = useState({
        name: "",
        category: "",
        price: "",
        image: "",
        isAvailable: true
    });

    const loadMenu = async () => {
        try {
            setLoading(true);
            const response = await api.get("/api/menu");
            setMenuItems(response.data.data || []);
        } catch (error) {
            console.error("Cannot load menu:", error);
            alert("Không thể tải menu");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMenu();
    }, []);

    const resetForm = () => {
        setForm({
            name: "",
            category: "",
            price: "",
            image: "",
            isAvailable: true
        });

        setEditingId(null);
    };

    const handleChange = (field, value) => {
        setForm({
            ...form,
            [field]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.name || !form.category || !form.price) {
            alert("Vui lòng nhập tên món, danh mục và giá");
            return;
        }

        const payload = {
            name: form.name,
            category: form.category,
            price: Number(form.price),
            image: form.image,
            isAvailable: form.isAvailable
        };

        try {
            if (editingId) {
                await api.patch(`/api/menu/${editingId}`, payload);
                alert("Cập nhật món thành công");
            } else {
                await api.post("/api/menu", payload);
                alert("Thêm món thành công");
            }

            resetForm();
            loadMenu();

            if (onMenuChanged) {
                onMenuChanged();
            }
        } catch (error) {
            console.error("Cannot save menu item:", error);
            alert(error.response?.data?.message || "Không thể lưu món");
        }
    };

    const startEdit = (item) => {
        setEditingId(item._id);

        setForm({
            name: item.name || "",
            category: item.category || "",
            price: item.price || "",
            image: item.image || "",
            isAvailable: item.isAvailable
        });

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    const deleteItem = async (item) => {
        const confirmed = window.confirm(
            `Bạn có chắc muốn xóa món "${item.name}" không?`
        );

        if (!confirmed) {
            return;
        }

        try {
            await api.delete(`/api/menu/${item._id}`);
            alert("Xóa món thành công");

            loadMenu();

            if (onMenuChanged) {
                onMenuChanged();
            }
        } catch (error) {
            console.error("Cannot delete menu item:", error);
            alert("Không thể xóa món");
        }
    };

    const toggleAvailable = async (item) => {
        try {
            await api.patch(`/api/menu/${item._id}/toggle`);

            loadMenu();

            if (onMenuChanged) {
                onMenuChanged();
            }
        } catch (error) {
            console.error("Cannot toggle menu item:", error);
            alert("Không thể đổi trạng thái món");
        }
    };

    return (
        <section className="admin-page">
            <div className="admin-header">
                <div>
                    <h2>Admin - Quản lý menu</h2>
                    <p>Thêm, sửa, xóa và bật/tắt món đang bán.</p>
                </div>

                <button className="admin-refresh-button" onClick={loadMenu}>
                    Làm mới
                </button>
            </div>

            <div className="admin-layout">
                <form className="admin-form-card" onSubmit={handleSubmit}>
                    <h3>{editingId ? "Sửa món" : "Thêm món mới"}</h3>

                    <label>
                        Tên món
                        <input
                            value={form.name}
                            onChange={(e) => handleChange("name", e.target.value)}
                            placeholder="Ví dụ: Bạc xỉu"
                        />
                    </label>

                    <label>
                        Danh mục
                        <input
                            value={form.category}
                            onChange={(e) => handleChange("category", e.target.value)}
                            placeholder="Ví dụ: Cà phê"
                        />
                    </label>

                    <label>
                        Giá
                        <input
                            type="number"
                            value={form.price}
                            onChange={(e) => handleChange("price", e.target.value)}
                            placeholder="Ví dụ: 35000"
                        />
                    </label>

                    <label>
                        Link ảnh
                        <input
                            value={form.image}
                            onChange={(e) => handleChange("image", e.target.value)}
                            placeholder="https://..."
                        />
                    </label>

                    <label className="admin-checkbox">
                        <input
                            type="checkbox"
                            checked={form.isAvailable}
                            onChange={(e) => handleChange("isAvailable", e.target.checked)}
                        />
                        Đang bán
                    </label>

                    {form.image && (
                        <div className="admin-preview">
                            <img src={form.image} alt="Preview" />
                        </div>
                    )}

                    <div className="admin-form-actions">
                        <button type="submit">
                            {editingId ? "Lưu cập nhật" : "Thêm món"}
                        </button>

                        {editingId && (
                            <button type="button" className="secondary" onClick={resetForm}>
                                Hủy sửa
                            </button>
                        )}
                    </div>
                </form>

                <div className="admin-list-card">
                    <div className="admin-list-header">
                        <h3>Danh sách món</h3>
                        <span>{menuItems.length} món</span>
                    </div>

                    {loading ? (
                        <div className="admin-empty">Đang tải menu...</div>
                    ) : menuItems.length === 0 ? (
                        <div className="admin-empty">Chưa có món nào.</div>
                    ) : (
                        <div className="admin-menu-list">
                            {menuItems.map((item) => (
                                <div className="admin-menu-item" key={item._id}>
                                    <div className="admin-item-image">
                                        {item.image ? (
                                            <img src={item.image} alt={item.name} />
                                        ) : (
                                            <span>No image</span>
                                        )}
                                    </div>

                                    <div className="admin-item-info">
                                        <h4>{item.name}</h4>
                                        <p>{item.category}</p>
                                        <strong>{item.price.toLocaleString("vi-VN")}đ</strong>

                                        <span
                                            className={
                                                item.isAvailable
                                                    ? "admin-status available"
                                                    : "admin-status unavailable"
                                            }
                                        >
                                            {item.isAvailable ? "Đang bán" : "Tạm hết"}
                                        </span>
                                    </div>

                                    <div className="admin-item-actions">
                                        <button onClick={() => startEdit(item)}>Sửa</button>

                                        <button onClick={() => toggleAvailable(item)}>
                                            {item.isAvailable ? "Tạm hết" : "Mở bán"}
                                        </button>

                                        <button className="danger" onClick={() => deleteItem(item)}>
                                            Xóa
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

export default AdminMenu;