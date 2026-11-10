"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "./ThemeProvider";

interface Car {
  x: number;
  y: number;
  speed: number;
  direction: 1 | -1; // 1 = right, -1 = left
  length: number;
  height: number;
  colorDay: string;
  colorNight: string;
  roofLength: number;
}

interface Building {
  x: number;
  width: number;
  height: number;
  roofType: "flat" | "spire" | "antenna" | "stepped";
  windows: { x: number; y: number; w: number; h: number; litNight: boolean; colorNight: string }[];
  beacon?: boolean;
  neonColor?: string;
}

interface Cloud {
  x: number;
  y: number;
  speed: number;
  scale: number;
  alpha: number;
}

// Color interpolation helper
function lerpColor(c1: [number, number, number], c2: [number, number, number], t: number): string {
  const r = Math.round(c1[0] + (c2[0] - c1[0]) * t);
  const g = Math.round(c1[1] + (c2[1] - c1[1]) * t);
  const b = Math.round(c1[2] + (c2[2] - c1[2]) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

export default function CinematicCityBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { theme } = useTheme();
  const themeRef = useRef<"dark" | "light">(theme);

  // Keep themeRef updated
  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initScene();
    };
    window.addEventListener("resize", handleResize);

    // -------------------------------------------------------------------------
    // Scene Elements Setup
    // -------------------------------------------------------------------------
    let farBuildings: Building[] = [];
    let midBuildings: Building[] = [];
    let cars: Car[] = [];
    let clouds: Cloud[] = [];
    let stars: { x: number; y: number; radius: number; alpha: number }[] = [];

    const initScene = () => {
      const roadY = height * 0.76;

      // 1. Stars (for dark mode)
      stars = [];
      const starCount = Math.floor(width * 0.08);
      for (let i = 0; i < starCount; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * (roadY * 0.55),
          radius: Math.random() * 1.2 + 0.3,
          alpha: Math.random() * 0.7 + 0.2,
        });
      }

      // 2. Clouds (for light mode)
      clouds = [];
      const cloudCount = Math.max(5, Math.floor(width / 220));
      for (let i = 0; i < cloudCount; i++) {
        clouds.push({
          x: Math.random() * width,
          y: Math.random() * (roadY * 0.4) + 20,
          speed: Math.random() * 0.35 + 0.15,
          scale: Math.random() * 0.6 + 0.7,
          alpha: Math.random() * 0.35 + 0.55,
        });
      }

      // 3. Far Skyline Buildings
      farBuildings = [];
      let curX = -40;
      while (curX < width + 100) {
        const bWidth = Math.floor(Math.random() * 85 + 50);
        const bHeight = Math.floor(Math.random() * (height * 0.34) + height * 0.2);
        farBuildings.push({
          x: curX,
          width: bWidth,
          height: bHeight,
          roofType: Math.random() > 0.6 ? "antenna" : "flat",
          beacon: Math.random() > 0.4,
          windows: [],
        });
        curX += bWidth + Math.floor(Math.random() * 15 - 5);
      }

      // 4. Midground Buildings
      midBuildings = [];
      curX = -20;
      const windowPalettes = ["#ffdd80", "#ffeeb3", "#9bd4ff", "#ffba66", "#d1e8ff"];
      while (curX < width + 120) {
        const bWidth = Math.floor(Math.random() * 95 + 65);
        const bHeight = Math.floor(Math.random() * (height * 0.28) + height * 0.16);
        const windows: Building["windows"] = [];

        const cols = Math.floor(bWidth / 14);
        const rows = Math.floor(bHeight / 16);
        for (let r = 1; r < rows - 1; r++) {
          for (let c = 1; c < cols; c++) {
            windows.push({
              x: c * 14,
              y: r * 16,
              w: 6,
              h: 8,
              litNight: Math.random() > 0.45,
              colorNight: windowPalettes[Math.floor(Math.random() * windowPalettes.length)],
            });
          }
        }

        const roofTypes: Building["roofType"][] = ["flat", "spire", "stepped", "antenna"];
        const neonColors = ["#38bdf8", "#818cf8", "#f59e0b", undefined, undefined];

        midBuildings.push({
          x: curX,
          width: bWidth,
          height: bHeight,
          roofType: roofTypes[Math.floor(Math.random() * roofTypes.length)],
          windows,
          beacon: Math.random() > 0.5,
          neonColor: neonColors[Math.floor(Math.random() * neonColors.length)],
        });
        curX += bWidth + Math.floor(Math.random() * 12);
      }

      // 5. Vehicles
      cars = [];
      const carCount = Math.max(12, Math.floor(width / 110));
      const lane1Y = roadY + 16; // Rightbound
      const lane2Y = roadY + 36; // Leftbound

      const dayCarColors = ["#f8fafc", "#ef4444", "#3b82f6", "#eab308", "#10b981", "#64748b", "#0f172a"];
      const nightCarColors = ["#1f2937", "#111827", "#374151", "#0f172a", "#1e293b"];

      for (let i = 0; i < carCount; i++) {
        const isRightbound = Math.random() > 0.45;
        const length = Math.random() > 0.8 ? 44 : Math.random() > 0.5 ? 32 : 26;
        const carHeight = length > 36 ? 15 : 10;

        cars.push({
          x: Math.random() * (width + 300) - 150,
          y: isRightbound ? lane1Y : lane2Y,
          speed: (Math.random() * 1.8 + 1.2) * (prefersReducedMotion ? 0.3 : 1),
          direction: isRightbound ? 1 : -1,
          length,
          height: carHeight,
          colorDay: dayCarColors[Math.floor(Math.random() * dayCarColors.length)],
          colorNight: nightCarColors[Math.floor(Math.random() * nightCarColors.length)],
          roofLength: length * 0.55,
        });
      }
    };

    initScene();

    // -------------------------------------------------------------------------
    // Animation Loop with Smooth Dark/Light Interpolation
    // -------------------------------------------------------------------------
    let time = 0;
    // 0 = Light Mode (Day), 1 = Dark Mode (Night)
    let currentT = themeRef.current === "dark" ? 1 : 0;

    const render = () => {
      time += 0.02;

      // Smooth transition between themes (lerp)
      const targetT = themeRef.current === "dark" ? 1 : 0;
      currentT += (targetT - currentT) * 0.06;

      const roadY = height * 0.76;
      const roadHeight = height - roadY;

      // 1. Sky Gradient Transition
      const skyGrad = ctx.createLinearGradient(0, 0, 0, roadY);
      // Top Sky Color: Day [#7dd3fc, Light Cyan Blue] -> Night [#04070d, Deep Indigo]
      const topColor = lerpColor([125, 211, 252], [4, 7, 13], currentT);
      // Mid Sky Color: Day [#bae6fd] -> Night [#070e1b]
      const midColor = lerpColor([186, 230, 253], [7, 14, 27], currentT);
      // Horizon Color: Day [#fef3c7, Soft Golden Amber] -> Night [#19283e, Night Glow]
      const horizColor = lerpColor([254, 243, 199], [25, 40, 62], currentT);

      skyGrad.addColorStop(0, topColor);
      skyGrad.addColorStop(0.5, midColor);
      skyGrad.addColorStop(1, horizColor);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Sun & Moon
      const celestialX = width * 0.82;
      const celestialY = height * 0.18;

      // Sun (Visible in Light Mode: currentT < 0.85)
      if (currentT < 0.85) {
        const sunAlpha = (1 - currentT) * 0.95;
        // Sun Outer Warm Glow
        const sunGlow = ctx.createRadialGradient(celestialX, celestialY, 6, celestialX, celestialY, 140);
        sunGlow.addColorStop(0, `rgba(253, 224, 71, ${sunAlpha * 0.8})`);
        sunGlow.addColorStop(0.4, `rgba(254, 240, 138, ${sunAlpha * 0.3})`);
        sunGlow.addColorStop(1, "rgba(254, 240, 138, 0)");
        ctx.fillStyle = sunGlow;
        ctx.beginPath();
        ctx.arc(celestialX, celestialY, 140, 0, Math.PI * 2);
        ctx.fill();

        // Sun Core
        ctx.fillStyle = `rgba(255, 251, 235, ${sunAlpha})`;
        ctx.beginPath();
        ctx.arc(celestialX, celestialY, 20, 0, Math.PI * 2);
        ctx.fill();
      }

      // Moon & Stars (Visible in Dark Mode: currentT > 0.15)
      if (currentT > 0.15) {
        const moonAlpha = currentT;

        // Moon Glow
        const moonGlow = ctx.createRadialGradient(celestialX, celestialY, 4, celestialX, celestialY, 110);
        moonGlow.addColorStop(0, `rgba(254, 243, 199, ${0.45 * moonAlpha})`);
        moonGlow.addColorStop(0.3, `rgba(186, 230, 253, ${0.15 * moonAlpha})`);
        moonGlow.addColorStop(1, "rgba(186, 230, 253, 0)");
        ctx.fillStyle = moonGlow;
        ctx.beginPath();
        ctx.arc(celestialX, celestialY, 110, 0, Math.PI * 2);
        ctx.fill();

        // Crescent Moon
        ctx.fillStyle = `rgba(255, 251, 235, ${moonAlpha})`;
        ctx.beginPath();
        ctx.arc(celestialX, celestialY, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = topColor; // Shadow cutout matching sky
        ctx.beginPath();
        ctx.arc(celestialX - 5, celestialY - 3, 15, 0, Math.PI * 2);
        ctx.fill();

        // Stars
        for (const s of stars) {
          const starAlpha = Math.max(0, (s.alpha + Math.sin(time * 2 + s.x) * 0.25) * currentT);
          ctx.fillStyle = `rgba(224, 242, 254, ${starAlpha})`;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 3. Clouds (Floating across sky in Light Mode)
      if (currentT < 0.75) {
        const cloudOpacity = 1 - currentT;
        for (const c of clouds) {
          c.x += c.speed;
          if (c.x > width + 150) c.x = -150;

          ctx.fillStyle = `rgba(255, 255, 255, ${c.alpha * cloudOpacity})`;
          const cx = c.x;
          const cy = c.y;
          const s = c.scale;

          ctx.beginPath();
          ctx.arc(cx, cy, 18 * s, 0, Math.PI * 2);
          ctx.arc(cx + 16 * s, cy - 8 * s, 22 * s, 0, Math.PI * 2);
          ctx.arc(cx + 36 * s, cy - 4 * s, 20 * s, 0, Math.PI * 2);
          ctx.arc(cx + 50 * s, cy, 16 * s, 0, Math.PI * 2);
          ctx.closePath();
          ctx.fill();
        }
      }

      // 4. Far Skyline Layer
      // Far building color: Day [#94a3b8 / Soft Slate] -> Night [#0c1524 / Obsidian Blue]
      const farBldgColor = lerpColor([148, 163, 184], [12, 21, 36], currentT);

      for (const b of farBuildings) {
        ctx.fillStyle = farBldgColor;
        const topY = roadY - b.height;
        ctx.fillRect(b.x, topY, b.width, b.height);

        // Antenna
        if (b.roofType === "antenna") {
          ctx.strokeStyle = lerpColor([100, 116, 139], [22, 37, 59], currentT);
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(b.x + b.width / 2, topY);
          ctx.lineTo(b.x + b.width / 2, topY - 24);
          ctx.stroke();

          // Blinking beacon (more vivid at night)
          const beaconAlpha = ((Math.sin(time * 3 + b.x) + 1) / 2) * Math.max(0.4, currentT);
          ctx.fillStyle = `rgba(244, 63, 94, ${beaconAlpha})`;
          ctx.beginPath();
          ctx.arc(b.x + b.width / 2, topY - 24, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Atmospheric Horizon Haze
      const hazeGrad = ctx.createLinearGradient(0, roadY - 140, 0, roadY);
      const hazeColor = lerpColor([254, 243, 199], [15, 23, 42], currentT);
      hazeGrad.addColorStop(0, "rgba(0, 0, 0, 0)");
      hazeGrad.addColorStop(1, `rgba(${currentT > 0.5 ? "15, 23, 42" : "226, 232, 240"}, ${0.4 + currentT * 0.3})`);
      ctx.fillStyle = hazeGrad;
      ctx.fillRect(0, roadY - 140, width, 140);

      // 5. Midground Buildings Layer
      // Mid building color: Day [#cbd5e1 / Architectural Light Slate] -> Night [#080e18 / Deep Midnight]
      const midBldgColor = lerpColor([203, 213, 225], [8, 14, 24], currentT);

      for (const b of midBuildings) {
        const topY = roadY - b.height;
        ctx.fillStyle = midBldgColor;
        ctx.fillRect(b.x, topY, b.width, b.height);

        // Neon Roof Trim (glowing in dark mode, subtle architectural accent in light mode)
        if (b.neonColor) {
          ctx.strokeStyle = currentT > 0.4 ? b.neonColor : "#94a3b8";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(b.x, topY);
          ctx.lineTo(b.x + b.width, topY);
          ctx.stroke();
        }

        // Roof Structures
        if (b.roofType === "spire") {
          ctx.fillStyle = midBldgColor;
          ctx.beginPath();
          ctx.moveTo(b.x + 8, topY);
          ctx.lineTo(b.x + b.width / 2, topY - 28);
          ctx.lineTo(b.x + b.width - 8, topY);
          ctx.closePath();
          ctx.fill();
        } else if (b.roofType === "stepped") {
          ctx.fillStyle = midBldgColor;
          ctx.fillRect(b.x + 10, topY - 10, b.width - 20, 10);
          ctx.fillRect(b.x + 20, topY - 18, b.width - 40, 8);
        } else if (b.roofType === "antenna") {
          ctx.strokeStyle = lerpColor([100, 116, 139], [51, 65, 85], currentT);
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(b.x + b.width * 0.3, topY);
          ctx.lineTo(b.x + b.width * 0.3, topY - 32);
          ctx.stroke();

          const beaconAlpha = ((Math.sin(time * 4 + b.x) + 1) / 2) * Math.max(0.4, currentT);
          ctx.fillStyle = `rgba(239, 68, 68, ${beaconAlpha})`;
          ctx.beginPath();
          ctx.arc(b.x + b.width * 0.3, topY - 32, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Windows (Day: sleek blue-white glass reflection; Night: glowing warm amber/cyan)
        for (const w of b.windows) {
          if (currentT > 0.5) {
            // Night windows
            ctx.fillStyle = w.litNight ? w.colorNight : "rgba(15, 23, 42, 0.4)";
          } else {
            // Day windows (sunlit sky glass reflection)
            ctx.fillStyle = "rgba(241, 245, 249, 0.75)";
          }
          ctx.fillRect(b.x + w.x, topY + w.y, w.w, w.h);
        }
      }

      // 6. Highway Structure
      // Concrete structure: Day [#94a3b8] -> Night [#060911]
      const highwayBaseColor = lerpColor([148, 163, 184], [6, 9, 17], currentT);
      ctx.fillStyle = highwayBaseColor;
      ctx.fillRect(0, roadY, width, roadHeight);

      // Guardrail
      const guardrailColor = lerpColor([100, 116, 139], [30, 41, 59], currentT);
      ctx.fillStyle = guardrailColor;
      ctx.fillRect(0, roadY, width, 5);

      // Road Surface: Day [#475569 / Asphalt Gray] -> Night [#090d16 / Deep Road]
      const roadColor = lerpColor([71, 85, 105], [9, 13, 22], currentT);
      ctx.fillStyle = roadColor;
      ctx.fillRect(0, roadY + 5, width, roadHeight - 5);

      // Lane Divider Dashes
      const stripeColor = lerpColor([255, 255, 255], [203, 213, 225], currentT);
      ctx.fillStyle = stripeColor;
      const dashWidth = 24;
      const dashGap = 32;
      const stripeY = roadY + 28;
      for (let x = 0; x < width; x += dashWidth + dashGap) {
        ctx.fillRect(x, stripeY, dashWidth, 1.5);
      }

      // Streetlamp Posts & Light Cones
      const lampSpacing = 220;
      for (let lx = 60; lx < width + 100; lx += lampSpacing) {
        ctx.strokeStyle = guardrailColor;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(lx, roadY);
        ctx.lineTo(lx, roadY - 48);
        ctx.lineTo(lx + 10, roadY - 54);
        ctx.stroke();

        // Luminaire Fixture
        ctx.fillStyle = currentT > 0.4 ? "#fef08a" : "#f8fafc";
        ctx.beginPath();
        ctx.arc(lx + 10, roadY - 54, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Light Cone (Only intense in Night Mode)
        if (currentT > 0.2) {
          const coneGrad = ctx.createRadialGradient(
            lx + 10,
            roadY - 50,
            2,
            lx + 10,
            roadY + 20,
            65
          );
          const lampConeAlpha = currentT * 0.12;
          coneGrad.addColorStop(0, `rgba(254, 240, 138, ${lampConeAlpha})`);
          coneGrad.addColorStop(0.5, `rgba(254, 240, 138, ${lampConeAlpha * 0.3})`);
          coneGrad.addColorStop(1, "rgba(254, 240, 138, 0)");
          ctx.fillStyle = coneGrad;
          ctx.beginPath();
          ctx.moveTo(lx + 10, roadY - 52);
          ctx.lineTo(lx - 45, roadY + 55);
          ctx.lineTo(lx + 65, roadY + 55);
          ctx.closePath();
          ctx.fill();
        }
      }

      // 7. Moving Vehicles
      for (const car of cars) {
        car.x += car.speed * car.direction;

        if (car.direction === 1 && car.x > width + 120) {
          car.x = -120;
        } else if (car.direction === -1 && car.x < -120) {
          car.x = width + 120;
        }

        const carTop = car.y - car.height;

        // Car Body Color (Daytime shows vibrant colors, Nighttime dark silhouette)
        ctx.fillStyle = currentT > 0.5 ? car.colorNight : car.colorDay;
        ctx.fillRect(car.x, carTop + car.height * 0.45, car.length, car.height * 0.55);

        // Roof
        const roofOffset = car.length * 0.22;
        ctx.beginPath();
        ctx.moveTo(car.x + roofOffset, carTop + car.height * 0.45);
        ctx.lineTo(car.x + roofOffset + 6, carTop);
        ctx.lineTo(car.x + roofOffset + car.roofLength - 6, carTop);
        ctx.lineTo(car.x + roofOffset + car.roofLength, carTop + car.height * 0.45);
        ctx.closePath();
        ctx.fill();

        // Wheels
        ctx.fillStyle = "#020617";
        const wheelR = car.height * 0.28;
        const w1X = car.x + car.length * 0.24;
        const w2X = car.x + car.length * 0.76;
        const wheelY = car.y + 1;
        ctx.beginPath();
        ctx.arc(w1X, wheelY, wheelR, 0, Math.PI * 2);
        ctx.arc(w2X, wheelY, wheelR, 0, Math.PI * 2);
        ctx.fill();

        // Car Lights
        if (car.direction === 1) {
          // RIGHTBOUND: White Headlights
          const frontX = car.x + car.length;
          const lightY = carTop + car.height * 0.65;

          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(frontX, lightY, 2, 0, Math.PI * 2);
          ctx.fill();

          // Luminous Light Beam onto road (stronger at night)
          if (currentT > 0.2) {
            const beamLength = 85;
            const beamSpread = 24;
            const beamGrad = ctx.createLinearGradient(frontX, lightY, frontX + beamLength, lightY);
            const beamAlpha = currentT * 0.45;
            beamGrad.addColorStop(0, `rgba(255, 255, 255, ${beamAlpha})`);
            beamGrad.addColorStop(0.2, `rgba(224, 242, 254, ${beamAlpha * 0.5})`);
            beamGrad.addColorStop(1, "rgba(224, 242, 254, 0)");

            ctx.fillStyle = beamGrad;
            ctx.beginPath();
            ctx.moveTo(frontX, lightY - 1);
            ctx.lineTo(frontX + beamLength, lightY - beamSpread * 0.3);
            ctx.lineTo(frontX + beamLength, lightY + beamSpread);
            ctx.lineTo(frontX, lightY + 2);
            ctx.closePath();
            ctx.fill();
          }

          ctx.fillStyle = "rgba(239, 68, 68, 0.8)";
          ctx.fillRect(car.x - 1, lightY - 1, 2, 3);
        } else {
          // LEFTBOUND: Red Taillights
          const backX = car.x + car.length;
          const lightY = carTop + car.height * 0.65;

          ctx.fillStyle = "#ef4444";
          ctx.beginPath();
          ctx.arc(backX, lightY, 2.5, 0, Math.PI * 2);
          ctx.fill();

          if (currentT > 0.2) {
            const trailLength = 55;
            const trailGrad = ctx.createLinearGradient(backX, lightY, backX + trailLength, lightY);
            const trailAlpha = currentT * 0.65;
            trailGrad.addColorStop(0, `rgba(239, 68, 68, ${trailAlpha})`);
            trailGrad.addColorStop(0.4, `rgba(220, 38, 38, ${trailAlpha * 0.3})`);
            trailGrad.addColorStop(1, "rgba(220, 38, 38, 0)");

            ctx.fillStyle = trailGrad;
            ctx.beginPath();
            ctx.moveTo(backX, lightY - 2);
            ctx.lineTo(backX + trailLength, lightY - 6);
            ctx.lineTo(backX + trailLength, lightY + 6);
            ctx.lineTo(backX, lightY + 2);
            ctx.closePath();
            ctx.fill();
          }
        }
      }

      // 8. Vignette (Dynamic based on Dark / Light Mode)
      const vignette = ctx.createRadialGradient(
        width / 2,
        height / 2,
        height * 0.25,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.75
      );
      if (currentT > 0.5) {
        // Dark Mode Dramatic Vignette
        vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
        vignette.addColorStop(0.65, "rgba(3, 7, 18, 0.4)");
        vignette.addColorStop(1, "rgba(2, 6, 23, 0.88)");
      } else {
        // Light Mode Soft Architectural Vignette
        vignette.addColorStop(0, "rgba(255, 255, 255, 0)");
        vignette.addColorStop(0.7, "rgba(203, 213, 225, 0.2)");
        vignette.addColorStop(1, "rgba(148, 163, 184, 0.45)");
      }
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);

      // Bottom Fog Gradient
      const groundFog = ctx.createLinearGradient(0, height - 90, 0, height);
      if (currentT > 0.5) {
        groundFog.addColorStop(0, "rgba(2, 6, 23, 0)");
        groundFog.addColorStop(1, "rgba(2, 6, 23, 0.75)");
      } else {
        groundFog.addColorStop(0, "rgba(241, 245, 249, 0)");
        groundFog.addColorStop(1, "rgba(226, 232, 240, 0.65)");
      }
      ctx.fillStyle = groundFog;
      ctx.fillRect(0, height - 90, width, 90);

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}
