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
    default: "Trazzo — Pizarra Virtual Gratuita y Diagramas en Línea",
    template: "%s | Trazzo",
  },
  description:
    "Pizarra virtual interactiva y herramienta de diagramación en tu navegador para crear diagramas de flujo, arquitectura de software, wireframes y bocetos a mano alzada. 100% gratuita, almacenamiento local privado y sin registro.",
  keywords: [
    "pizarra virtual",
    "pizarra virtual online",
    "diagramas de flujo",
    "diagramas de arquitectura",
    "bocetos a mano alzada",
    "whiteboard online gratis",
    "herramienta de diagramación",
    "wireframes",
    "mapas conceptuales",
    "canvas infinito",
    "pizarra interactiva",
    "pizarra sin registro",
    "conectores inteligentes",
    "dibujo digital",
    "exportar a SVG y PNG",
    "virtual whiteboard",
    "sketch diagram online",
    "trazzo",
  ],
  authors: [{ name: "Trazzo", url: siteUrl }],
  creator: "Trazzo",
  publisher: "Trazzo",
  applicationName: "Trazzo",
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
    title: "Trazzo — Pizarra Virtual Gratuita y Diagramas en Línea",
    description:
      "Crea diagramas de flujo, arquitectura de software, wireframes y bocetos estilo a mano alzada. Rápido, privado, 100% en tu navegador y sin necesidad de registro.",
    url: siteUrl,
    siteName: "Trazzo",
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Trazzo — Pizarra Virtual Gratuita y Diagramas en Línea",
    description:
      "Pizarra virtual para diagramas de flujo, arquitectura y bocetos a mano alzada. 100% privada en tu navegador.",
    creator: "@trazzoapp",
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
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "Trazzo",
      url: siteUrl,
      logo: `${siteUrl}/icon.svg`,
      description:
        "Trazzo es una plataforma libre de pizarra virtual y diagramas interactivos en el navegador.",
    },
    {
      "@type": ["WebApplication", "SoftwareApplication"],
      "@id": `${siteUrl}/#webapp`,
      name: "Trazzo",
      alternateName: ["Trazzo Whiteboard", "Pizarra Trazzo", "Trazzo Pizarra Virtual"],
      url: siteUrl,
      description:
        "Pizarra virtual interactiva y herramienta de diagramación en tu navegador para crear diagramas de flujo, arquitectura de software, wireframes y bocetos con estilo a mano alzada.",
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
        "Lienzo infinito con zoom y paneo continuo",
        "Diagramas con conectores magnéticos inteligentes",
        "Dibujo a mano alzada con estilo boceto natural",
        "Reconocimiento de formas geométricas a mano alzada",
        "Formas geométricas precisas: rectángulos, rombos, elipses, flechas y líneas",
        "Marcos contenedores para organizar vistas y diagramas",
        "Herramienta de selección por lazo y manipulación de capas",
        "Puntero láser interactivo para presentaciones",
        "Exportación a formatos PNG, SVG, portapapeles y archivos .trazzo",
        "Privacidad total con almacenamiento 100% local en tu navegador",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "Trazzo",
      description: "Pizarra virtual interactiva y herramienta de diagramación",
      publisher: {
        "@id": `${siteUrl}/#organization`,
      },
      inLanguage: "es",
    },
    {
      "@type": "FAQPage",
      "@id": `${siteUrl}/#faq`,
      mainEntity: [
        {
          "@type": "Question",
          name: "¿Qué es Trazzo y para qué sirve?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Trazzo es una pizarra virtual interactiva y herramienta de diagramación basada en la web. Permite crear diagramas de flujo, arquitectura de software, wireframes y bocetos con un acabado natural estilo dibujo a mano alzada directamente en tu navegador.",
          },
        },
        {
          "@type": "Question",
          name: "¿Trazzo es gratuito y necesita registro?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Sí, Trazzo es 100% gratuito y no requiere ningún tipo de registro ni inicio de sesión. Puedes abrir la aplicación y comenzar a dibujar o diagramar de inmediato.",
          },
        },
        {
          "@type": "Question",
          name: "¿Cómo se protegen mis datos y diagramas en Trazzo?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Trazzo funciona con almacenamiento 100% local en el navegador del usuario (LocalStorage e IndexedDB). Tus diagramas nunca se transmiten ni almacenan en servidores externos, garantizando privacidad absoluta.",
          },
        },
        {
          "@type": "Question",
          name: "¿Qué opciones de exportación ofrece Trazzo?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Puedes exportar tus creaciones como imágenes PNG de alta resolución con fondo transparente o sólido, archivos vectoriales SVG escalables, copiar directamente al portapapeles o guardar el archivo nativo .trazzo para editarlo en cualquier momento.",
          },
        },
        {
          "@type": "Question",
          name: "¿Tiene soporte para conectores magnéticos automáticos?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Sí, las flechas y líneas en Trazzo se enganchan automáticamente a los puntos de anclaje cardinales (Norte, Sur, Este, Oeste y Centro) de cualquier figura geométrica, manteniéndose unidas al mover o redimensionar los elementos.",
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased w-screen h-screen overflow-hidden bg-[#fbfbfe] text-neutral-900 transition-colors">
        {children}
      </body>
    </html>
  );
}
