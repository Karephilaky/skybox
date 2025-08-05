import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'

let scene, camera, renderer, controls, clock
let mixer, animationAction
let thanosModel = null
let gangnamClip = null
let animationIsPlaying = true

init()
animate()

function init() {
  // Escena
  scene = new THREE.Scene()

  // Cámara
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100)
  camera.position.set(0, 2, 6)

  // Renderizador
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.outputEncoding = THREE.sRGBEncoding
  document.body.appendChild(renderer.domElement)

  // Controles
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true

  // Luces
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1)
  scene.add(hemiLight)

  const dirLight = new THREE.DirectionalLight(0xffffff, 1)
  dirLight.position.set(3, 10, 10)
  scene.add(dirLight)

  // Reloj
  clock = new THREE.Clock()

  // HDR - Fondo de noche
  const rgbeLoader = new RGBELoader()
  rgbeLoader.load('/hdr/noche.hdr', (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping
    scene.environment = texture
    scene.background = texture
  })

  // Cargar textura de Thanos
  const textureLoader = new THREE.TextureLoader()
  const thanosTexture = textureLoader.load('/models/thanos.png')

  // Cargar modelo FBX
  const fbxLoader = new FBXLoader()
  fbxLoader.load('/models/thanos_gangnam.fbx', (fbx) => {
    thanosModel = fbx
    thanosModel.scale.set(0.01, 0.01, 0.01) // Ajusta según sea necesario
    scene.add(thanosModel)

    // Aplicar textura a cada malla
    thanosModel.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({
          map: thanosTexture,
        })
        child.material.needsUpdate = true
      }
    })

    console.log("✅ Modelo y textura de Thanos aplicados.")

    // Crear mixer con animación embebida (si hay)
    mixer = new THREE.AnimationMixer(thanosModel)
    if (fbx.animations.length > 0) {
      animationAction = mixer.clipAction(fbx.animations[0])
      animationAction.play()
    }

    if (gangnamClip) aplicarAnimacion()
  })

  // Cargar animación externa (opcional)
  const gltfLoader = new GLTFLoader()
  gltfLoader.load('/models/Gangnam_Style.glb', (gltf) => {
    if (gltf.animations.length > 0) {
      gangnamClip = gltf.animations[0]
      console.log("✅ Animación Gangnam Style cargada.")
    }

    if (thanosModel) aplicarAnimacion()
  })

  // Botón toggle
  const toggleBtn = document.getElementById('toggle')
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      if (!animationAction) return
      animationIsPlaying = !animationIsPlaying
      animationAction.paused = !animationIsPlaying
      toggleBtn.textContent = animationIsPlaying ? 'Pausar animación' : 'Reanudar animación'
    })
  }

  // Responsive
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  })
}

function aplicarAnimacion() {
  if (!mixer || !gangnamClip) return

  animationAction = mixer.clipAction(gangnamClip)
  animationAction.play()
  console.log("🎵 Animación externa aplicada a Thanos.")
}

function animate() {
  requestAnimationFrame(animate)
  const delta = clock.getDelta()
  if (mixer && animationIsPlaying) mixer.update(delta)
  controls.update()
  renderer.render(scene, camera)
}
