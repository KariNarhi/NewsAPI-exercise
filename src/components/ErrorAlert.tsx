import type { ReactNode } from "react";

/** Props of ErrorAlert. */
interface ErrorAlertProps {
  // The message to show
  children: ReactNode;
  // Called by the "Try again" button
  onRetry: () => void;
}

/** Error message with a retry button, used for both requests. */
const ErrorAlert = ({ children, onRetry }: ErrorAlertProps) => (
  <div className="alert app-alert d-flex flex-wrap align-items-center justify-content-between gap-3">
    {/* The role is on the text only, so the button label is not announced */}
    <span role="alert">{children}</span>
    <button type="button" className="btn btn-clear" onClick={onRetry}>
      Try again
    </button>
  </div>
);

export default ErrorAlert;
