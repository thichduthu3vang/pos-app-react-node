import { useEffect, useState } from "react";
import QRCode from "qrcode";
import api from "../api";
import "./AdminTables.css";

function AdminTables() {
    const adminRole = localStorage.getItem("adminRole");
    const adminBranchCode = localStorage.getItem("adminBranchCode");
    const adminBranchName = localStorage.getItem("adminBranchName");

    const isStaff = adminRole === "staff";
    const staffBranchCode = adminBranchCode ? adminBranchCode.toUpperCase() : "";

    const [branches, setBranches] = useState([]);
    const [tables, setTables] = useState([]);
    const [selectedBranchCode, setSelectedBranchCode] = useState(
        isStaff ? staffBranchCode : ""
    );
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [qrImages, setQrImages] = useState({});
    const [qrLinks, setQrLinks] = useState({});

    const [form, setForm] = useState({
        branchCode: isStaff ? staffBranchCode : "",
        name: "",
        area: "Khu chính",
        status: "available"
    });

    const currentBranchCode = isStaff ? staffBranchCode : selectedBranchCode;

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

    const loadTables = async () => {
        try {
            setLoading(true);

            if (isStaff && !staffBranchCode) {
                alert("Tài khoản nhân viên này chưa được gán chi nhánh");
                setTables([]);
                return;
            }

            const response = await api.get("/api/tables", {
                params: currentBranchCode ? { branchCode: currentBranchCode } : {}
            });

            setTables(response.data.data || []);
        } catch (error) {
            console.error("Cannot load tables:", error);
            alert(error.response?.data?.message || "Không thể tải danh sách bàn");
            setTables([]);
        } finally {
            setLoading(false);
        }
    };

    const selectedBranch = branches.find(
        (branch) => branch.code === currentBranchCode
    );

    const branchLabel = isStaff
        ? `${adminBranchName || selectedBranch?.name || "Chi nhánh"} - ${staffBranchCode}`
        : selectedBranch
            ? `${selectedBranch.name} - ${selectedBranch.code}`
            : "Tất cả chi nhánh";

    const resetFormOnly = () => {
        setEditingId(null);

        setForm({
            branchCode: isStaff ? staffBranchCode : currentBranchCode,
            name: "",
            area: "Khu chính",
            status: "available"
        });
    };

    const changeSelectedBranch = (branchCode) => {
        if (isStaff) return;

        const cleanBranchCode = branchCode || "";

        setSelectedBranchCode(cleanBranchCode);
        setEditingId(null);

        setForm({
            branchCode: cleanBranchCode,
            name: "",
            area: "Khu chính",
            status: "available"
        });
    };

    const handleChange = (field, value) => {
        if (isStaff && field === "branchCode") return;

        setForm({
            ...form,
            [field]: value
        });
    };

    const getTableStatusText = (status) => {
        if (status === "available") return "Trống";
        if (status === "occupied") return "Có khách";
        if (status === "cleaning") return "Chờ dọn";
        if (status === "reserved") return "Đã đặt";
        return status || "Không rõ";
    };

    const getBaseQrUrl = (table) => {
        const publicUrl =
            import.meta.env.VITE_PUBLIC_FRONTEND_URL || window.location.origin;

        const branchCode = table.branchCode || currentBranchCode;

        return `${publicUrl}/qr/${branchCode}/${table._id}`;
    };

    const getQrUrl = (table) => {
        return qrLinks[table._id] || getBaseQrUrl(table);
    };

    const generateQr = async (table) => {
        try {
            const url = getQrUrl(table);

            const qrDataUrl = await QRCode.toDataURL(url, {
                width: 240,
                margin: 2
            });

            setQrImages((prev) => ({
                ...prev,
                [table._id]: qrDataUrl
            }));
        } catch (error) {
            console.error("Cannot generate QR:", error);
            alert("Không thể tạo mã QR");
        }
    };

    const generateAllQrImages = async (tableList) => {
        try {
            const qrMap = {};
            const linkMap = {};

            await Promise.all(
                tableList.map(async (table) => {
                    const url = getBaseQrUrl(table);

                    const qrDataUrl = await QRCode.toDataURL(url, {
                        width: 240,
                        margin: 2
                    });

                    qrMap[table._id] = qrDataUrl;
                    linkMap[table._id] = url;
                })
            );

            setQrImages(qrMap);
            setQrLinks(linkMap);
        } catch (error) {
            console.error("Cannot generate all QR:", error);
        }
    };

    const redrawQr = async (table) => {
        try {
            const newQrUrl = `${getBaseQrUrl(table)}?v=${Date.now()}`;

            setQrImages((prev) => ({
                ...prev,
                [table._id]: ""
            }));

            const qrDataUrl = await QRCode.toDataURL(newQrUrl, {
                width: 240,
                margin: 2
            });

            setQrImages((prev) => ({
                ...prev,
                [table._id]: qrDataUrl
            }));

            setQrLinks((prev) => ({
                ...prev,
                [table._id]: newQrUrl
            }));

            alert("Đã vẽ lại QR");
        } catch (error) {
            console.error("Cannot redraw QR:", error);
            alert("Không thể vẽ lại QR");
        }
    };

    const copyQrUrl = async (table) => {
        try {
            await navigator.clipboard.writeText(getQrUrl(table));
            alert("Đã copy link QR");
        } catch (error) {
            console.error("Cannot copy QR URL:", error);
            alert("Không thể copy link QR");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const branchCode = isStaff ? staffBranchCode : form.branchCode;

        if (!branchCode) {
            alert("Vui lòng chọn chi nhánh cho bàn");
            return;
        }

        if (!form.name) {
            alert("Vui lòng nhập tên bàn");
            return;
        }

        try {
            const payload = {
                branchCode,
                name: form.name,
                area: form.area,
                status: form.status
            };

            if (editingId) {
                await api.patch(`/api/tables/${editingId}`, payload);
                alert("Cập nhật bàn thành công");
            } else {
                await api.post("/api/tables", payload);
                alert("Tạo bàn thành công");
            }

            resetFormOnly();
            loadTables();
        } catch (error) {
            console.error("Cannot save table:", error);
            alert(error.response?.data?.message || "Không thể lưu bàn");
        }
    };

    const startEdit = (table) => {
        setEditingId(table._id);

        setForm({
            branchCode: isStaff ? staffBranchCode : table.branchCode || "",
            name: table.name || "",
            area: table.area || "Khu chính",
            status: table.status || "available"
        });

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    const updateTableStatus = async (table, status) => {
        try {
            await api.patch(`/api/tables/${table._id}/status`, { status });
            loadTables();
        } catch (error) {
            console.error("Cannot update table status:", error);
            alert(error.response?.data?.message || "Không thể đổi trạng thái bàn");
        }
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
        } catch (error) {
            console.error("Cannot delete table:", error);
            alert(error.response?.data?.message || "Không thể xóa bàn");
        }
    };

    useEffect(() => {
        loadBranches();
    }, []);

    useEffect(() => {
        loadTables();
        resetFormOnly();
    }, [currentBranchCode]);

    useEffect(() => {
        if (tables.length === 0) {
            setQrImages({});
            setQrLinks({});
            return;
        }

        generateAllQrImages(tables);
    }, [tables, currentBranchCode]);

    return (
        <section className="admin-tables-page">
            <div className="admin-tables-hero">
                <div>
                    <h2>Admin - Quản lý bàn</h2>
                    <p>
                        Tạo bàn, quản lý trạng thái bàn và tạo mã QR order theo từng chi nhánh.
                    </p>
                </div>

                <button onClick={loadTables}>Làm mới</button>
            </div>

            <div className="admin-tables-layout">
                <form className="admin-table-form" onSubmit={handleSubmit}>
                    <h3>{editingId ? "Sửa bàn" : "Tạo bàn mới"}</h3>

                    <label>
                        Chi nhánh
                        {isStaff ? (
                            <input value={branchLabel} disabled />
                        ) : (
                            <select
                                value={form.branchCode}
                                onChange={(e) => changeSelectedBranch(e.target.value)}
                            >
                                <option value="">Chọn chi nhánh</option>

                                {branches.map((branch) => (
                                    <option key={branch._id} value={branch.code}>
                                        {branch.name} - {branch.code}
                                    </option>
                                ))}
                            </select>
                        )}
                    </label>

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
                            placeholder="Ví dụ: Tầng 1, Sân vườn"
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
                            {editingId ? "Lưu cập nhật" : "Tạo bàn"}
                        </button>

                        {editingId && (
                            <button type="button" className="secondary" onClick={resetFormOnly}>
                                Hủy sửa
                            </button>
                        )}
                    </div>
                </form>

                <div className="admin-table-main">
                    <div className="admin-table-filter-card">
                        <label>
                            Đang xem chi nhánh
                            {isStaff ? (
                                <input value={branchLabel} disabled />
                            ) : (
                                <select
                                    value={selectedBranchCode}
                                    onChange={(e) => changeSelectedBranch(e.target.value)}
                                >
                                    <option value="">Tất cả chi nhánh</option>

                                    {branches.map((branch) => (
                                        <option key={branch._id} value={branch.code}>
                                            {branch.name} - {branch.code}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </label>
                    </div>

                    <div className="admin-table-branch-card">
                        <h3>Danh sách bàn - {branchLabel}</h3>
                        <p>Đang có {tables.length} bàn.</p>
                    </div>

                    {loading ? (
                        <div className="admin-table-empty">Đang tải danh sách bàn...</div>
                    ) : tables.length === 0 ? (
                        <div className="admin-table-empty">
                            Chưa có bàn nào trong chi nhánh này.
                        </div>
                    ) : (
                        <div className="admin-table-grid">
                            {tables.map((table) => (
                                <article className="admin-table-card" key={table._id}>
                                    <div className="admin-table-card-head">
                                        <div>
                                            <h3>{table.name}</h3>
                                            <p>{table.area || "Khu chính"}</p>
                                            <p>{table.branchName || table.branchCode}</p>
                                        </div>

                                        <span className={`admin-table-status ${table.status}`}>
                                            {getTableStatusText(table.status)}
                                        </span>
                                    </div>

                                    <div className="admin-table-status-actions">
                                        <button onClick={() => updateTableStatus(table, "available")}>
                                            Trống
                                        </button>

                                        <button onClick={() => updateTableStatus(table, "cleaning")}>
                                            Chờ dọn
                                        </button>

                                        <button onClick={() => updateTableStatus(table, "reserved")}>
                                            Đặt trước
                                        </button>

                                        <button onClick={() => updateTableStatus(table, "occupied")}>
                                            Có khách
                                        </button>
                                    </div>

                                    <div className="admin-table-edit-actions">
                                        <button onClick={() => startEdit(table)}>Sửa</button>

                                        <button className="danger" onClick={() => deleteTable(table)}>
                                            Xóa
                                        </button>
                                    </div>

                                    <div className="admin-table-qr-section">
                                        <div className="admin-table-qr-actions">
                                            <button className="gold" onClick={() => redrawQr(table)}>
                                                Đổi QR
                                            </button>

                                            <button onClick={() => copyQrUrl(table)}>
                                                Copy link QR
                                            </button>
                                        </div>

                                        <div className="admin-table-qr-box">
                                            {qrImages[table._id] ? (
                                                <>
                                                    <img
                                                        src={qrImages[table._id]}
                                                        alt={`QR ${table.name}`}
                                                    />

                                                    <p>{getQrUrl(table)}</p>
                                                </>
                                            ) : (
                                                <strong>Đang tạo QR...</strong>
                                            )}
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

export default AdminTables;