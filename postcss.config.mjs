module.exports = {
  plugins: {
    "@tailwindcss/postcss": {},
    "tw-animate-css": {},
  },
  postcss: {
    discardDuplicates: {
      exclude: ["**/*.animations.css"],
    },
  },
};
