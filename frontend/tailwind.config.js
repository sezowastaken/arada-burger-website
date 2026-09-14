/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#fff9e7", // Paper
        on_surface: "#1e1c10", // Ink
        primary: "#a60002", // Ketchup Red
        secondary: "#845400", // Mustard/Cheese
        surface_container_low: "#f9f4e0",
        surface_container_highest: "#e8e2cf",

        // Added for the admin panel. The public site is a poster; the admin is
        // a tool, and dense data needs a lighter ground and real hairlines than
        // the paper palette alone provides.
        surface_container_lowest: "#fffdf6", // content cards, near-white but still warm
        outline_variant: "#ddd6c1", // hairlines and table rules
        success: "#2f6b3f", // "on the menu", saved
        danger: "#a60002", // destructive intent; same hue as primary, never the same shape
      },
      fontFamily: {
        display: ["var(--font-epilogue)", "sans-serif"],
        body: ["var(--font-manrope)", "sans-serif"],
      },
      borderRadius: {
        'xl': '3rem',
        'lg': '2rem',
      },
      boxShadow: {
        'sticker': '4px 4px 12px rgba(30, 28, 16, 0.1)',
      }
    },
  },
  plugins: [],
};
