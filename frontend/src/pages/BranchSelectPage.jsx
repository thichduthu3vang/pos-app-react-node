import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import "./BranchSelectPage.css";

function BranchSelectPage({ message }) {
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadBranches = async () => {
        try {
            setLoading(true);

            const response = await api.get("/api/branches");

            const activeBranches = (response.data.data || []).filter(
                (branch) => branch.isActive
            );

            setBranches(activeBranches);
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

    return (
        <div className="branch-select-page">
            <div className="branch-select-card">
                <div className="branch-select-header">
                    <div className="branch-logo">☕</div>

                    <div>
                        <h1>POS Coffee</h1>
                        <p>Chọn chi nhánh để bắt đầu bán hàng</p>
                    </div>
                </div>

                {message && <div className="branch-warning">{message}</div>}

                {loading ? (
                    <div className="branch-empty">Đang tải chi nhánh...</div>
                ) : branches.length === 0 ? (
                    <div className="branch-empty">
                        Chưa có chi nhánh hoạt động. Hãy vào Admin để tạo chi nhánh trước.
                    </div>
                ) : (
                    <div className="branch-grid">
                        {branches.map((branch) => (
                            <Link
                                className="branch-card"
                                key={branch._id}
                                to={`/pos/${branch.code}`}
                            >
                                <span className="branch-code">{branch.code}</span>

                                <h2>{branch.name}</h2>

                                <p>{branch.address || "Chưa có địa chỉ"}</p>

                                <strong>Vào POS bán hàng →</strong>
                            </Link>
                        ))}
                    </div>
                )}

                <div className="branch-footer-actions">
                    <Link to="/admin/chi-nhanh">Quản lý chi nhánh</Link>
                    <Link to="/admin">Vào Admin</Link>
                </div>
            </div>
        </div>
    );
}

export default BranchSelectPage;