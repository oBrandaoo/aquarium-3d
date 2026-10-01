import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import './style.css';

const canvas = document.querySelector('#ocean');
const intro = document.querySelector('#intro');
const hud = document.querySelector('#hud');
const list = document.querySelector('#fishList');
const foundCount = document.querySelector('#foundCount');
const distanceLabel = document.querySelector('#distanceLabel');
const discovery = document.querySelector('#discovery');
const helpDialog = document.querySelector('#helpDialog');
const mobileControls = document.querySelector('#mobileControls');
const playFooter = document.querySelector('#playFooter');
const crosshair = document.querySelector('#crosshair');
const isTouch = matchMedia('(pointer: coarse)').matches;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fishData = [
  { name: 'Lume', detail: 'Uma pequena lanterna entre as folhas.', color: '#95eee0', accent: '#eaffd5', at: [0, 1.35, 3.5], size: 0.83, yaw: -0.4 },
  { name: 'Âmbar', detail: 'Sua cauda acende o jardim de corais.', color: '#ffbd80', accent: '#ffe3ab', at: [-8, 0.9, -6], size: 0.94, yaw: 0.8 },
  { name: 'Nácar', detail: 'Reluz na parte mais funda do aquário.', color: '#b5c9ff', accent: '#f3edff', at: [8.4, 1.8, -7.5], size: 1.06, yaw: 2.6 },
  { name: 'Íris', detail: 'Mora junto às algas altas.', color: '#dc9eff', accent: '#ffd8ff', at: [-9.2, 3.2, 7.1], size: 0.78, yaw: -1.3 },
  { name: 'Coral', detail: 'Uma luz quente perto do fundo.', color: '#ff9ca7', accent: '#ffe2c6', at: [9, 0.6, 7.2], size: 0.88, yaw: 1.8 },
];

