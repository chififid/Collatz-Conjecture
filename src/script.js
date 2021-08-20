import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'dat.gui'

// Math
function rotate(origin, point, angle) {
    const ox = origin.x
    const oy = origin.y
    const px = point.x
    const py = point.y

    const qx = ox + Math.cos(angle) * (px - ox) - Math.sin(angle) * (py - oy)
    const qy = oy + Math.sin(angle) * (px - ox) + Math.cos(angle) * (py - oy)

    return { x: qx, y: qy }
}

function degreeToRadians(degree) {
    return degree * Math.PI / 180
}

// Debug
const gui = new dat.GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

// Materials
const pointMaterial = new THREE.PointsMaterial({
    size: 0.03
})
const lineMaterial = new THREE.LineBasicMaterial({
    size: 0.03,
    color: 0x0000ff
})

// Collatz Conjecture
function action(generation, graph) {
    if (generation === 0) {
        for (let key in graph) {
            let num = key * 2
            graph[key][num.toString()] = {}
            num = (key - 1) / 3
            if (num % 1 === 0 && num > 1) {
                graph[key][num.toString()] = {}
            }
        }
    } else {
        for (let key in graph) {
            action(generation - 1, graph[key])
        }
    }
}

const maxGenerations = 40

let graph = {1: {}}

for (let generation = 0; generation < maxGenerations; generation++) {
    action(generation, graph)
}

console.log(graph)

// Objects
const geometry = new THREE.BufferGeometry

const posArray = []

function graphGeometry(generation, graph, lastPointCordinations, lastAngle) {
    for (let key in graph) {
        let newPointCordinations = { ...lastPointCordinations }
        newPointCordinations.y += 0.1
        let rotatedNewPointCordinations = newPointCordinations
        if (key % 2 === 0) {
            lastAngle -= degreeToRadians(10)
            rotatedNewPointCordinations = rotate(lastPointCordinations, newPointCordinations, lastAngle)
        } else {
            lastAngle += degreeToRadians(30)
            rotatedNewPointCordinations = rotate(lastPointCordinations, newPointCordinations, lastAngle)
        }
        newPointCordinations.x = rotatedNewPointCordinations.x
        newPointCordinations.y = rotatedNewPointCordinations.y
        posArray.push(newPointCordinations.x, newPointCordinations.y, newPointCordinations.z)
        if (generation > 0) {
            graphGeometry(generation - 1, graph[key], newPointCordinations, lastAngle)
        }
        posArray.push(newPointCordinations.x, newPointCordinations.y, newPointCordinations.z)
    }
}

graphGeometry(maxGenerations, graph, { x: 0, y: 0, z: 0 }, 0)

geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(posArray), 3))

// Mesh
const sphere = new THREE.Points(geometry, pointMaterial)
const lines = new THREE.Line(geometry, lineMaterial)
scene.add(sphere)
scene.add(lines)

// Params gui
const cameraPosition = {
    z: 4.6,
    y: 2.6
}

const guiParams = [
    {
        obj: cameraPosition,
        prop: 'z',
        min: 0,
        max: 10,
        step: 0.01
    },
    {
        obj: cameraPosition,
        prop: 'y',
        min: 0,
        max: 10,
        step: 0.01
    }
]

for (let i = 0; i < guiParams.length; i++) {
    gui.add(guiParams[i].obj, guiParams[i].prop).min(guiParams[i].min).max(guiParams[i].max).step(guiParams[i].step)
}

// Lights

const pointLight = new THREE.PointLight(0xffffff, 0.1)
pointLight.position.x = 2
pointLight.position.y = 3
pointLight.position.z = 4
scene.add(pointLight)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 0
camera.position.y = 0
camera.position.z = 2
scene.add(camera)

// Controls
// const controls = new OrbitControls(camera, canvas)
// controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Animate
 */

const clock = new THREE.Clock()

const tick = () =>
{
    
    const elapsedTime = clock.getElapsedTime()

    // Update objects
    sphere.rotation.y = .5 * elapsedTime
    lines.rotation.y = .5 * elapsedTime
    camera.position.z = cameraPosition.z
    camera.position.y = cameraPosition.y

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()