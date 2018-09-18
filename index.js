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

renderer.setClearColor(0xffffff);
// renderer.setClearColor(0x263238);

document.body.appendChild(renderer.domElement);

// Controls
controls = new THREE.OrbitControls(camera, renderer.domElement);

// var raycaster = new THREE.Raycaster();
// var mouse = new THREE.Vector2(), INTERSECTED;

// function onMouseMove( event ) {
	// calculate mouse position in normalized device coordinates
	// (-1 to +1) for both components
	// mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	// mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
// }

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

      // animateAxis(new THREE.Vector3(0,0,0), new THREE.Vector3(70,0,0), 'x');
      // animateAxis(new THREE.Vector3(0,0,0), new THREE.Vector3(0,70,0), 'y');
      // animateAxis(new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,70), 'z');
});

  render();
}

function animateAxis(start, end, axis, color = 0x0000ff, duration = 700) {
  var material = new THREE.LineBasicMaterial( { color: color } );
  var geometry = new THREE.Geometry();
  geometry.vertices.push(start);
  geometry.vertices.push(end);
  var line = new THREE.Line( geometry, material );
  line.name = axis + '-axis'
  line.scale[axis] = 0.0001;
  scene.add(line);

  const tween = new TWEEN.Tween(line.scale)
    .to({ [axis]: 1 }, duration);

  tween.start();
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
      var message = "   % Decrease\nStart to Bottom";
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
      var message = "  % Increase\nBottom to End";
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
    TWEEN.update();
  requestAnimationFrame(render);
  controls.update();

  // raycaster.setFromCamera( mouse, camera );

  // calculate objects intersecting the picking ray
	// var intersects = raycaster.intersectObjects( scene.children );

  // if ( intersects.length > 0 ) {
    // if ( INTERSECTED != intersects[ 0 ].object ) {
      // INTERSECTED = intersects[ 0 ].object;
      // console.log(INTERSECTED.name);
    // }
  // }

	// for ( var i = 0; i < intersects.length; i++ ) {
  //
	// 	intersects[ i ].object.material.color.set( 0xff0000 );
  //
	// }

  renderer.render(scene, camera);

}

// window.addEventListener('mousemove', onMouseMove);
