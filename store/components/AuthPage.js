import { redirect } from 'next/navigation';
import Logo from './Logo';
import Notice from './Notice';
import { AUTH_ERRORS, getDeveloper, safeNext } from '@/lib/auth';

const COPY = {
  signin: { title: 'Sign in', text: 'Manage your apps and see how often people tap Download.', cta: 'Sign in', alt: ['New to Habesha Store?', 'Create an account', '/signup'] },
  signup: { title: 'Create your account', text: 'Publish your apps and share them with people on Habesha Store.', cta: 'Create account', alt: ['Already have an account?', 'Sign in', '/signin'] },
};
const POINTS = [
  'List an Android APK link, or point to your App Store or TestFlight page.',
  'See how many times people tap Download.',
  'Edit, update or unpublish a listing whenever you like.',
];

const eye = <path d="M1.5 10S4.5 4.5 10 4.5 18.5 10 18.5 10 15.5 15.5 10 15.5 1.5 10 1.5 10z" />;
const icon = { viewBox: '0 0 20 20', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };

function Field({ name, label, hint, type = 'text', ...rest }) {
  const id = `f-${name}`;
  const describedBy = [hint && `${id}-hint`, `${id}-err`].filter(Boolean).join(' ');
  const input = <input className="input" id={id} name={name} type={type} required data-noun={name} aria-describedby={describedBy} {...rest} />;
  return (
    <div className="field">
      <label className="field__label is-required" htmlFor={id}>{label}</label>
      {type === 'password' ? (
        <div className="input-group">
          {input}
          {/* hidden until ui.js runs: a toggle that does nothing without JavaScript would only confuse */}
          <button className="input-group__action" type="button" aria-label="Show password" aria-pressed="false" data-pw-toggle hidden>
            <svg className="eye-open" {...icon}>{eye}<circle cx="10" cy="10" r="2.5" /></svg>
            <svg className="eye-off" {...icon}>{eye}<path d="M3 3l14 14" /></svg>
          </button>
        </div>
      ) : input}
      {hint && <p className="field__hint" id={`${id}-hint`}>{hint}</p>}
      <p className="field__error" id={`${id}-err`} aria-live="polite" />
    </div>
  );
}

export default async function AuthPage({ mode, searchParams }) {
  const query = await searchParams;
  const next = safeNext(query.next);
  if (await getDeveloper()) redirect(next);

  const c = COPY[mode];
  const signup = mode === 'signup';
  const carry = query.next && query.next === next ? `?next=${encodeURIComponent(next)}` : '';
  const code = query.error || (query.expired && 'expired');
  const note = Object.hasOwn(AUTH_ERRORS, code) ? { tone: code === 'expired' ? 'warning' : 'danger', text: AUTH_ERRORS[code] } : null;

  return (
    <div className="auth">
      <aside className="auth__panel brand-pattern">
        <Logo />
        <div className="auth__pitch">
          <h2>Publish your app where people can find it</h2>
          <ul className="auth__points" role="list">{POINTS.map((p) => <li key={p}>{p}</li>)}</ul>
        </div>
      </aside>
      <main id="main" className="auth__main">
        <Logo className="auth__logo" />
        <div className="auth__card">
          <div className="brand-stripe" />
          <div className="auth__body">
            <div className="auth__head"><h1>{c.title}</h1><p>{c.text}</p></div>
            <form className="form" method="post" action={`/api/auth/${mode}`} data-auth-form>
              <div data-alert-slot>
                {note && (
                  <Notice tone={note.tone} text={note.text} />
                )}
              </div>
              <input type="hidden" name="next" value={next} />
              <fieldset className="form__fields">
                {signup && <Field name="name" label="Your name or company" placeholder="Name shown on your apps" autoComplete="name" minLength={2} maxLength={60} />}
                <Field name="email" label="Email" type="email" placeholder="you@example.com" autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck="false" maxLength={254} />
                <Field name="password" label="Password" type="password" autoComplete={signup ? 'new-password' : 'current-password'} maxLength={128}
                  {...(signup && { minLength: 8, hint: 'At least 8 characters.' })} />
              </fieldset>
              <button className="btn btn--primary btn--block" type="submit">{c.cta}</button>
            </form>
            <p className="auth__foot">{c.alt[0]} <a href={c.alt[2] + carry}>{c.alt[1]}</a></p>
          </div>
        </div>
      </main>
    </div>
  );
}
