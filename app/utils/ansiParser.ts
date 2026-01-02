/**
 * Parse ANSI escape codes and convert to HTML spans with inline styles
 * Supports:
 * - Reset: \x1b[0m
 * - Basic colors: \x1b[30-37m (foreground), \x1b[40-47m (background)
 * - RGB colors: \x1b[38;2;R;G;Bm (foreground), \x1b[48;2;R;G;Bm (background)
 * - Bold: \x1b[1m
 */

const BASIC_COLORS: Record<number, string> = {
	30: '#000000', // Black
	31: '#ff5555', // Red
	32: '#55ff55', // Green
	33: '#ffff55', // Yellow
	34: '#5555ff', // Blue
	35: '#ff55ff', // Magenta
	36: '#55ffff', // Cyan
	37: '#ffffff', // White
	90: '#555555', // Bright Black
	91: '#ff5555', // Bright Red
	92: '#55ff55', // Bright Green
	93: '#ffff55', // Bright Yellow
	94: '#5555ff', // Bright Blue
	95: '#ff55ff', // Bright Magenta
	96: '#55ffff', // Bright Cyan
	97: '#ffffff', // Bright White
}

const BASIC_BG_COLORS: Record<number, string> = {
	40: '#000000',
	41: '#aa0000',
	42: '#00aa00',
	43: '#aa5500',
	44: '#0000aa',
	45: '#aa00aa',
	46: '#00aaaa',
	47: '#aaaaaa',
}

interface AnsiState {
	color: string | null
	bgColor: string | null
	bold: boolean
}

export function parseAnsiToHtml(text: string): string {
	// Escape HTML entities first
	let escaped = text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')

	// Match ANSI escape sequences (both \x1b and actual escape character)
	// The pattern matches: ESC [ (params) m
	const ansiRegex = /\x1b\[([0-9;]*)m|\[([0-9;]*)m/g

	let result = ''
	let lastIndex = 0
	let state: AnsiState = { color: null, bgColor: null, bold: false }
	let isOpen = false

	let match
	while ((match = ansiRegex.exec(escaped)) !== null) {
		// Add text before this escape sequence
		const textBefore = escaped.slice(lastIndex, match.index)
		if (textBefore) {
			if (!isOpen && (state.color || state.bgColor || state.bold)) {
				result += buildOpenTag(state)
				isOpen = true
			}
			result += textBefore
		}

		// Parse the escape code
		const codes = (match[1] || match[2] || '0').split(';').map(Number)

		let i = 0
		while (i < codes.length) {
			const code = codes[i]

			if (code === 0) {
				// Reset
				if (isOpen) {
					result += '</span>'
					isOpen = false
				}
				state = { color: null, bgColor: null, bold: false }
			} else if (code === 1) {
				// Bold
				if (isOpen) {
					result += '</span>'
					isOpen = false
				}
				state.bold = true
			} else if (code >= 30 && code <= 37 || code >= 90 && code <= 97) {
				// Basic foreground color
				if (isOpen) {
					result += '</span>'
					isOpen = false
				}
				state.color = BASIC_COLORS[code] || null
			} else if (code >= 40 && code <= 47) {
				// Basic background color
				if (isOpen) {
					result += '</span>'
					isOpen = false
				}
				state.bgColor = BASIC_BG_COLORS[code] || null
			} else if (code === 38 && codes[i + 1] === 2) {
				// RGB foreground: 38;2;R;G;B
				if (isOpen) {
					result += '</span>'
					isOpen = false
				}
				const r = codes[i + 2] || 0
				const g = codes[i + 3] || 0
				const b = codes[i + 4] || 0
				state.color = `rgb(${r},${g},${b})`
				i += 4
			} else if (code === 48 && codes[i + 1] === 2) {
				// RGB background: 48;2;R;G;B
				if (isOpen) {
					result += '</span>'
					isOpen = false
				}
				const r = codes[i + 2] || 0
				const g = codes[i + 3] || 0
				const b = codes[i + 4] || 0
				state.bgColor = `rgb(${r},${g},${b})`
				i += 4
			}
			i++
		}

		lastIndex = ansiRegex.lastIndex
	}

	// Add remaining text
	const remaining = escaped.slice(lastIndex)
	if (remaining) {
		if (!isOpen && (state.color || state.bgColor || state.bold)) {
			result += buildOpenTag(state)
			isOpen = true
		}
		result += remaining
	}

	if (isOpen) {
		result += '</span>'
	}

	return result
}

function buildOpenTag(state: AnsiState): string {
	const styles: string[] = []

	if (state.color) {
		styles.push(`color:${state.color}`)
	}
	if (state.bgColor) {
		styles.push(`background-color:${state.bgColor}`)
	}
	if (state.bold) {
		styles.push('font-weight:bold')
	}

	if (styles.length === 0) return ''
	return `<span style="${styles.join(';')}">`
}
