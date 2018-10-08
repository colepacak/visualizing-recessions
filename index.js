var scene, lights, camera, renderer, controls, grid, data, spheres, labels, raycaster, mouse, dragControls, font;

// Scene
scene = new THREE.Scene();

// Lights
lights = new THREE.Group();
lights.name = 'lights';
light1 = new THREE.PointLight(0xffffff, 1, 400, 1);
light2 = new THREE.PointLight(0xffffff, 1, 400, 2);
light3 = new THREE.PointLight(0xffffff, 1, 400, 1);

light1.position.set(100, 100, 0);
light2.position.set(0, 50, 100);
light3.position.set(100, 50, 100);

lights.add(light1);
lights.add(light2);
lights.add(light3);

scene.add(lights);

// Camera
camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 10000);
camera.position.set(100,50,100);

// Renderer
renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

// Colors
const colorBg = 0x263238;
// const colorBg = 0xffffff;
// const colorLabel = 0x526796;
const colorLabel = 0xe0e0e0;

renderer.setClearColor(colorBg);
document.body.appendChild(renderer.domElement);

// Controls
controls = new THREE.OrbitControls(camera, renderer.domElement);
// Ensure controls rotate around center of scene. Hardcoded to prevent pop.
controls.target.set(30,15,30);

// Spheres
spheres = new THREE.Group();
spheres.name = 'spheres';
scene.add(spheres);

// Labels
labels = new THREE.Group();
labels.name = 'labels';
scene.add(labels);

// Raycaster and mouse
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();

init();

function init() {
  Promise.all([
    fetchData(),
    loadFont()
  ])
    .then(function(resp) {
      data = resp[0];
      font = resp[1];
      addGrid(60)
        .then(function() {
          addLabels();
          addSpheresFromData(data, scene);
        });
    });

  render();
}

function fetchData() {
  return fetch('/recessions.json')
    .then(function(resp) {
      return resp.json();
    })
    .then(function(resp) {
      return resp;
    });
}

function loadFont() {
  return new Promise(function(resolve, reject) {
    var loader = new THREE.FontLoader();
    loader.load('https://codepen.io/colepacak/pen/VEKGjY.js', function(font) {
      resolve(font);
    });
  });
}

function render() {
  tooltipsLookAtCamera();
  TWEEN.update();
  controls.update();
  requestAnimationFrame(render);
  renderer.render(scene, camera);
}

function addGrid(length) {
  return new Promise(function(resolve, reject) {
    grid = new THREE.Group();
    grid.name = 'grid';
    scene.add(grid);

    let promises = [];
    const axes = ['x', 'y', 'z'];
    for (let i = 0; i < axes.length; i++) {
      const currentAxis = axes[i];
      promises.push(addGridGroup(currentAxis, axes, length));
    }

    Promise.all(promises).then(resolve);
  });
}

function addGridGroup(axis, axes, length) {
  return new Promise(function(resolve, reject) {
    let promises = [];
    // Start with main axis.
    let start = new THREE.Vector3(0,0,0);
    let end = new THREE.Vector3(0,0,0);
    end[axis] = length;
    promises.push(addGridLine(start, end, axis));

    // Next, do combinations of the main axis and one of the other possibilities.
    for (let i = 0; i < axes.length; i++) {
      const currentAxis = axes[i];
      if (currentAxis === axis) { continue; }

      const divisions = 4;
      for (let i = 0; i < divisions; i++) {
        let start = new THREE.Vector3(0,0,0);
        start[currentAxis] = length * ((1 / divisions) * (i + 1));
        let end = new THREE.Vector3(0,0,0);
        end[currentAxis] = length * ((1 / divisions) * (i + 1));
        end[axis] = length;
        promises.push(addGridLine(start, end, axis));
      }
    }

    Promise.all(promises).then(resolve);
  });
}

function addGridLine(start, end, axis, color = colorLabel, duration = 1000) {
  return new Promise(function(resolve, reject) {
    var material = new THREE.LineBasicMaterial({ color: color });
    var geometry = new THREE.Geometry();
    geometry.vertices.push(start);
    geometry.vertices.push(end);
    var line = new THREE.Line(geometry, material);
    line.scale[axis] = 0.0001;
    grid.add(line);

    const tween = new TWEEN.Tween(line.scale)
      .to({ [axis]: 1 }, duration)
      .onComplete(resolve)
      .start();
  });
}

