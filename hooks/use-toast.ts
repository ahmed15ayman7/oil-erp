import { toast, ToastOptions } from 'react-toastify';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
}

export function useToast() {
  const defaultOptions: ToastOptions = {
    position: 'bottom-left',
    autoClose: 5000,
    rtl: true,
  };

  const showToast = ({ message, type = 'info' }: ToastProps) => {
    switch (type) {
      case 'success':
        toast.success(message, defaultOptions);
        break;
      case 'error':
        toast.error(message, defaultOptions);
        break;
      case 'warning':
        toast.warning(message, defaultOptions);
        break;
      default:
        toast.info(message, defaultOptions);
    }
  };

  return { showToast };
}
