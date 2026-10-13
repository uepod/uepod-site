import { Anton, Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";

/**
 * Same families, weights, and normal styles as the previous Google Fonts
 * stylesheet. next/font hosts the files, preloads them, and size-adjusts the
 * fallback so the first paint already matches the final type.
 */

const anton = Anton({
  weight: "400",
  style: "normal",
  subsets: ["latin"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
  variable: "--font-anton",
});

const inter = Inter({
  weight: ["400", "500", "600", "700", "800"],
  style: "normal",
  subsets: ["latin"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  weight: ["300", "400", "500", "600", "700"],
  style: "normal",
  subsets: ["latin"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
  variable: "--font-space-grotesk",
});

const jetbrainsMono = JetBrains_Mono({
  weight: ["300", "400"],
  style: "normal",
  subsets: ["latin"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
  variable: "--font-jetbrains-mono",
});

const fontVariables = [
  anton.variable,
  inter.variable,
  spaceGrotesk.variable,
  jetbrainsMono.variable,
].join(" ");

export { anton, inter, spaceGrotesk, jetbrainsMono, fontVariables };
