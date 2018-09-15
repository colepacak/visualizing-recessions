var scene, lights, camera, renderer, controls, data;

// Scene
scene = new THREE.Scene();

// Lights
lights = [];
lights[0] = new THREE.PointLight(0xffffff, 1, 400);
lights[1] = new THREE.PointLight(0xffffff, 1, 400);
lights[2] = new THREE.PointLight(0xffffff, 1, 400);

lights[0].position.set(100, 100, 0);
lights[1].position.set(0, 50, 100);
lights[2].position.set(100, 50, 100);

scene.add(lights[0]);
scene.add(lights[1]);
scene.add(lights[2]);

// Camera
camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(100,50,100);

// Renderer
renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

// renderer.setClearColor(0xffffff);
renderer.setClearColor(0x263238);

document.body.appendChild(renderer.domElement);

// Controls
controls = new THREE.OrbitControls(camera, renderer.domElement);

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
      addSpheresFromData(data, scene);
      addGrids();
      addAxisLabels();
});

  render();
}

function addGrids() {
  var size = 60;
  var divisions = 5;
  var color = 0xe0e0e0;

  var gridXZ = new THREE.GridHelper(size, divisions, color, color);
  gridXZ.position.set(size / 2, 0, size / 2);
  gridXZ.name = 'gridXZ';
  scene.add(gridXZ);

  var gridYZ = new THREE.GridHelper(size, divisions, color, color);
  gridYZ.position.set(0, size / 2, size / 2);
  gridYZ.setRotationFromAxisAngle(new THREE.Vector3(0,0,1), Math.PI / 2);
  gridYZ.name = 'gridYZ';
  scene.add(gridYZ);

  var gridXY = new THREE.GridHelper(size, divisions, color, color);
  gridXY.position.set(size / 2, size / 2, 0);
  gridXY.setRotationFromAxisAngle(new THREE.Vector3(1,0,0), Math.PI / 2);
  gridXY.name = 'gridXY';
  scene.add(gridXY);
}

function addSpheresFromData(data, scene) {
  const colors = {
      5: 0x29b6f6, // blue
      6: 0x66bb6a, // green
      7: 0xef5350, // red
    };

  data.forEach(function(d) {
    const geometry = new THREE.SphereGeometry(d.num_initial_consecutive_decreases_norm, 32, 32);
    const material = new THREE.MeshLambertMaterial({ color: colors[d.num_quarters] });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(d.start_to_bottom_norm * 5, d.num_quarters_norm * 5, d.bottom_to_end_norm * 5);
    sphere.name = d.quarter;
    scene.add(sphere);
  });
}

function addAxisLabels() {
  var loader = new THREE.FontLoader();
    loader.load('fonts/helvetiker_regular.typeface.json', function(font) {
      var material = new THREE.MeshBasicMaterial({
        color: 0x64b5f6,
        transparent: true,
        side: THREE.DoubleSide
      });
      var size = 5;

      // x-axis
      var message = "Start to Bottom";
      var shapes = font.generateShapes(message, size);
      var geometry = new THREE.ShapeBufferGeometry(shapes);
      var xText = new THREE.Mesh(geometry, material);
      xText.name = 'label-x-axis';
      xText.position.x = 7;
      xText.position.y = -5;
      xText.position.z = 65;
      xText.rotation.x = -1 * Math.PI / 4
      scene.add(xText);
      // y-axis

      var message = "Length (Quarters)";
      var shapes = font.generateShapes(message, size);
      var geometry = new THREE.ShapeBufferGeometry(shapes);
      var yText = new THREE.Mesh(geometry, material);
      yText.name = 'label-y-axis';
      yText.position.x = -5;
      yText.position.y = 57;
      yText.position.z = 65;
      yText.rotation.y = Math.PI / 4;
      yText.rotation.z =  -1 * Math.PI / 2;
      scene.add(yText);

      // z-axis
      var message = "Bottom to End";
      var shapes = font.generateShapes(message, size);
      var geometry = new THREE.ShapeBufferGeometry(shapes);
      var zText = new THREE.Mesh(geometry, material);
      zText.name = 'label-z-axis';
      zText.position.x = 65;
      zText.position.y = -5;
      zText.position.z = 52;
      zText.rotation.order = 'YXZ';
      zText.rotation.x = -1 * Math.PI / 4;
      zText.rotation.y = Math.PI / 2;
      scene.add(zText);
    });
}

init();

function render() {
  requestAnimationFrame(render);
  controls.update();
  renderer.render(scene, camera);
}
