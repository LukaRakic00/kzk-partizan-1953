'use client';

import { useEffect, useRef } from 'react';

export default function InteractiveBackground() {
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

    // Very subtle floating particles
    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      baseRadius: number;
      opacity: number;
      baseOpacity: number;
      pulseSpeed: number;
      canvas: HTMLCanvasElement;
      ctx: CanvasRenderingContext2D;

      constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.2;
        this.vy = (Math.random() - 0.5) * 0.2;
        this.baseRadius = Math.random() * 2 + 0.5;
        this.radius = this.baseRadius;
        this.baseOpacity = Math.random() * 0.08 + 0.02;
        this.opacity = this.baseOpacity;
        this.pulseSpeed = Math.random() * 0.015 + 0.005;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        // Very subtle pulse
        this.radius = this.baseRadius + Math.sin(Date.now() * this.pulseSpeed) * 0.3;
        this.opacity = this.baseOpacity + Math.sin(Date.now() * this.pulseSpeed * 1.5) * 0.02;

        if (this.x < 0 || this.x > this.canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > this.canvas.height) this.vy *= -1;
      }

      draw() {
        // Very subtle glow
        const gradient = this.ctx.createRadialGradient(
          this.x, this.y, 0,
          this.x, this.y, this.radius * 4
        );
        gradient.addColorStop(0, `rgba(139, 92, 246, ${this.opacity})`);
        gradient.addColorStop(0.3, `rgba(139, 92, 246, ${this.opacity * 0.3})`);
        gradient.addColorStop(1, `rgba(139, 92, 246, 0)`);

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.radius * 4, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }

    const particles: Particle[] = [];
    const particleCount = 25; // Manje čestica
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle(canvas, ctx));
    }

    // Mouse interaction - very subtle
    let mouseX = canvas.width / 2;
    let mouseY = canvas.height / 2;
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Animation loop
    const animate = () => {
      // Very subtle fade for smooth trails
      ctx.fillStyle = 'rgba(0, 0, 0, 0.02)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particles.forEach((particle, i) => {
        // Very subtle attraction to mouse
        const dx = mouseX - particle.x;
        const dy = mouseY - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 400) {
          const force = (1 - distance / 400) * 0.00002;
          particle.vx += dx * force;
          particle.vy += dy * force;
        }

        particle.update();
        particle.draw();

        // Very subtle connections
        particles.slice(i + 1).forEach((otherParticle) => {
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 250 && distance > 0) {
            const opacity = 0.04 * (1 - distance / 250);
            ctx.beginPath();
            ctx.strokeStyle = `rgba(139, 92, 246, ${opacity})`;
            ctx.lineWidth = 0.3;
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.stroke();
          }
        });
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full pointer-events-none"
      style={{ background: 'transparent' }}
    />
  );
}
