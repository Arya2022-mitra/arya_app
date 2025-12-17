import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  // Get language from localStorage if available (will be 'en' on server-side render)
  // The actual language will be set client-side by i18n
  return (
    <Html className="dark">
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
