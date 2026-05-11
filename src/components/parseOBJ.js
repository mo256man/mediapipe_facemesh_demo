import * as THREE from "three";

export function parseOBJ(text, { swapYZ = false } = {}) {
  const vs = [];
  const vts = [];
  const faces = [];
  text.split(/\r?\n/).forEach((l) => {
    const t = l.trim();
    if (t.startsWith("v ")) {
      const [, x, y, z] = t.split(/\s+/);
      if (swapYZ) {
        vs.push([+x, +z, +y]);
      } else {
        vs.push([+x, +y, +z]);
      }
    } else if (t.startsWith("vt ")) {
      const [, u, v] = t.split(/\s+/);
      vts.push([+u, +v]);
    } else if (t.startsWith("f ")) {
      const ps = t.split(/\s+/).slice(1);
      const v = ps.map((p) => {
        const [a, b] = p.split("/");
        return { vi: +a - 1, vti: b ? +b - 1 : -1 };
      });
      for (let i = 1; i + 1 < v.length; i++) faces.push([v[0], v[i], v[i + 1]]);
    }
  });
  const pos = [];
  const uv = [];
  const src = [];
  faces.forEach((f) => {
    f.forEach((v) => {
      const p = vs[v.vi];
      pos.push(p[0], p[1], p[2]);
      if (v.vti >= 0) {
        const t = vts[v.vti];
        uv.push(t[0], t[1]);
      } else uv.push(0, 0);
      src.push(v.vi);
    });
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return { geometry: g, srcIndexOfVertex: src };
}
