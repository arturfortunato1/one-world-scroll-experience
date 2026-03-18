import * as THREE from "https://esm.sh/three@0.164.1";
import { GLTFLoader } from "https://esm.sh/three@0.164.1/examples/jsm/loaders/GLTFLoader.js";
import { gsap } from "https://esm.sh/gsap@3.12.5";
import { ScrollTrigger } from "https://esm.sh/gsap@3.12.5/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const canvas = document.getElementById("webgl");
const loadingScreen = document.getElementById("loading-screen");
const loadingTitle = document.querySelector(".loading-title");
const loadingSubtitle = document.querySelector(".loading-subtitle");
const finalPhoto = document.getElementById("final-photo");
const phases = Array.from(document.querySelectorAll(".phase"));
const dots = Array.from(document.querySelectorAll(".phase-dot"));
const body = document.body;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x35526b);
scene.fog = new THREE.FogExp2(0x35526b, 0.0069);

const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 320);
camera.position.set(22, 9, 31);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
renderer.localClippingEnabled = false;
renderer.physicallyCorrectLights = true;

const ambient = new THREE.AmbientLight(0xffffff, 0.34);
scene.add(ambient);

const hemiLight = new THREE.HemisphereLight(0xd8ecff, 0x1a354e, 0.3);
scene.add(hemiLight);

const keyLight = new THREE.DirectionalLight(0xffefda, 2.1);
keyLight.position.set(26, 44, 24);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.near = 8;
keyLight.shadow.camera.far = 140;
keyLight.shadow.camera.left = -55;
keyLight.shadow.camera.right = 55;
keyLight.shadow.camera.top = 55;
keyLight.shadow.camera.bottom = -55;
keyLight.shadow.bias = -0.00025;
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight(0x9dccff, 1.1);
rimLight.position.set(-24, 24, -18);
scene.add(rimLight);

const fillLight = new THREE.DirectionalLight(0xeef6ff, 0.62);
fillLight.position.set(10, 18, 34);
scene.add(fillLight);

const architectureGroup = new THREE.Group();
architectureGroup.name = "architectureGroup";
scene.add(architectureGroup);

const group_Spire = new THREE.Group();
group_Spire.name = "group_Spire";
const group_HighRise = new THREE.Group();
group_HighRise.name = "group_HighRise";
const group_LowRise = new THREE.Group();
group_LowRise.name = "group_LowRise";
const group_Foundation = new THREE.Group();
group_Foundation.name = "group_Foundation";

architectureGroup.add(group_Foundation, group_LowRise, group_HighRise, group_Spire);

const floorLayers = [];
const foundationParts = {};
const materialCache = new Map();

const phaseState = {
  lookX: 0,
  lookY: 5,
  lookZ: 0,
  yaw: 0.18,
  idle: 0.03
};

const finaleState = { boost: 0, photoReveal: 0, modelFade: 1 };
const baseLighting = {
  exposure: 1.08,
  ambient: 0.34,
  hemi: 0.3,
  key: 2.1,
  rim: 1.1,
  fill: 0.62,
  fog: 0.0069
};

let master = null;
let currentPhase = -1;

function toDisplayMessage(title, subtitle) {
  if (loadingTitle) loadingTitle.textContent = title;
  if (loadingSubtitle) loadingSubtitle.textContent = subtitle;
}

function clearArchitecture() {
  floorLayers.length = 0;
  [group_Spire, group_HighRise, group_LowRise, group_Foundation].forEach((group) => {
    group.clear();
  });
  Object.keys(foundationParts).forEach((key) => {
    delete foundationParts[key];
  });
}

function cloneAndTuneMaterial(material) {
  if (!material) {
    return new THREE.MeshStandardMaterial({ color: 0xc5d9ec, metalness: 0.08, roughness: 0.62 });
  }
  if (materialCache.has(material.uuid)) {
    return materialCache.get(material.uuid);
  }

  const tuned = material.clone();
  if ("metalness" in tuned) tuned.metalness = THREE.MathUtils.clamp((tuned.metalness ?? 0.1) * 0.7, 0, 0.28);
  if ("roughness" in tuned) tuned.roughness = THREE.MathUtils.clamp((tuned.roughness ?? 0.68) * 0.88, 0.14, 0.95);
  if ("emissive" in tuned && tuned.emissive) {
    tuned.emissive.set(0x000000);
    tuned.emissiveIntensity = 0;
  }
  tuned.envMapIntensity = 1.05;
  tuned.side = THREE.FrontSide;
  tuned.transparent = false;
  materialCache.set(material.uuid, tuned);
  return tuned;
}

