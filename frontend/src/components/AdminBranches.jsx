import { useEffect, useState } from "react";
import api from "../api";
import "./AdminBranches.css";

function AdminBranches() {
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);

    const [form, setForm] = useState({
        name: "",
        code: "",
        address: "",
        phone: "",
        isActive: true
    });

    const loadBranches = async () => {
        try {
            setLoading(true);
            const response = await api.get("/api/branches");
            setBranches(response.data.data || []);
        } catch (error) {
            console.error("Cannot load branches:", error);
            alert("Không thể tải danh sách chi nhánh");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBranches();
    }, []);

    const handleChange = (field, value) => {
        setForm({
            ...form,
            [field]: value
        });
    };

    const resetForm = () => {
        setForm({
            name: "",
            code: "",
            address: "",
            phone: "",
            isActive: true
        });
        setEditingId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.name || !form.code) {
            alert("Vui lòng nhập tên chi nhánh và mã chi nhánh");
            return;
        }

        try {
            if (editingId) {
                await api.patch(`/api/branches/${editingId}`, form);
                alert("Cập nhật chi nhánh thành công");
            } else {
                await api.post("/api/branches", form);
                alert("Thêm chi nhánh thành công");
            }

            resetForm();
            loadBranches();
        } catch (error) {
            console.error("Cannot save branch:", error);
            alert(error.response?.data?.message || "Không thể lưu chi nhánh");
        }
    };

    const startEdit = (branch) => {
        setEditingId(branch._id);
        setForm({
            name: branch.name || "",
            code: branch.code || "",
            address: branch.address || "",
            phone: branch.phone || "",
            isActive: branch.isActive
        });

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    const toggleBranch = async (branch) => {
        try {
            await api.patch(`/api/branches/${branch._id}/toggle`);
            loadBranches();
        } catch (error) {
            console.error("Cannot toggle branch:", error);
            alert("Không thể đổi trạng thái chi nhánh");
        }
    };

    const deleteBranch = async (branch) => {
        const confirmed = window.confirm(
            `Bạn có chắc muốn xóa chi nhánh "${branch.name}" không?`
        );

        if (!confirmed) return;

        try {
            await api.delete(`/api/branches/${branch._id}`);
            alert("Xóa chi nhánh thành công");
            loadBranches();
        } catch (error) {
            console.error("Cannot delete branch:", error);
            alert("Không thể xóa chi nhánh");
        }
    };

    return (
        <section className="admin-branches-page">
            <div className="admin-branches-header">
                <div>
                    <h2>Admin - Quản lý chi nhánh</h2>
                    <p>Tạo và quản lý các chi nhánh trong hệ thống POS.</p>
                </div>

                <button className="admin-branches-refresh" onClick={loadBranches}>
                    Làm mới
                </button>
            </div>

            <div className="admin-branches-layout">
                <form className="admin-branch-form" onSubmit={handleSubmit}>
                    <h3>{editingId ? "Sửa chi nhánh" : "Thêm chi nhánh mới"}</h3>

                    <label>
                        Tên chi nhánh
                        <input
                            value={form.name}
                            onChange={(e) => handleChange("name", e.target.value)}
                            placeholder="Ví dụ: Chi nhánh Đà Nẵng"
                        />
                    </label>

                    <label>
                        Mã chi nhánh
                        <input
                            value={form.code}
                            onChange={(e) => handleChange("code", e.target.value)}
                            placeholder="Ví dụ: DN01"
                        />
                    </label>

                    <label>
                        Địa chỉ
                        <input
                            value={form.address}
                            onChange={(e) => handleChange("address", e.target.value)}
                            placeholder="Ví dụ: 123 Nguyễn Văn Linh"
                        />
                    </label>

                    <label>
                        Số điện thoại
                        <input
                            value={form.phone}
                            onChange={(e) => handleChange("phone", e.target.value)}
                            placeholder="Ví dụ: 0901234567"
                        />
                    </label>

                    <label className="admin-branch-checkbox">
                        <input
                            type="checkbox"
                            checked={form.isActive}
                            onChange={(e) => handleChange("isActive", e.target.checked)}
                        />
                        Đang hoạt động
                    </label>

                    <div className="admin-branch-actions">
                        <button type="submit">
                            {editingId ? "Lưu cập nhật" : "Thêm chi nhánh"}
                        </button>

                        {editingId && (
                            <button type="button" className="secondary" onClick={resetForm}>
                                Hủy sửa
                            </button>
                        )}
                    </div>
                </form>

                <div className="admin-branch-list-card">
                    <div className="admin-branch-list-header">
                        <h3>Danh sách chi nhánh</h3>
                        <span>{branches.length} chi nhánh</span>
                    </div>

                    {loading ? (
                        <div className="admin-branch-empty">Đang tải chi nhánh...</div>
                    ) : branches.length === 0 ? (
                        <div className="admin-branch-empty">Chưa có chi nhánh nào.</div>
                    ) : (
                        <div className="admin-branch-list">
                            {branches.map((branch) => (
                                <div className="admin-branch-item" key={branch._id}>
                                    <div>
                                        <h4>{branch.name}</h4>
                                        <p>Mã: {branch.code}</p>
                                        <p>Địa chỉ: {branch.address || "Chưa có"}</p>
                                        <p>SĐT: {branch.phone || "Chưa có"}</p>
                                    </div>

                                    <div className="admin-branch-side">
                                        <span
                                            className={
                                                branch.isActive
                                                    ? "branch-status active"
                                                    : "branch-status inactive"
                                            }
                                        >
                                            {branch.isActive ? "Đang hoạt động" : "Tạm tắt"}
                                        </span>

                                        <button onClick={() => startEdit(branch)}>Sửa</button>

                                        <button onClick={() => toggleBranch(branch)}>
                                            {branch.isActive ? "Tạm tắt" : "Bật lại"}
                                        </button>

                                        <button
                                            className="danger"
                                            onClick={() => deleteBranch(branch)}
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

export default AdminBranches;