import React, { useEffect, useRef, useState } from "react";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

const TEXTURE_SIZE = 1024;

function parseOBJTriangles(text) {
  const vs = [];
  const vts = [];
  const triangles = [];
  text.split(/\r?\n/).forEach((l) => {
    const t = l.trim();
    if (t.startsWith("v ")) {
      const [, x, y, z] = t.split(/\s+/);
      vs.push([+x, +y, +z]);
    } else if (t.startsWith("vt ")) {
      const [, u, v] = t.split(/\s+/);
      vts.push([+u, +v]);
    } else if (t.startsWith("f ")) {
      const ps = t.split(/\s+/).slice(1);
      const verts = ps.map((p) => {
        const [a, b] = p.split("/");
        return { vi: +a - 1, vti: b ? +b - 1 : -1 };
      });
      for (let i = 1; i + 1 < verts.length; i++) {
        const tri = [verts[0], verts[i], verts[i + 1]];

        // Canonical normal z from OBJ 3D positions (y-up OpenGL space).
        // Front-facing triangles have canonicalNz > 0.
        const [cp0, cp1, cp2] = tri.map((v) => vs[v.vi]);
        const ce1x = cp1[0] - cp0[0], ce1y = cp1[1] - cp0[1];
        const ce2x = cp2[0] - cp0[0], ce2y = cp2[1] - cp0[1];
        const canonicalNz = ce1x * ce2y - ce1y * ce2x;

        triangles.push({
          srcIndices: tri.map((v) => v.vi),
          uvCoords: tri.map((v) => (v.vti >= 0 ? vts[v.vti] : [0, 0])),
          canonicalNz,
        });
      }
    }
  });
  return triangles;
}

function loadImage(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = dataUrl;
  });
}

function det3(m) {
  return (
    m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
    m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
    m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0])
  );
}

function solve3(M, b) {
  const D = det3(M);
  if (Math.abs(D) < 1e-10) return [1, 0, 0];

  const Dx = det3([
    [b[0], M[0][1], M[0][2]],
    [b[1], M[1][1], M[1][2]],
    [b[2], M[2][1], M[2][2]],
  ]);

  const Dy = det3([
    [M[0][0], b[0], M[0][2]],
    [M[1][0], b[1], M[1][2]],
    [M[2][0], b[2], M[2][2]],
  ]);

  const Dz = det3([
    [M[0][0], M[0][1], b[0]],
    [M[1][0], M[1][1], b[1]],
    [M[2][0], M[2][1], b[2]],
  ]);

  return [Dx / D, Dy / D, Dz / D];
}

function drawTriangleAffine(ctx, img, src, dst) {
  const [s0, s1, s2] = src;
  const [d0, d1, d2] = dst;

  const M = [
    [s0.x, s0.y, 1],
    [s1.x, s1.y, 1],
    [s2.x, s2.y, 1],
  ];

  const [a, c, e] = solve3(M, [d0.x, d1.x, d2.x]);
  const [b, d, f] = solve3(M, [d0.y, d1.y, d2.y]);

  ctx.save();

  ctx.beginPath();
  ctx.moveTo(d0.x, d0.y);
  ctx.lineTo(d1.x, d1.y);
  ctx.lineTo(d2.x, d2.y);
  ctx.closePath();
  ctx.clip();

  ctx.setTransform(a, b, c, d, e, f);
  ctx.drawImage(img, 0, 0);

  ctx.restore();
}

function pointInTriangle(px, py, a, b, c) {
  const area = (x1, y1, x2, y2, x3, y3) => {
    return x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2);
  };

  const s1 = area(px, py, a.x, a.y, b.x, b.y);
  const s2 = area(px, py, b.x, b.y, c.x, c.y);
  const s3 = area(px, py, c.x, c.y, a.x, a.y);

  const hasNeg = s1 < 0 || s2 < 0 || s3 < 0;
  const hasPos = s1 > 0 || s2 > 0 || s3 > 0;

  return !(hasNeg && hasPos);
}

