// box2d
var    b2Vec2 = Box2D.Common.Math.b2Vec2
	,  b2AABB = Box2D.Collision.b2AABB
	,	b2BodyDef = Box2D.Dynamics.b2BodyDef
	,	b2Body = Box2D.Dynamics.b2Body
	,	b2FixtureDef = Box2D.Dynamics.b2FixtureDef
	,	b2Fixture = Box2D.Dynamics.b2Fixture
	,	b2World = Box2D.Dynamics.b2World
	,	b2MassData = Box2D.Collision.Shapes.b2MassData
	,	b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape
	,	b2CircleShape = Box2D.Collision.Shapes.b2CircleShape
	,	b2DebugDraw = Box2D.Dynamics.b2DebugDraw
	,  b2MouseJointDef =  Box2D.Dynamics.Joints.b2MouseJointDef
	,	b2ContactListener = Box2D.Dynamics.b2ContactListener
	;


var world;

var snowball;
var groundPieces = [];


var s = {
};
s.minRotationSpeed = 35;
s.torqueToApply = 40;
var origMinRotationSpeed = 35;
var origTorqueToApply = 80;
s.snowTakeUp = 0.8;
s.snowballGrowth = 0.02;
s.snowballSuckUpMinDistChange =1;
s.impulseDulling = 0.5;
s.airSpeed = 2;
var origAirSpeed = 2;
s.snowCalmingCount = 5;
s.minSnowCalmingCount = 5;
s.snowCalmingDropOff = 0.5;
s.snowEveningFactor = 0.0;
s.worldScale = 10;

var worldSize = {x:200, y:100};

var sizeJumps = [0.5, 2, 10, 50, 100, 500, 2000];
var lastSizeJump = 0;
var groundSpacing = 1;


var houndstoothImage;
var hue;
var stripesImage;

var boostTime = 0;


var numberOfStars = 100;
var stars = [];
function makeStars() {
	for (var i = 0 ; i < numberOfStars ; i++) {
		stars[i] = {
			x:Math.random()*worldSize.x,
			y:Math.random()*worldSize.y
		};
	}
}

function makeStripes() {
	stripesImage = new Image();

	var hCanvas = document.createElement("canvas");
	var size = 10+Math.ceil(Math.random()*10)*4;
	hCanvas.height = size;
	hCanvas.width = size;
	hCanvas.style.position = "absolute";
	hCanvas.style.top = "200px";
//    document.body.appendChild(hCanvas);
	var hContext = hCanvas.getContext("2d");
	hContext.fillStyle = "hsl(" + (hue+85)%255 + ",90%,50%)";
	hContext.fillRect(0,0,size/2,size);
	hContext.fillStyle = "hsl(" + (hue+85)%255 + ",50%,70%)";
	hContext.fillRect(size/2,0,size,size);

	stripesImage = hCanvas;
}

function makeAHoundsTooth() {
	var size = 50+Math.ceil(Math.random()*25)*4;
	//images
	houndstoothImage = new Image();
//    houndstoothImage.src = 'houndstooth_tile.jpg';

	var hCanvas = document.createElement("canvas");
	hCanvas.height = size;
	hCanvas.width = size;
	hCanvas.style.position = "absolute";
	hCanvas.style.top = "200px";
//    document.body.appendChild(hCanvas);
	var hContext = hCanvas.getContext("2d");

	var h2Canvas = document.createElement("canvas");
	h2Canvas.height = size;
	h2Canvas.width = size;
	h2Canvas.style.position = "absolute";
	h2Canvas.style.top = "400px";
//    document.body.appendChild(h2Canvas);
	var h2Context = h2Canvas.getContext("2d");

	hue = Math.random()*255;
	hContext.fillStyle = h2Context.fillStyle = "hsl(" + (hue-85)%255 + ",90%,50%)";
	hContext.fillRect(0,0,size,size);
	h2Context.fillRect(0,0,size,size);

	hContext.fillStyle = h2Context.fillStyle = "hsl(" + hue + ",80%,10%)";

	var x = 0, y = 0, flip = Math.random()<0.5, vert = Math.random()<0.5, ssize = Math.floor(Math.random()*size*0.3+size*0.3);
	flip = false;
	if (vert) {
		hContext.translate(size/2,size/2);
		hContext.rotate(Math.PI/2);
		hContext.translate(-size/2,-size/2);
		h2Context.translate(size/2,size/2);
		h2Context.rotate(Math.PI/2);
		h2Context.translate(-size/2,-size/2);
	}

//    flip = true;
	while (x < size) {
		if (flip) {
			hContext.moveTo(x,y);
			hContext.lineTo(x+ssize,y);
			hContext.lineTo(x+ssize,y+size);
			hContext.lineTo(x,y+size);
			hContext.fill();
		} else {
			h2Context.moveTo(x,y);
			h2Context.lineTo(x+ssize,y);
			h2Context.lineTo(x+ssize,y+size);
			h2Context.lineTo(x,y+size);
			h2Context.fill();
		}
		flip = !flip;
		x += ssize;
	}

	var fCanvas = document.createElement("canvas");
	var fSize =  Math.floor(Math.sqrt(2)*size/2);
	fCanvas.height = fCanvas.width = fSize*2;
	fCanvas.style.position = "absolute";
	fCanvas.style.top = "600px";
//    document.body.appendChild(fCanvas);
	var fContext = fCanvas.getContext("2d");

	fContext.translate(fSize,fSize);
	fContext.rotate(Math.PI/4);
	fContext.drawImage(hCanvas, -size, -size);
	fContext.rotate(Math.PI/2);
	fContext.drawImage(h2Canvas, -size+1, -size+1);
	fContext.rotate(Math.PI/2);
	fContext.drawImage(hCanvas, -size, -size);
	fContext.rotate(Math.PI/2);
	fContext.drawImage(h2Canvas, -size+1, -size+1);

	houndstoothImage = fCanvas;
}

