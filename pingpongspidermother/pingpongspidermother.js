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
var lastLevel = 11;
var highestLevelUnlocked = 1;

var stateChangeTime = new Date();
var lastKeyPressTime = new Date();

var walkSound;
var fallSound;
var babySound;
var nestSound;
var deathSound;
var themeMusic;

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
}

function initSounds() {
	themeMusic = soundManager.createSound({id:"theme", url:"adam adamant - brogues.mp3", loops:10000, autoLoad:true, onload: function(){themeMusic.play();}});

	walkSound = makeSFX("walk.mp3");
	fallSound = makeSFX("fall.mp3");
	babySound = makeSFX("baby.mp3");
	nestSound = makeSFX("nest.mp3");
	deathSound = makeSFX("death.mp3");
	springSound = makeSFX("spring.mp3");
}

function loadLevel(levelNumber) {
	if (levelNumber > highestLevelUnlocked) {
		settings.level = levelNumber;
		highestLevelUnlocked = levelNumber;
		saveSettings();
	}
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

		gameState = LOADED;
		stateChangeTime = new Date();
	});
}

function draw() {
	clear("#000000");

	spotlightPos.aX = (Math.random()-0.5)*1;
	spotlightPos.aY = (Math.random()-0.5)*1;
	spotlightPos.vX += spotlightPos.aX/10;
	spotlightPos.vY += spotlightPos.aY/10;
	if (spotlightPos.x < 0 || spotlightPos.x > screenSize.x) spotlightPos.vX *= -1;
	if (spotlightPos.y < 0 || spotlightPos.y > screenSize.y) spotlightPos.vY *= -1;
	spotlightPos.x += spotlightPos.vX/10;
	spotlightPos.y += spotlightPos.vY/10;
	var grad = context.createRadialGradient(spotlightPos.x, spotlightPos.y, 500, spotlightPos.x, spotlightPos.y, 0);
	grad.addColorStop(0, "#000000");
	grad.addColorStop(1, "#222222");
	context.fillStyle = grad;
	context.fillRect(0,0,screenSize.x, screenSize.y);


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
		context.fillText("Ping-Pong", screenSize.x/2, screenSize.y/2 - 200);
		context.fillText("Spider Mother", screenSize.x/2, screenSize.y/2 -70);

		context.font = "60pt cuteline";
		if (levelIsGold(currentLevel)) {
			context.fillStyle = "#efe327";
		} else {
			context.fillStyle = "#ffffff";
		}
		context.fillText("Level " + currentLevel, screenSize.x/2, screenSize.y/2+100);

		context.strokeStyle = "#ffffff";
		context.fillStyle = "#ffffff";
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

		context.font = "40pt cuteline";
		context.fillText("press space", screenSize.x/2, screenSize.y/2+200);
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
							var crumbleAmount = (new Date() - mapExtra[x][y].crumbleTime)/cCrumbleDuration;
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
							var extend = (new Date() - mapExtra[x][y].springTime); 
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
	return map[x][y] === SOLID_TILE || map[x][y] === CRUMBLE_TILE || map[x][y] === INVISIBLE_TILE;
}

