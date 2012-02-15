var mapWidth, mapHeight;
var viewWidth, viewWidth;

var map = [];
var endPoint = {x:0, y:0};

var mother = {x:0, y:0, speed:0.004, rotation:0, aimRotation:0,
	tentacles:[{x:0,y:0}, {x:0,y:0}, {x:0,y:0}, {x:0,y:0}],
	moving:{x:0, y:0}, wasMoving:{x:0, y:0}
};
var babies = [];

var tentacleSnap = 400;

var camera = {x:0, y:0};

var tileSize = 32;
var gravity = 0.008;

var LOADING = 0;
var LOADED = 1;
var PLAYING = 2;
var PAUSED = 3;
var LEVEL_WON = 4;
var LEVEL_LOST = 5;
var GAME_WON = 6;
var gameState = LOADING;

var SOLID_TILE = 2;
var ICE_TILE = 1;
var SPIKE_TILE = 4;

var currentLevel = 3;
var lastLevel = 5;

var stateChangeTime = new Date();

var walkSound;
var fallSound;
var babySound;
var nestSound;
var deathSound;
var themeMusic;

function init() {
	loadLevel(currentLevel);
}

function initSounds() {
	themeMusic = soundManager.createSound({id:"theme", url:"adam adamant - brogues.mp3", loops:10000, autoLoad:true, onload: function(){themeMusic.play();}});

	walkSound = makeSFX("walk.wav");
	fallSound = makeSFX("fall.wav");
	babySound = makeSFX("baby.wav");
	nestSound = makeSFX("nest.wav");
	deathSound = makeSFX("death.wav");
}

function loadLevel(levelNumber) {
	if (levelNumber === lastLevel+1) {
		gameState = GAME_WON;
		return;
	}
	mother = {x:0, y:0, speed:0.004, rotation:0, aimRotation:0,
		tentacles:[{x:0,y:0}, {x:0,y:0}, {x:0,y:0}, {x:0,y:0}],
		moving:{x:0, y:0}, wasMoving:{x:0, y:0}
	};

	currentLevel = levelNumber;
	gameState = LOADING;

	viewWidth = canvas.width / tileSize;
	viewHeight = canvas.height / tileSize;

	$.getJSON("level"+levelNumber+".json", function(data) {

		mapWidth = data.width;
		mapHeight = data.height;

		babies = [];
		endPoint = {x:0, y:0};

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
								case 6: // end point
									endPoint = {x:x, y:y};
									break;
								case 8: // baby
									var baby = {};
									baby.x = (x+0.5)*tileSize;
									baby.y = (y+0.5)*tileSize;
									babies.push(baby);
									break;
							}
						}
					}
					break;
			}
		}

		gameState = LOADED;
		stateChangeTime = new Date();
	});
}

