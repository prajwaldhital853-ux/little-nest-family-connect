import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	fontSize: {
  		h1: 'var(--text-h1)',
  		h2: 'var(--text-h2)',
  		h3: 'var(--text-h3)',
  		h4: 'var(--text-h4)',
  		large: 'var(--text-large)',
  		small: 'var(--text-small)',
  		xs: [
  			'12px',
  			{
  				lineHeight: '16px'
  			}
  		],
  		sm: [
  			'14px',
  			{
  				lineHeight: '20px'
  			}
  		],
  		base: [
  			'16px',
  			{
  				lineHeight: '26px'
  			}
  		],
  		lg: [
  			'18px',
  			{
  				lineHeight: '30px'
  			}
  		],
  		xl: [
  			'20px',
  			{
  				lineHeight: '32px',
  				letterSpacing: '-0.005em'
  			}
  		],
  		'2xl': [
  			'24px',
  			{
  				lineHeight: '34px',
  				letterSpacing: '-0.01em'
  			}
  		],
  		'3xl': [
  			'30px',
  			{
  				lineHeight: '38px',
  				letterSpacing: '-0.012em'
  			}
  		],
  		'4xl': [
  			'40px',
  			{
  				lineHeight: '46px',
  				letterSpacing: '-0.015em'
  			}
  		],
  		'5xl': [
  			'52px',
  			{
  				lineHeight: '57px',
  				letterSpacing: '-0.02em'
  			}
  		],
  		'6xl': [
  			'64px',
  			{
  				lineHeight: '67px',
  				letterSpacing: '-0.022em'
  			}
  		],
  		'7xl': [
  			'76px',
  			{
  				lineHeight: '78px',
  				letterSpacing: '-0.025em'
  			}
  		],
  		'8xl': [
  			'92px',
  			{
  				lineHeight: '92px',
  				letterSpacing: '-0.027em'
  			}
  		],
  		'9xl': [
  			'112px',
  			{
  				lineHeight: '108px',
  				letterSpacing: '-0.03em'
  			}
  		]
  	},
  	extend: {
  		maxWidth: {
  			'page': 'var(--max-page-width)',
  		},
  		fontFamily: {
  			sans: [
  				'var(--font-body)',
  				'Figtree',
  				'sans-serif'
  			],
  			heading: [
  				'var(--font-heading)',
  				'Figtree',
  				'sans-serif'
  			],
  			body: [
  				'var(--font-body)',
  				'Figtree',
  				'sans-serif'
  			],
  			serif: [
  				'ui-serif',
  				'Georgia',
  				'Cambria',
  				'Times New Roman',
  				'Times',
  				'serif'
  			]
  		},
  		colors: {
  			border: 'var(--color-border)',
  			input: 'var(--color-input)',
  			ring: 'var(--color-ring)',
  			background: 'var(--color-background)',
  			foreground: 'var(--color-foreground)',
  			primary: {
  				DEFAULT: 'var(--color-primary)',
  				foreground: 'var(--color-primary-foreground)'
  			},
  			secondary: {
  				DEFAULT: 'var(--color-secondary)',
  				foreground: 'var(--color-secondary-foreground)'
  			},
  			destructive: {
  				DEFAULT: 'var(--color-destructive)',
  				foreground: 'var(--color-destructive-foreground)'
  			},
  			muted: {
  				DEFAULT: 'var(--color-muted)',
  				foreground: 'var(--color-muted-foreground)'
  			},
  			accent: {
  				DEFAULT: 'var(--color-accent)',
  				foreground: 'var(--color-accent-foreground)'
  			},
  			popover: {
  				DEFAULT: 'var(--color-popover)',
  				foreground: 'var(--color-popover-foreground)'
  			},
  			card: {
  				DEFAULT: 'var(--color-card)',
  				foreground: 'var(--color-card-foreground)'
  			},
  			sidebar: {
  				DEFAULT: 'var(--color-sidebar)',
  				foreground: 'var(--color-sidebar-foreground)',
  				primary: 'var(--color-sidebar-primary)',
  				'primary-foreground': 'var(--color-sidebar-primary-foreground)',
  				accent: 'var(--color-sidebar-accent)',
  				'accent-foreground': 'var(--color-sidebar-accent-foreground)',
  				border: 'var(--color-sidebar-border)',
  				ring: 'var(--color-sidebar-ring)'
  			},
  			yellow: {
  				'950': 'rgba(34, 24, 0, 1)',
  				darker: 'rgba(34, 24, 0, 1)',
  				'800': 'rgba(117, 95, 23, 1)',
  				dark: 'rgba(117, 95, 23, 1)',
  				'600': 'rgba(255, 206, 11, 1)',
  				bright: 'rgba(255, 206, 11, 1)',
  				'500': 'rgba(255, 237, 62, 1)',
  				vivid: 'rgba(255, 237, 62, 1)',
  				'300': 'rgba(255, 248, 128, 1)',
  				light: 'rgba(255, 248, 128, 1)',
  				'100': 'rgba(255, 250, 195, 1)',
  				pastel: 'rgba(255, 250, 195, 1)',
  			},
  			orange: {
  				'950': 'rgba(29, 18, 9, 1)',
  				darker: 'rgba(29, 18, 9, 1)',
  				'800': 'rgba(113, 52, 7, 1)',
  				dark: 'rgba(113, 52, 7, 1)',
  				'600': 'rgba(248, 116, 38, 1)',
  				bright: 'rgba(248, 116, 38, 1)',
  				'500': 'rgba(255, 149, 51, 1)',
  				vivid: 'rgba(255, 149, 51, 1)',
  				'300': 'rgba(255, 198, 144, 1)',
  				light: 'rgba(255, 198, 144, 1)',
  				'100': 'rgba(251, 230, 191, 1)',
  				pastel: 'rgba(251, 230, 191, 1)',
  			},
  			red: {
  				'950': 'rgba(33, 5, 5, 1)',
  				darker: 'rgba(33, 5, 5, 1)',
  				'800': 'rgba(121, 1, 0, 1)',
  				dark: 'rgba(121, 1, 0, 1)',
  				'600': 'rgba(216, 32, 32, 1)',
  				bright: 'rgba(216, 32, 32, 1)',
  				'500': 'rgba(255, 90, 80, 1)',
  				vivid: 'rgba(255, 90, 80, 1)',
  				'300': 'rgba(255, 142, 141, 1)',
  				light: 'rgba(255, 142, 141, 1)',
  				'100': 'rgba(255, 198, 198, 1)',
  				pastel: 'rgba(255, 198, 198, 1)',
  			},
  			pink: {
  				'950': 'rgba(36, 3, 24, 1)',
  				darker: 'rgba(36, 3, 24, 1)',
  				'800': 'rgba(112, 10, 75, 1)',
  				dark: 'rgba(112, 10, 75, 1)',
  				'600': 'rgba(200, 37, 140, 1)',
  				bright: 'rgba(200, 37, 140, 1)',
  				'500': 'rgba(255, 80, 191, 1)',
  				vivid: 'rgba(255, 80, 191, 1)',
  				'300': 'rgba(246, 151, 212, 1)',
  				light: 'rgba(246, 151, 212, 1)',
  				'100': 'rgba(251, 203, 234, 1)',
  				pastel: 'rgba(251, 203, 234, 1)',
  			},
  			purple: {
  				'950': 'rgba(20, 5, 38, 1)',
  				darker: 'rgba(20, 5, 38, 1)',
  				'800': 'rgba(60, 4, 130, 1)',
  				dark: 'rgba(60, 4, 130, 1)',
  				'600': 'rgba(112, 0, 223, 1)',
  				bright: 'rgba(112, 0, 223, 1)',
  				'500': 'rgba(149, 72, 245, 1)',
  				vivid: 'rgba(149, 72, 245, 1)',
  				'300': 'rgba(201, 160, 252, 1)',
  				light: 'rgba(201, 160, 252, 1)',
  				'100': 'rgba(228, 208, 254, 1)',
  				pastel: 'rgba(228, 208, 254, 1)',
  			},
  			blue: {
  				'950': 'rgba(8, 16, 35, 1)',
  				darker: 'rgba(8, 16, 35, 1)',
  				'800': 'rgba(2, 38, 107, 1)',
  				dark: 'rgba(2, 38, 107, 1)',
  				'600': 'rgba(5, 88, 249, 1)',
  				bright: 'rgba(5, 88, 249, 1)',
  				'500': 'rgba(20, 170, 255, 1)',
  				vivid: 'rgba(20, 170, 255, 1)',
  				'300': 'rgba(142, 217, 249, 1)',
  				light: 'rgba(142, 217, 249, 1)',
  				'100': 'rgba(212, 242, 255, 1)',
  				pastel: 'rgba(212, 242, 255, 1)',
  			},
  			green: {
  				'950': 'rgba(8, 29, 4, 1)',
  				darker: 'rgba(8, 29, 4, 1)',
  				'800': 'rgba(17, 108, 3, 1)',
  				dark: 'rgba(17, 108, 3, 1)',
  				'600': 'rgba(34, 172, 0, 1)',
  				bright: 'rgba(34, 172, 0, 1)',
  				'500': 'rgba(140, 255, 96, 1)',
  				vivid: 'rgba(140, 255, 96, 1)',
  				'300': 'rgba(182, 255, 170, 1)',
  				light: 'rgba(182, 255, 170, 1)',
  				'100': 'rgba(225, 255, 209, 1)',
  				pastel: 'rgba(225, 255, 209, 1)',
  			},
  			grey: {
  				'1': 'rgba(252, 252, 252, 1)',
  				'2': 'rgba(248, 248, 248, 1)',
  				'5': 'rgba(242, 242, 242, 1)',
  				'10': 'rgba(230, 230, 230, 1)',
  				'15': 'rgba(217, 217, 217, 1)',
  				'20': 'rgba(204, 204, 204, 1)',
  				'25': 'rgba(191, 191, 191, 1)',
  				'30': 'rgba(179, 179, 179, 1)',
  				'35': 'rgba(166, 166, 166, 1)',
  				'40': 'rgba(153, 153, 153, 1)',
  				'45': 'rgba(140, 140, 140, 1)',
  				'50': 'rgba(128, 128, 128, 1)',
  				'55': 'rgba(115, 115, 115, 1)',
  				'60': 'rgba(102, 102, 102, 1)',
  				'65': 'rgba(89, 89, 89, 1)',
  				'70': 'rgba(77, 77, 77, 1)',
  				'75': 'rgba(64, 64, 64, 1)',
  				'80': 'rgba(51, 51, 51, 1)',
  				'85': 'rgba(38, 38, 38, 1)',
  				'90': 'rgba(26, 26, 26, 1)',
  				'95': 'rgba(18, 18, 18, 1)',
  			},
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