function addSpheresFromData(data, scene) {
  const colors = {
      2: 0x29b6f6, // blue
      3: 0x66bb6a, // green
      4: 0xef5350, // red
    };

  data.forEach(d => {
    const geometry = new THREE.SphereGeometry(d.num_initial_consecutive_decreases_norm * 1.8, 32, 32);
    const material = new THREE.MeshLambertMaterial({ color: colors[d.num_initial_consecutive_decreases] });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(d.start_to_bottom_norm * 6, d.num_quarters * 6, d.bottom_to_end_norm * 6);
    sphere.name = d.quarter;
    sphere.userData = {
      ...d,
      type: 'sphere'
    };
    spheres.add(sphere);

    animateRadius(sphere);
  });

  function animateRadius(sphere) {
    expand(sphere, contract);

    function expand(sphere, contract) {
      const tween = new TWEEN.Tween(sphere.scale)
        .to({ x: 1.2, y: 1.2, z: 1.2 }, 200)
        .onComplete(contract.bind(null, sphere))
        .start();
    }

    function contract(sphere) {
      const tween = new TWEEN.Tween(sphere.scale)
        .to({ x: 1.1, y: 1.1, z: 1.1 }, 400)
        .start();
    }
  }
}

function addLabels() {
  var axisLabelMaterial = new THREE.MeshBasicMaterial({
    color: colorLabel,
    transparent: true,
    side: THREE.DoubleSide,
    opacity: 0
  });
  var size = 3;

  // Axis labels
  // x-axis
  var message = "   % Decrease\nStart to Bottom";
  var shapes = font.generateShapes(message, size);
  var geometry = new THREE.ShapeBufferGeometry(shapes);
  var xAxisLabel = new THREE.Mesh(geometry, axisLabelMaterial);
  xAxisLabel.name = 'x-axis-label';
  xAxisLabel.position.x = 16;
  xAxisLabel.position.y = -5;
  xAxisLabel.position.z = 67;
  xAxisLabel.rotation.x = -1 * Math.PI / 4
  labels.add(xAxisLabel);

  // y-axis
  var message = "Length (Quarters)";
  var shapes = font.generateShapes(message, size);
  var geometry = new THREE.ShapeBufferGeometry(shapes);
  var yAxisLabel = new THREE.Mesh(geometry, axisLabelMaterial);
  yAxisLabel.name = 'y-axis-label';
  yAxisLabel.position.x = -5;
  yAxisLabel.position.y = 45;
  yAxisLabel.position.z = 67;
  yAxisLabel.rotation.y = Math.PI / 4;
  yAxisLabel.rotation.z =  -1 * Math.PI / 2;
  labels.add(yAxisLabel);

  // z-axis
  var message = "  % Increase\nBottom to End";
  var shapes = font.generateShapes(message, size);
  var geometry = new THREE.ShapeBufferGeometry(shapes);
  var zAxisLabel = new THREE.Mesh(geometry, axisLabelMaterial);
  zAxisLabel.name = 'z-axis-label';
  zAxisLabel.position.x = 67;
  zAxisLabel.position.y = -5;
  zAxisLabel.position.z = 42;
  zAxisLabel.rotation.order = 'YXZ';
  zAxisLabel.rotation.x = -1 * Math.PI / 4;
  zAxisLabel.rotation.y = Math.PI / 2;
  labels.add(zAxisLabel);

  // Ticks
  var tickMaterial = new THREE.MeshBasicMaterial({
    color: colorLabel,
    transparent: true,
    side: THREE.DoubleSide,
    opacity: 0
  });
  // x-axis
  var message = '50%';
  var shapes = font.generateShapes(message, 1.3);
  var geometry = new THREE.ShapeBufferGeometry(shapes);
  var tick = new THREE.Mesh(geometry, tickMaterial);
  tick.position.x = 28.5;
  tick.position.y = -1;
  tick.position.z = 63;
  tick.rotation.x = -1 * Math.PI / 4;
  tick.name = 'x-tick-50'
  labels.add(tick);

  // y-axis
  var message = '0';
  var shapes = font.generateShapes(message, 1.3);
  var geometry = new THREE.ShapeBufferGeometry(shapes);
  var tick = new THREE.Mesh(geometry, tickMaterial);
  tick.position.x = -0.5;
  tick.position.y = -1;
  tick.position.z = 62;
  tick.rotation.y = Math.PI / 4;
  tick.name = 'y-tick-0';
  labels.add(tick);

  var message = '5';
  var shapes = font.generateShapes(message, 1.3);
  var geometry = new THREE.ShapeBufferGeometry(shapes);
  var tick = new THREE.Mesh(geometry, tickMaterial);
  tick.position.x = -0.5;
  tick.position.y = 29.5;
  tick.position.z = 62;
  tick.rotation.y = Math.PI / 4;
  tick.name = 'y-tick-5';
  labels.add(tick);

  var message = '10';
  var shapes = font.generateShapes(message, 1.3);
  var geometry = new THREE.ShapeBufferGeometry(shapes);
  var tick = new THREE.Mesh(geometry, tickMaterial);
  tick.position.x = -0.5;
  tick.position.y = 59;
  tick.position.z = 62.5;
  tick.rotation.y = Math.PI / 4;
  tick.name = 'y-tick-10';
  labels.add(tick);

  // z-axis
  var message = '0%';
  var shapes = font.generateShapes(message, 1.3);
  var geometry = new THREE.ShapeBufferGeometry(shapes);
  var tick = new THREE.Mesh(geometry, tickMaterial);
  tick.position.x = 63;
  tick.position.y = -1;
  tick.position.z = 1.5;
  tick.rotation.order = 'YXZ';
  tick.rotation.x = -1 * Math.PI / 4;
  tick.rotation.y = Math.PI / 2;
  tick.name = 'z-tick-0'
  labels.add(tick);

  var message = '50%';
  var shapes = font.generateShapes(message, 1.3);
  var geometry = new THREE.ShapeBufferGeometry(shapes);
  var tick = new THREE.Mesh(geometry, tickMaterial);
  tick.position.x = 63;
  tick.position.y = -1;
  tick.position.z = 31;
  tick.rotation.order = 'YXZ';
  tick.rotation.x = -1 * Math.PI / 4;
  tick.rotation.y = Math.PI / 2;
  tick.name = 'z-tick-50'
  labels.add(tick);

  var message = '100%';
  var shapes = font.generateShapes(message, 1.3);
  var geometry = new THREE.ShapeBufferGeometry(shapes);
  var tick = new THREE.Mesh(geometry, tickMaterial);
  tick.position.x = 61;
  tick.position.y = -1;
  tick.position.z = 64;
  tick.rotation.order = 'YXZ';
  tick.rotation.x = -1 * Math.PI / 4;
  tick.rotation.y = Math.PI / 4;
  tick.name = 'x-z-tick-100'
  labels.add(tick);

  axisLabelMaterial

  const tweenAxisLabels = new TWEEN.Tween(axisLabelMaterial)
    .to({ opacity: 1 }, 500)
    .start();

  const tweenTicks = new TWEEN.Tween(tickMaterial)
    .to({ opacity: 1 }, 500)
    .start();
}

