var camera, scene, renderer;

var spheres = [];
var planes = [];

var renderTexture, screenScene, screenCamera, screen;

var aaScale = 2;

	window.onload = function() {
		init();
		animate();
	};

    function init() {

        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 10000 );
        camera.position.z = 300;
        scene.add( camera );

		for (var i = 0 ; i < 100 ; i++) {
			spheres[i] = {};
			var sphere = spheres[i];
			sphere.geometry = new THREE.SphereGeometry( 10, 20, 20 );
			sphere.material = new THREE.MeshPhongMaterial( { color: 0xff0000 } );

			sphere.mesh = new THREE.Mesh( sphere.geometry, sphere.material );
			scene.add( sphere.mesh );
			sphere.mesh.position.x = (Math.random() - 0.5)*200;
			sphere.mesh.position.y = (Math.random() - 0.5)*200;
			sphere.mesh.position.z = (Math.random() - 0.5)*200;
		}

		for (var i = 0 ; i < 5 ; i++) {
			planes[i] = {};
			var plane = planes[i];
			
			plane.geometry = new THREE.CubeGeometry( 1, 100, 100 );
			plane.material = new THREE.MeshPhongMaterial( { color: 0x0000ff } );

			plane.mesh = new THREE.Mesh( plane.geometry, plane.material );
			scene.add( plane.mesh );
			plane.mesh.position.x = (Math.random() - 0.5)*200;
			plane.mesh.position.y = (Math.random() - 0.5)*200;
			plane.mesh.position.z = (Math.random() - 0.5)*200;
			plane.mesh.rotation.x = (Math.random() - 0.5)*Math.PI*2;
			plane.mesh.rotation.y = (Math.random() - 0.5)*Math.PI*2;
			plane.mesh.rotation.z = (Math.random() - 0.5)*Math.PI*2;

		}

		// create a point light
		var pointLight = new THREE.PointLight( 0xFFFFFF );

		// set its position
		pointLight.position.x = 10;
		pointLight.position.y = 50;
		pointLight.position.z = 130;

		// add to the scene
		scene.add(pointLight);

        renderer = new THREE.WebGLRenderer();
        renderer.setSize( window.innerWidth, window.innerHeight );
		//renderer.setClearColorHex(0x333333);

		renderTexture = new THREE.WebGLRenderTarget( window.innerWidth*aaScale, window.innerHeight*aaScale, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter } );

		screenCamera = new THREE.Camera();
		screenCamera.projectionMatrix = THREE.Matrix4.makeOrtho( window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, -10000, 10000 );
		screenCamera.position.z = 100;

		screenScene = new THREE.Scene();

		screen = {};
		screen.geometry = new THREE.PlaneGeometry( window.innerWidth, window.innerHeight );
		screen.material = new THREE.MeshBasicMaterial( {map:renderTexture} );

		screen.mesh = new THREE.Mesh( screen.geometry, screen.material );
		screen.mesh.position.z = -100;
		screenScene.add( screen.mesh );
		screenScene.add( screenCamera );

        document.body.appendChild( renderer.domElement );

    }

    function animate() {

		var rotation = new Date() / 10000;
		var radius = 200;
		camera.position.x = Math.sin(rotation)*radius;
		camera.position.z = Math.cos(rotation)*radius;

		camera.lookAt({x:0, y:0, z:0});

        requestAnimationFrame( animate );
        render();

    }

    function render() {

        renderer.setViewport(0,0, window.innerWidth*aaScale, window.innerHeight*aaScale );
        renderer.render( scene, camera, renderTexture );

        renderer.setViewport(0,0, window.innerWidth, window.innerHeight );
        renderer.render( screenScene, screenCamera );

    }
