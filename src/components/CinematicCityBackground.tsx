"use client";

import { useEffect, useRef } from "react";

interface Car {
  x: number;
  y: number;
  speed: number;
  direction: 1 | -1; // 1 = right (headlights), -1 = left (taillights)
  length: number;
  height: number;
  color: string;
  roofLength: number;
  hasRoofRack?: boolean;
}

interface Building {
  x: number;
  width: number;
  height: number;
  color: string;
  roofType: "flat" | "spire" | "antenna" | "stepped";
  windows: { x: number; y: number; w: number; h: number; lit: boolean; color: string }[];
  beacon?: boolean;
  neonColor?: string;
}

export default function CinematicCityBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Handle Resize
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
    let stars: { x: number; y: number; radius: number; alpha: number; pulseSpeed: number }[] = [];

    const initScene = () => {
      const roadY = height * 0.78;

      // 1. Stars (upper half)
      stars = [];
      const starCount = Math.floor(width * 0.08);
      for (let i = 0; i < starCount; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * (roadY * 0.55),
          radius: Math.random() * 1.2 + 0.3,
          alpha: Math.random() * 0.7 + 0.2,
          pulseSpeed: Math.random() * 0.02 + 0.008,
        });
      }

      // 2. Far Skyline Buildings (Deep dark indigo silhouettes)
      farBuildings = [];
      let curX = -40;
      while (curX < width + 100) {
        const bWidth = Math.floor(Math.random() * 80 + 50);
        const bHeight = Math.floor(Math.random() * (height * 0.35) + height * 0.22);
        farBuildings.push({
          x: curX,
          width: bWidth,
          height: bHeight,
          color: "#0c1524",
          roofType: Math.random() > 0.6 ? "antenna" : "flat",
          beacon: Math.random() > 0.4,
          windows: [],
        });
        curX += bWidth + Math.floor(Math.random() * 15 - 5);
      }

      // 3. Midground Buildings (Closer city layer with glowing windows)
      midBuildings = [];
      curX = -20;
      const windowPalettes = ["#ffdd80", "#ffeeb3", "#9bd4ff", "#ffba66", "#d1e8ff"];
      while (curX < width + 120) {
        const bWidth = Math.floor(Math.random() * 95 + 65);
        const bHeight = Math.floor(Math.random() * (height * 0.28) + height * 0.16);
        const windows: Building["windows"] = [];

        // Generate window grid
        const cols = Math.floor(bWidth / 14);
        const rows = Math.floor(bHeight / 16);
        for (let r = 1; r < rows - 1; r++) {
          for (let c = 1; c < cols; c++) {
            if (Math.random() > 0.48) {
              windows.push({
                x: c * 14,
                y: r * 16,
                w: 6,
                h: 8,
                lit: true,
                color: windowPalettes[Math.floor(Math.random() * windowPalettes.length)],
              });
            }
          }
        }

        const roofTypes: Building["roofType"][] = ["flat", "spire", "stepped", "antenna"];
        const neonColors = ["#38bdf8", "#818cf8", "#f59e0b", undefined, undefined];

        midBuildings.push({
          x: curX,
          width: bWidth,
          height: bHeight,
          color: "#080e18",
          roofType: roofTypes[Math.floor(Math.random() * roofTypes.length)],
          windows,
          beacon: Math.random() > 0.5,
          neonColor: neonColors[Math.floor(Math.random() * neonColors.length)],
        });
        curX += bWidth + Math.floor(Math.random() * 12);
      }

      // 4. Vehicles
      cars = [];
      const carCount = Math.max(12, Math.floor(width / 110));
      const lane1Y = roadY + 16; // Rightbound lane (white headlights)
      const lane2Y = roadY + 36; // Leftbound lane (red taillights)

      for (let i = 0; i < carCount; i++) {
        const isRightbound = Math.random() > 0.45;
        const length = Math.random() > 0.8 ? 44 : Math.random() > 0.5 ? 32 : 26; // Bus/Van vs Sedan
        const carHeight = length > 36 ? 15 : 10;
        const colors = ["#1f2937", "#111827", "#374151", "#0f172a", "#1e293b"];

        cars.push({
          x: Math.random() * (width + 300) - 150,
          y: isRightbound ? lane1Y : lane2Y,
          speed: (Math.random() * 1.8 + 1.2) * (prefersReducedMotion ? 0.3 : 1),
          direction: isRightbound ? 1 : -1,
          length,
          height: carHeight,
          color: colors[Math.floor(Math.random() * colors.length)],
          roofLength: length * 0.55,
          hasRoofRack: length > 35,
        });
      }
    };

    initScene();

    // -------------------------------------------------------------------------
    // Animation Loop
    // -------------------------------------------------------------------------
    let time = 0;

    const render = () => {
      time += 0.02;

      const roadY = height * 0.76;
      const roadHeight = height - roadY;

      // 1. Deep Cinematic Sky Gradient (Night twilight with horizon warmth)
      const skyGrad = ctx.createLinearGradient(0, 0, 0, roadY);
      skyGrad.addColorStop(0, "#04070d");
      skyGrad.addColorStop(0.45, "#070e1b");
      skyGrad.addColorStop(0.8, "#0e1c31");
      skyGrad.addColorStop(1, "#19283e"); // Warm ambient horizon glow
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Stars
      for (const s of stars) {
        const currentAlpha = Math.max(0.1, s.alpha + Math.sin(time * 2 + s.x) * 0.25);
        ctx.fillStyle = `rgba(224, 242, 254, ${currentAlpha})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Moon / Distant Celestial Glow
      const moonX = width * 0.82;
      const moonY = height * 0.18;
      const moonGlow = ctx.createRadialGradient(moonX, moonY, 4, moonX, moonY, 120);
      moonGlow.addColorStop(0, "rgba(254, 243, 199, 0.45)");
      moonGlow.addColorStop(0.3, "rgba(186, 230, 253, 0.15)");
      moonGlow.addColorStop(1, "rgba(186, 230, 253, 0)");
      ctx.fillStyle = moonGlow;
      ctx.beginPath();
      ctx.arc(moonX, moonY, 120, 0, Math.PI * 2);
      ctx.fill();

      // Crescent Moon
      ctx.fillStyle = "#fffbeb";
      ctx.beginPath();
      ctx.arc(moonX, moonY, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#070e1b"; // Shadow cutout
      ctx.beginPath();
      ctx.arc(moonX - 5, moonY - 3, 15, 0, Math.PI * 2);
      ctx.fill();

      // 4. Far Skyline Layer
      for (const b of farBuildings) {
        ctx.fillStyle = b.color;
        const topY = roadY - b.height;
        ctx.fillRect(b.x, topY, b.width, b.height);

        // Antenna & Beacon
        if (b.roofType === "antenna") {
          ctx.strokeStyle = "#16253b";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(b.x + b.width / 2, topY);
          ctx.lineTo(b.x + b.width / 2, topY - 24);
          ctx.stroke();

          // Blinking red beacon
          const beaconAlpha = (Math.sin(time * 3 + b.x) + 1) / 2;
          ctx.fillStyle = `rgba(244, 63, 94, ${beaconAlpha})`;
          ctx.beginPath();
          ctx.arc(b.x + b.width / 2, topY - 24, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Atmospheric Horizon Haze
      const haze = ctx.createLinearGradient(0, roadY - 140, 0, roadY);
      haze.addColorStop(0, "rgba(14, 28, 49, 0)");
      haze.addColorStop(1, "rgba(15, 23, 42, 0.7)");
      ctx.fillStyle = haze;
      ctx.fillRect(0, roadY - 140, width, 140);

      // 5. Midground Buildings Layer (Crisp architecture with lit windows)
      for (const b of midBuildings) {
        const topY = roadY - b.height;
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, topY, b.width, b.height);

        // Neon Roof Trim (if present)
        if (b.neonColor) {
          ctx.strokeStyle = b.neonColor;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(b.x, topY);
          ctx.lineTo(b.x + b.width, topY);
          ctx.stroke();
        }

        // Roof Structures
        if (b.roofType === "spire") {
          ctx.fillStyle = b.color;
          ctx.beginPath();
          ctx.moveTo(b.x + 8, topY);
          ctx.lineTo(b.x + b.width / 2, topY - 28);
          ctx.lineTo(b.x + b.width - 8, topY);
          ctx.closePath();
          ctx.fill();
        } else if (b.roofType === "stepped") {
          ctx.fillStyle = b.color;
          ctx.fillRect(b.x + 10, topY - 10, b.width - 20, 10);
          ctx.fillRect(b.x + 20, topY - 18, b.width - 40, 8);
        } else if (b.roofType === "antenna") {
          ctx.strokeStyle = "#334155";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(b.x + b.width * 0.3, topY);
          ctx.lineTo(b.x + b.width * 0.3, topY - 32);
          ctx.stroke();

          // Blinking aviation beacon
          const beaconAlpha = (Math.sin(time * 4 + b.x) + 1) / 2;
          ctx.fillStyle = `rgba(239, 68, 68, ${beaconAlpha})`;
          ctx.beginPath();
          ctx.arc(b.x + b.width * 0.3, topY - 32, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Draw Lit Windows
        for (const w of b.windows) {
          ctx.fillStyle = w.color;
          ctx.fillRect(b.x + w.x, topY + w.y, w.w, w.h);
        }
      }

      // 6. Highway / Expressway Overpass Structure
      // Highway Base Concrete
      ctx.fillStyle = "#060911";
      ctx.fillRect(0, roadY, width, roadHeight);

      // Highway Guardrail / Edge Curb with rim light
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(0, roadY, width, 5);

      const railHighlight = ctx.createLinearGradient(0, roadY, 0, roadY + 2);
      railHighlight.addColorStop(0, "rgba(148, 163, 184, 0.4)");
      railHighlight.addColorStop(1, "rgba(148, 163, 184, 0)");
      ctx.fillStyle = railHighlight;
      ctx.fillRect(0, roadY, width, 2);

      // Road Surface
      ctx.fillStyle = "#090d16";
      ctx.fillRect(0, roadY + 5, width, roadHeight - 5);

      // Lane Divider Dashes (Subtle warm road stripes)
      ctx.fillStyle = "rgba(203, 213, 225, 0.25)";
      const dashWidth = 24;
      const dashGap = 32;
      const stripeY = roadY + 28;
      for (let x = 0; x < width; x += dashWidth + dashGap) {
        ctx.fillRect(x, stripeY, dashWidth, 1.5);
      }

      // Streetlamp Posts with Light Cones
      const lampSpacing = 220;
      for (let lx = 60; lx < width + 100; lx += lampSpacing) {
        // Lamp Pole
        ctx.strokeStyle = "#1e293b";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(lx, roadY);
        ctx.lineTo(lx, roadY - 48);
        ctx.lineTo(lx + 10, roadY - 54);
        ctx.stroke();

        // Warm Luminaire Light Fixture
        ctx.fillStyle = "#fef08a";
        ctx.beginPath();
        ctx.arc(lx + 10, roadY - 54, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Light Pool onto Road (Soft Downward Cone)
        const coneGrad = ctx.createRadialGradient(
          lx + 10,
          roadY - 50,
          2,
          lx + 10,
          roadY + 20,
          65
        );
        coneGrad.addColorStop(0, "rgba(254, 240, 138, 0.12)");
        coneGrad.addColorStop(0.5, "rgba(254, 240, 138, 0.04)");
        coneGrad.addColorStop(1, "rgba(254, 240, 138, 0)");
        ctx.fillStyle = coneGrad;
        ctx.beginPath();
        ctx.moveTo(lx + 10, roadY - 52);
        ctx.lineTo(lx - 45, roadY + 55);
        ctx.lineTo(lx + 65, roadY + 55);
        ctx.closePath();
        ctx.fill();
      }

      // 7. Moving Vehicles (Cars, Vans, Sedans)
      for (const car of cars) {
        // Update Position
        car.x += car.speed * car.direction;

        // Wrap around screen edges seamlessly
        if (car.direction === 1 && car.x > width + 120) {
          car.x = -120;
        } else if (car.direction === -1 && car.x < -120) {
          car.x = width + 120;
        }

        const carTop = car.y - car.height;

        // Draw Car Body Silhouette
        ctx.fillStyle = car.color;
        // Lower Chassis
        ctx.fillRect(car.x, carTop + car.height * 0.45, car.length, car.height * 0.55);

        // Cabin / Roof
        const roofOffset = car.direction === 1 ? car.length * 0.22 : car.length * 0.22;
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
          // RIGHTBOUND: White/Cyan Headlights beam forward
          const frontX = car.x + car.length;
          const lightY = carTop + car.height * 0.65;

          // Headlight bulb
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(frontX, lightY, 2, 0, Math.PI * 2);
          ctx.fill();

          // Luminous Light Beam onto road
          const beamLength = 85;
          const beamSpread = 24;
          const beamGrad = ctx.createLinearGradient(frontX, lightY, frontX + beamLength, lightY);
          beamGrad.addColorStop(0, "rgba(255, 255, 255, 0.45)");
          beamGrad.addColorStop(0.2, "rgba(224, 242, 254, 0.25)");
          beamGrad.addColorStop(1, "rgba(224, 242, 254, 0)");

          ctx.fillStyle = beamGrad;
          ctx.beginPath();
          ctx.moveTo(frontX, lightY - 1);
          ctx.lineTo(frontX + beamLength, lightY - beamSpread * 0.3);
          ctx.lineTo(frontX + beamLength, lightY + beamSpread);
          ctx.lineTo(frontX, lightY + 2);
          ctx.closePath();
          ctx.fill();

          // Subtle red tail indicator
          ctx.fillStyle = "rgba(239, 68, 68, 0.8)";
          ctx.fillRect(car.x - 1, lightY - 1, 2, 3);
        } else {
          // LEFTBOUND: Red Taillights with glowing streak
          const backX = car.x + car.length;
          const lightY = carTop + car.height * 0.65;

          // Taillight bulb
          ctx.fillStyle = "#ef4444";
          ctx.beginPath();
          ctx.arc(backX, lightY, 2.5, 0, Math.PI * 2);
          ctx.fill();

          // Red Light Trail / Bloom behind vehicle
          const trailLength = 55;
          const trailGrad = ctx.createLinearGradient(backX, lightY, backX + trailLength, lightY);
          trailGrad.addColorStop(0, "rgba(239, 68, 68, 0.65)");
          trailGrad.addColorStop(0.4, "rgba(220, 38, 38, 0.2)");
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

      // 8. Cinematic Vignette & Bottom Depth
      const vignette = ctx.createRadialGradient(
        width / 2,
        height / 2,
        height * 0.25,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.75
      );
      vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
      vignette.addColorStop(0.65, "rgba(3, 7, 18, 0.4)");
      vignette.addColorStop(1, "rgba(2, 6, 23, 0.88)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);

      // Bottom Fog Gradient to softly anchor the page footer
      const groundFog = ctx.createLinearGradient(0, height - 90, 0, height);
      groundFog.addColorStop(0, "rgba(2, 6, 23, 0)");
      groundFog.addColorStop(1, "rgba(2, 6, 23, 0.75)");
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
