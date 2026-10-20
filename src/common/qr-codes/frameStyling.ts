import type { Options } from 'qr-code-styling';

export type FrameStyling = {
  enabled: boolean;
  shape: 'square' | 'circle';
  color?: string;
  topText: string;
  bottomText: string;
};

export const defaultFrameStyling: FrameStyling = {
  enabled: false,
  shape: 'square',
  topText: '',
  bottomText: '',
};

const appendSvg = (parent: Element, tag: string, attributes: Record<string, string | number>) => {
  const node = parent.ownerDocument.createElementNS('http://www.w3.org/2000/svg', tag);
  Object.entries(attributes).forEach(([name, value]) => node.setAttribute(name, String(value)));
  parent.appendChild(node);
  return node;
};

export const drawFrame = (svg: SVGElement, options: Options, frame: FrameStyling, moduleCount: number) => {
  const width = options.width ?? 300;
  const height = options.height ?? 300;
  const margin = options.margin ?? 0;
  const minSize = Math.min(width, height) - 2 * margin;
  const moduleWidth = (frame.shape === 'circle' ? minSize / Math.SQRT2 : minSize) / moduleCount;
  const moduleSize = options.dotsOptions?.roundSize === false ? moduleWidth : Math.floor(moduleWidth);
  if (moduleSize <= 0) {
    return;
  }

  const centerX = width / 2;
  const centerY = height / 2;
  const extent = frame.shape === 'circle' ? minSize / 2 : (moduleCount * moduleSize) / 2;
  const gap = Math.max(4 * moduleSize, margin);
  const borderRadius = extent + gap + moduleSize / 2;
  const outerExtent = extent + gap + moduleSize;
  const fontSize = moduleSize * 2;
  const textGap = moduleSize;
  const topText = frame.topText.slice(0, 20);
  const bottomText = frame.bottomText.slice(0, 20);
  const textSpace = topText || bottomText ? textGap + fontSize * 1.2 : 0;
  const scale = Math.min(width, height) / (2 * (outerExtent + textSpace + moduleSize));
  const background = svg.querySelector('rect[clip-path*="clip-path-background-color-"]');
  const defs = svg.querySelector('defs')!;
  const dotPaint = svg.querySelector('rect[clip-path*="clip-path-dot-color-"]')!;
  const color = frame.color ?? dotPaint.getAttribute('fill')!;
  const content = appendSvg(svg, 'g', {
    'data-qr-frame-content': '',
    transform: `translate(${centerX * (1 - scale)} ${centerY * (1 - scale)}) scale(${scale})`,
  });
  // Keep the background full size while fitting the code, quiet space, frame, and labels into the requested image.
  Array.from(svg.children).forEach((child) => {
    if (child !== defs && child !== background && child !== content) {
      content.appendChild(child);
    }
  });

  const border = { fill: 'none', stroke: color, 'stroke-width': moduleSize, 'data-qr-frame': frame.shape };
  if (frame.shape === 'circle') {
    appendSvg(content, 'circle', { ...border, cx: centerX, cy: centerY, r: borderRadius });
  } else {
    appendSvg(content, 'rect', {
      ...border,
      x: centerX - borderRadius,
      y: centerY - borderRadius,
      width: 2 * borderRadius,
      height: 2 * borderRadius,
    });
  }

  const addText = (value: string, position: 'top' | 'bottom') => {
    if (!value) {
      return;
    }
    const text = appendSvg(content, 'text', {
      fill: color,
      'font-size': fontSize,
      'font-family': 'Arial, sans-serif',
      'font-weight': 600,
      'text-anchor': 'middle',
      'data-qr-frame-text': position,
    });
    if (frame.shape === 'square') {
      text.setAttribute('x', String(centerX));
      text.setAttribute(
        'y',
        String(position === 'top' ? centerY - outerExtent - textGap : centerY + outerExtent + textGap + fontSize),
      );
      text.textContent = value;
      return;
    }

    const radius = outerExtent + textGap + (position === 'bottom' ? fontSize : 0);
    const id = `${defs.querySelector('[id]')!.id}-frame-${position}`;
    appendSvg(defs, 'path', {
      id,
      d: `M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 ${position === 'top' ? 1 : 0} ${centerX + radius} ${centerY}`,
    });
    const path = appendSvg(text, 'textPath', { href: `#${id}`, startOffset: '50%' });
    path.textContent = value;
  };
  addText(topText, 'top');
  addText(bottomText, 'bottom');
};
