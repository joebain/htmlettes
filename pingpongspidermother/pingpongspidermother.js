var mapWidth, mapHeight;
var viewWidth, viewWidth;

var map = [];

var mother = {x:0, y:0, speed:0.004, rotation:0, aimRotation:0,
	tentacles:[{x:0,y:0}, {x:0,y:0}, {x:0,y:0}, {x:0,y:0}]
};

var tentacleSnap = 400;

var camera = {x:0, y:0};

var tileSize = 32;
var gravity = 0.008;
var suckersOn = true;

var LOADING = 0;
var LOADED = 1;
var RUNNING = 2;
var PAUSED = 3;
var ENDED = 4;
var gameState = LOADING;

var SOLID_TILE = 2;

function init() {

	viewWidth = canvas.width / tileSize;
	viewHeight = canvas.height / tileSize;

	$.getJSON("map.json", function(data) {

		mapWidth = data.width;
		mapHeight = data.height;

		for (var l = 0 ; l < data.layers.length ; l++) {
			var layer = data.layers[l];
			switch (layer.name) {
				case "scenery":
					map = [];
					for (var x = 0 ; x < mapWidth ; x++) {
						if (!map[x]) {
							map[x] = [];
						}
						for (var y = 0 ; y < mapHeight ; y++) {
							map[x][y] = layer.data[y*mapWidth+x];
						}
					}
					break;
				case "entities":
					for (var x = 0 ; x < mapWidth ; x++) {
						for (var y = 0 ; y < mapHeight ; y++) {
							var item = layer.data[y*mapWidth+x];
							switch (item) {
								case 5: // start point
									mother.x = (x+0.5)*tileSize;
									mother.y = (y+0.5)*tileSize;
									break;
							}
						}
					}
					break;
			}
		}

		gameState = LOADED;
	});
}

function draw() {
	clear("#000000");


	if (gameState === LOADING) return;

	// draw the world
	for (var x = camera.x; x < camera.x+viewWidth ; x++) {
		for (var y = camera.y; y < camera.y+viewWidth ; y++) {
			switch (map[x][y]) {
				case 2: // solid tile
					context.fillStyle = "#ff00ff";
					context.fillRect((x-camera.x)*tileSize+1, (y-camera.y)*tileSize+1, tileSize-1, tileSize-1);
				break;
			}
		}
	}

	// draw the mother

	context.beginPath();
	context.strokeStyle = "#ffffff";
	for (var t = 0; t < mother.tentacles.length ; t++) {
		context.moveTo(mother.x-camera.x*tileSize, mother.y-camera.y*tileSize);
		context.lineTo(mother.tentacles[t].x-camera.x*tileSize, mother.tentacles[t].y-camera.y*tileSize);
	}
	context.closePath();
	context.stroke();


	if (suckersOn) {
		context.fillStyle = "#ffffff";
	} else {
		context.fillStyle = "#ff0000";
	}
	context.beginPath();
	context.arc(mother.x-camera.x*tileSize, mother.y-camera.y*tileSize, 2,0,Math.PI*2, true);
	context.closePath();
	context.fill();
}