function createFoundation() {
  const raft = new THREE.Mesh(
    new THREE.CylinderGeometry(10.5, 10.5, 2.5, 72),
    new THREE.MeshStandardMaterial({
      color: 0x6e8aa6,
      metalness: 0.22,
      roughness: 0.62
    })
  );
  raft.position.y = -1.2;
  raft.castShadow = true;
  raft.receiveShadow = true;
  group_Foundation.add(raft);
  foundationParts.raft = raft;

  const podium = new THREE.Mesh(
    new THREE.CylinderGeometry(7.4, 8.1, 2.4, 56),
    new THREE.MeshStandardMaterial({
      color: 0x9ab4cc,
      metalness: 0.28,
      roughness: 0.46
    })
  );
  podium.position.y = 1.5;
  podium.castShadow = true;
  podium.receiveShadow = true;
  group_Foundation.add(podium);
  foundationParts.podium = podium;

  const pileGeometry = new THREE.CylinderGeometry(0.16, 0.2, 6.1, 12);
  const pileMaterial = new THREE.MeshStandardMaterial({
    color: 0x7f9ab5,
    metalness: 0.18,
    roughness: 0.62
  });

  const pileCount = 192;
  const piles = new THREE.InstancedMesh(pileGeometry, pileMaterial, pileCount);
  piles.castShadow = true;
  piles.receiveShadow = true;

  const rings = [20, 26, 32, 36, 38, 40];
  const dummy = new THREE.Object3D();
  let idx = 0;

  rings.forEach((count, ringIndex) => {
    const radius = 2.5 + ringIndex * 1.18;
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count + ringIndex * 0.13;
      dummy.position.set(Math.cos(angle) * radius, -5.3, Math.sin(angle) * radius);
      dummy.rotation.y = angle;
      dummy.updateMatrix();
      piles.setMatrixAt(idx, dummy.matrix);
      idx += 1;
    }
  });

  group_Foundation.add(piles);
  foundationParts.piles = piles;
}

function getTriVertex(positionAttr, normalAttr, idx, outPos, outNorm) {
  outPos[0] = positionAttr.getX(idx);
  outPos[1] = positionAttr.getY(idx);
  outPos[2] = positionAttr.getZ(idx);

  if (normalAttr) {
    outNorm[0] = normalAttr.getX(idx);
    outNorm[1] = normalAttr.getY(idx);
    outNorm[2] = normalAttr.getZ(idx);
  } else {
    outNorm[0] = 0;
    outNorm[1] = 1;
    outNorm[2] = 0;
  }
}

function splitMeshByHeight(mesh, minY, maxY, layersCount) {
  const splitMeshes = [];
  const geometry = mesh.geometry.clone();
  geometry.applyMatrix4(mesh.matrixWorld);

  const positionAttr = geometry.getAttribute("position");
  const normalAttr = geometry.getAttribute("normal");
  const indexAttr = geometry.getIndex();
  const triangleCount = indexAttr ? indexAttr.count / 3 : positionAttr.count / 3;

  const bins = Array.from({ length: layersCount }, () => ({ pos: [], norm: [] }));

  const a = [0, 0, 0];
  const b = [0, 0, 0];
  const c = [0, 0, 0];
  const an = [0, 0, 0];
  const bn = [0, 0, 0];
  const cn = [0, 0, 0];

  for (let tri = 0; tri < triangleCount; tri += 1) {
    const i0 = indexAttr ? indexAttr.getX(tri * 3) : tri * 3;
    const i1 = indexAttr ? indexAttr.getX(tri * 3 + 1) : tri * 3 + 1;
    const i2 = indexAttr ? indexAttr.getX(tri * 3 + 2) : tri * 3 + 2;

    getTriVertex(positionAttr, normalAttr, i0, a, an);
    getTriVertex(positionAttr, normalAttr, i1, b, bn);
    getTriVertex(positionAttr, normalAttr, i2, c, cn);

    const centroidY = (a[1] + b[1] + c[1]) / 3;
    const normY = THREE.MathUtils.clamp((centroidY - minY) / Math.max(0.0001, maxY - minY), 0, 0.99999);
    const binIndex = Math.floor(normY * layersCount);

    bins[binIndex].pos.push(
      a[0],
      a[1],
      a[2],
      b[0],
      b[1],
      b[2],
      c[0],
      c[1],
      c[2]
    );

    bins[binIndex].norm.push(
      an[0],
      an[1],
      an[2],
      bn[0],
      bn[1],
      bn[2],
      cn[0],
      cn[1],
      cn[2]
    );
  }

  const material = cloneAndTuneMaterial(Array.isArray(mesh.material) ? mesh.material[0] : mesh.material);

  bins.forEach((bin, binIndex) => {
    if (bin.pos.length < 9) return;

    const slicedGeometry = new THREE.BufferGeometry();
    slicedGeometry.setAttribute("position", new THREE.Float32BufferAttribute(bin.pos, 3));
    slicedGeometry.setAttribute("normal", new THREE.Float32BufferAttribute(bin.norm, 3));
    slicedGeometry.computeBoundingBox();
    slicedGeometry.computeBoundingSphere();

    const chunk = new THREE.Mesh(slicedGeometry, material);
    chunk.castShadow = true;
    chunk.receiveShadow = true;

    splitMeshes.push({ mesh: chunk, binIndex });
  });

  geometry.dispose();
  return splitMeshes;
}

