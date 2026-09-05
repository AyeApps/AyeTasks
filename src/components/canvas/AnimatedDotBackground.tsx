import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Pattern, Rect } from 'react-native-svg';
import { useTheme } from '../../hooks/useTheme';

/**
 * Interactive Web Dot Matrix Canvas
 * Ported 1:1 from AyeVideoDownloader / AyeAppsWeb
 * Continuous diagonal drift, elastic repulsion on cursor/touch, Cyber-Amber particle glow.
 */
const WebInteractiveDots: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const containerRef = useRef<any>(null);
  const canvasRef = useRef<any>(null);
  const isDarkRef = useRef(isDark);

  useEffect(() => {
    isDarkRef.current = isDark;
  }, [isDark]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let isVisible = true;

    // Pointer coordinates relative to container
    const pointer = {
      x: -2000,
      y: -2000,
      active: false,
    };

    // Grid & Physics Configuration (Matching AyeAppsWeb standard)
    const spacing = 28; // Distance between dots
    const baseRadius = 1.3;
    const maxRadius = 2.2; // Subtle expansion on hover/touch
    const hoverRadius = 145; // Reactive influence radius
    const driftSpeedX = 0.0075; // Continuous drifting speed
    const driftSpeedY = 0.0075;

    let dots: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      intensity: number;
    }> = [];
    let cols = 0;
    let rows = 0;
    let totalGridW = 0;
    let totalGridH = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;

    const resize = () => {
      if (!container || !canvas) return;
      const rect = container.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      // Calculate grid dimensions with buffer margin for seamless offscreen wrapping
      cols = Math.ceil(width / spacing) + 3;
      rows = Math.ceil(height / spacing) + 3;
      totalGridW = cols * spacing;
      totalGridH = rows * spacing;

      dots = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const initX = c * spacing - spacing;
          const initY = r * spacing - spacing;
          dots.push({
            x: initX,
            y: initY,
            vx: 0,
            vy: 0,
            intensity: 0,
          });
        }
      }
    };

    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(container);

    // Pause animation when off-screen
    const io = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    });
    io.observe(container);

    // Desktop Mouse Tracking
    const handleMouseMove = (e: MouseEvent) => {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      if (
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom &&
        e.clientX >= rect.left &&
        e.clientX <= rect.right
      ) {
        pointer.x = e.clientX - rect.left;
        pointer.y = e.clientY - rect.top;
        pointer.active = true;
      } else {
        pointer.active = false;
        pointer.x = -2000;
        pointer.y = -2000;
      }
    };

    const handleMouseLeave = () => {
      pointer.active = false;
      pointer.x = -2000;
      pointer.y = -2000;
    };

    // Mobile Touch Tracking (Passive to ensure smooth scrolling)
    const handleTouch = (e: TouchEvent) => {
      if (!container || e.touches.length === 0) return;
      const touch = e.touches[0];
      const rect = container.getBoundingClientRect();
      if (
        touch.clientY >= rect.top &&
        touch.clientY <= rect.bottom &&
        touch.clientX >= rect.left &&
        touch.clientX <= rect.right
      ) {
        pointer.x = touch.clientX - rect.left;
        pointer.y = touch.clientY - rect.top;
        pointer.active = true;
      } else {
        pointer.active = false;
      }
    };

    const handleTouchEnd = () => {
      pointer.active = false;
      pointer.x = -2000;
      pointer.y = -2000;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('touchstart', handleTouch, { passive: true });
    window.addEventListener('touchmove', handleTouch, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    const render = (now: number) => {
      if (!isVisible) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      const dark = isDarkRef.current;

      // Cyber-Amber accent colors
      const amberR = dark ? 254 : 230;
      const amberG = dark ? 157 : 138;
      const amberB = dark ? 1 : 0;

      // Neutral dot colors
      const baseAlpha = dark ? 0.085 : 0.075;
      const baseR = dark ? 255 : 0;
      const baseG = dark ? 255 : 0;
      const baseB = dark ? 255 : 0;

      ctx.clearRect(0, 0, width, height);

      // Continuous drifting offset (diagonal movement)
      const driftX = (now * driftSpeedX) % totalGridW;
      const driftY = (now * driftSpeedY) % totalGridH;

      let dotIndex = 0;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const dot = dots[dotIndex];
          dotIndex++;
          if (!dot) continue;

          // 1. Continuous drift calculation with offscreen seamless wrapping
          const rawX = ((c * spacing + driftX) % totalGridW) - spacing;
          const rawY = ((r * spacing + driftY) % totalGridH) - spacing;

          // Reset physics smoothly when wrapped offscreen
          if (Math.abs(rawX - dot.x) > spacing * 3) {
            dot.x = rawX;
            dot.vx = 0;
          }
          if (Math.abs(rawY - dot.y) > spacing * 3) {
            dot.y = rawY;
            dot.vy = 0;
          }

          let targetX = rawX;
          let targetY = rawY;
          let targetIntensity = 0;

          // 2. Immediate physical repulsion and lighting from pointer (mouse/touch)
          if (pointer.active) {
            const dx = dot.x - pointer.x;
            const dy = dot.y - pointer.y;
            const distSq = dx * dx + dy * dy;

            if (distSq < hoverRadius * hoverRadius) {
              const dist = Math.sqrt(distSq);
              const ratio = 1 - dist / hoverRadius; // 0 to 1

              // Elastic displacement (pushes dots outward from pointer)
              const force = Math.pow(ratio, 1.5) * 22;
              const angle = Math.atan2(dy, dx);

              targetX += Math.cos(angle) * force;
              targetY += Math.sin(angle) * force;

              // Dynamic lighting on cursor/touch location
              targetIntensity = Math.pow(ratio, 1.2);
            }
          }

          // Spring dynamics (recovers resting drifting position)
          const springX = (targetX - dot.x) * 0.16;
          const springY = (targetY - dot.y) * 0.16;

          dot.vx = (dot.vx + springX) * 0.78;
          dot.vy = (dot.vy + springY) * 0.78;

          dot.x += dot.vx;
          dot.y += dot.vy;

          // Lighting transition (fast reaction, smooth gradual release)
          if (targetIntensity > dot.intensity) {
            dot.intensity += (targetIntensity - dot.intensity) * 0.4;
          } else {
            dot.intensity += (targetIntensity - dot.intensity) * 0.065;
          }

          const currentIntensity = dot.intensity;

          if (currentIntensity > 0.02) {
            // Reactive illuminated state (Cyber-Amber)
            const currentRadius = baseRadius + (maxRadius - baseRadius) * currentIntensity;
            const alpha = baseAlpha + (1 - baseAlpha) * currentIntensity;

            ctx.beginPath();
            ctx.arc(dot.x, dot.y, currentRadius, 0, Math.PI * 2);

            const red = Math.round(baseR + (amberR - baseR) * currentIntensity);
            const green = Math.round(baseG + (amberG - baseG) * currentIntensity);
            const blue = Math.round(baseB + (amberB - baseB) * currentIntensity);

            ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, ${alpha.toFixed(3)})`;

            if (currentIntensity > 0.3) {
              ctx.shadowColor = `rgba(${amberR}, ${amberG}, ${amberB}, ${(currentIntensity * 0.6).toFixed(2)})`;
              ctx.shadowBlur = 6 * currentIntensity;
            } else {
              ctx.shadowBlur = 0;
            }

            ctx.fill();
          } else {
            // Continuous moving baseline dot
            ctx.beginPath();
            ctx.arc(dot.x, dot.y, baseRadius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${baseR}, ${baseG}, ${baseB}, ${baseAlpha})`;
            ctx.shadowBlur = 0;
            ctx.fill();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('touchstart', handleTouch);
      window.removeEventListener('touchmove', handleTouch);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 0,
      }}
    >
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
};

