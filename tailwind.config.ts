import type { Config } from "tailwindcss";

// Design tokens - inlined here due to Tailwind v4/PostCSS import resolution issues
// These values are also exported from @/lib/design/tokens for use in components
const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  base: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
  '3xl': '64px',
  '4xl': '96px',
} as const;

const borderRadius = {
  none: '0px',
  sm: '4px',
  base: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '32px',
  full: '9999px',
} as const;

const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
} as const;

const animation = {
  duration: {
    fast: '150ms',
    base: '200ms',
    slow: '300ms',
    slower: '500ms',
    slowest: '1000ms',
  },
  timingFunction: {
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
  delay: {
    none: '0ms',
    fast: '50ms',
    base: '100ms',
    slow: '200ms',
  },
} as const;

const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  notification: 1080,
} as const;

const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class", // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        // Primary Marine Corps Colors
        "marine-red": {
          DEFAULT: "#940000",
          dark: "#660000",
        },
        "navy-blue": {
          DEFAULT: "#001e2e",
          dark: "#002a3f",
          light: "#003a56",
        },
        tan: {
          DEFAULT: "#84754E",
          dark: "#6B5F3F",
          light: "#B8A082",
        },
        // Text Colors
        text: {
          primary: {
            light: "#000000",
            dark: "#FFFFFF",
          },
          secondary: {
            light: "#4A5568",
            dark: "#CBD5E0",
          },
          heading: {
            light: "#940000",
            dark: "#FF8E8E",
          },
          link: {
            light: "#940000",
            dark: "#FF8E8E",
          },
          "link-hover": {
            light: "#660000",
            dark: "#FFB3B3",
          },
        },
        // Background Colors
        background: {
          primary: {
            light: "#FFFFFF",
            dark: "#001e2e",
          },
          secondary: {
            light: "#F5F5F5",
            dark: "#002a3f",
          },
          tertiary: {
            light: "#E8E8E8",
            dark: "#003a56",
          },
          header: {
            light: "#001e2e",
            dark: "#000000",
          },
          card: {
            light: "#FFFFFF",
            dark: "#002a3f",
          },
          input: {
            light: "#FFFFFF",
            dark: "#003a56",
          },
        },
        // Border Colors
        border: {
          primary: {
            light: "#CBD5E0",
            dark: "#4A5568",
          },
          secondary: {
            light: "#E2E8F0",
            dark: "#2D3748",
          },
          focus: {
            light: "#940000",
            dark: "#FF8E8E",
          },
          error: {
            light: "#940000",
            dark: "#FF8E8E",
          },
        },
        // Status Colors
        success: "#10B981",
        warning: "#F59E0B",
        error: {
          light: "#940000",
          dark: "#FF8E8E",
        },
        info: {
          light: "#001e2e",
          dark: "#4A9EFF",
        },
        // Button Colors
        button: {
          primary: {
            bg: {
              light: "#940000",
              dark: "#940000",
            },
            text: "#FFFFFF",
            hover: {
              light: "#660000",
              dark: "#FF8E8E",
            },
          },
          secondary: {
            bg: {
              light: "#001e2e",
              dark: "#4A9EFF",
            },
            text: "#FFFFFF",
            hover: {
              light: "#002a3f",
              dark: "#6BB6FF",
            },
          },
          tertiary: {
            bg: {
              light: "#84754E",
              dark: "#B8A082",
            },
            text: {
              light: "#FFFFFF",
              dark: "#000000",
            },
            hover: {
              light: "#6B5F3F",
              dark: "#C9B59A",
            },
          },
        },
      },
      fontFamily: {
        heading: ['Colossalis', 'Georgia', 'serif'],
        body: ['Arial', 'sans-serif'],
        sans: [
          'Arial',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        serif: ['Colossalis', 'Georgia', 'serif'],
      },
      fontSize: {
        h1: "80px",
        h2: "48px",
        h3: "36px",
        h4: "30px",
        h5: "24px",
        h6: "18px",
        body: "18px",
        small: "14px",
        caption: "12px",
      },
      // Design Tokens - Spacing
      spacing: {
        ...spacing,
      },
      // Design Tokens - Border Radius
      borderRadius: {
        ...borderRadius,
      },
      // Design Tokens - Box Shadow
      boxShadow: {
        ...shadows,
      },
      // Design Tokens - Z-Index
      zIndex: {
        ...zIndex,
      },
      // Design Tokens - Animation
      transitionDuration: {
        ...animation.duration,
      },
      transitionTimingFunction: {
        ...animation.timingFunction,
      },
      transitionDelay: {
        ...animation.delay,
      },
      // Design Tokens - Breakpoints
      screens: {
        sm: breakpoints.sm,
        md: breakpoints.md,
        lg: breakpoints.lg,
        xl: breakpoints.xl,
        '2xl': breakpoints['2xl'],
      },
    },
  },
  plugins: [],
};
export default config;
