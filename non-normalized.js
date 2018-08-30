var scene, lights, camera, renderer, controls, data;

// Scene
scene = new THREE.Scene();

// Lights
lights = [];
lights[0] = new THREE.PointLight(0xffffff, 1, 0);
lights[1] = new THREE.PointLight(0xffffff, 1, 0);
lights[2] = new THREE.PointLight(0xffffff, 1, 0);

lights[0].position.set(0, 200, 0);
lights[1].position.set(100, 200, 100);
lights[2].position.set(-100, -200, -100);

scene.add(lights[0]);
scene.add(lights[1]);
scene.add(lights[2]);

// Camera
camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(70,510,105);

// Renderer
renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0xfff6e6);
document.body.appendChild(renderer.domElement);

// Controls
controls = new THREE.OrbitControls(camera, renderer.domElement);

// Axes Helper
var axesHelper = new THREE.AxesHelper(100);
scene.add(axesHelper);

function fetchData() {
  return fetch('/recessions.json')
    .then(function(resp) {
      return resp.json();
    })
    .then(function(resp) {
      return resp;
    });
}

function init() {
  fetchData()
    .then(function(resp) {
      data = resp;
      makeSpheresFromData(data, scene)
    });

  render();
}

function makeSpheresFromData(data, scene) {
  const colors = {
      2: 'red',
      3: 'blue',
      4: 'green',
    };

  data.forEach(function(d) {
    const geometry = new THREE.SphereGeometry(d.num_initial_consecutive_decreases, 32, 32);
    const material = new THREE.MeshBasicMaterial({ color: colors[d.num_initial_consecutive_decreases] });
    const sphere = new THREE.Mesh(geometry, material);
    var multiplier = 1000;
    sphere.position.set(d.bottom_to_end * multiplier - (multiplier - multiplier / 10), d.num_quarters * 30, d.start_to_bottom * multiplier - (multiplier - multiplier / 10));
    sphere.name = d.quarter;
    scene.add(sphere);
  });
}

init();

function render() {
  requestAnimationFrame(render);
  controls.update();
  renderer.render(scene, camera);
}
