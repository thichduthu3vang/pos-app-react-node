import { useEffect, useState } from "react";
import QRCode from "qrcode";
import api from "../api";

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

    const getTableStatusColor = (status) => {
        if (status === "available") return "#ddf7e8";
        if (status === "occupied") return "#fff1d6";
        if (status === "cleaning") return "#e8efff";
        if (status === "reserved") return "#ffe6e3";
        return "var(--soft)";
    };

    const getQrUrl = (table) => {
        const publicUrl =
            import.meta.env.VITE_PUBLIC_FRONTEND_URL || window.location.origin;

        const branchCode = table.branchCode || currentBranchCode;

        return `${publicUrl}/qr/${branchCode}/${table._id}`;
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

            await Promise.all(
                tableList.map(async (table) => {
                    const url = getQrUrl(table);

                    const qrDataUrl = await QRCode.toDataURL(url, {
                        width: 240,
                        margin: 2
                    });

                    qrMap[table._id] = qrDataUrl;
                })
            );

            setQrImages(qrMap);
        } catch (error) {
            console.error("Cannot generate all QR:", error);
        }
    };

    const redrawQr = async (table) => {
        try {
            setQrImages((prev) => ({
                ...prev,
                [table._id]: ""
            }));

            await generateQr(table);

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
            return;
        }

        generateAllQrImages(tables);
    }, [tables, currentBranchCode]);

    return (
        <section style={{ minHeight: "100vh" }}>
            <div
                style={{
                    background: "white",
                    border: "1px solid var(--border)",
                    borderRadius: 24,
                    padding: 22,
                    marginBottom: 24,
                    boxShadow: "0 14px 35px rgba(80, 52, 27, 0.08)"
                }}
            >
                <h2 style={{ margin: 0, fontSize: 32 }}>Admin - Quản lý bàn</h2>
                <p style={{ margin: "8px 0 0", color: "var(--muted)" }}>
                    Tạo bàn, quản lý trạng thái bàn và tạo mã QR order theo từng chi nhánh.
                </p>
            </div>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "380px 1fr",
                    gap: 24,
                    alignItems: "start"
                }}
            >
                <form
                    onSubmit={handleSubmit}
                    style={{
                        background: "white",
                        border: "1px solid var(--border)",
                        borderRadius: 24,
                        padding: 20,
                        boxShadow: "0 14px 35px rgba(80, 52, 27, 0.08)",
                        position: "sticky",
                        top: 24
                    }}
                >
                    <h3 style={{ margin: "0 0 18px", fontSize: 24 }}>
                        {editingId ? "Sửa bàn" : "Tạo bàn mới"}
                    </h3>

                    <label style={labelStyle}>
                        Chi nhánh
                        {isStaff ? (
                            <input
                                value={branchLabel}
                                disabled
                                style={{
                                    ...inputStyle,
                                    opacity: 0.8,
                                    cursor: "not-allowed"
                                }}
                            />
                        ) : (
                            <select
                                value={form.branchCode}
                                onChange={(e) => {
                                    changeSelectedBranch(e.target.value);
                                }}
                                style={inputStyle}
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

                    <label style={labelStyle}>
                        Tên bàn
                        <input
                            value={form.name}
                            onChange={(e) => handleChange("name", e.target.value)}
                            placeholder="Ví dụ: Bàn 1"
                            style={inputStyle}
                        />
                    </label>

                    <label style={labelStyle}>
                        Khu vực
                        <input
                            value={form.area}
                            onChange={(e) => handleChange("area", e.target.value)}
                            placeholder="Ví dụ: Tầng 1, Sân vườn"
                            style={inputStyle}
                        />
                    </label>

                    <label style={labelStyle}>
                        Trạng thái
                        <select
                            value={form.status}
                            onChange={(e) => handleChange("status", e.target.value)}
                            style={inputStyle}
                        >
                            <option value="available">Trống</option>
                            <option value="occupied">Có khách</option>
                            <option value="cleaning">Chờ dọn</option>
                            <option value="reserved">Đã đặt</option>
                        </select>
                    </label>

                    <div style={{ display: "grid", gap: 10 }}>
                        <button
                            type="submit"
                            style={{
                                background: "var(--green)",
                                color: "white",
                                padding: 13,
                                borderRadius: 14,
                                fontWeight: 900
                            }}
                        >
                            {editingId ? "Lưu cập nhật" : "Tạo bàn"}
                        </button>

                        {editingId && (
                            <button
                                type="button"
                                onClick={resetFormOnly}
                                style={{
                                    background: "#21170f",
                                    color: "white",
                                    padding: 13,
                                    borderRadius: 14,
                                    fontWeight: 900
                                }}
                            >
                                Hủy sửa
                            </button>
                        )}
                    </div>
                </form>

                <div>
                    <div
                        style={{
                            background: "white",
                            border: "1px solid var(--border)",
                            borderRadius: 24,
                            padding: 20,
                            marginBottom: 18,
                            display: "grid",
                            gridTemplateColumns: "1fr auto",
                            gap: 16,
                            alignItems: "end",
                            boxShadow: "0 14px 35px rgba(80, 52, 27, 0.08)"
                        }}
                    >
                        <label style={labelStyle}>
                            Đang xem chi nhánh
                            {isStaff ? (
                                <input
                                    value={branchLabel}
                                    disabled
                                    style={{
                                        ...inputStyle,
                                        opacity: 0.8,
                                        cursor: "not-allowed"
                                    }}
                                />
                            ) : (
                                <select
                                    value={selectedBranchCode}
                                    onChange={(e) => changeSelectedBranch(e.target.value)}
                                    style={inputStyle}
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

                        <button
                            onClick={loadTables}
                            style={{
                                background: "var(--primary)",
                                color: "white",
                                padding: 13,
                                borderRadius: 14,
                                fontWeight: 900
                            }}
                        >
                            Làm mới
                        </button>
                    </div>

                    <div
                        style={{
                            background: "white",
                            border: "1px solid var(--border)",
                            borderRadius: 24,
                            padding: 20,
                            marginBottom: 18,
                            boxShadow: "0 14px 35px rgba(80, 52, 27, 0.08)"
                        }}
                    >
                        <h3 style={{ margin: "0 0 6px", fontSize: 22 }}>
                            Danh sách bàn - {branchLabel}
                        </h3>
                        <p style={{ margin: 0, color: "var(--muted)" }}>
                            Đang có {tables.length} bàn.
                        </p>
                    </div>

                    {loading ? (
                        <div style={emptyStyle}>Đang tải danh sách bàn...</div>
                    ) : tables.length === 0 ? (
                        <div style={emptyStyle}>
                            Chưa có bàn nào trong chi nhánh này.
                        </div>
                    ) : (
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                                gap: 16
                            }}
                        >
                            {tables.map((table) => (
                                <article
                                    key={table._id}
                                    style={{
                                        background: "white",
                                        border: "1px solid var(--border)",
                                        borderRadius: 22,
                                        padding: 18,
                                        boxShadow: "0 14px 35px rgba(80, 52, 27, 0.08)"
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            gap: 12,
                                            alignItems: "flex-start",
                                            marginBottom: 12
                                        }}
                                    >
                                        <div>
                                            <h3 style={{ margin: "0 0 6px", fontSize: 24 }}>
                                                {table.name}
                                            </h3>

                                            <p style={{ margin: "4px 0", color: "var(--muted)" }}>
                                                {table.area || "Khu chính"}
                                            </p>

                                            <p style={{ margin: "4px 0", color: "var(--muted)" }}>
                                                {table.branchName || table.branchCode}
                                            </p>
                                        </div>

                                        <span
                                            style={{
                                                background: getTableStatusColor(table.status),
                                                padding: "8px 11px",
                                                borderRadius: 999,
                                                fontSize: 12,
                                                fontWeight: 900
                                            }}
                                        >
                                            {getTableStatusText(table.status)}
                                        </span>
                                    </div>

                                    <div
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: "repeat(2, 1fr)",
                                            gap: 8,
                                            marginBottom: 12
                                        }}
                                    >
                                        <button
                                            onClick={() => updateTableStatus(table, "available")}
                                            style={smallButtonStyle}
                                        >
                                            Trống
                                        </button>

                                        <button
                                            onClick={() => updateTableStatus(table, "cleaning")}
                                            style={smallButtonStyle}
                                        >
                                            Chờ dọn
                                        </button>

                                        <button
                                            onClick={() => updateTableStatus(table, "reserved")}
                                            style={smallButtonStyle}
                                        >
                                            Đặt trước
                                        </button>

                                        <button
                                            onClick={() => updateTableStatus(table, "occupied")}
                                            style={smallButtonStyle}
                                        >
                                            Có khách
                                        </button>
                                    </div>

                                    <div
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: "repeat(2, 1fr)",
                                            gap: 8,
                                            marginBottom: 12
                                        }}
                                    >
                                        <button
                                            onClick={() => startEdit(table)}
                                            style={darkButtonStyle}
                                        >
                                            Sửa
                                        </button>

                                        <button
                                            onClick={() => deleteTable(table)}
                                            style={dangerButtonStyle}
                                        >
                                            Xóa
                                        </button>
                                    </div>

                                    <div
                                        style={{
                                            borderTop: "1px solid var(--border)",
                                            paddingTop: 12,
                                            display: "grid",
                                            gap: 8
                                        }}
                                    >
                                        <button
                                            onClick={() => redrawQr(table)}
                                            style={greenButtonStyle}
                                        >
                                            Đổi QR
                                        </button>

                                        <button
                                            onClick={() => copyQrUrl(table)}
                                            style={darkButtonStyle}
                                        >
                                            Copy link QR
                                        </button>

                                        <div
                                            style={{
                                                background: "var(--soft)",
                                                border: "1px solid var(--border)",
                                                borderRadius: 18,
                                                padding: 14,
                                                textAlign: "center"
                                            }}
                                        >
                                            {qrImages[table._id] ? (
                                                <>
                                                    <img
                                                        src={qrImages[table._id]}
                                                        alt={`QR ${table.name}`}
                                                        style={{
                                                            width: 180,
                                                            maxWidth: "100%",
                                                            borderRadius: 12,
                                                            background: "white",
                                                            padding: 8
                                                        }}
                                                    />

                                                    <p
                                                        style={{
                                                            margin: "10px 0 0",
                                                            color: "var(--muted)",
                                                            fontSize: 12,
                                                            wordBreak: "break-all"
                                                        }}
                                                    >
                                                        {getQrUrl(table)}
                                                    </p>
                                                </>
                                            ) : (
                                                <p
                                                    style={{
                                                        margin: 0,
                                                        color: "var(--muted)",
                                                        fontWeight: 800
                                                    }}
                                                >
                                                    Đang tạo QR...
                                                </p>
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

const labelStyle = {
    display: "grid",
    gap: 7,
    fontWeight: 800,
    marginBottom: 14
};

const inputStyle = {
    border: "1px solid var(--border)",
    background: "var(--soft)",
    padding: 12,
    borderRadius: 14,
    fontWeight: 800,
    width: "100%"
};

const emptyStyle = {
    background: "white",
    border: "1px dashed var(--border)",
    borderRadius: 24,
    padding: 40,
    textAlign: "center",
    color: "var(--muted)",
    fontWeight: 900
};

const smallButtonStyle = {
    background: "var(--soft)",
    border: "1px solid var(--border)",
    color: "var(--text)",
    padding: 10,
    borderRadius: 12,
    fontWeight: 900
};

const darkButtonStyle = {
    background: "#21170f",
    color: "white",
    padding: 11,
    borderRadius: 12,
    fontWeight: 900
};

const greenButtonStyle = {
    background: "var(--green)",
    color: "white",
    padding: 11,
    borderRadius: 12,
    fontWeight: 900
};

const dangerButtonStyle = {
    background: "var(--red)",
    color: "white",
    padding: 11,
    borderRadius: 12,
    fontWeight: 900
};

export default AdminTables;