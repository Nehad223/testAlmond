import { Navigate } from "react-router-dom";

const ProtectedCashier = ({ children }) => {
  const token = sessionStorage.getItem("token");
  const type = sessionStorage.getItem("type");

  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  if (type !== "cashier" && type !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedCashier;

