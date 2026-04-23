import { hookstate, useHookstate } from '@hookstate/core';

// ✅ CONSTRUCTION
const globalWebhookState = hookstate({
  search: '',
  triggeringId: null as string | null,
  showModal: false,
  toasts: [] as {
    id: string;
    status: 'sending' | 'success' | 'failure';
    message: string;
  }[],
});

export const useWebhookState = () => {
  // ✅ DOWNGRADE
  const state = useHookstate(globalWebhookState);

  const addOrUpdateToast = (toast: {
    id: string;
    status: 'sending' | 'success' | 'failure';
    message: string;
  }) => {
    const current = state.toasts.get();
    const existing = current.findIndex((t) => t.id === toast.id);
    if (existing !== -1) {
      // ✅ MERGE
      state.toasts[existing].merge({
        status: toast.status,
        message: toast.message,
      });
    } else {
      state.toasts.merge([toast]);
    }
  };

  const removeToast = (id: string) => {
    state.toasts.set((prev) => prev.filter((t) => t.id !== id));
  };

  return {
    search: state.search.get(),
    triggeringId: state.triggeringId.get(),
    showModal: state.showModal.get(),
    toasts: state.toasts.get(),
    setSearch: (val: string) => state.search.set(val),
    setTriggeringId: (val: string | null) => state.triggeringId.set(val),
    setShowModal: (val: boolean) => state.showModal.set(val),
    addOrUpdateToast,
    removeToast,
  };
};