function update(delta) {
	Math.seedrandom(new Date().getMilliseconds());
	if (gameState === LOADING) return;

	if (gameState === LOADED) {
		if (keys[key_space] && new Date() - stateChangeTime > 200) {
			gameState = PLAYING;
			stateChangeTime = new Date();
		}
	} else if (gameState === LEVEL_LOST) {
		if (new Date() - stateChangeTime > 2000) {
			loadLevel(currentLevel);
		}
	} else if (gameState === TITLE_SCREEN) {
		if (keys[key_space] && new Date() - stateChangeTime > 200) {
			loadLevel(currentLevel);
		} else if (new Date() - lastKeyPressTime > 200) {
			if (keys[key_right]) {
				currentLevel ++;
				currentLevel -= 1;
				currentLevel %= highestLevelUnlocked;
				currentLevel += 1;
				lastKeyPressTime = new Date();
			} else if (keys[key_left]) {
				currentLevel --;
				currentLevel += highestLevelUnlocked;
				currentLevel -= 1;
				currentLevel %= highestLevelUnlocked;
				currentLevel += 1;
				lastKeyPressTime = new Date();
			}
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
					stateChangeTime = new Date();
					nestSound.play();
				}
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
					if (mother.wasMoving.y === 0) {
						if (map[x][y+1] === ICE_TILE) iceBlocks++;
						if (map[x][y-1] === ICE_TILE) iceBlocks++;
					}
					if (mother.wasMoving.x === 0) {
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
				} else {
					mother.moving = undefined;
					mother.wasMoving = {x:0, y:0};
				}
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
				mother.hasMomentum = true;
				fallSound.play();
			} else 
				mother.hasMomentum = false;
				if (map[x][y+1] === SPRING_TILE) {
					mother.moving = {x:0, y:-1};
					mother.aim = {x:mother.x, y:mother.y-tileSize};
					mother.hasMomentum = true;
					springSound.play();
					mapExtra[x][y+1].springX = 0;
					mapExtra[x][y+1].springY = -1;
					mapExtra[x][y+1].springTime = new Date();
				}
				else if (map[x][y-1] === SPRING_TILE) {
					mother.moving = {x:0, y:+1};
					mother.aim = {x:mother.x, y:mother.y+tileSize};
					mother.hasMomentum = true;
					springSound.play();
					mapExtra[x][y-1].springX = 0;
					mapExtra[x][y-1].springY = 1;
					mapExtra[x][y-1].springTime = new Date();
				}
				else if (map[x+1][y] === SPRING_TILE) {
					mother.moving = {x:-1, y:0};
					mother.aim = {x:mother.x-tileSize, y:mother.y};
					mother.hasMomentum = true;
					springSound.play();
					mapExtra[x+1][y].springX = -1;
					mapExtra[x+1][y].springY = 0;
					mapExtra[x+1][y].springTime = new Date();
				}
				else if (map[x-1][y] === SPRING_TILE) {
					mother.moving = {x:1, y:0};
					mother.aim = {x:mother.x+tileSize, y:mother.y};
					mother.hasMomentum = true;
					springSound.play();
					mapExtra[x-1][y].springX = 1;
					mapExtra[x-1][y].springY = 0;
					mapExtra[x-1][y].springTime = new Date();
				}
			else {
				if (!moveKeyedAt) {
					desiredMove = {x:0, y:0};
				}
				if (!mother.moving) {
					if (keys[key_right]) {
						if (!moveKeyedAt) moveKeyedAt = new Date();
						desiredMove.x += 1;
						if (blockIsNotSlippery(x,y+1)) {
							mother.aimRotation = mother.rotation + Math.PI/2;
						} else if (blockIsNotSlippery(x,y-1)) {
							mother.aimRotation = mother.rotation - Math.PI/2;
						}
					}
					if (keys[key_left]) {
						if (!moveKeyedAt) moveKeyedAt = new Date();
						desiredMove.x -= 1;
						if (blockIsNotSlippery(x,y+1)) {
							mother.aimRotation = mother.rotation - Math.PI/2;
						} else if (blockIsNotSlippery(x,y-1)) {
							mother.aimRotation = mother.rotation + Math.PI/2;
						}
					}
					if (keys[key_down]) {
						if (!moveKeyedAt) moveKeyedAt = new Date();
						desiredMove.y += 1;
						if (blockIsNotSlippery(x+1,y)) {
							mother.aimRotation = mother.rotation - Math.PI/2;
						} else if (blockIsNotSlippery(x-1,y)) {
							mother.aimRotation = mother.rotation + Math.PI/2;
						}
					}
					if (keys[key_up]) {
						if (!moveKeyedAt) moveKeyedAt = new Date();
						desiredMove.y -= 1;
						if (blockIsNotSlippery(x+1,y)) {
							mother.aimRotation = mother.rotation + Math.PI/2;
						} else if (blockIsNotSlippery(x-1,y)) {
							mother.aimRotation = mother.rotation - Math.PI/2;
						}
					}
					if (desiredMove.x > 1) desiredMove.x = 1;
					if (desiredMove.x < -1) desiredMove.x = -1;
					if (desiredMove.y > 1) desiredMove.y = 1;
					if (desiredMove.y < -1) desiredMove.y = -1;
				}
				if (desiredMove.x !== 0 || desiredMove.y !== 0) {
					if (moveKeyedAt && new Date() - moveKeyedAt > cWaitForMoveTime) {
						moveKeyedAt = undefined;
						if (blockIsEmpty(x+desiredMove.x, y+desiredMove.y)) {
							mother.moving = desiredMove;
							mother.aim = {x:mother.x+desiredMove.x*tileSize, y:mother.y+desiredMove.y*tileSize};
							walkSound.play();

							var crumbleTile = function(x,y) {
								if (!mapExtra[x][y].crumbled) {
									mapExtra[x][y].crumbled = true;
									mapExtra[x][y].crumbleTime = new Date();
								}
							};
							// check for leaving crumble tiles
							if (map[x][y+1] === CRUMBLE_TILE) {
								crumbleTile(x, y+1);
							}
							if (map[x+1][y] === CRUMBLE_TILE) {
								crumbleTile(x+1, y);
							}
							if (map[x-1][y] === CRUMBLE_TILE) {
								crumbleTile(x-1, y);
							}
							if (map[x][y-1] === CRUMBLE_TILE) {
								crumbleTile(x, y-1);
							}
						}
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
		if (new Date() - stateChangeTime > 2000) {
			loadLevel(currentLevel+1);
		}
	}
}
