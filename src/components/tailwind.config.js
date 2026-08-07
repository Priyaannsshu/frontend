// tailwind.config.js
module.exports = {
    content: ["./src/**/*.{js,jsx}"],
    theme: {
      extend: {
        animation: {
          blob: 'blob 8s infinite',
          'blob_8s_infinite': 'blob 8s infinite',
          'blob_8s_infinite_2s': 'blob 8s infinite 2s',
        },
        keyframes: {
          blob: {
            '0%, 100%': { transform: 'translate(0px, 0px) scale(1)' },
            '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
            '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          },
        },
      },
    },
    plugins: [],
  };
  