var camera, scene, renderer;

var spheres = [];
var planes = [];

var renderTexture, depthNormalTexture, aoTexture, screenScene, screenCamera, screen, depthScreen, aoRenderScreen, aoScreenScene, aoScreenCamera;

var aaScale = 2, depthTextureScale = 0.5, aoTextureScale = 0.5;

var depthMaterial, redPhongMaterial, bluePhongMaterial, aoMaterial;

var pointLight1, pointLight2;

window.onload = function() {
	init();
	animate();
	window.onkeydown = keysdown;
	window.onkeyup = keysup;
};

function init() {
	window.innerHeight = 600;
	window.innerWidth = 800;

	scene = new THREE.Scene();

	var nearClip = 0.5;
	var farClip = 800.0;

	camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, nearClip, farClip );
	camera.position.z = 300;
	camera.lookAt(new THREE.Vector3(0, 0, -100));
	scene.add( camera );

	renderTexture = new THREE.WebGLRenderTarget( window.innerWidth*aaScale, window.innerHeight*aaScale, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter } );
	depthNormalTexture = new THREE.WebGLRenderTarget( window.innerWidth*depthTextureScale, window.innerHeight*depthTextureScale, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter } );
	aoTexture = new THREE.WebGLRenderTarget( window.innerWidth*aoTextureScale, window.innerHeight*aoTextureScale, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter } );


	// depth writer material
	var depthFragmentShader = document.getElementById("depthFrag").innerHTML;
	var depthVertexShader = document.getElementById("normalVert").innerHTML;
	var depthUniforms = THREE.UniformsUtils.merge([
			THREE.UniformsLib[ "common" ],
			{mNear:{type:"f", value:nearClip}, mFar:{type:"f", value:farClip}, opacity:{type:"f", value: 1}}
			]);

	var depthParameters = { fragmentShader: depthFragmentShader, vertexShader: depthVertexShader, uniforms: depthUniforms };
	depthMaterial = new THREE.ShaderMaterial( depthParameters );
	
	// ao display material
	var aoFragmentShader = document.getElementById("cssgiFrag").innerHTML;
	var aoVertexShader = document.getElementById("uvVert").innerHTML;
	var aoUniforms = THREE.UniformsUtils.merge([
			THREE.UniformsLib[ "common" ],
			{mNear:{type:"f", value:nearClip}, mFar:{type:"f", value:farClip}, depthTextureScale: {type:"f", value:depthTextureScale}, depthNormalMap:{type:"t", value:0, texture:depthNormalTexture}, colorMap:{type:"t", value:0, texture:renderTexture}}
			]);

	var aoParameters = { fragmentShader: aoFragmentShader, vertexShader: aoVertexShader, uniforms: aoUniforms };
	aoMaterial = new THREE.ShaderMaterial( aoParameters );

	redPhongMaterial = new THREE.MeshPhongMaterial( { color: 0xff0000 });//, ambient:1.0, specular:8.0, shininess:6.0} );	
	bluePhongMaterial = new THREE.MeshPhongMaterial( { color: 0xffffff } );	

	for (var i = 0 ; i < 10 ; i++) {
		spheres[i] = {};
		var sphere = spheres[i];
		var sphereGeometry = new THREE.SphereGeometry( 10, 20, 20 );
		sphere.geometry = sphereGeometry;
		sphere.material = redPhongMaterial;

		sphere.mesh = new THREE.Mesh( sphere.geometry, sphere.material );
		scene.add( sphere.mesh );
		sphere.mesh.position.x = (Math.random() - 0.5)*200;
		sphere.mesh.position.y = (Math.random() - 0.5)*200;
		sphere.mesh.position.z = (Math.random() - 0.5)*200;
//        sphere.mesh.position.y = 10;
	}

	for (var i = 0 ; i < 10 ; i++) {
		planes[i] = {};
		var plane = planes[i];

		var planeGeometry = new THREE.CubeGeometry( 1, 100, 100 );
		plane.geometry = planeGeometry; 
		plane.material = bluePhongMaterial;

		plane.mesh = new THREE.Mesh( plane.geometry, plane.material );
		scene.add( plane.mesh );
		plane.mesh.position.x = (Math.random() - 0.5)*200;
		plane.mesh.position.y = (Math.random() - 0.5)*200;
		plane.mesh.position.z = (Math.random() - 0.5)*200;
		plane.mesh.rotation.x = (Math.random() - 0.5)*Math.PI*2;
		plane.mesh.rotation.y = (Math.random() - 0.5)*Math.PI*2;
		plane.mesh.rotation.z = (Math.random() - 0.5)*Math.PI*2;
//        plane.mesh.rotation.z = -Math.PI*0.4;
//        plane.mesh.rotation.y = Math.PI*0.4;

	}

	pointLight1 = new THREE.PointLight( 0xFFFFFF );
	pointLight1.position.x = -50;
	pointLight1.position.y = 100;
	pointLight1.position.z = 100;
	scene.add(pointLight1);

	pointLight2 = new THREE.PointLight( 0xFFFFFF );
	pointLight2.position.x = 100;
	pointLight2.position.y = -50;
	pointLight2.position.z = 100;
