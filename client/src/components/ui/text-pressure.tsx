import { useEffect, useRef, useState, useMemo, useCallback } from 'react';

const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
};

const getAttr = (distance: number, maxDist: number, minVal: number, maxVal: number) => {
  const val = maxVal - Math.abs((maxVal * distance) / maxDist);
  return Math.max(minVal, val + minVal);
};

const debounce = (func: (...args: any[]) => void, delay: number) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
};

interface TextPressureProps {
  text?: string;
  fontFamily?: string;
  fontUrl?: string;
  width?: boolean;
  weight?: boolean;
  italic?: boolean;
  alpha?: boolean;
  flex?: boolean;
  stroke?: boolean;
  scale?: boolean;
  textColor?: string;
  strokeColor?: string;
  className?: string;
  minFontSize?: number;
  shine?: boolean;
}

export default function TextPressure({
  text = 'Compressa',
  fontFamily = 'Roboto Flex',
  fontUrl = 'https://fonts.googleapis.com/css2?family=Roboto+Flex:opsz,wdth,wght@8..144,25..151,100..1000&display=swap',

  width = true,
  weight = true,
  italic = true,
  alpha = false,

  flex = true,
  stroke = false,
  scale = false,

  textColor = '#FFFFFF',
  strokeColor = '#FF0000',
  className = '',

  minFontSize = 24,
  shine = false
}: TextPressureProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const spansRef = useRef<(HTMLSpanElement | null)[]>([]);

  const mouseRef = useRef({ x: 0, y: 0 });
  const cursorRef = useRef({ x: 0, y: 0 });
  const isHovered = useRef(false);

  const [fontSize, setFontSize] = useState(minFontSize);
  const [scaleY, setScaleY] = useState(1);
  const [lineHeight, setLineHeight] = useState(1);

  const chars = text.split('');

  // Keep track of current variation values for each span to animate smoothly
  const currentValues = useRef<{ wght: number; wdth: number; ital: number }[]>([]);

  useEffect(() => {
    currentValues.current = chars.map(() => ({
      wght: 400,
      wdth: 100,
      ital: 0
    }));
  }, [text]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      cursorRef.current.x = e.clientX;
      cursorRef.current.y = e.clientY;
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      const t = e.touches[0];
      cursorRef.current.x = t.clientX;
      cursorRef.current.y = t.clientY;
    };

    const handlePointerEnter = () => {
      isHovered.current = true;
    };
    const handlePointerLeave = () => {
      isHovered.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('pointerenter', handlePointerEnter);
    container.addEventListener('pointerleave', handlePointerLeave);

    const { left, top, width: w, height: h } = container.getBoundingClientRect();
    mouseRef.current.x = left + w / 2;
    mouseRef.current.y = top + h / 2;
    cursorRef.current.x = mouseRef.current.x;
    cursorRef.current.y = mouseRef.current.y;

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('pointerenter', handlePointerEnter);
      container.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, []);

  const setSize = useCallback(() => {
    if (!containerRef.current || !titleRef.current) return;

    const { width: containerW, height: containerH } = containerRef.current.getBoundingClientRect();

    let newFontSize = containerW / (chars.length / 2);
    newFontSize = Math.max(newFontSize, minFontSize);

    setFontSize(newFontSize);
    setScaleY(1);
    setLineHeight(1);

    requestAnimationFrame(() => {
      if (!titleRef.current) return;
      const textRect = titleRef.current.getBoundingClientRect();

      if (scale && textRect.height > 0) {
        const yRatio = containerH / textRect.height;
        setScaleY(yRatio);
        setLineHeight(yRatio);
      }
    });
  }, [chars.length, minFontSize, scale]);

  useEffect(() => {
    const debouncedSetSize = debounce(setSize, 100);
    debouncedSetSize();
    window.addEventListener('resize', debouncedSetSize);
    return () => window.removeEventListener('resize', debouncedSetSize);
  }, [setSize]);

  useEffect(() => {
    let rafId: number;
    const animate = () => {
      // Lerp mouse coordinates smoothly
      mouseRef.current.x += (cursorRef.current.x - mouseRef.current.x) / 15;
      mouseRef.current.y += (cursorRef.current.y - mouseRef.current.y) / 15;

      if (titleRef.current) {
        const titleRect = titleRef.current.getBoundingClientRect();
        const maxDist = titleRect.width / 2;

        spansRef.current.forEach((span, i) => {
          if (!span) return;

          let targetWdth = 100;
          let targetWght = 400;
          let targetItal = 0;

          // If currently hovering, calculate target variations based on proximity
          if (isHovered.current) {
            const rect = span.getBoundingClientRect();
            const charCenter = {
              x: rect.x + rect.width / 2,
              y: rect.y + rect.height / 2
            };

            const d = dist(mouseRef.current, charCenter);

            targetWdth = width ? Math.floor(getAttr(d, maxDist, 25, 151)) : 100;
            targetWght = weight ? Math.floor(getAttr(d, maxDist, 100, 1000)) : 400;
            targetItal = italic ? parseFloat(getAttr(d, maxDist, 0, 1).toFixed(2)) : 0;
          }

          // Smoothly interpolate current values to target values
          if (!currentValues.current[i]) {
            currentValues.current[i] = { wght: 400, wdth: 100, ital: 0 };
          }
          const curr = currentValues.current[i];
          curr.wdth += (targetWdth - curr.wdth) * 0.1;
          curr.wght += (targetWght - curr.wght) * 0.1;
          curr.ital += (targetItal - curr.ital) * 0.1;

          const wght = Math.round(curr.wght);
          const wdth = Math.round(curr.wdth);
          const italVal = curr.ital.toFixed(2);

          const newFontVariationSettings = `'wght' ${wght}, 'wdth' ${wdth}, 'ital' ${italVal}`;

          if (span.style.fontVariationSettings !== newFontVariationSettings) {
            span.style.fontVariationSettings = newFontVariationSettings;
          }
        });
      }

      rafId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(rafId);
  }, [width, weight, italic]);

  const styleElement = useMemo(() => {
    const shineStyles = shine ? `
      @keyframes textShine {
        0% {
          background-position: 200% center;
        }
        100% {
          background-position: -200% center;
        }
      }

      .text-shine {
        background: linear-gradient(
          110deg,
          ${textColor} 30%,
          #00f0ff 46%,
          #ffffff 50%,
          #00f0ff 54%,
          ${textColor} 70%
        );
        background-size: 200% auto;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        animation: textShine 6s linear infinite;
      }
    ` : '';

    return (
      <style>{`
        @import url('${fontUrl}');

        .flex-pressure {
          display: flex;
          justify-content: space-between;
        }

        .stroke span {
          position: relative;
          color: ${textColor};
        }
        .stroke span::after {
          content: attr(data-char);
          position: absolute;
          left: 0;
          top: 0;
          color: transparent;
          z-index: -1;
          -webkit-text-stroke-width: 3px;
          -webkit-text-stroke-color: ${strokeColor};
        }

        ${shine ? '' : `
          .text-pressure-title {
            color: ${textColor};
          }
        `}

        ${shineStyles}
      `}</style>
    );
  }, [fontFamily, fontUrl, textColor, strokeColor, shine]);

  const dynamicClassName = [
    className, 
    flex ? 'flex-pressure' : '', 
    stroke ? 'stroke' : '',
    shine ? 'text-shine' : ''
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: 'transparent'
      }}
    >
      {styleElement}
      <h1
        ref={titleRef}
        className={`text-pressure-title ${dynamicClassName}`}
        style={{
          fontFamily,
          textTransform: 'uppercase',
          fontSize: `${fontSize}px`,
          lineHeight,
          transform: `scale(1, ${scaleY})`,
          transformOrigin: 'center top',
          margin: 0,
          textAlign: 'center',
          userSelect: 'none',
          whiteSpace: 'nowrap',
          fontWeight: 100,
          width: '100%'
        }}
      >
        {chars.map((char, i) => (
          <span
            key={i}
            ref={el => {
              spansRef.current[i] = el;
            }}
            data-char={char}
            style={{
              display: 'inline-block',
              color: stroke ? undefined : (shine ? 'inherit' : textColor)
            }}
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
        ))}
      </h1>
    </div>
  );
}
