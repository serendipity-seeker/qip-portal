import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

const defaultMeta = {
  title: "Qubic ICO Portal | Qubic Initial Coin Offering platform",
  description:
    "Launch and participate in token offerings on the Qubic network. Qubic ICO Portal provides a secure, transparent platform for Qubic-based ICOs and token sales.",
  image: "/qipdazzle.png",
  url: "https://qubicico.com",
  type: "website",
};

export default function SEO({ title, description, image, url, type }: SEOProps) {
  const meta = {
    title: title ? `${title} | Qubic ICO Portal` : defaultMeta.title,
    description: description || defaultMeta.description,
    image: image || defaultMeta.image,
    url: url || defaultMeta.url,
    type: type || defaultMeta.type,
  };

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{meta.title}</title>
      <meta name="title" content={meta.title} />
      <meta name="description" content={meta.description} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={meta.type} />
      <meta property="og:url" content={meta.url} />
      <meta property="og:title" content={meta.title} />
      <meta property="og:description" content={meta.description} />
      <meta property="og:image" content={meta.image} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={meta.url} />
      <meta name="twitter:title" content={meta.title} />
      <meta name="twitter:description" content={meta.description} />
      <meta name="twitter:image" content={meta.image} />

      {/* Canonical URL */}
      <link rel="canonical" href={meta.url} />
    </Helmet>
  );
}