var startTime;
var gameTime;
var timeLimit;
var remainingTime = 180;
var targetSize;
var starsFound = 0;
var starSize = 5;
var trailStars = [];

var houndsCanvas, houndsContext, stripesContext, stripesCanvas;
function init() {
	houndsCanvas = document.createElement("canvas");
	houndsCanvas.width = screenSize.x;
	houndsCanvas.height = screenSize.y;
	houndsContext = houndsCanvas.getContext('2d');
	stripesCanvas = document.createElement("canvas");
	stripesCanvas.width = screenSize.x;
	stripesCanvas.height = screenSize.y;
	stripesContext = stripesCanvas.getContext('2d');

	startTime = getTime();
	timeLimit = 180;
	makeAHoundsTooth();
	makeStripes();
	makeStars();


	// box2d
	world = new b2World(
		new b2Vec2(0, 30)    //gravity
		,  true                 //allow sleep
	);

	var contactListener = new b2ContactListener();
//    contactListener.EndContact = endContact;
	contactListener.BeginContact = endContact;
//    contactListener.PreSolve = preSolve;
//    contactListener.PostSolve = postSolve;
	world.SetContactListener(contactListener);


	var fixDef = new b2FixtureDef;
	fixDef.density = 1.0;
	fixDef.friction = 1.0;
	fixDef.restitution = 0.2;

	var bodyDef = new b2BodyDef;

	//create ground
	var accY = 0;
	var velY = 0;
	var maxVelY = 1;
	var maxAccY = 1;
	var elevation = 20;
	var inclineFactor = 0.05;
	var snowHeight = 100;
	var thisPos;
	var lastPos = {x:0, y:elevation};
	var amount = Math.ceil(worldSize.x/groundSpacing)+1;
	var groundRejoinCount = 100;
	for (var i = 1 ; i < amount ; ++i) {
		bodyDef.type = b2Body.b2_staticBody;
		fixDef.shape = new b2PolygonShape;

		var piecesLeft = amount-i;
		if (piecesLeft < groundRejoinCount) {
			var d = piecesLeft/groundRejoinCount;
			thisPos = {x:i*groundSpacing, y:elevation*d+groundPieces[1].GetShape().GetVertices()[0].y*(1-d)};
		} else {
			thisPos = {x:i*groundSpacing, y:elevation};
		}

		var vs = [
						 new b2Vec2(lastPos.x, lastPos.y),
						 new b2Vec2(thisPos.x, thisPos.y),
						 new b2Vec2(thisPos.x, thisPos.y+100),
						 new b2Vec2(lastPos.x, lastPos.y+100)
		];
		fixDef.shape.SetAsArray(vs, 4);
		fixDef.friction = 0.9;
		fixDef.restitution = 0.0;
		fixDef.density = 10;
		fixDef.userData = {name:"ground", index:i};
//        bodyDef.position.Set(i*groundSpacing, elevation);
		groundPieces[i] = world.CreateBody(bodyDef).CreateFixture(fixDef);
		elevation += velY;
		velY += accY;
		if (velY > maxVelY) { 
			velY = maxVelY;
			accY -= inclineFactor;
		}
		if (velY < -maxVelY) {
			velY = -maxVelY;
			accY += inclineFactor;
		}
		accY += (Math.random()-0.5)*inclineFactor;
		if (accY > maxAccY) accY = maxAccY;
		if (accY < -maxAccY) accY = -maxAccY;
		lastPos = thisPos;
	}

	// create snowball
	fixDef.userData = {name:"snowball"};
	fixDef.angularDamping = 0.01;
	fixDef.linearDamping = 0.01;
	bodyDef.type = b2Body.b2_dynamicBody;
	fixDef.shape = new b2CircleShape(sizeJumps[0]);
	bodyDef.position.x = 100;
	bodyDef.position.y = -100;
	snowball = world.CreateBody(bodyDef).CreateFixture(fixDef);


	// dat gui
//    var dg = new dat.GUI();
//    for (var ss in s) {
//        dg.add(s, ss);
//    }

}

