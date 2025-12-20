import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* API Script removed to prevent 'Multiple Loads' error */}
      </Head>
      <body className="bg-slate-50 text-slate-900 antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}