import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import './style.css';

const canvas = document.querySelector('#ocean');
const intro = document.querySelector('#intro');
const hud = document.querySelector('#hud');
const list = document.querySelector('#fishList');
const foundCount = document.querySelector('#foundCount');
const distanceLabel = document.querySelector('#distanceLabel');
const speciesDialog = document.querySelector('#speciesDialog');
const journalDialog = document.querySelector('#journalDialog');
const journalButton = document.querySelector('#journalButton');
const journalEntries = document.querySelector('#journalEntries');
const sonarReadout = document.querySelector('#sonarReadout');
const sonarArrow = document.querySelector('#sonarArrow');
const sonarText = document.querySelector('#sonarText');
const helpDialog = document.querySelector('#helpDialog');
const mobileControls = document.querySelector('#mobileControls');
const playFooter = document.querySelector('#playFooter');
const crosshair = document.querySelector('#crosshair');
const isTouch = matchMedia('(pointer: coarse)').matches;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fishData = [
  { name: 'Sargento', short: 'Sargento', scientific: 'Abudefduf saxatilis', place: 'Litoral brasileiro e ilhas oceânicas', habitat: 'Recifes rasos, costões rochosos e áreas próximas à areia.', trait: 'Corpo prateado com dorso amarelado e cinco barras pretas.', source: 'https://www.floridamuseum.ufl.edu/discover-fish/species-profiles/sergeant-major/', color: '#e7d786', accent: '#c8c786', type: 'sergeant', body: [.79, .55, .23], at: [0, 1.35, 3.5], size: .91, yaw: -.4 },
  { name: 'Borboleta-listrada', short: 'Borboleta', scientific: 'Chaetodon striatus', place: 'Litoral até o Sudeste e ilhas oceânicas brasileiras', habitat: 'Recifes de coral e costões rochosos.', trait: 'Corpo alto e fino, bege, com quatro barras pretas e estrias delicadas.', source: 'https://www.gov.br/ibama/pt-br/phocadownload/peixesornamentais/2008/guia-para-identificao-de-peixes-ornamentais-marinhos-ibama.pdf', color: '#e9ddad', accent: '#e9d89a', type: 'butterfly', body: [.66, .72, .17], at: [-8, .9, -6], size: .84, yaw: .8 },
  { name: 'Cirurgião-azul', short: 'Cirurgião', scientific: 'Acanthurus coeruleus', place: 'Costa brasileira até São Paulo e ilhas oceânicas', habitat: 'Recifes e áreas rochosas onde pasta algas.', trait: 'Adulto azul intenso, corpo achatado e espinho claro na base da cauda.', source: 'https://www.gov.br/ibama/pt-br/phocadownload/peixesornamentais/2008/guia-para-identificao-de-peixes-ornamentais-marinhos-ibama.pdf', color: '#2876c7', accent: '#1b4d96', type: 'tang', body: [.9, .53, .19], at: [8.4, 1.8, -7.5], size: 1.02, yaw: 2.6 },
  { name: 'Peixe-frade', short: 'Frade', scientific: 'Pomacanthus paru', place: 'Recifes e costões do litoral brasileiro', habitat: 'Áreas recifais com fendas e abrigo entre corais.', trait: 'Corpo escuro com bordas douradas nas escamas e nadadeiras altas.', source: 'https://www.floridamuseum.ufl.edu/discover-fish/species-profiles/french-angelfish/', color: '#c9aa5a', accent: '#bca04d', type: 'angelfish', body: [.71, .72, .18], at: [-9.2, 3.2, 7.1], size: .95, yaw: -1.3 },
  { name: 'Salema', short: 'Salema', scientific: 'Anisotremus virginicus', place: 'Litoral brasileiro, inclusive Sergipe e Santa Catarina', habitat: 'Fundos rochosos e coralinos do litoral.', trait: 'Corpo prateado com faixas amarelas horizontais e duas barras pretas na cabeça.', source: 'https://faep.eng.br/arquivos/ebooks/catalogo_de_pescados_de_sergipe_e_adjacencias.pdf', color: '#e9d895', accent: '#f2c951', type: 'porkfish', body: [.91, .49, .22], at: [9, .6, 7.2], size: .94, yaw: 1.8 },
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
scene.add(camera);
const lantern = new THREE.SpotLight('#c7f7ee', 0, 20, .47, .65, 1.5);
lantern.position.set(0, -.12, 0);
lantern.target.position.set(0, -.12, -4);
camera.add(lantern, lantern.target);
let lanternOn = false;

const domeRadius = 15.8;
const domeBase = -2.65;
const domeHeightScale = .78;
const dome = new THREE.Mesh(
  new THREE.SphereGeometry(domeRadius, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2),
  new THREE.ShaderMaterial({
    side: THREE.BackSide, transparent: true, depthWrite: false,
    uniforms: { glassColor: { value: new THREE.Color('#60b7c6') } },
    vertexShader: 'varying vec3 vNormal; varying vec3 vEye; void main(){ vec4 world = modelMatrix * vec4(position,1.0); vNormal = normalize(mat3(modelMatrix) * normal); vEye = normalize(cameraPosition - world.xyz); gl_Position = projectionMatrix * viewMatrix * world; }',
    fragmentShader: 'uniform vec3 glassColor; varying vec3 vNormal; varying vec3 vEye; void main(){ float edge = pow(1.0 - abs(dot(normalize(vNormal), normalize(vEye))), 2.0); gl_FragColor = vec4(glassColor, 0.035 + edge * 0.22); }',
  }),
);
dome.position.y = domeBase;
dome.scale.y = domeHeightScale;
dome.renderOrder = 4;
scene.add(dome);
const glassLine = new THREE.LineBasicMaterial({ color: '#70c3cb', transparent: true, opacity: .19, depthWrite: false });
function domeCurve(points) {
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), glassLine);
  line.renderOrder = 5;
  scene.add(line);
}
for (const angle of [0, Math.PI / 4, Math.PI / 2, 3 * Math.PI / 4]) {
  for (const side of [0, Math.PI]) {
    const points = [];
    for (let i = 0; i <= 48; i++) {
      const t = i / 48 * Math.PI / 2;
      points.push(new THREE.Vector3(Math.cos(angle + side) * Math.sin(t) * domeRadius, domeBase + Math.cos(t) * domeRadius * domeHeightScale, Math.sin(angle + side) * Math.sin(t) * domeRadius));
    }
    domeCurve(points);
  }
}
for (const t of [Math.PI / 5, Math.PI * 2 / 5]) {
  const points = [];
  for (let i = 0; i <= 128; i++) {
    const angle = i / 128 * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(angle) * Math.sin(t) * domeRadius, domeBase + Math.cos(t) * domeRadius * domeHeightScale, Math.sin(angle) * Math.sin(t) * domeRadius));
  }
  domeCurve(points);
}
const domeRim = new THREE.Mesh(new THREE.TorusGeometry(domeRadius - .1, .07, 8, 128), mat('#74c6c6', { emissive: '#4fc6c3', emissiveIntensity: 1.4 }));
domeRim.rotation.x = Math.PI / 2;
domeRim.position.y = domeBase + .08;
scene.add(domeRim);

