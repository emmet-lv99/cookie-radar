/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neon: '#CCFF00', // 우리가 정한 형광색도 tailwind 클래스(bg-neon)로 쓸 수 있게 추가!
      },
    },
  },
  plugins: [],
}
