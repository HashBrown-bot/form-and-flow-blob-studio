import React, { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'

// The color pairs tint the material itself. The separate studio environment
// supplies broad, soft reflections, just as a real lit studio would.
const PALETTES = {
  iridescent: ['#788ddd', '#4a347e', '#d49ae4'],
  ocean: ['#d2f2f7', '#79a9da', '#a5b5ed'],
  sunset: ['#ffdfbf', '#e8acc6', '#d4afd9'],
  candy: ['#ffe3f0', '#e7b9f4', '#bfe7f1'],
  mono: ['#f5f8fc', '#7c879d', '#d1dbe3'],
  chrome: ['#e3f3ff', '#8399ae', '#c2d8ed'],
  aurora: ['#a6e7d5', '#638acf', '#dd93e4'],
  foil: ['#d8e9f5', '#9583df', '#f6b4d8'],
  rainbow: ['#18c9db', '#ce49a9', '#f9a54f'],
  pearl: ['#f9f3f6', '#d2d6ed', '#f0dce9'],
  copper: ['#ffddba', '#bd858e', '#ffd5a4'],
  mint: ['#d9fff0', '#9cced0', '#c4c8ed'],
  cd: ['#4eddec', '#932fc9', '#e2b3f7'],
  'cosmic-fusion': ['#8cefff', '#5031a8', '#f29ce0'],
  halloween: ['#ff9f67', '#b04492', '#784bb2'],
  passion: ['#ffe1a9', '#eb6048', '#a52c4f'],
  'pink-floyd': ['#29d5cd', '#e85cb0', '#f1d45b'],
  hollogram: ['#84ebed', '#483aaf', '#ac75eb'],
  imaginarium: ['#a5e6ff', '#7759d7', '#f898b3'],
  'sunset-vibes': ['#ff8d98', '#7930a8', '#acc7ff'],
  'deep-ocean': ['#93dbe9', '#22568e', '#7e90df'],
}

const defaults = {
  distort: 0.28,
  frequency: 1.65,
  speed: 0.42,
  surfaceDistort: 0.16,
  surfaceFrequency: 3.8,
  waves: 5,
  ridgeStrength: 1,
  foldTwist: 0.3,
  surfaceSpeed: 0.3,
  size: 1,
  segments: 192,
  roughness: 0.25,
  metalness: 0.78,
  envIntensity: 1.15,
  clearcoat: 0.5,
  clearcoatRoughness: 0.2,
  transmission: 0,
  opacity: 1,
  ior: 1.5,
  thickness: 0.8,
  attenuationDistance: 8,
  attenuationColor: '#ffffff',
  shapeMode: 'fold',
  poleAmount: 1,
  surfacePoleAmount: 1,
  referenceRotation: [0, 0, 0],
  motionStyle: 'fluid',
  iridescence: 0,
  background: '#89b9c1',
  color: '#ffffff',
  gradient: 'iridescent',
  ambient: 0.7,
  light1Color: '#c4edff',
  light2Color: '#bd81ff',
  light3Color: '#ffe6a6',
  lightIntensity: 1.3,
  rotationSpeed: 0.12,
}

const vertexHelpers = /* glsl */ `
uniform float uTime;
uniform float uSurfaceTime;
uniform float uDistort;
uniform float uFrequency;
uniform float uSurfaceDistort;
uniform float uSurfaceFrequency;
uniform float uWaves;
uniform float uRidgeStrength;
uniform float uFoldTwist;
uniform float uJelly;
uniform float uPoleAmount;
uniform float uSurfacePoleAmount;
uniform float uProto;
varying vec3 vProtoPosition;
uniform vec4 uModesA;
uniform vec4 uModesB;
uniform vec4 uModesC;
uniform vec4 uModesD;
varying vec3 vBlobCoord;

// Independent periodic lattice-gradient noise. The wrapped lattice guarantees
// smooth looping at period four while avoiding use of reference-site code.
vec3 latticeGradient(vec3 cell) {
  vec3 q = fract(mod(cell, 4.0) * vec3(0.1031, 0.1030, 0.0973));
  q += dot(q, q.yxz + 33.33);
  vec3 g = fract((q.xxy + q.yxx) * q.zyx) * 2.0 - 1.0;
  return normalize(g + vec3(0.001));
}
float periodicNoise(vec3 position) {
  vec3 c = floor(position);
  vec3 f = fract(position);
  vec3 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = dot(latticeGradient(c), f);
  float b = dot(latticeGradient(c + vec3(1,0,0)), f - vec3(1,0,0));
  float d = dot(latticeGradient(c + vec3(0,1,0)), f - vec3(0,1,0));
  float e = dot(latticeGradient(c + vec3(1,1,0)), f - vec3(1,1,0));
  float g = dot(latticeGradient(c + vec3(0,0,1)), f - vec3(0,0,1));
  float h = dot(latticeGradient(c + vec3(1,0,1)), f - vec3(1,0,1));
  float j = dot(latticeGradient(c + vec3(0,1,1)), f - vec3(0,1,1));
  float k = dot(latticeGradient(c + vec3(1,1,1)), f - vec3(1,1,1));
  return 1.65 * mix(mix(mix(a,b,u.x),mix(d,e,u.x),u.y),
                    mix(mix(g,h,u.x),mix(j,k,u.x),u.y),u.z);
}

vec3 blobDeform(vec3 p) {
  vec3 n = normalize(p);
  float f = uFrequency;
  // Repeating broad folds travel over a sphere as one continuous surface.
  // The warped phase turns straight bands into the liquid, diagonal ribbons
  // of the reference, while the large-scale swell keeps the outline organic.
  float warpedX = n.x + uFoldTwist * n.y + 0.18 * sin(n.z * 3.0 + uTime * 0.24);
  float phase = warpedX * (f * 3.5 + 1.7)
              + 1.15 * sin(n.y * 2.15 + n.z * 1.2 + uTime * 0.27)
              + uTime * 0.38;
  float folds = sin(phase) * 0.80 + sin(phase * 2.0 - 0.65) * 0.15;
  float swell = sin(n.y * f * 1.7 - n.z * 1.45 + uTime * 0.30)
              * cos(n.x * 1.65 + n.z * f * 0.7 - uTime * 0.22);
  float detail = sin(n.x * uSurfaceFrequency * 1.35 + n.z * uWaves * 0.65 + uSurfaceTime * 0.4)
               * sin(n.y * uSurfaceFrequency * 0.9 - n.x * 1.7 - uSurfaceTime * 0.24);
  float displacement = uDistort * (folds * 0.78 * uRidgeStrength + swell * 0.35)
                     + uSurfaceDistort * detail * 0.28;
  vec3 folded = n * (length(p) + displacement);

  // Different shape families share the same high-resolution surface and
  // normal reconstruction. Their independent weights are smoothly faded.
  float ring = length(n.xz);
  float angle = atan(n.z + 0.000001, n.x + 0.000001);
  float petals = cos(angle * 6.0 + uTime * 0.12 + uFoldTwist) * pow(ring, 1.6);
  float flowerRadius = 0.88 + (0.27 + uDistort * 0.45) * petals
                     + 0.08 * sin(n.y * 7.0 + uTime * 0.32);
  vec3 flower = n * flowerRadius;
  flower.y *= 0.82;

  // Interlocking, soft convolutions cover a nearly round silhouette.
  float brainA = sin(n.x * (13.0 + uFrequency) + 2.4 * sin(n.y * 8.0 + n.z * 2.5 + uTime * 0.18));
  float brainB = sin(n.y * 15.0 + 2.0 * sin(n.z * 8.0 + n.x * 3.0 - uTime * 0.13));
  float brainFold = brainA * 0.68 + brainB * 0.32;
  vec3 brain = n * (0.98 + (0.065 + uSurfaceDistort * 0.16) * brainFold
                    + uDistort * 0.12 * swell);

  float spikes = pow(abs(n.x), 8.0) + pow(abs(n.y), 8.0) + pow(abs(n.z), 8.0);
  vec3 star = n * (0.70 + (0.62 + 0.32 * uDistort) * spikes
                     + 0.04 * sin(n.y * 6.0 + uTime * 0.3));

  float cubeNorm = pow(pow(abs(n.x), 5.0) + pow(abs(n.y), 5.0) + pow(abs(n.z), 5.0), 0.2);
  vec3 pillow = n * (0.91 / max(cubeNorm, 0.2) + (0.03 + 0.25 * uDistort) * swell);
  pillow.y *= 0.83;

  vec3 droplet = n;
  float taper = 0.83 - 0.32 * n.y + 0.04 * sin(uTime * 0.3 + n.y * 4.0);
  droplet.xz *= taper;
  droplet.y = n.y * 1.22 + 0.10 * (1.0 - n.y * n.y);
  droplet *= 1.0 + (0.02 + 0.22 * uDistort) * swell;

  // A narrow waist and four opposing inflated wings make a butterfly-like
  // silhouette, rather than applying another surface pattern to a sphere.
  vec3 butterfly = n;
  butterfly.x *= 0.32 + 1.32 * pow(abs(n.y), 0.85);
  butterfly.y *= 0.98 + 0.22 * abs(n.x);
  butterfly.z *= 0.48 + 0.05 * sin(uTime * 0.4 + n.y * 3.0);
  butterfly *= 1.0 + (0.02 + 0.25 * uDistort) * sin(n.x * 5.0 + n.y * 3.0 + uTime * 0.22);

  // Horizontal wrapped ridges and a tapered apex form a stacked swirl.
  float twistPhase = n.y * (9.0 + uFrequency * 2.0) + angle
                   + uTime * 0.25;
  float wrap = sin(twistPhase) * (0.11 + 0.17 * uRidgeStrength);
  float taperTwist = 0.88 - 0.22 * n.y + wrap * (1.0 - 0.7 * abs(n.y));
  vec3 twister = vec3(n.x * taperTwist, n.y * 1.02, n.z * taperTwist);

  // A dense comb of vertical waves, a slowly flowing mercury-like shape,
  // and a near-spherical object give the gallery distinct silhouettes.
  float ridgePhase = (n.x + uFoldTwist * n.y * 0.45) * (14.0 + f * 4.0)
                   + 0.5 * sin(n.y * 2.6 + uTime * 0.18) + uTime * 0.22;
  float rippleWave = sin(ridgePhase) * (0.08 + 0.11 * uRidgeStrength);
  vec3 ripple = n * (1.0 + rippleWave + 0.09 * uDistort * swell);

  float smoothA = sin(n.x * 2.6 + 0.9 * sin(n.z * 2.1 + uTime * 0.19) + uTime * 0.21);
  float smoothB = cos(n.y * 2.5 + n.z * 1.35 - uTime * 0.17);
  vec3 organic = n * (1.0 + uDistort * (smoothA * 0.50 + smoothB * 0.35));
  organic.x *= 1.08;
  organic.y *= 0.92;

  vec3 orb = n * (1.0 + uDistort * 0.18 * swell
                     + uSurfaceDistort * 0.05 * detail);

  // Reference-like layered radial displacement: one slow three-dimensional
  // field shapes the blob and a second independent field perturbs spherical
  // bands. Inputs use the same human-facing units as the source controls.
  vec3 referenced = vec3(0.0);
  if (uModesD.x > 0.00001) {
    float pole = sin(3.14159265 * smoothstep(-1.0, 1.0, n.y));
    float bodyField = periodicNoise(p / max(uFrequency, 0.05) + vec3(uTime / 3.0));
    float waveField = periodicNoise(p / max(uSurfaceFrequency * mix(1.0, 2.2, uProto), 0.05) + vec3(uSurfaceTime / 3.0));
    float phaseRef = (p.y + waveField) * 3.14159265 * uWaves;
    float band = p.x * sin(phaseRef) + p.z * cos(phaseRef);
    float body = bodyField * uDistort * uDistort * mix(pole, 1.0, uPoleAmount);
    float surface = band * 0.01 * uSurfaceDistort * uSurfaceDistort * mix(pole, 1.0, uSurfacePoleAmount);
    // A separate, low-amplitude ring field reproduces the layered folds of
    // Protocool while leaving the original controls in charge of the motion.
    if (uProto > 0.0001) {
      vec3 protoAxis = normalize(vec3(0.36, 0.60, 0.71));
      vec3 protoRight = normalize(cross(vec3(0.0, 1.0, 0.0), protoAxis));
      vec3 protoUp = normalize(cross(protoAxis, protoRight));
      float ax = dot(n, protoRight);
      float ay = dot(n, protoUp);
      float radial = length(vec2(ax, ay));
      float thetaProto = atan(ay, ax);
      float drift = uSurfaceTime * 0.095;
      // Offset each ring by two independently moving angular fields so the
      // layers overlap as irregular scales, instead of forming even ripples.
      float warp = 1.18 * sin(thetaProto * 5.0 + radial * 6.5 - drift)
                 + 0.48 * sin(thetaProto * 9.0 - radial * 10.0 + drift * 0.55)
                 + 0.22 * sin(thetaProto * 14.0 + radial * 13.0 - drift * 0.35);
      float ringPhase = radial * (17.0 + uWaves * 3.0) + warp - drift;
      float layers = sin(ringPhase) * (0.026 + 0.009 * sin(thetaProto * 7.0 + drift));
      float smallScales = (sin(thetaProto * 13.0 + 1.2 * sin(thetaProto * 7.0) + drift * 0.65)
                         + 0.35 * sin(thetaProto * 19.0 - radial * 9.0 - drift * 0.4))
                        * smoothstep(0.52, 0.98, radial) * 0.023;
      surface = mix(surface, surface * 0.51 + (layers + smallScales) * clamp(uSurfaceDistort / 3.33, 0.0, 2.0), uProto);
    }
    referenced = p + normalize(p) * (body + surface);
  }

  // An original fluted jelly dome: a rounded cap and gently flattened base.
  // It remains a closed surface and wobbles continuously with the material.
  float theta = acos(clamp(n.y, -1.0, 1.0)) / 3.14159265;
  float cap = min(theta / 0.86, 1.0);
  float ringDome = sin(cap * 1.5707963) * (1.0 - smoothstep(0.86, 1.0, theta));
  vec2 directionDome = n.xz / max(length(n.xz), 0.0001);
  float mould = 1.0 + 0.075 * cos(angle * 8.0) * smoothstep(0.05, 0.55, theta);
  float wobblyDome = 1.0 + uDistort * 0.12 * swell + uSurfaceDistort * 0.10 * detail;
  vec3 jellyDome = vec3(directionDome.x * ringDome * mould * wobblyDome,
                        -0.62 + 1.38 * cos(cap * 1.5707963),
                        directionDome.y * ringDome * mould * wobblyDome);

  vec3 result = folded * uModesA.x + flower * uModesA.y + brain * uModesA.z
              + star * uModesA.w + pillow * uModesB.x + droplet * uModesB.y
              + butterfly * uModesB.z + twister * uModesB.w
              + ripple * uModesC.x + organic * uModesC.y + orb * uModesC.z
              + referenced * uModesD.x + jellyDome * uModesD.y;
  // Surface controls also affect the alternate silhouettes. The original
  // folded form already incorporates this detail and must remain unchanged.
  float jellyWobble = sin(n.y * 4.2 + uTime * 1.8) * n.x * 0.55
                    + cos(n.x * 3.5 - uTime * 1.35) * n.y * 0.35;
  return result * (1.0 + (1.0 - uModesA.x - uModesD.x) * min(uSurfaceDistort, 1.0) * detail * 0.20
                  + 0.07 * uJelly * jellyWobble);
}
`

function StudioEnvironment() {
  const { scene } = useThree()
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 512
    const ctx = canvas.getContext('2d')
    const bg = ctx.createLinearGradient(0, 0, 0, 512)
    bg.addColorStop(0, '#9ab6c8')
    bg.addColorStop(0.30, '#536987')
    bg.addColorStop(0.59, '#222d54')
    bg.addColorStop(0.83, '#464877')
    bg.addColorStop(1, '#91a9b9')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, 1024, 512)
    const glow = (x, y, radius, color) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, radius)
      g.addColorStop(0, color)
      g.addColorStop(0.22, color)
      g.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = g
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2)
    }
    glow(130, 172, 250, 'rgba(210,245,255,0.95)')
    glow(385, 286, 220, 'rgba(168,100,255,0.92)')
    glow(625, 164, 245, 'rgba(225,250,255,0.98)')
    glow(855, 302, 200, 'rgba(255,222,174,0.76)')
    // Long softboxes make elongated highlights that travel across the folds,
    // rather than the small circular hotspots of point lights.
    const softbox = (x, y, width, height, angle, tint) => {
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(angle)
      ctx.shadowColor = tint
      ctx.shadowBlur = 48
      const strip = ctx.createLinearGradient(-width / 2, 0, width / 2, 0)
      strip.addColorStop(0, 'rgba(255,255,255,0)')
      strip.addColorStop(0.25, tint)
      strip.addColorStop(0.75, tint)
      strip.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = strip
      ctx.fillRect(-width / 2, -height / 2, width, height)
      ctx.restore()
    }
    softbox(180, 182, 72, 286, -0.22, 'rgba(247,255,255,0.92)')
    softbox(673, 144, 110, 244, 0.28, 'rgba(248,255,255,0.92)')
    softbox(910, 266, 52, 190, -0.25, 'rgba(255,235,215,0.80)')
    // Convert the studio painting to linear HDR radiance. A bright softbox
    // must be brighter than white to produce convincing PBR reflections;
    // retaining the dark studio areas keeps glass and metal dimensional.
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data
    const hdr = new Float32Array(canvas.width * canvas.height * 4)
    const linear = (channel) => {
      const c = channel / 255
      return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    }
    for (let i = 0; i < pixels.length; i += 4) {
      const brightness = Math.max(pixels[i], pixels[i + 1], pixels[i + 2]) / 255
      const radiance = 0.72 + Math.pow(Math.max(0, (brightness - 0.68) / 0.32), 3) * 3.4
      hdr[i] = linear(pixels[i]) * radiance
      hdr[i + 1] = linear(pixels[i + 1]) * radiance
      hdr[i + 2] = linear(pixels[i + 2]) * radiance
      hdr[i + 3] = 1
    }
    const tex = new THREE.DataTexture(hdr, canvas.width, canvas.height, THREE.RGBAFormat, THREE.FloatType)
    tex.mapping = THREE.EquirectangularReflectionMapping
    tex.colorSpace = THREE.LinearSRGBColorSpace
    tex.magFilter = THREE.LinearFilter
    tex.minFilter = THREE.LinearFilter
    tex.needsUpdate = true
    return tex
  }, [])
  useEffect(() => {
    const previous = scene.environment
    let active = true
    let photograph
    // A real HDR light studio supplies broad photographic reflections and
    // realistic radiance. The procedural HDR remains available while loading
    // or if the file is unavailable.
    scene.environment = texture
    new RGBELoader().load('/studio_small_08_1k.hdr', (hdr) => {
      if (!active) { hdr.dispose(); return }
      hdr.mapping = THREE.EquirectangularReflectionMapping
      photograph = hdr
      scene.environment = hdr
    }, undefined, () => { /* Keep the procedural studio fallback. */ })
    return () => {
      active = false
      scene.environment = previous
      if (photograph) photograph.dispose()
      texture.dispose()
    }
  }, [scene, texture])
  return null
}

