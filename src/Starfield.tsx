import React, { useRef, useEffect } from 'react';

type Star = { x: number; y: number; z: number };
type Velocity = { x: number; y: number; tx: number; ty: number; z: number };

const STAR_COLOR = '#fff';
const STAR_SIZE = 3;
const STAR_MIN_SCALE = 0.2;
const OVERFLOW_THRESHOLD = 50;

export const Starfield: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const starsRef = useRef<Star[]>([]);
  const velocityRef = useRef<Velocity>({ x: 0, y: 0, tx: 0, ty: 0, z: 0.0005 });
  const pointerRef = useRef<{ x: number | null; y: number | null }>({ x: null, y: null });
  const touchRef = useRef(false);

  const generateStars = (count: number, width: number, height: number) =>
    Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      z: STAR_MIN_SCALE + Math.random() * (1 - STAR_MIN_SCALE),
    }));

  const recycleStar = (star: Star, width: number, height: number, velocity: Velocity) => {
    const vx = Math.abs(velocity.x), vy = Math.abs(velocity.y);
    let direction: 'z' | 'l' | 'r' | 't' | 'b' = 'z';
    if (vx > 1 || vy > 1) {
      const axis = vx > vy ? (Math.random() < vx / (vx + vy) ? 'h' : 'v') : (Math.random() < vy / (vx + vy) ? 'v' : 'h');
      direction = axis === 'h' ? (velocity.x > 0 ? 'l' : 'r') : (velocity.y > 0 ? 't' : 'b');
    }
    star.z = STAR_MIN_SCALE + Math.random() * (1 - STAR_MIN_SCALE);
    if (direction === 'z') star.x = Math.random() * width, star.y = Math.random() * height, star.z = 0.1;
    else if (direction === 'l') star.x = -OVERFLOW_THRESHOLD, star.y = Math.random() * height;
    else if (direction === 'r') star.x = width + OVERFLOW_THRESHOLD, star.y = Math.random() * height;
    else if (direction === 't') star.x = Math.random() * width, star.y = -OVERFLOW_THRESHOLD;
    else if (direction === 'b') star.x = Math.random() * width, star.y = height + OVERFLOW_THRESHOLD;
  };

  const updateStars = (width: number, height: number) => {
    const v = velocityRef.current;
    v.tx *= 0.96; v.ty *= 0.96;
    v.x += (v.tx - v.x) * 0.8; v.y += (v.ty - v.y) * 0.8;
    starsRef.current.forEach(star => {
      star.x += v.x * star.z; star.y += v.y * star.z;
      star.x += (star.x - width/2) * v.z * star.z;
      star.y += (star.y - height/2) * v.z * star.z;
      star.z += v.z;
      if (star.x < -OVERFLOW_THRESHOLD || star.x > width + OVERFLOW_THRESHOLD ||
          star.y < -OVERFLOW_THRESHOLD || star.y > height + OVERFLOW_THRESHOLD) {
        recycleStar(star, width, height, v);
      }
    });
  };

  const renderStars = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);
    const v = velocityRef.current;
    const scale = window.devicePixelRatio || 1;
    starsRef.current.forEach(star => {
      ctx.beginPath();
      ctx.lineCap = 'round';
      ctx.lineWidth = STAR_SIZE * star.z * scale;
      ctx.globalAlpha = 0.5 + 0.5 * Math.random();
      ctx.strokeStyle = STAR_COLOR;
      ctx.moveTo(star.x, star.y);
      let tailX = Math.abs(v.x * 2) < 0.1 ? 0.5 : v.x * 2;
      let tailY = Math.abs(v.y * 2) < 0.1 ? 0.5 : v.y * 2;
      ctx.lineTo(star.x + tailX, star.y + tailY);
      ctx.stroke();
    });
  };

  const movePointer = (x: number, y: number) => {
    const p = pointerRef.current;
    const v = velocityRef.current;
    const scale = window.devicePixelRatio || 1;
    if (p.x !== null && p.y !== null) {
      const ox = x - p.x, oy = y - p.y;
      v.tx += (ox / (8*scale)) * (touchRef.current ? 1 : -1);
      v.ty += (oy / (8*scale)) * (touchRef.current ? 1 : -1);
    }
    p.x = x; p.y = y;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let scale = window.devicePixelRatio || 1;
    let width = window.innerWidth * scale, height = window.innerHeight * scale;
    const baseZ = velocityRef.current.z;
    let targetZ = baseZ, scrollTimeout: number;

    starsRef.current = generateStars((window.innerWidth+window.innerHeight)/8, width, height);
    canvas.width = width; canvas.height = height;

    const step = () => {
      velocityRef.current.z += (targetZ - velocityRef.current.z) * 0.1;
      updateStars(width, height);
      renderStars(ctx, width, height);
      requestAnimationFrame(step);
    };
    step();

    const onResize = () => { scale = window.devicePixelRatio || 1; width = window.innerWidth*scale; height = window.innerHeight*scale; canvas.width = width; canvas.height = height; };
    const onScroll = () => { targetZ = baseZ*50; clearTimeout(scrollTimeout); scrollTimeout = window.setTimeout(() => { targetZ = baseZ; }, 10); };
    const onMouseMove = (e: MouseEvent) => { touchRef.current=false; movePointer(e.clientX,e.clientY); };
    const onTouchMove = (e: TouchEvent) => { touchRef.current=true; if(e.touches.length>0) movePointer(e.touches[0].clientX,e.touches[0].clientY); e.preventDefault(); };
    const onMouseLeave = () => { pointerRef.current={x:null,y:null}; };

    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onScroll);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onMouseLeave);
    document.addEventListener('mouseleave', onMouseLeave);

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onMouseLeave);
      document.removeEventListener('mouseleave', onMouseLeave);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ position:'fixed',top:0,left:0,width:'100%',height:'100%',zIndex:0,pointerEvents:'none' }} />;
};