let seed = 62754;
function random() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
function between(a, b) { return a + (b - a) * random(); }
function mat(color, extra = {}) { return new THREE.MeshStandardMaterial({ color, roughness: 0.65, ...extra }); }

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
} catch (error) {
  document.querySelector('#fallback').hidden = false;
  intro.hidden = true;
  throw error;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, isTouch ? 1.35 : 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.38;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#061b32');
scene.fog = new THREE.FogExp2('#061b32', 0.035);
const camera = new THREE.PerspectiveCamera(68, innerWidth / innerHeight, 0.08, 75);
camera.rotation.order = 'YXZ';
camera.position.set(0, 1.5, 11.3);
let yaw = 0, pitch = 0.025;
camera.rotation.set(pitch, yaw, 0);
const playerVelocity = new THREE.Vector3();
const playerDirection = new THREE.Vector3();
const targetVelocity = new THREE.Vector3();
const tmp = new THREE.Vector3();

scene.add(new THREE.HemisphereLight('#8ad7e8', '#102234', 2.15));
const moon = new THREE.DirectionalLight('#9dddeb', 2.9);
moon.position.set(-6, 13, 4);
scene.add(moon);
const upperGlow = new THREE.PointLight('#5dcbdf', 82, 27, 2);
upperGlow.position.set(2, 6, -3);
scene.add(upperGlow);

// A low, uneven seabed leaves plenty of room to swim while hiding the tank edge in fog.
const groundGeometry = new THREE.PlaneGeometry(42, 42, 80, 80);
groundGeometry.rotateX(-Math.PI / 2);
const groundPositions = groundGeometry.attributes.position;
for (let i = 0; i < groundPositions.count; i++) {
  const x = groundPositions.getX(i), z = groundPositions.getZ(i);
  groundPositions.setY(i, -2.65 + Math.sin(x * .33) * .17 + Math.cos(z * .42) * .13 + Math.sin((x + z) * .82) * .045);
}
groundGeometry.computeVertexNormals();
scene.add(new THREE.Mesh(groundGeometry, mat('#144056', { roughness: 1, side: THREE.DoubleSide })));

const pebbleGeo = new THREE.IcosahedronGeometry(1, 0);
const pebbles = new THREE.InstancedMesh(pebbleGeo, mat('#477b88', { roughness: 1 }), 360);
const pebbleDummy = new THREE.Object3D();
for (let i = 0; i < 360; i++) {
  const x = between(-19, 19), z = between(-19, 19);
  pebbleDummy.position.set(x, -2.52 + Math.sin(x * .33) * .17 + Math.cos(z * .42) * .13, z);
  pebbleDummy.rotation.set(random() * 3, random() * 3, random() * 3);
  pebbleDummy.scale.set(between(.025, .12), between(.015, .055), between(.025, .11));
  pebbleDummy.updateMatrix();
  pebbles.setMatrixAt(i, pebbleDummy.matrix);
  pebbles.setColorAt(i, new THREE.Color().setHSL(between(.48, .56), .21, between(.23, .48)));
}
scene.add(pebbles);

const rocks = new THREE.Group();
scene.add(rocks);
const rockGeo = new THREE.DodecahedronGeometry(1, 1);
const rockMats = [mat('#1a3a4b'), mat('#224958'), mat('#1b3448'), mat('#2b5864')];
for (let i = 0; i < 48; i++) {
  const angle = random() * Math.PI * 2;
  const radius = between(6, 20);
  const x = Math.cos(angle) * radius, z = Math.sin(angle) * radius;
  const rock = new THREE.Mesh(rockGeo, rockMats[i % rockMats.length]);
  rock.position.set(x, -2.2, z);
  rock.rotation.set(random(), random() * Math.PI, random() * .3);
  rock.scale.set(between(.45, 1.65), between(.3, 1), between(.45, 1.4));
  rocks.add(rock);
}

const seaweed = [];
const leafGeo = new THREE.SphereGeometry(1, 8, 6);
const stemGeo = new THREE.CylinderGeometry(.028, .07, 1, 5);
const seaweedMats = [
  mat('#3b928a', { side: THREE.DoubleSide, emissive: '#115b64', emissiveIntensity: .3 }),
  mat('#5eaa9c', { side: THREE.DoubleSide, emissive: '#1c6767', emissiveIntensity: .28 }),
  mat('#2b737b', { side: THREE.DoubleSide, emissive: '#195968', emissiveIntensity: .4 }),
];
function addPlant(x, z, height, index) {
  const root = new THREE.Group();
  root.position.set(x, -2.4, z);
  const material = seaweedMats[index % seaweedMats.length];
  const stems = 2 + Math.floor(random() * 3);
  const pieces = [];
  const position = new THREE.Vector3();
  const rotation = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  function piece(base, x, y, z, sx, sy, sz, angle, stalkMatrix) {
    const geometry = base.clone();
    position.set(x, y, z);
    rotation.setFromAxisAngle(new THREE.Vector3(0, 0, 1), angle);
    scale.set(sx, sy, sz);
    geometry.applyMatrix4(stalkMatrix.clone().multiply(new THREE.Matrix4().compose(position, rotation, scale)));
    pieces.push(geometry);
  }
  for (let s = 0; s < stems; s++) {
    const stalkMatrix = new THREE.Matrix4().makeRotationZ(between(-.15, .15));
    stalkMatrix.setPosition((s - (stems - 1) / 2) * .2, 0, 0);
    piece(stemGeo, 0, height * .5, 0, 1, height, 1, 0, stalkMatrix);
    for (let l = 0; l < 4; l++) {
      const side = l % 2 ? 1 : -1;
      piece(leafGeo, side * .16, height * (.23 + l * .2), 0, .15, height * .19, .036, side * .74, stalkMatrix);
    }
    piece(leafGeo, 0, height, 0, .085, .22, .045, 0, stalkMatrix);
  }
  const geometry = mergeGeometries(pieces, false);
  pieces.forEach(piece => piece.dispose());
  root.add(new THREE.Mesh(geometry, material));
  scene.add(root);
  seaweed.push({ root, phase: random() * Math.PI * 2, amount: between(.045, .13) });
}
for (let i = 0; i < 62; i++) {
  const angle = random() * Math.PI * 2;
  const radius = between(2.5, 18.5);
  addPlant(Math.cos(angle) * radius, Math.sin(angle) * radius, between(.8, 2.6), i);
}
for (const data of fishData) {
  for (let i = 0; i < 5; i++) addPlant(data.at[0] + between(-2.3, 2.3), data.at[2] + between(-2.3, 2.3), between(1.1, 2.7), i);
}

function branch(group, from, to, radius, material) {
  const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius * .65, radius, a.distanceTo(b), 5), material);
  mesh.position.copy(a).add(b).multiplyScalar(.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  group.add(mesh);
}
const coralMaterials = [
  mat('#9b7195', { emissive: '#744276', emissiveIntensity: .55 }),
  mat('#cf8f89', { emissive: '#a95968', emissiveIntensity: .45 }),
  mat('#668caa', { emissive: '#396c9e', emissiveIntensity: .56 }),
];
for (let c = 0; c < 28; c++) {
  const angle = random() * Math.PI * 2, radius = between(4, 18);
  const coral = new THREE.Group();
  coral.position.set(Math.cos(angle) * radius, -2.45, Math.sin(angle) * radius);
  const material = coralMaterials[c % coralMaterials.length];
  const h = between(.38, 1.35);
  branch(coral, [0, 0, 0], [0, h, 0], .07, material);
  for (let j = 0; j < 4; j++) {
    const a = j * Math.PI / 2 + random() * .4, level = h * between(.38, .7);
    const end = [Math.cos(a) * h * .5, h * between(.7, 1.2), Math.sin(a) * h * .5];
    branch(coral, [0, level, 0], end, .045, material);
    const bead = new THREE.Mesh(new THREE.SphereGeometry(.055, 8, 6), mat('#c7efe4', { emissive: '#6cdbd5', emissiveIntensity: 2 }));
    bead.position.set(...end); coral.add(bead);
  }
  scene.add(coral);
}

function glowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 1, 64, 64, 63);
  g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(.15, 'rgba(255,255,255,.4)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}
const glowMap = glowTexture();
function createFish(data, index) {
  const anchor = new THREE.Vector3(...data.at);
  const group = new THREE.Group();
  group.position.copy(anchor);
  group.rotation.y = data.yaw;
  group.scale.setScalar(data.size);
  const bodyMat = mat(data.color, { roughness: .36, metalness: .14, emissive: data.color, emissiveIntensity: .38 });
  const finMat = mat(data.accent, { roughness: .4, side: THREE.DoubleSide, emissive: data.color, emissiveIntensity: .85 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), bodyMat);
  body.scale.set(.85, .48, .34);
  group.add(body);
  const snout = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), bodyMat);
  snout.position.x = .7; snout.scale.set(.24, .21, .24); group.add(snout);
  const tailPivot = new THREE.Group(); tailPivot.position.x = -.73;
  const tailShape = new THREE.Shape();
  tailShape.moveTo(0, 0); tailShape.lineTo(-.82, .48); tailShape.quadraticCurveTo(-.6, 0, -.82, -.48); tailShape.closePath();
  const tail = new THREE.Mesh(new THREE.ExtrudeGeometry(tailShape, { depth: .045, bevelEnabled: true, bevelThickness: .035, bevelSize: .03, bevelSegments: 1 }), finMat);
  tail.position.z = -.02; tailPivot.add(tail); group.add(tailPivot);
  const dorsalShape = new THREE.Shape();
  dorsalShape.moveTo(-.42, .28); dorsalShape.quadraticCurveTo(-.22, .94, .27, .42); dorsalShape.quadraticCurveTo(-.05, .48, -.42, .28);
  const dorsal = new THREE.Mesh(new THREE.ShapeGeometry(dorsalShape), finMat);
  dorsal.position.z = .015; group.add(dorsal);
  const lowerFin = new THREE.Mesh(new THREE.ConeGeometry(.25, .55, 3), finMat);
  lowerFin.position.set(-.06, -.4, 0); lowerFin.rotation.z = Math.PI; lowerFin.scale.z = .3; group.add(lowerFin);
  const eyeMat = new THREE.MeshBasicMaterial({ color: '#102332' });
  const glintMat = new THREE.MeshBasicMaterial({ color: '#fffdf2' });
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(.072, 12, 8), eyeMat);
    eye.position.set(.52, .12, side * .29); group.add(eye);
    const glint = new THREE.Mesh(new THREE.SphereGeometry(.022, 8, 6), glintMat);
    glint.position.set(.542, .143, side * .351); group.add(glint);
    const sideFin = new THREE.Mesh(new THREE.ConeGeometry(.16, .42, 3), finMat);
    sideFin.position.set(-.28, -.09, side * .31);
    sideFin.rotation.set(side * .4, 0, -1.1); group.add(sideFin);
  }
  const light = new THREE.PointLight(data.color, 4.8, 4.5, 2);
  group.add(light);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowMap, color: data.color, transparent: true, opacity: .17, depthWrite: false, blending: THREE.AdditiveBlending }));
  glow.scale.set(3.5, 3.5, 1); group.add(glow);
  const aura = new THREE.Mesh(new THREE.TorusGeometry(1.05, .009, 4, 64), new THREE.MeshBasicMaterial({ color: data.color, transparent: true, opacity: .28, depthWrite: false }));
  aura.rotation.y = Math.PI / 2; group.add(aura);
  scene.add(group);
  return { data, index, group, anchor, velocity: new THREE.Vector3(), tailPivot, aura, glow, phase: index * 1.37, found: false };
}
const fish = fishData.map(createFish);

