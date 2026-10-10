export default function Logo({ className = '' }) {
  return (
    <a className={`logo ${className}`.trim()} href="/" aria-label="Habesha Store home">
      <img className="logo__mark" src="/brand/logo-mark.svg" alt="" />
      <span className="logo__name">Habesha <span>Store</span></span>
    </a>
  );
}
