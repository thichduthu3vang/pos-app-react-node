import { useEffect, useMemo, useState } from "react";
import api from "../api";
import "./AdminBranches.css";

function AdminBranches() {
    const [branches, setBranches] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);

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
            alert(error.response?.data?.message || "Không thể tải danh sách chi nhánh");
            setBranches([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBranches();
    }, []);

    const summary = useMemo(() => {
        const activeBranches = branches.filter((branch) => branch.isActive);
        const inactiveBranches = branches.filter((branch) => !branch.isActive);

        return {
            total: branches.length,
            active: activeBranches.length,
            inactive: inactiveBranches.length
        };
    }, [branches]);

    const resetForm = () => {
        setEditingId(null);

        setForm({
            name: "",
            code: "",
            address: "",
            phone: "",
            isActive: true
        });
    };

    const handleChange = (field, value) => {
        if (field === "code") {
            setForm({
                ...form,
                code: value.toUpperCase().replace(/\s/g, "")
            });
            return;
        }

        setForm({
            ...form,
            [field]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.name.trim()) {
            alert("Vui lòng nhập tên chi nhánh");
            return;
        }

        if (!form.code.trim()) {
            alert("Vui lòng nhập mã chi nhánh");
            return;
        }

        try {
            const payload = {
                name: form.name.trim(),
                code: form.code.trim().toUpperCase(),
                address: form.address.trim(),
                phone: form.phone.trim(),
                isActive: form.isActive
            };

            if (editingId) {
                await api.patch(`/api/branches/${editingId}`, payload);
                alert("Cập nhật chi nhánh thành công");
            } else {
                await api.post("/api/branches", payload);
                alert("Tạo chi nhánh thành công");
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
            isActive: branch.isActive !== false
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
            alert(error.response?.data?.message || "Không thể đổi trạng thái chi nhánh");
        }
    };

    const deleteBranch = async (branch) => {
        const confirmed = window.confirm(
            `Bạn có chắc muốn xóa chi nhánh "${branch.name}" không?\n\nNếu chi nhánh đã có bàn hoặc đơn hàng, bạn nên tạm tắt thay vì xóa.`
        );

        if (!confirmed) return;

        try {
            await api.delete(`/api/branches/${branch._id}`);

            alert("Xóa chi nhánh thành công");
            loadBranches();
        } catch (error) {
            console.error("Cannot delete branch:", error);
            alert(error.response?.data?.message || "Không thể xóa chi nhánh");
        }
    };

    return (
        <section className="admin-branches-page">
            <div className="admin-branches-hero">
                <div>
                    <h2>Admin - Quản lý chi nhánh</h2>
                    <p>
                        Tạo chi nhánh, cập nhật thông tin và bật/tắt trạng thái hoạt động.
                    </p>
                </div>

                <button onClick={loadBranches}>Làm mới</button>
            </div>

            <div className="admin-branches-stats">
                <div className="admin-branch-stat revenue">
                    <span>Tổng chi nhánh</span>
                    <strong>{summary.total}</strong>
                </div>

                <div className="admin-branch-stat">
                    <span>Đang hoạt động</span>
                    <strong>{summary.active}</strong>
                </div>

                <div className="admin-branch-stat cancelled">
                    <span>Tạm tắt</span>
                    <strong>{summary.inactive}</strong>
                </div>
            </div>

            <div className="admin-branches-layout">
                <form className="admin-branch-form" onSubmit={handleSubmit}>
                    <h3>{editingId ? "Sửa chi nhánh" : "Tạo chi nhánh mới"}</h3>

                    <label>
                        Tên chi nhánh
                        <input
                            value={form.name}
                            onChange={(e) => handleChange("name", e.target.value)}
                            placeholder="Ví dụ: Lux Annam Hội An"
                        />
                    </label>

                    <label>
                        Mã chi nhánh
                        <input
                            value={form.code}
                            onChange={(e) => handleChange("code", e.target.value)}
                            placeholder="Ví dụ: HA01"
                        />
                    </label>

                    <label>
                        Địa chỉ
                        <input
                            value={form.address}
                            onChange={(e) => handleChange("address", e.target.value)}
                            placeholder="Ví dụ: Hội An, Quảng Nam"
                        />
                    </label>

                    <label>
                        Số điện thoại
                        <input
                            value={form.phone}
                            onChange={(e) => handleChange("phone", e.target.value)}
                            placeholder="Ví dụ: 0918588811"
                        />
                    </label>

                    <label className="admin-branch-checkbox">
                        <input
                            type="checkbox"
                            checked={form.isActive}
                            onChange={(e) => handleChange("isActive", e.target.checked)}
                        />
                        Chi nhánh đang hoạt động
                    </label>

                    <div className="admin-branch-form-actions">
                        <button type="submit">
                            {editingId ? "Lưu cập nhật" : "Tạo chi nhánh"}
                        </button>

                        {editingId && (
                            <button type="button" className="secondary" onClick={resetForm}>
                                Hủy sửa
                            </button>
                        )}
                    </div>
                </form>

                <div className="admin-branch-main">
                    <div className="admin-branch-list-card">
                        <div className="admin-branch-list-header">
                            <div>
                                <h3>Danh sách chi nhánh</h3>
                                <p>Đang có {branches.length} chi nhánh trong hệ thống.</p>
                            </div>
                        </div>

                        {loading ? (
                            <div className="admin-branch-empty">
                                Đang tải danh sách chi nhánh...
                            </div>
                        ) : branches.length === 0 ? (
                            <div className="admin-branch-empty">
                                Chưa có chi nhánh nào. Hãy tạo chi nhánh đầu tiên.
                            </div>
                        ) : (
                            <div className="admin-branch-list">
                                {branches.map((branch) => (
                                    <article className="admin-branch-item" key={branch._id}>
                                        <div className="admin-branch-info">
                                            <span className="admin-branch-code">{branch.code}</span>

                                            <h4>{branch.name}</h4>

                                            <p>
                                                <strong>Địa chỉ:</strong>{" "}
                                                {branch.address || "Chưa có địa chỉ"}
                                            </p>

                                            <p>
                                                <strong>Điện thoại:</strong>{" "}
                                                {branch.phone || "Chưa có số điện thoại"}
                                            </p>

                                            <p>
                                                <strong>Ngày tạo:</strong>{" "}
                                                {branch.createdAt
                                                    ? new Date(branch.createdAt).toLocaleString("vi-VN")
                                                    : "Không rõ"}
                                            </p>
                                        </div>

                                        <div className="admin-branch-side">
                                            <span
                                                className={`admin-branch-status ${branch.isActive ? "active" : "inactive"
                                                    }`}
                                            >
                                                {branch.isActive ? "Đang hoạt động" : "Tạm tắt"}
                                            </span>

                                            <button onClick={() => startEdit(branch)}>Sửa</button>

                                            <button
                                                className={branch.isActive ? "warning" : "success"}
                                                onClick={() => toggleBranch(branch)}
                                            >
                                                {branch.isActive ? "Tạm tắt" : "Bật lại"}
                                            </button>

                                            <button
                                                className="danger"
                                                onClick={() => deleteBranch(branch)}
                                            >
                                                Xóa
                                            </button>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}

export default AdminBranches;