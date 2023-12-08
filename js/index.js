// import * as THREE from '../node_modules/three/src/Three.js';
// import { TrackballControls } from '../node_modules/three/examples/jsm/controls/TrackballControls.js';
// import { OrbitControls } from '../node_modules/three/examples/jsm/controls/OrbitControls.js';
// import { GLTFLoader } from '../node_modules/three/examples/jsm/loaders/GLTFLoader.js';
// import { RGBELoader } from '../node_modules/three/examples/jsm/loaders/RGBELoader.js';

//Gui Tools
// import Stats from '../node_modules/three/examples/jsm/libs/stats.module.js';
// import { GUI } from '../node_modules/three/examples/jsm/libs/lil-gui.module.min.js';

import * as THREE from '../modules/three/src/Three.js';
import { TrackballControls } from '../modules/three/jsm/controls/TrackballControls.js';
import { OrbitControls } from '../modules/three/jsm/controls/OrbitControls.js';
import { GLTFLoader } from '../modules/three/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from '../modules/three/jsm/loaders/RGBELoader.js';

//Gui Tools
import Stats from '../modules/three/jsm/libs/stats.module.js';
import { GUI } from '../modules/three/jsm/libs/lil-gui.module.min.js';

let gui;

let resolutions = [
    {w: 360, h: 640},
    {w: 375, h: 667},
    {w: 414, h: 896},
    {w: 640, h: 400},
    {w: 960, h: 540},
    {w: 1024, h: 768},
    {w: 1280, h: 800},
    {w: 1366, h: 768},
    {w: 1536, h: 864},
    {w: 1920, h: 1080},
];
let resolutions_index = {value: 3};

const hrdTextureURL = new URL( '../hdr/Simple_Sky_01.hdr', import.meta.url );

// Scene
const scene = new THREE.Scene();

// Set default world UP axis
// THREE.Object3D.DefaultUp = new THREE.Vector3(0,0,1);

// Camera
let FOV
let FAR
let NEAR = 0.6

// Mobile camera
if (canvas.width <= 768) {
  FOV = 50
  FAR = 1200
  // 769px - 1080px screen width camera
} else if (canvas.width >= 769 && canvas.width <= 1080) {
  FOV = 50
  FAR = 1475
  // > 1080px screen width res camera
} else {
  FOV = 40
  FAR = 1800
}

const camera = new THREE.PerspectiveCamera(
  FOV,
  canvas.width / canvas.height,
  NEAR,
  FAR
)
camera.position.z = 10; // Set camera position
camera.position.y = 8; // Set camera position

// Renderer
let pixelRatio = window.devicePixelRatio
let AA = true
if (pixelRatio > 1) {
  AA = false
}
const renderer = new THREE.WebGLRenderer({
    canvas:canvas,
    antialias: AA, 
    powerPreference: "high-performance",
});

//Tone Mapping and HDR
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
// renderer.shadowMap.enabled = true;
// renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap

// renderer.shadowMap.enabled = true;
renderer.setClearColor("#233143"); // Set background colour
renderer.setSize(canvas.width, canvas.height);
document.body.appendChild(renderer.domElement); // Add renderer to HTML as a canvas element

const hdr_loader = new RGBELoader();
hdr_loader.load( hrdTextureURL, function(texture) {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = texture;
    scene.environment = texture;
});

// const gridHelper = new THREE.GridHelper(30);
// scene.add(gridHelper);

//Trackball Controls for Camera 
const controls = new OrbitControls(camera, renderer.domElement); 
controls.rotateSpeed = 4;
controls.dynamicDampingFactor = 0.15;

// Axes Helper
// const axesHelper = new THREE.AxesHelper(8);
// axesHelper.rotation.x = -0.5 * Math.PI;
// axesHelper.rotation.z = -1.0 * Math.PI;
// scene.add( axesHelper ); // X axis = red, Y axis = green, Z axis = blue

// Module for storing / loading unique lights
class LightLoader {
    constructor() {
        this.lights = {
            ambient: new THREE.AmbientLight( 0xffffff, 0.2 ), 
            sun: new THREE.DirectionalLight( 0xffffff, 1 ), 
        };
    }

    init() {
        scene.add( this.lights.ambient );
        scene.add( this.lights.sun );

        return this.lights
    }
}