function classifyAndAttach(mesh, normY) {
  if (normY <= 0.11) {
    group_Foundation.add(mesh);
  } else if (normY <= 0.47) {
    group_LowRise.add(mesh);
  } else if (normY <= 0.82) {
    group_HighRise.add(mesh);
  } else {
    group_Spire.add(mesh);
  }
}

function collectLayerDataFromScene(root) {
  root.updateMatrixWorld(true);
  const totalBox = new THREE.Box3().setFromObject(root);
  const minY = totalBox.min.y;
  const maxY = totalBox.max.y;
  const height = maxY - minY;
  const layerCount = 34;

  const meshEntries = [];
  root.traverse((obj) => {
    if (!obj.isMesh || !obj.geometry?.attributes?.position) return;
    obj.castShadow = true;
    obj.receiveShadow = true;
    meshEntries.push(obj);
  });

  meshEntries.forEach((mesh) => {
    const chunks = splitMeshByHeight(mesh, minY, maxY, layerCount);
    chunks.forEach(({ mesh: chunk }) => {
      const box = new THREE.Box3().setFromObject(chunk);
      const centerY = (box.min.y + box.max.y) / 2;
      const normY = THREE.MathUtils.clamp((centerY - minY) / Math.max(0.0001, height), 0, 1);

      classifyAndAttach(chunk, normY);
      floorLayers.push({
        mesh: chunk,
        targetY: 0,
        order: floorLayers.length,
        normY,
        centerY
      });
    });
  });

  floorLayers.sort((a, b) => a.centerY - b.centerY);
}

function normalizeRootPlacement(root) {
  const initial = new THREE.Box3().setFromObject(root);
  const initialHeight = Math.max(0.001, initial.max.y - initial.min.y);
  const targetHeight = 63;
  const scaleFactor = targetHeight / initialHeight;

  root.scale.setScalar(scaleFactor);
  root.updateMatrixWorld(true);

  const scaled = new THREE.Box3().setFromObject(root);
  const centerX = (scaled.min.x + scaled.max.x) / 2;
  const centerZ = (scaled.min.z + scaled.max.z) / 2;

  root.position.set(-centerX, -scaled.min.y, -centerZ);
  root.updateMatrixWorld(true);
}

function makeYFloor(setback, levelHeight, yOffset) {
  const floorGroup = new THREE.Group();
  floorGroup.position.y = yOffset;

  const core = new THREE.Mesh(
    new THREE.CylinderGeometry(1.55 * setback + 0.2, 1.62 * setback + 0.22, levelHeight * 0.82, 24),
    new THREE.MeshStandardMaterial({
      color: 0x9eb8d2,
      metalness: 0.62,
      roughness: 0.27,
      emissive: 0x121d2a,
      emissiveIntensity: 0.2
    })
  );
  core.castShadow = true;
  core.receiveShadow = true;
  floorGroup.add(core);

  const armLength = 5.8 * setback;
  const armDepth = 1.35 * setback + 0.18;
  const wing = new THREE.Mesh(
    new THREE.BoxGeometry(armLength, levelHeight * 0.66, armDepth),
    new THREE.MeshStandardMaterial({
      color: 0x8ca4c2,
      metalness: 0.58,
      roughness: 0.3,
      emissive: 0x0f1a28,
      emissiveIntensity: 0.22
    })
  );
  wing.castShadow = true;
  wing.receiveShadow = true;
  wing.position.x = armLength * 0.52;

  for (let i = 0; i < 3; i += 1) {
    const armGroup = new THREE.Group();
    armGroup.rotation.y = (Math.PI * 2 * i) / 3;
    armGroup.add(wing.clone());
    floorGroup.add(armGroup);
  }

  return floorGroup;
}

