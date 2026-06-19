/**
 * @purpose Maps persisted Grove language settings to i18next runtime languages.
 * @role    Small language adapter shared by settings UI and panel state.
 * @deps    generated settings DTOs, i18n singleton
 * @gotcha  Keep AppLanguageDto values aligned with Rust settings DTO serialization.
 */
import type { AppLanguageDto } from '../bindings/commands'
import { i18n, resolveSystemLanguage } from './i18n'

export const LANGUAGE_OPTIONS: Array<{
  id: AppLanguageDto
  labelKey: string
  shortLabelKey: string
}> = [
  { id: 'system', labelKey: 'settings.language.system', shortLabelKey: 'footer.languageSystem' },
  { id: 'zh_cn', labelKey: 'settings.language.zhCn', shortLabelKey: 'footer.languageZhCn' },
  { id: 'en_us', labelKey: 'settings.language.enUs', shortLabelKey: 'footer.languageEnUs' }
]

export function applyAppLanguage(language: AppLanguageDto) {
  const resolved = resolveAppLanguage(language)
  if (typeof document !== 'undefined') document.documentElement.lang = resolved
  if (i18n.language !== resolved) void i18n.changeLanguage(resolved)
}

export function resolveAppLanguage(language: AppLanguageDto) {
  if (language === 'zh_cn') return 'zh-CN'
  if (language === 'en_us') return 'en-US'
  return resolveSystemLanguage()
}
