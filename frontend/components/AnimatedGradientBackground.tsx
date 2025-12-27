'use client';

import { useEffect, useRef } from 'react';

export default function AnimatedGradientBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Animation parameters
    let animationId: number;
    let time = 0;
    let isPaused = false;

    // Black-Gray-Yellow color palette
    const colors = [
      { r: 0, g: 0, b: 0 },           // Black (#000000)
      { r: 26, g: 26, b: 26 },        // Dark (#1a1a1a)
      { r: 45, g: 45, b: 45 },        // Gray (#2d2d2d)
      { r: 74, g: 74, b: 74 },        // Gray-light (#4a4a4a)
      { r: 107, g: 107, b: 107 },     // Gray-lighter (#6b6b6b)
      { r: 255, g: 215, b: 0 },       // Yellow (#FFD700)
      { r: 255, g: 165, b: 0 },       // Yellow-dark (#FFA500)
      { r: 255, g: 228, b: 77 },      // Yellow-light (#FFE44D)
    ];

    // Pause animation when tab is not visible
    const handleVisibilityChange = () => {
      isPaused = document.hidden;
      if (!isPaused && !animationId) {
        animate();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    const animate = () => {
      if (isPaused) return;
      
      time += 0.002;
      
      // Clear canvas with black base
      ctx.fillStyle = 'rgb(0, 0, 0)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Create subtle animated gradient (more futuristic, less vibrant)
      const gradient = ctx.createLinearGradient(
        Math.sin(time * 0.3) * canvas.width * 0.3 + canvas.width * 0.5,
        Math.cos(time * 0.4) * canvas.height * 0.3 + canvas.height * 0.5,
        Math.cos(time * 0.35) * canvas.width * 0.3 + canvas.width * 0.5,
        Math.sin(time * 0.25) * canvas.height * 0.3 + canvas.height * 0.5
      );

      // Smooth monochrome transitions
      const colorOffset = (time * 0.15) % (colors.length - 2);
      const colorIndex1 = Math.floor(colorOffset);
      const colorIndex2 = colorIndex1 + 1;
      const t = colorOffset % 1;

      const color1 = colors[colorIndex1];
      const color2 = colors[colorIndex2];
      
      // Interpolate colors (subtle variations)
      const c1 = {
        r: Math.floor(color1.r + (color2.r - color1.r) * t),
        g: Math.floor(color1.g + (color2.g - color1.g) * t),
        b: Math.floor(color1.b + (color2.b - color1.b) * t),
      };
      
      const c2 = colors[Math.min(colorIndex2 + 1, colors.length - 1)];
      const midColor = {
        r: Math.floor((c1.r + c2.r) / 2),
        g: Math.floor((c1.g + c2.g) / 2),
        b: Math.floor((c1.b + c2.b) / 2),
      };

      gradient.addColorStop(0, `rgba(${c1.r}, ${c1.g}, ${c1.b}, 0.3)`);
      gradient.addColorStop(0.5, `rgba(${midColor.r}, ${midColor.g}, ${midColor.b}, 0.2)`);
      gradient.addColorStop(1, `rgba(${c2.r}, ${c2.g}, ${c2.b}, 0.3)`);

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add subtle geometric shapes for futuristic feel (reduced from 3 to 2 for performance)
      const shapeCount = 2;
      for (let i = 0; i < shapeCount; i++) {
        const angle1 = time * (0.2 + i * 0.15);
        const angle2 = time * (0.3 + i * 0.1);
        
        const x = Math.sin(angle1) * canvas.width * 0.25 + canvas.width * (0.3 + i * 0.2);
        const y = Math.cos(angle2) * canvas.height * 0.25 + canvas.height * (0.4 + Math.sin(angle1 * 0.5) * 0.15);
        const size = 150 + Math.sin(time * 0.8 + i * 1.5) * 30;
        
        // Create subtle radial gradient for geometric shapes
        const shapeGradient = ctx.createRadialGradient(x, y, 0, x, y, size);
        const shapeColorIndex = Math.min(colorIndex1 + i * 2, colors.length - 1);
        const shapeColor = colors[shapeColorIndex];
        
        shapeGradient.addColorStop(0, `rgba(${shapeColor.r}, ${shapeColor.g}, ${shapeColor.b}, 0.15)`);
        shapeGradient.addColorStop(0.6, `rgba(${shapeColor.r}, ${shapeColor.g}, ${shapeColor.b}, 0.08)`);
        shapeGradient.addColorStop(1, `rgba(${shapeColor.r}, ${shapeColor.g}, ${shapeColor.b}, 0)`);
        
        ctx.fillStyle = shapeGradient;
        ctx.beginPath();
        // Create hexagonal shape for futuristic look
        for (let j = 0; j < 6; j++) {
          const hexAngle = (Math.PI / 3) * j + angle1 * 0.5;
          const hexX = x + Math.cos(hexAngle) * size;
          const hexY = y + Math.sin(hexAngle) * size;
          if (j === 0) {
            ctx.moveTo(hexX, hexY);
          } else {
            ctx.lineTo(hexX, hexY);
          }
        }
        ctx.closePath();
        ctx.fill();
      }

      // Simplified grid pattern for better performance (only every 2nd frame)
      if (Math.floor(time * 100) % 2 === 0) {
        ctx.strokeStyle = `rgba(255, 215, 0, ${0.05 + Math.sin(time * 0.1) * 0.03})`;
        ctx.lineWidth = 1;
        const gridSize = 150; // Increased spacing for fewer lines
        const offset = Math.sin(time * 0.05) * 20;
        
        for (let x = 0; x < canvas.width; x += gridSize * 2) {
          ctx.beginPath();
          ctx.moveTo(x + offset, 0);
          ctx.lineTo(x + offset, canvas.height);
          ctx.stroke();
        }
        
        for (let y = 0; y < canvas.height; y += gridSize * 2) {
          ctx.beginPath();
          ctx.moveTo(0, y + offset);
          ctx.lineTo(canvas.width, y + offset);
          ctx.stroke();
        }
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 w-full h-full"
      style={{ willChange: 'transform' }}
      aria-hidden="true"
    />
  );
}

