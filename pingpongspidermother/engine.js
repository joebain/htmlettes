var thisTime;
var delta;
var lastTime;
var interval;
var targetInterval = 33;
var gameDuration;
var canvas;
var context;
var keys = [];
var screenSize = {};
var paused;

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
  gameDuration = (thisTime - firstTime)/1000;
  if (update) update(delta);
}

function loop() {
  thisTime = new Date().getTime();
  delta = thisTime-lastTime;
  _update(delta);
  _draw();
  lastTime = thisTime;
  interval = targetInterval - (new Date().getTime() - thisTime);
  interval = interval < 1 ? 1 : interval;
  setTimeout(loop, interval);
}

function _init() {
  canvas = document.getElementById("canvas");
  screenSize.x = canvas.width;
  screenSize.y = canvas.height;
  context = canvas.getContext("2d");
  window.onkeydown = keysdown;
  window.onkeyup = keysup;
  firstTime = new Date().getTime();
  lastTime = new Date().getTime();
  gameDuration = 0;
  paused = false;
  
  setupSM();

  if (init) init();
  loop();
}

function setupSM() {
	soundManager.url = '';
	soundManager.flashVersion = 9;
	soundManager.useFlashBlock = false;
	
	soundManager.onready(initSounds);
	soundManager.ontimeout(soundError);

	var soundToggleEl = document.getElementById("soundToggle");
	soundToggleEl.onchange = function() {
		if (soundToggleEl.checked) {
			soundManager.unmute();
		} else {
			soundManager.mute();
		}
	};
}

function initSounds() {
}

var soundIds = 1;
function makeSFX(url) {
	var dontReactToFinish = false;
	var sound = soundManager.createSound({
		id: soundIds++,
		url:url,
		multishot:true,
		volume:0,
		autoLoad:true,
		onload:function() {
			sound.play();
		},
		onfinish: function() {
			if (dontReactToFinish) return;
			sound.setVolume(40);
			dontReactToFinish = true;
		}
	});
	return sound;
}

function soundError() {
	console.log("there was an error with the sounds");
}

function keysup(e) {
  keys[e.keyCode] = false;
}

function keysdown(e) {
  keys[e.keyCode] = true;
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
