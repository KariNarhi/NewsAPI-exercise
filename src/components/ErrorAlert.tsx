import type { ReactNode } from "react";

interface ErrorAlertProps {
  children: ReactNode;
  onRetry: () => void;
}

const ErrorAlert = ({ children, onRetry }: ErrorAlertProps) => (
  <div className="alert app-alert d-flex flex-wrap align-items-center justify-content-between gap-3">
    <span role="alert">{children}</span>
    <button type="button" className="btn btn-clear" onClick={onRetry}>
      Try again
    </button>
  </div>
);

export default ErrorAlert;
