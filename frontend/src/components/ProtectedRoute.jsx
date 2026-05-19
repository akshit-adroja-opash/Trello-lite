import { Navigate } from "react-router-dom";
import useAuthStore from "../store/authstore";

const ProtectedRoute = ({ children }) => {
  const token = useAuthStore((state) => state.token);

  if (!token) {
    return <Navigate to="/" />;
  }

  return children;
};

export default ProtectedRoute;