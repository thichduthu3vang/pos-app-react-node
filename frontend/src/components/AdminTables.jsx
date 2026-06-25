import { useEffect, useState } from "react";
import QRCode from "qrcode";
import api from "../api";
import "./AdminTables.css";

function AdminTables({ onTablesChanged }) {
    const [branches, setBranches] = useState([]);
    const [selectedBranchCode, setSelectedBranchCode] = useState("");
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [qrModal, setQrModal] = useState(null);

    const [form, setForm] = useState({
        branchCode: "",
        name: "",
        area: "Khu chính",
        status: "available"
    });

    const loadBranches = async () => {
        try {
            const response = await api.get("/api/branches");
            const activeBranches = (response.data.data || []).filter(
                (branch) => branch.isActive
            );

            setBranches(activeBranches);

            if (activeBranches.length > 0 && !selectedBranchCode) {
                const firstBranchCode = activeBranches[0].code;

                setSelectedBranchCode(firstBranchCode);
                setForm((currentForm) => ({
                    ...currentForm,
                    branchCode: firstBranchCode
                }));
            }
        } catch (error) {
            console.error("Cannot load branches:", error);
            alert("Không thể tải danh sách chi nhánh");
        }
    };

    const loadTables = async (branchCode = selectedBranchCode) => {
        try {
            setLoading(true);

            const response = await api.get("/api/tables", {
                params: branchCode ? { branchCode } : {}
            });

            setTables(response.data.data || []);
        } catch (error) {
            console.error("Cannot load tables:", error);
            alert("Không thể tải danh sách bàn");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBranches();
    }, []);

    useEffect(() => {
        if (selectedBranchCode) {
            loadTables(selectedBranchCode);
        }
    }, [selectedBranchCode]);

    const resetForm = () => {
        setForm({
            branchCode: selectedBranchCode || "",
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

    const changeSelectedBranch = (branchCode) => {
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

    const getStatusText = (status) => {
        if (status === "available") return "Trống";
        if (status === "occupied") return "Có khách";
        if (status === "cleaning") return "Chờ dọn";
        if (status === "reserved") return "Đã đặt";
        return status;
    };

    const getOrderLink = (table) => {
        const publicUrl =
            import.meta.env.VITE_PUBLIC_FRONTEND_URL || window.location.origin;

        const branchCode = table.branchCode || selectedBranchCode;

        return `${publicUrl}/qr/${branchCode}/${table._id}`;
    };

    const copyOrderLink = async (table) => {
        const link = getOrderLink(table);

        try {
            await navigator.clipboard.writeText(link);
            alert(`Đã copy link QR order của ${table.name}`);
        } catch (error) {
            console.error("Cannot copy link:", error);
            alert(link);
        }
    };

    const openQrModal = async (table) => {
        try {
            const link = getOrderLink(table);

            const qrDataUrl = await QRCode.toDataURL(link, {
                width: 320,
                margin: 2
            });

            setQrModal({
                table,
                link,
                qrDataUrl
            });
        } catch (error) {
            console.error("Cannot create QR:", error);
            alert("Không thể tạo QR cho bàn này");
        }
    };

    const printQr = () => {
        if (!qrModal) return;

        const printHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>QR Order - ${qrModal.table.name}</title>
          <style>
            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              padding: 24px;
              font-family: Arial, sans-serif;
              background: white;
              color: #111;
            }

            .qr-print-card {
              width: 360px;
              margin: 0 auto;
              border: 2px solid #111;
              border-radius: 20px;
              padding: 22px;
              text-align: center;
            }

            h1 {
              margin: 0 0 8px;
              font-size: 28px;
            }

            h2 {
              margin: 0 0 8px;
              font-size: 22px;
            }

            h3 {
              margin: 0 0 18px;
              font-size: 16px;
              color: #555;
            }

            img {
              width: 260px;
              height: 260px;
              display: block;
              margin: 0 auto 16px;
            }

            p {
              margin: 6px 0;
              font-size: 14px;
            }

            .small {
              font-size: 12px;
              word-break: break-all;
              color: #555;
            }

            @media print {
              body {
                padding: 0;
              }

              .qr-print-card {
                border: 2px solid #111;
                margin: 0 auto;
              }
            }
          </style>
        </head>

        <body>
          <div class="qr-print-card">
            <h1>POS Coffee</h1>
            <h2>${qrModal.table.name}</h2>
            <h3>${qrModal.table.branchName || qrModal.table.branchCode || ""}</h3>

            <img src="${qrModal.qrDataUrl}" alt="QR Order" />

            <p><strong>Quét QR để gọi món tại bàn</strong></p>
            <p>Khu vực: ${qrModal.table.area || "Khu chính"}</p>
            <p class="small">${qrModal.link}</p>
          </div>

          <script>
            window.onload = function () {
              setTimeout(function () {
                window.print();
              }, 300);
            };
          </script>
        </body>
      </html>
    `;

        const printWindow = window.open("", "_blank", "width=430,height=650");

        if (!printWindow) {
            alert("Trình duyệt đang chặn cửa sổ in. Hãy cho phép pop-up rồi thử lại.");
            return;
        }

        printWindow.document.open();
        printWindow.document.write(printHtml);
        printWindow.document.close();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.branchCode) {
            alert("Vui lòng chọn chi nhánh");
            return;
        }

        if (!form.name) {
            alert("Vui lòng nhập tên bàn");
            return;
        }

        const payload = {
            branchCode: form.branchCode,
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
            loadTables(selectedBranchCode);

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
            branchCode: table.branchCode || selectedBranchCode || "",
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

            loadTables(selectedBranchCode);

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

            loadTables(selectedBranchCode);

            if (onTablesChanged) {
                onTablesChanged();
            }
        } catch (error) {
            console.error("Cannot update table status:", error);
            alert(error.response?.data?.message || "Không thể đổi trạng thái bàn");
        }
    };

    const selectedBranch = branches.find(
        (branch) => branch.code === selectedBranchCode
    );

    return (
        <section className="admin-tables-page">
            <div className="admin-tables-header">
                <div>
                    <h2>Admin - Quản lý bàn</h2>
                    <p>Tạo bàn theo từng chi nhánh, tạo QR order riêng cho từng bàn.</p>
                </div>

                <button
                    className="admin-tables-refresh"
                    onClick={() => loadTables(selectedBranchCode)}
                >
                    Làm mới
                </button>
            </div>

            {branches.length === 0 ? (
                <div className="admin-table-empty">
                    Chưa có chi nhánh hoạt động. Hãy vào Admin chi nhánh để tạo chi nhánh
                    trước.
                </div>
            ) : (
                <>
                    <div className="admin-branch-filter-card">
                        <div>
                            <h3>Chi nhánh đang quản lý</h3>
                            <p>
                                {selectedBranch
                                    ? `${selectedBranch.name} - ${selectedBranch.code}`
                                    : "Chưa chọn chi nhánh"}
                            </p>
                        </div>

                        <select
                            value={selectedBranchCode}
                            onChange={(e) => changeSelectedBranch(e.target.value)}
                        >
                            {branches.map((branch) => (
                                <option key={branch._id} value={branch.code}>
                                    {branch.name} - {branch.code}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="admin-tables-layout">
                        <form className="admin-table-form" onSubmit={handleSubmit}>
                            <h3>{editingId ? "Sửa bàn" : "Thêm bàn mới"}</h3>

                            <label>
                                Chi nhánh
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
                                    placeholder="Ví dụ: Tầng 1 / Sân vườn"
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
                                    <button
                                        type="button"
                                        className="secondary"
                                        onClick={resetForm}
                                    >
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
                                <div className="admin-table-empty">
                                    Chi nhánh này chưa có bàn nào.
                                </div>
                            ) : (
                                <div className="admin-table-grid">
                                    {tables.map((table) => (
                                        <div
                                            className={`admin-table-card ${table.status}`}
                                            key={table._id}
                                        >
                                            <div className="admin-table-card-top">
                                                <div>
                                                    <h4>{table.name}</h4>
                                                    <p>{table.area}</p>
                                                    <p>
                                                        Chi nhánh:{" "}
                                                        <strong>
                                                            {table.branchName ||
                                                                table.branchCode ||
                                                                "Chưa gán"}
                                                        </strong>
                                                    </p>
                                                </div>

                                                <span>{getStatusText(table.status)}</span>
                                            </div>

                                            <div className="admin-table-quick-actions">
                                                <button
                                                    onClick={() => quickSetStatus(table, "available")}
                                                >
                                                    Trống
                                                </button>

                                                <button
                                                    onClick={() => quickSetStatus(table, "cleaning")}
                                                >
                                                    Chờ dọn
                                                </button>

                                                <button
                                                    onClick={() => quickSetStatus(table, "reserved")}
                                                >
                                                    Đã đặt
                                                </button>
                                            </div>

                                            <div className="admin-table-link">
                                                <input value={getOrderLink(table)} readOnly />

                                                <button onClick={() => copyOrderLink(table)}>
                                                    Copy
                                                </button>
                                            </div>

                                            <div className="admin-table-qr-actions">
                                                <button onClick={() => openQrModal(table)}>
                                                    Xem QR
                                                </button>

                                                <button onClick={() => copyOrderLink(table)}>
                                                    Copy link
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
                </>
            )}

            {qrModal && (
                <div className="qr-modal-overlay">
                    <div className="qr-modal">
                        <div className="qr-modal-header">
                            <div>
                                <h3>QR Order - {qrModal.table.name}</h3>
                                <p>
                                    {qrModal.table.branchName || qrModal.table.branchCode} - Khách
                                    quét mã này để gọi món tại bàn.
                                </p>
                            </div>

                            <button onClick={() => setQrModal(null)}>Đóng</button>
                        </div>

                        <div className="qr-preview-card">
                            <h2>POS Coffee</h2>
                            <h3>{qrModal.table.name}</h3>

                            <p className="qr-branch-name">
                                {qrModal.table.branchName || qrModal.table.branchCode}
                            </p>

                            <img src={qrModal.qrDataUrl} alt="QR Order" />

                            <p>Quét QR để gọi món</p>

                            <input value={qrModal.link} readOnly />
                        </div>

                        <div className="qr-modal-actions">
                            <button onClick={() => copyOrderLink(qrModal.table)}>
                                Copy link
                            </button>

                            <button onClick={printQr}>In QR</button>

                            <button className="secondary" onClick={() => setQrModal(null)}>
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

export default AdminTables;