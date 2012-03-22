var mapWidth, mapHeight;
var viewWidth, viewWidth;

var map = [];
var mapExtra = [];
var endPoint = {x:0, y:0};

var mother = {x:0, y:0, speed:0.004, rotation:0, aimRotation:0,
	tentacles:[{x:0,y:0}, {x:0,y:0}, {x:0,y:0}, {x:0,y:0}],
	moving:{x:0, y:0}, wasMoving:{x:0, y:0}
};
var babies = [];

var tentacleSnap = 400;
var buttonWidth = 70;

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
var TITLE_SCREEN = 7;
var gameState = TITLE_SCREEN;

var NO_TILE = 0;
var SOLID_TILE = 2;
var ICE_TILE = 1;
var SPRING_TILE = 3;
var SPIKE_TILE = 4;
var FAKE_TILE = 6;
var INVISIBLE_TILE = 7;
var PLAIN_TILE = 100;
var CRUMBLE_TILE = 5;

var currentLevel = 1;
var lastLevel = 12;
var highestLevelUnlocked = 1;

var stateChangeTime = getTime();
var lastKeyPressTime = getTime();

var walkSound;
var fallSound;
var babySound;
var nestSound;
var deathSound;
var themeMusic;
var themeIntro;

var cBlockPadding = 2;

var moveKeyedAt;
var cWaitForMoveTime = 50;
var desiredMove;

var spotlightPos = {x:0, y:0, vY:0, vX:0, aY:0, aX:0};


var globalRandom = new FastRandom(10);//{random:Math.random};

function init() {
	if (settings.level) {
		settings.level = Number(settings.level);
		currentLevel = settings.level;
		highestLevelUnlocked = settings.level;
	}

	spotlightPos.x = screenSize.x/2;
	spotlightPos.y = screenSize.y/2;

	buttonWidth = this.screenSize.y / 6;
}

function initSounds() {
	themeIntro = soundManager.createSound({id:"intro", url:"brogues-intro.mp3", autoLoad:true, onfinish: playMainTheme});
	themeMusic = soundManager.createSound({id:"theme", url:"brogues-main.mp3", loops:10000, autoLoad:true, onload: playIntro});

	walkSound = makeSFX("walk.mp3");
	fallSound = makeSFX("fall.mp3");
	babySound = makeSFX("baby.mp3");
	nestSound = makeSFX("nest.mp3");
	deathSound = makeSFX("death.mp3");
	springSound = makeSFX("spring.mp3");
}

function playMainTheme() {
	themeMusic.play();
}

function playIntro() {
	themeIntro.play();
}

function loadLevel(levelNumber) {
	if (levelNumber > highestLevelUnlocked) {
		settings.level = levelNumber;
		highestLevelUnlocked = levelNumber;
		saveSettings();
	}
	mother = {x:0, y:0, speed:0.004, rotation:0, aimRotation:0,
		tentacles:[{x:0,y:0}, {x:0,y:0}, {x:0,y:0}, {x:0,y:0}],
		moving:{x:0, y:0}, wasMoving:{x:0, y:0}
	};

	currentLevel = levelNumber;
	gameState = LOADING;

	viewWidth = Math.floor(canvas.width / tileSize);
	viewHeight = Math.floor(canvas.height / tileSize);

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
							mapExtra[x] = [];
						}
						for (var y = 0 ; y < mapHeight ; y++) {
							map[x][y] = layer.data[y*mapWidth+x];
							mapExtra[x][y] = {};
						}
					}
					break;
				case "entities":
					for (var x = 0 ; x < mapWidth ; x++) {
						for (var y = 0 ; y < mapHeight ; y++) {
							var item = layer.data[y*mapWidth+x];
							switch (item) {
								case 8: // start point
									mother.x = (x+0.5)*tileSize;
									mother.y = (y+0.5)*tileSize;
									break;
								case 9: // end point
									endPoint = {x:x, y:y};
									break;
								case 11: // baby
									var baby = {};
									baby.x = (x+0.5)*tileSize;
									baby.y = (y+0.5)*tileSize;
									babies.push(baby);
									break;
								case 12: // golden baby
									var baby = {};
									baby.x = (x+0.5)*tileSize;
									baby.y = (y+0.5)*tileSize;
									baby.golden = true;
									babies.push(baby);
									break;
							}
						}
					}
					break;
			}
		}

		gameState = PLAYING;
		stateChangeTime = getTime();
	});
}

