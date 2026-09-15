/**
 * Ostad DZ - PDF Export Color Sanitizer
 * 
 * Fixes html2canvas / jsPDF incompatibility with CSS Color Module 4 (oklch, color-mix, etc.).
 * Converts all oklch/color-mix color values in the cloned export tree and cloned document
 * stylesheets to standard RGB / RGBA / HEX equivalents without modifying the application's
 * original DOM, theme, or stylesheets.
 */

// Cache for converted colors to ensure ultra-fast processing
const colorConversionCache = new Map<string, string>();

let canvasEl: HTMLCanvasElement | null = null;
let ctx2d: CanvasRenderingContext2D | null = null;

/**
 * Resolves any valid CSS color string to an rgb(...) or rgba(...) string
 * using an off-screen 1x1 canvas rendering context in the browser.
 */
function resolveViaCanvas(colorStr: string): string | null {
  if (typeof document === 'undefined') return null;

  try {
    if (!canvasEl) {
      canvasEl = document.createElement('canvas');
      canvasEl.width = 1;
      canvasEl.height = 1;
    }
    if (!ctx2d) {
      ctx2d = canvasEl.getContext('2d', { willReadFrequently: true });
    }
    if (!ctx2d) return null;

    ctx2d.clearRect(0, 0, 1, 1);
    ctx2d.fillStyle = '#000000'; // baseline reset
    ctx2d.fillStyle = colorStr;

    // Fast path: if browser normalized fillStyle to rgb/rgba/#hex
    const serialized = ctx2d.fillStyle;
    if (serialized && !serialized.includes('oklch') && !serialized.includes('color(')) {
      return serialized;
    }

    // High-precision pixel rasterization fallback
    ctx2d.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx2d.getImageData(0, 0, 1, 1).data;
    if (a === 255) {
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      const alpha = +(a / 255).toFixed(3);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
  } catch {
    return null;
  }
}

/**
 * Mathematical fallback converting OKLCH (L, C, H, A) to standard sRGB.
 * Follows the W3C CSS Color Module Level 4 specification:
 * Polar OKLCH -> Cartesian Oklab -> LMS -> Linear sRGB -> Gamma-compressed sRGB
 */
export function oklchToRgbMath(
  lStr: string, 
  cStr: string, 
  hStr?: string, 
  aStr?: string
): string {
  let L = lStr.endsWith('%') ? parseFloat(lStr) / 100 : parseFloat(lStr);
  let C = cStr.endsWith('%') ? (parseFloat(cStr) / 100) * 0.4 : parseFloat(cStr);
  let H = parseFloat(hStr || '0') || 0;
  
  if (hStr) {
    if (hStr.endsWith('rad')) H = (H * 180) / Math.PI;
    else if (hStr.endsWith('turn')) H = H * 360;
  }

  let A = 1;
  if (aStr !== undefined && aStr !== null && aStr !== '') {
    A = aStr.endsWith('%') ? parseFloat(aStr) / 100 : parseFloat(aStr);
  }

  // Polar to rectangular Oklab
  const hRad = (H * Math.PI) / 180;
  const ok_a = C * Math.cos(hRad);
  const ok_b = C * Math.sin(hRad);

  // Oklab to LMS
  const l_ = L + 0.3963377774 * ok_a + 0.2158037573 * ok_b;
  const m_ = L - 0.1055613458 * ok_a - 0.0638541728 * ok_b;
  const s_ = L - 0.0894841775 * ok_a - 1.2914855480 * ok_b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  // LMS to linear sRGB
  const r_lin = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g_lin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const b_lin = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

  const toSrgb = (x: number) => {
    const clamped = Math.max(0, Math.min(1, x));
    const comp = clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
    return Math.round(comp * 255);
  };

  const r = toSrgb(r_lin);
  const g = toSrgb(g_lin);
  const b = toSrgb(b_lin);

  if (A < 0.999) {
    return `rgba(${r}, ${g}, ${b}, ${+A.toFixed(3)})`;
  }
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Converts a single OKLCH color token to RGB/RGBA.
 */
export function convertSingleOklch(oklchToken: string): string {
  const cached = colorConversionCache.get(oklchToken);
  if (cached) return cached;

  // Try Canvas first for native precision
  const viaCanvas = resolveViaCanvas(oklchToken);
  if (viaCanvas && !viaCanvas.includes('oklch')) {
    colorConversionCache.set(oklchToken, viaCanvas);
    return viaCanvas;
  }

  // Mathematical fallback
  const innerMatch = oklchToken.match(/oklch\s*\(\s*([^)]+)\)/i);
  if (innerMatch && innerMatch[1]) {
    const parts = innerMatch[1].trim().split(/[\s/]+/).filter(Boolean);
    if (parts.length >= 3) {
      const result = oklchToRgbMath(parts[0], parts[1], parts[2], parts[3]);
      colorConversionCache.set(oklchToken, result);
      return result;
    }
  }

  // Safe emergency fallback: dark slate
  return 'rgb(15, 23, 42)';
}

/**
 * Replaces all occurrences of `oklch(...)` or `color-mix(...)` in any CSS string
 * (e.g. background-color, border, box-shadow, linear-gradient, style tags).
 */
export function sanitizeOklchInString(cssString: string): string {
  if (!cssString || typeof cssString !== 'string') return cssString;
  if (!cssString.includes('oklch') && !cssString.includes('color-mix')) {
    return cssString;
  }

  // 1. Replace oklch(...) occurrences
  let result = cssString.replace(/oklch\s*\(\s*[^)]+\)/gi, (match) => {
    return convertSingleOklch(match);
  });

  // 2. Replace any remaining color-mix(in oklch, ...) occurrences
  if (result.includes('color-mix')) {
    result = result.replace(/color-mix\s*\([^;}]+\)/gi, (match) => {
      const viaCanvas = resolveViaCanvas(match);
      if (viaCanvas) return viaCanvas;
      // If unable to parse color-mix, extract any nested rgb/rgba or return neutral
      return 'rgba(0, 0, 0, 0.05)';
    });
  }

  return result;
}

