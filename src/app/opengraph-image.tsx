import { ImageResponse } from "next/og";

export const runtime = "nodejs";

export const alt = "Trazzo — Pizarra Virtual, Diagramas y Bocetos a Mano Alzada";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0d0f17",
          backgroundImage:
            "radial-gradient(circle at 25px 25px, #1e2235 2%, transparent 0%), radial-gradient(circle at 75px 75px, #1e2235 2%, transparent 0%)",
          backgroundSize: "100px 100px",
          color: "#ffffff",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
          padding: "60px",
        }}
      >
        {/* Glow behind badge */}
        <div
          style={{
            position: "absolute",
            width: "500px",
            height: "300px",
            background: "radial-gradient(ellipse at center, rgba(99, 102, 241, 0.25), transparent 70%)",
            top: "20%",
            filter: "blur(40px)",
          }}
        />

        {/* Brand Icon + Name */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            marginBottom: "28px",
          }}
        >
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "22px",
              background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #8b5cf6 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 10px 25px -5px rgba(99, 102, 241, 0.5)",
            }}
          >
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08" />
              <path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.04 1.5 1.54 6.5 1.5 8.5-0.5 1.5-1.5 1.5-3.5 1.5-3.5" />
              <path d="m14 7 3 3" />
            </svg>
          </div>
          <span
            style={{
              fontSize: "56px",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              background: "linear-gradient(to right, #ffffff, #e0e7ff)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Trazzo
          </span>
        </div>

        {/* Headline */}
        <h1
          style={{
            fontSize: "44px",
            fontWeight: 800,
            textAlign: "center",
            lineHeight: 1.2,
            margin: "0 0 18px 0",
            maxWidth: "960px",
            color: "#f8fafc",
            letterSpacing: "-0.02em",
          }}
        >
          Pizarra Virtual, Diagramas y Bocetos a Mano Alzada
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: "22px",
            color: "#94a3b8",
            textAlign: "center",
            maxWidth: "800px",
            margin: "0 0 36px 0",
            lineHeight: 1.5,
          }}
        >
          Lienzo infinito, diagramas inteligentes, figuras geométricas y dibujo libre.
          100% privado en tu navegador, sin registro y exportación a PNG y SVG.
        </p>

        {/* Feature Badges */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {[
            "⚡ 100% Gratuito y sin registro",
            "🔒 Almacenamiento local privado",
            "📐 Conectores inteligentes",
            "✏️ Boceto orgánico y figuras",
            "💾 Exporta PNG, SVG y .trazzo",
          ].map((feature) => (
            <div
              key={feature}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "10px 18px",
                borderRadius: "9999px",
                backgroundColor: "rgba(255, 255, 255, 0.07)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                fontSize: "15px",
                fontWeight: 600,
                color: "#cbd5e1",
              }}
            >
              {feature}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
