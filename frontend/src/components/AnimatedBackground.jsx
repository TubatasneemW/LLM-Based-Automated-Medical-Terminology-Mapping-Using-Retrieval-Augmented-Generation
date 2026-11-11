import { useEffect, useRef } from 'react';

const PARTICLE_COUNT = 60;
const CONNECTION_DIST = 130;
const PARTICLE_SPEED = 0.25;

function randomBetween(a, b) {
  return a + Math.random() * (b - a);
}

class Particle {
  constructor(w, h) {
    this.reset(w, h);
  }
  reset(w, h) {
    this.x = randomBetween(0, w);
    this.y = randomBetween(0, h);
    this.vx = randomBetween(-PARTICLE_SPEED, PARTICLE_SPEED);
    this.vy = randomBetween(-PARTICLE_SPEED, PARTICLE_SPEED);
    this.r = randomBetween(1, 2.2);
    this.alpha = randomBetween(0.3, 0.8);
    this.cyan = Math.random() > 0.65;
  }
  update(w, h) {
    this.x += this.vx;
    this.y += this.vy;
    if (this.x < -10) this.x = w + 10;
    if (this.x > w + 10) this.x = -10;
    if (this.y < -10) this.y = h + 10;
    if (this.y > h + 10) this.y = -10;
  }
  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fillStyle = this.cyan
      ? `rgba(6,182,212,${this.alpha})`
      : `rgba(200,220,255,${this.alpha * 0.6})`;
    ctx.fill();
  }
}

export default function AnimatedBackground() {
  const canvasRef = useRef(null);
  const stateRef = useRef({ particles: [], animId: null });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Init particles
    const particles = Array.from(
      { length: PARTICLE_COUNT },
      () => new Particle(canvas.width, canvas.height)
    );
    stateRef.current.particles = particles;

    const drawGrid = () => {
      const gridSize = 60;
      ctx.strokeStyle = 'rgba(6,182,212,0.035)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      drawGrid();

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECTION_DIST) {
            const opacity = (1 - dist / CONNECTION_DIST) * 0.25;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(6,182,212,${opacity})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      // Draw & update particles
      particles.forEach((p) => {
        p.update(canvas.width, canvas.height);
        p.draw(ctx);
      });

      stateRef.current.animId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      if (stateRef.current.animId) cancelAnimationFrame(stateRef.current.animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