function draw() {
	clear("#000000");

	spotlightPos.aX = (Math.random()-0.5)*10;
	spotlightPos.aY = (Math.random()-0.5)*10;
	spotlightPos.vX += spotlightPos.aX/10;
	spotlightPos.vY += spotlightPos.aY/10;
	var maxSpeed = 3;
	if (gameState === TITLE_SCREEN) {
		maxSpeed = 20;
	}
	if (spotlightPos.vX > maxSpeed) spotlightPos.vX = maxSpeed;
	if (spotlightPos.vX < -maxSpeed) spotlightPos.vX = -maxSpeed;
	if (spotlightPos.vY > maxSpeed) spotlightPos.vY = maxSpeed;
	if (spotlightPos.vY < -maxSpeed) spotlightPos.vY = -maxSpeed;
	if (spotlightPos.x < 0 || spotlightPos.x > screenSize.x) spotlightPos.vX *= -1;
	if (spotlightPos.y < 0 || spotlightPos.y > screenSize.y) spotlightPos.vY *= -1;
	spotlightPos.x += spotlightPos.vX/10;
	spotlightPos.y += spotlightPos.vY/10;
	if (!isIE && highQualityGfx) {
		var grad = context.createRadialGradient(spotlightPos.x, spotlightPos.y, 500, spotlightPos.x, spotlightPos.y, 0);
		grad.addColorStop(0, "#000000");
		grad.addColorStop(1, "#222222");
		context.fillStyle = grad;
		context.fillRect(0,0,screenSize.x, screenSize.y);
	}


	if (gameState === LOADING) return;

	if (gameState === LOADED) {
		context.textAlign = "center";
		context.font = "80pt cuteline";
		context.fillStyle = "#ffffff";
		var text = "Level " + currentLevel;
		context.fillText(text, screenSize.x/2, screenSize.y/2);

		context.textAlign = "center";
		context.font = "40pt cuteline";
		context.fillStyle = "#ffffff";
		text = "press space";
		context.fillText(text, screenSize.x/2, screenSize.y/2+200);
	} else if (gameState === GAME_WON) {
		context.textAlign = "center";
		context.font = "80pt cuteline";
		context.fillStyle = "#ffffff";
		var text = "The End";
		context.fillText(text, screenSize.x/2, screenSize.y/2);
	} else if (gameState === TITLE_SCREEN) {
		var textToDisplay = "PingSpider Mother";
		context.font = "80pt cuteline";
		context.textAlign = "center";
		context.fillStyle = "#ffffff";
		if (!isIE && highQualityGfx) {
			var grad = context.createRadialGradient(spotlightPos.x, spotlightPos.y, 500, spotlightPos.x, spotlightPos.y, 0);
			grad.addColorStop(0.6, "#ffffff");
			grad.addColorStop(1, "#efe327");
			context.fillStyle = grad;
		}
		context.fillText("Ping-Pong", screenSize.x/2, screenSize.y/2 - 200);
		context.fillText("Spider Mother", screenSize.x/2, screenSize.y/2 -70);

		context.font = "60pt cuteline";
		if (levelIsGold(currentLevel)) {
			var goldGrad = context.createRadialGradient(spotlightPos.x, spotlightPos.y, 500, spotlightPos.x, spotlightPos.y, 0);
			goldGrad.addColorStop(0.8, "#efe327");
			goldGrad.addColorStop(1, "#ffffff");
			context.fillStyle = goldGrad;
//            context.fillStyle = "#efe327";
		} else {
			if (!isIE && highQualityGfx) {
				context.fillStyle = grad;
			} else {
				context.fillStyle = "#ffffff";
			}
		}
		context.fillText("Level " + currentLevel, screenSize.x/2, screenSize.y/2+100);

		if (!isIE && highQualityGfx) {
			context.strokeStyle = grad;
			context.fillStyle = grad;
		} else {
			context.strokeStyle = "#ffffff";
			context.fillStyle = "#ffffff";
		}
		context.lineWidth = 1.5;
		context.beginPath();
		context.moveTo(screenSize.x/2-250, screenSize.y/2+75);
		context.lineTo(screenSize.x/2-200, screenSize.y/2+95);
		context.lineTo(screenSize.x/2-200, screenSize.y/2+55);
		context.closePath();
		context.stroke();
		context.beginPath();
		context.moveTo(screenSize.x/2-240, screenSize.y/2+75);
		context.lineTo(screenSize.x/2-204, screenSize.y/2+89);
		context.lineTo(screenSize.x/2-204, screenSize.y/2+61);
		context.closePath();
		context.fill();

		context.beginPath();
		context.moveTo(screenSize.x/2+250, screenSize.y/2+75);
		context.lineTo(screenSize.x/2+200, screenSize.y/2+95);
		context.lineTo(screenSize.x/2+200, screenSize.y/2+55);
		context.closePath();
		context.stroke();
		context.beginPath();
		context.moveTo(screenSize.x/2+240, screenSize.y/2+75);
		context.lineTo(screenSize.x/2+204, screenSize.y/2+89);
		context.lineTo(screenSize.x/2+204, screenSize.y/2+61);
		context.closePath();
		context.fill();

		context.font = "36pt ostrich-regular";
		context.fillText("press space", screenSize.x/2, screenSize.y/2+230);
	} else if (gameState === PLAYING || gameState === LEVEL_LOST || gameState === LEVEL_WON) {

		// draw the world
		Math.seedrandom(currentLevel);
		var random = Math.random;
		for (var x = camera.x; x < camera.x+viewWidth ; x++) {
			for (var y = camera.y; y < camera.y+viewWidth ; y++) {
				context.lineWidth = 2;
//                var random = mapExtra[x][y].random;
				var random = new FastRandom(x*mapWidth+y);
				switch (map[x][y]) {
					case FAKE_TILE:
					case SOLID_TILE: // solid tile
						context.strokeStyle = "#483737";
						if (!highQualityGfx && map[x][y] === FAKE_TILE) {
							context.strokeStyle = "#483741";
						}
						context.beginPath();

						context.moveTo((x-camera.x)*tileSize+cBlockPadding, (y-camera.y)*tileSize+cBlockPadding);
						context.lineTo((x-camera.x+1)*tileSize-cBlockPadding, (y-camera.y)*tileSize+cBlockPadding);
						context.lineTo((x-camera.x+1)*tileSize-cBlockPadding, (y-camera.y+1)*tileSize-cBlockPadding);
						context.lineTo((x-camera.x)*tileSize+cBlockPadding, (y-camera.y+1)*tileSize-cBlockPadding);
						context.closePath();
						context.stroke();

						if (highQualityGfx && map[x][y] !== FAKE_TILE) {

							var cInroadOffsetMult = 0.2;
							var cInroadMult = 0.3;
							var cInroadMin = 0.2;
							var cInroadHeightMult = 0.25;
							var cInroadHeightMinOne = 0.1;
							var cInroadHeightMinTwo = 0.3;

							var increment;
							var lineStart = {x:x, y:y};
							var lineEnd = {x:x, y:y};

							var numInroadsToDraw = Math.ceil(random.random() *3)+1;
							if (numInroadsToDraw === 0) {
								debugger;
							}
							var inroadsToDraw = [1,2,3,4];
							for (var i = 0 ; i < 4-numInroadsToDraw ; i++) {
								inroadsToDraw.splice(Math.floor(random.random() *inroadsToDraw.length),1);
							}

							increment = random.random()*cInroadHeightMult+cInroadHeightMinOne;
							if (inroadsToDraw.indexOf(1) !== -1) {
								context.beginPath();
								context.moveTo((x-camera.x+random.random()*cInroadOffsetMult)*tileSize+cBlockPadding, (y-camera.y+increment)*tileSize+cBlockPadding);
								context.lineTo((x-camera.x+random.random()*cInroadMult+cInroadMin)*tileSize+cBlockPadding, (y-camera.y+increment)*tileSize+cBlockPadding);
								context.closePath();
								context.stroke();
							}

							increment += random.random()*cInroadHeightMult+cInroadHeightMinTwo;
							if (inroadsToDraw.indexOf(2) !== -1) {
								context.beginPath();
								context.moveTo((x-camera.x+random.random()*cInroadOffsetMult)*tileSize+cBlockPadding, (y-camera.y+increment)*tileSize-cBlockPadding);
								context.lineTo((x-camera.x+random.random()*cInroadMult+cInroadMin)*tileSize+cBlockPadding, (y-camera.y+increment)*tileSize-cBlockPadding);
								context.closePath();
								context.stroke();
							}

							increment = random.random()*cInroadHeightMult+cInroadHeightMinOne;
							if (inroadsToDraw.indexOf(3) !== -1) {
								context.beginPath();
								context.moveTo((x-camera.x+1-random.random()*cInroadOffsetMult)*tileSize-cBlockPadding, (y-camera.y+increment)*tileSize+cBlockPadding);
								context.lineTo((x-camera.x+1-random.random()*cInroadMult-cInroadMin)*tileSize-cBlockPadding, (y-camera.y+increment)*tileSize+cBlockPadding);
								context.closePath();
								context.stroke();
							}

							increment += random.random()*cInroadHeightMult+cInroadHeightMinTwo;
							if (inroadsToDraw.indexOf(4) !== -1) {
								context.beginPath();
								context.moveTo((x-camera.x+1-random.random()*cInroadOffsetMult)*tileSize-cBlockPadding, (y-camera.y+increment)*tileSize-cBlockPadding);
								context.lineTo((x-camera.x+1-random.random()*cInroadMult-cInroadMin)*tileSize-cBlockPadding, (y-camera.y+increment)*tileSize-cBlockPadding);
								context.closePath();
								context.stroke();
							}
						}

						break;
					case CRUMBLE_TILE:
						context.strokeStyle = "#aa4400";
						
						if (mapExtra[x][y].crumbled) {
							var cCrumbleDuration = 1000;
							var crumbleAmount = (getTime() - mapExtra[x][y].crumbleTime)/cCrumbleDuration;
							if (crumbleAmount > 1) {
								break;
							}
							var actualBlockPadding = cBlockPadding;
							cBlockPadding = crumbleAmount*tileSize/2;
						}
						if (highQualityGfx) {
							var increment;
							if (mapExtra[x][y].crumbled) {
								var cCrackWidthMult = 0.2-crumbleAmount*0.2;
								var cCrackWidthMin = 0.05-crumbleAmount*0.05;
								var cCrackOffsetMult = 0.3-crumbleAmount*0.3;
								var cCrackOffsetMin = 0.1-crumbleAmount*0.1;
								var cCrackDepthMult = 0.1;
								var cCrackDepthMin = 0.05;
							} else {
								var cCrackWidthMult = 0.2;
								var cCrackWidthMin = 0.05;
								var cCrackOffsetMult = 0.3;
								var cCrackOffsetMin = 0.1;
								var cCrackDepthMult = 0.1;
								var cCrackDepthMin = 0.05;
							}


							context.beginPath();
							context.moveTo((x-camera.x)*tileSize+cBlockPadding, (y-camera.y)*tileSize+cBlockPadding);

							//top
							if (random.random()>0.5) {
								increment = cCrackOffsetMult*random.random()+cCrackOffsetMin;
								context.lineTo((x-camera.x+increment)*tileSize+cBlockPadding, (y-camera.y)*tileSize+cBlockPadding);
								increment += random.random()*cCrackWidthMult+cCrackWidthMin;
								context.lineTo((x-camera.x+increment)*tileSize+cBlockPadding, (y-camera.y+random.random()*cCrackDepthMult+cCrackDepthMin)*tileSize+cBlockPadding);
								increment += random.random()*cCrackWidthMult+cCrackWidthMin;
								context.lineTo((x-camera.x+increment)*tileSize+cBlockPadding, (y-camera.y)*tileSize+cBlockPadding);
							}
							context.lineTo((x-camera.x+1)*tileSize-cBlockPadding, (y-camera.y)*tileSize+cBlockPadding);

							// right
							if (random.random()>0.5) {
								increment = cCrackOffsetMult*random.random()+cCrackOffsetMin;
								context.lineTo((x-camera.x+1)*tileSize-cBlockPadding, (y-camera.y+increment)*tileSize+cBlockPadding);
								increment += random.random()*cCrackWidthMult+cCrackWidthMin;
								context.lineTo((x-camera.x+1-random.random()*cCrackDepthMult-cCrackDepthMin)*tileSize-cBlockPadding, (y-camera.y+increment)*tileSize+cBlockPadding);
								increment += random.random()*cCrackWidthMult+cCrackWidthMin;
								context.lineTo((x-camera.x+1)*tileSize-cBlockPadding, (y-camera.y+increment)*tileSize+cBlockPadding);
							}
							context.lineTo((x-camera.x+1)*tileSize-cBlockPadding, (y-camera.y+1)*tileSize-cBlockPadding);

							// bottom
							if (random.random()>0.5) {
								increment = cCrackOffsetMult*random.random()+cCrackOffsetMin;
								context.lineTo((x-camera.x+1-increment)*tileSize-cBlockPadding, (y-camera.y+1)*tileSize-cBlockPadding);
								increment += random.random()*cCrackWidthMult+cCrackWidthMin;
								context.lineTo((x-camera.x+1-increment)*tileSize-cBlockPadding, (y-camera.y+1-random.random()*cCrackDepthMult-cCrackDepthMin)*tileSize-cBlockPadding);
								increment += random.random()*cCrackWidthMult+cCrackWidthMin;
								context.lineTo((x-camera.x+1-increment)*tileSize-cBlockPadding, (y-camera.y+1)*tileSize-cBlockPadding);
							}
							context.lineTo((x-camera.x)*tileSize+cBlockPadding, (y-camera.y+1)*tileSize-cBlockPadding);

							//left
							if (random.random()>0.5) {
								increment = cCrackOffsetMult*random.random()+cCrackOffsetMin;
								context.lineTo((x-camera.x)*tileSize+cBlockPadding, (y-camera.y+1-increment)*tileSize-cBlockPadding);
								increment += random.random()*cCrackWidthMult+cCrackWidthMin;
								context.lineTo((x-camera.x+random.random()*cCrackDepthMult+cCrackDepthMin)*tileSize+cBlockPadding, (y-camera.y+1-increment)*tileSize-cBlockPadding);
								increment += random.random()*cCrackWidthMult+cCrackWidthMin;
								context.lineTo((x-camera.x)*tileSize+cBlockPadding, (y-camera.y+1-increment)*tileSize-cBlockPadding);
							}
							context.lineTo((x-camera.x)*tileSize+cBlockPadding, (y-camera.y)*tileSize+cBlockPadding);

							context.closePath();
							context.stroke();

						} else {
							context.beginPath();

							context.moveTo((x-camera.x)*tileSize+cBlockPadding, (y-camera.y)*tileSize+cBlockPadding);
							context.lineTo((x-camera.x+1)*tileSize-cBlockPadding, (y-camera.y)*tileSize+cBlockPadding);
							context.lineTo((x-camera.x+1)*tileSize-cBlockPadding, (y-camera.y+1)*tileSize-cBlockPadding);
							context.lineTo((x-camera.x)*tileSize+cBlockPadding, (y-camera.y+1)*tileSize-cBlockPadding);
							context.closePath();
							context.stroke();
						}
						if (actualBlockPadding) {
							cBlockPadding = actualBlockPadding;
						}
					break;
					case ICE_TILE:// ice tile

						context.strokeStyle = "#00ffff";
						if (highQualityGfx) {
							var cCornerOffsetMult = 0.1;
							var cCornerOffsetMin = 0.1;

							var incrementX, incrementY;
							context.beginPath();

							//top
							incrementX = random.random()*cCornerOffsetMult+cCornerOffsetMin;
							context.moveTo((x-camera.x+incrementX)*tileSize+cBlockPadding, (y-camera.y)*tileSize+cBlockPadding);
							incrementX = random.random()*cCornerOffsetMult+cCornerOffsetMin;
							context.lineTo((x-camera.x+1-incrementX)*tileSize-cBlockPadding, (y-camera.y)*tileSize+cBlockPadding);
							//right
							incrementY = random.random()*cCornerOffsetMult+cCornerOffsetMin;
							context.lineTo((x-camera.x+1)*tileSize-cBlockPadding, (y-camera.y+incrementY)*tileSize+cBlockPadding);
							incrementY = random.random()*cCornerOffsetMult+cCornerOffsetMin;
							context.lineTo((x-camera.x+1)*tileSize-cBlockPadding, (y-camera.y+1-incrementY)*tileSize-cBlockPadding);
							//bottom
							incrementX = random.random()*cCornerOffsetMult+cCornerOffsetMin;
							context.lineTo((x-camera.x+1-incrementX)*tileSize-cBlockPadding, (y-camera.y+1)*tileSize-cBlockPadding);
							incrementX = random.random()*cCornerOffsetMult+cCornerOffsetMin;
							context.lineTo((x-camera.x+incrementX)*tileSize+cBlockPadding, (y-camera.y+1)*tileSize-cBlockPadding);
							//left
							incrementY = random.random()*cCornerOffsetMult+cCornerOffsetMin;
							context.lineTo((x-camera.x)*tileSize+cBlockPadding, (y-camera.y+1-incrementY)*tileSize-cBlockPadding);
							incrementY = random.random()*cCornerOffsetMult+cCornerOffsetMin;
							context.lineTo((x-camera.x)*tileSize+cBlockPadding, (y-camera.y+incrementY)*tileSize+cBlockPadding);

							context.closePath();
							context.stroke();
						} else {
							context.beginPath();
							context.moveTo((x-camera.x)*tileSize+cBlockPadding, (y-camera.y)*tileSize+cBlockPadding);
							context.lineTo((x-camera.x+1)*tileSize-cBlockPadding, (y-camera.y)*tileSize+cBlockPadding);
							context.lineTo((x-camera.x+1)*tileSize-cBlockPadding, (y-camera.y+1)*tileSize-cBlockPadding);
							context.lineTo((x-camera.x)*tileSize+cBlockPadding, (y-camera.y+1)*tileSize-cBlockPadding);
							context.closePath();
							context.stroke();
						}

						// gleam
						var cLightAngle = 3*Math.PI/4;

						context.beginPath();
						var startX = random.random()*0.1+0.1;
						var startY = random.random()*0.1+0.4;
						var length = random.random()*0.2+0.2;
						var endY = Math.cos(cLightAngle)*length + startY;
						var endX = Math.sin(cLightAngle)*length + startX;
						context.moveTo((x-camera.x+startX)*tileSize+cBlockPadding, (y-camera.y+startY)*tileSize+cBlockPadding);
						context.lineTo((x-camera.x+endX)*tileSize+cBlockPadding, (y-camera.y+endY)*tileSize+cBlockPadding);
						context.closePath();
						context.stroke();

					break;
					case SPIKE_TILE:// spike tile
						context.strokeStyle = "#800000";
						var cCornerInsetMin = 0.25;
						var cCornerInsetMult = 0.05;
						if (highQualityGfx) {
							var cSpikeWidthMult = 0.05;
							var cSpikeWidthMin = 0.08;
							var cInnerSpikeWidthMin = 0.15;
							var cSpikeHeightMult = 0.05;
							var cSpikeHeightMin = 0.12;

							var doSide = function(motion, start) {
									start.x += motion.x*(cSpikeWidthMult*globalRandom.random()+cSpikeWidthMin);
									start.y += motion.y*(cSpikeWidthMult*globalRandom.random()+cSpikeWidthMin);
									start.x += motion.y*(cSpikeHeightMult*globalRandom.random()+cSpikeHeightMin);
									start.y -= motion.x*(cSpikeHeightMult*globalRandom.random()+cSpikeHeightMin);
									context.lineTo((start.x-camera.x)*tileSize, (start.y-camera.y)*tileSize);

									start.x += motion.x*(cSpikeWidthMult*globalRandom.random()+cInnerSpikeWidthMin);
									start.y += motion.y*(cSpikeWidthMult*globalRandom.random()+cInnerSpikeWidthMin);
									start.x -= motion.y*(cSpikeHeightMult*globalRandom.random()+cSpikeHeightMin);
									start.y += motion.x*(cSpikeHeightMult*globalRandom.random()+cSpikeHeightMin);
									context.lineTo((start.x-camera.x)*tileSize, (start.y-camera.y)*tileSize);
									
									start.x += motion.x*(cSpikeWidthMult*globalRandom.random()+cInnerSpikeWidthMin);
									start.y += motion.y*(cSpikeWidthMult*globalRandom.random()+cInnerSpikeWidthMin);
									start.x += motion.y*(cSpikeHeightMult*globalRandom.random()+cSpikeHeightMin);
									start.y -= motion.x*(cSpikeHeightMult*globalRandom.random()+cSpikeHeightMin);
									context.lineTo((start.x-camera.x)*tileSize, (start.y-camera.y)*tileSize);
							};
							context.beginPath();
							var point = {x:x+cCornerInsetMin+globalRandom.random()*cCornerInsetMult, y:y+cCornerInsetMin+globalRandom.random()*cCornerInsetMult};
							context.moveTo((point.x-camera.x)*tileSize, (point.y-camera.y)*tileSize);
							doSide({x:1, y:0}, point);
							point = {x:x+(1-cCornerInsetMin+globalRandom.random()*cCornerInsetMult), y:y+cCornerInsetMin+globalRandom.random()*cCornerInsetMult};
							context.lineTo((point.x-camera.x)*tileSize, (point.y-camera.y)*tileSize);
							doSide({x:0, y:1}, point);
							point = {x:x+(1-cCornerInsetMin+globalRandom.random()*cCornerInsetMult), y:y+(1-cCornerInsetMin+globalRandom.random()*cCornerInsetMult)};
							context.lineTo((point.x-camera.x)*tileSize, (point.y-camera.y)*tileSize);
							doSide({x:-1, y:0}, point);
							point = {x:x+cCornerInsetMin+globalRandom.random()*cCornerInsetMult, y:y+(1-cCornerInsetMin+globalRandom.random()*cCornerInsetMult)};
							context.lineTo((point.x-camera.x)*tileSize, (point.y-camera.y)*tileSize);
							doSide({x:0, y:-1}, point);
							context.closePath();
							context.stroke();
						} else {
							context.beginPath();
							context.moveTo((x-camera.x+globalRandom.random()*cCornerInsetMult)*tileSize+cBlockPadding, (y-camera.y+globalRandom.random()*cCornerInsetMult)*tileSize+cBlockPadding);
							context.lineTo((x-camera.x+1-globalRandom.random()*cCornerInsetMult)*tileSize-cBlockPadding, (y-camera.y+globalRandom.random()*cCornerInsetMult)*tileSize+cBlockPadding);
							context.lineTo((x-camera.x+1-globalRandom.random()*cCornerInsetMult)*tileSize-cBlockPadding, (y-camera.y+1-globalRandom.random()*cCornerInsetMult)*tileSize-cBlockPadding);
							context.lineTo((x-camera.x+globalRandom.random()*cCornerInsetMult)*tileSize+cBlockPadding, (y-camera.y+1-globalRandom.random()*cCornerInsetMult)*tileSize-cBlockPadding);
							context.closePath();
							context.stroke();
						}
					break;
					case SPRING_TILE:

						var cInsetMult = 0.15;
						var cInsetMin = 0.15;
						var cExtendMult = 1;
						var cExtendDuration = 70;
						var cExtendRetractMult = 10;
						var cExtendWaitMult = 5;

						var extendX = 0, extendY = 0;
						if (mapExtra[x][y].springTime) {
							var extend = (getTime() - mapExtra[x][y].springTime); 
							if (extend > cExtendDuration*(cExtendRetractMult+1+cExtendWaitMult)) {
								mapExtra[x][y].springTime = undefined;
								mapExtra[x][y].springX = undefined;
								mapExtra[x][y].springY = undefined;
								extend = 0;
							} else if (extend > cExtendDuration*cExtendWaitMult){
								extend -= cExtendDuration*cExtendWaitMult;
								extend = (cExtendDuration*cExtendRetractMult) - extend;
								extend /= cExtendDuration*cExtendRetractMult;
								extendX = mapExtra[x][y].springX * extend * cExtendMult;
								extendY = mapExtra[x][y].springY * extend * cExtendMult;
							} else if (extend > cExtendDuration){
								extend = 1;
								extendX = mapExtra[x][y].springX * extend * cExtendMult;
								extendY = mapExtra[x][y].springY * extend * cExtendMult;
							} else {
								extend /= cExtendDuration;
								extendX = mapExtra[x][y].springX * extend * cExtendMult;
								extendY = mapExtra[x][y].springY * extend * cExtendMult;
							}
						}
						context.strokeStyle = "#66ff00";
						context.beginPath();
						context.moveTo((x-camera.x+extendX)*tileSize+cBlockPadding, (y-camera.y+extendY)*tileSize+cBlockPadding);
						context.lineTo((x-camera.x+1+extendX)*tileSize-cBlockPadding, (y-camera.y+extendY)*tileSize+cBlockPadding);
						context.lineTo((x-camera.x+1+extendX)*tileSize-cBlockPadding, (y-camera.y+1+extendY)*tileSize-cBlockPadding);
						context.lineTo((x-camera.x+extendX)*tileSize+cBlockPadding, (y-camera.y+1+extendY)*tileSize-cBlockPadding);
						context.closePath();
						context.stroke();

						context.beginPath();
						context.moveTo((x-camera.x+Math.random()*random.random()*cInsetMult+cInsetMin)*tileSize+cBlockPadding, (y-camera.y+Math.random()*random.random()*cInsetMult+cInsetMin)*tileSize+cBlockPadding);
						context.lineTo((x-camera.x+1-Math.random()*random.random()*cInsetMult-cInsetMin)*tileSize-cBlockPadding, (y-camera.y+Math.random()*random.random()*cInsetMult+cInsetMin)*tileSize+cBlockPadding);
						context.lineTo((x-camera.x+1-Math.random()*random.random()*cInsetMult-cInsetMin)*tileSize-cBlockPadding, (y-camera.y+1-Math.random()*random.random()*cInsetMult-cInsetMin)*tileSize-cBlockPadding);
						context.lineTo((x-camera.x+Math.random()*random.random()*cInsetMult+cInsetMin)*tileSize+cBlockPadding, (y-camera.y+1-Math.random()*random.random()*cInsetMult-cInsetMin)*tileSize-cBlockPadding);
						context.closePath();
						context.stroke();
					break;
					case PLAIN_TILE:
						context.strokeStyle = "#ffffff";
						context.beginPath();
						context.moveTo((x-camera.x)*tileSize+cBlockPadding, (y-camera.y)*tileSize+cBlockPadding);
						context.lineTo((x-camera.x+1)*tileSize-cBlockPadding, (y-camera.y)*tileSize+cBlockPadding);
						context.lineTo((x-camera.x+1)*tileSize-cBlockPadding, (y-camera.y+1)*tileSize-cBlockPadding);
						context.lineTo((x-camera.x)*tileSize+cBlockPadding, (y-camera.y+1)*tileSize-cBlockPadding);
						context.lineTo((x-camera.x)*tileSize+cBlockPadding, (y-camera.y)*tileSize+cBlockPadding);
						context.closePath();
						context.stroke();
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
			if (baby.golden) {
				context.strokeStyle = "#efe327";
			} else {
				context.strokeStyle = "#ffffff";
			}
			context.strokeWidth = 0.5;
			for (var t = 0; t < 4 ; t++) {
				context.moveTo(baby.x-camera.x*tileSize, baby.y-camera.y*tileSize);
				context.lineTo(baby.x+(Math.cos(Math.PI*t/2)/4-camera.x)*tileSize, baby.y+(Math.sin(Math.PI*t/2)/4-camera.y)*tileSize);
			}
			context.closePath();
			context.stroke();


			if (baby.golden) {
				context.fillStyle = "#efe327";
			} else {
				context.fillStyle = "#ffffff";
			}
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

		// draw touch controls
		if (isMobile) {
			context.strokeStyle = "#ffffff";
			context.fillStyle = "#ffffff";

			// top right
			context.beginPath();
			context.moveTo(screenSize.x-buttonWidth*2, 0);
			context.lineTo(screenSize.x-buttonWidth*2, buttonWidth);
			context.bezierCurveTo(screenSize.x-buttonWidth*1.5, buttonWidth ,screenSize.x-buttonWidth, buttonWidth*1.5 ,screenSize.x-buttonWidth, buttonWidth*2);
			context.lineTo(screenSize.x, buttonWidth*2);
			context.lineTo(screenSize.x, 0);
			context.lineTo(screenSize.x-buttonWidth*2, 0);

			context.moveTo(screenSize.x-buttonWidth*0.5, buttonWidth*0.5);
			context.lineTo(screenSize.x-buttonWidth*1.5, buttonWidth*0.75);
			context.lineTo(screenSize.x-buttonWidth*0.75, buttonWidth*1.5);
			context.lineTo(screenSize.x-buttonWidth*0.5, buttonWidth*0.5);

			if (keys[key_up] && keys[key_right]) {
				context.fill();
			} else {
				context.stroke();
			}
			

			// bottom right
			context.beginPath();
			context.moveTo(screenSize.x-buttonWidth*2, screenSize.y);
			context.lineTo(screenSize.x-buttonWidth*2, screenSize.y-buttonWidth);
			context.bezierCurveTo(screenSize.x-buttonWidth*1.5, screenSize.y-buttonWidth ,screenSize.x-buttonWidth, screenSize.y-buttonWidth*1.5 ,screenSize.x-buttonWidth, screenSize.y-buttonWidth*2);
			context.lineTo(screenSize.x, screenSize.y-buttonWidth*2);
			context.lineTo(screenSize.x, screenSize.y);
			context.lineTo(screenSize.x-buttonWidth*2, screenSize.y);


			context.moveTo(screenSize.x-buttonWidth*0.5, screenSize.y-buttonWidth*0.5);
			context.lineTo(screenSize.x-buttonWidth*1.5, screenSize.y-buttonWidth*0.75);
			context.lineTo(screenSize.x-buttonWidth*0.75, screenSize.y-buttonWidth*1.5);
			context.lineTo(screenSize.x-buttonWidth*0.5, screenSize.y-buttonWidth*0.5);

			if (keys[key_down] && keys[key_right]) {
				context.fill();
			} else {
				context.stroke();
			}


			// bottom left
			context.beginPath();
			context.moveTo(buttonWidth*2, screenSize.y);
			context.lineTo(buttonWidth*2, screenSize.y-buttonWidth);
			context.bezierCurveTo(buttonWidth*1.5, screenSize.y-buttonWidth ,buttonWidth, screenSize.y-buttonWidth*1.5 ,buttonWidth, screenSize.y-buttonWidth*2);
			context.lineTo(0, screenSize.y-buttonWidth*2);
			context.lineTo(0, screenSize.y);
			context.lineTo(buttonWidth*2, screenSize.y);


			context.moveTo(buttonWidth*0.5, screenSize.y-buttonWidth*0.5);
			context.lineTo(buttonWidth*1.5, screenSize.y-buttonWidth*0.75);
			context.lineTo(buttonWidth*0.75, screenSize.y-buttonWidth*1.5);
			context.lineTo(buttonWidth*0.5, screenSize.y-buttonWidth*0.5);

			if (keys[key_down] && keys[key_left]) {
				context.fill();
			} else {
				context.stroke();
			}


			// top left
			context.beginPath();
			context.moveTo(buttonWidth*2, 0);
			context.lineTo(buttonWidth*2, buttonWidth);
			context.bezierCurveTo(buttonWidth*1.5, buttonWidth ,buttonWidth, buttonWidth*1.5 ,buttonWidth, buttonWidth*2);
			context.lineTo(0, buttonWidth*2);
			context.lineTo(0, 0);
			context.lineTo(buttonWidth*2, 0);


			context.moveTo(buttonWidth*0.5, buttonWidth*0.5);
			context.lineTo(buttonWidth*1.5, buttonWidth*0.75);
			context.lineTo(buttonWidth*0.75, buttonWidth*1.5);
			context.lineTo(buttonWidth*0.5, buttonWidth*0.5);

			if (keys[key_up] && keys[key_left]) {
				context.fill();
			} else {
				context.stroke();
			}

			// top
			context.beginPath();
			context.moveTo(buttonWidth*2, 0);
			context.lineTo(buttonWidth*2, buttonWidth);
			context.lineTo(screenSize.x - buttonWidth*2, buttonWidth);
			context.lineTo(screenSize.x - buttonWidth*2, 0);
			context.lineTo(buttonWidth*2, 0);

			context.moveTo(screenSize.x*0.5, buttonWidth*0.25);
			context.lineTo(screenSize.x*0.5-buttonWidth*0.5, buttonWidth*0.75);
			context.lineTo(screenSize.x*0.5+buttonWidth*0.5, buttonWidth*0.75);
			context.lineTo(screenSize.x*0.5, buttonWidth*0.25);

			if (keys[key_up] && !keys[key_left] && !keys[key_right]) {
				context.fill();
			} else {
				context.stroke();
			}


			// bottom
			context.beginPath();
			context.moveTo(buttonWidth*2, screenSize.y);
			context.lineTo(buttonWidth*2, screenSize.y-buttonWidth);
			context.lineTo(screenSize.x - buttonWidth*2, screenSize.y-buttonWidth);
			context.lineTo(screenSize.x - buttonWidth*2, screenSize.y);
			context.lineTo(buttonWidth*2, screenSize.y);

			context.moveTo(screenSize.x*0.5, screenSize.y-buttonWidth*0.25);
			context.lineTo(screenSize.x*0.5-buttonWidth*0.5, screenSize.y-buttonWidth*0.75);
			context.lineTo(screenSize.x*0.5+buttonWidth*0.5, screenSize.y-buttonWidth*0.75);
			context.lineTo(screenSize.x*0.5, screenSize.y-buttonWidth*0.25);

			if (keys[key_down] && !keys[key_left] && !keys[key_right]) {
				context.fill();
			} else {
				context.stroke();
			}


			// right
			context.beginPath();
			context.moveTo(screenSize.x, buttonWidth*2);
			context.lineTo(screenSize.x-buttonWidth, buttonWidth*2);
			context.lineTo(screenSize.x-buttonWidth, screenSize.y-buttonWidth*2);
			context.lineTo(screenSize.x, screenSize.y-buttonWidth*2);
			context.lineTo(screenSize.x, buttonWidth*2);

			context.moveTo(screenSize.x-buttonWidth*0.25, screenSize.y*0.5);
			context.lineTo(screenSize.x-buttonWidth*0.75, screenSize.y*0.5-buttonWidth*0.5);
			context.lineTo(screenSize.x-buttonWidth*0.75, screenSize.y*0.5+buttonWidth*0.5);
			context.lineTo(screenSize.x-buttonWidth*0.25, screenSize.y*0.5);

			if (keys[key_right] && !keys[key_down] && !keys[key_up]) {
				context.fill();
			} else {
				context.stroke();
			}

			// left
			context.beginPath();
			context.moveTo(0, buttonWidth*2);
			context.lineTo(buttonWidth, buttonWidth*2);
			context.lineTo(buttonWidth, screenSize.y-buttonWidth*2);
			context.lineTo(0, screenSize.y-buttonWidth*2);
			context.lineTo(0, buttonWidth*2);

			context.moveTo(buttonWidth*0.25, screenSize.y*0.5);
			context.lineTo(buttonWidth*0.75, screenSize.y*0.5-buttonWidth*0.5);
			context.lineTo(buttonWidth*0.75, screenSize.y*0.5+buttonWidth*0.5);
			context.lineTo(buttonWidth*0.25, screenSize.y*0.5);

			if (keys[key_left] && !keys[key_down] && !keys[key_up]) {
				context.fill();
			} else {
				context.stroke();
			}
		}


		// draw the lose
		if (gameState === LEVEL_LOST) {
			context.textAlign = "center";
			context.font = "80pt cuteline";
			context.fillStyle = "#ffffff";
			var text = "Dead!";
			context.fillText(text, screenSize.x/2, screenSize.y/2);
		}
		else if (gameState === LEVEL_WON) {
			if (currentLevel+1 > highestLevelUnlocked && currentLevel < lastLevel) {
				settings.level = currentLevel+1;
				highestLevelUnlocked = currentLevel+1;
				saveSettings();
			}
			context.textAlign = "center";
			context.font = "80pt cuteline";
			if (levelIsGold(currentLevel)) {
				// golden
				context.fillStyle = "#efe327";
			} else {
				context.fillStyle = "#ffffff";
			}
			var text = "Win!";
			context.fillText(text, screenSize.x/2, screenSize.y/2);
		}
	}
}

function levelIsGold(levelNumber) {
	var isGold = false;
	if (settings.goldLevels) {
		var goldLevels = settings.goldLevels.split(",");
		for (var g in goldLevels) {
			if (Number(goldLevels[g]) === levelNumber) {
				isGold = true;
			}
		}
	}
	return isGold;
}

function levelSetGold(levelNumber) {
	var goldLevels = [];
	if (settings.goldLevels) {
		goldLevels = settings.goldLevels.split(",");
		for (var g in goldLevels) {
			if (Number(goldLevels[g]) === levelNumber) {
				return;
			}
		}
	}
	goldLevels.push(levelNumber);
	settings.goldLevels = goldLevels.join(",");
	saveSettings();
}

function blockIsEmpty(x,y) {
	return map[x][y] === 0 || map[x][y] === SPIKE_TILE || map[x][y] === FAKE_TILE || mapExtra[x][y].crumbled;
}

function blockIsNotSlippery(x,y) {
	return map[x][y] === SOLID_TILE || (map[x][y] === CRUMBLE_TILE && !mapExtra[x][y].crumbled) || map[x][y] === INVISIBLE_TILE;
}

function update(delta) {
	Math.seedrandom(getTime());//.getMilliseconds());


	// responsd to touches
	if (isMobile) {
		keys[key_up] = false;
		keys[key_right] = false;
		keys[key_down] = false;
		keys[key_left] = false;

		keys[key_space] = true;
		for (var t in touches) {
			var touch = touches[t];
			var x = touch.pageX - $(canvas).offset().left;
			var y = touch.pageY - $(canvas).offset().top;
			if (x > screenSize.x-buttonWidth) {
				if (y < buttonWidth*2) {
					keys[key_up] = true;
					keys[key_right] = true;
				} else if (y > screenSize.y-buttonWidth*2) {
					keys[key_down] = true;
					keys[key_right] = true;
				} else {
					keys[key_right] = true;
				}
			}
			else if (x < buttonWidth) {
				if (y < buttonWidth*2) {
					keys[key_up] = true;
					keys[key_left] = true;
				} else if (y > screenSize.y-buttonWidth*2) {
					keys[key_down] = true;
					keys[key_left] = true;
				} else {
					keys[key_left] = true;
				}
			} else {
				if (y < buttonWidth) {
					keys[key_up] = true;
				} else if (y > screenSize.y-buttonWidth) {
					keys[key_down] = true;
				}
			}
		}
	}



	if (gameState === LOADING) return;

	if (gameState === LOADED) {
		if (keys[key_space] && getTime() - stateChangeTime > 200) {
			gameState = PLAYING;
			stateChangeTime = getTime();
		}
	} else if (gameState === LEVEL_LOST) {
		if (getTime() - stateChangeTime > 2000) {
			loadLevel(currentLevel);
		}
	} else if (gameState === GAME_WON) {
		if (keys[key_space] && getTime() - stateChangeTime > 200) {
			gameState = TITLE_SCREEN;
			stateChangeTime = getTime();
		}
	} else if (gameState === TITLE_SCREEN) {
		if (keys[key_space] && getTime() - stateChangeTime > 200) {
			loadLevel(currentLevel);
		} else if (getTime() - lastKeyPressTime > 200) {
			if (keys[key_right]) {
				currentLevel ++;
				currentLevel -= 1;
				currentLevel %= highestLevelUnlocked;
				currentLevel += 1;
				lastKeyPressTime = getTime();
			} else if (keys[key_left]) {
				currentLevel --;
				currentLevel += highestLevelUnlocked;
				currentLevel -= 1;
				currentLevel %= highestLevelUnlocked;
				currentLevel += 1;
				lastKeyPressTime = getTime();
			}
		}
	} else if (gameState === PLAYING) {
		if (keys[key_escape]) {
			gameState = TITLE_SCREEN;
			return;
		}
		if (keys[key_r]) {
			loadLevel(currentLevel);
			return;
		}
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
			if (babiesRescued >= babies.length-1) {
				var gotGolden = false;
				for (var b in babies) {
					if (babies[b].rescued && babies[b].golden) {
						levelSetGold(currentLevel);
						gotGolden = true;
						break;
					}
				}
				if ((gotGolden && babiesRescued === babies.length) || (!gotGolden && babiesRescued === babies.length-1)) {
					gameState = LEVEL_WON;
					stateChangeTime = getTime();
					nestSound.play();
				}
			}
		}

		// spike tiles kill
		var x = Math.floor(mother.x/tileSize);
		var y = Math.floor(mother.y/tileSize);
		if (map[x][y] === SPIKE_TILE) {
			gameState = LEVEL_LOST;
			stateChangeTime = getTime();
			deathSound.play();
			return;
		}

		if (mother.moving) {
			var doubleSpeed = 1;
			if (mother.hasMomentum) {
				doubleSpeed = 2;
			}
			mother.x += delta*mother.moving.x*tileSize*mother.speed*doubleSpeed;
			mother.y += delta*mother.moving.y*tileSize*mother.speed*doubleSpeed;

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
				//spring tiles spring
				var sprung = false;
				if (map[x][y+1] === SPRING_TILE || map[x][y-1] === SPRING_TILE || map[x+1][y] === SPRING_TILE || map[x-1][y] === SPRING_TILE) {
					sprung = true;
				}
				if (!sprung) {
					// ice tiles slide
					var emptyBlocks = 0;
					var iceBlocks = 0;
					var springBlocks = 0;
					if (blockIsEmpty(x,y+1)) emptyBlocks++;
					if (blockIsEmpty(x,y-1)) emptyBlocks++;
					if (blockIsEmpty(x+1,y)) emptyBlocks++;
					if (blockIsEmpty(x-1,y)) emptyBlocks++;
					if (mother.wasMoving.x !== 0) {
						if (map[x][y+1] === ICE_TILE) iceBlocks++;
						if (map[x][y-1] === ICE_TILE) iceBlocks++;
					}
					if (mother.wasMoving.y !== 0) {
						if (map[x+1][y] === ICE_TILE) iceBlocks++;
						if (map[x-1][y] === ICE_TILE) iceBlocks++;
					}
					if (emptyBlocks === 4 && mother.hasMomentum) {
						mother.aim.x += mother.wasMoving.x*tileSize;
						mother.aim.y += mother.wasMoving.y*tileSize;
						mother.moving.x = mother.wasMoving.x;
						mother.moving.y = mother.wasMoving.y;
						fallSound.play();
					} else if (emptyBlocks+iceBlocks === 4 && iceBlocks >= 1) {
						if (mother.wasMoving.x !== 0 && mother.wasMoving.y !== 0) {
							mother.wasMoving.x = 0;
							mother.moving.x = 0;
							if (blockIsEmpty(x,y+1)) {
								mother.aim.y += tileSize;
								mother.moving.y = 1;
							} else {
								mother.wasMoving.y = 0;
								mother.moving.y = 0;
							}
						} else {
							mother.aim.x += mother.wasMoving.x*tileSize;
							mother.aim.y += mother.wasMoving.y*tileSize;
							mother.moving.x = mother.wasMoving.x;
							mother.moving.y = mother.wasMoving.y;
						}
						fallSound.play();
					} else {
						mother.moving = undefined;
						mother.wasMoving = {x:0, y:0};
					}
					mother.rotation = mother.aimRotation;
				} else {
					mother.moving = undefined;
					mother.wasMoving = {x:0, y:0};
				}
			}
		}
		if (mother.moving === undefined) {
			var x = Math.floor(mother.x/tileSize);
			var y = Math.floor(mother.y/tileSize);
			if (blockIsEmpty(x, y+1) &&
				blockIsEmpty(x, y-1) &&
				blockIsEmpty(x-1, y) &&
				blockIsEmpty(x+1, y)) {

				mother.moving = {x:0, y:+1};
				mother.aim = {x:mother.x, y:mother.y+tileSize};
				mother.hasMomentum = true;
				fallSound.play();
			} else {
				mother.hasMomentum = false;
			}
			if (map[x][y+1] === SPRING_TILE) {
				mother.moving = {x:0, y:-1};
				mother.aim = {x:mother.x, y:mother.y-tileSize};
				mother.hasMomentum = true;
				springSound.play();
				mapExtra[x][y+1].springX = 0;
				mapExtra[x][y+1].springY = -1;
				mapExtra[x][y+1].springTime = getTime();
			}
			else if (map[x][y-1] === SPRING_TILE) {
				mother.moving = {x:0, y:+1};
				mother.aim = {x:mother.x, y:mother.y+tileSize};
				mother.hasMomentum = true;
				springSound.play();
				mapExtra[x][y-1].springX = 0;
				mapExtra[x][y-1].springY = 1;
				mapExtra[x][y-1].springTime = getTime();
			}
			else if (map[x+1][y] === SPRING_TILE) {
				mother.moving = {x:-1, y:0};
				mother.aim = {x:mother.x-tileSize, y:mother.y};
				mother.hasMomentum = true;
				springSound.play();
				mapExtra[x+1][y].springX = -1;
				mapExtra[x+1][y].springY = 0;
				mapExtra[x+1][y].springTime = getTime();
			}
			else if (map[x-1][y] === SPRING_TILE) {
				mother.moving = {x:1, y:0};
				mother.aim = {x:mother.x+tileSize, y:mother.y};
				mother.hasMomentum = true;
				springSound.play();
				mapExtra[x-1][y].springX = 1;
				mapExtra[x-1][y].springY = 0;
				mapExtra[x-1][y].springTime = getTime();
			}
		}

		// repsond to keypresses
		var moveRightNow = {x:0, y:0};
		if (!moveKeyedAt) {
			desiredMove = {x:0, y:0};
		}
		if (keys[key_right]) {
			if (!moveKeyedAt) moveKeyedAt = getTime();
			desiredMove.x += 1;
			moveRightNow.x = 1;
		}
		if (keys[key_left]) {
			if (!moveKeyedAt) moveKeyedAt = getTime();
			desiredMove.x -= 1;
			moveRightNow.x = -1;
		}
		if (keys[key_down]) {
			if (!moveKeyedAt) moveKeyedAt = getTime();
			desiredMove.y += 1;
			moveRightNow.y = 1;
		}
		if (keys[key_up]) {
			if (!moveKeyedAt) moveKeyedAt = getTime();
			desiredMove.y -= 1;
			moveRightNow.y = -1;
		}
		if (desiredMove.x > 1) desiredMove.x = 1;
		if (desiredMove.x < -1) desiredMove.x = -1;
		if (desiredMove.y > 1) desiredMove.y = 1;
		if (desiredMove.y < -1) desiredMove.y = -1;
		if (moveRightNow.x === 0) {
			desiredMove.x = 0;
		}
		if (moveRightNow.y === 0) {
			desiredMove.y = 0;
		}
		if (moveRightNow.y === 0 && moveRightNow.x === 0) {
			moveKeyedAt = undefined;
		}
		if ((moveRightNow.x === desiredMove.x && moveRightNow.y === desiredMove.y) && (desiredMove.x !== 0 || desiredMove.y !== 0) && mother.moving === undefined) {
			if (moveKeyedAt && getTime() - moveKeyedAt > cWaitForMoveTime) {
				moveKeyedAt = undefined;
				var makeMove = false;
				if (blockIsEmpty(x+desiredMove.x, y+desiredMove.y)) {
					makeMove = true;
				} else if (blockIsEmpty(x, y+desiredMove.y)) {
					desiredMove.x = 0;
					makeMove = true;
				} else if (blockIsEmpty(x+desiredMove.x, y)) {
					desiredMove.y = 0;
					makeMove = true;
				}
				if ((desiredMove.x !== 0 || desiredMove.y !== 0) && makeMove) {
					mother.moving = desiredMove;
					mother.aim = {x:mother.x+desiredMove.x*tileSize, y:mother.y+desiredMove.y*tileSize};

					if (desiredMove.x > 0) {
						if (blockIsNotSlippery(x,y+1)) {
							mother.aimRotation = mother.rotation + Math.PI/2;
						} else if (blockIsNotSlippery(x,y-1)) {
							mother.aimRotation = mother.rotation - Math.PI/2;
						}
					} else if (desiredMove.x < 0) {
						if (blockIsNotSlippery(x,y+1)) {
							mother.aimRotation = mother.rotation - Math.PI/2;
						} else if (blockIsNotSlippery(x,y-1)) {
							mother.aimRotation = mother.rotation + Math.PI/2;
						}
					} else if (desiredMove.y > 0) {
						if (blockIsNotSlippery(x+1,y)) {
							mother.aimRotation = mother.rotation - Math.PI/2;
						} else if (blockIsNotSlippery(x-1,y)) {
							mother.aimRotation = mother.rotation + Math.PI/2;
						}
					} else if (desiredMove.y < 0) {
						if (blockIsNotSlippery(x+1,y)) {
							mother.aimRotation = mother.rotation + Math.PI/2;
						} else if (blockIsNotSlippery(x-1,y)) {
							mother.aimRotation = mother.rotation - Math.PI/2;
						}
					}


					if (settings.sound) {
						walkSound.play();
					}

					var crumbleTile = function(x,y) {
						if (!mapExtra[x][y].crumbled) {
							mapExtra[x][y].crumbled = true;
							mapExtra[x][y].crumbleTime = getTime();
						}
					};
					// check for leaving crumble tiles
//                    if (mother.moving.y !== 0) {
//                        if (map[x][y-mother.moving.y] === CRUMBLE_TILE) {
//                            crumbleTile(x, y-mother.moving.y);
//                        }
//                    } else {
						if (map[x][y+1] === CRUMBLE_TILE) {
							crumbleTile(x, y+1);
						}
						if (map[x][y-1] === CRUMBLE_TILE) {
							crumbleTile(x, y-1);
						}
//                    }
//                    if (mother.moving.x !== 0) {
//                        if (map[x-mother.moving.x][y] === CRUMBLE_TILE) {
//                            crumbleTile(x-mother.moving.x, y);
//                        }
//                    } else {
						if (map[x+1][y] === CRUMBLE_TILE) {
							crumbleTile(x+1, y);
						}
						if (map[x-1][y] === CRUMBLE_TILE) {
							crumbleTile(x-1, y);
						}
//                    }
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
				canSnap = blockIsNotSlippery(mapX1,mapY) || blockIsNotSlippery(mapX2,mapY);

			} else {
				var mapX = Math.floor(aimX/tileSize);
				var mapY1 = Math.floor(aimY/tileSize);
				var mapY2 = mapY1-1;
				canSnap = blockIsNotSlippery(mapX,mapY1) || blockIsNotSlippery(mapX,mapY2);

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
		if (getTime() - stateChangeTime > 2000) {
			if (currentLevel < lastLevel) {
				currentLevel = currentLevel+1;
				gameState = TITLE_SCREEN;
			} else {
				gameState = GAME_WON;
			}
		}
	}
}