/**
 * List of CSS color properties that html2canvas parses.
 */
const COLOR_PROPERTIES = [
  'color',
  'backgroundColor',
  'borderTopColor',
  'borderRightColor',
  'borderBottomColor',
  'borderLeftColor',
  'outlineColor',
  'boxShadow',
  'textShadow',
  'textDecorationColor',
  'fill',
  'stroke',
  'stopColor',
  'backgroundImage',
] as const;

function camelToKebab(str: string): string {
  return str.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}

/**
 * Traverses an element tree and sanitizes all color properties so they use
 * only supported RGB / RGBA / HEX values.
 * 
 * If correspondingOriginal is provided, reads the real computed styles from
 * the live DOM before applying them to the clone.
 */
export function sanitizeElementTreeColors(
  root: HTMLElement, 
  correspondingOriginal?: HTMLElement
): void {
  if (!root || !root.querySelectorAll) return;

  // If root is the tempWrapper, the actual content clone is root.firstElementChild
  const contentRoot = (root.id === 'ostad-pdf-sandbox-wrapper' && root.firstElementChild)
    ? (root.firstElementChild as HTMLElement)
    : root;

  // Always sanitize the wrapper itself
  if (root !== contentRoot) {
    root.style.backgroundColor = '#ffffff';
    root.style.color = '#0f172a';
  }

  const cloneElements = [contentRoot, ...Array.from(contentRoot.querySelectorAll<HTMLElement>('*'))];
  const origElements = correspondingOriginal 
    ? [correspondingOriginal, ...Array.from(correspondingOriginal.querySelectorAll<HTMLElement>('*'))]
    : null;

  for (let i = 0; i < cloneElements.length; i++) {
    const cloneEl = cloneElements[i];
    const origEl = (origElements && origElements[i]) ? origElements[i] : cloneEl;

    // 1. Sanitize style attribute if present
    const inlineStyle = cloneEl.getAttribute('style');
    if (inlineStyle && (inlineStyle.includes('oklch') || inlineStyle.includes('color-mix'))) {
      cloneEl.setAttribute('style', sanitizeOklchInString(inlineStyle));
    }

    // 2. Read computed styles from origEl (or cloneEl)
    try {
      const win = origEl.ownerDocument?.defaultView || window;
      const computed = win.getComputedStyle(origEl);

      for (const prop of COLOR_PROPERTIES) {
        const val = (computed as any)[prop];
        if (val && typeof val === 'string' && (val.includes('oklch') || val.includes('color-mix'))) {
          const sanitized = sanitizeOklchInString(val);
          cloneEl.style.setProperty(camelToKebab(prop), sanitized, 'important');
        }
      }
    } catch {
      // Ignore if element is disconnected
    }

    // 3. For SVG elements, check fill/stroke attributes directly
    if (cloneEl.tagName.toLowerCase() === 'svg' || cloneEl.closest('svg')) {
      for (const attr of ['fill', 'stroke', 'stop-color']) {
        const attrVal = cloneEl.getAttribute(attr);
        if (attrVal && (attrVal.includes('oklch') || attrVal.includes('color-mix'))) {
          cloneEl.setAttribute(attr, sanitizeOklchInString(attrVal));
        }
      }
    }
  }
}

/**
 * Prepares the cloned document inside html2canvas's onclone callback.
 * 
 * Replaces any oklch(...) in all `<style>` elements and stylesheets,
 * injects CSS variable overrides, and sanitizes all elements in the cloned document.
 */