// A low, uneven seabed leaves plenty of room to swim while hiding the tank edge in fog.
const groundGeometry = new THREE.PlaneGeometry(42, 42, 80, 80);
groundGeometry.rotateX(-Math.PI / 2);
const groundPositions = groundGeometry.attributes.position;
for (let i = 0; i < groundPositions.count; i++) {
  const x = groundPositions.getX(i), z = groundPositions.getZ(i);
  groundPositions.setY(i, -2.65 + Math.sin(x * .33) * .17 + Math.cos(z * .42) * .13 + Math.sin((x + z) * .82) * .045);
}
const groundIndices = groundGeometry.index.array;
const keptTriangles = [];
for (let i = 0; i < groundIndices.length; i += 3) {
  const a = groundIndices[i], b = groundIndices[i + 1], c = groundIndices[i + 2];
  const x = (groundPositions.getX(a) + groundPositions.getX(b) + groundPositions.getX(c)) / 3;
  const z = (groundPositions.getZ(a) + groundPositions.getZ(b) + groundPositions.getZ(c)) / 3;
  if (Math.hypot(x, z) < domeRadius - .15) keptTriangles.push(a, b, c);
}
groundGeometry.setIndex(keptTriangles);
groundGeometry.computeVertexNormals();
scene.add(new THREE.Mesh(groundGeometry, mat('#144056', { roughness: 1, side: THREE.DoubleSide })));