const particleCount = isTouch ? 170 : 300;
const particlePositions = new Float32Array(particleCount * 3);
const particleSpeeds = new Float32Array(particleCount);
for (let i = 0; i < particleCount; i++) {
  particlePositions[i * 3] = between(-19, 19);
  particlePositions[i * 3 + 1] = between(-2, 7);
  particlePositions[i * 3 + 2] = between(-19, 19);
  particleSpeeds[i] = between(.07, .3);
}
const particleGeometry = new THREE.BufferGeometry();
particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
const particles = new THREE.Points(particleGeometry, new THREE.PointsMaterial({ color: '#afeee2', size: .055, transparent: true, opacity: .65, sizeAttenuation: true, depthWrite: false }));
scene.add(particles);

const pulse = new THREE.Mesh(new THREE.RingGeometry(.99, 1, 96), new THREE.MeshBasicMaterial({ color: '#a7f9e9', transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
pulse.rotation.x = -Math.PI / 2;
scene.add(pulse);
let pulseAge = 100;

list.innerHTML = fishData.map((item, i) => `<div class="fish-row" id="fish-${i}" style="--fish-color:${item.color}"><span class="fish-symbol">✳</span><span>${item.name}</span><small>por encontrar</small></div>`).join('');
let active = false;
let lastTime = performance.now();
let elapsed = 0;
let foundTotal = 0;
let discoveryTimer;
let nearest = null;
const pressed = new Set();
const stick = { x: 0, y: 0, pointer: null };
let dragPointer = null, dragX = 0, dragY = 0;
const verticalButtons = { up: false, down: false };

function start() {
  active = true;
  intro.classList.add('is-hidden');
  hud.hidden = false; playFooter.hidden = false; crosshair.hidden = false;
  if (isTouch) mobileControls.hidden = false;
  else canvas.requestPointerLock?.();
}
function look(dx, dy) {
  yaw -= dx * .00235;
  pitch = THREE.MathUtils.clamp(pitch - dy * .0021, -1.32, 1.32);
  camera.rotation.set(pitch, yaw, 0);
}
function emitPulse() {
  if (!active) return;
  pulseAge = 0;
  pulse.position.copy(camera.position);
  distanceLabel.textContent = 'Pulso emitido — siga os brilhos';
}
function showDiscovery(item) {
  clearTimeout(discoveryTimer);
  document.querySelector('#discoveryName').textContent = item.data.name;
  document.querySelector('#discoveryDetail').textContent = item.data.detail;
  discovery.hidden = false;
  discoveryTimer = setTimeout(() => { discovery.hidden = true; }, 4200);
}
function discover(item) {
  if (item.found) return;
  item.found = true;
  foundTotal++;
  foundCount.textContent = foundTotal;
  const row = document.querySelector(`#fish-${item.index}`);
  row.classList.add('found'); row.querySelector('small').textContent = 'encontrado';
  item.aura.material.opacity = .65;
  showDiscovery(item);
  if (foundTotal === fish.length) {
    distanceLabel.textContent = 'Todos encontrados — o aquário é seu para explorar';
  }
}
document.querySelector('#startButton').addEventListener('click', start);
document.querySelector('#pulseButton').addEventListener('click', emitPulse);
document.querySelector('#mobilePulse').addEventListener('click', emitPulse);
document.querySelector('#helpButton').addEventListener('click', () => { document.exitPointerLock?.(); helpDialog.showModal(); });
document.querySelector('#closeHelp').addEventListener('click', () => helpDialog.close());
document.querySelector('#resumeButton').addEventListener('click', () => { helpDialog.close(); if (active && !isTouch) canvas.requestPointerLock?.(); });
helpDialog.addEventListener('click', e => { if (e.target === helpDialog) helpDialog.close(); });
canvas.addEventListener('click', () => { if (active && !isTouch && document.pointerLockElement !== canvas) canvas.requestPointerLock?.(); });
document.addEventListener('mousemove', e => { if (active && document.pointerLockElement === canvas && !helpDialog.open) look(e.movementX, e.movementY); });
document.addEventListener('keydown', e => {
  if (helpDialog.open) return;
  const key = e.key.toLowerCase();
  if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'control', 'e'].includes(key)) e.preventDefault();
  pressed.add(key);
  if (key === 'e' && !e.repeat) emitPulse();
});
document.addEventListener('keyup', e => pressed.delete(e.key.toLowerCase()));
window.addEventListener('blur', () => pressed.clear());
canvas.addEventListener('pointerdown', e => {
  if (!active || !isTouch || e.clientX < innerWidth * .42) return;
  dragPointer = e.pointerId; dragX = e.clientX; dragY = e.clientY;
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', e => {
  if (e.pointerId !== dragPointer) return;
  look(e.clientX - dragX, e.clientY - dragY);
  dragX = e.clientX; dragY = e.clientY;
});
canvas.addEventListener('pointerup', e => { if (e.pointerId === dragPointer) dragPointer = null; });
const joystick = document.querySelector('#joystick');
const joystickKnob = document.querySelector('#joystickKnob');
function updateStick(e) {
  const box = joystick.getBoundingClientRect();
  const x = (e.clientX - box.left - box.width / 2) / 36;
  const y = (e.clientY - box.top - box.height / 2) / 36;
  const length = Math.max(1, Math.hypot(x, y));
  stick.x = x / length; stick.y = y / length;
  joystickKnob.style.transform = `translate(${stick.x * 33}px,${stick.y * 33}px)`;
}
joystick.addEventListener('pointerdown', e => { stick.pointer = e.pointerId; joystick.setPointerCapture(e.pointerId); updateStick(e); });
joystick.addEventListener('pointermove', e => { if (e.pointerId === stick.pointer) updateStick(e); });
function releaseStick(e) { if (e.pointerId === stick.pointer) { stick.pointer = null; stick.x = stick.y = 0; joystickKnob.style.transform = ''; } }
joystick.addEventListener('pointerup', releaseStick);
joystick.addEventListener('pointercancel', releaseStick);
for (const [id, direction] of [['upButton', 'up'], ['downButton', 'down']]) {
  const button = document.getElementById(id);
  button.addEventListener('pointerdown', e => { verticalButtons[direction] = true; button.setPointerCapture(e.pointerId); });
  button.addEventListener('pointerup', () => { verticalButtons[direction] = false; });
  button.addEventListener('pointercancel', () => { verticalButtons[direction] = false; });
}
window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(devicePixelRatio, isTouch ? 1.35 : 1.5));
  renderer.setSize(innerWidth, innerHeight);
});