export function sanitizeClonedDocument(clonedDoc: Document, clonedRoot: HTMLElement): void {
  // 1. Replace all oklch in all <style> elements
  try {
    const styleTags = Array.from(clonedDoc.querySelectorAll('style'));
    styleTags.forEach((st) => {
      const css = st.textContent || st.innerHTML || '';
      if (css && (css.includes('oklch') || css.includes('color-mix'))) {
        const sanitized = sanitizeOklchInString(css);
        st.textContent = sanitized;
        // Also create a fresh replacement style tag to force DOM re-parse in cloned iframe
        const freshStyle = clonedDoc.createElement('style');
        if (st.id) freshStyle.id = st.id;
        freshStyle.textContent = sanitized;
        st.parentNode?.replaceChild(freshStyle, st);
      }
    });
  } catch (err) {
    console.warn('Could not sanitize style elements:', err);
  }

  // 1b. Sanitize live CSSStyleSheets if accessible
  try {
    const docSheets = Array.from(clonedDoc.styleSheets || []);
    for (const sheet of docSheets) {
      try {
        const rules = Array.from(sheet.cssRules || []);
        for (let i = 0; i < rules.length; i++) {
          const rule = rules[i];
          if (rule.cssText && (rule.cssText.includes('oklch') || rule.cssText.includes('color-mix'))) {
            const sanitized = sanitizeOklchInString(rule.cssText);
            try {
              sheet.deleteRule(i);
              sheet.insertRule(sanitized, i);
            } catch {}
          }
        }
      } catch {}
    }
  } catch {}

  // 2. Inline and sanitize same-origin <link rel="stylesheet">
  try {
    const linkTags = Array.from(clonedDoc.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'));
    for (const link of linkTags) {
      const href = link.getAttribute('href');
      if (href && !href.startsWith('http')) {
        const sheet = Array.from(document.styleSheets).find((s) => s.href && s.href.includes(href));
        if (sheet) {
          try {
            const rules = Array.from(sheet.cssRules || []).map((r) => r.cssText).join('\n');
            if (rules.includes('oklch') || rules.includes('color-mix')) {
              const styleEl = clonedDoc.createElement('style');
              styleEl.textContent = sanitizeOklchInString(rules);
              link.parentNode?.replaceChild(styleEl, link);
            }
          } catch {}
        }
      }
    }
  } catch {}

  // 3. Inject explicit RGB fallbacks for common Tailwind v4 CSS variables
  try {
    const overrideStyle = clonedDoc.createElement('style');
    overrideStyle.id = 'ostad-pdf-override-rules';
    overrideStyle.textContent = `
      :root {
        --color-slate-50: rgb(248, 250, 252) !important;
        --color-slate-100: rgb(241, 245, 249) !important;
        --color-slate-200: rgb(226, 232, 240) !important;
        --color-slate-300: rgb(203, 213, 225) !important;
        --color-slate-400: rgb(148, 163, 184) !important;
        --color-slate-500: rgb(100, 116, 139) !important;
        --color-slate-600: rgb(71, 85, 105) !important;
        --color-slate-700: rgb(51, 65, 85) !important;
        --color-slate-800: rgb(30, 41, 59) !important;
        --color-slate-900: rgb(15, 23, 42) !important;
        --color-slate-950: rgb(2, 6, 23) !important;

        --color-emerald-50: rgb(236, 253, 245) !important;
        --color-emerald-100: rgb(209, 250, 229) !important;
        --color-emerald-200: rgb(167, 243, 208) !important;
        --color-emerald-500: rgb(16, 185, 129) !important;
        --color-emerald-600: rgb(5, 150, 105) !important;
        --color-emerald-700: rgb(4, 120, 87) !important;
        --color-emerald-800: rgb(6, 95, 70) !important;
        --color-emerald-900: rgb(6, 78, 59) !important;

        --color-rose-50: rgb(255, 241, 242) !important;
        --color-rose-100: rgb(255, 228, 230) !important;
        --color-rose-500: rgb(244, 63, 94) !important;
        --color-rose-600: rgb(225, 29, 72) !important;

        --tw-shadow-color: rgba(0, 0, 0, 0.08) !important;
        --tw-ring-color: rgba(5, 150, 105, 0.4) !important;
        --tw-ring-offset-color: rgb(255, 255, 255) !important;
      }
      *, *::before, *::after {
        --tw-shadow-color: rgba(0, 0, 0, 0.08) !important;
      }
    `;
    clonedDoc.head?.appendChild(overrideStyle);
  } catch {}

  // 4. Sanitize all elements in clonedRoot and clonedDoc.body
  if (clonedRoot) {
    sanitizeElementTreeColors(clonedRoot);
  }
  if (clonedDoc.body) {
    sanitizeElementTreeColors(clonedDoc.body);
  }
}