function draw() {
	clear("#000000");


	if (gameState === LOADING) return;

	if (gameState === LOADED) {
		context.textAlign = "center";
		context.font = "40pt monospace";
		context.strokeStyle = "#ffffff";
		context.lineWidth = 2;
		context.fillStyle = "#000000";
		var text = "Level " + currentLevel;
		context.strokeText(text, screenSize.x/2, screenSize.y/2);
		context.fillText(text, screenSize.x/2, screenSize.y/2);

		context.textAlign = "center";
		context.font = "20pt monospace";
		context.strokeStyle = "#ffffff";
		context.lineWidth = 2;
		context.fillStyle = "#000000";
		text = "press space";
		context.strokeText(text, screenSize.x/2, screenSize.y/2+40);
		context.fillText(text, screenSize.x/2, screenSize.y/2+40);
	} else if (gameState === GAME_WON) {
		context.textAlign = "center";
		context.font = "40pt monospace";
		context.strokeStyle = "#ffffff";
		context.lineWidth = 2;
		context.fillStyle = "#000000";
		var text = "The End";
		context.strokeText(text, screenSize.x/2, screenSize.y/2);
		context.fillText(text, screenSize.x/2, screenSize.y/2);
	} else if (gameState === PLAYING || gameState === LEVEL_LOST || gameState === LEVEL_WON) {

		// draw the world
		for (var x = camera.x; x < camera.x+viewWidth ; x++) {
			for (var y = camera.y; y < camera.y+viewWidth ; y++) {
				switch (map[x][y]) {
					case SOLID_TILE: // solid tile
						context.fillStyle = "#ff00ff";
						context.fillRect((x-camera.x)*tileSize+1, (y-camera.y)*tileSize+1, tileSize-1, tileSize-1);
					break;
					case ICE_TILE:// ice tile
						context.fillStyle = "#0000ff";
						context.fillRect((x-camera.x)*tileSize+1, (y-camera.y)*tileSize+1, tileSize-1, tileSize-1);
					break;
					case SPIKE_TILE:// spike tile
						context.fillStyle = "#ff0000";
						context.fillRect((x-camera.x)*tileSize+1, (y-camera.y)*tileSize+1, tileSize-1, tileSize-1);
					break;
				}
			}
		}

		// draw the mother

		context.beginPath();
		context.strokeStyle = "#ffffff";
		context.strokeWidth = 1.0;
		for (var t = 0; t < mother.tentacles.length ; t++) {
			context.moveTo(mother.x-camera.x*tileSize, mother.y-camera.y*tileSize);
			context.lineTo(mother.tentacles[t].x-camera.x*tileSize, mother.tentacles[t].y-camera.y*tileSize);
		}
		context.closePath();
		context.stroke();


		context.fillStyle = "#ffffff";
		context.beginPath();
		context.arc(mother.x-camera.x*tileSize, mother.y-camera.y*tileSize, 2,0,Math.PI*2, true);
		context.closePath();
		context.fill();

		// draw the babies
		for (var b = 0 ; b < babies.length ; b++) {
			var baby = babies[b];

			context.beginPath();
			context.strokeStyle = "#ffffff";
			context.strokeWidth = 0.5;
			for (var t = 0; t < 4 ; t++) {
				context.moveTo(baby.x-camera.x*tileSize, baby.y-camera.y*tileSize);
				context.lineTo(baby.x+(Math.cos(Math.PI*t/2)/4-camera.x)*tileSize, baby.y+(Math.sin(Math.PI*t/2)/4-camera.y)*tileSize);
			}
			context.closePath();
			context.stroke();


			context.fillStyle = "#ffffff";
			context.beginPath();
			context.arc(baby.x-camera.x*tileSize, baby.y-camera.y*tileSize, 3,0,Math.PI*2, true);
			context.closePath();
			context.fill();
		}
		

		// draw the enpoint
		context.beginPath();
		context.strokeStyle = "#ffff00";
		Math.seedrandom(babies.length);
		for (var i = 0 ; i < 10 ; i++) {
			context.moveTo((endPoint.x-camera.x+0.2)*tileSize+Math.random()*tileSize/2, (endPoint.y-camera.y)*tileSize+Math.random()*tileSize/2+tileSize/2);
			context.lineTo((endPoint.x-camera.x+0.8)*tileSize+Math.random()*tileSize/2, (endPoint.y-camera.y)*tileSize+Math.random()*tileSize);
			context.moveTo((endPoint.x-camera.x+0.8)*tileSize-Math.random()*tileSize/2, (endPoint.y-camera.y)*tileSize+Math.random()*tileSize/2+tileSize/2);
			context.lineTo((endPoint.x-camera.x+0.2)*tileSize-Math.random()*tileSize/2, (endPoint.y-camera.y)*tileSize+Math.random()*tileSize);
		}
		context.closePath();
		context.stroke();


		// draw the lose
		if (gameState === LEVEL_LOST) {
			context.textAlign = "center";
			context.font = "40pt monospace";
			context.strokeStyle = "#ffffff";
			context.lineWidth = 2;
			context.fillStyle = "#000000";
			var text = "Dead!";
			context.strokeText(text, screenSize.x/2, screenSize.y/2);
			context.fillText(text, screenSize.x/2, screenSize.y/2);
		}
		else if (gameState === LEVEL_WON) {
			context.textAlign = "center";
			context.font = "40pt monospace";
			context.strokeStyle = "#ffffff";
			context.lineWidth = 2;
			context.fillStyle = "#000000";
			var text = "Win!";
			context.strokeText(text, screenSize.x/2, screenSize.y/2);
			context.fillText(text, screenSize.x/2, screenSize.y/2);
		}
	}
}

function blockIsEmpty(x,y) {
	return map[x][y] === 0 || map[x][y] === SPIKE_TILE;
}

