import type { Language, Translate } from '../types'

type Props = {
  language: Language
  changeLanguage: (language: Language) => void
  t: Translate
}

export default function LanguagePicker({
  language,
  changeLanguage,
  t,
}: Props) {
  return (
    <div className="language-picker" aria-label={t('language')}>
      <button
        type="button"
        className={language === 'en' ? 'active' : ''}
        onClick={() => changeLanguage('en')}
      >
        {t('english')}
      </button>

      <button
        type="button"
        className={language === 'ceb' ? 'active' : ''}
        onClick={() => changeLanguage('ceb')}
      >
        {t('cebuano')}
      </button>
    </div>
  )
}