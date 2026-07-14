import toast, { Toaster, ToastBar } from "react-hot-toast";

export const showSuccess = (message) => {
  toast.success(message);
};

export const showError = (message) => {
  toast.error(message);
};

const Toast = () => {
  return (
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
  );
};

export default Toast;