//    scene.add(pointLight2);

	renderer = new THREE.WebGLRenderer();
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.setClearColorHex(0x000000);


	screenCamera = new THREE.OrthographicCamera( window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / -2, nearClip, farClip );
	screenCamera.position.z = 300;
	screenCamera.lookAt(new THREE.Vector3(0, 0, -100));

	screenScene = new THREE.Scene();

	screen = {};
	screen.geometry = new THREE.PlaneGeometry( window.innerWidth, window.innerHeight );
	screen.material = new THREE.MeshBasicMaterial( {map:renderTexture} );
	screen.mesh = new THREE.Mesh( screen.geometry, screen.material );
	screen.mesh.position.z = -100;
	screen.mesh.rotation.x = Math.PI;
	screen.mesh.doubleSided = true;

	aoScreen = {};
	aoScreen.geometry = new THREE.PlaneGeometry( window.innerWidth, window.innerHeight );
	aoScreen.material = new THREE.MeshBasicMaterial( {map:aoTexture, blending:THREE.AdditiveBlending, transparent:true} );
	aoScreen.mesh = new THREE.Mesh( aoScreen.geometry, aoScreen.material );
	aoScreen.mesh.position.z = -90;

    screenScene.add( screen.mesh );
	screenScene.add( aoScreen.mesh );
	screenScene.add( screenCamera );

	// where we render the ao
	aoScreenCamera = new THREE.OrthographicCamera( window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / -2, nearClip, farClip );
	aoScreenCamera.position.z = 300;
	aoScreenCamera.lookAt(new THREE.Vector3(0, 0, -100));

	aoRenderScreen = {};
	aoRenderScreen.geometry = new THREE.PlaneGeometry( window.innerWidth, window.innerHeight );
	aoRenderScreen.material = aoMaterial; 
	aoRenderScreen.mesh = new THREE.Mesh( aoRenderScreen.geometry, aoRenderScreen.material );
	aoRenderScreen.mesh.position.z = -100;

	aoScreenScene = new THREE.Scene();
	aoScreenScene.add(aoScreenCamera);
	aoScreenScene.add(aoRenderScreen.mesh);

	document.body.appendChild( renderer.domElement );

}

var rotation = new Date() / 1000;
function animate() {

	var radius = 200;
//    camera.position.x = Math.sin(rotation)*radius;
//    camera.position.z = Math.cos(rotation)*radius;

//    camera.lookAt({x:0, y:0, z:0});

//    requestAnimationFrame( animate );
	//
	
	if (keys[key_left]) {
		rotation += 0.1;
	} else if (keys[key_right]) {
		rotation -= 0.1;
	}
	pointLight1.position.x = Math.sin(rotation)*radius;
	pointLight1.position.z = Math.cos(rotation)*radius;
	setTimeout(animate, 33);
	render();

}

function render() {
	// render the depth texture
	for (var i = 0 ; i < planes.length ; i++) {
		var plane = planes[i];
		plane.mesh.material = depthMaterial;
	}
	for (var i = 0 ; i < spheres.length ; i++) {
		var sphere = spheres[i];
		sphere.mesh.material = depthMaterial;
	}
//    scene.overrideMaterial = depthMaterial;
	renderer.setViewport(0,0, window.innerWidth*depthTextureScale, window.innerHeight*depthTextureScale );
	renderer.render( scene, camera, depthNormalTexture );
//    renderer.render( scene, camera );

	// render the scene normally
	for (var i = 0 ; i < planes.length ; i++) {
		var plane = planes[i];
		plane.mesh.material = plane.material;
	}
	for (var i = 0 ; i < spheres.length ; i++) {
		var sphere = spheres[i];
		sphere.mesh.material = sphere.material;
	}
//    scene.overrideMaterial = undefined;
	renderer.setViewport(0,0, window.innerWidth*aaScale, window.innerHeight*aaScale );
	renderer.render( scene, camera, renderTexture );
//    renderer.render( scene, camera );

	// render the ao
	renderer.setViewport(0,0, window.innerWidth*aoTextureScale, window.innerHeight*aoTextureScale );
	renderer.render( aoScreenScene, aoScreenCamera, aoTexture );
//    renderer.render( aoScreenScene, aoScreenCamera );

	// render the final output
    renderer.setViewport(0,0, window.innerWidth, window.innerHeight );
	renderer.render( screenScene, screenCamera );

}
