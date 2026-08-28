import type { DateRange } from './constants'

export function renderDateRangeSwitcher(range: DateRange): void {
  const buttons = document.querySelectorAll<HTMLButtonElement>(
    '#date-range-switcher [data-range]',
  )
  for (const button of buttons) {
    const isActive = button.dataset.range === range
    button.classList.toggle('active', isActive)
    button.setAttribute('aria-pressed', String(isActive))
  }
}

export function showScreen(screenId: 'dashboard' | 'error-screen'): void {
  const dashboard = document.getElementById('dashboard')
  const errorScreen = document.getElementById('error-screen')
  if (dashboard) {
    dashboard.hidden = screenId !== 'dashboard'
  }
  if (errorScreen) {
    errorScreen.hidden = screenId !== 'error-screen'
  }
}

export function showError(message: string): void {
  showScreen('error-screen')
  const el = document.getElementById('error-message')
  if (el) {
    el.textContent = message
  }
}

export type ErrorReporter = (message: string) => void

export function createErrorReporter(displayErrors: boolean): ErrorReporter {
  if (displayErrors) {
    return (msg) => {
      throw new Error(msg)
    }
  }
  return showError
}
