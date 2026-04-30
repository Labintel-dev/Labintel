/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        teal: {
          50: '#f0fdfa', 100: '#ccfbf1', 200: '#99f6e4',
          300: '#5eead4', 400: '#2dd4bf', 500: '#14b8a6',
          600: '#0d9488', 700: '#0f766e', 800: '#115e59', 900: '#134e4a',
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        "slide-in": { from: { transform: "translateY(-10px)", opacity: 0 }, to: { transform: "translateY(0)", opacity: 1 } },
        "shake": { "0%, 100%": { transform: "translateX(0)" }, "20%": { transform: "translateX(-8px)" }, "40%": { transform: "translateX(8px)" }, "60%": { transform: "translateX(-8px)" }, "80%": { transform: "translateX(8px)" } },
        "pulse-ring": { "0%": { boxShadow: "0 0 0 0 rgba(13, 148, 136, 0.4)" }, "70%": { boxShadow: "0 0 0 10px rgba(13, 148, 136, 0)" }, "100%": { boxShadow: "0 0 0 0 rgba(13, 148, 136, 0)" } },
        "fade-in": { from: { opacity: 0 }, to: { opacity: 1 } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
        "shake": "shake 0.4s ease-in-out",
        "pulse-ring": "pulse-ring 1.5s ease-in-out infinite",
        "fade-in": "fade-in 0.2s ease-out",
      },
    },
  },
  plugins: [],
}
