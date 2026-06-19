/**
 * @purpose Initializes Grove frontend translations.
 * @role    Shared i18next singleton used by React components and language settings.
 * @deps    i18next, react-i18next, local translation resources
 * @gotcha  Language choice is persisted in Rust app settings; this module only applies it.
 */
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { enUS } from './locales/en-US'
import { zhCN } from './locales/zh-CN'

void i18n.use(initReactI18next).init({
  fallbackLng: 'en-US',
  interpolation: { escapeValue: false },
  lng: resolveSystemLanguage(),
  resources: {
    'en-US': { translation: enUS },
    'zh-CN': { translation: zhCN }
  }
})

export { i18n }

export function resolveSystemLanguage() {
  if (typeof navigator === 'undefined') return 'en-US'
  return navigator.language.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en-US'
}
