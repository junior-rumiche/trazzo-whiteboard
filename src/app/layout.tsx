import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://trazzo.app";

export const viewport: Viewport = {
  themeColor: "#fbfbfe",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Trazzo Whiteboard — Pizarra Virtual Gratuita y Diagramas en Línea | Free Online Whiteboard",
    template: "%s | Trazzo Whiteboard",
  },
  description:
    "Trazzo Whiteboard es una pizarra virtual interactiva y herramienta de diagramación en tu navegador para crear diagramas de flujo, arquitectura de software, wireframes y bocetos a mano alzada. Rápida, 100% privada, almacenamiento local y sin registro. Free online whiteboard for flowcharts, architecture diagrams, sketches and wireframes.",
  keywords: [
    // Brand & Variations
    "Trazzo Whiteboard",
    "Trazzo",
    "Trazzo pizarra virtual",
    "Trazzo online whiteboard",
    "Trazzo diagramas",

    // Virtual Whiteboard (ES)
    "pizarra virtual",
    "pizarra virtual online",
    "pizarra online",
    "pizarra online gratis",
    "pizarra virtual gratis",
    "pizarra digital interactiva",
    "pizarra blanca online",
    "pizarra interactiva en linea",
    "pizarra sin registro",
    "pizarra virtual privada",
    "lienzo infinito online",
    "dibujo digital libre",

    // Virtual Whiteboard (EN)
    "virtual whiteboard",
    "online whiteboard",
    "free online whiteboard",
    "digital whiteboard",
    "interactive whiteboard",
    "infinite canvas whiteboard",
    "whiteboard canvas",
    "online sketch board",
    "browser whiteboard",
    "whiteboard no sign up",
    "private local whiteboard",
    "free whiteboard",

    // Diagramming & Architecture (ES)
    "diagramas de flujo",
    "diagramas de flujo online",
    "diagramas de arquitectura",
    "diagramas de arquitectura de software",
    "diagramas de sistemas",
    "diagramas online",
    "crear diagramas de flujo",
    "herramienta de diagramación",
    "conectores inteligentes",
    "mapas conceptuales",
    "esquemas visuales",
    "diseño de sistemas",

    // Diagramming & Architecture (EN)
    "online diagramming tool",
    "architecture diagram tool",
    "software architecture diagram",
    "system design diagrams",
    "flowchart maker online",
    "free flowchart maker",
    "diagram maker",
    "concept map online",
    "smart connectors flowchart",
    "cloud architecture diagram",
    "technical diagram tool",

    // Wireframes & Sketch Drawing (ES)
    "wireframes",
    "wireframes online",
    "bocetos a mano alzada",
    "dibujo estilo boceto",
    "prototipado rapido",
    "herramienta de wireframes",

    // Wireframes & Sketch Drawing (EN)
    "wireframe maker",
    "online wireframing tool",
    "sketch diagram online",
    "hand-drawn diagrams",
    "sketch drawing canvas",
    "hand-drawn whiteboard",
    "low-fidelity wireframes",

    // Privacy & Export
    "pizarra con almacenamiento local",
    "exportar a SVG y PNG",
    "export SVG PNG whiteboard",
    "offline whiteboard",
    "private canvas no tracking",
    "private whiteboard",
  ],
  authors: [{ name: "Trazzo Whiteboard", url: siteUrl }],
  creator: "Trazzo Whiteboard",
  publisher: "Trazzo Whiteboard",
  applicationName: "Trazzo Whiteboard",
  appleWebApp: {
    capable: true,
    title: "Trazzo Whiteboard",
    statusBarStyle: "default",
  },
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Trazzo Whiteboard — Pizarra Virtual Gratuita y Diagramas en Línea | Free Online Whiteboard",
    description:
      "Trazzo Whiteboard: Pizarra virtual interactiva y herramienta de diagramación en tu navegador. Diseña diagramas de flujo, arquitectura de software, wireframes y bocetos a mano alzada con almacenamiento local privado y sin registro.",
    url: siteUrl,
    siteName: "Trazzo Whiteboard",
    locale: "es_ES",
    alternateLocale: ["en_US"],
    type: "website",
    images: [
      {
        url: `${siteUrl}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "Trazzo Whiteboard — Pizarra Virtual Gratuita y Diagramas en Línea",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Trazzo Whiteboard — Pizarra Virtual Gratuita y Diagramas en Línea | Free Online Whiteboard",
    description:
      "Trazzo Whiteboard: Pizarra virtual interactiva para diagramas de flujo, arquitectura y bocetos a mano alzada. 100% privada en tu navegador.",
    creator: "@trazzoapp",
    images: [`${siteUrl}/opengraph-image`],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  },
  category: "productivity",
  verification: {
    google: "0vDxt0U570AAai5uQjBWLTmgrNOM_5RQn8NVDq3ZcIE",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "Trazzo",
      alternateName: "Trazzo Whiteboard",
      url: siteUrl,
      logo: `${siteUrl}/icon.svg`,
      description:
        "Trazzo Whiteboard es una plataforma libre de pizarra virtual y diagramas interactivos en el navegador con almacenamiento local privado.",
    },
    {
      "@type": ["WebApplication", "SoftwareApplication"],
      "@id": `${siteUrl}/#webapp`,
      name: "Trazzo Whiteboard",
      alternateName: [
        "Trazzo",
        "Trazzo Whiteboard Online",
        "Pizarra Trazzo",
        "Trazzo Pizarra Virtual",
        "Trazzo Virtual Whiteboard",
      ],
      url: siteUrl,
      description:
        "Trazzo Whiteboard es una pizarra virtual interactiva y herramienta de diagramación en tu navegador para crear diagramas de flujo, arquitectura de software, wireframes y bocetos con estilo a mano alzada. 100% gratuita, privada y sin registro.",
      applicationCategory: "DesignApplication",
      operatingSystem: "All modern web browsers",
      browserRequirements: "Requires JavaScript, HTML5 Canvas support",
      publisher: {
        "@id": `${siteUrl}/#organization`,
      },
      author: {
        "@id": `${siteUrl}/#organization`,
      },
      image: `${siteUrl}/opengraph-image`,
      screenshot: `${siteUrl}/opengraph-image`,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      featureList: [
        "Lienzo infinito con zoom y paneo continuo (Infinite canvas)",
        "Diagramas con conectores magnéticos inteligentes (Smart connectors)",
        "Dibujo a mano alzada con estilo boceto natural (Hand-drawn sketches)",
        "Reconocimiento de formas geométricas a mano alzada (Shape recognition)",
        "Formas geométricas precisas: rectángulos, rombos, elipses, flechas y líneas",
        "Marcos contenedores para organizar vistas y diagramas (Frames)",
        "Herramienta de selección por lazo y manipulación de capas",
        "Puntero láser interactivo para presentaciones",
        "Exportación a formatos PNG, SVG, portapapeles y archivos .trazzo",
        "Privacidad total con almacenamiento 100% local en tu navegador sin registro",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "Trazzo Whiteboard",
      alternateName: "Trazzo",
      description: "Pizarra virtual interactiva y herramienta de diagramación en línea",
      publisher: {
        "@id": `${siteUrl}/#organization`,
      },
      inLanguage: ["es", "en"],
    },
    {
      "@type": "FAQPage",
      "@id": `${siteUrl}/#faq`,
      mainEntity: [
        {
          "@type": "Question",
          name: "¿Qué es Trazzo Whiteboard y para qué sirve?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Trazzo Whiteboard es una pizarra virtual interactiva y herramienta de diagramación basada en la web. Permite crear diagramas de flujo, arquitectura de software, wireframes y bocetos con un acabado natural estilo dibujo a mano alzada directamente en tu navegador.",
          },
        },
        {
          "@type": "Question",
          name: "¿Trazzo Whiteboard es gratuito y necesita registro?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Sí, Trazzo Whiteboard es 100% gratuito y no requiere ningún tipo de registro ni inicio de sesión. Puedes abrir la aplicación y comenzar a dibujar o diagramar de inmediato.",
          },
        },
        {
          "@type": "Question",
          name: "¿Cómo protege Trazzo Whiteboard la privacidad de mis datos y diagramas?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Trazzo Whiteboard funciona con almacenamiento 100% local en el navegador del usuario (LocalStorage e IndexedDB). Tus diagramas nunca se transmiten ni almacenan en servidores externos, garantizando privacidad absoluta.",
          },
        },
        {
          "@type": "Question",
          name: "¿Qué opciones de exportación ofrece Trazzo Whiteboard?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Puedes exportar tus creaciones como imágenes PNG de alta resolución con fondo transparente o sólido, archivos vectoriales SVG escalables, copiar directamente al portapapeles o guardar el archivo nativo .trazzo para editarlo en cualquier momento.",
          },
        },
        {
          "@type": "Question",
          name: "¿Tiene soporte para conectores magnéticos automáticos en diagramas?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Sí, las flechas y líneas en Trazzo Whiteboard se enganchan automáticamente a los puntos de anclaje cardinales (Norte, Sur, Este, Oeste y Centro) de cualquier figura geométrica, manteniéndose unidas al mover o redimensionar los elementos.",
          },
        },
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Caveat:wght@400..700&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased w-screen h-screen overflow-hidden bg-[#fbfbfe] text-neutral-900 transition-colors">
        {/* Hidden font preloader to ensure browser downloads web fonts during HTML parse for Canvas */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            width: 0,
            height: 0,
            overflow: "hidden",
            pointerEvents: "none",
            opacity: 0,
            zIndex: -1,
          }}
        >
          <span style={{ fontFamily: "Caveat" }}>.</span>
          <span style={{ fontFamily: "Inter" }}>.</span>
          <span style={{ fontFamily: "'JetBrains Mono'" }}>.</span>
        </div>
        {children}
      </body>
    </html>
  );
}
