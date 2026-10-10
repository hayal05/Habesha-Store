// A message under the page title. Errors are announced at once (role=alert); others politely (role=status).
export default function Notice({ tone, text }) {
  return (
    <div className={`alert alert--${tone}`} role={tone === 'danger' ? 'alert' : 'status'}>
      <div className="alert__body"><p className="alert__text">{text}</p></div>
    </div>
  );
}
