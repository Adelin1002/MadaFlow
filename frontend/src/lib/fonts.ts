import localFont from "next/font/local";

/**
 * Archivo (variable, axes wght + wdth) auto-hébergée depuis le mirror GitHub
 * de Google Fonts (raw.githubusercontent.com/google/fonts, licence OFL —
 * voir src/assets/fonts/OFL.txt). next/font/local plutôt que next/font/google
 * car fonts.googleapis.com/fonts.gstatic.com ne sont pas joignables dans cet
 * environnement de génération (voir README, section "Limites connues").
 */
export const archivo = localFont({
  src: [
    { path: "../assets/fonts/Archivo-Variable.ttf", style: "normal" },
    { path: "../assets/fonts/Archivo-Italic-Variable.ttf", style: "italic" },
  ],
  variable: "--font-archivo",
  display: "swap",
});
