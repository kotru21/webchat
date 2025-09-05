export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "media", // использует системные настройки
  theme: {
    extend: {
      keyframes: {
        "pulse-scale": {
          "0%,100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.1)", opacity: "0.9" },
        },
        highlight: {
          "0%": { backgroundColor: "rgba(59,130,246,0.1)" },
          "70%": { backgroundColor: "rgba(59,130,246,0.1)" },
          "100%": { backgroundColor: "transparent" },
        },
        "chat-in": {
          "0%": { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "chat-out": {
          "0%": { opacity: "1", transform: "translateX(0)" },
          "100%": { opacity: "0", transform: "translateX(-20px)" },
        },
        "header-slide": {
          "0%": { opacity: "0", transform: "translateY(-10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pin-slide-in": {
          "0%": { opacity: "0", transform: "translateY(-20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pin-slide-out": {
          "0%": { opacity: "1", transform: "translateY(0)" },
          "100%": { opacity: "0", transform: "translateY(-20px)" },
        },
        fade: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(.9)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        ripple: {
          "0%": { transform: "scale(1)", opacity: ".4" },
          "100%": { transform: "scale(4)", opacity: "0" },
        },
        "cursor-blink": {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        "pin-animation": {
          "0%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(4px)" },
          "75%": { transform: "translateX(-4px)" },
          "100%": { transform: "translateX(0)" },
        },
        "media-pulse": {
          "0%": { filter: "brightness(1)" },
          "50%": { filter: "brightness(0.85)" },
          "100%": { filter: "brightness(1)" },
        },
        "fade-in-slide-right": {
          "0%": { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "fade-in-slide-left": {
          "0%": { opacity: "0", transform: "translateX(-20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "slide-down-panel": {
          "0%": { maxHeight: "0", opacity: "0" },
          "100%": { maxHeight: "200px", opacity: "1" },
        },
      },
      animation: {
        "pulse-scale": "pulse-scale 2s infinite",
        highlight: "highlight 2s ease-out",
        "chat-in": "chat-in .3s ease-out forwards",
        "chat-out": "chat-out .3s ease-out forwards",
        "header-slide": "header-slide .3s ease-out forwards",
        "pin-in": "pin-slide-in .3s ease-out forwards",
        "pin-out": "pin-slide-out .3s ease-out forwards",
        "pin-shake": "pin-animation .5s ease-in-out",
        fade: "fade .3s ease-out forwards",
        "fade-in": "fade .3s ease-out forwards",
        "slide-up": "slide-up .3s ease-out forwards",
        "scale-in": "scale-in .3s ease-out forwards",
        ripple: "ripple .6s ease-out",
        "cursor-blink": "cursor-blink 1s infinite",
        "media-pulse": "media-pulse 1.2s ease-in-out infinite",
        "fade-in-slide-right": "fade-in-slide-right .3s ease-out forwards",
        "fade-in-slide-left": "fade-in-slide-left .3s ease-out forwards",
        "slide-down-panel": "slide-down-panel .3s ease-out forwards",
      },
    },
  },
  plugins: [
    function ({ addBase, addUtilities }) {
      addBase({
        body: {
          "@apply bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-white":
            {},
        },
        "#root": {
          padding: "0rem !important",
        },
      });

      addUtilities({
        ".scrollbar-thin": {
          "&::-webkit-scrollbar": {
            width: "6px",
            transition: "all 0.3s ease",
          },
          "&::-webkit-scrollbar-track": {
            background: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            "background-color": "rgba(156, 163, 175, 0.5)",
            "border-radius": "3px",
            transition: "background-color 0.3s ease",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            "background-color": "rgba(156, 163, 175, 0.7)",
          },
        },
        ".message-item-base": {
          opacity: "1",
          transform: "translateZ(0)",
          "backface-visibility": "hidden",
        },
        ".highlight-message": {
          animation: "highlight 2s ease-out",
        },
      });
    },
  ],
};
