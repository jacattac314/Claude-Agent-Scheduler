import type { AppProps } from 'next/app';
import { useEffect, useState } from 'react';
import Layout from '../renderer/components/Layout';
import '../renderer/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}