function initSounds() {
}

var win = false;
var winCountDown;
function checkWin() {
	if (starsFound === numberOfStars) {
		win = true;
		winCountDown = 2000;
	}

	if (remainingTime <= 2) {
		win = true;
		winCountDown = 2000;
	}
}

var started = false;
function checkStart() {
	if (keys[key_space]) {
		started = true;
	}
}

function drawStart(context) {
	var textToDisplay = "SnowBall";
	var textMeasurements = context.measureText(textToDisplay);

	context.font = "200px sirin-stencil";
	context.fillStyle = "#000000";
	context.fillText(textToDisplay, screenSize.x/2-textMeasurements.width/2, screenSize.y/2+100);

}

function drawWin(context) {
	var textToDisplay = "Fin";
	var textMeasurements = context.measureText(textToDisplay);

	context.font = "200px sirin-stencil";
	context.fillStyle = "#000000";
	context.fillText(textToDisplay, screenSize.x/2-textMeasurements.width/2, screenSize.y/2+100);

}


function updateStars(delta) {
	var snowballPos = snowball.GetBody().GetWorldCenter();
	var snowballRadius = snowball.GetShape().GetRadius();
	for (var i in stars) {
		var star = stars[i];
		if (!star.gotten) {
			if ((snowballPos.x-star.x)*(snowballPos.x-star.x) +
(snowballPos.y-star.y)*(snowballPos.y-star.y) < snowballRadius*snowballRadius+starSize*starSize) {
				star.gotten = true;
				starsFound++;
				boostTime += 3000;
			}
		}
	}

	if (boostTime>0) {
		if (Math.random()<0.2) {
			trailStars.push({
				x:snowballPos.x,
				y:snowballPos.y + (Math.random()-0.5)*starSize,
				time:1000
			});
		}
	}

	for (var i in trailStars) {
		var trailStar = trailStars[i];
		trailStar.time -= delta;
		if (trailStar.time < 0) {
			trailStars.splice(i,1);
			i--;
		}
	}
}

