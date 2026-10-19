import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : null;

const nextConfig: NextConfig = {
  images: {
    // Fotos de producto que sube el panel a Supabase Storage
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }]
      : [],
  },
  experimental: {
    // El formulario de producto envía las fotos (hasta 5 MB c/u) junto con los datos
    serverActions: { bodySizeLimit: "20mb" },
  },
};

export default nextConfig;
