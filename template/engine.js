var thisTime = getTime();
var delta;
var lastTime = getTime();
var interval;
var targetInterval = 16;
var maxInterval = 33;
var gameDuration;
var canvas;
var context;
var keys = [];
var touches = [];
var screenSize = {};
var paused;

var settings = {};

var calculateFrameRate = true;
var showFrameRate = false;
var frameTimes = [];
var frameTimesPointer = 0;
var frameTimesSize = 10;
var frameTimesTotal = 0;
var frameRate = 0;

var highQualityGfx = true;
var frameStutterCount = 0;
var stats = new Stats();

var isIE = (navigator.appName == "Microsoft Internet Explorer");
var isAndroid = (navigator.userAgent.match(/Android/i));
var isMobile = false;

function _draw() {
	if (draw) draw();
}

function pause() {
	paused = true;
}

function _update(delta) {
	if (paused) {
		return;
	}

    stats.update();

	gameDuration = (thisTime - firstTime)/1000;
	if (delta > maxInterval) delta = maxInterval;
	if (update) update(delta);

	frameTimesTotal -= frameTimes[frameTimesPointer];
	frameTimes[frameTimesPointer] = delta;
	frameTimesTotal += delta;
	frameTimesPointer++;
	frameTimesPointer %= frameTimesSize;
	frameRate = 1000/(frameTimesTotal / frameTimesSize);

	if (frameRate < (1000/targetInterval)*0.8) {
		frameStutterCount += delta;
	} else {
		frameStutterCount = 0;
	}
	if (frameStutterCount > 500) {
		highQualityGfx = false;
	}
}

var requestAnimationFrame =
	window.requestAnimationFrame || window.mozRequestAnimationFrame ||  
	window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
var lastScheduledTime;
function loop(scheduledTime) {
	lastScheduledTime = scheduledTime;

	lastTime = thisTime;
	thisTime = getTime();

	delta = thisTime-lastTime;
	_update(delta);
	_draw();
	if (requestAnimationFrame) {
		requestAnimationFrame(loop, canvas);
	} else {
		lastTime = thisTime;
		interval = targetInterval - (lastTime - thisTime);
		interval = interval < 1 ? 1 : interval;
		setTimeout(loop, interval);
	}
}

function getTime() {
	if (lastScheduledTime) {
		return lastScheduledTime;
	} else {
		return new Date().getTime();
	}
}

function _init() {
	canvas = document.getElementById("canvas");

	if(isAndroid){
		window.scrollTo(4,$(canvas).offset().top+4);
		canvas.width = window.innerWidth;// / window.devicePixelRatio;
		canvas.height = window.innerHeight;// / window.devicePixelRatio;
	}
		canvas.width = window.innerWidth;// / window.devicePixelRatio;
		canvas.height = window.innerHeight;// / window.devicePixelRatio;

	screenSize.x = canvas.width;
	screenSize.y = canvas.height;
	context = canvas.getContext("2d");
	window.onkeydown = keysdown;
	window.onkeyup = keysup;
	document.addEventListener("touchstart", touchstart, false);
	document.addEventListener("touchend", touchend, false);
	document.addEventListener("touchmove", touchmove, false);
	firstTime = new Date().getTime();
	lastTime = new Date().getTime();
	gameDuration = 0;
	paused = false;


	loadSettings();

	for (var i = 0 ; i < frameTimesSize ; i++) {
		frameTimes[i] = targetInterval;
		frameTimesTotal += targetInterval;
	}


	// Align top-left
	stats.getDomElement().style.position = 'absolute';
	stats.getDomElement().style.left = '0px';
	stats.getDomElement().style.top = '0px';

//    document.body.appendChild( stats.getDomElement() );



	if (init) init();
	loop();
}

function keysup(e) {
	if (window.keyup) keyup(e.keyCode);
  keys[e.keyCode] = false;
}

function touchstart(e) {
	touches = e.targetTouches;
	e.preventDefault();
}

function touchend(e) {
	touches = e.targetTouches;
	e.preventDefault();
}

function touchmove(e) {
	touches = e.targetTouches;
	e.preventDefault();
}

function keysdown(e) {
	if (window.keydown) keydown(e.keyCode);
	keys[e.keyCode] = true;

	switch (e.keyCode) {
	case key_up:
	case key_down:
	case key_left:
	case key_right:
	case key_space:
		e.preventDefault();
		return false;
		break;
	}
}

// drawing
function clear(colour) {
  context.fillStyle = colour;
  context.fillRect(0,0,screenSize.x, screenSize.y);
}

function line(p1, p2, colour, width) {
	if (colour) {
		context.strokeStyle = colour;
	}
	if (width) {
		context.strokeWidth = width;
	}
	context.beginPath();
	context.moveTo(p1.x, p1.y);
	context.lineTo(p2.x, p2.y);
	context.closePath();
	context.stroke();
}

// maths
function clampup(v, max) {
	if (max === undefined) max = 1.0;
	v = v > max ? max : v;
	return v;
}

function clampdown(v, min) {
	if (min === undefined) min = 1.0;
	v = v < -min ? -min : v;
	return v;
}

