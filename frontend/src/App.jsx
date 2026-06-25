import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AdminLayout from "./components/AdminLayout";
import AdminLogin from "./components/AdminLogin";
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
        <Route path="/" element={<POSPage />} />

        <Route path="/order/:tableId" element={<CustomerOrderPage />} />

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

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;