function buildProceduralFallback() {
  const levels = 40;
  const levelHeight = 1.26;

  for (let i = 0; i < levels; i += 1) {
    const t = i / (levels - 1);
    const y = i * levelHeight;
    const setback = 1 - Math.pow(t, 1.33) * 0.76;
    const level = makeYFloor(setback, levelHeight, y);

    const normY = THREE.MathUtils.clamp(t, 0, 1);
    classifyAndAttach(level, normY);
    floorLayers.push({ mesh: level, targetY: y, order: floorLayers.length, normY, centerY: y });
  }

  const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x7b92ad, metalness: 0.7, roughness: 0.25 });
  const topY = levels * levelHeight;

  for (let i = 0; i < 10; i += 1) {
    const taper = 1 - i * 0.09;
    const y = topY + i * 1.35;
    const section = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38 * taper, 0.5 * taper, 1.5, 18),
      frameMaterial
    );
    section.position.y = y;
    section.castShadow = true;
    section.receiveShadow = true;
    group_Spire.add(section);
    floorLayers.push({ mesh: section, targetY: y, order: floorLayers.length, normY: 0.95, centerY: y });
  }

  floorLayers.sort((a, b) => a.centerY - b.centerY);
}

function setUnbuiltState() {
  floorLayers.forEach((layer, index) => {
    const extraLift = 8 + layer.normY * 44 + index * 0.34;
    layer.mesh.position.y = layer.targetY + extraLift;
  });

  if (foundationParts.raft && foundationParts.podium && foundationParts.piles) {
    foundationParts.raft.position.y = -8.5;
    foundationParts.podium.position.y = -6.8;
    foundationParts.piles.position.y = -11;
  }
}

function setupTimeline() {
  if (master) {
    if (master.scrollTrigger) master.scrollTrigger.kill();
    master.kill();
  }

  camera.position.set(29, 6, 48);
  phaseState.lookX = 0;
  phaseState.lookY = -4;
  phaseState.lookZ = 0;
  phaseState.yaw = -0.28;
  phaseState.idle = 0;
  finaleState.boost = 0;
  finaleState.photoReveal = 0;
  finaleState.modelFade = 1;

  architectureGroup.position.set(-11, -16, 4);
  architectureGroup.rotation.x = 0.08;
  architectureGroup.rotation.z = -1.45;

  master = gsap.timeline({
    defaults: { ease: "none", duration: 1 },
    scrollTrigger: {
      trigger: "#scrollytelling",
      start: "top top",
      end: "bottom bottom",
      scrub: 1.7,
      onUpdate: (self) => {
        const idx = Math.min(phases.length - 1, Math.floor(self.progress * phases.length));
        setActivePhase(idx);
      },
      onRefresh: (self) => {
        const idx = Math.min(phases.length - 1, Math.floor(self.progress * phases.length));
        setActivePhase(idx);
      }
    }
  });

  master
    .to(camera.position, { x: 20, y: 12, z: 34, ease: "power2.inOut" }, 0)
    .to(phaseState, { lookY: 13, yaw: 0.18, idle: 0.01, ease: "power2.inOut" }, 0)
    .to(architectureGroup.position, { x: 0, y: -2.4, z: 0, ease: "power3.out" }, 0)
    .to(architectureGroup.rotation, { x: 0, z: 0, ease: "power3.out" }, 0)
    .to(camera.position, { x: 15, y: 14, z: 36, ease: "none" }, 1)
    .to(phaseState, { lookY: 12, yaw: 0.22, idle: 0.02, ease: "none" }, 1)
    .to(camera.position, { x: 14, y: 19, z: 38, ease: "none" }, 2.2)
    .to(phaseState, { lookY: 20, yaw: 0.27, idle: 0.02, ease: "none" }, 2.2)
    .to(camera.position, { x: 13, y: 29, z: 48, ease: "none" }, 3.15)
    .to(phaseState, { lookY: 44, yaw: 0.31, idle: 0.02, ease: "none" }, 3.15)
    .to(camera.position, { x: 12, y: 35, z: 58, ease: "none" }, 3.75)
    .to(phaseState, { lookY: 54, yaw: 0.33, idle: 0.02, ease: "none" }, 3.75)
    .to(camera.position, { x: 62, y: 76, z: 110, ease: "power2.inOut" }, 4)
    .to(phaseState, { lookY: 31, yaw: 0.36, idle: 0.13, ease: "power2.inOut" }, 4)
    .to(camera.position, { x: 70, y: 84, z: 128, ease: "none" }, 4.62)
    .to(phaseState, { lookY: 32, yaw: 0.37, idle: 0.08, ease: "none" }, 4.62);

  master
    .to(finaleState, { boost: 1, ease: "sine.inOut" }, 4.18)
    .to(finaleState, { photoReveal: 1, modelFade: 0, ease: "sine.inOut" }, 4.28);

  master
    .to(foundationParts.piles.position, { y: 0, ease: "power2.out", duration: 0.52 }, 1.02)
    .to(foundationParts.raft.position, { y: -1.2, ease: "power2.out", duration: 0.42 }, 1.1)
    .to(foundationParts.podium.position, { y: 1.5, ease: "power2.out", duration: 0.38 }, 1.18);

  const buildStart = 1.24;
  const buildDuration = 2.72;
  const perLayerGap = buildDuration / Math.max(1, floorLayers.length);

  floorLayers.forEach((layer, idx) => {
    const startAt = buildStart + idx * perLayerGap;

    master.to(
      layer.mesh.position,
      {
        y: layer.targetY,
        duration: 0.24,
        ease: "sine.out"
      },
      startAt
    );
  });

  setActivePhase(0);
  ScrollTrigger.refresh();
}