// A normal 2D scene background is rendered into Three's transmission pass,
// so glass picks up the wallpaper as well as the photographic lighting. Keep
// the environment map separate: changing the backdrop must not discard it.
function coverBackground(texture, width, height) {
  if (!texture?.image || !width || !height) return
  const image = texture.image
  const imageWidth = image.naturalWidth || image.width
  const imageHeight = image.naturalHeight || image.height
  if (!imageWidth || !imageHeight) return
  const imageAspect = imageWidth / imageHeight
  const viewportAspect = width / height
  const repeatX = viewportAspect < imageAspect ? viewportAspect / imageAspect : 1
  const repeatY = viewportAspect > imageAspect ? imageAspect / viewportAspect : 1
  texture.repeat.set(repeatX, repeatY)
  texture.offset.set((1 - repeatX) / 2, (1 - repeatY) / 2)
  texture.updateMatrix()
}

function SceneBackground({ color, imageUrl, reducedMotion }) {
  const { scene, size } = useThree()
  const background = useMemo(() => new THREE.Color(color), [])
  const target = useMemo(() => new THREE.Color(color), [color])
  const currentTexture = useRef(null)
  const currentSize = useRef(size)
  currentSize.current = size
  useEffect(() => {
    const previous = scene.background
    scene.background = background
    return () => {
      scene.background = previous
      currentTexture.current?.dispose()
      currentTexture.current = null
    }
  }, [scene, background])
  useEffect(() => {
    let active = true
    if (!imageUrl) {
      scene.background = background
      currentTexture.current?.dispose()
      currentTexture.current = null
    } else {
      // Keep the old image visible until its replacement is ready. The first
      // image falls back to the solid color, so slow loads never flash empty.
      new THREE.TextureLoader().load(imageUrl, (texture) => {
        if (!active) { texture.dispose(); return }
        texture.colorSpace = THREE.SRGBColorSpace
        coverBackground(texture, currentSize.current.width, currentSize.current.height)
        const previousTexture = currentTexture.current
        currentTexture.current = texture
        scene.background = texture
        previousTexture?.dispose()
      }, undefined, () => {
        if (active) {
          scene.background = background
          currentTexture.current?.dispose()
          currentTexture.current = null
        }
      })
    }
    return () => { active = false }
  }, [scene, background, imageUrl])
  useEffect(() => {
    coverBackground(currentTexture.current, size.width, size.height)
  }, [size.width, size.height])
  useFrame((_, delta) => background.lerp(target, reducedMotion ? 1 : 1 - Math.exp(-5 * Math.min(delta, 0.05))))
  return null
}