function addTooltip(sphere) {
  var existing = scene.getObjectByName('tooltip-' + sphere.name);

  if (existing !== undefined) { return; }

  var width = 18;
  var height = 4;

  // Parent
  // Drag controls can't use a group, so a mesh is used as the parent.
  var geometry = new THREE.PlaneGeometry(width, height);
  var material = new THREE.MeshBasicMaterial({ color: sphere.material.color });
  var tooltip = new THREE.Mesh(geometry, material);
  tooltip.name = 'tooltip-' + sphere.name;
  tooltip.userData.type = 'tooltip';
  tooltip.position.copy(sphere.position).add(new THREE.Vector3(0,sphere.geometry.parameters.radius + 8,0));
  scene.add(tooltip);

  // Foreground
  var geometry = new THREE.PlaneGeometry(width - 0.5, height - 0.5);
  var material = new THREE.MeshBasicMaterial({ color: colorLabel });
  var foreground = new THREE.Mesh(geometry, material);
  // Offset the front plane so that the two don't blur together.
  foreground.position.add(new THREE.Vector3(0.01,0.01,0.01));
  foreground.name = 'tooltip-foreground-' + sphere.name;
  tooltip.add(foreground);

  // Tether
  addTether(
    sphere.name,
    sphere.material.color,
    sphere.position.clone(),
    tooltip.position.clone()
  );

  // Text and close button
  var name = tooltip.name.replace(/tooltip-/, '');
  var year = name.slice(0, 4);
  var quarter = 'Q' + name.slice(-1);
  var textShapes = font.generateShapes(year + ' ' + quarter, 2);
  var textGeometry = new THREE.ShapeBufferGeometry(textShapes);
  var textMaterial = new THREE.MeshBasicMaterial({ color: colorBg });
  var text = new THREE.Mesh(textGeometry, textMaterial);
  text.name = 'tooltip-text-' + sphere.name;
  text.position.add(new THREE.Vector3(0.03,0.03,0.03));
  text.position.sub(new THREE.Vector3(7,0.85,0));
  tooltip.add(text);

  // Close target
  var closeTargetGeometry = new THREE.CircleGeometry(1.5, 32);
  var closeTargetMaterial = new THREE.MeshBasicMaterial({ opacity: 0, transparent: true });
  var closeTarget = new THREE.Mesh(closeTargetGeometry, closeTargetMaterial);
  closeTarget.name = 'tooltip-close-' + sphere.name;
  closeTarget.userData.type = 'tooltip-close';
  closeTarget.position.add(new THREE.Vector3(7,0.02,0.02));
  closeTarget.rotation.z = Math.PI / 4;
  tooltip.add(closeTarget);
  // Close icon
  var closeIconShapes = font.generateShapes('+', 3);
  var closeIconGeometry = new THREE.ShapeBufferGeometry(closeIconShapes);
  var closeIconMaterial = new THREE.MeshBasicMaterial({ color: 0xef5350 });
  var closeIcon = new THREE.Mesh(closeIconGeometry, closeIconMaterial);
  closeIcon.name = 'tooltip-close-icon-' + sphere.name;
  closeIcon.position.add(new THREE.Vector3(-1.2,-1.2,0.02));
  closeTarget.add(closeIcon);

  activateDragControls();
}

