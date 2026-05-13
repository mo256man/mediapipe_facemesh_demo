import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { parseOBJ } from "./parseOBJ";
import { setupScene } from "./setupScene";

const MIRROR = false;

export default function Mp({
  showTexure,
  sourceType,
  textureImage,
  imageSource,
  videoSource,
  drawCanvas,
  selectedObjFile,
  objScale,
  smoothShading, // 親から受け取る
}) {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);

  const geomRef = useRef(null);
  const srcIndexRef = useRef(null);

  const meshRef = useRef(null);
  const baseMeshRef = useRef(null);

  const showTexureRef = useRef(showTexure);
  const imgCanvasRef = useRef(null);
  const landmarkerRef = useRef(null);

  const drawCanvasTexRef = useRef(null);
  const drawCanvasPropRef = useRef(drawCanvas);

  const isPointerOverViewerRef = useRef(false);
  const isCanonicalRef = useRef(true);

  const modelSizeRef = useRef(1);
  const objScaleRef = useRef(1.0);
  const smoothShadingRef = useRef(!!smoothShading);

  const basePath = import.meta.env.BASE_URL;

  function applyShadingToMaterial(mat) {
    if (!mat) return;
    mat.flatShading = !smoothShadingRef.current;
    mat.needsUpdate = true;
  }

  function computeSmoothNormalsFromSrcIndex(geometry, srcIndexOfVertex) {
    const posAttr = geometry?.attributes?.position;
    if (!posAttr) return;

    const vCount = posAttr.count;
    if (!srcIndexOfVertex || srcIndexOfVertex.length < vCount) {
      geometry.computeVertexNormals();
      if (geometry.attributes.normal) geometry.attributes.normal.needsUpdate = true;
      return;
    }

    let maxSrc = 0;
    for (let i = 0; i < vCount; i++) {
      const s = srcIndexOfVertex[i] | 0;
      if (s > maxSrc) maxSrc = s;
    }

    const sums = new Float32Array((maxSrc + 1) * 3);
    const p = posAttr.array;

    const addTo = (src, nx, ny, nz) => {
      const o = src * 3;
      sums[o] += nx;
      sums[o + 1] += ny;
      sums[o + 2] += nz;
    };

    const accTri = (ia, ib, ic) => {
      const a0 = ia * 3,
        b0 = ib * 3,
        c0 = ic * 3;

      const ax = p[a0],
        ay = p[a0 + 1],
        az = p[a0 + 2];
      const bx = p[b0],
        by = p[b0 + 1],
        bz = p[b0 + 2];
      const cx = p[c0],
        cy = p[c0 + 1],
        cz = p[c0 + 2];

      const abx = bx - ax,
        aby = by - ay,
        abz = bz - az;
      const acx = cx - ax,
        acy = cy - ay,
        acz = cz - az;

      const nx = aby * acz - abz * acy;
      const ny = abz * acx - abx * acz;
      const nz = abx * acy - aby * acx;

      addTo(srcIndexOfVertex[ia] | 0, nx, ny, nz);
      addTo(srcIndexOfVertex[ib] | 0, nx, ny, nz);
      addTo(srcIndexOfVertex[ic] | 0, nx, ny, nz);
    };

    if (geometry.index) {
      const idx = geometry.index.array;
      for (let i = 0; i < idx.length; i += 3) {
        accTri(idx[i], idx[i + 1], idx[i + 2]);
      }
    } else {
      for (let i = 0; i < vCount; i += 3) {
        accTri(i, i + 1, i + 2);
      }
    }

    let normalAttr = geometry.attributes.normal;
    if (!normalAttr || normalAttr.count !== vCount) {
      normalAttr = new THREE.BufferAttribute(new Float32Array(vCount * 3), 3);
      geometry.setAttribute("normal", normalAttr);
    }

    const n = normalAttr.array;
    for (let i = 0; i < vCount; i++) {
      const s = (srcIndexOfVertex[i] | 0) * 3;
      const x = sums[s],
        y = sums[s + 1],
        z = sums[s + 2];
      const len = Math.hypot(x, y, z) || 1;

      const o = i * 3;
      n[o] = x / len;
      n[o + 1] = y / len;
      n[o + 2] = z / len;
    }
    normalAttr.needsUpdate = true;
  }

  useEffect(() => {
    let running = true;
    let isMounted = true;
    let imgW = 0;
    let imgH = 0;

    let prevMouseX = 0;
    let prevMouseY = 0;
    let isMouseDown = false;
    let rotationX = 0;
    let rotationY = 0;

    function getW() {
      if (sourceType === "image") return imgW;
      if (sourceType === "camera" || sourceType === "video") {
        return videoRef.current?.videoWidth || containerRef.current.offsetWidth;
      }
      return containerRef.current.offsetWidth;
    }

    function getH() {
      if (sourceType === "image") return imgH;
      if (sourceType === "camera" || sourceType === "video") {
        return videoRef.current?.videoHeight || containerRef.current.offsetHeight;
      }
      return containerRef.current.offsetHeight;
    }

    async function initMedia() {
      const vid = videoRef.current;
      const sourcePath = sourceType === "image" ? imageSource : videoSource;

      if (sourceType === "camera") {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        vid.srcObject = stream;

        await new Promise((res) => {
          vid.onloadedmetadata = res;
        });

        while (vid.videoWidth === 0) {
          await new Promise((res) => setTimeout(res, 10));
        }

        await vid.play();
      } else if (sourceType === "video") {
        vid.src = sourcePath;
        vid.loop = true;
        vid.muted = true;

        await new Promise((res) => {
          vid.onloadedmetadata = res;
        });

        while (vid.videoWidth === 0) {
          await new Promise((res) => setTimeout(res, 10));
        }

        await vid.play();
      } else if (sourceType === "image") {
        const img = new Image();

        await new Promise((res, rej) => {
          img.onload = res;
          img.onerror = rej;
          img.src = sourcePath;
        });

        imgCanvasRef.current = document.createElement("canvas");
        imgCanvasRef.current.width = img.width;
        imgCanvasRef.current.height = img.height;
        imgCanvasRef.current.getContext("2d").drawImage(img, 0, 0);

        imgW = img.width;
        imgH = img.height;
      } else if (sourceType === "none") {
        imgW = containerRef.current.offsetWidth;
        imgH = containerRef.current.offsetHeight;
      }
    }

    async function init() {
      if (!isMounted) return;

      await initMedia();
      if (!isMounted) return;

      const srcW = getW();
      const srcH = getH();

      if (!isMounted) return;

      const canvasWidth = containerRef.current.offsetWidth;
      const canvasHeight = containerRef.current.offsetHeight;

      const isVideo = sourceType !== "image" && sourceType !== "none";

      const fileset = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );
      if (!isMounted) return;

      landmarkerRef.current = await FaceLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: basePath + "face_landmarker.task" },
        runningMode: isVideo ? "VIDEO" : "IMAGE",
        numFaces: 1,
      });
      if (!isMounted) return;

      if (rendererRef.current) rendererRef.current.dispose();

      const canvas = canvasRef.current;
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      const { renderer, scene, camera } = setupScene(canvas, canvasWidth, canvasHeight);
      rendererRef.current = renderer;
      sceneRef.current = scene;
      cameraRef.current = camera;

      const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
      directionalLight.position.set(1, 1, 2);
      scene.add(directionalLight);

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
      scene.add(ambientLight);

      const objText = await fetch(
        basePath + "obj/" + (selectedObjFile || "canonical_face_model.obj")
      ).then((r) => r.text());

      const { geometry, srcIndexOfVertex } = parseOBJ(objText);

      geomRef.current = geometry;
      srcIndexRef.current = srcIndexOfVertex;

      const isCanonical =
        (selectedObjFile || "canonical_face_model.obj") === "canonical_face_model.obj";
      isCanonicalRef.current = isCanonical;

      if (!isCanonical) {
        geometry.computeBoundingBox();
        const bboxSize = new THREE.Vector3();
        geometry.boundingBox.getSize(bboxSize);
        modelSizeRef.current = Math.max(bboxSize.x, bboxSize.y, bboxSize.z);
      }

      if (smoothShadingRef.current) {
        const pos = geometry.getAttribute("position");
        const nor = geometry.getAttribute("normal");
        const hasNormals = !!pos && !!nor && nor.count === pos.count;
        if (!hasNormals) computeSmoothNormalsFromSrcIndex(geometry, srcIndexOfVertex);
      }

      const baseMatm = new THREE.MeshStandardMaterial({
        color: 0xf7c3a9,
        flatShading: !smoothShadingRef.current,
      });

      const baseMesh = new THREE.Mesh(geometry, baseMatm);
      baseMeshRef.current = baseMesh;
      baseMesh.position.z = -0.1;

      if (sourceType === "none") {
        geometry.computeBoundingBox();
        const size = new THREE.Vector3();
        geometry.boundingBox.getSize(size);

        const maxDimension = Math.max(size.x, size.y, size.z);
        const targetSize = Math.min(srcW, srcH) * 0.5;
        const faceScale = targetSize / maxDimension;

        baseMesh.scale.multiplyScalar(faceScale);
        scene.add(baseMesh);
      }

      const createTexMesh = async () => {
        const tex = await new THREE.TextureLoader().loadAsync(textureImage);
        tex.colorSpace = THREE.SRGBColorSpace;

        const texMat = new THREE.MeshStandardMaterial({
          map: tex,
          transparent: true,
          side: THREE.DoubleSide,
          flatShading: !smoothShadingRef.current,
        });

        const texMesh = new THREE.Mesh(geometry, texMat);
        texMesh.visible = showTexure;
        return texMesh;
      };

      if (sourceType === "none") {
        try {
          const texMesh = await createTexMesh();

          geometry.computeBoundingBox();
          const size = new THREE.Vector3();
          geometry.boundingBox.getSize(size);

          const maxDimension = Math.max(size.x, size.y, size.z);
          const targetSize = Math.min(srcW, srcH) * 0.5;
          const faceScale = targetSize / maxDimension;

          texMesh.scale.multiplyScalar(faceScale);

          scene.add(texMesh);
          meshRef.current = texMesh;
        } catch (error) {
          console.error("Failed to load texture:", textureImage, error);
        }
      } else {
        try {
          const texMesh = await createTexMesh();
          scene.add(texMesh);
          meshRef.current = texMesh;
        } catch (error) {
          console.error("Failed to load texture:", textureImage, error);
        }
      }

      if (drawCanvasPropRef.current && meshRef.current) {
        const tex = new THREE.CanvasTexture(drawCanvasPropRef.current);
        tex.colorSpace = THREE.SRGBColorSpace;

        if (drawCanvasTexRef.current) drawCanvasTexRef.current.dispose();
        drawCanvasTexRef.current = tex;

        meshRef.current.material.dispose();
        meshRef.current.material = new THREE.MeshStandardMaterial({
          map: tex,
          transparent: true,
          side: THREE.DoubleSide,
          flatShading: !smoothShadingRef.current,
        });
      }

      if (isVideo) {
        loopVideo();
      } else if (sourceType === "image") {
        detectImage();
        loopImage();
      } else if (sourceType === "none") {
        loopNone();
      }
    }

    function applyLandmarks(pts) {
      const srcW = getW();
      const srcH = getH();

      const canvasWidth = canvasRef.current.width;
      const canvasHeight = canvasRef.current.height;

      const mediaAspect = srcW / srcH;
      const canvasAspect = canvasWidth / canvasHeight;

      let displayW, displayH, offsetX, offsetY;

      if (mediaAspect > canvasAspect) {
        displayW = canvasWidth;
        displayH = canvasWidth / mediaAspect;
        offsetX = 0;
        offsetY = (canvasHeight - displayH) / 2;
      } else {
        displayH = canvasHeight;
        displayW = canvasHeight * mediaAspect;
        offsetX = (canvasWidth - displayW) / 2;
        offsetY = 0;
      }

      if (isCanonicalRef.current) {
        const pos = geomRef.current.attributes.position;

        for (let i = 0; i < pos.count; i++) {
          const s = srcIndexRef.current[i];
          const p = pts[s];

          let x = p.x * displayW + offsetX - canvasWidth / 2;
          const y = canvasHeight / 2 - (p.y * displayH + offsetY);
          const z = -p.z * displayW * 0.8;

          if (MIRROR) x = -x;

          pos.setXYZ(i, x, y, z);
        }

        pos.needsUpdate = true;

        if (smoothShadingRef.current) {
          computeSmoothNormalsFromSrcIndex(geomRef.current, srcIndexRef.current);
        }
      } else {
        const mesh = meshRef.current;
        if (!mesh) return;

        const toLM = (p) =>
          new THREE.Vector3(
            MIRROR
              ? -(p.x * displayW + offsetX - canvasWidth / 2)
              : p.x * displayW + offsetX - canvasWidth / 2,
            canvasHeight / 2 - (p.y * displayH + offsetY),
            -p.z * displayW * 0.8
          );

        const leftEye = toLM(pts[33]);
        const rightEye = toLM(pts[263]);
        const chin = toLM(pts[152]);
        const forehead = toLM(pts[10]);

        const faceCenter = new THREE.Vector3().addVectors(forehead, chin).multiplyScalar(0.5);

        const faceHeight = forehead.distanceTo(chin);
        if (faceHeight < 1) return;
        const scale = (faceHeight / modelSizeRef.current) * objScaleRef.current;

        const up = new THREE.Vector3().subVectors(forehead, chin).normalize();
        const right = new THREE.Vector3().subVectors(rightEye, leftEye).normalize();
        right.sub(up.clone().multiplyScalar(right.dot(up))).normalize();
        const forward = new THREE.Vector3().crossVectors(right, up).normalize();

        const rotMatrix = new THREE.Matrix4().makeBasis(right, up, forward);
        mesh.setRotationFromMatrix(rotMatrix);
        mesh.position.copy(faceCenter);
        mesh.scale.setScalar(scale);
      }
    }

    function loopVideo() {
      if (!running) return;

      const vid = videoRef.current;

      if (vid.readyState >= 2) {
        const res = landmarkerRef.current.detectForVideo(vid, performance.now());

        if (res.faceLandmarks?.length) {
          applyLandmarks(res.faceLandmarks[0]);
          if (meshRef.current) meshRef.current.visible = showTexureRef.current;
        } else {
          if (meshRef.current) meshRef.current.visible = false;
        }
      }

      if (drawCanvasTexRef.current) drawCanvasTexRef.current.needsUpdate = true;

      rendererRef.current.render(sceneRef.current, cameraRef.current);
      requestAnimationFrame(loopVideo);
    }

    function detectImage() {
      const res = landmarkerRef.current.detect(imgCanvasRef.current);

      if (res.faceLandmarks?.length) {
        applyLandmarks(res.faceLandmarks[0]);
        if (meshRef.current) meshRef.current.visible = showTexureRef.current;
      } else {
        if (meshRef.current) meshRef.current.visible = false;
      }

      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }

    function loopNone() {
      if (!running) return;

      if (isMouseDown) {
        sceneRef.current.children.forEach((mesh) => {
          mesh.rotation.x = rotationX;
          mesh.rotation.y = rotationY;
        });
      }

      if (drawCanvasTexRef.current) drawCanvasTexRef.current.needsUpdate = true;

      rendererRef.current.render(sceneRef.current, cameraRef.current);
      requestAnimationFrame(loopNone);
    }

    function loopImage() {
      if (!running) return;

      if (drawCanvasTexRef.current) {
        drawCanvasTexRef.current.needsUpdate = true;
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }

      requestAnimationFrame(loopImage);
    }

    function handlePointerMove(e) {
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;

      if (isMouseDown) {
        rotationY += deltaX * 0.01;
        rotationX += deltaY * 0.01;
      }

      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    }

    function handlePointerDown(e) {
      if (e.isPrimary && isPointerOverViewerRef.current) {
        isMouseDown = true;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      }
    }

    function handlePointerUp() {
      isMouseDown = false;
    }

    function handleTouchStart(e) {
      if (isPointerOverViewerRef.current && e.touches.length > 0) {
        isMouseDown = true;
        prevMouseX = e.touches[0].clientX;
        prevMouseY = e.touches[0].clientY;
      }
    }

    function handleTouchMove(e) {
      if (isMouseDown && e.touches.length > 0) {
        const deltaX = e.touches[0].clientX - prevMouseX;
        const deltaY = e.touches[0].clientY - prevMouseY;

        rotationY += deltaX * 0.01;
        rotationX += deltaY * 0.01;

        prevMouseX = e.touches[0].clientX;
        prevMouseY = e.touches[0].clientY;

        e.preventDefault();
      }
    }

    function handleTouchEnd() {
      isMouseDown = false;
    }

    requestAnimationFrame(() => {
      init();
    });

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointerup", handlePointerUp);

    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      isMounted = false;
      running = false;

      landmarkerRef.current?.close();

      const vid = videoRef.current;
      if (vid?.srcObject) {
        vid.srcObject.getTracks().forEach((t) => t.stop());
        vid.srcObject = null;
      }

      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);

      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [sourceType, imageSource, videoSource, selectedObjFile]);

  useEffect(() => {
    objScaleRef.current = objScale ?? 1.0;
  }, [objScale]);

  useEffect(() => {
    smoothShadingRef.current = !!smoothShading;

    if (meshRef.current?.material) applyShadingToMaterial(meshRef.current.material);
    if (baseMeshRef.current?.material) applyShadingToMaterial(baseMeshRef.current.material);

    if (smoothShadingRef.current && geomRef.current && srcIndexRef.current) {
      computeSmoothNormalsFromSrcIndex(geomRef.current, srcIndexRef.current);
    }

    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  }, [smoothShading]);

  useEffect(() => {
    showTexureRef.current = showTexure;

    if (meshRef.current) {
      meshRef.current.visible = showTexure;

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    }
  }, [showTexure]);

  const reloadTexture = () => {
    if (meshRef.current && rendererRef.current && sceneRef.current && cameraRef.current) {
      const img = new Image();

      img.onload = () => {
        const tex = new THREE.Texture(img);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.needsUpdate = true;

        meshRef.current.material.dispose();
        meshRef.current.material = new THREE.MeshStandardMaterial({
          map: tex,
          transparent: true,
          side: THREE.DoubleSide,
          flatShading: !smoothShadingRef.current,
        });

        rendererRef.current.render(sceneRef.current, cameraRef.current);
      };

      img.onerror = (e) => console.error("Image load failed:", e);
      img.src = textureImage;
    }
  };

  useEffect(() => {
    if (meshRef.current && rendererRef.current && sceneRef.current && cameraRef.current) {
      const img = new Image();

      img.onload = () => {
        const tex = new THREE.Texture(img);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.needsUpdate = true;

        meshRef.current.material.dispose();
        meshRef.current.material = new THREE.MeshStandardMaterial({
          map: tex,
          transparent: true,
          side: THREE.DoubleSide,
          flatShading: !smoothShadingRef.current,
        });

        rendererRef.current.render(sceneRef.current, cameraRef.current);
      };

      img.onerror = (e) => console.error("Image load failed:", e);
      img.src = textureImage;
    }
  }, [textureImage]);

  useEffect(() => {
    drawCanvasPropRef.current = drawCanvas;
    if (!meshRef.current) return;

    if (drawCanvas) {
      const tex = new THREE.CanvasTexture(drawCanvas);
      tex.colorSpace = THREE.SRGBColorSpace;

      if (drawCanvasTexRef.current) drawCanvasTexRef.current.dispose();
      drawCanvasTexRef.current = tex;

      meshRef.current.material.dispose();
      meshRef.current.material = new THREE.MeshStandardMaterial({
        map: tex,
        transparent: true,
        side: THREE.DoubleSide,
        flatShading: !smoothShadingRef.current,
      });
    } else {
      if (drawCanvasTexRef.current) {
        drawCanvasTexRef.current.dispose();
        drawCanvasTexRef.current = null;
      }

      if (textureImage && rendererRef.current) {
        const img = new Image();

        img.onload = () => {
          if (!meshRef.current) return;

          const tex = new THREE.Texture(img);
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.needsUpdate = true;

          meshRef.current.material.dispose();
          meshRef.current.material = new THREE.MeshStandardMaterial({
            map: tex,
            transparent: true,
            side: THREE.DoubleSide,
            flatShading: !smoothShadingRef.current,
          });

          rendererRef.current.render(sceneRef.current, cameraRef.current);
        };

        img.src = textureImage;
      }
    }
  }, [drawCanvas]);

  return (
    <div
      ref={containerRef}
      className="mp-container"
      onPointerEnter={() => {
        isPointerOverViewerRef.current = true;
      }}
      onPointerLeave={() => {
        isPointerOverViewerRef.current = false;
      }}
    >
      {sourceType === "image" && (
        <img src={imageSource} alt="" className="mp-layer mp-media" />
      )}

      {(sourceType === "camera" || sourceType === "video") && (
        <video
          ref={videoRef}
          controls
          src={videoSource}
          autoPlay
          loop
          muted
          className="mp-layer mp-media mp-video"
        />
      )}

      <canvas ref={canvasRef} className="mp-layer mp-canvas" />
    </div>
  );
}