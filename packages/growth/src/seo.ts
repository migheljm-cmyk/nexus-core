export interface MindForgeSeoConfig {
  title: string;
  description: string;
  canonicalUrl: string;
  ogImageUrl?: string;
  noIndex?: boolean;
}

export function generateMetadata({
  title,
  description,
  canonicalUrl,
  ogImageUrl = 'https://mindforge.app/og-default.png',
  noIndex = false,
}: MindForgeSeoConfig) {
  return {
    title: `${title} | MindForge`,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: !noIndex,
      follow: !noIndex,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'MindForge',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: 'es_MX',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export function generateGameJsonLd(gameName: string, description: string, url: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: gameName,
    operatingSystem: 'Any',
    applicationCategory: 'GameApplication',
    description,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    url,
  };
}