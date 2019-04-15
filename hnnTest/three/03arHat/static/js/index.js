if(!Detector.webgl) Detector.addGetWebGLMessage();

var container, stats, controls;
var camera, scene, renderer, light;

var clock = new THREE.Clock();

var mixers = [];
 
init();
animate();

function init() {
	container = document.getElementById("container");
		renderer = new THREE.WebGLRenderer({
		antialias: true
	});
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.shadowMap.enabled = true;
	container.appendChild(renderer.domElement);

	//				document.body.appendChild(container);

	camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
	camera.position.set(100, 200, 300);


	scene = new THREE.Scene();
	scene.background = new THREE.Color(0xa0a0a0);
	scene.fog = new THREE.Fog(0xa0a0a0, 200, 1000);
	
//		var cameraHelper = new THREE.CameraHelper(camera);
//			cameraHelper.visible = true;
//			scene.add(cameraHelper);

	light = new THREE.HemisphereLight(0xffffff, 0x444444);
	light.position.set(0, 200, 0);
	scene.add(light);

	light = new THREE.DirectionalLight(0xffffff);
	light.position.set(0, 200, 100);
	light.castShadow = true;
	light.shadow.camera.top = 180;
	light.shadow.camera.bottom = -100;
	light.shadow.camera.left = -120;
	light.shadow.camera.right = 120;
	scene.add(light);

//	 scene.add( new THREE.CameraHelper( light.shadow.camera ) );

	// ground
	var mesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(2000, 2000), new THREE.MeshPhongMaterial({
		color: 0x999999,
		depthWrite: false
	}));
	mesh.rotation.x = -Math.PI / 2;
	mesh.receiveShadow = true;
	scene.add(mesh);
	//网格
	var grid = new THREE.GridHelper(2000, 20, 0x000000, 0x000000);
	grid.material.opacity = 0.2;
	grid.material.transparent = true;
	scene.add(grid);
	//辅助线
	scene.add(new THREE.AxesHelper(2000)); //线
	//				scene.add( new THREE.PlaneHelper(new THREE.Plane( new THREE.Vector3( 1, 0, 0 ), 0 ), 30, 0xff0000 ) );//面
	var transformControls = new THREE.TransformControls(camera, renderer.domElement);
scene.add(transformControls);

	// model
	var group=new THREE.Group();
	scene.add(group);
	var loader = new THREE.FBXLoader();
	loader.load('static/model/dancing/Samba Dancing.fbx', function(object) {

		object.mixer = new THREE.AnimationMixer(object);
		mixers.push(object.mixer);
		var action = object.mixer.clipAction(object.animations[0]);
		action.play();
		object.traverse(function(child) {
			if(child.isMesh) {
				child.castShadow = true;
				child.receiveShadow = true;
			}
		});
//	transformControls.setMode( "rotate" );//
//transformControls.attach( object );
		group.add(object);
		//模型骨骼
		var helper = new THREE.SkeletonHelper(object);
		helper.material.linewidth = 3;
		helper.visible = true;
		group.add(helper);
	});
	

	//audio
				var listener = new THREE.AudioListener();
				camera.add( listener );
				var audioLoader = new THREE.AudioLoader();
				var sound2 = new THREE.PositionalAudio( listener );
				audioLoader.load( 'static/sounds/376737_Skullbeatz___Bad_Cat_Maste.ogg', function( buffer ) {
					sound2.setBuffer( buffer );
					sound2.setRefDistance( 20 );
					sound2.play();
				});
				transformControls.setMode("rotate");
				transformControls.attach( sound2 );
				group.add( sound2 );
//				scene.add( sound2 );
	


	//controls
	controls = new THREE.OrbitControls(camera, renderer.domElement);
	controls.target.set(0, 100, 0);
	controls.update();

	window.addEventListener('resize', onWindowResize, false);

	cameraContrl();

	// stats
	stats = new Stats();
	container.appendChild(stats.dom);

}

function rotationSet(object) {
	document.getElementById("rotation-x").onclick = function() {
		object.rotation.x += Math.PI / 2;
	}
	document.getElementById("rotation-y").onclick = function() {
		object.rotation.y += Math.PI / 2;
	}
	document.getElementById("rotation-z").onclick = function() {
		object.rotation.z += Math.PI / 2;
	}
}

function cameraContrl() {
	var ocamera = document.getElementById("camera-bar");
	var ocameraw = ocamera.style.width;
//	camera.fov=50;

					console.log("camera1",camera.getEffectiveFOV())
					console.log("camera2",camera.fov)
}

function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize(window.innerWidth, window.innerHeight);

}

//

function animate() {

	requestAnimationFrame(animate);

	if(mixers.length > 0) {

		for(var i = 0; i < mixers.length; i++) {

			mixers[i].update(clock.getDelta());

		}

	}

	renderer.render(scene, camera);

	stats.update();

}