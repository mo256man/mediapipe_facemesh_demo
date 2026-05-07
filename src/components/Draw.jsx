import { useRef, useState, useEffect, forwardRef } from "react";
import "./Draw.css";

const BG_SRC = `${import.meta.env.BASE_URL}face_mesh_2d.png`;
const BG_MODES = ["visible", "translucent", "hidden"];
const BG_LABELS = { visible: "🖼️ BG", translucent: "🖼️ BG½", hidden: "🖼️ BG✕" };
const DRAW_MODES = ["visible", "translucent"];
const DRAW_LABELS = { visible: "✏️ Draw", translucent: "✏️ Draw½" };

const Draw = forwardRef(function Draw({ savedImages: externalSavedImages, setSavedImages: externalSetSavedImages }, forwardedRef) {
  const bgCanvasRef = useRef(null);
  const drawCanvasRef = useRef(null);
  const setDrawCanvasRef = (el) => {
    drawCanvasRef.current = el;
    if (typeof forwardedRef === "function") forwardedRef(el);
    else if (forwardedRef) forwardedRef.current = el;
  };
  const containerRef = useRef(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef(null);

  const [color, setColor] = useState("#ff0000");
  const [brushSize, setBrushSize] = useState(8);
  const [tool, setTool] = useState("pen");
  const [bgImage, setBgImage] = useState(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [bgMode, setBgMode] = useState("visible");
  const [drawMode, setDrawMode] = useState("visible");
  const [savedImages, setSavedImages] = useState(externalSavedImages || []);

  /* --- 背景画像読み込み --- */
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setBgImage(img);
      // コンテナサイズから正方形サイズを決定
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const containerHeight = containerRef.current.offsetHeight;
        const size = Math.min(containerWidth, containerHeight);
        setCanvasSize({ width: size, height: size });
      }
    };
    img.src = BG_SRC;
  }, []);

  /* --- 外部からの savedImages 更新を同期 --- */
  useEffect(() => {
    if (externalSavedImages) {
      setSavedImages(externalSavedImages);
    }
  }, [externalSavedImages]);

  /* --- コンテナリサイズ監視 --- */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      const containerWidth = container.offsetWidth;
      const containerHeight = container.offsetHeight;
      const size = Math.min(containerWidth, containerHeight);
      setCanvasSize({ width: size, height: size });
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  /* --- BG描画 --- */
  useEffect(() => {
    if (!bgImage || !bgCanvasRef.current) return;
    const ctx = bgCanvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
    if (bgMode === "visible") {
      ctx.globalAlpha = 1;
      ctx.drawImage(bgImage, 0, 0, canvasSize.width, canvasSize.height);
    } else if (bgMode === "translucent") {
      ctx.globalAlpha = 0.3;
      ctx.drawImage(bgImage, 0, 0, canvasSize.width, canvasSize.height);
      ctx.globalAlpha = 1;
    }
  }, [bgImage, canvasSize, bgMode]);

  const cycleBgMode = () => {
    setBgMode((prev) => BG_MODES[(BG_MODES.indexOf(prev) + 1) % BG_MODES.length]);
  };

  const cycleDrawMode = () => {
    setDrawMode((prev) => DRAW_MODES[(DRAW_MODES.indexOf(prev) + 1) % DRAW_MODES.length]);
  };

  /* --- 座標取得 --- */
  const getPos = (e) => {
    const c = drawCanvasRef.current;
    const r = c.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (cx - r.left) * (c.width / r.width),
      y: (cy - r.top) * (c.height / r.height),
    };
  };

  /* --- 描画 --- */
  const applyMode = (ctx) => {
    if (tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = ctx.fillStyle = "rgba(0,0,0,1)";
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = ctx.fillStyle = color;
    }
  };

  const startDraw = (e) => {
    e.preventDefault();
    isDrawingRef.current = true;
    const pos = getPos(e);
    lastPosRef.current = pos;
    const ctx = drawCanvasRef.current.getContext("2d");
    applyMode(ctx);
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
  };

  const draw = (e) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    const ctx = drawCanvasRef.current.getContext("2d");
    const pos = getPos(e);
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    applyMode(ctx);
    ctx.beginPath();
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPosRef.current = pos;
  };

  const endDraw = () => {
    isDrawingRef.current = false;
    lastPosRef.current = null;
  };

  const clearDrawing = () => {
    const ctx = drawCanvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
  };

  /* --- メモリ保存 --- */
  const saveToMemory = () => {
    const dataUrl = drawCanvasRef.current.toDataURL("image/png");
    const newImages = [
      ...savedImages,
      { id: Date.now(), dataUrl, timestamp: new Date().toLocaleTimeString() },
    ];
    setSavedImages(newImages);
    if (externalSetSavedImages) {
      externalSetSavedImages(newImages);
    }
  };

  const deleteFromMemory = (id) => {
    const newImages = savedImages.filter((img) => img.id !== id);
    setSavedImages(newImages);
    if (externalSetSavedImages) {
      externalSetSavedImages(newImages);
    }
  };

  /* --- ローカルにダウンロード --- */
  const downloadDrawing = () => {
    // 1000x1000 のキャンバスを作成してリサイズ
    const resizedCanvas = document.createElement("canvas");
    resizedCanvas.width = 1000;
    resizedCanvas.height = 1000;
    const resizedCtx = resizedCanvas.getContext("2d");

    // 現在のキャンバスを新しいキャンバスにコピー（リサイズ）
    const sourceCanvas = drawCanvasRef.current;
    resizedCtx.drawImage(sourceCanvas, 0, 0, sourceCanvas.width, sourceCanvas.height, 0, 0, 1000, 1000);

    const dataUrl = resizedCanvas.toDataURL("image/png");
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const date = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    const filename = `texture_${year}${month}${date}_${hours}${minutes}${seconds}.png`;

    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="draw-app">
      <div className="draw-toolbar">
        <button className="draw-btn" onClick={cycleBgMode}>
          {BG_LABELS[bgMode]}
        </button>
        <button className="draw-btn" onClick={cycleDrawMode}>
          {DRAW_LABELS[drawMode]}
        </button>
        <button
          className={`draw-btn ${tool === "pen" ? "active" : ""}`}
          onClick={() => setTool("pen")}
        >
          ✏️ Pen
        </button>
        <button
          className={`draw-btn ${tool === "eraser" ? "active" : ""}`}
          onClick={() => setTool("eraser")}
        >
          🧹 Eraser
        </button>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          title="Color"
        />
        <div className="draw-size-ctrl">
          <span>{brushSize}px</span>
          <input
            type="range"
            min="1"
            max="80"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
          />
        </div>
        <button className="draw-btn" onClick={clearDrawing}>
          🗑️ Clear
        </button>
        <button className="draw-btn draw-save-btn" onClick={saveToMemory}>
          💾 Save
        </button>
        <button className="draw-btn" onClick={downloadDrawing}>
          📥 Download
        </button>
      </div>

      <div className="draw-canvas-area" ref={containerRef}>
        <div className="draw-canvas-stack">
          <canvas
            ref={bgCanvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            className="draw-bg-canvas"
          />
          <canvas
            ref={setDrawCanvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            className="draw-draw-canvas"
            style={{ opacity: drawMode === "translucent" ? 0.3 : 1 }}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={endDraw}
          />
        </div>
      </div>
    </div>
  );
});

export default Draw;