const pebbleGeo = new THREE.IcosahedronGeometry(1, 0);
const pebbles = new THREE.InstancedMesh(pebbleGeo, mat('#477b88', { roughness: 1 }), 360);
const pebbleDummy = new THREE.Object3D();
for (let i = 0; i < 360; i++) {
  const angle = random() * Math.PI * 2, radius = Math.sqrt(random()) * 14.9;
  const x = Math.cos(angle) * radius, z = Math.sin(angle) * radius;
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
  const radius = between(6, 14.2);
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
  const radius = between(2.5, 14.1);
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
  const angle = random() * Math.PI * 2, radius = between(4, 14);
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
const fishPalette = {
  ink: new THREE.Color('#172b35'),
  cream: new THREE.Color('#e8e2c9'),
  silver: new THREE.Color('#b8c9c8'),
  yellow: new THREE.Color('#dfcb73'),
  blue: new THREE.Color('#1768b4'),
  deepBlue: new THREE.Color('#15417c'),
  charcoal: new THREE.Color('#1b2c37'),
  gold: new THREE.Color('#d5b353'),
};
function bodyColor(type, x, y) {
  const { ink, cream, silver, yellow, blue, deepBlue, charcoal, gold } = fishPalette;
  const color = new THREE.Color();
  if (type === 'sergeant') {
    color.copy(silver).lerp(yellow, THREE.MathUtils.smoothstep(y, -.25, .7) * .82);
    if (x > .48) color.lerp(new THREE.Color('#8eb9b6'), (x - .48) * .5);
    const band = Math.min(...[-.72, -.39, -.06, .26, .56].map(center => Math.abs(x + y * y * .028 - center)));
    color.lerp(ink, 1 - THREE.MathUtils.smoothstep(band, .053, .075));
  } else if (type === 'butterfly') {
    color.copy(cream).lerp(yellow, .24 + Math.max(0, y) * .14);
    if (Math.sin(y * 47 + x * 5) > .91) color.lerp(ink, .27);
    const band = Math.min(...[-.63, -.23, .18, .63].map(center => Math.abs(x - center)));
    color.lerp(ink, 1 - THREE.MathUtils.smoothstep(band, .062, .085));
  } else if (type === 'tang') {
    color.copy(blue).lerp(deepBlue, THREE.MathUtils.smoothstep(y, -.4, .8) * .48);
    if (Math.sin(y * 24 + x * 2) > .985) color.lerp(cream, .08);
  } else if (type === 'angelfish') {
    color.copy(charcoal);
    if (x > .52) color.lerp(new THREE.Color('#54717b'), (x - .52) * .74);
    const row = (y + 1) * 10;
    const col = (x + 1) * 10 + Math.floor(row) * .5;
    if (x < .49 && x > -.8 && Math.abs(row % 1 - .48) < .16 && Math.abs(col % 1 - .5) < .35) color.lerp(gold, .9);
  } else {
    color.copy(silver).lerp(cream, .45);
    if (Math.sin((y + .79) * 37) > .68) color.lerp(yellow, .92);
    const band = Math.min(Math.abs(x - .37), Math.abs(x - .68));
    color.lerp(ink, 1 - THREE.MathUtils.smoothstep(band, .06, .08));
  }
  return color;
}
const bodyTextures = new Map();
function bodyTexture(type) {
  if (bodyTextures.has(type)) return bodyTextures.get(type);
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const image = ctx.createImageData(canvas.width, canvas.height);
  for (let row = 0; row < canvas.height; row++) {
    const theta = row / (canvas.height - 1) * Math.PI;
    const y = Math.cos(theta);
    const ring = Math.sin(theta);
    for (let col = 0; col < canvas.width; col++) {
      const x = -Math.cos(col / (canvas.width - 1) * Math.PI * 2) * ring;
      const color = bodyColor(type, x, y).convertLinearToSRGB();
      const at = (row * canvas.width + col) * 4;
      image.data[at] = Math.round(color.r * 255);
      image.data[at + 1] = Math.round(color.g * 255);
      image.data[at + 2] = Math.round(color.b * 255);
      image.data[at + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  bodyTextures.set(type, texture);
  return texture;
}
function makeBody(data) {
  const geometry = new THREE.SphereGeometry(1, 48, 32);
  const positions = geometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const head = THREE.MathUtils.smoothstep(x, .08, 1);
    const tail = THREE.MathUtils.smoothstep(-x, .42, 1);
    positions.setXYZ(i, x + head * .07, positions.getY(i) * (1 - head * .34 - tail * .12), positions.getZ(i) * (1 - head * .26 - tail * .19));
  }
  geometry.computeVertexNormals();
  const body = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ map: bodyTexture(data.type), roughness: .72, metalness: .02 }));
  body.scale.set(...data.body);
  return body;
}
function createFish(data, index) {
  const anchor = new THREE.Vector3(...data.at);
  const group = new THREE.Group();
  group.userData.fishIndex = index;
  group.position.copy(anchor);
  group.rotation.y = data.yaw;
  group.scale.setScalar(data.size);
  const finMat = mat(data.accent, { roughness: .68, side: THREE.DoubleSide, transparent: true, opacity: .91 });
  group.add(makeBody(data));
  const [length, height, depth] = data.body;
  const tailPivot = new THREE.Group(); tailPivot.position.x = -length * .92;
  const peduncle = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), mat(data.color));
  peduncle.position.x = -.06; peduncle.scale.set(.25, .11, .11); tailPivot.add(peduncle);
  const tailShape = new THREE.Shape();
  const roundedTail = data.type === 'angelfish' || data.type === 'butterfly';
  tailShape.moveTo(-.11, 0);
  tailShape.bezierCurveTo(-.28, .05, roundedTail ? -.48 : -.48, roundedTail ? .29 : .41, roundedTail ? -.56 : -.71, roundedTail ? .29 : .38);
  tailShape.quadraticCurveTo(roundedTail ? -.7 : -.46, 0, roundedTail ? -.56 : -.71, roundedTail ? -.29 : -.38);
  tailShape.bezierCurveTo(roundedTail ? -.48 : -.48, roundedTail ? -.29 : -.41, -.28, -.05, -.11, 0);
  tailShape.closePath();
  const tail = new THREE.Mesh(new THREE.ExtrudeGeometry(tailShape, { depth: .025, bevelEnabled: true, bevelThickness: .015, bevelSize: .017, bevelSegments: 1 }), finMat);
  tail.position.z = -.013; tailPivot.add(tail); group.add(tailPivot);
  const dorsalShape = new THREE.Shape();
  const tallFin = data.type === 'angelfish' || data.type === 'butterfly';
  dorsalShape.moveTo(-length * .77, height * .52);
  dorsalShape.quadraticCurveTo(-length * .78, height * (tallFin ? 1.42 : 1.15), -length * .36, height * (tallFin ? 1.32 : 1.1));
  dorsalShape.quadraticCurveTo(length * .22, height * (tallFin ? 1.16 : 1.02), length * .7, height * .48);
  dorsalShape.closePath();
  const dorsal = new THREE.Mesh(new THREE.ShapeGeometry(dorsalShape), finMat);
  dorsal.position.z = .015; group.add(dorsal);
  const anal = new THREE.Mesh(new THREE.ShapeGeometry(dorsalShape), finMat);
  anal.scale.y = -.69; anal.position.y = -.04; anal.position.z = -.015; group.add(anal);
  if (data.type === 'butterfly') {
    const snout = new THREE.Mesh(new THREE.ConeGeometry(.105, .38, 16), mat('#e8ddbd'));
    snout.rotation.z = -Math.PI / 2; snout.position.set(length + .1, -.12, 0); group.add(snout);
  }
  if (data.type === 'angelfish') {
    const mouth = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), mat('#d3d6c9'));
    mouth.position.set(length * .98, -.18, 0); mouth.scale.set(.11, .09, .11); group.add(mouth);
  }
  const eyeMat = new THREE.MeshStandardMaterial({ color: '#07151c', roughness: .12 });
  const glintMat = new THREE.MeshBasicMaterial({ color: '#ecf6ec' });
  const pectoralFins = [];
  for (const side of [-1, 1]) {
    const eyeX = length * (data.type === 'butterfly' ? .62 : .58);
    const eyeY = height * .19;
    const eyeZ = side * depth * .96;
    if (data.type === 'angelfish') {
      const eyeRing = new THREE.Mesh(new THREE.TorusGeometry(.083, .017, 8, 24), mat('#d3b34e', { side: THREE.DoubleSide }));
      eyeRing.position.set(eyeX, eyeY, eyeZ + side * .014); group.add(eyeRing);
    }
    const eye = new THREE.Mesh(new THREE.SphereGeometry(.039, 14, 10), eyeMat);
    eye.position.set(eyeX, eyeY, eyeZ + side * .026); group.add(eye);
    const glint = new THREE.Mesh(new THREE.SphereGeometry(.009, 8, 6), glintMat);
    glint.position.set(eyeX + .01, eyeY + .013, eyeZ + side * .061); group.add(glint);
    const gillPoints = [];
    for (let g = 0; g <= 12; g++) {
      const yy = height * (.32 - g / 12 * .77);
      const xx = length * (.3 + Math.sin(g / 12 * Math.PI) * .055);
      const zz = depth * Math.sqrt(Math.max(.08, 1 - (xx / length) ** 2 - (yy / height) ** 2));
      gillPoints.push(new THREE.Vector3(xx, yy, side * (zz + .012)));
    }
    const gill = new THREE.Line(new THREE.BufferGeometry().setFromPoints(gillPoints), new THREE.LineBasicMaterial({ color: '#43545a', transparent: true, opacity: .48 }));
    group.add(gill);
    const finShape = new THREE.Shape();
    finShape.moveTo(0, 0); finShape.quadraticCurveTo(-.18, .02, -.34, -.16); finShape.quadraticCurveTo(-.1, -.28, 0, 0);
    const pectoral = new THREE.Mesh(new THREE.ShapeGeometry(finShape), finMat);
    pectoral.position.set(.02, -.08, side * depth * .96);
    pectoral.rotation.y = side * .28; group.add(pectoral); pectoralFins.push(pectoral);
    if (data.type === 'tang') {
      const spine = new THREE.Mesh(new THREE.ConeGeometry(.04, .18, 5), mat('#d7dcc7'));
      spine.rotation.z = Math.PI / 2;
      spine.position.set(-length * 1.04, .06, side * .13); group.add(spine);
    }
  }
  const light = new THREE.PointLight('#b4dfdf', 2.1, 3.5, 2);
  group.add(light);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowMap, color: data.color, transparent: true, opacity: .06, depthWrite: false, blending: THREE.AdditiveBlending }));
  glow.scale.set(3.1, 3.1, 1); group.add(glow);
  const aura = new THREE.Mesh(new THREE.TorusGeometry(1.02, .007, 4, 64), new THREE.MeshBasicMaterial({ color: data.color, transparent: true, opacity: 0, depthWrite: false }));
  aura.rotation.y = Math.PI / 2; group.add(aura);
  scene.add(group);
  return { data, index, group, anchor, velocity: new THREE.Vector3(), tailPivot, pectoralFins, aura, glow, phase: index * 1.37, found: false };
}
const fish = fishData.map(createFish);