var vs;
function update(delta) {

	if (!started) {
		checkStart();
		return;
	}

	if (!win) {
		checkWin();
	} else {
		winCountDown-=delta;
	}

	if (!win || winCountDown > 0) {

	if (boostTime > 0) {
		boostTime -= delta;
		s.snowTakeUp = 0.8;
		s.snowCalmingDropOff = 0.8;

	} else {
		s.snowTakeUp = 0.8;
		s.snowCalmingDropOff = 0.5;
	}

	gameTime = (getTime()-startTime)/1000;
	remainingTime = timeLimit-gameTime;

	world.Step(delta/1000, 10, 10);
	world.ClearForces();

	var ballT = snowball.GetBody().GetTransform();
	if (ballT.position.x < 0) {
		ballT.position.x = worldSize.x+ballT.position.x;
		snowball.GetBody().SetTransform(ballT);
	} else if (ballT.position.x > worldSize.x) {
		ballT.position.x = ballT.position.x-worldSize.x;
		snowball.GetBody().SetTransform(ballT);
	}


	var radius = snowball.GetShape().GetRadius();
	if (keys[key_left]) {
		snowball.m_body.ApplyImpulse(new b2Vec2(-s.airSpeed,s.airSpeed*0.5), snowball.m_body.GetWorldCenter());
//        snowball.m_body.SetLinearVelocity(new b2Vec2(-s.airSpeed,snowball.m_body.GetLinearVelocity().y), snowball.m_body.GetWorldCenter());
		if (snowball.m_body.GetAngularVelocity() > -s.minRotationSpeed) {
			snowball.m_body.SetAngularVelocity(-(s.minRotationSpeed+2));
		} else {
			snowball.m_body.ApplyTorque(-s.torqueToApply);
		}
	}
	if (keys[key_right]) {
		snowball.m_body.ApplyImpulse(new b2Vec2(s.airSpeed,s.airSpeed*0.5), snowball.m_body.GetWorldCenter());
//        snowball.m_body.SetLinearVelocity(new b2Vec2(s.airSpeed,snowball.m_body.GetLinearVelocity().y), snowball.m_body.GetWorldCenter());
		if (snowball.m_body.GetAngularVelocity() < s.minRotationSpeed) {
			snowball.m_body.SetAngularVelocity(s.minRotationSpeed+2);
		} else {
			snowball.m_body.ApplyTorque(s.torqueToApply);
		}
	}

	updateStars(delta);

	//scale the world
	var radius = snowball.GetShape().GetRadius();
	if (radius > sizeJumps[lastSizeJump]) {
		lastSizeJump++;
		s.worldScale = 40/sizeJumps[lastSizeJump];
	}
	s.minRotationSpeed = origMinRotationSpeed * radius*radius*radius*radius;
	s.torqueToApply = origTorqueToApply * radius*radius*radius*radius*radius;
	s.airSpeed = origAirSpeed * radius*radius;
	// center the camera
	camera.x = snowball.m_body.GetWorldCenter().x - (screenSize.x*0.5)/s.worldScale;
	camera.y = snowball.m_body.GetWorldCenter().y - (screenSize.y*0.5)/s.worldScale;
	}

}

function removeSnow(i) {
	var gp = groundPieces[i];
	vs = gp.GetShape().GetVertices();
	if (vs[3].y - vs[0].y < 1) {
		groundPieces[i] = undefined;
		world.DestroyBody(gp.GetBody());
	}
}

function shrinkSnow(i, deformation) {
	var gp = groundPieces[i];
	if (gp) {
		var radius = snowball.GetShape().GetRadius();
		snowball.GetShape().SetRadius(radius+s.snowballGrowth*Math.sqrt(radius)*s.snowTakeUp*(boostTime>0?2:1));
		vs = gp.GetShape().GetVertices();
		vs[0].y += deformation;
		vs[1].y += deformation;
		var diff = (vs[0].y - vs[1].y)*s.snowEveningFactor;
		vs[0].y -= diff;
		vs[1].y += diff;
		groundPieces[i].GetShape().SetAsArray(vs, 4);
		removeSnow(i);
		for (var n = 1, lim = Math.max(s.snowCalmingCount*Math.ceil(s.snowTakeUp*radius),s.minSnowCalmingCount); n < lim ; n++) {
			if (groundPieces[i-n]) {
				vs = groundPieces[i-n].GetShape().GetVertices();
				vs[1].y += deformation - diff;
				if (n < lim-1)
				vs[0].y += deformation*s.snowCalmingDropOff - diff*s.snowCalmingDropOff;
				groundPieces[i-n].GetShape().SetAsArray(vs, 4);
				removeSnow(i-n);
			}
			if (groundPieces[i+n]) {
				vs = groundPieces[i+n].GetShape().GetVertices();
				vs[0].y += deformation + diff;
				if (n < lim-1)
				vs[1].y += deformation*s.snowCalmingDropOff + diff*s.snowCalmingDropOff;
				groundPieces[i+n].GetShape().SetAsArray(vs, 4);
				removeSnow(i+n);
			}
			deformation *= s.snowCalmingDropOff;
			diff *= s.snowCalmingDropOff;
		}
	}
}

function postSolve(contact, contactImpulses) {
//    var poop = "john";
}

// attempt to make the ground squishy, didnt work
function preSolve(contact, manifold) {
	var ground;
	if (contact.GetFixtureA().GetUserData().name === "ground" && contact.GetFixtureB().GetUserData().name === "snowball") {
		ground = contact.GetFixtureA();
	} else if (contact.GetFixtureB().GetUserData().name === "ground" && contact.GetFixtureA().GetUserData().name === "snowball") {
		ground = contact.GetFixtureB();
	}

	if (ground) {
		var vs = ground.GetShape().GetVertices();
		var snowballPos = snowball.GetBody().GetWorldCenter();
		var minDist = 0.2;
		if (vs[0].y - snowballPos.y > -minDist && vs[1].y - snowballPos.y > -minDist) {
			contact.SetEnabled(false);
		}
	}
}

