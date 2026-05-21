import forms from '@tailwindcss/forms';
import containerQueries from '@tailwindcss/container-queries';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "surface-dim": "#d8dade",
        "outline-variant": "#c1c6d7",
        "outline": "#717786",
        "primary-fixed-dim": "#adc6ff",
        "tertiary-fixed": "#ffdbcc",
        "on-tertiary-fixed-variant": "#7c2e00",
        "on-tertiary-fixed": "#351000",
        "surface-container-highest": "#e0e2e6",
        "on-error-container": "#93000a",
        "error-container": "#ffdad6",
        "surface-container-low": "#f2f4f8",
        "error": "#ba1a1a",
        "on-primary-fixed": "#001a41",
        "surface-container-lowest": "#ffffff",
        "on-tertiary": "#ffffff",
        "on-primary-fixed-variant": "#004493",
        "surface-bright": "#f7f9fd",
        "secondary-fixed-dim": "#adc6ff",
        "primary": "#0058bc",
        "on-surface": "#191c1f",
        "on-secondary-container": "#2d4c83",
        "background": "#f7f9fd",
        "inverse-on-surface": "#eff1f5",
        "secondary-container": "#a1befd",
        "surface-tint": "#005bc1",
        "primary-fixed": "#d8e2ff",
        "on-primary": "#ffffff",
        "on-secondary-fixed": "#001a41",
        "primary-container": "#0070eb",
        "on-secondary-fixed-variant": "#26467d",
        "tertiary-container": "#c64f00",
        "surface-container-high": "#e6e8ec",
        "inverse-surface": "#2d3134",
        "on-error": "#ffffff",
        "surface-variant": "#e0e2e6",
        "on-surface-variant": "#414755",
        "tertiary": "#9e3d00",
        "on-tertiary-container": "#fffbff",
        "secondary-fixed": "#d8e2ff",
        "on-secondary": "#ffffff",
        "secondary": "#405e96",
        "surface-container": "#eceef2",
        "on-background": "#191c1f",
        "surface": "#f7f9fd",
        "on-primary-container": "#fefcff",
        "inverse-primary": "#adc6ff",
        "tertiary-fixed-dim": "#ffb595"
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px"
      },
      fontFamily: {
        headline: ["Manrope", "sans-serif"],
        body: ["Inter", "sans-serif"],
        label: ["Inter", "sans-serif"]
      }
    },
  },
  plugins: [
    forms,
    containerQueries,
  ],
}