// Module for storing / loading unique meshes
class MeshLoader {
    constructor() {
        this.asset_loader = new GLTFLoader();

        this.gltf_files = {
            loot_crate: "Loot_Crate_01.glb",
            ground: "Ground_01.glb",
        }

        this.gltf_meshes = {};

        this.meshes = {
            box: new THREE.BoxGeometry(0.5, 0.5, 1), 
            floor: new THREE.PlaneGeometry( 8, 8 ), 
        };
    }

    init() {
        this.meshes.floor.recieveShadow = true;
        this.meshes.box.castShadow = true;
        return this.meshes;
    }

    load_model() {
        const api = {count: 5};
        const dummy = new THREE.Object3D();

        //create buffer geometry 
        let glTFGeometry = new THREE.BufferGeometry();

        // let loader = new THREE.RGBELoader().setPath( 'textures/equirectangular/' );
        // loader.load( 'pedestrian_overpass_2k.hdr', function ( texture ) {
        //     texture.encoding = THREE.RGBEEncoding;
        //     texture.minFilter = THREE.NearestFilter;
        //     texture.magFilter = THREE.NearestFilter;
        //     texture.flipY = true;
        //     let cubeGenerator = new THREE.EquirectangularToCubeGenerator( texture, { resolution: 1024 } );
        //     cubeGenerator.update( renderer );
        //     let pmremGenerator = new THREE.PMREMGenerator( cubeGenerator.renderTarget.texture );
        //     pmremGenerator.update( renderer );
        //     let pmremCubeUVPacker = new THREE.PMREMCubeUVPacker( pmremGenerator.cubeLods );
        //     pmremCubeUVPacker.update( renderer );
        //     let envMap = pmremCubeUVPacker.CubeUVRenderTarget.texture;
        
        // model
        let loader = new GLTFLoader().setPath( 'models/' );
        for (const [key, value] of Object.entries( this.gltf_files )) {
            loader.load( value, function ( gltf ) {
                gltf.scene.traverse( function ( child ) {
                    if ( child.isMesh ) {
                        // child.material.envMap = envMap;

                        // if ( value == "Loot_Crate_01.glb" ) {
                        //     child.geometry.castShadow = true;
                        // } else {
                        //     child.geometry.recieveShadow = true;
                        // }
    
                        //Setting the buffer geometry
                        glTFGeometry = child.geometry;
    
                    }
                } );
                
                if ( value == "Loot_Crate_01.glb" ) {
                    for ( let x = 0; x < 20; ++x ){
                        for ( let y = 0; y < 20; ++y ){
                            // this.gltf_meshes.loot_crate = this.asset_loader.load( this.gltf_files.loot_crate.href, function(gltf) {
                            const model = gltf.scene.clone()
                            model.position.set( -32+3*x, 0, -32+3*y );
                            scene.add( model );
                            // });
                        }
                    }
                } else {
                    const model = gltf.scene
                    // model.recieveShadow = true;
                    scene.add( model );
                }
            } );
        }
        
        // pmremGenerator.dispose();
        // pmremCubeUVPacker.dispose();
        // scene.background = cubeGenerator.renderTarget;
        // } );

        //use glTFGeometry as buffer geometry.... ie. processGeometry( bufGeometry )
        // processGeometry(glTFGeometry);

        return this.gltf_meshes;
    }
}

// Module for storing / loading unique materials
class MaterialLoader {
    constructor() {
        this.materials = {
            Standard_White: new THREE.MeshLambertMaterial( {color: 0xFFFFFF} ),
        };
    }

    init() {
        return this.materials;
    }
}

// Main manager for all game stuffs
class World_Manager {
    constructor() {
        this.LightLoader = new LightLoader();
        this.MaterialLoader = new MaterialLoader();
        this.MeshLoader = new MeshLoader();
        
        this.lights = {};
        this.materials = {};
        this.meshes = {};
        this.gltf_meshes = {};
        this.objects = {};
    }

    init() {
        this.materials = this.MaterialLoader.init();
        this.meshes = this.MeshLoader.init();
        this.gltf_meshes = this.MeshLoader.load_model();
        this.lights = this.LightLoader.init();
    }

    update() {
        // this.objects.boxMesh_02.rotation.z += 0.1;
    }
}

