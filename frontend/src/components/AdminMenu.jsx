import { useEffect, useMemo, useState } from "react";
import api from "../api";
import "./AdminMenu.css";

function AdminMenu() {
    const [menuItems, setMenuItems] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [categoryFilter, setCategoryFilter] = useState("all");

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
            alert(error.response?.data?.message || "Không thể tải danh sách món");
            setMenuItems([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMenu();
    }, []);

    const formatMoney = (amount) => {
        return Number(amount || 0).toLocaleString("vi-VN") + "đ";
    };

    const categories = useMemo(() => {
        const uniqueCategories = Array.from(
            new Set(menuItems.map((item) => item.category).filter(Boolean))
        );

        return uniqueCategories;
    }, [menuItems]);

    const filteredMenuItems = useMemo(() => {
        if (categoryFilter === "all") return menuItems;

        return menuItems.filter((item) => item.category === categoryFilter);
    }, [menuItems, categoryFilter]);

    const summary = useMemo(() => {
        const availableItems = menuItems.filter((item) => item.isAvailable);
        const unavailableItems = menuItems.filter((item) => !item.isAvailable);

        return {
            totalItems: menuItems.length,
            availableItems: availableItems.length,
            unavailableItems: unavailableItems.length,
            totalCategories: categories.length
        };
    }, [menuItems, categories]);

    const resetForm = () => {
        setEditingId(null);

        setForm({
            name: "",
            category: "",
            price: "",
            image: "",
            isAvailable: true
        });
    };

    const handleChange = (field, value) => {
        setForm({
            ...form,
            [field]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.name.trim()) {
            alert("Vui lòng nhập tên món");
            return;
        }

        if (!form.category.trim()) {
            alert("Vui lòng nhập danh mục");
            return;
        }

        if (form.price === "" || Number(form.price) <= 0) {
            alert("Vui lòng nhập giá hợp lệ");
            return;
        }

        try {
            const payload = {
                name: form.name.trim(),
                category: form.category.trim(),
                price: Number(form.price),
                image: form.image.trim(),
                isAvailable: form.isAvailable
            };

            if (editingId) {
                await api.patch(`/api/menu/${editingId}`, payload);
                alert("Cập nhật món thành công");
            } else {
                await api.post("/api/menu", payload);
                alert("Tạo món thành công");
            }

            resetForm();
            loadMenu();
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
            isAvailable: item.isAvailable !== false
        });

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    const toggleAvailable = async (item) => {
        try {
            await api.patch(`/api/menu/${item._id}/toggle`);

            loadMenu();
        } catch (error) {
            console.error("Cannot toggle menu item:", error);
            alert(error.response?.data?.message || "Không thể đổi trạng thái món");
        }
    };

    const deleteItem = async (item) => {
        const confirmed = window.confirm(
            `Bạn có chắc muốn xóa món "${item.name}" không?`
        );

        if (!confirmed) return;

        try {
            await api.delete(`/api/menu/${item._id}`);

            alert("Xóa món thành công");
            loadMenu();
        } catch (error) {
            console.error("Cannot delete menu item:", error);
            alert(error.response?.data?.message || "Không thể xóa món");
        }
    };

    return (
        <section className="admin-menu-page">
            <div className="admin-menu-hero">
                <div>
                    <h2>Admin - Quản lý menu</h2>
                    <p>
                        Thêm, sửa, tạm ẩn món và quản lý danh mục món bán trong hệ thống.
                    </p>
                </div>

                <button onClick={loadMenu}>Làm mới</button>
            </div>

            <div className="admin-menu-stats">
                <div className="admin-menu-stat revenue">
                    <span>Tổng món</span>
                    <strong>{summary.totalItems}</strong>
                </div>

                <div className="admin-menu-stat">
                    <span>Đang bán</span>
                    <strong>{summary.availableItems}</strong>
                </div>

                <div className="admin-menu-stat cancelled">
                    <span>Tạm ẩn</span>
                    <strong>{summary.unavailableItems}</strong>
                </div>

                <div className="admin-menu-stat">
                    <span>Danh mục</span>
                    <strong>{summary.totalCategories}</strong>
                </div>
            </div>

            <div className="admin-menu-layout">
                <form className="admin-menu-form" onSubmit={handleSubmit}>
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
                            list="menu-category-list"
                        />

                        <datalist id="menu-category-list">
                            {categories.map((category) => (
                                <option key={category} value={category} />
                            ))}
                        </datalist>
                    </label>

                    <label>
                        Giá bán
                        <input
                            type="number"
                            min="0"
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

                    <label className="admin-menu-checkbox">
                        <input
                            type="checkbox"
                            checked={form.isAvailable}
                            onChange={(e) => handleChange("isAvailable", e.target.checked)}
                        />
                        Đang bán món này
                    </label>

                    {form.image && (
                        <div className="admin-menu-preview">
                            <img src={form.image} alt="Preview món" />
                        </div>
                    )}

                    <div className="admin-menu-form-actions">
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

                <div className="admin-menu-main">
                    <div className="admin-menu-filter-card">
                        <label>
                            Lọc danh mục
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                            >
                                <option value="all">Tất cả danh mục</option>

                                {categories.map((category) => (
                                    <option key={category} value={category}>
                                        {category}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <div className="admin-menu-branch-card">
                        <h3>Danh sách món</h3>
                        <p>Đang hiển thị {filteredMenuItems.length} món.</p>
                    </div>

                    {loading ? (
                        <div className="admin-menu-empty">Đang tải menu...</div>
                    ) : filteredMenuItems.length === 0 ? (
                        <div className="admin-menu-empty">Chưa có món nào.</div>
                    ) : (
                        <div className="admin-menu-grid">
                            {filteredMenuItems.map((item) => (
                                <article className="admin-menu-card" key={item._id}>
                                    <div className="admin-menu-image">
                                        {item.image ? (
                                            <img src={item.image} alt={item.name} />
                                        ) : (
                                            <span>Không có ảnh</span>
                                        )}

                                        <strong className="admin-menu-category">
                                            {item.category}
                                        </strong>
                                    </div>

                                    <div className="admin-menu-card-body">
                                        <div className="admin-menu-card-head">
                                            <div>
                                                <h3>{item.name}</h3>
                                                <p>{formatMoney(item.price)}</p>
                                            </div>

                                            <span
                                                className={`admin-menu-status ${item.isAvailable ? "available" : "hidden"
                                                    }`}
                                            >
                                                {item.isAvailable ? "Đang bán" : "Tạm ẩn"}
                                            </span>
                                        </div>

                                        <div className="admin-menu-card-actions">
                                            <button onClick={() => startEdit(item)}>Sửa</button>

                                            <button
                                                className={item.isAvailable ? "warning" : "success"}
                                                onClick={() => toggleAvailable(item)}
                                            >
                                                {item.isAvailable ? "Tạm ẩn" : "Bật bán"}
                                            </button>

                                            <button
                                                className="danger"
                                                onClick={() => deleteItem(item)}
                                            >
                                                Xóa
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

export default AdminMenu;