var lasti = -1000;
var lastSnowballContactPos = new b2Vec2();
function endContact(contact) {
	var ground;
	if (contact.GetFixtureA().GetUserData().name === "ground" && contact.GetFixtureB().GetUserData().name === "snowball") {
		ground = contact.GetFixtureA();
	} else if (contact.GetFixtureB().GetUserData().name === "ground" && contact.GetFixtureA().GetUserData().name === "snowball") {
		ground = contact.GetFixtureB();
	}

	if (ground) {
		if (Math.abs(snowball.GetBody().GetLinearVelocity().x) > 5) {
			var i = ground.GetUserData().index;

			var snowballRadius = snowball.GetShape().GetRadius();
			var deformation = s.snowTakeUp * Math.sqrt(snowballRadius);

			shrinkSnow(i, deformation);
		}
	}
}

var camera = {x:0, y:0};
var snowballSize = 5;
var stripExcess = 0.5;
function draw() {
	

	houndsContext.globalCompositeOperation = "source-over";

	houndsContext.clearRect(0,0,screenSize.x, screenSize.y);

	if (started && (!win || winCountDown > 0)) {
	// scenerey
	houndsContext.fillStyle = "#000000";
	houndsContext.lineWidth = 5;

	var cameraView = new b2AABB();
	cameraView.lowerBound = new b2Vec2(camera.x, camera.y);
	cameraView.upperBound = new b2Vec2(camera.x+screenSize.x/s.worldScale, camera.y+screenSize.y/s.worldScale);
	
	var drawOffset = {x:0,y:0};
	var drawTheWorldCB = function(fixture) {
		if (fixture.GetUserData().name === "ground") {
			houndsContext.beginPath();
			var shape = fixture.GetShape();
			var offset = fixture.GetBody().GetWorldCenter();
			if (shape instanceof b2PolygonShape) {
				var vs = shape.GetVertices();
				var v = vs[vs.length-1];
				houndsContext.moveTo((v.x + offset.x - camera.x + drawOffset.x)*s.worldScale - stripExcess, (v.y + offset.y - camera.y + drawOffset.y)*s.worldScale);
				for (var i = 0 , lim = vs.length; i < lim ; ++i) {
					v = vs[i];
					houndsContext.lineTo((v.x + offset.x - camera.x + drawOffset.x)*s.worldScale+(i<1?-stripExcess:stripExcess) , (v.y + offset.y - camera.y + drawOffset.y)*s.worldScale);
				}
				houndsContext.fill();
			}
		}
		return true;
	};
	world.QueryAABB(drawTheWorldCB, cameraView);

	cameraView.lowerBound = new b2Vec2(camera.x-worldSize.x, camera.y);
	cameraView.upperBound = new b2Vec2(camera.x+screenSize.x/s.worldScale-worldSize.x, camera.y+screenSize.y/s.worldScale);
	drawOffset.x = worldSize.x;
	world.QueryAABB(drawTheWorldCB, cameraView);

	cameraView.lowerBound = new b2Vec2(camera.x+worldSize.x, camera.y);
	cameraView.upperBound = new b2Vec2(camera.x+screenSize.x/s.worldScale+worldSize.x, camera.y+screenSize.y/s.worldScale);
	drawOffset.x = -worldSize.x;
	world.QueryAABB(drawTheWorldCB, cameraView);

	} else if (!started) {
		drawStart(houndsContext);
	} else {
		drawWin(houndsContext);
	}

	houndsContext.globalCompositeOperation = "source-atop";
	//houndstooth
	var offsetX = (camera.x*s.worldScale)%houndstoothImage.width;
	var offsetY = (camera.y*s.worldScale)%houndstoothImage.height;
	var worldx = Math.floor((camera.x*s.worldScale)/houndstoothImage.width);
	var xlim = Math.ceil(screenSize.x/houndstoothImage.width);
	var ylim = Math.ceil(screenSize.y/houndstoothImage.height);
	for (var x = -2 ; x < xlim+2 ; x++) {
		for (var y = -2 ; y < ylim+2 ; y++) {
			houndsContext.drawImage(
				houndstoothImage,
				x*houndstoothImage.width-offsetX,
				y*houndstoothImage.height+((worldx+x+2)%2?1:0.5)*houndstoothImage.height-offsetY);
		}
	}

	stripesContext.globalCompositeOperation = "source-over";

	stripesContext.clearRect(0,0,screenSize.x, screenSize.y);
	stripesContext.globalCompositeOperation = "source-over";

	if (started && (!win || winCountDown > 0)) {
		
		//snowball
		stripesContext.fillStyle = "#000000";
		stripesContext.lineWidth = 5;
		stripesContext.beginPath();
		var snowballPos = snowball.m_body.GetWorldCenter();
		stripesContext.arc((snowballPos.x - camera.x)*s.worldScale, (snowballPos.y - camera.y)*s.worldScale, (snowball.m_shape.m_radius+0.5)*s.worldScale, 0, Math.PI*2, true);
		stripesContext.fill();

		drawStars(stripesContext, 0);
		drawStars(stripesContext, -worldSize.x);
		drawStars(stripesContext, worldSize.x);

	}

	drawScore(stripesContext);

	stripesContext.globalCompositeOperation = "source-atop";
	//stripes
	var offsetX = (camera.x*s.worldScale)%stripesImage.width;
	var offsetY = (camera.y*s.worldScale)%stripesImage.height;
	var worldx = Math.floor((camera.x*s.worldScale)/stripesImage.width);
	var xlim = Math.ceil(screenSize.x/stripesImage.width);
	var ylim = Math.ceil(screenSize.y/stripesImage.height);
	for (var x = -2 ; x < xlim+2 ; x++) {
		for (var y = -2 ; y < ylim+2 ; y++) {
			stripesContext.drawImage(
				stripesImage,
				x*stripesImage.width-offsetX,
				y*stripesImage.height-offsetY);
		}
	}


	// draw the two contexts
	context.clearRect(0,0,screenSize.x, screenSize.y);
	context.drawImage(houndsCanvas, 0,0);
	context.drawImage(stripesCanvas, 0,0);

}

