import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';

export default function App({ Component, pageProps }: AppProps) {
  // Pull the key from your .env.local file
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  return (
    <>
      <Head>
        <title>DisputeIt.Appz</title>
        {/* Load the script only once here */}
        <script
          async
          src={`https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places`}
        ></script>
      </Head>
      <Component {...pageProps} />
    </>
  );
}