function update(delta) {
	Math.seedrandom(new Date().getMilliseconds());
	if (gameState === LOADING) return;

	if (gameState === LOADED) {
		if (keys[key_space] && new Date() - stateChangeTime > 500) {
			gameState = PLAYING;
			stateChangeTime = new Date();
		}
	} else if (gameState === LEVEL_LOST) {
		if (new Date() - stateChangeTime > 2000) {
			loadLevel(currentLevel);
		}
	} else if (gameState === PLAYING) {
		var lastBabyRescued;
		var babiesRescued = 0;
		for (var b = 0 ; b < babies.length ; b++) {
			var baby = babies[b];
			if (baby.rescued) {
				babiesRescued ++;
				if (lastBabyRescued) {
					baby.x += (lastBabyRescued.x - baby.x) * delta/1000 * 10;
					baby.y += (lastBabyRescued.y - baby.y) * delta/1000 * 10;
				} else {
					baby.x += (mother.x - baby.x) * delta/1000 * 10;
					baby.y += (mother.y - baby.y) * delta/1000 * 10;
				}
	//            baby.x += (Math.random()-0.5)*delta*0.01;
	//            baby.y += (Math.random()-0.5)*delta*0.01;
				lastBabyRescued = baby;
			} else if (Math.floor(mother.x/tileSize) === Math.floor(baby.x/tileSize) && Math.floor(mother.y/tileSize) === Math.floor(baby.y/tileSize)) {
				baby.rescued = true;
				babySound.play();
			}
		}

		// win state
		if (Math.floor(mother.x/tileSize) === endPoint.x && Math.floor(mother.y/tileSize) === endPoint.y) {
			if (babiesRescued === babies.length) {
				gameState = LEVEL_WON;
				stateChangeTime = new Date();
				nestSound.play();
			}
		}

		// spike tiles kill
		var x = Math.floor(mother.x/tileSize);
		var y = Math.floor(mother.y/tileSize);
		if (map[x][y] === SPIKE_TILE) {
			gameState = LEVEL_LOST;
			stateChangeTime = new Date();
			deathSound.play();
			return;
		}

		if (mother.moving) {
			mother.x += delta*mother.moving.x*tileSize*mother.speed;
			mother.y += delta*mother.moving.y*tileSize*mother.speed;

			var rotationDirection = mother.aimRotation-mother.rotation < 0 ? -1 : 1;
			mother.rotation += delta*Math.PI*0.5*mother.speed*rotationDirection;

			if ((mother.moving.x === 1 && mother.x >= mother.aim.x) ||
				(mother.moving.x === -1 && mother.x <= mother.aim.x)) {
				mother.wasMoving.x = mother.moving.x;
				mother.moving.x = 0;
				mother.x = mother.aim.x;
			}
			if ((mother.moving.y === 1 && mother.y >= mother.aim.y) ||
				(mother.moving.y === -1 && mother.y <= mother.aim.y)) {
				mother.wasMoving.y = mother.moving.y;
				mother.moving.y = 0;
				mother.y = mother.aim.y;
			}
			if (mother.moving.y === 0 && mother.moving.x === 0) {
				var x = Math.floor(mother.x/tileSize);
				var y = Math.floor(mother.y/tileSize);
				// ice tiles slide
				var emptyBlocks = 0;
				var iceBlocks = 0;
				if (blockIsEmpty(x,y+1)) emptyBlocks++;
				if (blockIsEmpty(x,y-1)) emptyBlocks++;
				if (blockIsEmpty(x+1,y)) emptyBlocks++;
				if (blockIsEmpty(x-1,y)) emptyBlocks++;
				if (mother.wasMoving.y === 0) {
					if (map[x][y+1] === ICE_TILE) iceBlocks++;
					if (map[x][y-1] === ICE_TILE) iceBlocks++;
				}
				if (mother.wasMoving.x === 0) {
					if (map[x+1][y] === ICE_TILE) iceBlocks++;
					if (map[x-1][y] === ICE_TILE) iceBlocks++;
				}
				if (emptyBlocks+iceBlocks === 4 && iceBlocks >= 1) {
					mother.aim.x += mother.wasMoving.x*tileSize;
					mother.aim.y += mother.wasMoving.y*tileSize;
					mother.moving.x = mother.wasMoving.x;
					mother.moving.y = mother.wasMoving.y;
					fallSound.play();
				} else {
					mother.moving = undefined;
					mother.wasMoving = {x:0, y:0};
				}
				mother.rotation = mother.aimRotation;
			}
		} else {
			var x = Math.floor(mother.x/tileSize);
			var y = Math.floor(mother.y/tileSize);
			if (blockIsEmpty(x, y+1) &&
				blockIsEmpty(x, y-1) &&
				blockIsEmpty(x-1, y) &&
				blockIsEmpty(x+1, y)) {
					mother.moving = {x:0, y:+1};
					mother.aim = {x:mother.x, y:mother.y+tileSize};
					fallSound.play();
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
					if (blockIsEmpty(x+desiredMove.x, y+desiredMove.y)) {
						mother.moving = desiredMove;
						mother.aim = {x:mother.x+desiredMove.x*tileSize, y:mother.y+desiredMove.y*tileSize};
						walkSound.play();
					}
				}
				
			}
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

			} else {
				var mapX = Math.floor(aimX/tileSize);
				var mapY1 = Math.floor(aimY/tileSize);
				var mapY2 = mapY1-1;
				canSnap = map[mapX][mapY1] === SOLID_TILE || map[mapX][mapY2] === SOLID_TILE;

			}
			if (canSnap && (tentacle.x - aimX)*(tentacle.x - aimX) + (tentacle.y-aimY)*(tentacle.y-aimY) < tentacleSnap) {
				tentacle.x = aimX;
				tentacle.y = aimY;
			}
		}
		camera.x = Math.floor((mother.x/tileSize) / viewWidth)*viewWidth;
		camera.y = Math.floor((mother.y/tileSize) / viewHeight)*viewHeight;
	}

	if (gameState === LEVEL_WON) {
		if (new Date() - stateChangeTime > 2000) {
			loadLevel(currentLevel+1);
		}
	}
}
