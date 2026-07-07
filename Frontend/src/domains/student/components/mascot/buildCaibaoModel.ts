import * as THREE from 'three'

const COLORS = {
  yellow: 0xf5c842,
  teal: 0x1f7a7a,
  white: 0xffffff,
  pink: 0xd9777a,
  black: 0x181818,
  blush: 0xf0a0a0,
} as const

function mat(color: number, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.58,
    metalness: 0.04,
    ...opts,
  })
}

function addMesh(
  group: THREE.Group,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  position: THREE.Vector3Like,
  rotation?: { x?: number; y?: number; z?: number },
  scale?: THREE.Vector3Like,
) {
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.copy(position as THREE.Vector3)
  if (rotation) {
    if (rotation.x != null) mesh.rotation.x = rotation.x
    if (rotation.y != null) mesh.rotation.y = rotation.y
    if (rotation.z != null) mesh.rotation.z = rotation.z
  }
  if (scale) mesh.scale.copy(scale as THREE.Vector3)
  group.add(mesh)
  return mesh
}

export interface CaibaoModel {
  root: THREE.Group
  eyes: THREE.Group[]
}

export function buildCaibaoModel(): CaibaoModel {
  const root = new THREE.Group()
  root.name = 'caibao'
  const eyes: THREE.Group[] = []

  const yellow = mat(COLORS.yellow)
  const teal = mat(COLORS.teal)
  const white = mat(COLORS.white, { roughness: 0.65 })
  const pink = mat(COLORS.pink)
  const black = mat(COLORS.black, { roughness: 0.35 })
  const blush = mat(COLORS.blush, { transparent: true, opacity: 0.55 })

  // ── Body (pear shape) ──
  addMesh(root, new THREE.SphereGeometry(0.52, 32, 32), yellow, { x: 0, y: -0.28, z: 0 }, undefined, {
    x: 1.05,
    y: 0.88,
    z: 0.92,
  })

  // ── Belly patch ──
  addMesh(root, new THREE.SphereGeometry(0.34, 24, 24), white, { x: 0, y: -0.32, z: 0.38 }, undefined, {
    x: 0.72,
    y: 1.05,
    z: 0.18,
  })

  // ── Head ──
  addMesh(root, new THREE.SphereGeometry(0.58, 32, 32), yellow, { x: 0, y: 0.48, z: 0 }, undefined, {
    x: 1.02,
    y: 0.95,
    z: 0.98,
  })

  // ── Horn ──
  addMesh(
    root,
    new THREE.ConeGeometry(0.09, 0.28, 8),
    teal,
    { x: 0, y: 1.02, z: 0.02 },
    { x: 0, y: 0, z: 0 },
  )

  // ── Ears ──
  for (const side of [-1, 1] as const) {
    addMesh(
      root,
      new THREE.ConeGeometry(0.12, 0.2, 8),
      yellow,
      { x: side * 0.42, y: 0.88, z: -0.05 },
      { x: -0.35, y: 0, z: side * 0.45 },
    )
    addMesh(
      root,
      new THREE.ConeGeometry(0.07, 0.12, 8),
      white,
      { x: side * 0.4, y: 0.86, z: 0.02 },
      { x: -0.35, y: 0, z: side * 0.45 },
    )
  }

  // ── Side tufts (cloud-like) ──
  for (const side of [-1, 1] as const) {
    const tuftGroup = new THREE.Group()
    tuftGroup.position.set(side * 0.52, 0.55, 0.08)
    tuftGroup.rotation.y = side * 0.4
    for (let i = 0; i < 3; i++) {
      const blob = new THREE.Mesh(new THREE.SphereGeometry(0.08 - i * 0.015, 12, 12), teal)
      blob.position.set(side * i * 0.07, i * 0.04 - 0.02, -i * 0.03)
      tuftGroup.add(blob)
    }
    root.add(tuftGroup)
  }

  // ── Eyes ──
  for (const side of [-1, 1] as const) {
    const eyeGroup = new THREE.Group()
    eyeGroup.name = side === -1 ? 'eyeLeft' : 'eyeRight'
    eyeGroup.position.set(side * 0.22, 0.5, 0.48)

    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 16), black)
    eye.position.set(0, 0, 0)
    eyeGroup.add(eye)

    const highlight = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), white)
    highlight.position.set(side * -0.03, 0.04, 0.08)
    eyeGroup.add(highlight)

    root.add(eyeGroup)
    eyes.push(eyeGroup)
  }

  // ── Eyebrows ──
  for (const side of [-1, 1] as const) {
    addMesh(
      root,
      new THREE.BoxGeometry(0.16, 0.04, 0.04),
      pink,
      { x: side * 0.22, y: 0.66, z: 0.44 },
      { x: 0, y: 0, z: side * 0.35 },
    )
  }

  // ── Cheek blush ──
  for (const side of [-1, 1] as const) {
    addMesh(root, new THREE.SphereGeometry(0.09, 12, 12), blush, { x: side * 0.36, y: 0.38, z: 0.44 }, undefined, {
      x: 1.2,
      y: 0.8,
      z: 0.5,
    })
  }

  // ── Snout / mouth area ──
  addMesh(root, new THREE.SphereGeometry(0.06, 12, 12), black, { x: 0, y: 0.38, z: 0.54 })

  // ── Smile (subtle arc) ──
  addMesh(
    root,
    new THREE.TorusGeometry(0.08, 0.012, 8, 16, Math.PI),
    black,
    { x: 0, y: 0.32, z: 0.55 },
    { x: Math.PI, y: 0, z: 0 },
  )

  // ── Fangs ──
  for (const side of [-1, 1] as const) {
    addMesh(
      root,
      new THREE.ConeGeometry(0.025, 0.06, 6),
      white,
      { x: side * 0.04, y: 0.34, z: 0.56 },
      { x: Math.PI, y: 0, z: 0 },
    )
  }

  // ── Collar ──
  addMesh(
    root,
    new THREE.TorusGeometry(0.38, 0.045, 8, 24),
    teal,
    { x: 0, y: 0.08, z: 0.05 },
    { x: Math.PI / 2, y: 0, z: 0 },
  )

  // ── Bell ──
  addMesh(root, new THREE.SphereGeometry(0.07, 16, 16), pink, { x: 0, y: -0.02, z: 0.42 })
  addMesh(root, new THREE.TorusGeometry(0.04, 0.008, 6, 12), pink, { x: 0, y: 0.04, z: 0.42 })

  // ── Arms ──
  for (const side of [-1, 1] as const) {
    addMesh(
      root,
      new THREE.SphereGeometry(0.14, 16, 16),
      yellow,
      { x: side * 0.58, y: -0.18, z: 0.08 },
      undefined,
      { x: 0.85, y: 1.1, z: 0.85 },
    )
  }

  // ── Legs & feet ──
  for (const side of [-1, 1] as const) {
    addMesh(
      root,
      new THREE.SphereGeometry(0.16, 16, 16),
      yellow,
      { x: side * 0.22, y: -0.72, z: 0.06 },
      undefined,
      { x: 1.1, y: 0.75, z: 1.05 },
    )
    for (let toe = -1; toe <= 1; toe++) {
      addMesh(
        root,
        new THREE.SphereGeometry(0.045, 10, 10),
        teal,
        { x: side * 0.22 + toe * 0.07, y: -0.84, z: 0.18 + Math.abs(toe) * 0.02 },
      )
    }
  }

  // ── Tail ──
  const tail = addMesh(
    root,
    new THREE.CapsuleGeometry(0.1, 0.22, 8, 12),
    yellow,
    { x: 0, y: -0.42, z: -0.38 },
    { x: 0.6, y: 0, z: 0 },
  )
  tail.name = 'tail'

  // Tail scales
  for (let i = 0; i < 4; i++) {
    addMesh(
      root,
      new THREE.SphereGeometry(0.055, 10, 10),
      teal,
      { x: 0, y: -0.36 - i * 0.07, z: -0.48 - i * 0.06 },
      undefined,
      { x: 1.1, y: 0.5, z: 0.7 },
    )
  }

  root.scale.setScalar(0.95)
  return { root, eyes }
}
