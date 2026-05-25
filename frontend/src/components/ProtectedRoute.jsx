import { Navigate } from "react-router-dom";
import useAuthStore from "../store/authstore";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  if (!token) {
    return <Navigate to="/" />;
  }

  if (allowedRoles) {
    if (!user) {
      return null;
    }
    if (!allowedRoles.includes(user.role)) {
      return <Navigate to="/dashboard" />;
    }
  }

  return children;
};

export default ProtectedRoute;