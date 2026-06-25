import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AdminLayout from "./components/AdminLayout";
import AdminLogin from "./components/AdminLogin";
import BranchSelectPage from "./pages/BranchSelectPage";
import POSPage from "./pages/POSPage";
import CustomerOrderPage from "./pages/CustomerOrderPage";
import "./App.css";

function App() {
  const isAdminLoggedIn = () => {
    return Boolean(localStorage.getItem("adminToken"));
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<BranchSelectPage />} />

        <Route path="/pos" element={<BranchSelectPage />} />

        <Route path="/pos/:branchCode" element={<POSPage />} />

        <Route path="/qr/:branchCode/:tableId" element={<CustomerOrderPage />} />

        <Route path="/order/:tableId" element={<Navigate to="/" replace />} />

        <Route path="/admin-login" element={<AdminLogin />} />

        <Route
          path="/admin/*"
          element={
            isAdminLoggedIn() ? (
              <AdminLayout />
            ) : (
              <Navigate to="/admin-login" replace />
            )
          }
        />

        <Route
          path="*"
          element={<BranchSelectPage message="URL này không tồn tại. Vui lòng chọn chi nhánh bên dưới." />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;