const GRID_SIZE = 32;
const DOT_RADIUS = 1.5;
const DURATION_MS = 5000;

export const AnimatedDotBackground: React.FC = () => {
  const { colors, isDark } = useTheme();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const loop = Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: DURATION_MS,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    loop.start();
    return () => loop.stop();
  }, [anim]);

  if (Platform.OS === 'web') {
    return <WebInteractiveDots isDark={isDark} />;
  }

  const dotColor = colors.gridDotColor || (isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.14)');

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, GRID_SIZE],
  });

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, GRID_SIZE],
  });

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.nativeContainer]}>
      <Animated.View
        style={[
          styles.svgWrapper,
          {
            transform: [{ translateX }, { translateY }],
          },
        ]}
      >
        <Svg width="100%" height="100%">
          <Defs>
            <Pattern
              id="ayetasks-dot-grid"
              width={GRID_SIZE}
              height={GRID_SIZE}
              patternUnits="userSpaceOnUse"
            >
              <Circle
                cx={GRID_SIZE / 2}
                cy={GRID_SIZE / 2}
                r={DOT_RADIUS}
                fill={dotColor}
              />
            </Pattern>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#ayetasks-dot-grid)" />
        </Svg>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  nativeContainer: {
    overflow: 'hidden',
    zIndex: 0,
  },
  svgWrapper: {
    width: '120%',
    height: '120%',
    position: 'absolute',
    top: -GRID_SIZE,
    left: -GRID_SIZE,
  },
});
