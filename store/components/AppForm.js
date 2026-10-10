import { ACTIONS } from '@/lib/format';

const upload = (
  <svg className="dropzone__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 15V4m0 0L8 8m4-4l4 4M4 15v3.5A1.5 1.5 0 005.5 20h13a1.5 1.5 0 001.5-1.5V15" />
  </svg>
);

// Same markup as the sign-in fields (label above, hint, empty live region for inline errors); `as` picks input, select or textarea.
function Field({ name, label, hint, required, as: Tag = 'input', children, ...rest }) {
  const id = `f-${name}`;
  const describedBy = [hint && `${id}-hint`, `${id}-err`].filter(Boolean).join(' ');
  return (
    <div className="field">
      <label className={`field__label${required ? ' is-required' : ''}`} htmlFor={id}>{label}</label>
      <Tag className="input" id={id} name={name} required={required} aria-describedby={describedBy} {...rest}>{children}</Tag>
      {hint && <p className="field__hint" id={`${id}-hint`}>{hint}</p>}
      <p className="field__error" id={`${id}-err`} aria-live="polite" />
    </div>
  );
}

// Upload area for ui.js ([data-upload]); `children` are the already-saved items when editing.
function Upload({ id, name, label, required, multiple, title, hint, children, ...data }) {
  return (
    <div className="field upload" data-upload {...data}>
      <span className={`field__label${required ? ' is-required' : ''}`} id={`${id}-label`}>{label}</span>
      <label className="dropzone">
        <input className="visually-hidden" id={`${id}-input`} type="file" name={name} accept="image/png,image/jpeg,image/webp" multiple={multiple}
               required={required} aria-labelledby={`${id}-label`} aria-describedby={`${id}-hint ${id}-err`} />
        {upload}
        <span className="dropzone__title"><strong>{title[0]}</strong> {title[1]}</span>
        <span className="dropzone__hint" id={`${id}-hint`}>{hint}</span>
      </label>
      <ul className="upload__list" role="list">{children}</ul>
      {multiple && <p className="field__hint upload__count" />}
      <p className="field__error" id={`${id}-err`} aria-live="polite" />
    </div>
  );
}

// A titled group of fields: a named group with a heading (a fieldset would draw its legend over the divider line).
const Section = ({ title, id, children }) => (
  <div className="form-section" id={id} role="group" aria-labelledby={`${id}-title`}>
    <h2 className="form-section__title" id={`${id}-title`}>{title}</h2>
    <div className="form__fields">{children}</div>
  </div>
);

// One form for publishing and editing. `app` (from getOwnApp) fills it in; without it the fields start empty.
// Posts as multipart to /api/apps/save, with the app id as a hidden field when editing.
export default function AppForm({ app = null, categories = [] }) {
  const mb = app?.file_size ? (app.file_size / 1048576).toFixed(2) : '';
  return (
    <form className="form app-form" method="post" action="/api/apps/save" encType="multipart/form-data" data-app-form>
      <div data-alert-slot />
      {app && <input type="hidden" name="id" value={app.id} />}

      <fieldset className="form__fields">
        <Section title="About your app" id="about">
          <Field name="name" label="App name" required data-empty="Enter your app name." maxLength={60} defaultValue={app?.name} autoComplete="off" />
          <div className="form-row">
            <Field as="select" name="platform" label="Platform" required defaultValue={app?.platform || 'android'}>
              <option value="android">Android</option>
              <option value="ios">iOS</option>
            </Field>
            {categories.length > 0 && (
              <Field as="select" name="category_id" label="Category" defaultValue={app?.category_id ?? ''}>
                <option value="">No category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Field>
            )}
          </div>
        </Section>

        <Section title="Description" id="description">
          <Field name="summary" label="Short summary" required data-empty="Enter a short summary." maxLength={120} defaultValue={app?.summary} hint="One line shown on app cards and search results." />
          <Field as="textarea" name="description" label="Full description" maxLength={4000} defaultValue={app?.description} hint="Optional. Leave a blank line between paragraphs." />
        </Section>

        <Section title="Download" id="download">
          <Field as="select" name="distribution" label="How people get it" required defaultValue={app?.distribution || 'apk'}
                 hint="APK downloads are for Android. iOS apps must link to the App Store or TestFlight.">
            {Object.entries(ACTIONS).map(([key, a]) => <option key={key} value={key}>{a.kind}</option>)}
          </Field>
          <Field name="download_url" label="Link" type="url" required data-empty="Enter the download link." maxLength={500} defaultValue={app?.download_url} inputMode="url" autoComplete="off" spellCheck="false"
                 placeholder="https://" hint="Your APK (a Google Drive share link works), App Store page, TestFlight invite or download page." />
        </Section>

        <Section title="Release" id="release">
          <div className="form-row">
            <Field name="version" label="Version" maxLength={20} defaultValue={app?.version} placeholder="1.0.0" autoComplete="off" />
            <Field name="min_os" label="Requires" maxLength={30} defaultValue={app?.min_os} placeholder="Android 8.0+" autoComplete="off" />
          </div>
          <div className="form-row">
            <Field name="file_size_mb" label="File size (MB)" type="number" min="0" max="10240" step="0.01" inputMode="decimal" defaultValue={mb}
                   hint="Optional. Shown on your app page for downloads." />
          </div>
        </Section>

        <Section title="Images" id="images">
          <Upload id="icon" name="icon" label="App icon" required={!app?.icon_url} data-empty="Choose an app icon." data-max="1" data-max-mb="2" data-min-px="512" data-square="true" data-noun="icon"
                  title={['Choose an image', 'or drag it here']} hint="PNG, JPG or WebP. Square, at least 512×512 pixels, up to 2 MB.">
            {app?.icon_url && (
              <li className="upload__item" data-existing><img className="upload__thumb" src={app.icon_url} alt="Current icon" /></li>
            )}
          </Upload>
          <Upload id="shots" name="screenshots" label="Screenshots" multiple data-max="8" data-max-mb="5" data-noun="screenshots" data-removed-name="removed_screenshot_ids"
                  title={['Choose images', 'or drag them here']} hint="PNG, JPG or WebP. Up to 8 screenshots, 5 MB each.">
            {app?.screenshots?.map((s, i) => (
              <li className="upload__item" key={s.id} data-existing data-id={s.id}>
                <img className="upload__thumb" src={s.url} alt={`Current screenshot ${i + 1}`} />
                <span className="upload__name">{`Screenshot ${i + 1}`}</span>
                <button type="button" className="upload__remove" aria-label={`Remove screenshot ${i + 1}`}>×</button>
              </li>
            ))}
          </Upload>
        </Section>
      </fieldset>

      <div className="form-actions">
        <button className="btn btn--primary" type="submit">{app ? 'Save changes' : 'Publish app'}</button>
        <a className="btn btn--ghost" href="/dashboard/apps">Cancel</a>
      </div>
    </form>
  );
}
