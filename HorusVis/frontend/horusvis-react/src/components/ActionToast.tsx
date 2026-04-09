import { useEffect } from "react";

interface ActionToastProps {
  visible: boolean;
  message: string;
  onClose: () => void;
  autoCloseMs?: number;
}

const ActionToast = ({
  visible,
  message,
  onClose,
  autoCloseMs = 3000,
}: ActionToastProps) => {
  const scheduleAutoClose = () => {
    if (!visible || autoCloseMs <= 0) {
      return undefined;
    }

    return window.setTimeout(() => {
      onClose();
    }, autoCloseMs);
  };

  useEffect(() => {
    const timeoutId = scheduleAutoClose();

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [visible, autoCloseMs, onClose]);

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed right-6 top-20 z-[70] w-[min(92vw,420px)] rounded-2xl border border-emerald-300/60 bg-[linear-gradient(135deg,#0f8f5b_0%,#16a34a_100%)] px-4 py-3 text-white shadow-[0_18px_42px_rgba(15,143,91,0.34)] animate-[toastIn_260ms_ease-out]">
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined text-[22px] leading-none">
          check_circle
        </span>
        <div className="flex-1">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/85">
            Success
          </p>
          <p className="mt-1 text-sm font-semibold leading-5">{message}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg bg-white/12 p-1.5 text-white/90 hover:bg-white/20 transition-colors"
          aria-label="Close notification"
        >
          <span className="material-symbols-outlined text-[18px] leading-none">
            close
          </span>
        </button>
      </div>
    </div>
  );
};

export default ActionToast;