function update(delta) {
	if (gameState === LOADING) return;

	if (keys[key_space]) {
		suckersOn = false;
	} else {
		suckersOn = true;
	}
	if (mother.moving) {
		mother.x += delta*mother.moving.x*tileSize*mother.speed;
		mother.y += delta*mother.moving.y*tileSize*mother.speed;

		var rotationDirection = mother.aimRotation-mother.rotation < 0 ? -1 : 1;
		mother.rotation += delta*Math.PI*0.5*mother.speed*rotationDirection;

		if ((mother.moving.x === 1 && mother.x >= mother.aim.x) ||
			(mother.moving.x === -1 && mother.x <= mother.aim.x)) {
			mother.moving.x = 0;
			mother.x = mother.aim.x;
		}
		if ((mother.moving.y === 1 && mother.y >= mother.aim.y) ||
			(mother.moving.y === -1 && mother.y <= mother.aim.y)) {
			mother.moving.y = 0;
			mother.y = mother.aim.y;
		}
		if (mother.moving.y === 0 && mother.moving.x === 0) {
			mother.moving = undefined;
			mother.rotation = mother.aimRotation;
		}
	} else {
		var x = Math.floor(mother.x/tileSize);
		var y = Math.floor(mother.y/tileSize);
		if ((map[x][y+1] !== SOLID_TILE &&
			map[x][y-1] !== SOLID_TILE &&
			map[x+1][y] !== SOLID_TILE &&
			map[x-1][y] !== SOLID_TILE) ||
			(!suckersOn && map[x][y+1] !== SOLID_TILE)) {
			mother.moving = {x:0, y:+1};
			mother.aim = {x:mother.x, y:mother.y+tileSize};
		} else {
			var desiredMove = {x:0, y:0};
			if (!mother.moving) {
				if (keys[key_right]) {
					desiredMove.x += 1;
					if (map[x][y+1] === SOLID_TILE) {
						mother.aimRotation = mother.rotation + Math.PI/2;
					} else if (map[x][y-1] === SOLID_TILE) {
						mother.aimRotation = mother.rotation - Math.PI/2;
					}
				}
				if (keys[key_left]) {
					desiredMove.x -= 1;
					if (map[x][y+1] === SOLID_TILE) {
						mother.aimRotation = mother.rotation - Math.PI/2;
					} else if (map[x][y-1] === SOLID_TILE) {
						mother.aimRotation = mother.rotation + Math.PI/2;
					}
				}
				if (keys[key_down]) {
					desiredMove.y += 1;
					if (map[x+1][y] === SOLID_TILE) {
						mother.aimRotation = mother.rotation - Math.PI/2;
					} else if (map[x-1][y] === SOLID_TILE) {
						mother.aimRotation = mother.rotation + Math.PI/2;
					}
				}
				if (keys[key_up]) {
					desiredMove.y -= 1;
					if (map[x+1][y] === SOLID_TILE) {
						mother.aimRotation = mother.rotation + Math.PI/2;
					} else if (map[x-1][y] === SOLID_TILE) {
						mother.aimRotation = mother.rotation - Math.PI/2;
					}
				}
			}
			if (desiredMove.x !== 0 || desiredMove.y !== 0) {
				if (map[x+desiredMove.x][y+desiredMove.y] === 0) {
					mother.moving = desiredMove;
					mother.aim = {x:mother.x+desiredMove.x*tileSize, y:mother.y+desiredMove.y*tileSize};
				}
			}
			
		}

		camera.x = Math.floor((mother.x/tileSize) / viewWidth)*viewWidth;
		camera.y = Math.floor((mother.y/tileSize) / viewHeight)*viewHeight;
	}

	for (var t = 0 ; t < mother.tentacles.length ; t++) {
		var tentacle = mother.tentacles[t];

		tentacle.x = mother.x + Math.cos(mother.rotation+Math.PI*((t+1)/2)) * tileSize/2;
		tentacle.y = mother.y + Math.sin(mother.rotation+Math.PI*((t+1)/2)) * tileSize/2;

		var aimX = Math.round(tentacle.x / (tileSize*0.5))*tileSize*0.5;
		var modY = (Math.round(tentacle.x/(tileSize*0.5))+1)%2;
		var aimY = Math.round((tentacle.y-modY*tileSize*0.5) / tileSize)*tileSize + modY*tileSize*0.5;

		var canSnap = false;
		if (modY) {
			var mapX1 = Math.floor(aimX/tileSize);
			var mapX2 = mapX1-1;
			var mapY = Math.floor(aimY/tileSize);
			canSnap = map[mapX1][mapY] === SOLID_TILE || map[mapX2][mapY] === SOLID_TILE;

//            context.strokeStyle = "#0000ff";
//            context.strokeRect(mapX1*tileSize+1, mapY*tileSize+1, tileSize-1, tileSize-1);
//            context.strokeRect(mapX2*tileSize+1, mapY*tileSize+1, tileSize-1, tileSize-1);
		} else {
			var mapX = Math.floor(aimX/tileSize);
			var mapY1 = Math.floor(aimY/tileSize);
			var mapY2 = mapY1-1;
			canSnap = map[mapX][mapY1] === SOLID_TILE || map[mapX][mapY2] === SOLID_TILE;

//            context.strokeStyle = "#0000ff";
//            context.strokeRect(mapX*tileSize+1, mapY1*tileSize+1, tileSize-1, tileSize-1);
//            context.strokeRect(mapX*tileSize+1, mapY2*tileSize+1, tileSize-1, tileSize-1);
		}
		if (canSnap && (tentacle.x - aimX)*(tentacle.x - aimX) + (tentacle.y-aimY)*(tentacle.y-aimY) < tentacleSnap) {
			tentacle.x = aimX;
			tentacle.y = aimY;
		}
//        context.fillStyle = "#ff0000";
//        context.beginPath();
//        context.arc(aimX, aimY, 2,0,Math.PI*2, true);
//        context.closePath();
//        context.fill();
	}
}
