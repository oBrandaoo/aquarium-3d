import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { cameraRelativeDirection } from './movement.js';
import { createAquariumAudio } from './ambientAudio.js';
import { captureAquariumPhoto } from './photoCapture.js';
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
const habitatEntries = document.querySelector('#habitatEntries');
const photoEntries = document.querySelector('#photoEntries');
const photoButton = document.querySelector('#photoButton');
const photoDialog = document.querySelector('#photoDialog');
const photoToast = document.querySelector('#photoToast');
const photoFlash = document.querySelector('#photoFlash');
const sonarReadout = document.querySelector('#sonarReadout');
const sonarArrow = document.querySelector('#sonarArrow');
const sonarText = document.querySelector('#sonarText');
const glassNotice = document.querySelector('#glassNotice');
const poiPrompt = document.querySelector('#poiPrompt');
const poiDialog = document.querySelector('#poiDialog');
const audioButton = document.querySelector('#audioButton');
const helpDialog = document.querySelector('#helpDialog');
const mobileControls = document.querySelector('#mobileControls');
const playFooter = document.querySelector('#playFooter');
const crosshair = document.querySelector('#crosshair');
const isTouch = matchMedia('(pointer: coarse)').matches;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fishData = [
  { name: 'Sargento', short: 'Sargento', scientific: 'Abudefduf saxatilis', place: 'Litoral brasileiro e ilhas oceânicas', habitat: 'Recifes rasos, costões rochosos e áreas próximas à areia.', trait: 'Corpo prateado com dorso amarelado e cinco barras pretas.', behavior: 'Patrulha lentamente uma faixa do recife e acelera a cauda quando você se aproxima.', source: 'https://www.floridamuseum.ufl.edu/discover-fish/species-profiles/sergeant-major/', color: '#e7d786', accent: '#c8c786', type: 'sergeant', body: [.79, .55, .23], at: [0, 1.35, 3.5], size: .91, yaw: -.4 },
  { name: 'Borboleta-listrada', short: 'Borboleta', scientific: 'Chaetodon striatus', place: 'Litoral até o Sudeste e ilhas oceânicas brasileiras', habitat: 'Recifes de coral e costões rochosos.', trait: 'Corpo alto e fino, bege, com quatro barras pretas e estrias delicadas.', behavior: 'Fica perto dos corais e recua para um abrigo ao perceber um nadador.', source: 'https://www.gov.br/ibama/pt-br/phocadownload/peixesornamentais/2008/guia-para-identificao-de-peixes-ornamentais-marinhos-ibama.pdf', color: '#e9ddad', accent: '#e9d89a', type: 'butterfly', body: [.66, .72, .17], at: [-8, .9, -6], size: .84, yaw: .8 },
  { name: 'Cirurgião-azul', short: 'Cirurgião', scientific: 'Acanthurus coeruleus', place: 'Costa brasileira até São Paulo e ilhas oceânicas', habitat: 'Recifes e áreas rochosas onde pasta algas.', trait: 'Adulto azul intenso, corpo achatado e espinho claro na base da cauda.', behavior: 'Passeia entre manchas de algas e inclina a cabeça como se estivesse pastando.', source: 'https://www.gov.br/ibama/pt-br/phocadownload/peixesornamentais/2008/guia-para-identificao-de-peixes-ornamentais-marinhos-ibama.pdf', color: '#2876c7', accent: '#1b4d96', type: 'tang', body: [.9, .53, .19], at: [8.4, 1.8, -7.5], size: 1.02, yaw: 2.6 },
  { name: 'Peixe-frade', short: 'Frade', scientific: 'Pomacanthus paru', place: 'Recifes e costões do litoral brasileiro', habitat: 'Áreas recifais com fendas e abrigo entre corais.', trait: 'Corpo escuro com bordas douradas nas escamas e nadadeiras altas.', behavior: 'Desliza entre rochas e desce para a sombra quando alguém chega perto.', source: 'https://www.floridamuseum.ufl.edu/discover-fish/species-profiles/french-angelfish/', color: '#c9aa5a', accent: '#bca04d', type: 'angelfish', body: [.71, .72, .18], at: [-9.2, 3.2, 7.1], size: .95, yaw: -1.3 },
  { name: 'Salema', short: 'Salema', scientific: 'Anisotremus virginicus', place: 'Litoral brasileiro, inclusive Sergipe e Santa Catarina', habitat: 'Fundos rochosos e coralinos do litoral.', trait: 'Corpo prateado com faixas amarelas horizontais e duas barras pretas na cabeça.', behavior: 'Cruza a borda rochosa em pequenos trajetos e vira antes de se afastar demais.', source: 'https://faep.eng.br/arquivos/ebooks/catalogo_de_pescados_de_sergipe_e_adjacencias.pdf', color: '#e9d895', accent: '#f2c951', type: 'porkfish', body: [.91, .49, .22], at: [9, .6, 7.2], size: .94, yaw: 1.8 },
];
const habitatData = [
  { title: 'Chapeirões de Abrolhos', region: 'Banco dos Abrolhos · Bahia', kind: 'Recife de coral', description: 'O Parque Nacional Marinho dos Abrolhos protege parte do maior complexo recifal do Atlântico Sul. Os chapeirões são formações características da região e oferecem espaço para muitos peixes recifais.', source: 'https://www.gov.br/icmbio/pt-br/assuntos/unidade-de-conservacao/unidades-de-biomas/marinho/lista-de-ucs/parna-marinho-dos-abrolhos/pesquisa-e-monitoramento/pesquisa-e-monitoramento', color: '#d791a0', at: [-2.7, -2.35, 7.9], type: 'coral' },
  { title: 'Costão rochoso', region: 'Litoral brasileiro', kind: 'Rochas submersas', description: 'Nos costões, rochas firmes servem de superfície para algas e invertebrados. A parte submersa reúne uma grande variedade de animais marinhos e pequenos refúgios entre as fendas.', source: 'https://www.gov.br/icmbio/pt-br/centrais-de-conteudo/manualecossistemasmarinhosecosteiros3-pdf', color: '#a4b8cd', at: [8.7, -2.35, 9.2], type: 'rock' },
  { title: 'Costa das Algas', region: 'Serra, Fundão e Aracruz · Espírito Santo', kind: 'Bancos de algas', description: 'A APA Costa das Algas protege um mosaico de recifes e costões rochosos, com bancos e pradarias de algas marinhas. Esse fundo variado sustenta diferentes formas de vida costeira.', source: 'https://www.gov.br/icmbio/pt-br/assuntos/unidade-de-conservacao/unidades-de-biomas/marinho/lista-de-ucs/apa-costa-das-algas/area-protegida-2013-saiba-mais-sobre-a-apa/sobre-a-unidade-de-conservacao-uc-federal-area-de-protecao-ambiental-apa-costa-das-algas', color: '#8bd5aa', at: [8.2, -2.35, -6.9], type: 'algae' },
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
const pushDirection = new THREE.Vector3();

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
    uniforms: { glassColor: { value: new THREE.Color('#60b7c6') }, proximity: { value: 0 } },
    vertexShader: 'varying vec3 vNormal; varying vec3 vEye; void main(){ vec4 world = modelMatrix * vec4(position,1.0); vNormal = normalize(mat3(modelMatrix) * normal); vEye = normalize(cameraPosition - world.xyz); gl_Position = projectionMatrix * viewMatrix * world; }',
    fragmentShader: 'uniform vec3 glassColor; uniform float proximity; varying vec3 vNormal; varying vec3 vEye; void main(){ vec3 normal = normalize(vNormal); vec3 eye = normalize(vEye); float edge = pow(1.0 - abs(dot(normal, eye)), 2.0); float reflection = pow(max(dot(reflect(-eye, normal), normalize(vec3(-0.4, 0.8, 0.3))), 0.0), 10.0); gl_FragColor = vec4(glassColor + vec3(0.2, 0.34, 0.32) * reflection, 0.035 + edge * 0.22 + reflection * 0.11 + proximity * 0.075); }',
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
const glassRipple = new THREE.Mesh(
  new THREE.RingGeometry(.85, 1, 64),
  new THREE.MeshBasicMaterial({ color: '#c2f9ed', transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }),
);
glassRipple.visible = false;
glassRipple.renderOrder = 6;
scene.add(glassRipple);
const glassNormal = new THREE.Vector3();
const glassAxis = new THREE.Vector3(0, 0, 1);
let glassRippleAge = 100;
let glassNoticeAge = 100;
let touchingGlass = false;
function domeInteriorRadiusAt(y) {
  const normalizedHeight = (y - domeBase) / domeHeightScale;
  return Math.sqrt(Math.max(0, domeRadius ** 2 - normalizedHeight ** 2)) - .72;
}

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

const habitatPoints = habitatData.map((data, index) => {
  const group = new THREE.Group();
  group.position.set(...data.at);
  const markerMaterial = mat(data.color, { emissive: data.color, emissiveIntensity: 1.7, metalness: .18, roughness: .3 });
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(.28, .38, .12, 8), mat('#214556', { metalness: .25 }));
  foot.position.y = .08; group.add(foot);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(.026, .045, 1.93, 6), mat('#72aab0', { emissive: '#277b83', emissiveIntensity: .65 }));
  stem.position.y = 1.08; group.add(stem);
  const beacon = new THREE.Mesh(new THREE.OctahedronGeometry(.19), markerMaterial);
  beacon.position.y = 2.13; group.add(beacon);
  const halo = new THREE.Mesh(new THREE.TorusGeometry(.43, .014, 6, 40), new THREE.MeshBasicMaterial({ color: data.color, transparent: true, opacity: .66, depthWrite: false }));
  halo.rotation.x = Math.PI / 2;
  halo.position.y = 2.13; group.add(halo);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowMap, color: data.color, transparent: true, opacity: .3, depthWrite: false, blending: THREE.AdditiveBlending }));
  glow.position.y = 2.13; glow.scale.set(2.5, 2.5, 1); group.add(glow);
  scene.add(group);
  if (data.type === 'coral') {
    for (let i = 0; i < 4; i++) {
      const coral = new THREE.Group();
      const angle = i * Math.PI / 2;
      coral.position.set(Math.cos(angle) * .95, 0, Math.sin(angle) * .95);
      const material = coralMaterials[i % coralMaterials.length];
      const height = .8 + i * .17;
      branch(coral, [0, 0, 0], [0, height, 0], .085, material);
      branch(coral, [0, height * .5, 0], [.4, height * .9, .2], .045, material);
      branch(coral, [0, height * .55, 0], [-.3, height * 1.08, -.2], .043, material);
      group.add(coral);
    }
  } else if (data.type === 'rock') {
    for (let i = 0; i < 5; i++) {
      const angle = i * Math.PI * .4;
      const rock = new THREE.Mesh(rockGeo, rockMats[i % rockMats.length]);
      rock.position.set(Math.cos(angle) * 1.05, .42, Math.sin(angle) * .95);
      rock.scale.set(.7 + i * .09, .5 + i * .08, .7);
      rock.rotation.y = angle; group.add(rock);
    }
  } else {
    for (let i = 0; i < 8; i++) {
      const angle = i * Math.PI / 4;
      addPlant(data.at[0] + Math.cos(angle) * (1 + i % 2 * .35), data.at[2] + Math.sin(angle) * (1 + i % 2 * .35), 1.15 + i % 3 * .35, i);
    }
  }
  return { data, index, group, halo, beacon, focus: new THREE.Vector3(data.at[0], data.at[1] + 2.13, data.at[2]), visited: false };
});
const aquariumAudio = createAquariumAudio(camera, habitatPoints.map(point => point.beacon));
if (!aquariumAudio.supported) {
  audioButton.disabled = true;
  audioButton.title = 'Som indisponível neste navegador';
}

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
let activePoi = null;
let returnToJournal = false;
let returnPoiToJournal = false;
let activeJournalTab = 'fish';
let photoToastAge = 100;
let photoFlashAge = 100;
const photos = Array(fish.length).fill(null);
const progressKey = 'aquario-noturno-progress-v1';
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
  journalButton.hidden = false; audioButton.hidden = false; photoButton.hidden = false;
  if (isTouch) mobileControls.hidden = false;
  else canvas.requestPointerLock?.();
}
function look(dx, dy) {
  yaw -= dx * .00235;
  pitch = THREE.MathUtils.clamp(pitch - dy * .0021, -1.32, 1.32);
  camera.rotation.set(pitch, yaw, 0);
}
function emitPulse() {
  if (!active || speciesDialog.open || journalDialog.open || helpDialog.open || poiDialog.open || photoDialog.open) return;
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
function toggleAudio() {
  if (!active || !aquariumAudio.supported) return;
  const enabled = aquariumAudio.toggle();
  audioButton.setAttribute('aria-pressed', String(enabled));
  audioButton.setAttribute('aria-label', enabled ? 'Desativar som ambiente' : 'Ativar som ambiente');
  audioButton.title = enabled ? 'Desativar som ambiente (M)' : 'Ativar som ambiente (M)';
}
function updateFoundRow(item) {
  const row = document.querySelector(`#fish-${item.index}`);
  row.classList.add('found'); row.disabled = false;
  row.setAttribute('aria-label', `${item.data.name}: abrir ficha`);
  row.querySelector('small').textContent = 'ver ficha';
}
function updateProgressUi() {
  foundTotal = fish.filter(item => item.found).length;
  foundCount.textContent = foundTotal;
  document.querySelector('#journalCount').textContent = `${foundTotal} / ${fish.length}`;
  document.querySelector('#habitatCount').textContent = `${habitatPoints.filter(point => point.visited).length} / ${habitatPoints.length}`;
  document.querySelector('#photoCount').textContent = `${photos.filter(Boolean).length} / ${fish.length}`;
  if (foundTotal === fish.length && habitatPoints.every(point => point.visited) && photos.every(Boolean)) {
    distanceLabel.textContent = 'Expedição completa — veja seu diário';
  }
}
function saveProgress() {
  try {
    localStorage.setItem(progressKey, JSON.stringify({
      version: 1,
      found: fish.filter(item => item.found).map(item => item.index),
      habitats: habitatPoints.filter(point => point.visited).map(point => point.index),
      photos,
    }));
    return true;
  } catch {
    return false;
  }
}
function restoreProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(progressKey));
    if (saved?.version !== 1) return;
    for (const index of saved.found ?? []) {
      if (fish[index]) { fish[index].found = true; updateFoundRow(fish[index]); }
    }
    for (const index of saved.habitats ?? []) {
      if (habitatPoints[index]) habitatPoints[index].visited = true;
    }
    for (let i = 0; i < fish.length; i++) {
      const photo = saved.photos?.[i];
      if (photo && typeof photo.image === 'string' && photo.image.length < 1000000 && /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(photo.image)) {
        photos[i] = { image: photo.image, takenAt: Number(photo.takenAt) || Date.now() };
        fish[i].found = true;
        updateFoundRow(fish[i]);
      }
    }
    lastFound = fish.filter(item => item.found).at(-1) ?? null;
    updateProgressUi();
  } catch {
    // The aquarium remains usable when storage is unavailable or outdated.
  }
}
function openPoi(point = activePoi, fromJournal = false) {
  if (!active || !point || speciesDialog.open || (journalDialog.open && !fromJournal) || helpDialog.open || poiDialog.open || photoDialog.open) return;
  returnPoiToJournal = fromJournal;
  if (journalDialog.open) journalDialog.close();
  document.exitPointerLock?.();
  if (!point.visited) { point.visited = true; updateProgressUi(); saveProgress(); }
  document.querySelector('#poiBackToJournal').hidden = !fromJournal;
  document.querySelector('#poiKicker').textContent = point.data.kind;
  document.querySelector('#poiTitle').textContent = point.data.title;
  document.querySelector('#poiRegion').textContent = point.data.region;
  document.querySelector('#poiDescription').textContent = point.data.description;
  document.querySelector('#poiSource').href = point.data.source;
  poiDialog.showModal();
}
function renderJournal() {
  journalEntries.innerHTML = fish.map(item => `<button class="journal-entry ${item.found ? 'is-found' : ''}" type="button" data-fish="${item.index}" ${item.found ? '' : 'disabled'}><span class="journal-entry-mark" style="--fish-color:${item.data.color}">${item.found ? '✳' : '○'}</span><span><strong>${item.found ? item.data.name : 'Espécie por encontrar'}</strong><small>${item.found ? item.data.scientific : 'Explore a redoma para revelar'}</small></span><span class="journal-entry-arrow">${item.found ? '↗' : '—'}</span></button>`).join('');
  habitatEntries.innerHTML = habitatPoints.map(point => `<button class="journal-entry ${point.visited ? 'is-found' : ''}" type="button" data-habitat="${point.index}" ${point.visited ? '' : 'disabled'}><span class="journal-entry-mark" style="--fish-color:${point.data.color}">${point.visited ? '✳' : '○'}</span><span><strong>${point.data.title}</strong><small>${point.visited ? point.data.region : 'por visitar'}</small></span><span class="journal-entry-arrow">${point.visited ? '↗' : '—'}</span></button>`).join('');
  photoEntries.innerHTML = fish.map(item => {
    const photo = photos[item.index];
    return `<button class="photo-entry ${photo ? 'has-photo' : ''}" type="button" data-photo="${item.index}" ${photo ? '' : 'disabled'} aria-label="${photo ? `Ver fotografia de ${item.data.name}` : `Fotografia de ${item.data.name} por registrar`}"><span class="photo-thumb">${photo ? `<img src="${photo.image}" alt="">` : '▣'}</span><span>${item.data.short}</span></button>`;
  }).join('');
  document.querySelector('#journalProgress').innerHTML = `<div><strong>${foundTotal}/${fish.length}</strong><span>peixes</span></div><div><strong>${habitatPoints.filter(point => point.visited).length}/${habitatPoints.length}</strong><span>habitats</span></div><div><strong>${photos.filter(Boolean).length}/${fish.length}</strong><span>fotos</span></div>`;
  document.querySelector('#journalCompletion').hidden = !(foundTotal === fish.length && habitatPoints.every(point => point.visited) && photos.every(Boolean));
}
function setJournalTab(tab) {
  if (!['fish', 'habitats', 'photos'].includes(tab)) return;
  activeJournalTab = tab;
  document.querySelector('#journalFishPanel').hidden = tab !== 'fish';
  document.querySelector('#journalHabitatsPanel').hidden = tab !== 'habitats';
  document.querySelector('#journalPhotosPanel').hidden = tab !== 'photos';
  document.querySelectorAll('[data-journal-tab]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.journalTab === tab)));
  journalDialog.scrollTop = 0;
}
function openJournal() {
  if (!active || speciesDialog.open || helpDialog.open || poiDialog.open || photoDialog.open) return;
  document.exitPointerLock?.();
  renderJournal();
  setJournalTab(activeJournalTab);
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
  document.querySelector('#speciesBehavior').textContent = item.data.behavior;
  document.querySelector('#speciesSource').href = item.data.source;
  speciesDialog.showModal();
}
function discover(item) {
  if (item.found) return;
  item.found = true;
  lastFound = item;
  updateFoundRow(item);
  updateProgressUi();
  saveProgress();
  openSpecies(item, true);
  if (foundTotal === fish.length) {
    distanceLabel.textContent = 'Todos encontrados — o aquário é seu para explorar';
  }
}
function fishAt(clientX, clientY) {
  pointer.set(clientX / innerWidth * 2 - 1, -(clientY / innerHeight) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(fish.map(item => item.group), true);
  if (!hits.length) return null;
  let object = hits[0].object;
  while (object && object.userData.fishIndex === undefined) object = object.parent;
  return object ? fish[object.userData.fishIndex] : null;
}
function showPhotoToast(message) {
  photoToast.textContent = message;
  photoToast.hidden = false;
  photoToastAge = 0;
}
function takePhoto() {
  if (!active || speciesDialog.open || journalDialog.open || helpDialog.open || poiDialog.open || photoDialog.open) return;
  const item = fishAt(innerWidth / 2, innerHeight / 2);
  if (!item) { showPhotoToast('Mire em um peixe para fotografar'); return; }
  const distance = camera.position.distanceTo(item.group.position);
  if (distance > 8) { showPhotoToast('Aproxime-se do peixe para fotografar'); return; }
  if (distance < 1.2) { showPhotoToast('Afaste-se um pouco para enquadrar o peixe'); return; }
  try {
    photos[item.index] = { image: captureAquariumPhoto(renderer, scene, camera), takenAt: Date.now() };
    photoFlashAge = 0;
    photoFlash.hidden = false;
    updateProgressUi();
    const saved = saveProgress();
    showPhotoToast(`Fotografia de ${item.data.name} registrada${saved ? '' : ' nesta sessão'}`);
    if (!item.found) discover(item);
  } catch (error) {
    console.warn('Falha ao fotografar a cena:', error);
    showPhotoToast('Não foi possível salvar a fotografia');
  }
}
function openPhoto(index) {
  const photo = photos[index];
  if (!active || !photo || !journalDialog.open) return;
  journalDialog.close();
  const name = fish[index].data.name;
  document.querySelector('#photoTitle').textContent = name;
  const preview = document.querySelector('#photoPreview');
  preview.src = photo.image;
  preview.alt = `Fotografia do peixe ${name} na redoma`;
  document.querySelector('#photoCaption').textContent = `Registrada em ${new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(photo.takenAt)}`;
  const download = document.querySelector('#photoDownload');
  download.href = photo.image;
  download.download = `aquario-noturno-peixe-${index + 1}.jpg`;
  photoDialog.showModal();
}
restoreProgress();
document.querySelector('#startButton').addEventListener('click', start);
document.querySelector('#pulseButton').addEventListener('click', emitPulse);
document.querySelector('#mobilePulse').addEventListener('click', emitPulse);
document.querySelector('#lanternButton').addEventListener('click', toggleLantern);
document.querySelector('#mobileLantern').addEventListener('click', toggleLantern);
audioButton.addEventListener('click', toggleAudio);
photoButton.addEventListener('click', takePhoto);
document.querySelector('#closePhoto').addEventListener('click', () => photoDialog.close());
document.querySelector('#backPhotoJournal').addEventListener('click', () => photoDialog.close());
photoDialog.addEventListener('click', e => { if (e.target === photoDialog) photoDialog.close(); });
photoDialog.addEventListener('close', () => openJournal());
document.querySelector('#inspectPoiButton').addEventListener('click', () => openPoi());
document.querySelector('#closePoi').addEventListener('click', () => poiDialog.close());
document.querySelector('#resumePoi').addEventListener('click', () => poiDialog.close());
document.querySelector('#poiBackToJournal').addEventListener('click', () => poiDialog.close());
poiDialog.addEventListener('click', e => { if (e.target === poiDialog) poiDialog.close(); });
poiDialog.addEventListener('close', () => {
  if (returnPoiToJournal) { returnPoiToJournal = false; openJournal(); }
  else if (active && !isTouch) canvas.requestPointerLock?.();
});
journalButton.addEventListener('click', openJournal);
document.querySelector('.journal-tabs').addEventListener('click', e => {
  const button = e.target.closest('button[data-journal-tab]');
  if (button) setJournalTab(button.dataset.journalTab);
});
journalEntries.addEventListener('click', e => {
  const entry = e.target.closest('button[data-fish]');
  if (entry && !entry.disabled) openSpecies(fish[Number(entry.dataset.fish)], false, true);
});
habitatEntries.addEventListener('click', e => {
  const entry = e.target.closest('button[data-habitat]');
  if (entry && !entry.disabled) openPoi(habitatPoints[Number(entry.dataset.habitat)], true);
});
photoEntries.addEventListener('click', e => {
  const entry = e.target.closest('button[data-photo]');
  if (entry && !entry.disabled) openPhoto(Number(entry.dataset.photo));
});
document.querySelector('#closeJournal').addEventListener('click', () => journalDialog.close());
document.querySelector('#resumeJournal').addEventListener('click', () => journalDialog.close());
journalDialog.addEventListener('click', e => { if (e.target === journalDialog) journalDialog.close(); });
journalDialog.addEventListener('close', () => { if (active && !isTouch && !speciesDialog.open && !poiDialog.open && !photoDialog.open) canvas.requestPointerLock?.(); });
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
  const item = fishAt(clientX, clientY);
  if (!item) return;
  if (item.found) openSpecies(item);
  else distanceLabel.textContent = 'Aproxime-se deste peixe para registrá-lo';
}
canvas.addEventListener('click', e => {
  if (!active || isTouch || speciesDialog.open || journalDialog.open || helpDialog.open || poiDialog.open || photoDialog.open) return;
  if (document.pointerLockElement !== canvas) canvas.requestPointerLock?.();
  else selectFish(innerWidth / 2, innerHeight / 2);
});
document.addEventListener('mousemove', e => { if (active && document.pointerLockElement === canvas && !helpDialog.open) look(e.movementX, e.movementY); });
document.addEventListener('keydown', e => {
  const key = e.key.toLowerCase();
  if (key === 'g' && active && !e.repeat && !speciesDialog.open && !helpDialog.open && !poiDialog.open && !photoDialog.open) {
    e.preventDefault();
    if (journalDialog.open) journalDialog.close(); else openJournal();
    return;
  }
  if (helpDialog.open || speciesDialog.open || journalDialog.open || poiDialog.open || photoDialog.open) return;
  if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'control', 'e', 'f', 'l', 'm', 'r', 'p'].includes(key)) e.preventDefault();
  pressed.add(key);
  if (key === 'e' && !e.repeat) emitPulse();
  if (key === 'f' && !e.repeat && lastFound) openSpecies(lastFound);
  if (key === 'l' && !e.repeat) toggleLantern();
  if (key === 'm' && !e.repeat) toggleAudio();
  if (key === 'r' && !e.repeat) openPoi();
  if (key === 'p' && !e.repeat) takePhoto();
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
  if (!active || helpDialog.open || speciesDialog.open || journalDialog.open || poiDialog.open || photoDialog.open) return;
  const forward = (pressed.has('w') || pressed.has('arrowup') ? 1 : 0) - (pressed.has('s') || pressed.has('arrowdown') ? 1 : 0) - stick.y;
  const side = (pressed.has('d') || pressed.has('arrowright') ? 1 : 0) - (pressed.has('a') || pressed.has('arrowleft') ? 1 : 0) + stick.x;
  const up = (pressed.has(' ') || verticalButtons.up ? 1 : 0) - (pressed.has('control') || verticalButtons.down ? 1 : 0);
  cameraRelativeDirection(camera, forward, side, up, playerDirection);
  const speed = pressed.has('shift') ? 6.4 : 3.8;
  targetVelocity.copy(playerDirection).multiplyScalar(speed);
  playerVelocity.lerp(targetVelocity, 1 - Math.exp(-dt * 4.6));
  camera.position.addScaledVector(playerVelocity, dt);
  camera.position.y = THREE.MathUtils.clamp(camera.position.y, -1.35, 6.25);
  const maxRadius = domeInteriorRadiusAt(camera.position.y);
  const radius = Math.hypot(camera.position.x, camera.position.z);
  if (radius > maxRadius) {
    camera.position.x *= maxRadius / radius;
    camera.position.z *= maxRadius / radius;
    pushDirection.set(camera.position.x, 0, camera.position.z).normalize();
    const outwardSpeed = playerVelocity.dot(pushDirection);
    if (outwardSpeed > 0) playerVelocity.addScaledVector(pushDirection, -outwardSpeed);
    if (!touchingGlass && outwardSpeed > .35) {
      const hitRadius = maxRadius + .72;
      glassNormal.set(pushDirection.x * hitRadius, (camera.position.y - domeBase) / (domeHeightScale ** 2), pushDirection.z * hitRadius).normalize();
      glassRipple.position.set(pushDirection.x * hitRadius, camera.position.y, pushDirection.z * hitRadius).addScaledVector(glassNormal, -.08);
      glassRipple.quaternion.setFromUnitVectors(glassAxis, glassNormal);
      glassRippleAge = 0;
      glassNoticeAge = 0;
      glassNotice.hidden = false;
      if (isTouch) navigator.vibrate?.(18);
    }
    touchingGlass = true;
  } else if (radius < maxRadius - .4) {
    touchingGlass = false;
  }
}
function fishHome(item, distance, time, target, motion) {
  target.copy(item.anchor);
  const near = THREE.MathUtils.clamp((4.7 - distance) / 2.8, 0, 1);
  const drift = motion;
  switch (item.data.type) {
    case 'sergeant':
      target.x += Math.sin(time * .75) * .4 * drift;
      target.z += Math.cos(time * .75) * .23 * drift;
      target.y += Math.sin(time * 1.1) * .07 * drift;
      break;
    case 'butterfly':
      target.x += Math.sin(time * .55 + item.phase) * .16 * drift - near * .55;
      target.z -= near * .32;
      target.y -= near * .2;
      break;
    case 'tang':
      target.x += Math.sin(time * .36 + item.phase) * .58 * drift;
      target.z += Math.cos(time * .36 + item.phase) * .36 * drift;
      target.y -= (.11 + Math.sin(time * 1.25) * .08) * drift;
      break;
    case 'angelfish':
      target.x += Math.sin(time * .3 + item.phase) * .23 * drift - near * .3;
      target.y -= near * .68;
      target.z += near * .2;
      break;
    default:
      target.x += Math.sin(time * .6 + item.phase) * .52 * drift;
      target.z += Math.cos(time * .6 + item.phase) * .3 * drift;
      target.y += Math.sin(time * .9) * .06 * drift;
  }
  return target;
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
  for (const point of habitatPoints) {
    point.beacon.rotation.y += dt * .28 * motion;
    point.halo.scale.setScalar(1 + Math.sin(elapsed * 1.8 + point.index) * .08 * motion);
  }
  activePoi = null;
  let poiDistance = 4.1;
  for (const point of habitatPoints) {
    const distance = camera.position.distanceTo(point.focus);
    if (distance < poiDistance) { activePoi = point; poiDistance = distance; }
  }
  poiPrompt.hidden = !active || !activePoi || speciesDialog.open || journalDialog.open || helpDialog.open || poiDialog.open || photoDialog.open;
  if (!poiPrompt.hidden) document.querySelector('#poiPromptTitle').textContent = activePoi.data.title;
  nearest = null;
  let nearestDistance = Infinity;
  for (const item of fish) {
    const distance = camera.position.distanceTo(item.group.position);
    if (!item.found && distance < nearestDistance) { nearest = item; nearestDistance = distance; }
    if (active && !speciesDialog.open && !journalDialog.open && !helpDialog.open && !poiDialog.open && !photoDialog.open && distance < 2.2) discover(item);
    // Each fish remains attached to a point by a damped spring. A swimmer passing
    // nearby pushes it away gently, then it settles back into its resting place.
    const home = fishHome(item, distance, elapsed, tmp, motion).sub(item.group.position);
    item.velocity.addScaledVector(home, 4.8 * dt);
    item.velocity.addScaledVector(item.velocity, -Math.min(.99, 3.1 * dt));
    if (active && distance < 3.4 && distance > .01) {
      pushDirection.copy(item.group.position).sub(camera.position).normalize();
      const response = item.data.type === 'sergeant' ? .47 : item.data.type === 'angelfish' ? 1.15 : .9;
      item.velocity.addScaledVector(pushDirection, (3.4 - distance) * response * dt);
    }
    item.group.position.addScaledVector(item.velocity, dt);
    item.group.position.y += Math.sin(elapsed * 1.1 + item.phase) * .0019 * motion;
    item.group.rotation.y = item.data.yaw + Math.sin(elapsed * .7 + item.phase) * .13 * motion + item.velocity.x * .09;
    const grazing = item.data.type === 'tang' ? Math.max(0, Math.sin(elapsed * 1.25 + item.phase)) : 0;
    item.group.rotation.z = Math.sin(elapsed * 1.3 + item.phase) * .045 * motion - grazing * .13 * motion;
    const tailRate = item.data.type === 'butterfly' ? 5.2 : item.data.type === 'porkfish' ? 4.8 : 4;
    item.tailPivot.rotation.y = Math.sin(elapsed * tailRate + item.phase) * (.2 + Math.min(1, item.velocity.length()) * .12) * motion;
    item.pectoralFins.forEach((fin, side) => { fin.rotation.y = (side ? 1 : -1) * (.28 + Math.sin(elapsed * 5 + item.phase) * .18 * motion); });
    item.aura.rotation.z = elapsed * .15 * motion;
    item.aura.material.opacity = pulseAge < 2.5 ? .22 * (1 - pulseAge / 2.5) : 0;
    item.glow.material.opacity = .06 + (pulseAge < 2.5 ? .2 * (1 - pulseAge / 2.5) : 0);
  }
  if (active && foundTotal !== fish.length && nearest && pulseAge > 4) {
    distanceLabel.textContent = nearestDistance < 5 ? `Uma luz está a ${Math.ceil(nearestDistance)} m` : 'Explore a água';
  }
  sonarReadout.hidden = !active || !nearest || pulseAge > 4 || speciesDialog.open || journalDialog.open || helpDialog.open || poiDialog.open || photoDialog.open;
  if (!sonarReadout.hidden) {
    const dx = nearest.group.position.x - camera.position.x;
    const dz = nearest.group.position.z - camera.position.z;
    sonarArrow.style.transform = `rotate(${Math.atan2(dx, -dz) + yaw}rad)`;
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
  glassRippleAge += dt;
  glassNoticeAge += dt;
  glassNotice.hidden = glassNoticeAge > 1.6;
  photoToastAge += dt;
  photoToast.hidden = photoToastAge > 2.8 || photoDialog.open || journalDialog.open || speciesDialog.open || poiDialog.open || helpDialog.open;
  photoFlashAge += dt;
  photoFlash.hidden = photoFlashAge > .18;
  if (glassRippleAge < 1.05) {
    glassRipple.visible = true;
    glassRipple.scale.setScalar(.22 + glassRippleAge * 1.9);
    glassRipple.material.opacity = .62 * (1 - glassRippleAge / 1.05);
  } else glassRipple.visible = false;
  const glassGap = domeInteriorRadiusAt(camera.position.y) - Math.hypot(camera.position.x, camera.position.z);
  const proximity = THREE.MathUtils.clamp(1 - glassGap / 2.1, 0, 1);
  dome.material.uniforms.proximity.value = THREE.MathUtils.lerp(dome.material.uniforms.proximity.value, proximity, 1 - Math.exp(-dt * 4));
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
  aquariumAudio.dispose();
  renderer.dispose();
});