function updatePlayer(dt) {
  if (!active || helpDialog.open) return;
  const forward = (pressed.has('w') || pressed.has('arrowup') ? 1 : 0) - (pressed.has('s') || pressed.has('arrowdown') ? 1 : 0) - stick.y;
  const side = (pressed.has('d') || pressed.has('arrowright') ? 1 : 0) - (pressed.has('a') || pressed.has('arrowleft') ? 1 : 0) + stick.x;
  const up = (pressed.has(' ') || verticalButtons.up ? 1 : 0) - (pressed.has('control') || verticalButtons.down ? 1 : 0);
  playerDirection.set(Math.sin(yaw) * forward + Math.cos(yaw) * side, up, -Math.cos(yaw) * forward + Math.sin(yaw) * side);
  if (playerDirection.lengthSq() > 1) playerDirection.normalize();
  const speed = pressed.has('shift') ? 6.4 : 3.8;
  targetVelocity.copy(playerDirection).multiplyScalar(speed);
  playerVelocity.lerp(targetVelocity, 1 - Math.exp(-dt * 4.6));
  camera.position.addScaledVector(playerVelocity, dt);
  camera.position.x = THREE.MathUtils.clamp(camera.position.x, -14.3, 14.3);
  camera.position.y = THREE.MathUtils.clamp(camera.position.y, -1.35, 6.25);
  camera.position.z = THREE.MathUtils.clamp(camera.position.z, -14.3, 14.3);
}
function animate(time) {
  const dt = Math.min((time - lastTime) / 1000, .1);
  lastTime = time;
  elapsed += dt;
  updatePlayer(dt);
  const motion = reducedMotion ? .3 : 1;
  for (const plant of seaweed) {
    plant.root.rotation.z = Math.sin(elapsed * .9 + plant.phase) * plant.amount * motion;
    plant.root.rotation.x = Math.cos(elapsed * .65 + plant.phase) * plant.amount * .4 * motion;
  }
  nearest = null;
  let nearestDistance = Infinity;
  for (const item of fish) {
    const distance = camera.position.distanceTo(item.group.position);
    if (!item.found && distance < nearestDistance) { nearest = item; nearestDistance = distance; }
    if (active && distance < 2.2) discover(item);
    // Each fish remains attached to a point by a damped spring. A swimmer passing
    // nearby pushes it away gently, then it settles back into its resting place.
    const home = tmp.copy(item.anchor).sub(item.group.position);
    item.velocity.addScaledVector(home, 4.8 * dt);
    item.velocity.addScaledVector(item.velocity, -Math.min(.99, 3.1 * dt));
    if (active && distance < 3.4 && distance > .01) {
      const push = item.group.position.clone().sub(camera.position).normalize();
      item.velocity.addScaledVector(push, (3.4 - distance) * .92 * dt);
    }
    item.group.position.addScaledVector(item.velocity, dt);
    item.group.position.y += Math.sin(elapsed * 1.1 + item.phase) * .0019 * motion;
    item.group.rotation.y = item.data.yaw + Math.sin(elapsed * .7 + item.phase) * .13 * motion + item.velocity.x * .09;
    item.group.rotation.z = Math.sin(elapsed * 1.3 + item.phase) * .045 * motion;
    item.tailPivot.rotation.y = Math.sin(elapsed * 4 + item.phase) * .23 * motion;
    item.aura.rotation.z = elapsed * .15 * motion;
    item.glow.material.opacity = .16 + (pulseAge < 2.5 ? .28 * (1 - pulseAge / 2.5) : 0);
  }
  if (active && foundTotal !== fish.length && nearest && pulseAge > 4) {
    distanceLabel.textContent = nearestDistance < 5 ? `Uma luz está a ${Math.ceil(nearestDistance)} m` : 'Explore a água';
  }
  for (let i = 0; i < particleCount; i++) {
    const j = i * 3;
    particlePositions[j + 1] += particleSpeeds[i] * dt * motion;
    particlePositions[j] += Math.sin(elapsed * .7 + i) * dt * .012 * motion;
    if (particlePositions[j + 1] > 7) particlePositions[j + 1] = -2.5;
  }
  particleGeometry.attributes.position.needsUpdate = true;
  pulseAge += dt;
  if (pulseAge < 2.5) {
    pulse.visible = true;
    pulse.scale.setScalar(1 + pulseAge * 9.5);
    pulse.material.opacity = .46 * (1 - pulseAge / 2.5);
  } else pulse.visible = false;
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);
window.addEventListener('beforeunload', () => {
  renderer.setAnimationLoop(null);
  scene.traverse(object => {
    object.geometry?.dispose();
    const materials = object.material ? (Array.isArray(object.material) ? object.material : [object.material]) : [];
    materials.forEach(material => material.dispose());
  });
  glowMap.dispose();
  renderer.dispose();
});
