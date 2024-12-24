import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import MidiPlayer from 'midi-player-js';
import { RGBELoader } from 'three/examples/jsm/Addons.js';

let pianoLoaded = false;
let musicLoaded = false;
let piano;
let keys;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf6eedc);
//0xf6eedc
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

camera.position.set(-60, 72.5, 77);
camera.rotation.set(-0.7, -0.57, -0.4);

const light = new THREE.AmbientLight(0x909090); // soft white light
scene.add(light);

const controls = new OrbitControls(camera, renderer.domElement);

const audio = new Audio("/mp3/pirate.mp3");

window.addEventListener('keydown', (event) => {
    console.log(camera.position, camera.rotation, camera.zoom);
});

function animate() {
    if (!pianoLoaded || !musicLoaded) {
        requestAnimationFrame(animate);
        return;
    }

    renderer.render(scene, camera);
    for (let keyNumber = 21; keyNumber < keys.children.length; keyNumber++) {
        const isPressed = keyStates[keyNumber];
        rotateKey(keyNumber, isPressed, velocities[keyNumber]);
    }

    requestAnimationFrame(animate);
}

const keyStates = new Array(88).fill(false); // Initialize all keys as not pressed
const velocities = new Array(88).fill(0); // Initialize all velocities as 0

function handleKeyEvent(event) {
    if (event.noteNumber == null) return;
    const keyNumber = event.noteNumber;
    const velocity = event.velocity;

    if (velocity !== 0 && event.name === "Note on") {
        keyStates[keyNumber] = true;
        velocities[keyNumber] = velocity;
        console.log(keys.children[keyNumber - 21]);
    } else {
        keyStates[keyNumber] = false;
        velocities[keyNumber] = velocity;
        console.log(keys.children[keyNumber - 21]);
    }
}

function rotateKey(keyNumber, isPressed, vel) {
    const key = keys.children[keyNumber - 21];
    let per = vel / 32;
    if (per == null) per = 0;
    if (isNaN(per)) per = 0;
    per = Math.abs(per);

    if (key) {
        if (isPressed) {
            if (key.rotation.x >= 0.15) {
                key.rotation.x = 0.15;
            } else {
                key.rotation.x += 0.015 * (per || 1);
                if (key.rotation.x >= 0.15) {
                    key.rotation.x = 0.15;
                }
            }
        } else {
            if (key.rotation.x <= 0) {
                key.rotation.x = 0;
            } else {
                key.rotation.x -= 0.015 * (per || 1);
                if (key.rotation.x <= 0) {
                    key.rotation.x = 0;
                }
            }
        }
    }
}

animate();

const loader = new GLTFLoader();

loader.load('/assets/piano7272024.glb', function (gltf) {
    scene.add(gltf.scene);
    piano = gltf.scene;
    keys = piano.children[0].children[0].children[0].children.find(object => object.name === "piano_key");
    console.log(gltf.scene);
    console.log(keys);
    pianoLoaded = true;
}, undefined, function (error) {
    console.error(error);
});

const Player = new MidiPlayer.Player(function (event) {
});

Player.on('fileLoaded', function () {
    console.log("loaded");
    console.log(keys.children);
});

Player.on('playing', function (currentTick) {
});

let started = false;
Player.on('midiEvent', function (event) {
    handleKeyEvent(event);
    if (!started) {
        if (event.name === "Note on") {
            started = true;
            audio.play();
            audio.volume = .5;
            console.log("started");
        }
    }
});

Player.on('endOfFile', function () {
    console.log("end");
    keyStates.fill(false);
});

async function readLocalFile(file) {
    fetch(file).then(async (response) => {
        const out = await response.arrayBuffer();
        Player.loadArrayBuffer(out);
        Player.play();
        musicLoaded = true;
    });
}

document.querySelector('input').addEventListener('change', () => {
    const file = document.querySelector('input[type=file]').files[0];
    if (file) reader.readAsArrayBuffer(file);
    reader.addEventListener("load", function () {
        Player.loadArrayBuffer(reader.result);
        Player.play();
        musicLoaded = true;
    });
});

new RGBELoader().load('/hdr/city.hdr', function (texture) {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
    renderer.toneMappingExposure = 0.2;
    renderer.render(scene, camera);
});

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.render(scene, camera);
}

document.getElementById("play").addEventListener("click", () => {
    if (pianoLoaded) {
        readLocalFile('/midi/pirates.mid');
        document.getElementById("play").style.display = "none";
    }
});

window.addEventListener('resize', onWindowResize);