function drawStar(context, star, starSize, offsetx) {
	if (star.x+offsetx+starSize > camera.x && star.x+offsetx-starSize < camera.x + screenSize.x*s.worldScale) {
		var spikes = 5;
		var r0 = starSize, r1 = starSize/3;
		var rot = Math.PI/2*3, x=star.x+offsetx, y=star.y, step=Math.PI/spikes;
		rot += gameTime%(2*Math.PI);

		context.fillSyle="#000000";
		context.beginPath();
		x=star.x+offsetx+Math.cos(rot)*r0;
		y=star.y+Math.sin(rot)*r0;
		context.moveTo((x-camera.x)*s.worldScale,(y-camera.y)*s.worldScale)
		for(i=0;i<spikes;i++){
			x=star.x+offsetx+Math.cos(rot)*r0;
			y=star.y+Math.sin(rot)*r0;
			context.lineTo((x-camera.x)*s.worldScale,(y-camera.y)*s.worldScale)
			rot+=step

			x=star.x+offsetx+Math.cos(rot)*r1;
			y=star.y+Math.sin(rot)*r1;
			context.lineTo((x-camera.x)*s.worldScale,(y-camera.y)*s.worldScale)
			rot+=step
		}
		x=star.x+offsetx+Math.cos(rot)*r0;
		y=star.y+Math.sin(rot)*r0;
		context.lineTo((x-camera.x)*s.worldScale,(y-camera.y)*s.worldScale)
		context.fill();
	}
}

function drawStars(context, offsetx) {
	for (var j in stars) {
		var star = stars[j];
		if (!star.gotten) {
			drawStar(context, star, starSize, offsetx);
		}
	}
	for (var i in trailStars) {
		drawStar(context, trailStars[i], starSize/3, offsetx);
	}
}

function drawScore(context) {
	var textToDisplay = snowball.GetShape().GetRadius().toFixed(2) + "m";
	var textMeasurements = context.measureText(textToDisplay);

	context.font = "50px sirin-stencil";
	context.fillStyle = "#000000";
	context.fillText(textToDisplay, 10, 50);


	textToDisplay = Math.floor(remainingTime/60) + ":" + Math.floor(remainingTime%60);
	textMeasurements = context.measureText(textToDisplay);

	context.font = "50px sirin-stencil";
	context.fillStyle = "#000000";
	context.fillText(textToDisplay, screenSize.x - textMeasurements.width-10, 50);


	textToDisplay = starsFound;
	textMeasurements = context.measureText(textToDisplay);

	context.font = "100px sirin-stencil";
	context.fillStyle = "#000000";
	context.fillText(textToDisplay, 10, screenSize.y-10);
}

function drawTitle() {
}

function drawAnouncement() {
}
