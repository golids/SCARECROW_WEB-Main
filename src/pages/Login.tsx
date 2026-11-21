
import { useState } from 'react'
import Brand from '../components/Brand'
import LanguagePicker from '../components/LanguagePicker'
import type { Language, Translate } from '../types'

type Props = {
  language: Language
  changeLanguage: (language: Language) => void
  t: Translate
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: Error | null }>
}

export default function Login({
  language,
  changeLanguage,
  t,
  signIn,
}: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setAuthError('')
    setBusy(true)

    try {
      const { error } = await signIn(email.trim(), password)

      if (error) {
        setAuthError(error.message)
      }
    } catch {
      setAuthError('Unable to sign in. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="login-screen">
      <div className="login-split">
        <section className="login-brand-panel">
          <Brand />

          <div className="login-brand-content">
            <span className="login-eyebrow">
              SMART AGRICULTURE SYSTEM
            </span>

            <h1>
              Protecting fields.
              <br />
              Supporting farmers.
            </h1>

            <p>
              Monitor your ScareCROW devices and field activity
              through one centralized dashboard.
            </p>
          </div>
        </section>

        <section className="login-form-panel">
          <div className="login-language">
            <LanguagePicker
              language={language}
              changeLanguage={changeLanguage}
              t={t}
            />
          </div>

          <div className="login-form-content">
            <span className="login-eyebrow">ADMINISTRATOR ACCESS</span>

            <h2>{t('welcome')}</h2>
            <p>{t('loginDesc')}</p>

            <form onSubmit={handleSubmit}>
              <label htmlFor="login-email">
                {t('email')}
              </label>

              <input
                id="login-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@example.com"
                autoComplete="username"
                required
              />

              <label htmlFor="login-password">
                {t('password')}
              </label>

              <input
                id="login-password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={t('password')}
                autoComplete="current-password"
                required
              />

              {authError && (
                <div className="login-error">
                  {authError}
                </div>
              )}

              <button
                type="submit"
                className="login-submit"
                disabled={busy}
              >
                {busy ? t('signingIn') : t('signIn')}
              </button>
            </form>
          </div>

          <p className="login-footer">
            SCARECROW SMART FIELD SYSTEM
          </p>
        </section>
      </div>
    </main>
  )
}