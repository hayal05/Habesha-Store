import QRCode from 'qrcode';
import { siteOrigin } from '@/lib/site';

// A very small QR code that opens into a scannable one with a download link. Plain <details>, so it works without JavaScript.
export default async function AppQr({ app }) {
  const url = `${await siteOrigin()}/apps/${app.id}`;
  const svg = await QRCode.toString(url, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#000000', light: '#ffffff' } });
  const sized = (px) => svg.replace('<svg ', `<svg width="${px}" height="${px}" `);
  const slug = app.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'app';
  const href = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(sized(512))}`;
  return (
    <details className="qr">
      <summary className="qr__summary" aria-label={`QR code for ${app.name}`}>
        <span className="qr__thumb" aria-hidden="true" dangerouslySetInnerHTML={{ __html: sized(40) }} />
        <span className="qr__label">QR code</span>
      </summary>
      <div className="qr__panel">
        <div className="qr__code" role="img" aria-label={`QR code that opens the ${app.name} page`} dangerouslySetInnerHTML={{ __html: sized(200) }} />
        <p className="qr__text">Scan with a phone camera to open this app page.</p>
        <a className="btn btn--secondary btn--sm" href={href} download={`${slug}-qr.svg`} data-qr-download data-name={slug}>Download QR code</a>
      </div>
    </details>
  );
}
