var camera, scene, renderer;

var spheres = [];
var planes = [];

var renderTexture, depthTexture, aoTexture, screenScene, screenCamera, screen, depthScreen, aoRenderScreen, aoScreenScene, aoScreenCamera;

var aaScale = 2, depthTextureScale = 2;

var depthMaterial, redPhongMaterial, bluePhongMaterial, aoMaterial;

window.onload = function() {
	init();
	animate();
};

function init() {

	scene = new THREE.Scene();

	camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 10000 );
	camera.position.z = 300;
	scene.add( camera );

	renderTexture = new THREE.WebGLRenderTarget( window.innerWidth*aaScale, window.innerHeight*aaScale, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter } );
	depthTexture = new THREE.WebGLRenderTarget( window.innerWidth/depthTextureScale, window.innerHeight/depthTextureScale, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter } );
	aoTexture = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter } );


	// depth writer material
	var depthFragmentShader = document.getElementById("depthFrag").innerHTML;
	var depthVertexShader = document.getElementById("plainVert").innerHTML;
	var depthUniforms = THREE.UniformsUtils.merge([
			THREE.UniformsLib[ "common" ],
			{mNear:{type:"f", value:0}, mFar:{type:"f", value:1000}, opacity:{type:"f", value: 1}}
			]);

	var depthParameters = { fragmentShader: depthFragmentShader, vertexShader: depthVertexShader, uniforms: depthUniforms };
	depthMaterial = new THREE.ShaderMaterial( depthParameters );
	
	// ao display material
	var aoFragmentShader = document.getElementById("aoFrag").innerHTML;
	var aoVertexShader = document.getElementById("uvVert").innerHTML;
	var aoUniforms = THREE.UniformsUtils.merge([
			THREE.UniformsLib[ "common" ],
			{depthTextureScale: {type:"f", value:depthTextureScale}, depthMap:{type:"t", value:0, texture:depthTexture}}
			]);

	var aoParameters = { fragmentShader: aoFragmentShader, vertexShader: aoVertexShader, uniforms: aoUniforms };
	aoMaterial = new THREE.ShaderMaterial( aoParameters );

	redPhongMaterial = new THREE.MeshPhongMaterial( { color: 0xff0000 } );	
	bluePhongMaterial = new THREE.MeshPhongMaterial( { color: 0x0000ff } );	


	for (var i = 0 ; i < 100 ; i++) {
		spheres[i] = {};
		var sphere = spheres[i];
		sphere.geometry = new THREE.SphereGeometry( 10, 20, 20 );
		sphere.material = redPhongMaterial;

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
		plane.material = bluePhongMaterial;

		plane.mesh = new THREE.Mesh( plane.geometry, plane.material );
		scene.add( plane.mesh );
		plane.mesh.position.x = (Math.random() - 0.5)*200;
		plane.mesh.position.y = (Math.random() - 0.5)*200;
		plane.mesh.position.z = (Math.random() - 0.5)*200;
		plane.mesh.rotation.x = (Math.random() - 0.5)*Math.PI*2;
		plane.mesh.rotation.y = (Math.random() - 0.5)*Math.PI*2;
		plane.mesh.rotation.z = (Math.random() - 0.5)*Math.PI*2;

	}

	var pointLight1 = new THREE.PointLight( 0xFFFFFF );
	pointLight1.position.x = 10;
	pointLight1.position.y = 50;
	pointLight1.position.z = 200;
	scene.add(pointLight1);

	var pointLight2 = new THREE.PointLight( 0xFFFFFF );
	pointLight2.position.x = 10;
	pointLight2.position.y = 50;
	pointLight2.position.z = -100;
	scene.add(pointLight2);

	renderer = new THREE.WebGLRenderer();
	renderer.setSize( window.innerWidth, window.innerHeight );
	//renderer.setClearColorHex(0x333333);


	screenCamera = new THREE.OrthographicCamera( window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, -10000, 10000 );
	screenCamera.position.z = 100;

	screenScene = new THREE.Scene();

	screen = {};
	screen.geometry = new THREE.PlaneGeometry( window.innerWidth, window.innerHeight );
	screen.material = new THREE.MeshBasicMaterial( {map:renderTexture} );
	screen.mesh = new THREE.Mesh( screen.geometry, screen.material );
	screen.mesh.position.z = -100;

	aoScreen = {};
	aoScreen.geometry = new THREE.PlaneGeometry( window.innerWidth, window.innerHeight );
	aoScreen.material = new THREE.MeshBasicMaterial( {map:aoTexture, transparent:true} );
	aoScreen.mesh = new THREE.Mesh( aoScreen.geometry, aoScreen.material );
	aoScreen.mesh.position.z = -90;

	screenScene.add( screen.mesh );
	screenScene.add( aoScreen.mesh );
	screenScene.add( screenCamera );

	// where we render the ao
	aoScreenCamera = new THREE.OrthographicCamera( window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, -10000, 10000 );
	aoScreenCamera.position.z = 100;

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
	// render the depth texture
	scene.overrideMaterial = depthMaterial;
	renderer.setViewport(0,0, window.innerWidth/depthTextureScale, window.innerHeight/depthTextureScale );
	renderer.render( scene, camera, depthTexture );

	// render the ao
	renderer.setViewport(0,0, window.innerWidth, window.innerHeight );
	renderer.render( aoScreenScene, aoScreenCamera, aoTexture );

	// render the scene normally
	scene.overrideMaterial = undefined;
	renderer.setViewport(0,0, window.innerWidth*aaScale, window.innerHeight*aaScale );
	renderer.render( scene, camera, renderTexture );


	// render the final output
	renderer.setViewport(0,0, window.innerWidth, window.innerHeight );
	renderer.render( screenScene, screenCamera );

}
