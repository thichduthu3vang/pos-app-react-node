import { useEffect, useState } from "react";
import api from "../api";
import "./AdminTables.css";

function AdminTables({ onTablesChanged }) {
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);

    const [form, setForm] = useState({
        name: "",
        area: "Khu chính",
        status: "available"
    });

    const loadTables = async () => {
        try {
            setLoading(true);
            const response = await api.get("/api/tables");
            setTables(response.data.data || []);
        } catch (error) {
            console.error("Cannot load tables:", error);
            alert("Không thể tải danh sách bàn");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTables();
    }, []);

    const resetForm = () => {
        setForm({
            name: "",
            area: "Khu chính",
            status: "available"
        });
        setEditingId(null);
    };

    const handleChange = (field, value) => {
        setForm({
            ...form,
            [field]: value
        });
    };

    const getStatusText = (status) => {
        if (status === "available") return "Trống";
        if (status === "occupied") return "Có khách";
        if (status === "cleaning") return "Chờ dọn";
        if (status === "reserved") return "Đã đặt";
        return status;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.name) {
            alert("Vui lòng nhập tên bàn");
            return;
        }

        const payload = {
            name: form.name,
            area: form.area,
            status: form.status
        };

        try {
            if (editingId) {
                await api.patch(`/api/tables/${editingId}`, payload);
                alert("Cập nhật bàn thành công");
            } else {
                await api.post("/api/tables", payload);
                alert("Thêm bàn thành công");
            }

            resetForm();
            loadTables();

            if (onTablesChanged) {
                onTablesChanged();
            }
        } catch (error) {
            console.error("Cannot save table:", error);
            alert(error.response?.data?.message || "Không thể lưu bàn");
        }
    };

    const startEdit = (table) => {
        setEditingId(table._id);

        setForm({
            name: table.name || "",
            area: table.area || "Khu chính",
            status: table.status || "available"
        });

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    const deleteTable = async (table) => {
        const confirmed = window.confirm(
            `Bạn có chắc muốn xóa "${table.name}" không?`
        );

        if (!confirmed) return;

        try {
            await api.delete(`/api/tables/${table._id}`);
            alert("Xóa bàn thành công");

            loadTables();

            if (onTablesChanged) {
                onTablesChanged();
            }
        } catch (error) {
            console.error("Cannot delete table:", error);
            alert(error.response?.data?.message || "Không thể xóa bàn");
        }
    };

    const quickSetStatus = async (table, status) => {
        try {
            await api.patch(`/api/tables/${table._id}/status`, {
                status
            });

            loadTables();

            if (onTablesChanged) {
                onTablesChanged();
            }
        } catch (error) {
            console.error("Cannot update table status:", error);
            alert(error.response?.data?.message || "Không thể đổi trạng thái bàn");
        }
    };

    return (
        <section className="admin-tables-page">
            <div className="admin-tables-header">
                <div>
                    <h2>Admin - Quản lý bàn</h2>
                    <p>Thêm, sửa, xóa và đổi trạng thái bàn trong quán.</p>
                </div>

                <button className="admin-tables-refresh" onClick={loadTables}>
                    Làm mới
                </button>
            </div>

            <div className="admin-tables-layout">
                <form className="admin-table-form" onSubmit={handleSubmit}>
                    <h3>{editingId ? "Sửa bàn" : "Thêm bàn mới"}</h3>

                    <label>
                        Tên bàn
                        <input
                            value={form.name}
                            onChange={(e) => handleChange("name", e.target.value)}
                            placeholder="Ví dụ: Bàn 1"
                        />
                    </label>

                    <label>
                        Khu vực
                        <input
                            value={form.area}
                            onChange={(e) => handleChange("area", e.target.value)}
                            placeholder="Ví dụ: Khu chính"
                        />
                    </label>

                    <label>
                        Trạng thái
                        <select
                            value={form.status}
                            onChange={(e) => handleChange("status", e.target.value)}
                        >
                            <option value="available">Trống</option>
                            <option value="occupied">Có khách</option>
                            <option value="cleaning">Chờ dọn</option>
                            <option value="reserved">Đã đặt</option>
                        </select>
                    </label>

                    <div className="admin-table-form-actions">
                        <button type="submit">
                            {editingId ? "Lưu cập nhật" : "Thêm bàn"}
                        </button>

                        {editingId && (
                            <button type="button" className="secondary" onClick={resetForm}>
                                Hủy sửa
                            </button>
                        )}
                    </div>
                </form>

                <div className="admin-table-list-card">
                    <div className="admin-table-list-header">
                        <h3>Danh sách bàn</h3>
                        <span>{tables.length} bàn</span>
                    </div>

                    {loading ? (
                        <div className="admin-table-empty">Đang tải bàn...</div>
                    ) : tables.length === 0 ? (
                        <div className="admin-table-empty">Chưa có bàn nào.</div>
                    ) : (
                        <div className="admin-table-grid">
                            {tables.map((table) => (
                                <div className={`admin-table-card ${table.status}`} key={table._id}>
                                    <div className="admin-table-card-top">
                                        <div>
                                            <h4>{table.name}</h4>
                                            <p>{table.area}</p>
                                        </div>

                                        <span>{getStatusText(table.status)}</span>
                                    </div>

                                    <div className="admin-table-quick-actions">
                                        <button onClick={() => quickSetStatus(table, "available")}>
                                            Trống
                                        </button>

                                        <button onClick={() => quickSetStatus(table, "cleaning")}>
                                            Chờ dọn
                                        </button>

                                        <button onClick={() => quickSetStatus(table, "reserved")}>
                                            Đã đặt
                                        </button>
                                    </div>

                                    <div className="admin-table-actions">
                                        <button onClick={() => startEdit(table)}>Sửa</button>

                                        <button
                                            className="danger"
                                            onClick={() => deleteTable(table)}
                                        >
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

export default AdminTables;