const particleCount = isTouch ? 170 : 300;
const particlePositions = new Float32Array(particleCount * 3);
const particleSpeeds = new Float32Array(particleCount);
for (let i = 0; i < particleCount; i++) {
  const angle = random() * Math.PI * 2, radius = Math.sqrt(random()) * 11.5;
  particlePositions[i * 3] = Math.cos(angle) * radius;
  particlePositions[i * 3 + 1] = between(-2, 6.8);
  particlePositions[i * 3 + 2] = Math.sin(angle) * radius;
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

list.innerHTML = fishData.map((item, i) => `<button class="fish-row" id="fish-${i}" data-fish="${i}" style="--fish-color:${item.color}" type="button" aria-label="${item.name}: por encontrar" disabled><span class="fish-symbol">✳</span><span>${item.short}</span><small>por encontrar</small></button>`).join('');
let active = false;
let lastTime = performance.now();
let elapsed = 0;
let foundTotal = 0;
let lastFound = null;
let nearest = null;
let returnToJournal = false;
const pressed = new Set();
const stick = { x: 0, y: 0, pointer: null };
let dragPointer = null, dragX = 0, dragY = 0, dragStartX = 0, dragStartY = 0, dragMoved = false;
const verticalButtons = { up: false, down: false };
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function start() {
  active = true;
  intro.classList.add('is-hidden');
  hud.hidden = false; playFooter.hidden = false; crosshair.hidden = false;
  journalButton.hidden = false;
  if (isTouch) mobileControls.hidden = false;
  else canvas.requestPointerLock?.();
}
function look(dx, dy) {
  yaw -= dx * .00235;
  pitch = THREE.MathUtils.clamp(pitch - dy * .0021, -1.32, 1.32);
  camera.rotation.set(pitch, yaw, 0);
}
function emitPulse() {
  if (!active || speciesDialog.open || journalDialog.open || helpDialog.open) return;
  pulseAge = 0;
  pulse.position.copy(camera.position);
  distanceLabel.textContent = 'Pulso emitido — siga os brilhos';
}
function toggleLantern() {
  if (!active) return;
  lanternOn = !lanternOn;
  lantern.intensity = lanternOn ? 18 : 0;
  document.querySelector('#lanternButton').setAttribute('aria-pressed', String(lanternOn));
  document.querySelector('#mobileLantern').setAttribute('aria-pressed', String(lanternOn));
  document.querySelector('#mobileLantern').setAttribute('aria-label', lanternOn ? 'Desligar lanterna' : 'Ligar lanterna');
}
function renderJournal() {
  journalEntries.innerHTML = fish.map(item => `<button class="journal-entry ${item.found ? 'is-found' : ''}" type="button" data-fish="${item.index}" ${item.found ? '' : 'disabled'}><span class="journal-entry-mark" style="--fish-color:${item.data.color}">${item.found ? '✳' : '○'}</span><span><strong>${item.found ? item.data.name : 'Espécie por encontrar'}</strong><small>${item.found ? item.data.scientific : 'Explore a redoma para revelar'}</small></span><span class="journal-entry-arrow">${item.found ? '↗' : '—'}</span></button>`).join('');
}
function openJournal() {
  if (!active || speciesDialog.open || helpDialog.open) return;
  document.exitPointerLock?.();
  renderJournal();
  if (!journalDialog.open) journalDialog.showModal();
}
function openSpecies(item, justFound = false, fromJournal = false) {
  if (speciesDialog.open) return;
  returnToJournal = fromJournal;
  if (journalDialog.open) journalDialog.close();
  document.exitPointerLock?.();
  document.querySelector('#backToJournal').hidden = !fromJournal;
  document.querySelector('#speciesKicker').textContent = justFound ? 'Nova espécie encontrada' : 'Ficha de campo';
  document.querySelector('#speciesName').textContent = item.data.name;
  document.querySelector('#speciesScientific').textContent = item.data.scientific;
  document.querySelector('#speciesPlace').textContent = item.data.place;
  document.querySelector('#speciesHabitat').textContent = item.data.habitat;
  document.querySelector('#speciesTrait').textContent = item.data.trait;
  document.querySelector('#speciesSource').href = item.data.source;
  speciesDialog.showModal();
}
function discover(item) {
  if (item.found) return;
  item.found = true;
  lastFound = item;
  foundTotal++;
  foundCount.textContent = foundTotal;
  document.querySelector('#journalCount').textContent = `${foundTotal} / ${fish.length}`;
  const row = document.querySelector(`#fish-${item.index}`);
  row.classList.add('found'); row.disabled = false;
  row.setAttribute('aria-label', `${item.data.name}: abrir ficha`);
  row.querySelector('small').textContent = 'ver ficha';
  openSpecies(item, true);
  if (foundTotal === fish.length) {
    distanceLabel.textContent = 'Todos encontrados — o aquário é seu para explorar';
  }
}
document.querySelector('#startButton').addEventListener('click', start);
document.querySelector('#pulseButton').addEventListener('click', emitPulse);
document.querySelector('#mobilePulse').addEventListener('click', emitPulse);
document.querySelector('#lanternButton').addEventListener('click', toggleLantern);
document.querySelector('#mobileLantern').addEventListener('click', toggleLantern);
journalButton.addEventListener('click', openJournal);
journalEntries.addEventListener('click', e => {
  const entry = e.target.closest('button[data-fish]');
  if (entry && !entry.disabled) openSpecies(fish[Number(entry.dataset.fish)], false, true);
});
document.querySelector('#closeJournal').addEventListener('click', () => journalDialog.close());
document.querySelector('#resumeJournal').addEventListener('click', () => journalDialog.close());
journalDialog.addEventListener('click', e => { if (e.target === journalDialog) journalDialog.close(); });
journalDialog.addEventListener('close', () => { if (active && !isTouch && !speciesDialog.open) canvas.requestPointerLock?.(); });
list.addEventListener('click', e => {
  const row = e.target.closest('button[data-fish]');
  if (row && !row.disabled) openSpecies(fish[Number(row.dataset.fish)]);
});
document.querySelector('#closeSpecies').addEventListener('click', () => speciesDialog.close());
document.querySelector('#backToJournal').addEventListener('click', () => speciesDialog.close());
speciesDialog.addEventListener('click', e => { if (e.target === speciesDialog) speciesDialog.close(); });
speciesDialog.addEventListener('close', () => {
  if (returnToJournal) { returnToJournal = false; openJournal(); }
  else if (active && !isTouch) canvas.requestPointerLock?.();
});
document.querySelector('#helpButton').addEventListener('click', () => { document.exitPointerLock?.(); helpDialog.showModal(); });
document.querySelector('#closeHelp').addEventListener('click', () => helpDialog.close());
document.querySelector('#resumeButton').addEventListener('click', () => helpDialog.close());
helpDialog.addEventListener('click', e => { if (e.target === helpDialog) helpDialog.close(); });
helpDialog.addEventListener('close', () => { if (active && !isTouch) canvas.requestPointerLock?.(); });
function selectFish(clientX, clientY) {
  pointer.set(clientX / innerWidth * 2 - 1, -(clientY / innerHeight) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(fish.map(item => item.group), true);
  if (!hits.length) return;
  let object = hits[0].object;
  while (object && object.userData.fishIndex === undefined) object = object.parent;
  if (!object) return;
  const item = fish[object.userData.fishIndex];
  if (item.found) openSpecies(item);
  else distanceLabel.textContent = 'Aproxime-se deste peixe para registrá-lo';
}
canvas.addEventListener('click', e => {
  if (!active || isTouch || speciesDialog.open || journalDialog.open || helpDialog.open) return;
  if (document.pointerLockElement !== canvas) canvas.requestPointerLock?.();
  else selectFish(innerWidth / 2, innerHeight / 2);
});
document.addEventListener('mousemove', e => { if (active && document.pointerLockElement === canvas && !helpDialog.open) look(e.movementX, e.movementY); });
document.addEventListener('keydown', e => {
  const key = e.key.toLowerCase();
  if (key === 'g' && active && !e.repeat && !speciesDialog.open && !helpDialog.open) {
    e.preventDefault();
    if (journalDialog.open) journalDialog.close(); else openJournal();
    return;
  }
  if (helpDialog.open || speciesDialog.open || journalDialog.open) return;
  if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'control', 'e', 'f', 'l'].includes(key)) e.preventDefault();
  pressed.add(key);
  if (key === 'e' && !e.repeat) emitPulse();
  if (key === 'f' && !e.repeat && lastFound) openSpecies(lastFound);
  if (key === 'l' && !e.repeat) toggleLantern();
});
document.addEventListener('keyup', e => pressed.delete(e.key.toLowerCase()));
window.addEventListener('blur', () => pressed.clear());
canvas.addEventListener('pointerdown', e => {
  if (!active || !isTouch || e.clientX < innerWidth * .42) return;
  dragPointer = e.pointerId; dragX = dragStartX = e.clientX; dragY = dragStartY = e.clientY; dragMoved = false;
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', e => {
  if (e.pointerId !== dragPointer) return;
  if (Math.hypot(e.clientX - dragStartX, e.clientY - dragStartY) > 10) dragMoved = true;
  look(e.clientX - dragX, e.clientY - dragY);
  dragX = e.clientX; dragY = e.clientY;
});
canvas.addEventListener('pointerup', e => {
  if (e.pointerId !== dragPointer) return;
  if (!dragMoved) selectFish(e.clientX, e.clientY);
  dragPointer = null;
});
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
  if (!active || helpDialog.open || speciesDialog.open || journalDialog.open) return;
  const forward = (pressed.has('w') || pressed.has('arrowup') ? 1 : 0) - (pressed.has('s') || pressed.has('arrowdown') ? 1 : 0) - stick.y;
  const side = (pressed.has('d') || pressed.has('arrowright') ? 1 : 0) - (pressed.has('a') || pressed.has('arrowleft') ? 1 : 0) + stick.x;
  const up = (pressed.has(' ') || verticalButtons.up ? 1 : 0) - (pressed.has('control') || verticalButtons.down ? 1 : 0);
  playerDirection.set(Math.sin(yaw) * forward + Math.cos(yaw) * side, up, -Math.cos(yaw) * forward + Math.sin(yaw) * side);
  if (playerDirection.lengthSq() > 1) playerDirection.normalize();
  const speed = pressed.has('shift') ? 6.4 : 3.8;
  targetVelocity.copy(playerDirection).multiplyScalar(speed);
  playerVelocity.lerp(targetVelocity, 1 - Math.exp(-dt * 4.6));
  camera.position.addScaledVector(playerVelocity, dt);
  camera.position.y = THREE.MathUtils.clamp(camera.position.y, -1.35, 6.25);
  const normalizedHeight = (camera.position.y - domeBase) / domeHeightScale;
  const maxRadius = Math.sqrt(Math.max(0, domeRadius ** 2 - normalizedHeight ** 2)) - .72;
  const radius = Math.hypot(camera.position.x, camera.position.z);
  if (radius > maxRadius) {
    camera.position.x *= maxRadius / radius;
    camera.position.z *= maxRadius / radius;
    const normal = new THREE.Vector3(camera.position.x, 0, camera.position.z).normalize();
    const outwardSpeed = playerVelocity.dot(normal);
    if (outwardSpeed > 0) playerVelocity.addScaledVector(normal, -outwardSpeed);
  }
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
    if (active && !speciesDialog.open && !journalDialog.open && !helpDialog.open && distance < 2.2) discover(item);
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
    item.pectoralFins.forEach((fin, side) => { fin.rotation.y = (side ? 1 : -1) * (.28 + Math.sin(elapsed * 5 + item.phase) * .18 * motion); });
    item.aura.rotation.z = elapsed * .15 * motion;
    item.aura.material.opacity = pulseAge < 2.5 ? .22 * (1 - pulseAge / 2.5) : 0;
    item.glow.material.opacity = .06 + (pulseAge < 2.5 ? .2 * (1 - pulseAge / 2.5) : 0);
  }
  if (active && foundTotal !== fish.length && nearest && pulseAge > 4) {
    distanceLabel.textContent = nearestDistance < 5 ? `Uma luz está a ${Math.ceil(nearestDistance)} m` : 'Explore a água';
  }
  sonarReadout.hidden = !active || !nearest || pulseAge > 4 || speciesDialog.open || journalDialog.open || helpDialog.open;
  if (!sonarReadout.hidden) {
    const dx = nearest.group.position.x - camera.position.x;
    const dz = nearest.group.position.z - camera.position.z;
    sonarArrow.style.transform = `rotate(${Math.atan2(dx, -dz) - yaw}rad)`;
    sonarText.textContent = `Sinal a ${Math.ceil(nearestDistance)} m`;
  }
  for (let i = 0; i < particleCount; i++) {
    const j = i * 3;
    particlePositions[j + 1] += particleSpeeds[i] * dt * motion;
    particlePositions[j] += Math.sin(elapsed * .7 + i) * dt * .012 * motion;
    if (particlePositions[j + 1] > 6.8) particlePositions[j + 1] = -2.5;
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
  bodyTextures.forEach(texture => texture.dispose());
  renderer.dispose();
});