export default function TextureBuilder({ capturedFrames, onTextureBuilt }) {
  const canvasRef = useRef(null);

  // Initialized resources (refs survive re-renders)
  const landmarkerRef = useRef(null);
  const trianglesRef = useRef(null);
  const backgroundImgRef = useRef(null);

  // Per-triangle texture candidates
  // triangleTextures[ti] = [ { score, lm, img }, ... ]
  const triangleTexturesRef = useRef(null);

  // 現在表示中index
  const triangleTextureIndexRef = useRef(null);

  // Processing queue
  const pendingFramesRef = useRef([]);
  const workerActiveRef = useRef(false);
  const resetFlagRef = useRef(false);

  const prevCountRef = useRef(0);

  const [ready, setReady] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState("Initializing...");

  // ─── Init on mount ───────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const basePath = import.meta.env.BASE_URL;

      // Background image
      const bg = await loadImage(basePath + "face_mesh_2d.png");
      if (cancelled) return;

      backgroundImgRef.current = bg;

      // Draw background immediately
      const canvas = canvasRef.current;
      canvas.width = TEXTURE_SIZE;
      canvas.height = TEXTURE_SIZE;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(bg, 0, 0, TEXTURE_SIZE, TEXTURE_SIZE);

      // MediaPipe
      const fileset = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );

      if (cancelled) return;

      const landmarker = await FaceLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath: basePath + "face_landmarker.task",
        },
        runningMode: "IMAGE",
        numFaces: 1,
      });

      if (cancelled) return;

      landmarkerRef.current = landmarker;

      // OBJ triangles
      const objText = await fetch(basePath + "canonical_face_model.obj").then((r) => r.text());

      if (cancelled) return;

      const triangles = parseOBJTriangles(objText);

      trianglesRef.current = triangles;

      triangleTexturesRef.current = new Array(triangles.length)
        .fill(null)
        .map(() => []);

      triangleTextureIndexRef.current = new Uint32Array(triangles.length).fill(0);

      setMessage("");
      setReady(true);
    };

    init();

    return () => {
      cancelled = true;
    };
  }, []);

  // ─── Canvas redraw ────────────────────────────────────────────────
  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);

    if (backgroundImgRef.current) {
      ctx.drawImage(backgroundImgRef.current, 0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
    }

    const triangles = trianglesRef.current;
    const triangleTextures = triangleTexturesRef.current;
    const triangleTextureIndex = triangleTextureIndexRef.current;

    if (!triangles || !triangleTextures || !triangleTextureIndex) return;

    for (let ti = 0; ti < triangles.length; ti++) {
      const texList = triangleTextures[ti];

      if (!texList || texList.length === 0) continue;

      const index = triangleTextureIndex[ti] % texList.length;

      const fd = texList[index];

      const { lm, img } = fd;
      const { srcIndices, uvCoords } = triangles[ti];

      const srcTri = srcIndices.map((si) => ({
        x: lm[si].x * img.width,
        y: lm[si].y * img.height,
      }));

      const dstTri = uvCoords.map(([u, v]) => ({
        x: u * TEXTURE_SIZE,
        y: (1 - v) * TEXTURE_SIZE,
      }));

      drawTriangleAffine(ctx, img, srcTri, dstTri);
    }
  };

  // ─── Queue worker ─────────────────────────────────────────────────
  const processQueue = async () => {
    if (workerActiveRef.current) return;

    workerActiveRef.current = true;
    setProcessing(true);

    while (pendingFramesRef.current.length > 0) {
      if (resetFlagRef.current) {
        // Reset was requested mid-queue — discard remaining work
        pendingFramesRef.current = [];
        resetFlagRef.current = false;
        break;
      }

      const frame = pendingFramesRef.current.shift();
      const remaining = pendingFramesRef.current.length;

      setMessage(
        remaining > 0
          ? `Processing... (${remaining + 1} queued)`
          : "Processing..."
      );

      const img = await loadImage(frame.dataUrl);

      if (resetFlagRef.current) {
        pendingFramesRef.current = [];
        resetFlagRef.current = false;
        break;
      }

      const result = landmarkerRef.current?.detect(img);

      if (result?.faceLandmarks?.length) {
        const lm = result.faceLandmarks[0];
        const triangles = trianglesRef.current;

        for (let ti = 0; ti < triangles.length; ti++) {
          const { srcIndices, canonicalNz } = triangles[ti];

          // Skip permanently back-facing triangles (inside of head, etc.)
          if (canonicalNz <= 0) continue;

          const p0 = lm[srcIndices[0]];
          const p1 = lm[srcIndices[1]];
          const p2 = lm[srcIndices[2]];

          const e1x = p1.x - p0.x;
          const e1y = p1.y - p0.y;
          const e2x = p2.x - p0.x;
          const e2y = p2.y - p0.y;

          // In MediaPipe image space (y-down), OBJ front-facing triangles have nz < 0
          // (y-axis flip from OpenGL y-up reverses winding). Score = -nz > 0 for front-facing.
          const score = -(e1x * e2y - e1y * e2x);

          triangleTexturesRef.current[ti].push({
            score,
            lm,
            img,
          });

          // 正面に近い順へ並べる
          triangleTexturesRef.current[ti].sort((a, b) => b.score - a.score);
        }

        redrawCanvas();
      }
    }

    setProcessing(false);
    setMessage("");
    workerActiveRef.current = false;
  };

  const enqueue = (frames) => {
    pendingFramesRef.current.push(...frames);
    processQueue();
  };

  // ─── React to capturedFrames changes ─────────────────────────────
  useEffect(() => {
    if (!ready) return;

    const newCount = capturedFrames.length;
    const prevCount = prevCountRef.current;

    prevCountRef.current = newCount;

    if (newCount === prevCount) return;

    if (newCount < prevCount) {
      // Frame(s) deleted → full reset + rebuild all remaining
      resetFlagRef.current = true;

      const n = trianglesRef.current.length;

      triangleTexturesRef.current = new Array(n)
        .fill(null)
        .map(() => []);

      triangleTextureIndexRef.current = new Uint32Array(n).fill(0);

      redrawCanvas(); // show background only

      if (newCount > 0) {
        enqueue([...capturedFrames]);
      }
    } else {
      // New frame(s) added → process only new frames
      enqueue(capturedFrames.slice(prevCount));
    }
  }, [capturedFrames, ready]);

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const triangles = trianglesRef.current;
    const triangleTextures = triangleTexturesRef.current;
    const triangleTextureIndex = triangleTextureIndexRef.current;

    if (!triangles || !triangleTextures || !triangleTextureIndex) return;

    // 後ろから走査して上に描かれている三角形を優先
    for (let ti = triangles.length - 1; ti >= 0; ti--) {
      const texList = triangleTextures[ti];

      if (!texList || texList.length <= 1) continue;

      const { uvCoords } = triangles[ti];

      const dstTri = uvCoords.map(([u, v]) => ({
        x: u * TEXTURE_SIZE,
        y: (1 - v) * TEXTURE_SIZE,
      }));

      if (pointInTriangle(x, y, dstTri[0], dstTri[1], dstTri[2])) {
        triangleTextureIndex[ti] =
          (triangleTextureIndex[ti] + 1) % texList.length;

        redrawCanvas();
        return;
      }
    }
  };

  // ─── UI ───────────────────────────────────────────────────────────
  const handleSave = () => {
    const url = canvasRef.current?.toDataURL("image/png");
    if (url && onTextureBuilt) onTextureBuilt(url);
  };

  return (
    <div
      style={{
        padding: "16px",
        color: "#fff",
        height: "100%",
        boxSizing: "border-box",
        overflowY: "auto",
      }}
    >
      <h2 style={{ marginTop: 0 }}>🔨 Texture Builder</h2>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "12px",
          flexWrap: "wrap",
        }}
      >
        <button
          className="source-btn"
          onClick={handleSave}
          disabled={!ready || processing}
        >
          💾 Use as Texture
        </button>

        {!ready && (
          <span style={{ color: "#aaa", fontSize: "13px" }}>
            Initializing...
          </span>
        )}

        {processing && (
          <span style={{ color: "#aaa", fontSize: "13px" }}>
            {message}
          </span>
        )}

        {ready && !processing && (
          <span style={{ color: "#666", fontSize: "12px" }}>
            Frames: {capturedFrames.length}
          </span>
        )}
      </div>

      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        style={{
          display: "block",
          width: "100%",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      />
    </div>
  );
}
