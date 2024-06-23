import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import MidiPlayer from 'midi-player-js';
import { RGBELoader } from 'three/examples/jsm/Addons.js';

window.pianoLoaded=false;
window.musicLoaded=false;
const scene = new THREE.Scene();
scene.background = new THREE.Color( 0xf6eedc );

const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 10000 );
const renderer = new THREE.WebGLRenderer();
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

camera.position.set(0,1200,1600)
camera.rotation.set(-0.73,0,0)

const light = new THREE.AmbientLight( 0x909090 ); // soft white light

scene.add( light );

const controls = new OrbitControls( camera, renderer.domElement );

const audio = new Audio("/src/mp3/polka4.mp3");

function animate() {
    if(!window.pianoLoaded && !window.musicLoaded){
        requestAnimationFrame(animate)
        return;
    }

	renderer.render( scene, camera );
    for (let keyNumber = 0; keyNumber < keys.length; keyNumber++) {
        const isPressed = keys[keyNumber];
        rotateKey(keyNumber, isPressed, velocities[keyNumber]);
    }

    //controls.update();
    //console.log(camera.position)
    requestAnimationFrame( animate );

}

const keys = new Array(88).fill(false); // Initialize all keys as not pressed
const velocities = new Array(88).fill(0); // Initialize all velocities as 0
// Event method triggered when a key is pressed or released
function handleKeyEvent(event) {
    if(event.noteNumber ==null) return;
    //==console.log(event.noteNumber)
    const keyNumber = event.noteNumber; // Get the key number
    const velocity = event.velocity; // Get the velocity
    //console.log(event)

    if (velocity !== 0 && event.name == "Note on") {
        // Key is pressed
        keys[keyNumber] = true;
        velocities[keyNumber] = velocity;
        //console.log("press")
    } else {
        // Key is released
        keys[keyNumber] = false;
        velocities[keyNumber] = velocity;
        //console.log("release")
    }
}

function rotateKey(keyNumber, isPressed, vel) {
    const key = window.keys.children[keyNumber-21]
    //console.log(key,keyNumber)
    let per = vel/32;
    if(per==null) per=0;
    if(isNaN(per)) per=0;
    per = Math.abs(per);
    //console.log(per)
    if(per ==0 && isPressed) console.log("missed note")
    if (key) {
        if (isPressed) {
            // Rotate the key slightly
            //key.roateOnAxis(new THREE.Vector3(1,0,0), 0.002)
            //key.
            //console.log(key.name)
            if(per==0)
            key.rotation.x += 0.015;
            else
            key.rotation.x += 0.015*per;
            // Check if the key has rotated far enough, and stop if necessary
            if (key.rotation.x >= .15) {
                key.rotation.x = .15;
            }
        } else {
            if(per==0) 
            key.rotation.x -= 0.015;
            else
            key.rotation.x -= 0.015*per;
            // Check if the key has rotated far enough, and stop if necessary
            if (key.rotation.x <= 0) {
                key.rotation.x = 0;
            }
        // //     // Rotate the key in the opposite direction when released
        //      key.rotation.x -= 0.02;
        // //     // Check if the key has rotated back to its original position, and stop if necessary
        //      if (key.rotation.x <= 0) {
        //          key.rotation.x = 0;
        //      }
         }
    }
}

animate();

const loader = new GLTFLoader();

loader.load( './assets/Piano6162024.glb', function ( gltf ) {
	scene.add( gltf.scene );
    window.piano = gltf.scene
    window.keys= window.piano.children[0].children[0].children[0].children.find(Object => Object.name == "piano_key");
    console.log(gltf.scene)
    window.pianoLoaded=true;
}, undefined, function ( error ) {

	console.error( error );

} );


console.log(MidiPlayer)
const Player = new MidiPlayer.Player(function(event) {
	//console.log(event);
});

Player.on('fileLoaded', function() {

    console.log("loaded");

    console.log(window.keys.children);
    //const worldPosition = new THREE.Vector3(0,100,100);

    // Get the world position of the object
    const lkey = window.keys.children[1];
    //lkey.getWorldPosition(worldPosition);
    //lkey.setRotationFromAxisAngle(new THREE.Vector3(1,0,0), 1)
    //lkey.setp
    //lkey.rotation.x = 1;
    console.log(lkey);
    // Do something when file is loaded
});

Player.on('playing', function(currentTick) {
    //console.log("playing rn!");
    // Do something while player is playing
    // (this is repeatedly triggered within the play loop)
});

let started=false;
Player.on('midiEvent', function(event) {
    handleKeyEvent(event)
    if(!started){
        if(event.name == "Note on"){
            started=true;
            audio.play();
            console.log("started")
        }
    }
    //console.log(event)
    // Do something when a MIDI event is fired.
    // (this is the same as passing a function to MidiPlayer.Player() when instantiating.
});

Player.on('endOfFile', function() {
    console.log("end");
    keys.fill(false);
    // Do something when end of the file has been reached.
});


window.player = Player;
// Load a MIDI file
var reader = new FileReader();
document.querySelector('input').addEventListener('change', () => {
    var file = document.querySelector('input[type=file]').files[0];
    if (file) reader.readAsArrayBuffer(file);
    console.log(reader)
    reader.addEventListener("load", function () {
        console.log("kiad")
        Player.loadArrayBuffer(reader.result);
        Player.play();
        window.musicLoaded=true;
    })
})

new RGBELoader().load( '/src/hdr/city.hdr', function ( texture ) {

    texture.mapping = THREE.EquirectangularReflectionMapping;

    //scene.background = texture;
    scene.environment = texture;
    renderer.toneMappingExposure = 0.5;
	renderer.render( scene, camera );

    // model


} );


function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

    render();

}

window.addEventListener( 'resize', onWindowResize);