function CameraControls({ enabled, resetCameraKey }) {
  const { camera, gl } = useThree()
  const controls = useRef(null)
  useEffect(() => {
    const orbit = new OrbitControls(camera, gl.domElement)
    orbit.enablePan = false
    orbit.enableZoom = false
    orbit.enableDamping = true
    orbit.dampingFactor = 0.07
    controls.current = orbit
    return () => {
      controls.current = null
      orbit.dispose()
    }
  }, [camera, gl])
  useEffect(() => {
    if (controls.current) controls.current.enabled = enabled
  }, [enabled])
  useEffect(() => {
    controls.current?.reset()
  }, [resetCameraKey])
  useFrame(() => controls.current?.update())
  return null
}

// The UI may change several parameters at once when selecting a preset.
// Keep the current light objects and interpolate in the render loop so a
// preset change does not create a frame of abruptly different illumination.
function SmoothLight({ color, intensity, position, reducedMotion }) {
  const light = useRef()
  const initial = useRef({ color, intensity }).current
  const targetColor = useMemo(() => new THREE.Color(color), [color])
  useFrame((_, delta) => {
    if (!light.current) return
    const dt = Math.min(delta, 0.05)
    const blend = reducedMotion ? 1 : 1 - Math.exp(-5 * dt)
    light.current.color.lerp(targetColor, blend)
    light.current.intensity = reducedMotion ? intensity : THREE.MathUtils.damp(light.current.intensity, intensity, 5, dt)
  })
  return <directionalLight ref={light} position={position} color={initial.color} intensity={initial.intensity} />
}


