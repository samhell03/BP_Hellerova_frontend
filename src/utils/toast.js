import { toast } from "react-toastify";

const defaultOptions = {
  autoClose: 3500,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true
};

export function showSuccess(message) {
  toast.success(message, defaultOptions);
}

export function showError(message) {
  toast.error(message, defaultOptions);
}

export function showInfo(message) {
  toast.info(message, defaultOptions);
}

export function showWarning(message) {
  toast.warning(message, defaultOptions);
}