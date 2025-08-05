"use client";

import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  color: string;
  twinkleSpeed: number;
  twinklePhase: number;
}

export function StarfieldBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const starsRef = useRef<Star[]>([]);

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

    // Generate stars
    const generateStars = () => {
      const stars: Star[] = [];
      const numStars = Math.floor((canvas.width * canvas.height) / 8000); // Density based on screen size

      for (let i = 0; i < numStars; i++) {
        const rand = Math.random();
        let color = '#ffffff';
        let radius = 0.5;

        // 90% white stars of varying sizes
        if (rand < 0.9) {
          color = '#ffffff';
          radius = Math.random() * 1.2 + 0.3;
        }
        // 5% blue-white bright stars
        else if (rand < 0.95) {
          color = '#b3d9ff';
          radius = Math.random() * 1.8 + 0.8;
        }
        // 3% yellow-orange stars
        else if (rand < 0.98) {
          color = '#ffd700';
          radius = Math.random() * 1.5 + 0.6;
        }
        // 2% red stars
        else {
          color = '#ff8c8c';
          radius = Math.random() * 1.3 + 0.5;
        }

        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius,
          opacity: Math.random() * 0.7 + 0.3,
          color,
          twinkleSpeed: Math.random() * 0.02 + 0.005,
          twinklePhase: Math.random() * Math.PI * 2
        });
      }

      starsRef.current = stars;
    };

    generateStars();

    // Animation loop
    let frame = 0;
    const animate = () => {
      ctx.fillStyle = '#000814'; // Deep space background
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw stars with twinkling effect
      starsRef.current.forEach((star) => {
        const twinkle = Math.sin(frame * star.twinkleSpeed + star.twinklePhase) * 0.3 + 0.7;
        const currentOpacity = star.opacity * twinkle;

        // Create gradient for larger stars
        if (star.radius > 1) {
          const gradient = ctx.createRadialGradient(
            star.x, star.y, 0,
            star.x, star.y, star.radius * 2
          );
          gradient.addColorStop(0, star.color + Math.floor(currentOpacity * 255).toString(16).padStart(2, '0'));
          gradient.addColorStop(0.5, star.color + Math.floor(currentOpacity * 0.6 * 255).toString(16).padStart(2, '0'));
          gradient.addColorStop(1, star.color + '00');

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.radius * 2, 0, Math.PI * 2);
          ctx.fill();
        }

        // Core star
        ctx.globalAlpha = currentOpacity;
        ctx.fillStyle = star.color;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      frame++;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      style={{ background: '#000814' }}
    />
  );
}