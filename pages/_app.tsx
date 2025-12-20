import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Dispute It with AI </title>
        {/* API Script REMOVED to prevent 'Multiple Loads' crash */}
      </Head>
      <Component {...pageProps} />
    </>
  );
}