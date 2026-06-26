import { useEffect, useState } from "react";
import api from "../api";
import "./AdminUsers.css";

function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [branches, setBranches] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);

    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        role: "staff",
        branchCode: "",
        isActive: true
    });

    const loadUsers = async () => {
        try {
            setLoading(true);

            const response = await api.get("/api/admin-users");

            setUsers(response.data.data || []);
        } catch (error) {
            console.error("Cannot load admin users:", error);
            alert("Không thể tải danh sách tài khoản");
        } finally {
            setLoading(false);
        }
    };

    const loadBranches = async () => {
        try {
            const response = await api.get("/api/branches");

            const activeBranches = (response.data.data || []).filter(
                (branch) => branch.isActive
            );

            setBranches(activeBranches);
        } catch (error) {
            console.error("Cannot load branches:", error);
            setBranches([]);
        }
    };

    useEffect(() => {
        loadBranches();
        loadUsers();
    }, []);

    const resetForm = () => {
        setEditingId(null);

        setForm({
            name: "",
            email: "",
            password: "",
            role: "staff",
            branchCode: "",
            isActive: true
        });
    };

    const handleChange = (field, value) => {
        let newForm = {
            ...form,
            [field]: value
        };

        if (field === "role" && value === "owner") {
            newForm.branchCode = "";
        }

        setForm(newForm);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.email) {
            alert("Vui lòng nhập email");
            return;
        }

        if (!editingId && !form.password) {
            alert("Vui lòng nhập mật khẩu");
            return;
        }

        if (form.role === "staff" && !form.branchCode) {
            alert("Vui lòng chọn chi nhánh cho nhân viên");
            return;
        }

        try {
            const payload = {
                name: form.name,
                email: form.email,
                password: form.password,
                role: form.role,
                branchCode: form.role === "staff" ? form.branchCode : "",
                isActive: form.isActive
            };

            if (editingId && !form.password) {
                delete payload.password;
            }

            if (editingId) {
                await api.patch(`/api/admin-users/${editingId}`, payload);
                alert("Cập nhật tài khoản thành công");
            } else {
                await api.post("/api/admin-users", payload);
                alert("Tạo tài khoản thành công");
            }

            resetForm();
            loadUsers();
        } catch (error) {
            console.error("Cannot save admin user:", error);
            alert(error.response?.data?.message || "Không thể lưu tài khoản");
        }
    };

    const startEdit = (user) => {
        setEditingId(user._id);

        setForm({
            name: user.name || "",
            email: user.email || "",
            password: "",
            role: user.role || "staff",
            branchCode: user.branchCode || "",
            isActive: user.isActive
        });

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    const toggleUser = async (user) => {
        try {
            await api.patch(`/api/admin-users/${user._id}/toggle`);
            loadUsers();
        } catch (error) {
            console.error("Cannot toggle user:", error);
            alert("Không thể đổi trạng thái tài khoản");
        }
    };

    const deleteUser = async (user) => {
        const confirmed = window.confirm(
            `Bạn có chắc muốn xóa tài khoản "${user.email}" không?`
        );

        if (!confirmed) return;

        try {
            await api.delete(`/api/admin-users/${user._id}`);
            alert("Xóa tài khoản thành công");
            loadUsers();
        } catch (error) {
            console.error("Cannot delete user:", error);
            alert("Không thể xóa tài khoản");
        }
    };

    const getRoleText = (role) => {
        if (role === "owner") return "Chủ cửa hàng";
        if (role === "staff") return "Nhân viên";
        return role;
    };

    return (
        <section className="admin-users-page">
            <div className="admin-users-header">
                <div>
                    <h2>Admin - Tài khoản nhân viên</h2>
                    <p>Tạo tài khoản Owner hoặc nhân viên theo từng chi nhánh.</p>
                </div>

                <button onClick={loadUsers}>Làm mới</button>
            </div>

            <div className="admin-users-layout">
                <form className="admin-user-form" onSubmit={handleSubmit}>
                    <h3>{editingId ? "Sửa tài khoản" : "Tạo tài khoản mới"}</h3>

                    <label>
                        Tên nhân viên
                        <input
                            value={form.name}
                            onChange={(e) => handleChange("name", e.target.value)}
                            placeholder="Ví dụ: Nhân viên Hội An"
                        />
                    </label>

                    <label>
                        Email đăng nhập
                        <input
                            value={form.email}
                            onChange={(e) => handleChange("email", e.target.value)}
                            placeholder="staff-ha01@pos.com"
                        />
                    </label>

                    <label>
                        Mật khẩu
                        <input
                            type="password"
                            value={form.password}
                            onChange={(e) => handleChange("password", e.target.value)}
                            placeholder={
                                editingId
                                    ? "Để trống nếu không đổi mật khẩu"
                                    : "Nhập mật khẩu"
                            }
                        />
                    </label>

                    <label>
                        Vai trò
                        <select
                            value={form.role}
                            onChange={(e) => handleChange("role", e.target.value)}
                        >
                            <option value="staff">Nhân viên chi nhánh</option>
                            <option value="owner">Chủ cửa hàng</option>
                        </select>
                    </label>

                    {form.role === "staff" && (
                        <label>
                            Chi nhánh
                            <select
                                value={form.branchCode}
                                onChange={(e) => handleChange("branchCode", e.target.value)}
                            >
                                <option value="">Chọn chi nhánh</option>

                                {branches.map((branch) => (
                                    <option key={branch._id} value={branch.code}>
                                        {branch.name} - {branch.code}
                                    </option>
                                ))}
                            </select>
                        </label>
                    )}

                    <label className="admin-user-checkbox">
                        <input
                            type="checkbox"
                            checked={form.isActive}
                            onChange={(e) => handleChange("isActive", e.target.checked)}
                        />
                        Đang hoạt động
                    </label>

                    <div className="admin-user-form-actions">
                        <button type="submit">
                            {editingId ? "Lưu cập nhật" : "Tạo tài khoản"}
                        </button>

                        {editingId && (
                            <button type="button" className="secondary" onClick={resetForm}>
                                Hủy sửa
                            </button>
                        )}
                    </div>
                </form>

                <div className="admin-user-list-card">
                    <div className="admin-user-list-header">
                        <h3>Danh sách tài khoản</h3>
                        <span>{users.length} tài khoản</span>
                    </div>

                    {loading ? (
                        <div className="admin-user-empty">Đang tải tài khoản...</div>
                    ) : users.length === 0 ? (
                        <div className="admin-user-empty">Chưa có tài khoản nào.</div>
                    ) : (
                        <div className="admin-user-list">
                            {users.map((user) => (
                                <div className="admin-user-item" key={user._id}>
                                    <div>
                                        <h4>{user.name || "Chưa đặt tên"}</h4>

                                        <p>Email: {user.email}</p>

                                        <p>
                                            Vai trò: <strong>{getRoleText(user.role)}</strong>
                                        </p>

                                        <p>
                                            Chi nhánh:{" "}
                                            <strong>
                                                {user.role === "owner"
                                                    ? "Tất cả chi nhánh"
                                                    : user.branchName || user.branchCode || "Chưa gán"}
                                            </strong>
                                        </p>
                                    </div>

                                    <div className="admin-user-side">
                                        <span
                                            className={
                                                user.isActive
                                                    ? "admin-user-status active"
                                                    : "admin-user-status inactive"
                                            }
                                        >
                                            {user.isActive ? "Đang hoạt động" : "Tạm tắt"}
                                        </span>

                                        <button onClick={() => startEdit(user)}>Sửa</button>

                                        <button onClick={() => toggleUser(user)}>
                                            {user.isActive ? "Tạm tắt" : "Bật lại"}
                                        </button>

                                        <button
                                            className="danger"
                                            onClick={() => deleteUser(user)}
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

export default AdminUsers;