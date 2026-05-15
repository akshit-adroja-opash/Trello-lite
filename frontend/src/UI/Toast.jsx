import toast, { Toaster } from "react-hot-toast";

export const showSuccess = (message) => {
  toast.success(message);
};

export const showError = (message) => {
  toast.error(message);
};

const Toast = () => {
  return <Toaster position="top-right" />;
};

export default Toast;