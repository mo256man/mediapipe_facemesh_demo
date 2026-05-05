import * as THREE from "three";

export function setupScene(canvas, canvasWidth, canvasHeight) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(1);
  renderer.setSize(canvasWidth, canvasHeight, false);

  const scene = new THREE.Scene();

  const camera = new THREE.OrthographicCamera(
    -canvasWidth / 2, canvasWidth / 2, canvasHeight / 2, -canvasHeight / 2, -5000, 5000
  );
  camera.position.z = 1000;

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(300, 500, 1000);
  scene.add(dirLight);

  return { renderer, scene, camera };
}
