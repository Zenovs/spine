import type { Metadata, Viewport } from "next";
import "./globals.css";

const SITE_URL = "https://www.augmentedreality.ch";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "augmentedreality.ch — QR-Code trifft AR-Erlebnis",
    template: "%s · augmentedreality.ch",
  },
  description:
    "Verbinde physische Produkte mit digitalen Erlebnissen. Ein QR-Code, ein AR-Layer, eine Videobotschaft — direkt im Browser, ohne App. Schweizer Lösung für Wein, Geschenke, Schmuck und mehr.",
  keywords: [
    "QR-Code", "Augmented Reality", "AR", "Mixed Reality", "WebAR",
    "Videobotschaft", "QR Marketing", "Produkt-Storytelling",
    "Wein QR-Code", "Geschenk QR-Code", "Schweiz", "augmentedreality.ch",
  ],
  authors: [{ name: "wireon", url: "https://wireon.ch" }],
  creator: "wireon",
  publisher: "augmentedreality.ch",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "de_CH",
    url: SITE_URL,
    siteName: "augmentedreality.ch",
    title: "augmentedreality.ch — QR-Code trifft AR-Erlebnis",
    description:
      "Verbinde physische Produkte mit digitalen Erlebnissen. Ein QR-Code, ein AR-Layer, eine Videobotschaft — direkt im Browser, ohne App.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "augmentedreality.ch — Persönliche QR-Erlebnisse",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "augmentedreality.ch — QR-Code trifft AR-Erlebnis",
    description:
      "Verbinde physische Produkte mit digitalen Erlebnissen. QR scannen, AR erleben — ohne App.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  category: "technology",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)",  color: "#101319" },
  ],
  width: "device-width",
  initialScale: 1,
};

// Structured data — Organization + Service. Helps Google and AI crawlers
// understand WHAT this site offers, WHO runs it, and HOW to cite it.
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "augmentedreality.ch",
      url: SITE_URL,
      logo: `${SITE_URL}/icon.svg`,
      email: "info@wireon.ch",
      sameAs: ["https://wireon.ch"],
      description:
        "Schweizer Plattform für QR-basierte AR-Erlebnisse — physische Produkte mit Video, AR-Layern, 3D-Inhalten und persönlichen Botschaften verknüpfen.",
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "augmentedreality.ch",
      inLanguage: "de-CH",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "Service",
      name: "QR-Code AR-Erlebnis",
      provider: { "@id": `${SITE_URL}/#organization` },
      areaServed: { "@type": "Country", name: "Switzerland" },
      serviceType: "Augmented Reality & QR Marketing",
      description:
        "Wir kleben einen QR-Code aufs Produkt. Über die augmentedreality.ch-Plattform hinterlegt der Kunde Video, Botschaft, Bild oder AR-Layer — ein Scan öffnet das Erlebnis sofort im Browser. App-frei, dauerhaft, unveränderlich.",
      offers: {
        "@type": "Offer",
        availability: "https://schema.org/InStock",
        priceCurrency: "CHF",
      },
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" data-theme="future" data-motion="on">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo:ital,wdth,wght@0,75..125,100..900;1,75..125,100..900&family=Hanken+Grotesk:ital,wght@0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:ital,wght@0,400;0,500;1,400&family=Playfair+Display:ital,wght@0,500;0,600;1,500;1,600&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {children}
      </body>
    </html>
  );
}
