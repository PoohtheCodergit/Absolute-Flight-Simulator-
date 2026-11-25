  // Import Declarations
  import * as THREE from 'three';
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
  import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
  import planeModelUrl from 'url:./Boeing_787-8_Dreamliner_Nolivery.glb';
  import * as dat from 'dat.gui';
  import { Sky } from 'three/examples/jsm/objects/Sky.js';
  import { LightingConfig, SkyParameters } from './config/Lighting.js';
  import { Input, registerInput } from './inputs/inputManager.js'
  import { planeParts, registerPlaneParts } from './config/PlaneParts.js';
  import { UniversalFlightEngine } from './physics/Physics.js';
  const world = new UniversalFlightEngine();
  // Renderer & Scene Setup
  const gui = new dat.GUI();
  const renderrr = new THREE.WebGLRenderer({ antialias: true });
  renderrr.shadowMap.enabled = true;
  renderrr.shadowMap.type = THREE.PCFSoftShadowMap;
  renderrr.setSize(window.innerWidth, window.innerHeight);
  renderrr.outputColorSpace = THREE.SRGBColorSpace;
  renderrr.toneMapping = THREE.ACESFilmicToneMapping;
  document.body.appendChild(renderrr.domElement);

  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 20000);
  cam.position.set(0, 35, 120);

  const MouseScroll = new OrbitControls(cam, renderrr.domElement);
  MouseScroll.target.set(0, 2, 0);
  MouseScroll.enableDamping = true;
  MouseScroll.dampingFactor = 0.05;
  MouseScroll.update();

  window.addEventListener('resize', () => {
    cam.aspect = window.innerWidth / window.innerHeight;
    cam.updateProjectionMatrix();
    renderrr.setSize(window.innerWidth, window.innerHeight);
  });


  // Physics Enine

  // Environment & Lighting
  function generateGrassTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

ctx.fillStyle = '#2f6b2f';
ctx.fillRect(0, 0, 512, 512);