function clamp(v, max) {
	if (max === undefined) max = 1.0;
	v = v > max ? max : v;
	return v;
}

function wrap(v, m1, m2) {
	var max = m2 === undefined ? m1 : m2;
	var min = m2 === undefined ? 0.0 : m1;
	while (v > max) v -= (max -min);
	while (v < min) v += (max -min);
	return v;
}

function step(v, s) {
	v = Math.floor(v/s)*s;
	return v;
}

function FastRandom(x) {
	this.x = x;

	this.random = function() {
		this.x += 021398;
		this.x *= 1343;
		this.x /= 298;
		this.x = Math.floor(this.x);
		this.x %= 10000;
		return this.x/10000;
	}
}

function loadSettings() {
	console.log("load settings");
	console.log(document.cookie);
	var cookieString = document.cookie;
	cookieString = cookieString.trim();
	var cookieBits = document.cookie.split(";");
	for (var s = 0 ; s < cookieBits.length ; s++) {
		var cookieBit = cookieBits[s];
		var splitIndex = cookieBit.indexOf("=");
		if (splitIndex === -1) continue;
		var key = cookieBit.substr(0, splitIndex);
		key = key.trim();
		var value = cookieBit.substr(splitIndex+1);
		value = value.trim();
		settings[key] = value;
		console.log("k: " + key + " = v: " + value);
	}

	var queryString = document.location.search;
	if (queryString.charAt(0) === "?") {
		queryString = queryString.substr(1);
	}
	if (queryString.charAt(queryString.length-1) === "/") {
		queryString = queryString.substr(0, queryString.length-1);
	}
	var queries = queryString.split("&");
	for (var q = 0 ; q < queries.length ; q++) {
		var query = queries[q];
		var splitIndex = query.indexOf("=");
		if (splitIndex === -1) continue;
		var key = query.substr(0, splitIndex);
		key = key.trim();
		var value = query.substr(splitIndex+1);
		value = value.trim();
		settings[key] = value;
	}


	if (settings.sound !== undefined) {
		if (settings.sound === "false") {
			settings.sound = false;
		} else {
			settings.sound = true;
		}
	} else {
		settings.sound = true;
	}
}

function saveSettings() {
	var cookieString = "";
	for (var key in settings) {
		if (key !== undefined && settings[key] !== undefined) {
			cookieString = key + "=" + settings[key] + ";";
			document.cookie = cookieString;
		}
	}
}

window.onload = _init;

// constants

var key_backspace = 8;
var key_tab = 9;
var key_enter = 13;
var key_shift = 16;
var key_ctrl = 17;
var key_alt = 18;
var key_pause = 19;
var key_caps_lock = 20;
var key_escape = 27;
var key_page_up = 33;
var key_space = 32;
var key_page_down = 34;
var key_end = 35;
var key_home = 36;
var key_left = 37;
var key_up = 38;
var key_right = 39;
var key_down = 40;
var key_screen = 44;
var key_insert = 45;
var key_delete = 46;
var key_0 = 48;
var key_1 = 49;
var key_2 = 50;
var key_3 = 51;
var key_4 = 52;
var key_5 = 53;
var key_6 = 54;
var key_7 = 55;
var key_8 = 56;
var key_9 = 57;
var key_a = 65;
var key_b = 66;
var key_c = 67;
var key_d = 68;
var key_e = 69;
var key_f = 70;
var key_g = 71;
var key_h = 72;
var key_i = 73;
var key_j = 74;
var key_k = 75;
var key_l = 76;
var key_m = 77;
var key_n = 78;
var key_o = 79;
var key_p = 80;
var key_q = 81;
var key_r = 82;
var key_s = 83;
var key_t = 84;
var key_u = 85;
var key_v = 86;
var key_w = 87;
var key_x = 88;
var key_y = 89;
var key_z = 90;
var key_left_windows = 91;
var key_right_windows = 92;
var key_select = 93;
var key_numpad_0 = 96;
var key_numpad_1 = 97;
var key_numpad_2 = 98;
var key_numpad_3 = 99;
var key_numpad_4 = 100;
var key_numpad_5 = 101;
var key_numpad_6 = 102;
var key_numpad_7 = 103;
var key_numpad_8 = 104;
var key_numpad_9 = 105;
var key_multiply = 106;
var key_add = 107;
var key_subtract = 109;
var key_point = 110;
var key_divide = 111;
var key_f1 = 112;
var key_f2 = 113;
var key_f3 = 114;
var key_f4 = 115;
var key_f5 = 116;
var key_f6 = 117;
var key_f7 = 118;
var key_f8 = 119;
var key_f9 = 120;
var key_f10 = 121;
var key_f11 = 122;
var key_f12 = 123;
var key_num_lock = 144;
var key_scroll_lock = 145;
var key_semicolon = 186;
var key_equal_sign = 187;
var key_comma = 188;
var key_hyphen = 189;
var key_full_stop = 190;
var key_forward_slash = 191;
var key_open_bracket = 219;
var key_back_slash = 220;
var key_close_bracket = 221;
var key_single_quote = 222;


var PI_2 = Math.PI*2;
