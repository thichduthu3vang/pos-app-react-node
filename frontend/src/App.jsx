import { BrowserRouter, Navigate, Route, Routes, useParams } from "react-router-dom";
import AdminLayout from "./components/AdminLayout";
import AdminLogin from "./components/AdminLogin";
import BranchSelectPage from "./pages/BranchSelectPage";
import POSPage from "./pages/POSPage";
import CustomerOrderPage from "./pages/CustomerOrderPage";
import "./App.css";

function ProtectedPOSRoute() {
  const { branchCode } = useParams();

  const token = localStorage.getItem("adminToken");
  const adminRole = localStorage.getItem("adminRole");
  const adminBranchCode = localStorage.getItem("adminBranchCode");

  const normalizedUrlBranchCode = branchCode ? branchCode.toUpperCase() : "";
  const normalizedUserBranchCode = adminBranchCode
    ? adminBranchCode.toUpperCase()
    : "";

  if (!token) {
    return <Navigate to="/admin-login" replace />;
  }

  if (adminRole === "staff") {
    if (!normalizedUserBranchCode) {
      return <Navigate to="/admin-login" replace />;
    }

    if (normalizedUrlBranchCode !== normalizedUserBranchCode) {
      return <Navigate to={`/pos/${normalizedUserBranchCode}`} replace />;
    }
  }

  return <POSPage />;
}

function HomeRoute() {
  const token = localStorage.getItem("adminToken");
  const adminRole = localStorage.getItem("adminRole");
  const adminBranchCode = localStorage.getItem("adminBranchCode");

  if (!token) {
    return <BranchSelectPage />;
  }

  if (adminRole === "staff" && adminBranchCode) {
    return <Navigate to={`/pos/${adminBranchCode}`} replace />;
  }

  return <BranchSelectPage />;
}

function AdminRoute() {
  const token = localStorage.getItem("adminToken");

  if (!token) {
    return <Navigate to="/admin-login" replace />;
  }

  return <AdminLayout />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRoute />} />

        <Route path="/pos" element={<HomeRoute />} />

        <Route path="/pos/:branchCode" element={<ProtectedPOSRoute />} />

        <Route path="/qr/:branchCode/:tableId" element={<CustomerOrderPage />} />

        <Route path="/order/:tableId" element={<Navigate to="/" replace />} />

        <Route path="/admin-login" element={<AdminLogin />} />

        <Route path="/admin/*" element={<AdminRoute />} />

        <Route
          path="*"
          element={
            <BranchSelectPage message="URL này không tồn tại. Vui lòng chọn chi nhánh bên dưới." />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;