async function loadOneWorldGLB() {
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync("./one_world_trade_center.glb");
  const root = gltf.scene || gltf.scenes[0];
  normalizeRootPlacement(root);
  collectLayerDataFromScene(root);
}

async function initArchitecture() {
  clearArchitecture();
  createFoundation();
  architectureGroup.position.set(0, -2.4, 0);

  try {
    toDisplayMessage("Carregando Modelo Real", "One World Trade Center");
    await loadOneWorldGLB();
    console.info(`Modelo GLB carregado com ${floorLayers.length} camadas animáveis.`);
  } catch (error) {
    console.warn("Falha ao carregar GLB. Ativando protótipo procedural.", error);
    toDisplayMessage("Modo Protótipo", "Reconstruindo Geometria Procedural");
    buildProceduralFallback();
  }

  setUnbuiltState();
  setupTimeline();
}

function setActivePhase(index) {
  if (index === currentPhase) return;
  currentPhase = index;
  body.classList.toggle("is-final", index === phases.length - 1);
  phases.forEach((phase, idx) => {
    phase.classList.toggle("active", idx === index);
  });
  dots.forEach((dot, idx) => {
    dot.classList.toggle("active", idx === index);
  });
}

dots.forEach((dot) => {
  dot.addEventListener("click", () => {
    const index = Number(dot.dataset.index || 0);
    phases[index]?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

const clock = new THREE.Clock();
function render() {
  const t = clock.getElapsedTime();
  const boost = finaleState.boost;
  const reveal = finaleState.photoReveal;

  renderer.toneMappingExposure = baseLighting.exposure + boost * 0.23;
  ambient.intensity = baseLighting.ambient + boost * 0.18;
  hemiLight.intensity = baseLighting.hemi + boost * 0.14;
  keyLight.intensity = baseLighting.key + boost * 0.55;
  rimLight.intensity = baseLighting.rim + boost * 0.28;
  fillLight.intensity = baseLighting.fill + boost * 0.22;
  scene.fog.density = Math.max(0.0065, baseLighting.fog - boost * 0.0028);

  architectureGroup.rotation.y = phaseState.yaw + Math.sin(t * 0.42) * 0.08 * phaseState.idle;
  camera.lookAt(phaseState.lookX, phaseState.lookY, phaseState.lookZ);
  canvas.style.opacity = String(Math.max(0, Math.min(1, finaleState.modelFade)));
  finalPhoto.style.opacity = String(reveal);
  finalPhoto.style.transform = `scale(${1.08 - reveal * 0.08})`;
  finalPhoto.style.clipPath =
    reveal > 0.995 ? "inset(0 0 0 0)" : `circle(${reveal * 180}% at 50% 53%)`;
  finalPhoto.style.filter = `blur(${(1 - reveal) * 8}px) saturate(${0.9 + reveal * 0.18}) contrast(${1.02 + reveal * 0.06})`;
  body.classList.toggle("is-photo-ending", reveal > 0.04);
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(render);

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}
window.addEventListener("resize", onResize);

initArchitecture().finally(() => {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      gsap.to(loadingScreen, {
        autoAlpha: 0,
        duration: 0.75,
        delay: 0.3,
        ease: "power2.out"
      });
    });
  });
});
