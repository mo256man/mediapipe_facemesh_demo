import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { parseOBJ } from "./parseOBJ";
import { setupScene } from "./setupScene";

const MIRROR = false;

export default function Mp({ showTexure, sourceType, textureImage, imageSource, videoSource }) {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const geomRef = useRef(null);
  const srcIndexRef = useRef(null);
  const meshRef = useRef(null);
  const showTexureRef = useRef(showTexure);
  const basePath = import.meta.env.BASE_URL;

  useEffect(() => {
    let landmarker;
    let running = true;
    let isMounted = true;
    let imgW = 0;
    let imgH = 0;
    let imgCanvas = null;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let isMouseDown = false;
    let rotationX = 0;
    let rotationY = 0;

    function getW() {
      if (sourceType === "image") return imgW;
      if (sourceType === "camera" || sourceType === "video") return videoRef.current?.videoWidth || containerRef.current.offsetWidth;
      return containerRef.current.offsetWidth;
    }

    function getH() {
      if (sourceType === "image") return imgH;
      if (sourceType === "camera" || sourceType === "video") return videoRef.current?.videoHeight || containerRef.current.offsetHeight;
      return containerRef.current.offsetHeight;
    }

    async function initMedia() {
      const vid = videoRef.current;
      const sourcePath = sourceType === "image" ? imageSource : videoSource;
      if (sourceType === "camera") {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        vid.srcObject = stream;
        await new Promise((res) => { vid.onloadedmetadata = res; });
        while (vid.videoWidth === 0) {
          await new Promise(res => setTimeout(res, 10));
        }
        await vid.play();
      } else if (sourceType === "video") {
        vid.src = sourcePath;
        vid.loop = true;
        vid.muted = true;
        await new Promise((res) => { vid.onloadedmetadata = res; });
        while (vid.videoWidth === 0) {
          await new Promise(res => setTimeout(res, 10));
        }
        await vid.play();
        } else if (sourceType === "image") {
          const img = new Image();
          await new Promise((res, rej) => {
            img.onload = res;
            img.onerror = rej;
            img.src = sourcePath;
          });
        imgCanvas = document.createElement("canvas");
        imgCanvas.width = img.width;
        imgCanvas.height = img.height;
        imgCanvas.getContext("2d").drawImage(img, 0, 0);
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

      landmarker = await FaceLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: basePath + "face_landmarker.task" },
        runningMode: isVideo ? "VIDEO" : "IMAGE",
        numFaces: 1,
      });
      if (!isMounted) return;

      if (rendererRef.current) {
        rendererRef.current.dispose();
      }

      const canvas = canvasRef.current;
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      const { renderer, scene, camera } = setupScene(canvas, canvasWidth, canvasHeight);
      rendererRef.current = renderer;
      sceneRef.current = scene;
      cameraRef.current = camera;

      const objText = await fetch(basePath + "canonical_face_model.obj").then((r) => r.text());
      const { geometry, srcIndexOfVertex } = parseOBJ(objText);
      geomRef.current = geometry;
      srcIndexRef.current = srcIndexOfVertex;

      const baseMatm = new THREE.MeshStandardMaterial({ color: 0xF7C3A9 });
      const baseMesh = new THREE.Mesh(geometry, baseMatm);
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

      if (sourceType === "none") {
        try {
          const tex = await new THREE.TextureLoader().loadAsync(textureImage);
          tex.colorSpace = THREE.SRGBColorSpace;
          const texMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
          const texMesh = new THREE.Mesh(geometry, texMat);

          geometry.computeBoundingBox();
          const size = new THREE.Vector3();
          geometry.boundingBox.getSize(size);
          const maxDimension = Math.max(size.x, size.y, size.z);
          const targetSize = Math.min(srcW, srcH) * 0.5;
          const faceScale = targetSize / maxDimension;
          texMesh.scale.multiplyScalar(faceScale);

          texMesh.visible = showTexure;
          scene.add(texMesh);
          meshRef.current = texMesh;
        } catch (error) {
          console.error("Failed to load texture:", textureImage, error);
        }
      } else {
        try {
          const tex = await new THREE.TextureLoader().loadAsync(textureImage);
          tex.colorSpace = THREE.SRGBColorSpace;
          const texMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
          const texMesh = new THREE.Mesh(geometry, texMat);
          texMesh.visible = showTexure;
          scene.add(texMesh);
          meshRef.current = texMesh;
        } catch (error) {
          console.error("Failed to load texture:", textureImage, error);
        }
      }

      if (isVideo) {
        loopVideo();
      } else if (sourceType === "image") {
        detectImage();
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
      geomRef.current.computeVertexNormals();
    }

    function loopVideo() {
      if (!running) return;
      const vid = videoRef.current;
      if (vid.readyState >= 2) {
        const res = landmarker.detectForVideo(vid, performance.now());
        if (res.faceLandmarks?.length) {
          applyLandmarks(res.faceLandmarks[0]);
          if (meshRef.current) meshRef.current.visible = showTexureRef.current;
        } else {
          if (meshRef.current) meshRef.current.visible = false;
        }
      }
      rendererRef.current.render(sceneRef.current, cameraRef.current);
      requestAnimationFrame(loopVideo);
    }

    function detectImage() {
      const res = landmarker.detect(imgCanvas);
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
      rendererRef.current.render(sceneRef.current, cameraRef.current);
      requestAnimationFrame(loopNone);
    }

    function handleMouseMove(e) {
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      if (isMouseDown) {
        rotationY += deltaX * 0.01;
        rotationX += deltaY * 0.01;
      }
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    }

    function handleMouseDown(e) {
      if (e.button === 0) {
        isMouseDown = true;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      }
    }

    function handleMouseUp() {
      isMouseDown = false;
    }

    requestAnimationFrame(() => { init(); });
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      isMounted = false;
      running = false;
      landmarker?.close();
      const vid = videoRef.current;
      if (vid?.srcObject) {
        vid.srcObject.getTracks().forEach(t => t.stop());
        vid.srcObject = null;
      }
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [sourceType, imageSource, videoSource]);

  useEffect(() => {
    showTexureRef.current = showTexure;
    if (meshRef.current) {
      meshRef.current.visible = showTexure;
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    }
  }, [showTexure]);

  useEffect(() => {
    if (meshRef.current && rendererRef.current && sceneRef.current && cameraRef.current) {
      const img = new Image();
      img.onload = () => {
        const tex = new THREE.Texture(img);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.needsUpdate = true;
        meshRef.current.material.dispose();
        meshRef.current.material = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      };
      img.onerror = (e) => console.error("Image load failed:", e);
      img.src = textureImage;
    }
  }, [textureImage]);

  return (
    <div ref={containerRef} className="mp-container">
      {sourceType === "image" && (
        <img
          src={imageSource}
          alt=""
          className="mp-layer mp-media"
        />
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
      <canvas
        ref={canvasRef}
        className="mp-layer mp-canvas"
      />
    </div>
  );
}