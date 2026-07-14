import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster, ToastBar } from "react-hot-toast";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import BoardPage from "./pages/BoardPage";
import ProtectedRoute from "./components/ProtectedRoute";
import useAuthStore from "./store/authstore";
import useSocketStore from "./store/socketStore";
import MyTasksPage from "./pages/MyTasksPage";
import ProfilePage from "./pages/ProfilePage";
import ReportsPage from "./pages/ReportsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import AssignTaskPage from "./pages/AssignTaskPage";
import UserManagementPage from "./pages/UserManagementPage";
import SupportPage from "./pages/SupportPage";
import NotificationSettingsPage from "./pages/NotificationSettingsPage";
import LearnMorePage from "./pages/LearnMorePage";


const App = () => {
  const { connect, disconnect } = useSocketStore();
  const token = useAuthStore((state) => state.token);
  const fetchMe = useAuthStore((state) => state.fetchMe);

  useEffect(() => {
    if (token) {
      fetchMe();
    }
  }, [token, fetchMe]);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return (
    <div>
      <Toaster 
        position="top-right" 
        containerStyle={{
          top: 74,
        }}
      >
        {(t) => (
          <div
            style={{
              opacity: t.visible ? 1 : 0,
              transform: t.visible ? 'translateX(0)' : 'translateX(120%)',
              transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <ToastBar toast={t} style={{ ...t.style, animation: 'none' }} />
          </div>
        )}
      </Toaster>
      <Routes>
        <Route path="/" element={token ? <Navigate to="/dashboard" /> : <LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={["admin", "project_manager", "client"]}>
              <ReportsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/:boardId"
          element={
            <ProtectedRoute allowedRoles={["admin", "project_manager", "client"]}>
              <ReportsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/board/:id"
          element={
            <ProtectedRoute>
              <BoardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-tasks"
          element={
            <ProtectedRoute>
              <MyTasksPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute allowedRoles={["admin", "project_manager"]}>
              <AnalyticsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/assign-task"
          element={
            <ProtectedRoute allowedRoles={["admin", "project_manager"]}>
              <AssignTaskPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user-management"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <UserManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/support"
          element={
            <ProtectedRoute>
              <SupportPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/learn-more"
          element={
            <ProtectedRoute>
              <LearnMorePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <NotificationSettingsPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to={token ? "/dashboard" : "/login"} />} />
      </Routes>
    </div>
  );
};

export default App;
