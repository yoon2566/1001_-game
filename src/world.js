/* Procedural warehouse scene. No network, image files, or model assets required. */
function createWarehouseWorld(THREE, scene) {
  const root = new THREE.Group();
  root.name = 'warehouse-world';
  scene.add(root);
  const obstacles = [];
  const fires = [{ x: 0, z: -10, r: 2.75 }, { x: -8.2, z: -11, r: 2.45 }, { x: 11.8, z: -18, r: 1.9 }];
  const smokeZones = [{ x: 0, z: -6, w: 20, d: 4.2 }];
  const alarm = { x: -2.5, z: 14, active: false };
  const exit = { x: 0, z: -22 };
  const assembly = { x: 0, z: -27 };
  const assets = new Set();
  const palette = {
    concrete: 0x384752, floor: 0x44545e, steel: 0x162b39,
    lightSteel: 0x637782, orange: 0xf6a13c, yellow: 0xf3c35e,
    cardboard: 0xb88a56, cardboardLight: 0xd5aa73, cardboardDark: 0x98744d,
    teal: 0x5ef0c0, white: 0xd6e4e7, red: 0xe9473f
  };
  function material(color, extra) {
    const m = new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.83, metalness: 0.08 }, extra));
    assets.add(m); return m;
  }
  const mats = {};
  Object.keys(palette).forEach(k => { mats[k] = material(palette[k]); });
  mats.tealGlow = material(palette.teal, { emissive: palette.teal, emissiveIntensity: 0.65 });
  mats.yellowGlow = material(palette.yellow, { emissive: palette.yellow, emissiveIntensity: 0.28 });
  mats.redGlow = material(palette.red, { emissive: palette.red, emissiveIntensity: 0.65 });
  mats.dark = material(0x0e1b25);
  const cube = new THREE.BoxGeometry(1, 1, 1); assets.add(cube);
  const batchMap = new Map();
  const dummy = new THREE.Object3D();
  function block(x, y, z, w, h, d, mat, ry = 0) {
    if (!batchMap.has(mat)) batchMap.set(mat, []);
    batchMap.get(mat).push([x, y, z, w, h, d, ry]);
  }
  function mesh(geo, mat, x, y, z) {
    assets.add(geo);
    const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); root.add(m); return m;
  }
  function collider(x, z, w, d) { obstacles.push({ x, z, w, d }); }
  function floorMark(x, z, w, d, mat, ry = 0) { block(x, 0.033, z, w, 0.022, d, mat, ry); }
  function board(text, sub, x, y, z, w, h, options = {}) {
    const canvas = document.createElement('canvas'); canvas.width = 768; canvas.height = Math.round(768 * h / w);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = options.bg || '#142a36'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = options.border || '#516875'; ctx.lineWidth = 8;
    ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = options.color || '#e4eff0';
    ctx.font = '900 ' + Math.round(canvas.height * (sub ? 0.40 : 0.49)) + 'px "Malgun Gothic", sans-serif';
    ctx.fillText(text, canvas.width / 2, canvas.height * (sub ? 0.38 : 0.52), canvas.width * 0.92);
    if (sub) {
      ctx.fillStyle = options.subColor || '#94aebb';
      ctx.font = '700 ' + Math.round(canvas.height * 0.16) + 'px "Malgun Gothic", sans-serif';
      ctx.fillText(sub, canvas.width / 2, canvas.height * 0.77, canvas.width * 0.90);
    }
    const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace; assets.add(tex);
    const mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }); assets.add(mat);
    const m = mesh(new THREE.PlaneGeometry(w, h), mat, x, y, z);
    if (options.ry) m.rotation.y = options.ry;
    if (options.flat) m.rotation.x = -Math.PI / 2;
    return m;
  }
  function arrow(x, z, colorMat, scale = 1) {
    const s = scale;
    floorMark(x, z + 0.3 * s, 0.20 * s, 1.15 * s, colorMat);
    floorMark(x - 0.25 * s, z - 0.13 * s, 0.20 * s, 0.76 * s, colorMat, -0.78);
    floorMark(x + 0.25 * s, z - 0.13 * s, 0.20 * s, 0.76 * s, colorMat, 0.78);
  }

  // Concrete shell: front and right walls are cut away for the overhead camera.
  block(0, -0.16, -1, 30.5, 0.3, 42.5, mats.floor);
  block(0, -0.20, -26.8, 30.5, 0.3, 9.3, mats.concrete);
  block(-15.2, 1.8, -1, 0.4, 3.6, 42, mats.lightSteel);
  block(15.2, 0.38, -1, 0.4, 0.76, 42, mats.lightSteel);
  block(0, 0.25, 20.2, 30.5, 0.5, 0.4, mats.lightSteel);
  block(-9.2, 1.8, -22.2, 12.1, 3.6, 0.4, mats.lightSteel);
  block(9.2, 1.8, -22.2, 12.1, 3.6, 0.4, mats.lightSteel);
  collider(-15.25, -1, 0.5, 42.5); collider(15.25, -1, 0.5, 42.5);
  collider(0, 20.25, 30.5, 0.5); collider(-9.2, -22.25, 12.1, 0.5); collider(9.2, -22.25, 12.1, 0.5);
  collider(-15.25, -27, 0.5, 10); collider(15.25, -27, 0.5, 10); collider(0, -31.5, 30.5, 0.5);
  // Corrugated wall ribs and structural columns provide a readable industrial scale.
  for (let z = -21; z <= 19; z += 2) block(-14.94, 1.85, z, 0.08, 3.35, 0.08, mats.concrete);
  for (let x = -14; x <= 14; x += 2) {
    if (Math.abs(x) > 3) block(x, 1.85, -21.95, 0.08, 3.35, 0.08, mats.concrete);
  }
  for (let z = -20; z <= 20; z += 10) {
    block(-14.75, 2.3, z, 0.45, 4.6, 0.45, mats.steel);
    block(14.75, 0.6, z, 0.45, 1.2, 0.45, mats.steel);
    block(-14.75, 0.7, z, 0.52, 1.4, 0.52, mats.orange);
  }
  // Floor expansion joints use a single line draw call.
  const gridPositions = [];
  for (let x = -15; x <= 15; x += 5) gridPositions.push(x, 0.006, -22, x, 0.006, 20);
  for (let z = -22; z <= 20; z += 6) gridPositions.push(-15, 0.006, z, 15, 0.006, z);
  const gridGeo = new THREE.BufferGeometry(); gridGeo.setAttribute('position', new THREE.Float32BufferAttribute(gridPositions, 3)); assets.add(gridGeo);
  const gridMat = new THREE.LineBasicMaterial({ color: 0x273b47, transparent: true, opacity: 0.48 }); assets.add(gridMat);
  root.add(new THREE.LineSegments(gridGeo, gridMat));
  // Marked pedestrian route with dashed edges, approach arrows, and fire caution patch.
  for (let z = 17.5; z > -20; z -= 2.2) {
    floorMark(-4.6, z, 0.085, 1.15, mats.yellow); floorMark(4.6, z, 0.085, 1.15, mats.yellow);
  }
  [16.8, 7, -2, -17.4, -24].forEach(z => arrow(0, z, z < -20 ? mats.tealGlow : mats.yellow, 1.25));
  floorMark(0, -21.5, 6, 0.15, mats.tealGlow);
  for (let x = -2.8; x <= 2.8; x += 0.7) floorMark(x, -20.7, 0.3, 0.6, mats.yellow, -0.55);

  // Rack bays. Instanced geometry keeps hundreds of boxes and beams inexpensive.
  let rackNumber = 1;
  function cardboardBox(x, y, z, w, h, d, variant) {
    const mat = [mats.cardboard, mats.cardboardLight, mats.cardboardDark][variant % 3];
    block(x, y, z, w, h, d, mat);
    block(x, y + h / 2 + 0.009, z, w * 0.13, 0.014, d + 0.006, mats.cardboardLight);
    block(x, y, z + d / 2 + 0.012, w * 0.15, h + 0.015, 0.014, mats.cardboardLight);
    if (variant % 2 === 0) block(x + w * 0.20, y + h * 0.08, z + d / 2 + 0.022, w * 0.30, h * 0.28, 0.015, mats.white);
  }
  function rack(x, z) {
    const w = 5.6, d = 4.8;
    collider(x, z, w + 0.18, d + 0.18);
    [-1, 1].forEach(sx => [-1, 1].forEach(sz => {
      block(x + sx * w / 2, 2.28, z + sz * d / 2, 0.15, 4.55, 0.15, mats.steel);
      block(x + sx * w / 2, 0.25, z + sz * d / 2, 0.3, 0.5, 0.3, mats.orange);
    }));
    [0.28, 1.67, 3.06].forEach((level, li) => {
      block(x, level, z, w, 0.10, d, mats.lightSteel);
      [-1, 1].forEach(sz => block(x, level + 0.055, z + sz * d / 2, w + 0.10, 0.22, 0.12, mats.orange));
      [-1, 1].forEach(sx => block(x + sx * w / 2, level, z, 0.1, 0.16, d, mats.steel));
      for (let col = 0; col < 4; col++) {
        for (let row = 0; row < 2; row++) {
          if (li === 2 && (col + row + rackNumber) % 4 === 0) continue;
          const h = 0.77 + ((col + row + li) % 3) * 0.12;
          cardboardBox(x - 2.05 + col * 1.37, level + 0.11 + h / 2, z - 1.12 + row * 2.25, 1.15, h, 1.67, col + row + li + rackNumber);
        }
      }
    });
    board((x < 0 ? 'A' : 'B') + String(rackNumber).padStart(2, '0'), 'STORAGE · HUB', x, 4.05, z + d / 2 + 0.1, 2, 0.66, { bg: '#152b39', color: '#f6c16c' });
    rackNumber++;
  }
  [10, 0, -11].forEach(z => { rack(-8.2, z); rack(8.2, z); });

  // An idle conveyor and parked forklift sit outside the main pedestrian path.
  collider(12.7, 5.5, 1.7, 6.2);
  block(12.7, 0.92, 5.5, 1.55, 0.22, 6.1, mats.steel);
  block(12.7, 1.05, 5.5, 1.35, 0.08, 5.95, mats.dark);
  for (let z = 2.65; z <= 8.35; z += 0.4) block(12.7, 1.1, z, 1.45, 0.06, 0.13, mats.lightSteel);
  [-1, 1].forEach(s => { block(12.7 + s * 0.8, 1.15, 5.5, 0.08, 0.18, 6.2, mats.orange); [3, 8].forEach(z => block(12.7 + s * 0.5, 0.42, z, 0.14, 0.85, 0.14, mats.steel)); });
  collider(-12.45, -17, 2.6, 3.5);
  block(-12.4, 0.6, -17, 1.8, 0.8, 2.5, mats.yellow);
  block(-12.4, 1.05, -16.2, 1.7, 0.7, 0.8, mats.orange);
  block(-12.4, 1.30, -17, 0.8, 0.45, 0.7, mats.dark);
  [-1, 1].forEach(s => {
    block(-12.4 + s * 0.75, 1.95, -16.7, 0.09, 1.8, 0.1, mats.steel);
    block(-12.4 + s * 0.60, 1.20, -18.2, 0.14, 2.2, 0.2, mats.steel);
    block(-12.4 + s * 0.60, 0.16, -18.75, 0.15, 0.14, 1.4, mats.steel);
  });
  block(-12.4, 2.85, -16.8, 1.9, 0.12, 1.7, mats.steel);
  const wheelGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.26, 10); assets.add(wheelGeo);
  [-1, 1].forEach(sx => [-1, 1].forEach(sz => { const wheel = mesh(wheelGeo, mats.dark, -12.4 + sx * 0.9, 0.34, -17 + sz * 0.85); wheel.rotation.z = Math.PI / 2; }));
  // Loose dispatch pallets and useful room identity details.
  [[12.2, 16.5], [-12.2, 16.3]].forEach((p, i) => {
    collider(p[0], p[1], 2.5, 2.4);
    block(p[0], 0.12, p[1], 2.4, 0.24, 2.3, mats.cardboardDark);
    for (let j = 0; j < 3; j++) cardboardBox(p[0] + (j % 2 - 0.5) * 1.08, 0.67 + Math.floor(j / 2) * 0.86, p[1], 1, 0.85, 1.7, i + j);
  });
  board('HUB 07', 'FULFILLMENT · TRAINING ZONE', -9, 3, -21.85, 5.6, 1.22);
  board('← 비상구', 'EXIT  ←', 8.7, 3, -21.84, 4.8, 1.08, { bg: '#0b5547', color: '#bffff0', subColor: '#bffff0', border: '#79d7b8' });

  // The alarm station can change state when gameplay sets alarm.active = true.
  block(alarm.x, 0.65, alarm.z, 0.18, 1.3, 0.18, mats.steel);
  block(alarm.x, 1.35, alarm.z, 0.68, 0.85, 0.28, mats.red);
  block(alarm.x, 1.34, alarm.z + 0.16, 0.44, 0.30, 0.05, mats.white);
  block(alarm.x, 1.34, alarm.z + 0.20, 0.25, 0.16, 0.035, mats.redGlow);
  board('화재 경보', 'FIRE ALARM', alarm.x, 2.2, alarm.z, 1.8, 0.65, { bg: '#852f2d', color: '#ffffff', subColor: '#ffddd5', border: '#e68067' });
  const alarmBeacon = mesh(new THREE.SphereGeometry(0.16, 10, 8), mats.redGlow, alarm.x, 1.94, alarm.z);
  const alarmRingMat = new THREE.MeshBasicMaterial({ color: 0xffbb62, transparent: true, opacity: 0.8, side: THREE.DoubleSide }); assets.add(alarmRingMat);
  const alarmRing = mesh(new THREE.RingGeometry(0.95, 1.01, 48), alarmRingMat, alarm.x, 0.049, alarm.z); alarmRing.rotation.x = -Math.PI / 2;
  alarm.setActivated = value => { alarm.active = value !== false; };

  // Doorway and exterior assembly point.
  [-1, 1].forEach(s => {
    block(s * 3.05, 2.4, -22, 0.22, 4.8, 0.42, mats.steel);
    block(s * 3.05, 2.3, -21.7, 0.085, 4.15, 0.06, mats.tealGlow);
    block(s * 3.3, 0.6, -22.7, 0.2, 1.2, 0.2, mats.yellow);
  });
  block(0, 4.73, -22, 6.4, 0.4, 0.55, mats.steel);
  board('↑  EXIT  비상구', 'OUTSIDE · ASSEMBLY POINT', 0, 4.1, -21.65, 4.9, 1, { bg: '#12624d', color: '#d9fff0', subColor: '#a1f6d6', border: '#65d5a7' });
  const doorLight = new THREE.PointLight(0x51f4b8, 6, 8, 2); doorLight.position.set(0, 2.6, -22); root.add(doorLight);
  const assemblyMat = new THREE.MeshBasicMaterial({ color: 0x53d7b0, transparent: true, opacity: 0.72, side: THREE.DoubleSide }); assets.add(assemblyMat);
  const assemblyRing = mesh(new THREE.RingGeometry(2.12, 2.25, 64), assemblyMat, assembly.x, 0.045, assembly.z); assemblyRing.rotation.x = -Math.PI / 2;
  const assemblyDiscMat = new THREE.MeshBasicMaterial({ color: 0x48bf9b, transparent: true, opacity: 0.13, side: THREE.DoubleSide }); assets.add(assemblyDiscMat);
  const assemblyDisc = mesh(new THREE.CircleGeometry(2.12, 64), assemblyDiscMat, assembly.x, 0.037, assembly.z); assemblyDisc.rotation.x = -Math.PI / 2;
  board('집결지', 'ASSEMBLY POINT', 0, 0.06, -27, 3.6, 1.6, { bg: '#245b53', color: '#c4ffe9', subColor: '#a1dfcd', border: '#54b49a', flat: true });
  [-1, 1].forEach(s => {
    block(s * 5, 0.4, -26.9, 0.22, 0.8, 6.5, mats.lightSteel);
    for (let z = -29.5; z <= -24; z += 1.4) block(s * 5, 0.9, z, 0.17, 1.8, 0.17, mats.steel);
    block(s * 5, 1.6, -26.9, 0.12, 0.1, 6.5, mats.steel);
  });

  // Fire sprites are real low-poly 3D meshes, not downloaded particles.
  const flameMaterials = [
    new THREE.MeshBasicMaterial({ color: 0xff5127, transparent: true, opacity: 0.86, depthWrite: false }),
    new THREE.MeshBasicMaterial({ color: 0xffa537, transparent: true, opacity: 0.92, depthWrite: false }),
    new THREE.MeshBasicMaterial({ color: 0xffdf81, transparent: true, opacity: 0.97, depthWrite: false })
  ]; flameMaterials.forEach(m => assets.add(m));
  const flameGeo = new THREE.ConeGeometry(0.53, 1.9, 7); assets.add(flameGeo);
  const animatedFlames = [];
  const fireLights = [];
  const smokeClouds = [];
  const smokeGeo = new THREE.IcosahedronGeometry(1, 1); assets.add(smokeGeo);
  const smokeMats = [0x6e777b, 0x738084, 0x59666b].map(c => { const m = new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.13, depthWrite: false }); assets.add(m); return m; });
  fires.forEach((fire, fi) => {
    if (fi === 0) {
      collider(fire.x, fire.z, 4.35, 3.5);
      cardboardBox(-0.9, 0.55, -10.25, 1.6, 1.1, 1.5, 2);
      cardboardBox(0.75, 0.4, -10, 1.5, 0.8, 1.3, 0);
      block(-0.2, 0.12, -10, 4.1, 0.24, 3.5, mats.dark);
    }
    if (fi === 2) { collider(fire.x, fire.z, 2.5, 2.6); cardboardBox(fire.x, 0.55, fire.z, 2.4, 1.1, 2.2, 1); }
    for (let j = 0; j < 9; j++) {
      const a = j * 2.399; const radius = (0.4 + (j % 3) * 0.38) * (fi ? 0.82 : 1);
      const x = fire.x + Math.cos(a) * radius, z = fire.z + Math.sin(a) * radius;
      const base = 0.45 + (j % 3) * 0.18;
      const h = 0.9 + ((j * 7) % 5) * 0.21;
      const flame = mesh(flameGeo, flameMaterials[j % 3], x, base + h * 0.95, z);
      flame.scale.set(0.7 + (j % 3) * 0.22, h, 0.7 + (j % 3) * 0.22);
      animatedFlames.push({ mesh: flame, h, base, phase: fi + j * 0.9, x, z });
    }
    const light = new THREE.PointLight(0xff833f, 18, 12, 2); light.position.set(fire.x, 2.2, fire.z); root.add(light); fireLights.push(light);
    for (let j = 0; j < 5; j++) {
      const cloud = mesh(smokeGeo, smokeMats[j % 3], fire.x + Math.sin(j * 2) * 0.5, 3.4 + j * 0.65, fire.z + Math.cos(j * 2) * 0.5);
      cloud.scale.set(1.05 + j * 0.18, 0.7 + j * 0.15, 1 + j * 0.15);
      smokeClouds.push({ mesh: cloud, x: cloud.position.x, z: cloud.position.z, phase: j + fi * 3 });
    }
  });
  // A visibly smoky cross aisle introduces the crouching mechanic without hiding the route.
  for (let i = 0; i < 11; i++) {
    const cloud = mesh(smokeGeo, smokeMats[i % 3], -8.7 + i * 1.74, 2.55 + (i % 3) * 0.25, -6 + Math.sin(i * 1.6) * 0.6);
    cloud.scale.set(1.3, 0.67, 1.4);
    smokeClouds.push({ mesh: cloud, x: cloud.position.x, z: cloud.position.z, phase: i * 0.8 });
  }
  const emberCount = 84;
  const emberPositions = new Float32Array(emberCount * 3);
  const emberGeo = new THREE.BufferGeometry(); emberGeo.setAttribute('position', new THREE.BufferAttribute(emberPositions, 3)); assets.add(emberGeo);
  const emberMat = new THREE.PointsMaterial({ color: 0xffc36b, size: 0.065, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending }); assets.add(emberMat);
  const embers = new THREE.Points(emberGeo, emberMat); root.add(embers);

  // A single InstancedMesh per material replaces hundreds of separate draw calls.
  batchMap.forEach((transforms, mat) => {
    const instanced = new THREE.InstancedMesh(cube, mat, transforms.length);
    transforms.forEach((v, i) => {
      dummy.position.set(v[0], v[1], v[2]); dummy.scale.set(v[3], v[4], v[5]); dummy.rotation.set(0, v[6], 0); dummy.updateMatrix(); instanced.setMatrixAt(i, dummy.matrix);
    });
    instanced.instanceMatrix.needsUpdate = true;
    instanced.computeBoundingSphere();
    instanced.receiveShadow = true; instanced.castShadow = false;
    root.add(instanced);
  });
  function update(t) {
    animatedFlames.forEach(f => {
      const flicker = 1 + Math.sin(t * 8 + f.phase) * 0.15 + Math.sin(t * 13 + f.phase * 2) * 0.06;
      f.mesh.scale.y = f.h * flicker;
      f.mesh.position.y = f.base + f.h * flicker * 0.95;
      f.mesh.rotation.z = Math.sin(t * 5 + f.phase) * 0.12;
      f.mesh.rotation.y = t * 0.55 + f.phase;
    });
    fireLights.forEach((light, i) => { light.intensity = 17 + Math.sin(t * 9 + i * 2) * 2.5; });
    smokeClouds.forEach(s => { s.mesh.position.x = s.x + Math.sin(t * 0.34 + s.phase) * 0.30; s.mesh.position.z = s.z + Math.cos(t * 0.23 + s.phase) * 0.18; s.mesh.rotation.y = t * 0.07 + s.phase; });
    for (let i = 0; i < emberCount; i++) {
      const fire = fires[i % fires.length]; const phase = (t * (0.32 + (i % 5) * 0.035) + i * 0.137) % 1;
      const a = i * 2.399 + phase * 1.4; const r = (0.4 + (i % 7) * 0.15) * (1 + phase * 0.4);
      emberPositions[i * 3] = fire.x + Math.sin(a) * r;
      emberPositions[i * 3 + 1] = 0.8 + phase * 4.8;
      emberPositions[i * 3 + 2] = fire.z + Math.cos(a) * r;
    }
    emberGeo.attributes.position.needsUpdate = true;
    alarmBeacon.visible = alarm.active || Math.sin(t * 5) > -0.3;
    alarmRingMat.color.setHex(alarm.active ? 0x5ef0c0 : 0xffbb62);
    alarmRingMat.opacity = alarm.active ? 0.35 : 0.55 + Math.sin(t * 3) * 0.2;
    assemblyMat.opacity = 0.6 + Math.sin(t * 2) * 0.16;
  }
  update(0);
  return {
    root, obstacles, fires, smokeZones, alarm, exit, assembly, update,
    dispose() { scene.remove(root); assets.forEach(asset => asset.dispose()); }
  };
}
