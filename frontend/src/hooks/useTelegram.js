export function useTelegram() {
  // Lazy access — Telegram SDK может загрузиться позже модуля
  const tg = window.Telegram?.WebApp;
  const user = tg?.initDataUnsafe?.user;

  const sendData = (data) => {
    const tg = window.Telegram?.WebApp;
    const payload = JSON.stringify(data);
    try {
      if (tg?.sendData) {
        tg.sendData(payload);
      } else {
        tg?.close?.();
      }
    } catch (e) {
      console.error('sendData error:', e);
      tg?.close?.();
    }
  };

  return {
    tg,
    user,
    ready: () => window.Telegram?.WebApp?.ready(),
    expand: () => window.Telegram?.WebApp?.expand(),
    haptic: tg?.HapticFeedback,
    backButton: tg?.BackButton,
    sendData,
    setHeaderColor: (c) => window.Telegram?.WebApp?.setHeaderColor?.(c),
    setBackgroundColor: (c) => window.Telegram?.WebApp?.setBackgroundColor?.(c),
  };
}