function ReferenceSpot({ color, intensity, position, angle, distance, penumbra, decay, reducedMotion }) {
  const light = useRef()
  const initial = useRef({ color, intensity, position, angle, distance, penumbra, decay }).current
  const targetColor = useMemo(() => new THREE.Color(color), [color])
  useFrame((_, delta) => {
    const l = light.current
    if (!l) return
    const dt = Math.min(delta, 0.05)
    const k = reducedMotion ? 1 : 1 - Math.exp(-5 * dt)
    l.color.lerp(targetColor, k)
    l.intensity += (intensity - l.intensity) * k
    l.angle += (angle - l.angle) * k
    l.distance += (distance - l.distance) * k
    l.penumbra += (penumbra - l.penumbra) * k
    l.decay += (decay - l.decay) * k
    l.position.x += (position[0] - l.position.x) * k
    l.position.y += (position[1] - l.position.y) * k
    l.position.z += (position[2] - l.position.z) * k
  })
  return <spotLight ref={light} color={initial.color} intensity={initial.intensity} position={initial.position} angle={initial.angle} distance={initial.distance} penumbra={initial.penumbra} decay={initial.decay} />
}

function SmoothAmbient({ intensity, reducedMotion }) {
  const light = useRef()
  const initial = useRef(intensity).current
  useFrame((_, delta) => {
    if (light.current) light.current.intensity = reducedMotion ? intensity : THREE.MathUtils.damp(light.current.intensity, intensity, 5, Math.min(delta, 0.05))
  })
  return <ambientLight ref={light} intensity={initial} />
}

