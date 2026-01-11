import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const isLoggedIn = sessionStorage.getItem("token"); 

  if (!isLoggedIn) {
    return <Navigate to="/admin/login2" replace />;
  }

  return children;
};

export default ProtectedRoute;