function removeTooltip(tooltipClose) {
  var id = tooltipClose.name.match(/tooltip-close-(\w+)/)[1];
  scene.remove(scene.getObjectByName('tooltip-' + id));
  scene.remove(scene.getObjectByName('tether-' + id));
  activateDragControls();
  controls.enabled = true;
}

function activateDragControls() {
  // Deactivate any previous drag controls so that a new batch can be initialized together.
  if (
    typeof dragControls !== 'undefined' &&
    typeof dragControls.deactivate !== 'undefined'
  ) {
    dragControls.deactivate();
  }

  var tooltips = scene.children.filter(c => c.name.includes('tooltip'));
  // Don't bother initializing drag controls with an empty set of tooltips.
  if (tooltips.length) {
    dragControls = new THREE.DragControls(tooltips, camera, renderer.domElement);
    dragControls.addEventListener('dragstart', event => { controls.enabled = false; });
    dragControls.addEventListener('drag', handleTooltipDrag);
    dragControls.addEventListener('dragend', event => { controls.enabled = true; });
  } else {
    dragControls = undefined;
  }
}

function handleTooltipDrag(event) {
  var name = event.object.name.split('-')[1];
  var oldTether = scene.getObjectByName('tether-' + name);
  scene.remove(oldTether);

  var sphere = spheres.getObjectByName(name);
  addTether(
    name,
    sphere.material.color,
    event.object.position.clone(),
    sphere.position.clone()
  );
}

function addTether(name, color, vertice1, vertice2) {
  var material = new THREE.LineBasicMaterial({ color: color });
  var geometry = new THREE.Geometry();
  geometry.vertices.push(vertice1.add(new THREE.Vector3(-0.5,-0.5,-0.5)));
  geometry.vertices.push(vertice2.add(new THREE.Vector3(-0.5,-0.5,-0.5)));
  var tether = new THREE.Line(geometry, material);
  tether.name = 'tether-' + name;
  scene.add(tether);
}

function tooltipsLookAtCamera() {
  scene.children
    .filter(c => c.name.includes('tooltip'))
    .forEach(t => t.lookAt(camera.position.clone().multiply(new THREE.Vector3(0.7,0.8,0.7))));
}

document.addEventListener('click', handleDocumentClick);
document.addEventListener('touchstart', handleDocumentClick);

function handleDocumentClick(e) {
  mouse.x = (e.clientX / renderer.domElement.clientWidth) * 2 - 1;
	mouse.y = - (e.clientY / renderer.domElement.clientHeight) * 2 + 1;

  if (e.type === 'touchstart') {
    mouse.x = (e.touches[0].clientX / renderer.domElement.clientWidth) * 2 - 1;
  	mouse.y = - (e.touches[0].clientY / renderer.domElement.clientHeight) * 2 + 1;
  }

  var closeButtons = scene.children
    .filter(c => c.name.includes('tooltip'))
    .map(t => {
      return t.children.filter(c => {
        return c.name.includes('tooltip-close');
      })[0];
    });

  var tooltips = scene.children.filter(c => c.name.includes('tooltip'));

  // Register all objects as targets to prevent unwanted click-throughs.
  raycaster.setFromCamera(mouse, camera);
  var intersects = raycaster.intersectObjects(spheres.children.concat(closeButtons, tooltips));

  if (intersects.length) {
    switch(intersects[0].object.userData.type) {
      case 'sphere':
        addTooltip(intersects[0].object);
        break;
      case 'tooltip-close':
        removeTooltip(intersects[0].object);
        break;
      default:
        return;
    }
  }
}
