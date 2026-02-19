/** @type {import("tailwindcss").Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#1e40af", foreground: "#ffffff" },
        secondary: { DEFAULT: "#f3f4f6", foreground: "#111827" },
      }
    }
  },
  plugins: [require("@tailwindcss/forms")]
};