for (let i = 0; i < 20000; i++) {

  const x = Math.random() * 512;
  const y = Math.random() * 512;

  const shade =
    30 + Math.random() * 30;

  ctx.fillStyle =
    `rgb(${shade},${100 + shade},${shade})`;

  ctx.fillRect(
    x,
    y,
    2,
    2
  );

}

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(250, 250);
    return texture;
  }

  const grassTexture = generateGrassTexture();
  const planeR = new THREE.PlaneGeometry(100000, 100000);
  const PlaneRMatte = new THREE.MeshStandardMaterial({
    map: grassTexture,
    roughness: 0.9,
    metalness: 0.05,
    side: THREE.DoubleSide
  });
  const PLANE = new THREE.Mesh(planeR, PlaneRMatte);
  PLANE.position.set(0, 0, 0);
  PLANE.rotation.x = -Math.PI / 2;
  PLANE.receiveShadow = true;
  scene.add(PLANE);

  const runwayGeo = new THREE.PlaneGeometry(80, 5000);
  const runwayMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });
  const runway = new THREE.Mesh(runwayGeo, runwayMat);
  runway.rotation.x = -Math.PI / 2;
  runway.position.set(0, 1, -2000);
  runway.receiveShadow = true;
  scene.add(runway);

  scene.add(new THREE.AmbientLight(LightingConfig.color, LightingConfig.ambient.intensity));
  scene.add(new THREE.HemisphereLight(LightingConfig.hemisphere.skyColor, LightingConfig.hemisphere.groundColor, LightingConfig.hemisphere.intensity));

  const directionLight = new THREE.DirectionalLight(LightingConfig.color, LightingConfig.sun.intensity);
  directionLight.position.set(500, 1000, 1500);
  directionLight.castShadow = true;
  directionLight.shadow.normalBias = 0.05;
  directionLight.shadow.bias = -0.0001;
  directionLight.shadow.camera.near = 10;
  directionLight.shadow.camera.far = 2000;
  directionLight.shadow.camera.left = -100;
  directionLight.shadow.camera.right = 100;
  directionLight.shadow.camera.top = 100;
  directionLight.shadow.camera.bottom = -100;
  directionLight.shadow.mapSize.set(2048, 2048);
  scene.add(directionLight);

  const sky = new Sky();
  sky.scale.setScalar(45000);
  scene.add(sky);
  const sun = new THREE.Vector3();


  function updateSky() {
    const skyUni = sky.material.uniforms;
    skyUni['turbidity'].value = SkyParameters.turbidity;
    skyUni['rayleigh'].value = SkyParameters.rayleigh;
    skyUni['mieCoefficient'].value = SkyParameters.mieCoefficient;
    skyUni['mieDirectionalG'].value = SkyParameters.mieDirectionalG;
    const phi = THREE.MathUtils.degToRad(90 - SkyParameters.elevation);
    const theta = THREE.MathUtils.degToRad(SkyParameters.azimuth);
    sun.setFromSphericalCoords(1, phi, theta);
    skyUni['sunPosition'].value.copy(sun);
    directionLight.position.copy(sun).multiplyScalar(1000);
    renderrr.toneMappingExposure = SkyParameters.exp;
  }
  updateSky();

  // GUI Setup
  const skyFolder = gui.addFolder('Real-Time Atmosphere');
  skyFolder.add(SkyParameters, 'elevation', 0, 90, 0.1).name('Sun Elevation').onChange(updateSky);
  skyFolder.add(SkyParameters, 'azimuth', 0, 360, 1).name('Sun Azimuth').onChange(updateSky);
  skyFolder.add(SkyParameters, 'rayleigh', 0, 4, 0.1).name('Rayleigh (Sky Color)').onChange(updateSky);
  skyFolder.add(SkyParameters, 'turbidity', 1, 20, 0.1).name('Turbidity (Haze)').onChange(updateSky);
  skyFolder.add(SkyParameters, 'mieCoefficient', 0, 0.1, 0.001).name('Sun Bloom').onChange(updateSky);
  skyFolder.add(SkyParameters, 'mieDirectionalG', 0, 1, 0.01).name('Sun Sharpness').onChange(updateSky);
  skyFolder.add(SkyParameters, 'exp', 0, 1, 0.01).name('Exposure').onChange(updateSky);
  skyFolder.open();

  const flightFolder = gui.addFolder('Flight Controls');
  const flightData = {
    throttlePercent: 0,
    enginePower: 0,
    speedKnots: 0,
    altitudeFeet: 0,
    isGrounded: true,
    gearRetracted: false,
    resetAircraft: function() {
      if (!world) return;
      world.position.set(0, -2, 0);
      world.velocity.set(0, 0, 0);
      world.angularVelocity.set(0, 0, 0);
      world.quaternion.set(0, 0, 0, 1);
      world.throttle = 0;
      world.actualEnginePower = 0;
      world.targetPitch = 0;
      world.targetRoll = 0;
      world.targetYaw = 0;
      world.pitch = 0;
      world.roll = 0;
      world.yaw = 0;
      world.gearTarget = 1.0;
      flightData.throttlePercent = 0;
      flightData.gearRetracted = false;
    }
  };
  flightFolder.add(flightData, 'throttlePercent', 0, 100, 1).name('Throttle (%)').onChange(v => {
    world.throttle = v / 100;
  }).listen();
  flightFolder.add(flightData, 'enginePower').name('N1 Thrust %').listen();
  flightFolder.add(flightData, 'speedKnots').name('Airspeed (kts)').listen();
  flightFolder.add(flightData, 'altitudeFeet').name('Altitude (ft)').listen();
  flightFolder.add(flightData, 'isGrounded').name('On Ground').listen();
  flightFolder.add(flightData, 'gearRetracted').name('Gear Retracted').onChange(v => {
    world.gearTarget = v ? 0.0 : 1.0;
  }).listen();
  flightFolder.add(flightData, 'resetAircraft').name('Reset Flight');
  flightFolder.open();

  registerInput(world, flightData);

  // Model Loading & State
  let plane = null;
  let airplaneContainer = null;
  let airplaneBody = null;
  let bboxMinY = 0;
  const nosePos = new THREE.Vector3();
  const leftPos = new THREE.Vector3();
  const rightPos = new THREE.Vector3();

  const manager = new THREE.LoadingManager();

  async function initAirplane() {
    
    const gltfLoader = new GLTFLoader(manager);
    try {
      const gltf = await new Promise((resolve, reject) => {
        gltfLoader.load(planeModelUrl, resolve, undefined, reject);
      });

  plane = gltf.scene;

  registerPlaneParts(plane);

  //Important. Never remove the following line, even after the site goes live. It is used for debugging and testing purposes.
  console.table(
    Object.keys(planeParts)
  );

  airplaneContainer = new THREE.Group();
  scene.add(airplaneContainer);

  airplaneContainer.add(plane);

  //
  // Calculate bbox BEFORE moving aircraft
  //

  plane.updateMatrixWorld(true);
// ===== Gear Contact Point Debug =====

const sphereGeometry =
  new THREE.SphereGeometry(2);

const noseSphere =
  new THREE.Mesh(
    sphereGeometry,
    new THREE.MeshBasicMaterial({
      color: 0xff0000
    })
  );

const leftSphere =
  new THREE.Mesh(
    sphereGeometry,
    new THREE.MeshBasicMaterial({
      color: 0x00ff00
    })
  );

const rightSphere =
  new THREE.Mesh(
    sphereGeometry,
    new THREE.MeshBasicMaterial({
      color: 0xFFFF00
    })
  );

planeParts["NoseTyres"]?.add(noseSphere);
planeParts["WheelsA"]?.add(leftSphere);
planeParts["WheelsB1"]?.add(rightSphere);

  const bbox =
    new THREE.Box3()
      .setFromObject(plane);

  const center =
    new THREE.Vector3();

  bbox.getCenter(center);

  bboxMinY = bbox.min.y;


  //
  // Place aircraft
  //

  plane.position.set(
    -center.x,
    -bboxMinY-7.05,
    -center.z
  );

  //
  // Apply model orientation
  //

  plane.rotation.y = -Math.PI / 2;

  plane.updateMatrixWorld(true);



  airplaneBody = world;
  MouseScroll.target.copy(
    airplaneBody.position
  );
  MouseScroll.update();

  } 
    catch (err) {
      console.error('Failed to load airplane GLTF', err);
    }
  }
  // Animation & Update Loops
  function animatePlaneParts() {
    if (!world) return;

    if (planeParts["Wings.001"] &&planeParts["Wings.002"]) {
      planeParts["Wings.001"].rotation.z = THREE.MathUtils.lerp(planeParts["Wings.001"].rotation.z, world.roll * 0.3, 0.1);
      planeParts["Wings.002"].rotation.z = THREE.MathUtils.lerp(planeParts["Wings.002"].rotation.z, -world.roll * 0.3, 0.1);
    }
    if (world.gearExtension === 0 && planeParts["NosegearL"]) {
      planeParts["NosegearL"].position.y = THREE.MathUtils.lerp(
        planeParts["NosegearL"].position.y, 
        planeParts["NosegearL"].userData.baseY + 1.5, 
        0.1
      );
    }

    
    if (planeParts["Wings"] && planeParts["Wings.003"]) {
      const liftG = (world.speedKnots / 160) * (1 + Math.abs(world.pitch) * 0.5);
      const flexAngle = world.isGrounded ? 0 : Math.min(0.12, liftG * 0.02);
      planeParts["Wings"].rotation.z = THREE.MathUtils.lerp(planeParts["Wings"].rotation.z, flexAngle, 0.05);
      planeParts["Wings.003"].rotation.z = THREE.MathUtils.lerp(planeParts["Wings.003"].rotation.z, -flexAngle, 0.05);
    }
  }

  //Animation Loop
  const clock = new THREE.Clock();
  function animate() {

    world.targetPitch = Input.pitch;
    world.targetRoll = Input.roll;
    world.targetYaw = Input.yaw;
    world.throttle = Input.throttle;
    world.brakes = Input.brake ? 1 : 0;
    requestAnimationFrame(animate);

const noseGrounded = nosePos.y <= 2.84;
const leftGrounded = leftPos.y <= 2.255;
const rightGrounded = rightPos.y <= 2.20;
const mainsGrounded = leftGrounded && rightGrounded;
const fullGrounded = noseGrounded && mainsGrounded;;
world.noseGrounded = noseGrounded;
world.mainsGrounded = mainsGrounded;
world.fullGrounded = fullGrounded;
    const dt = Math.min(1 / 30, clock.getDelta());
    world.step(dt);
    airplaneContainer.position.copy(airplaneBody.position);
  airplaneContainer.quaternion.copy( airplaneBody.quaternion);
  airplaneContainer.updateMatrixWorld(true);
  planeParts["NoseTyres"]?.getWorldPosition(nosePos);
  planeParts["WheelsA"]?.getWorldPosition(leftPos);
  planeParts["WheelsB1"]?.getWorldPosition(rightPos);
    animatePlaneParts();

    if (airplaneContainer && airplaneBody) {
      const prevTarget =
  MouseScroll.target.clone();
  
//Gear contacts

const newTarget =
  airplaneBody.position.clone()
    .add(
      new THREE.Vector3(
        0,
        3,
        0
      )
    );
const delta =
  newTarget.clone()
    .sub(
      prevTarget
    );

cam.position.add(
  delta
);

MouseScroll.target.copy(
  newTarget
);


//if (Math.random() < 0.01)
//    console.log(noseGrounded, leftGrounded, rightGrounded);

}
    sky.position.copy(cam.position);

    if (world) {
      flightData.enginePower = Math.round(world.actualEnginePower * 100);
      flightData.speedKnots = Math.round(world.speedKnots);
      flightData.altitudeFeet = Math.round(world.altitudeFeet);
      flightData.isGrounded = world.isGrounded;
    }

    MouseScroll.update();
    renderrr.render(scene, cam);
  }


  initAirplane().then(() => {
    animate();
  });