const SHAPE_MODES = {
  fold: [1, 0, 0, 0, 0, 0, 0, 0],
  flower: [0, 1, 0, 0, 0, 0, 0, 0],
  brain: [0, 0, 1, 0, 0, 0, 0, 0],
  star: [0, 0, 0, 1, 0, 0, 0, 0],
  pillow: [0, 0, 0, 0, 1, 0, 0, 0],
  droplet: [0, 0, 0, 0, 0, 1, 0, 0],
  butterfly: [0, 0, 0, 0, 0, 0, 1, 0],
  twister: [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
  ripple: [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
  organic: [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
  orb: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
  reference: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
  jellyDome: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
}

function Blob({ values, reducedMotion, resetAnimationKey }) {
  const mesh = useRef()
  const orientation = useRef()
  const material = useRef()
  const initial = useRef(values).current
  const clock = useRef({ shape: 0, surface: 0, speed: initial.speed, surfaceSpeed: initial.surfaceSpeed, rotationSpeed: initial.rotationSpeed, scale: initial.size })
  const firstPalette = PALETTES[String(initial.gradient).toLowerCase()] || PALETTES.iridescent
  const initialModes = SHAPE_MODES[initial.shapeMode] || SHAPE_MODES.fold
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uSurfaceTime: { value: 0 },
    uDistort: { value: initial.distort },
    uFrequency: { value: initial.frequency },
    uSurfaceDistort: { value: initial.surfaceDistort },
    uSurfaceFrequency: { value: initial.surfaceFrequency },
    uWaves: { value: initial.waves },
    uRidgeStrength: { value: initial.ridgeStrength },
    uFoldTwist: { value: initial.foldTwist },
    uPoleAmount: { value: initial.poleAmount },
    uSurfacePoleAmount: { value: initial.surfacePoleAmount },
    uJelly: { value: initial.motionStyle === 'jelly' ? 1 : 0 },
    uModesA: { value: new THREE.Vector4(...initialModes.slice(0, 4)) },
    uModesB: { value: new THREE.Vector4(...initialModes.slice(4, 8)) },
    uModesC: { value: new THREE.Vector4(...initialModes.slice(8, 12)) },
    uModesD: { value: new THREE.Vector4(...initialModes.slice(12, 16)) },
    uGlassFactor: { value: initial.transmission * (1 - initial.metalness) },
    uProto: { value: initial.presetName === 'Protocool' && initial.shapeMode === 'reference' ? 1 : 0 },
    uProtoColor: { value: new THREE.Color(initial.color) },
    uProtoLightA: { value: new THREE.Color(initial.light1Color) },
    uProtoLightB: { value: new THREE.Color(initial.light2Color) },
    uProtoLightC: { value: new THREE.Color(initial.light3Color) },
    uProtoLightGain: { value: initial.lightIntensity },
    uProtoRoughness: { value: initial.roughness },
    uProtoMetalness: { value: initial.metalness },
    uProtoEnvIntensity: { value: initial.envIntensity },
    uProtoAmbient: { value: initial.ambient },
    uProtoClearcoat: { value: initial.clearcoat },
    uProtoCoatRoughness: { value: initial.clearcoatRoughness },
    uProtoIridescence: { value: initial.iridescence },
    uReferenceTint: { value: initial.shapeMode === 'reference' ? 1 : 0 },
    uTintA: { value: new THREE.Color(firstPalette[0]) },
    uTintB: { value: new THREE.Color(firstPalette[1]) },
    uTintC: { value: new THREE.Color(firstPalette[2]) },
  }), [])

  // Lipsync must start from the same phase and orientation when selected or reset.
  // Its surface continues animating normally after the reset.
  useEffect(() => {
    if (values.presetName !== 'Lipsync') return
    clock.current.shape = 0
    clock.current.surface = 0
    clock.current.speed = values.speed
    clock.current.surfaceSpeed = values.surfaceSpeed
    clock.current.rotationSpeed = values.rotationSpeed
    uniforms.uTime.value = 0
    uniforms.uSurfaceTime.value = 0
    mesh.current?.rotation.set(0, 0, 0)
  }, [resetAnimationKey])

  const compile = useMemo(() => (shader) => {
    Object.assign(shader.uniforms, uniforms)
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${vertexHelpers}`)
      .replace('#include <beginnormal_vertex>', /* glsl */ `
        vec3 blobNormal = normalize(normal);
        vec3 blobAxis = abs(blobNormal.y) > 0.95 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
        vec3 blobTangent = normalize(cross(blobAxis, blobNormal));
        vec3 blobBitangent = normalize(cross(blobNormal, blobTangent));
        float blobEpsilon = 0.004;
        vec3 blobCenter = blobDeform(position);
        vec3 blobAlongTangent = blobDeform(position + blobTangent * blobEpsilon);
        vec3 blobAlongBitangent = blobDeform(position + blobBitangent * blobEpsilon);
        vec3 objectNormal = normalize(cross(blobAlongTangent - blobCenter, blobAlongBitangent - blobCenter));
        #ifdef USE_TANGENT
          vec3 objectTangent = vec3(tangent.xyz);
        #endif
      `)
      .replace('#include <begin_vertex>', /* glsl */ `
        vec3 transformed = blobDeform(position);
        vBlobCoord = normalize(position);
        vProtoPosition = (modelViewMatrix * vec4(transformed, 1.0)).xyz - (modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
      `)
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', /* glsl */ `
        #include <common>
        uniform float uGlassFactor;
        uniform float uReferenceTint;
        uniform float uProto;
        uniform float uSurfaceTime;
        uniform float uProtoLightGain;
        uniform float uProtoRoughness;
        uniform float uProtoMetalness;
        uniform float uProtoEnvIntensity;
        uniform float uProtoAmbient;
        uniform float uProtoClearcoat;
        uniform float uProtoCoatRoughness;
        uniform float uProtoIridescence;
        uniform vec3 uProtoColor;
        uniform vec3 uProtoLightA;
        uniform vec3 uProtoLightB;
        uniform vec3 uProtoLightC;
        varying vec3 vProtoPosition;
        uniform vec3 uTintA;
        uniform vec3 uTintB;
        uniform vec3 uTintC;
        varying vec3 vBlobCoord;
      `)
      .replace('#include <color_fragment>', /* glsl */ `
        #include <color_fragment>
        float blobGradient = smoothstep(-0.8, 0.9, vBlobCoord.y + 0.25 * vBlobCoord.x);
        float blobAccent = smoothstep(0.2, 0.95, sin(vBlobCoord.x * 2.5 + vBlobCoord.z * 2.0) * 0.5 + 0.5);
        vec3 blobTint = mix(uTintB, uTintA, blobGradient);
        blobTint = mix(blobTint, uTintC, blobAccent * 0.28);
        // Preserve clear glass while retaining the iridescent color accents.
        diffuseColor.rgb *= mix(blobTint, vec3(1.0), clamp(uGlassFactor * 0.78, 0.0, 0.78));
      `)
      .replace('#include <opaque_fragment>', /* glsl */ `
        // Color reflections gently for the source-inspired studio materials.
        outgoingLight = mix(outgoingLight, outgoingLight * blobTint * 1.35, 0.35 * uReferenceTint);
        if (uProto > 0.0001) {
          // Three broad, stationary light pools and a low-key center create
          // the deep sculptural appearance without a screen-sized backdrop.
          vec2 pt = vProtoPosition.xy;
          float radiusProto = length(pt);
          float phaseProto = atan(pt.y, pt.x);
          float slow = uSurfaceTime * 0.08;
          float warpedPhase = radiusProto * 31.0
                            + 1.65 * sin(phaseProto * 5.0 + radiusProto * 5.0 - slow)
                            + 0.82 * sin(phaseProto * 9.0 - radiusProto * 8.0 + slow * 0.55)
                            + 0.42 * sin(phaseProto * 15.0 + radiusProto * 12.0 - slow * 0.35)
                            + 0.35 * sin(phaseProto * 12.0 + radiusProto * 18.0) * sin(phaseProto * 7.0 - radiusProto * 5.0 + slow * 0.3);
          float rings = sin(warpedPhase - slow);
          float tiers = smoothstep(-0.30, 0.18, rings);
          float waveShade = mix(0.42, 1.0, tiers);
          vec2 dMagenta = (pt - vec2(-0.66, 0.65)) / vec2(0.37, 0.30);
          vec2 dCyan = (pt - vec2(0.75, 0.22)) / vec2(0.37, 0.37);
          vec2 dBlue = (pt - vec2(-0.34, -0.76)) / vec2(0.37, 0.30);
          float lightSpread = 1.45 * exp((0.51 - uProtoRoughness) * 0.8);
          float magenta = exp(-dot(dMagenta, dMagenta) * lightSpread);
          float cyan = exp(-dot(dCyan, dCyan) * lightSpread * 0.93);
          float blue = exp(-dot(dBlue, dBlue) * lightSpread * 1.03);
          float rim = smoothstep(0.30, 0.95, radiusProto);
          vec3 low = vec3(0.003, 0.002, 0.010) + vec3(0.010, 0.003, 0.025) * rim;
          low += vec3(0.075, 0.003, 0.13) * rim * (1.0 - smoothstep(-0.65, 0.1, pt.x));
          vec3 magentaColor = mix(uTintC * vec3(1.5, 0.20, 1.8), uProtoLightA, 0.12);
          vec3 cyanColor = mix(uTintA * vec3(0.55, 1.0, 1.05), uProtoLightB, 0.20);
          vec3 blueColor = mix((uTintA + uTintB) * vec3(0.45, 0.45, 0.8), uProtoLightC, 0.13);
          vec3 protoColor = low + (magentaColor * magenta * 0.95 + cyanColor * cyan * 0.85 + blueColor * blue * 0.68) * waveShade;
          protoColor += vec3(0.50, 0.23, 0.55) * pow(magenta, 4.0) + vec3(0.20, 0.30, 0.32) * pow(cyan, 4.0);
          protoColor *= mix(0.08, 1.0, smoothstep(0.24, 0.67, radiusProto));
          protoColor *= uProtoColor * clamp(0.45 + 0.55 * uProtoLightGain, 0.0, 2.5);
          protoColor *= mix(1.12, 0.85, uProtoRoughness);
          // Material and environment controls remain effective on this preset.
          protoColor *= 1.28 - 0.4 * uProtoMetalness;
          protoColor += vec3(0.07, 0.075, 0.10) * max(0.0, 0.7 - uProtoMetalness) * (1.0 - rim);
          protoColor += vec3(0.07, 0.08, 0.11) * (uProtoAmbient - 0.07);
          float coatCore = max(0.0, 1.0 - dot(dMagenta, dMagenta));
          float coatHighlight = pow(coatCore, 4.0 * exp((0.39 - uProtoCoatRoughness) * 1.2));
          float coatBaseline = pow(coatCore, 4.0);
          protoColor += vec3(0.28, 0.12, 0.28) * (uProtoClearcoat * coatHighlight - 0.22 * coatBaseline);
          protoColor += vec3(0.14, 0.08, 0.25) * uProtoIridescence * rim;
          outgoingLight = mix(outgoingLight, protoColor + outgoingLight * (0.008 + 0.45 * uProtoEnvIntensity), uProto);
        }
        #include <opaque_fragment>
      `)
  }, [uniforms])

  const palette = PALETTES[String(values.gradient).toLowerCase()] || PALETTES.iridescent
  const targetPalette = useMemo(() => palette.map(color => new THREE.Color(color)), [palette])
  const targetColor = useMemo(() => new THREE.Color(values.color), [values.color])
  const targetAttenuationColor = useMemo(() => new THREE.Color(values.attenuationColor), [values.attenuationColor])
  const shapeWeights = SHAPE_MODES[values.shapeMode] || SHAPE_MODES.fold
  const targetModesA = useMemo(() => new THREE.Vector4(...shapeWeights.slice(0, 4)), [shapeWeights])
  const targetModesB = useMemo(() => new THREE.Vector4(...shapeWeights.slice(4, 8)), [shapeWeights])
  const targetModesC = useMemo(() => new THREE.Vector4(...shapeWeights.slice(8, 12)), [shapeWeights])
  const targetModesD = useMemo(() => new THREE.Vector4(...shapeWeights.slice(12, 16)), [shapeWeights])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const damp = (current, target) => reducedMotion ? target : THREE.MathUtils.damp(current, target, 5, dt)
    const blend = reducedMotion ? 1 : 1 - Math.exp(-5 * dt)
    clock.current.speed = damp(clock.current.speed, values.speed)
    clock.current.surfaceSpeed = damp(clock.current.surfaceSpeed, values.surfaceSpeed)
    clock.current.rotationSpeed = damp(clock.current.rotationSpeed, values.rotationSpeed)
    clock.current.shape += (reducedMotion ? 0 : dt) * clock.current.speed
    clock.current.surface += (reducedMotion ? 0 : dt) * clock.current.surfaceSpeed
    uniforms.uTime.value = clock.current.shape
    uniforms.uSurfaceTime.value = clock.current.surface
    uniforms.uDistort.value = damp(uniforms.uDistort.value, values.distort)
    uniforms.uFrequency.value = damp(uniforms.uFrequency.value, values.frequency)
    uniforms.uSurfaceDistort.value = damp(uniforms.uSurfaceDistort.value, values.surfaceDistort)
    uniforms.uSurfaceFrequency.value = damp(uniforms.uSurfaceFrequency.value, values.surfaceFrequency)
    uniforms.uWaves.value = damp(uniforms.uWaves.value, values.waves)
    uniforms.uRidgeStrength.value = damp(uniforms.uRidgeStrength.value, values.ridgeStrength)
    uniforms.uFoldTwist.value = damp(uniforms.uFoldTwist.value, values.foldTwist)
    uniforms.uPoleAmount.value = damp(uniforms.uPoleAmount.value, values.poleAmount)
    uniforms.uSurfacePoleAmount.value = damp(uniforms.uSurfacePoleAmount.value, values.surfacePoleAmount)
    uniforms.uJelly.value = damp(uniforms.uJelly.value, values.motionStyle === 'jelly' ? 1 : 0)
    uniforms.uModesA.value.lerp(targetModesA, blend)
    uniforms.uModesB.value.lerp(targetModesB, blend)
    uniforms.uModesC.value.lerp(targetModesC, blend)
    uniforms.uModesD.value.lerp(targetModesD, blend)
    uniforms.uGlassFactor.value = damp(uniforms.uGlassFactor.value, values.transmission * (1 - values.metalness))
    uniforms.uProto.value = damp(uniforms.uProto.value, values.presetName === 'Protocool' && values.shapeMode === 'reference' ? 1 - values.transmission * (1 - values.metalness) : 0)
    uniforms.uProtoColor.value.lerp(targetColor, blend)
    uniforms.uProtoLightA.value.set(values.light1Color)
    uniforms.uProtoLightB.value.set(values.light2Color)
    uniforms.uProtoLightC.value.set(values.light3Color)
    uniforms.uProtoLightGain.value = damp(uniforms.uProtoLightGain.value, values.lightIntensity)
    uniforms.uProtoRoughness.value = damp(uniforms.uProtoRoughness.value, values.roughness)
    uniforms.uProtoMetalness.value = damp(uniforms.uProtoMetalness.value, values.metalness)
    uniforms.uProtoEnvIntensity.value = damp(uniforms.uProtoEnvIntensity.value, values.envIntensity)
    uniforms.uProtoAmbient.value = damp(uniforms.uProtoAmbient.value, values.ambient)
    uniforms.uProtoClearcoat.value = damp(uniforms.uProtoClearcoat.value, values.clearcoat)
    uniforms.uProtoCoatRoughness.value = damp(uniforms.uProtoCoatRoughness.value, values.clearcoatRoughness)
    uniforms.uProtoIridescence.value = damp(uniforms.uProtoIridescence.value, values.iridescence)
    uniforms.uReferenceTint.value = damp(uniforms.uReferenceTint.value, values.shapeMode === 'reference' ? 1 : 0)
    uniforms.uTintA.value.lerp(targetPalette[0], blend)
    uniforms.uTintB.value.lerp(targetPalette[1], blend)
    uniforms.uTintC.value.lerp(targetPalette[2], blend)
    if (material.current) {
      const mat = material.current
      mat.color.lerp(targetColor, blend)
      mat.metalness = damp(mat.metalness, values.metalness)
      mat.roughness = damp(mat.roughness, Math.max(0.045, values.roughness))
      mat.clearcoat = damp(mat.clearcoat, values.clearcoat)
      mat.clearcoatRoughness = damp(mat.clearcoatRoughness, values.clearcoatRoughness)
      mat.envMapIntensity = damp(mat.envMapIntensity, values.envIntensity * (values.shapeMode === 'reference' ? 0.55 : 1))
      mat.ior = damp(mat.ior, values.ior)
      mat.iridescence = damp(mat.iridescence, values.iridescence)
      mat.thickness = damp(mat.thickness, values.thickness)
      mat.attenuationDistance = damp(mat.attenuationDistance, values.attenuationDistance)
      mat.attenuationColor.lerp(targetAttenuationColor, blend)
      mat.opacity = damp(mat.opacity, values.opacity)
      const transparent = values.opacity < 0.999 || mat.opacity < 0.999
      if (mat.transparent !== transparent) { mat.transparent = transparent; mat.needsUpdate = true }
      const transmission = damp(mat.transmission, values.transmission)
      mat.transmission = values.transmission === 0 && transmission < 0.001 ? 0 : transmission
    }
    if (orientation.current) {
      const rotation = values.shapeMode === 'reference' && Array.isArray(values.referenceRotation) ? values.referenceRotation : [0, 0, 0]
      orientation.current.rotation.x = damp(orientation.current.rotation.x, Number.isFinite(rotation[0]) ? rotation[0] : 0)
      orientation.current.rotation.y = damp(orientation.current.rotation.y, Number.isFinite(rotation[1]) ? rotation[1] : 0)
      orientation.current.rotation.z = damp(orientation.current.rotation.z, Number.isFinite(rotation[2]) ? rotation[2] : 0)
    }
    if (mesh.current) {
      const style = values.motionStyle
      const animationTime = clock.current.shape
      const tilt = style === 'wobble' ? 0.28 : style === 'spin' ? 0.08 : 0.13
      const twist = style === 'wobble' ? 0.13 : style === 'pulse' ? 0.07 : 0.03
      const spin = style === 'spin' ? 1.65 : style === 'breathe' ? 0.55 : 1.0
      const breathe = style === 'breathe' ? 0.055 : style === 'pulse' ? 0.085 : 0.0
      mesh.current.rotation.y += (reducedMotion ? 0 : dt) * clock.current.rotationSpeed * spin
      mesh.current.rotation.x = damp(mesh.current.rotation.x, Math.sin(animationTime * 0.35) * tilt)
      mesh.current.rotation.z = damp(mesh.current.rotation.z, Math.sin(animationTime * 0.25) * twist)
      clock.current.scale = damp(clock.current.scale, values.size * (1 + breathe * Math.sin(animationTime * (style === 'pulse' ? 1.1 : 0.45))))
      const jiggle = 0.045 * uniforms.uJelly.value * Math.sin(animationTime * 2.0)
      mesh.current.scale.set(clock.current.scale * (1 + jiggle), clock.current.scale * (1 - jiggle * 1.15), clock.current.scale * (1 + jiggle * 0.5))
    }
  })

  const segments = Math.max(24, Math.min(512, Math.round(values.segments)))
  return (
    <group ref={orientation}><mesh ref={mesh} scale={initial.size}>
      <sphereGeometry args={[1, segments, Math.max(16, Math.round(segments * 0.75))]} />
      <meshPhysicalMaterial
        ref={material}
        color={initial.color}
        metalness={initial.metalness}
        roughness={Math.max(0.045, initial.roughness)}
        clearcoat={initial.clearcoat}
        clearcoatRoughness={initial.clearcoatRoughness}
        transmission={initial.transmission}
        ior={initial.ior}
        iridescence={initial.iridescence}
        thickness={initial.thickness}
        attenuationDistance={initial.attenuationDistance}
        attenuationColor={initial.attenuationColor}
        opacity={initial.opacity}
        transparent={initial.opacity < 0.999}
        envMapIntensity={initial.envIntensity}
        onBeforeCompile={compile}
      />
    </mesh></group>
  )
}

/** Transparent 3D viewport. The parent owns layout and background color. */
export default function BlobScene({ params = {}, backgroundImage = null, interactive = true, resetCameraKey = 0, resetAnimationKey = 0, ariaLabel = "Animated three-dimensional blob", reducedMotion = false }) {
  const values = { ...defaults, ...params }
  return (
    <Canvas
      dpr={[1, 1.6]}
      camera={{ position: [0, 0, 5.1], fov: 38, near: 0.1, far: 100 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0)
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.0
      }}
      aria-label={ariaLabel}
    >
      <Suspense fallback={null}>
        <SceneBackground color={values.background} imageUrl={backgroundImage} reducedMotion={reducedMotion} />
        <StudioEnvironment />
        <SmoothAmbient intensity={values.ambient} reducedMotion={reducedMotion} />
        {values.shapeMode === 'reference' ? [1, 2, 3].map((n) => <ReferenceSpot key={n}
          color={values[`light${n}Color`]}
          position={values[`light${n}Position`] || [[3, 4, 5], [-4, 1, 3], [0, -3, 4]][n - 1]}
          intensity={(values[`light${n}Intensity`] ?? 2) * values.lightIntensity * 0.5}
          angle={Math.max(0.05, Math.min(Math.PI / 2, values[`light${n}Angle`] ?? 0.8))}
          distance={values[`light${n}Distance`] ?? 0}
          penumbra={values[`light${n}Penumbra`] ?? 1}
          decay={values[`light${n}Decay`] ?? 0}
          reducedMotion={reducedMotion} />) : <>
          <SmoothLight position={[3, 4, 5]} color={values.light1Color} intensity={values.lightIntensity} reducedMotion={reducedMotion} />
          <SmoothLight position={[-4, 1, 3]} color={values.light2Color} intensity={values.lightIntensity * 0.8} reducedMotion={reducedMotion} />
          <SmoothLight position={[0, -3, -2]} color={values.light3Color} intensity={values.lightIntensity * 0.8} reducedMotion={reducedMotion} />
        </>}
        <Blob values={values} reducedMotion={reducedMotion} resetAnimationKey={resetAnimationKey} />
        <CameraControls enabled={interactive} resetCameraKey={resetCameraKey} />
      </Suspense>
    </Canvas>
  )
}
