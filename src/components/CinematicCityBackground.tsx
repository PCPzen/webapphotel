"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "./ThemeProvider";

interface Car {
  x: number;
  y: number;
  speed: number;
  direction: 1 | -1;
  length: number;
  height: number;
  colorDay: string;
  colorNight: string;
  roofLength: number;
}

interface Cloud {
  x: number;
  y: number;
  speed: number;
  scale: number;
  alpha: number;
}

interface Building {
  x: number;
  width: number;
  height: number;
  roofType: "flat" | "spire" | "antenna" | "stepped";
  windows: { x: number; y: number; w: number; h: number; litNight: boolean; colorNight: string }[];
  neonColor?: string;
}

export default function CinematicCityBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { theme } = useTheme();
  const themeRef = useRef<"dark" | "light">(theme);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let animationFrameId: number;
    let isRunning = true;
    let lastFrameTime = performance.now();

    // Cap resolution to avoid GPU fill-rate bottlenecks on 4K/retina displays
    const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
    let width = Math.floor(window.innerWidth * dpr);
    let height = Math.floor(window.innerHeight * dpr);
    canvas.width = width;
    canvas.height = height;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // -------------------------------------------------------------------------
    // Pre-allocated Sprites (Zero Memory Allocations in Loop)
    // -------------------------------------------------------------------------
    let headlightSprite: HTMLCanvasElement;
    let taillightSprite: HTMLCanvasElement;
    let staticDarkCanvas: HTMLCanvasElement;
    let staticLightCanvas: HTMLCanvasElement;

    // Create Headlight Sprite Once
    const createHeadlightSprite = () => {
      const s = document.createElement("canvas");
      s.width = 100;
      s.height = 36;
      const sctx = s.getContext("2d");
      if (sctx) {
        const grad = sctx.createLinearGradient(0, 18, 100, 18);
        grad.addColorStop(0, "rgba(255, 255, 255, 0.55)");
        grad.addColorStop(0.25, "rgba(224, 242, 254, 0.25)");
        grad.addColorStop(1, "rgba(224, 242, 254, 0)");
        sctx.fillStyle = grad;
        sctx.beginPath();
        sctx.moveTo(0, 18);
        sctx.lineTo(100, 2);
        sctx.lineTo(100, 34);
        sctx.closePath();
        sctx.fill();
      }
      return s;
    };

    // Create Taillight Sprite Once
    const createTaillightSprite = () => {
      const s = document.createElement("canvas");
      s.width = 65;
      s.height = 20;
      const sctx = s.getContext("2d");
      if (sctx) {
        const grad = sctx.createLinearGradient(0, 10, 65, 10);
        grad.addColorStop(0, "rgba(239, 68, 68, 0.75)");
        grad.addColorStop(0.35, "rgba(220, 38, 38, 0.25)");
        grad.addColorStop(1, "rgba(220, 38, 38, 0)");
        sctx.fillStyle = grad;
        sctx.beginPath();
        sctx.moveTo(0, 10);
        sctx.lineTo(65, 3);
        sctx.lineTo(65, 17);
        sctx.closePath();
        sctx.fill();
      }
      return s;
    };

    headlightSprite = createHeadlightSprite();
    taillightSprite = createTaillightSprite();

    // -------------------------------------------------------------------------
    // Scene Elements Setup
    // -------------------------------------------------------------------------
    let cars: Car[] = [];
    let clouds: Cloud[] = [];

    const setupScene = () => {
      const roadY = height * 0.76;

      // 1. Moving Clouds
      clouds = [];
      const cloudCount = Math.max(4, Math.floor(width / (260 * dpr)));
      for (let i = 0; i < cloudCount; i++) {
        clouds.push({
          x: Math.random() * width,
          y: Math.random() * (roadY * 0.35) + 20 * dpr,
          speed: (Math.random() * 0.25 + 0.1) * dpr,
          scale: (Math.random() * 0.5 + 0.7) * dpr,
          alpha: Math.random() * 0.3 + 0.5,
        });
      }

      // 2. Moving Cars
      cars = [];
      const carCount = Math.max(10, Math.floor(width / (130 * dpr)));
      const lane1Y = roadY + 16 * dpr;
      const lane2Y = roadY + 36 * dpr;

      const dayColors = ["#f8fafc", "#ef4444", "#3b82f6", "#eab308", "#10b981", "#64748b", "#0f172a"];
      const nightColors = ["#1f2937", "#111827", "#374151", "#0f172a", "#1e293b"];

      for (let i = 0; i < carCount; i++) {
        const isRightbound = Math.random() > 0.45;
        const length = (Math.random() > 0.8 ? 42 : Math.random() > 0.5 ? 32 : 26) * dpr;
        const carHeight = (length > 36 * dpr ? 14 : 10) * dpr;

        cars.push({
          x: Math.random() * (width + 200 * dpr) - 100 * dpr,
          y: isRightbound ? lane1Y : lane2Y,
          speed: (Math.random() * 1.5 + 1.1) * dpr * (prefersReducedMotion ? 0.3 : 1),
          direction: isRightbound ? 1 : -1,
          length,
          height: carHeight,
          colorDay: dayColors[Math.floor(Math.random() * dayColors.length)],
          colorNight: nightColors[Math.floor(Math.random() * nightColors.length)],
          roofLength: length * 0.55,
        });
      }

      // 3. Buildings Data for Offscreen Baking
      const farBuildings: Building[] = [];
      let curX = -40 * dpr;
      while (curX < width + 100 * dpr) {
        const bWidth = Math.floor(Math.random() * 80 + 50) * dpr;
        const bHeight = Math.floor(Math.random() * (height * 0.32) + height * 0.2);
        farBuildings.push({
          x: curX,
          width: bWidth,
          height: bHeight,
          roofType: Math.random() > 0.6 ? "antenna" : "flat",
          windows: [],
        });
        curX += bWidth + Math.floor(Math.random() * 15 - 5) * dpr;
      }

      const midBuildings: Building[] = [];
      curX = -20 * dpr;
      const windowPalettes = ["#ffdd80", "#ffeeb3", "#9bd4ff", "#ffba66", "#d1e8ff"];
      while (curX < width + 120 * dpr) {
        const bWidth = Math.floor(Math.random() * 95 + 65) * dpr;
        const bHeight = Math.floor(Math.random() * (height * 0.26) + height * 0.16);
        const windows: Building["windows"] = [];

        const colStep = 14 * dpr;
        const rowStep = 16 * dpr;
        const cols = Math.floor(bWidth / colStep);
        const rows = Math.floor(bHeight / rowStep);
        for (let r = 1; r < rows - 1; r++) {
          for (let c = 1; c < cols; c++) {
            windows.push({
              x: c * colStep,
              y: r * rowStep,
              w: 6 * dpr,
              h: 8 * dpr,
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
          neonColor: neonColors[Math.floor(Math.random() * neonColors.length)],
        });
        curX += bWidth + Math.floor(Math.random() * 12) * dpr;
      }

      // Stars
      const stars: { x: number; y: number; r: number; a: number }[] = [];
      const starCount = Math.floor(width * 0.06);
      for (let i = 0; i < starCount; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * (roadY * 0.55),
          r: (Math.random() * 1.1 + 0.4) * dpr,
          a: Math.random() * 0.6 + 0.3,
        });
      }

      // -----------------------------------------------------------------------
      // BAKE STATIC OFFSCREEN CANVASES (Baked Once: 0 Cost in Loop)
      // -----------------------------------------------------------------------
      const roadHeight = height - roadY;
      const celestialX = width * 0.82;
      const celestialY = height * 0.18;

      // --- BAKE DARK STATIC SCENE ---
      staticDarkCanvas = document.createElement("canvas");
      staticDarkCanvas.width = width;
      staticDarkCanvas.height = height;
      const dctx = staticDarkCanvas.getContext("2d");
      if (dctx) {
        // Sky
        const sky = dctx.createLinearGradient(0, 0, 0, roadY);
        sky.addColorStop(0, "#04070d");
        sky.addColorStop(0.5, "#070e1b");
        sky.addColorStop(1, "#19283e");
        dctx.fillStyle = sky;
        dctx.fillRect(0, 0, width, height);

        // Moon Glow & Crescent
        const mGlow = dctx.createRadialGradient(celestialX, celestialY, 4, celestialX, celestialY, 110 * dpr);
        mGlow.addColorStop(0, "rgba(254, 243, 199, 0.4)");
        mGlow.addColorStop(0.35, "rgba(186, 230, 253, 0.12)");
        mGlow.addColorStop(1, "rgba(186, 230, 253, 0)");
        dctx.fillStyle = mGlow;
        dctx.beginPath();
        dctx.arc(celestialX, celestialY, 110 * dpr, 0, Math.PI * 2);
        dctx.fill();

        dctx.fillStyle = "#fffbeb";
        dctx.beginPath();
        dctx.arc(celestialX, celestialY, 16 * dpr, 0, Math.PI * 2);
        dctx.fill();
        dctx.fillStyle = "#070e1b";
        dctx.beginPath();
        dctx.arc(celestialX - 5 * dpr, celestialY - 3 * dpr, 15 * dpr, 0, Math.PI * 2);
        dctx.fill();

        // Stars
        for (const s of stars) {
          dctx.fillStyle = `rgba(224, 242, 254, ${s.a})`;
          dctx.beginPath();
          dctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          dctx.fill();
        }

        // Far Buildings (Dark Obsidian & Slate Silhouette)
        const darkFarPalettes = ["#09111e", "#0c1626", "#0e1a2d", "#080e1a"];
        for (let i = 0; i < farBuildings.length; i++) {
          const b = farBuildings[i];
          const topY = roadY - b.height;
          dctx.fillStyle = darkFarPalettes[i % darkFarPalettes.length];
          dctx.fillRect(b.x, topY, b.width, b.height);

          if (b.roofType === "antenna") {
            dctx.strokeStyle = "#16253b";
            dctx.lineWidth = 1.5;
            dctx.beginPath();
            dctx.moveTo(b.x + b.width / 2, topY);
            dctx.lineTo(b.x + b.width / 2, topY - 24 * dpr);
            dctx.stroke();

            // Subtle red beacon dot (carefully isolated)
            dctx.fillStyle = "#f43f5e";
            dctx.beginPath();
            dctx.arc(b.x + b.width / 2, topY - 24 * dpr, 2 * dpr, 0, Math.PI * 2);
            dctx.fill();
          }
        }

        // Mid Buildings (Dark Midnight Architectural Tone with Glowing Windows)
        const darkMidPalettes = ["#060a12", "#080e1a", "#0a1220", "#070c17"];
        for (let i = 0; i < midBuildings.length; i++) {
          const b = midBuildings[i];
          const topY = roadY - b.height;
          const bColor = darkMidPalettes[i % darkMidPalettes.length];

          // Building Body
          dctx.fillStyle = bColor;
          dctx.fillRect(b.x, topY, b.width, b.height);

          // Neon Accent Trim
          if (b.neonColor) {
            dctx.strokeStyle = b.neonColor;
            dctx.lineWidth = 2;
            dctx.beginPath();
            dctx.moveTo(b.x, topY);
            dctx.lineTo(b.x + b.width, topY);
            dctx.stroke();
          }

          // Roof Shapes (Explicit fillStyle each time)
          if (b.roofType === "spire") {
            dctx.fillStyle = bColor;
            dctx.beginPath();
            dctx.moveTo(b.x + 8 * dpr, topY);
            dctx.lineTo(b.x + b.width / 2, topY - 28 * dpr);
            dctx.lineTo(b.x + b.width - 8 * dpr, topY);
            dctx.fill();
          } else if (b.roofType === "stepped") {
            dctx.fillStyle = bColor;
            dctx.fillRect(b.x + 10 * dpr, topY - 10 * dpr, b.width - 20 * dpr, 10 * dpr);
            dctx.fillRect(b.x + 20 * dpr, topY - 18 * dpr, b.width - 40 * dpr, 8 * dpr);
          } else if (b.roofType === "antenna") {
            dctx.strokeStyle = "#1e293b";
            dctx.lineWidth = 1.5;
            dctx.beginPath();
            dctx.moveTo(b.x + b.width * 0.35, topY);
            dctx.lineTo(b.x + b.width * 0.35, topY - 20 * dpr);
            dctx.stroke();

            dctx.fillStyle = "#f43f5e";
            dctx.beginPath();
            dctx.arc(b.x + b.width * 0.35, topY - 20 * dpr, 1.8 * dpr, 0, Math.PI * 2);
            dctx.fill();
          }

          // Windows (Strictly scoped)
          for (const w of b.windows) {
            dctx.fillStyle = w.litNight ? w.colorNight : "rgba(15, 23, 42, 0.4)";
            dctx.fillRect(b.x + w.x, topY + w.y, w.w, w.h);
          }
        }

        // Highway Structure (Dark)
        dctx.fillStyle = "#060911";
        dctx.fillRect(0, roadY, width, roadHeight);
        dctx.fillStyle = "#1e293b";
        dctx.fillRect(0, roadY, width, 5 * dpr);
        dctx.fillStyle = "#090d16";
        dctx.fillRect(0, roadY + 5 * dpr, width, roadHeight - 5 * dpr);

        // Lane Stripes
        dctx.fillStyle = "rgba(203, 213, 225, 0.25)";
        const dashW = 24 * dpr;
        const dashG = 32 * dpr;
        for (let x = 0; x < width; x += dashW + dashG) {
          dctx.fillRect(x, roadY + 28 * dpr, dashW, 1.5 * dpr);
        }

        // Streetlamps with Light Cones (Baked Once)
        const lampSpacing = 220 * dpr;
        for (let lx = 60 * dpr; lx < width + 100 * dpr; lx += lampSpacing) {
          dctx.strokeStyle = "#1e293b";
          dctx.lineWidth = 2 * dpr;
          dctx.beginPath();
          dctx.moveTo(lx, roadY);
          dctx.lineTo(lx, roadY - 48 * dpr);
          dctx.lineTo(lx + 10 * dpr, roadY - 54 * dpr);
          dctx.stroke();

          // Bulb
          dctx.fillStyle = "#fef08a";
          dctx.beginPath();
          dctx.arc(lx + 10 * dpr, roadY - 54 * dpr, 2.5 * dpr, 0, Math.PI * 2);
          dctx.fill();

          // Cone
          const cone = dctx.createRadialGradient(lx + 10 * dpr, roadY - 50 * dpr, 2, lx + 10 * dpr, roadY + 20 * dpr, 65 * dpr);
          cone.addColorStop(0, "rgba(254, 240, 138, 0.12)");
          cone.addColorStop(0.5, "rgba(254, 240, 138, 0.03)");
          cone.addColorStop(1, "rgba(254, 240, 138, 0)");
          dctx.fillStyle = cone;
          dctx.beginPath();
          dctx.moveTo(lx + 10 * dpr, roadY - 52 * dpr);
          dctx.lineTo(lx - 45 * dpr, roadY + 55 * dpr);
          dctx.lineTo(lx + 65 * dpr, roadY + 55 * dpr);
          dctx.closePath();
          dctx.fill();
        }

        // Vignette (Baked into Dark Scene)
        const vig = dctx.createRadialGradient(width / 2, height / 2, height * 0.25, width / 2, height / 2, Math.max(width, height) * 0.75);
        vig.addColorStop(0, "rgba(0, 0, 0, 0)");
        vig.addColorStop(0.65, "rgba(3, 7, 18, 0.35)");
        vig.addColorStop(1, "rgba(2, 6, 23, 0.82)");
        dctx.fillStyle = vig;
        dctx.fillRect(0, 0, width, height);
      }

      // --- BAKE LIGHT STATIC SCENE ---
      staticLightCanvas = document.createElement("canvas");
      staticLightCanvas.width = width;
      staticLightCanvas.height = height;
      const lctx = staticLightCanvas.getContext("2d");
      if (lctx) {
        // Daytime Sky
        const sky = lctx.createLinearGradient(0, 0, 0, roadY);
        sky.addColorStop(0, "#7dd3fc");
        sky.addColorStop(0.5, "#bae6fd");
        sky.addColorStop(1, "#fef3c7");
        lctx.fillStyle = sky;
        lctx.fillRect(0, 0, width, height);

        // Sun
        const sGlow = lctx.createRadialGradient(celestialX, celestialY, 6, celestialX, celestialY, 130 * dpr);
        sGlow.addColorStop(0, "rgba(253, 224, 71, 0.7)");
        sGlow.addColorStop(0.35, "rgba(254, 240, 138, 0.2)");
        sGlow.addColorStop(1, "rgba(254, 240, 138, 0)");
        lctx.fillStyle = sGlow;
        lctx.beginPath();
        lctx.arc(celestialX, celestialY, 130 * dpr, 0, Math.PI * 2);
        lctx.fill();

        lctx.fillStyle = "#fffbeb";
        lctx.beginPath();
        lctx.arc(celestialX, celestialY, 20 * dpr, 0, Math.PI * 2);
        lctx.fill();

        // Far Buildings (Daytime Slate)
        const lightFarPalettes = ["#94a3b8", "#a1a1aa", "#9ca3af", "#8da2b5"];
        for (let i = 0; i < farBuildings.length; i++) {
          const b = farBuildings[i];
          const topY = roadY - b.height;
          lctx.fillStyle = lightFarPalettes[i % lightFarPalettes.length];
          lctx.fillRect(b.x, topY, b.width, b.height);
        }

        // Mid Buildings (Daytime Architectural Slate)
        const lightMidPalettes = ["#cbd5e1", "#d4d4d8", "#e2e8f0", "#c8d3e0"];
        for (let i = 0; i < midBuildings.length; i++) {
          const b = midBuildings[i];
          const topY = roadY - b.height;
          const bColor = lightMidPalettes[i % lightMidPalettes.length];

          lctx.fillStyle = bColor;
          lctx.fillRect(b.x, topY, b.width, b.height);

          if (b.roofType === "spire") {
            lctx.fillStyle = bColor;
            lctx.beginPath();
            lctx.moveTo(b.x + 8 * dpr, topY);
            lctx.lineTo(b.x + b.width / 2, topY - 28 * dpr);
            lctx.lineTo(b.x + b.width - 8 * dpr, topY);
            lctx.fill();
          } else if (b.roofType === "stepped") {
            lctx.fillStyle = bColor;
            lctx.fillRect(b.x + 10 * dpr, topY - 10 * dpr, b.width - 20 * dpr, 10 * dpr);
            lctx.fillRect(b.x + 20 * dpr, topY - 18 * dpr, b.width - 40 * dpr, 8 * dpr);
          }

          // Day Windows (Sunlit Glass)
          for (const w of b.windows) {
            lctx.fillStyle = "rgba(241, 245, 249, 0.85)";
            lctx.fillRect(b.x + w.x, topY + w.y, w.w, w.h);
          }
        }

        // Highway Structure (Day)
        lctx.fillStyle = "#94a3b8";
        lctx.fillRect(0, roadY, width, roadHeight);
        lctx.fillStyle = "#64748b";
        lctx.fillRect(0, roadY, width, 5 * dpr);
        lctx.fillStyle = "#475569";
        lctx.fillRect(0, roadY + 5 * dpr, width, roadHeight - 5 * dpr);

        // Stripes
        lctx.fillStyle = "#ffffff";
        const dashW = 24 * dpr;
        const dashG = 32 * dpr;
        for (let x = 0; x < width; x += dashW + dashG) {
          lctx.fillRect(x, roadY + 28 * dpr, dashW, 1.5 * dpr);
        }

        // Streetlamps (Day)
        const lampSpacing = 220 * dpr;
        for (let lx = 60 * dpr; lx < width + 100 * dpr; lx += lampSpacing) {
          lctx.strokeStyle = "#64748b";
          lctx.lineWidth = 2 * dpr;
          lctx.beginPath();
          lctx.moveTo(lx, roadY);
          lctx.lineTo(lx, roadY - 48 * dpr);
          lctx.lineTo(lx + 10 * dpr, roadY - 54 * dpr);
          lctx.stroke();

          lctx.fillStyle = "#f8fafc";
          lctx.beginPath();
          lctx.arc(lx + 10 * dpr, roadY - 54 * dpr, 2.5 * dpr, 0, Math.PI * 2);
          lctx.fill();
        }

        // Vignette (Day Soft)
        const vig = lctx.createRadialGradient(width / 2, height / 2, height * 0.25, width / 2, height / 2, Math.max(width, height) * 0.75);
        vig.addColorStop(0, "rgba(255, 255, 255, 0)");
        vig.addColorStop(0.7, "rgba(203, 213, 225, 0.15)");
        vig.addColorStop(1, "rgba(148, 163, 184, 0.35)");
        lctx.fillStyle = vig;
        lctx.fillRect(0, 0, width, height);
      }
    };

    setupScene();

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = Math.floor(window.innerWidth * dpr);
      height = canvas.height = Math.floor(window.innerHeight * dpr);
      setupScene();
    };
    window.addEventListener("resize", handleResize);

    // -------------------------------------------------------------------------
    // Visibility API (Sleep when tab is inactive)
    // -------------------------------------------------------------------------
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isRunning = false;
        cancelAnimationFrame(animationFrameId);
      } else {
        isRunning = true;
        lastFrameTime = performance.now();
        animationFrameId = requestAnimationFrame(render);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // -------------------------------------------------------------------------
    // Ultra-Fast 60fps Animation Loop (Zero GC, Hardware Accelerated)
    // -------------------------------------------------------------------------
    let currentT = themeRef.current === "dark" ? 1 : 0;

    const render = (now: number) => {
      if (!isRunning) return;

      // Throttle to max 60 FPS (skips extra frames on 120Hz/144Hz displays)
      const elapsed = now - lastFrameTime;
      if (elapsed < 16) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }
      lastFrameTime = now;

      // Smooth theme interpolation
      const targetT = themeRef.current === "dark" ? 1 : 0;
      if (Math.abs(currentT - targetT) > 0.005) {
        currentT += (targetT - currentT) * 0.08;
      } else {
        currentT = targetT;
      }

      // 1. Draw Pre-baked Background (Instant 1 or 2 Draw Calls!)
      if (currentT >= 0.99) {
        ctx.drawImage(staticDarkCanvas, 0, 0);
      } else if (currentT <= 0.01) {
        ctx.drawImage(staticLightCanvas, 0, 0);
      } else {
        // Crossfade during theme toggle
        ctx.drawImage(staticLightCanvas, 0, 0);
        ctx.globalAlpha = currentT;
        ctx.drawImage(staticDarkCanvas, 0, 0);
        ctx.globalAlpha = 1;
      }

      // 2. Draw Moving Clouds (Only in daytime)
      if (currentT < 0.8) {
        const cloudOpacity = (1 - currentT) * 0.85;
        for (let i = 0; i < clouds.length; i++) {
          const c = clouds[i];
          c.x += c.speed;
          if (c.x > width + 150 * dpr) c.x = -150 * dpr;

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

      // 3. Draw Moving Vehicles
      const isNight = currentT > 0.4;
      const headlightAlpha = Math.max(0, currentT * 0.9);
      const taillightAlpha = Math.max(0, currentT * 0.9);

      for (let i = 0; i < cars.length; i++) {
        const car = cars[i];
        car.x += car.speed * car.direction;

        if (car.direction === 1 && car.x > width + 100 * dpr) {
          car.x = -100 * dpr;
        } else if (car.direction === -1 && car.x < -100 * dpr) {
          car.x = width + 100 * dpr;
        }

        const carTop = car.y - car.height;

        // Car Body
        ctx.fillStyle = isNight ? car.colorNight : car.colorDay;
        ctx.fillRect(car.x, carTop + car.height * 0.45, car.length, car.height * 0.55);

        // Roof
        const roofOffset = car.length * 0.22;
        ctx.beginPath();
        ctx.moveTo(car.x + roofOffset, carTop + car.height * 0.45);
        ctx.lineTo(car.x + roofOffset + 6 * dpr, carTop);
        ctx.lineTo(car.x + roofOffset + car.roofLength - 6 * dpr, carTop);
        ctx.lineTo(car.x + roofOffset + car.roofLength, carTop + car.height * 0.45);
        ctx.closePath();
        ctx.fill();

        // Wheels
        ctx.fillStyle = "#020617";
        const wheelR = car.height * 0.28;
        ctx.beginPath();
        ctx.arc(car.x + car.length * 0.24, car.y + 1, wheelR, 0, Math.PI * 2);
        ctx.arc(car.x + car.length * 0.76, car.y + 1, wheelR, 0, Math.PI * 2);
        ctx.fill();

        // Lights (Zero Gradient Allocations: Uses GPU Sprites)
        if (car.direction === 1) {
          // Rightbound: Headlights
          const frontX = car.x + car.length;
          const lightY = carTop + car.height * 0.65;

          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(frontX, lightY, 1.8 * dpr, 0, Math.PI * 2);
          ctx.fill();

          if (headlightAlpha > 0.05) {
            ctx.globalAlpha = headlightAlpha;
            ctx.drawImage(headlightSprite, frontX, lightY - 18);
            ctx.globalAlpha = 1;
          }

          ctx.fillStyle = "rgba(239, 68, 68, 0.8)";
          ctx.fillRect(car.x - 1, lightY - 1, 2 * dpr, 3 * dpr);
        } else {
          // Leftbound: Taillights
          const backX = car.x + car.length;
          const lightY = carTop + car.height * 0.65;

          ctx.fillStyle = "#ef4444";
          ctx.beginPath();
          ctx.arc(backX, lightY, 2.2 * dpr, 0, Math.PI * 2);
          ctx.fill();

          if (taillightAlpha > 0.05) {
            ctx.globalAlpha = taillightAlpha;
            ctx.drawImage(taillightSprite, backX, lightY - 10);
            ctx.globalAlpha = 1;
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none contain-strict transform-gpu will-change-transform"
      style={{ backfaceVisibility: "hidden" }}
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}
