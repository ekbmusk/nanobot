import { useEffect, useState } from 'react'
import WebApp from '@twa-dev/sdk'

export function useTelegram() {
  const [user, setUser] = useState(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    WebApp.ready()
    WebApp.expand()
    const tgUser = WebApp.initDataUnsafe?.user
    if (tgUser) setUser(tgUser)
    setIsReady(true)
  }, [])

  const haptic = {
    light: () => WebApp.HapticFeedback.impactOccurred('light'),
    medium: () => WebApp.HapticFeedback.impactOccurred('medium'),
    heavy: () => WebApp.HapticFeedback.impactOccurred('heavy'),
    success: () => WebApp.HapticFeedback.notificationOccurred('success'),
    error: () => WebApp.HapticFeedback.notificationOccurred('error'),
    warning: () => WebApp.HapticFeedback.notificationOccurred('warning'),
  }

  const showBackButton = (onBack) => {
    WebApp.BackButton.show()
    WebApp.BackButton.onClick(onBack)
  }

  const hideBackButton = () => {
    WebApp.BackButton.hide()
  }

  const showAlert = (message) => WebApp.showAlert(message)
  const showConfirm = (message, callback) => WebApp.showConfirm(message, callback)
  const close = () => WebApp.close()

  return {
    user,
    isReady,
    initData: WebApp.initData,
    colorScheme: WebApp.colorScheme,
    themeParams: WebApp.themeParams,
    haptic,
    showBackButton,
    hideBackButton,
    showAlert,
    showConfirm,
    close,
  }
}