function create_gui() {
    gui = new GUI();

    // Camera Sub Panel
    const folder_render = gui.addFolder ( `Render` );
    let folder_resolution = gui.addFolder ( `Resolution` );
    folder_render.add(resolutions_index, 'value', 0, resolutions.length-1).step(1);
    
    let test_text = {text: `X:${resolutions[resolutions_index.value].w}, Y:${resolutions[resolutions_index.value].h}`};
    folder_resolution.add(test_text, "text");

    folder_render.onChange( resolutions_index => {
        canvas.width = resolutions[resolutions_index.value].w;
        canvas.height = resolutions[resolutions_index.value].h;
        set_size();

        // Update gui label
        folder_resolution.destroy();
        test_text = {text: `X:${resolutions[resolutions_index.value].w}, Y:${resolutions[resolutions_index.value].h}`};
        folder_resolution = gui.addFolder ( `Resolution` );
        folder_resolution.add(test_text, "text");
        // folder_render.add(test_text, "text");
        // gui.destroy();
        // create_gui();
    });
}

window.addEventListener('load', () => {

    // Check if fullscreen is supported
    const fullscreenEnabled = document.fullscreenEnabled || document.mozFullScreenEnabled || document.documentElement.webkitRequestFullScreen;

    if (fullscreenEnabled) {
        const element = document.documentElement; // You can replace this with the specific element you want to make fullscreen

        // Function to enter fullscreen mode
        function enterFullscreen() {
            if (element.requestFullscreen) {
                element.requestFullscreen();
            } else if (element.mozRequestFullScreen) { // Firefox
                element.mozRequestFullScreen();
            } else if (element.webkitRequestFullScreen) { // Chrome and Safari
                element.webkitRequestFullScreen();
            }
        }

        // Function to exit fullscreen mode
        function exitFullscreen() {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
        }

        // Toggle fullscreen mode
        function toggleFullscreen() {
            if (document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement) {
                exitFullscreen();
            } else {
                enterFullscreen();
            }
        }

        // You can trigger fullscreen based on user interaction, for example, a button click
        const fullscreenButton = document.getElementById('fullscreenButton'); // Replace with your button's ID

        if (fullscreenButton) {
            fullscreenButton.addEventListener('click', toggleFullscreen);
        }
    } else {
        console.log("Fullscreen not supported on this device/browser.");
    }

    canvas.width = resolutions[resolutions_index.value].w;
    canvas.height = resolutions[resolutions_index.value].h;
    set_size();
    create_gui();

    console.log( "Loaded" );
    const main = new World_Manager();
    main.init();

    let stats = new Stats();
    stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild( stats.dom );

    // Rendering Function
    // const rendering = function() {
    //     // Rerender every time the page refreshes (pause when on another tab)
    //     requestAnimationFrame(rendering);
    
    //     main.update();
    
    //     // Update trackball controls
    //     controls.update();
    
    //     renderer.render(scene, camera);

    //     //Refresh Stats Gui
    //     stats.update();
    // }
    // rendering();

    // function animate() {

    //     setTimeout( function() {
    
    //         requestAnimationFrame( animate );
            
            // main.update();
            
            // // Update trackball controls
            // controls.update();

            // renderer.render(scene, camera);

            // //Refresh Stats Gui
            // stats.update();
    //     }, 1000 / 40 );
    // }
    // animate();

    function _30_loop() {
        main.update();
        renderer.render(scene, camera);
    }

    function _60_loop() {
        // Update trackball controls
        controls.update();

        //Refresh Stats Gui
        stats.update();
    }

    let now,delta,then = Date.now();
    let interval = 1000/30;

    function animate() {
        requestAnimationFrame (animate);
        now = Date.now();
        delta = now - then;
        //update time dependent animations here at 30 fps
        if (delta > interval) {
            // Update 30fps
            _30_loop();

            // Update delta time
            then = now - (delta % interval);
        }
        //Update 60fps
        _60_loop();
    }
    animate();
});

window.addEventListener( 'resize', function() {
    set_size();
});

function set_size() {
    renderer.setSize(canvas.width, canvas.height); // Update size
    camera.aspect = window.innerWidth / window.innerHeight; // Update aspect ratio
    camera.updateProjectionMatrix(); // Apply changes

    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`; 
}

