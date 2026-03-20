import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anton&family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400&display=swap"
          rel="stylesheet"
        />
        <meta name="description" content="A show investigating familiar brands, the products they make, and the people shaping them — with a focus on the decisions, economics, and mechanics behind the scenes." />
        <meta name="theme-color" content="#000000" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href="https://uepod.com" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Unit Economics — Exploring the hidden complexity behind every industry" />
        <meta property="og:description" content="A show investigating familiar brands, the products they make, and the people shaping them — with a focus on the decisions, economics, and mechanics behind the scenes." />
        <meta property="og:url" content="https://uepod.com" />
        <meta property="og:image" content="https://uepod.com/og-image.png" />
        <meta property="og:site_name" content="Unit Economics" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Unit Economics — Exploring the hidden complexity behind every industry" />
        <meta name="twitter:description" content="A show investigating familiar brands, the products they make, and the people shaping them." />
        <meta name="twitter:image" content="https://uepod.com/og-image.png" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
