import Script from 'next/script';

export const metadata = {
  title: 'Habesha Store',
  description: 'Discover and download Android and iOS apps.',
  manifest: '/site.webmanifest',
  icons: { icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }, { url: '/favicon.ico', sizes: '48x48' }], apple: '/apple-touch-icon.png' },
};
export const viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#0B7A43' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('has-js')" }} />
        {['tokens', 'base', 'brand', 'components'].map((f) => <link key={f} rel="stylesheet" href={`/${f}.css`} />)}
      </head>
      <body>
        <a className="skip-link" href="#main">Skip to content</a>
        {children}
        <Script src="/ui.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
