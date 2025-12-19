import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_AI_KEY || "";

  return (
    <Html lang="en">
      <Head>
        {/* Correctly load Google Maps with the API Key to fix "Unregistered Caller" */}
        <script
          async
          src={`https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`}
        ></script>
      </Head>
      <body className="bg-slate-50 text-slate-900 antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}