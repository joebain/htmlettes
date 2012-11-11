var bug = function(x,y,a,s) {
	this.x = x;
	this.y = y;
	this.a = a;

	this.vel = {x:Math.sin(a), y:Math.cos(a)};

	var STRAIGHT = 0;
	var RIGHT = 1;
	var LEFT = 2;

	this.state = s === undefined ? Math.floor(Math.random()*3) : s;

	this.arcSize = Math.floor(Math.random()*ARC_SIZES)*ARC_STEP;
	this.anchor = {};
	if (this.state === RIGHT) {
		this.anchor.x = this.x + Math.sin(a) * this.arcSize;
		this.anchor.y = this.y + Math.sin(a) * this.arcSize;
	} else if (this.state === LEFT) {
		this.anchor.x = this.x - Math.sin(a) * this.arcSize;
		this.anchor.y = this.y - Math.sin(a) * this.arcSize;
	}

	this.lastPositions = [];
	this.lastPP = 0;
	for (var l = 0 ; l < HISTORY_LENGTH ; l++) {
		this.lastPositions[l] = {x:this.x, y:this.y};
	}

	this.timeAlive = 0;

	this.childCount = 0;

	this.makeChildren = function() {
		if (this.childCount < MAX_CHILDREN) {
			this.childCount++;
			var bugChild = new bug(this.x, this.y, getRandomAngle(this.a));

			bugs.push(bugChild);
		}
	};

	this.die = function() {
		this.dead = true;
		var i = bugs.indexOf(this);
		if (i != -1) {
			bugs.splice(i,1);
		}
		this.draw();
	};

	this.update = function(delta) {
		this.timeAlive += delta/1000.0;
		this.lastPP++;
		this.lastPP %= HISTORY_LENGTH;
		this.lastPositions[this.lastPP] = {x: this.x, y: this.y, angle:this.angle};

		if (this.state !== STRAIGHT) {
			this.angle = Math.PI*2*(this.timeAlive * SPEED);
			if (this.state === RIGHT) {
				this.vel.x = Math.sin(this.a + this.angle);
				this.vel.y = -Math.cos(this.a + this.angle);
			} else {
				this.vel.x = -Math.sin(this.a + this.angle);
				this.vel.y = Math.cos(this.a + this.angle);
			}
		}
		this.x += this.vel.x*delta*SPEED;
		this.y += this.vel.y*delta*SPEED;


		if (this.x > screenSize.x || this.x < 0
		   || this.y > screenSize.y || this.y < 0) {
			this.die();
		}

		if (this.x < BORDER || screenSize.x - this.x < BORDER || this.y < BORDER || screenSize.y - this.y < BORDER) {
			this.makeChildren(this.x, this.y, this.a);
		}

		if (Math.random() < CHANCES) {
			this.state = Math.floor(Math.random()*3);
		}
		if (Math.random() < CHANCES/2) {
			this.makeChildren();
		}
		if (Math.random() < CHANCES/4) {
			this.die();
		}

	};

	this.draw = function() {
		context.fillStyle = BG_COLOR;
		context.beginPath();
		context.arc(this.lastPositions[this.lastPP].x, this.lastPositions[this.lastPP].y, BALL_RADIUS+2, 0, Math.PI*2);
		context.fill();

		if (!this.dead) {
			context.fillStyle = FG_COLOR;
			context.beginPath();
			context.arc(this.x, this.y, BALL_RADIUS, 0, Math.PI*2);
			context.fill();
		}

		context.strokeStyle = FG_COLOR;
		context.beginPath();
		if (this.state === STRAIGHT) {
			context.moveTo(this.x, this.y);
		}	
		var prevP = this;
		for (var l = 0 ; l < HISTORY_LENGTH ; l++) {
			var lastP = this.lastPositions[(this.lastPP-l+HISTORY_LENGTH)%HISTORY_LENGTH];
			if (this.state === STRAIGHT) {
				context.lineTo(lastP.x, lastP.y);
			} else {
				context.arc(this.anchor.x, this.anchor.y, this.arcSize, this.a+prevP.angle, this.a+lastP.angle, this.state === RIGHT);
			}
		}
		context.stroke();
	};
};

var bugs = [];

function getRandomAngle(a) {
	do {
		var newA = Math.floor(Math.random() * 8) * Math.PI * 0.25;
	} while (a === newA);

	return newA;
}


var BG_COLOR = "#111";
var FG_COLOR = "#fff";
var BALL_RADIUS = 5;
var SPEED = 0.2;
var HISTORY_LENGTH = 5;
var BORDER = 50;
var MAX_CHILDREN = 5;
var ARC_STEP = 60;
var ARC_SIZES = 4;
var CHANCES = 0.01;

function init() {
	var abug = new bug(document.width/2, document.height/2, getRandomAngle(), 1);
	bugs.push(abug);

	context.fillStyle = BG_COLOR;
	context.fillRect(0,0,screenSize.x, screenSize.y);

	context.strokeStyle = FG_COLOR;
	context.fillStyle = FG_COLOR;
	context.strokeWidth = 3;
}

function keydown(charCode) {
}

function keyup(charCode) {
}

function update(delta) {
	for (var b in this.bugs) {
		var bug = this.bugs[b];
		bug.update(delta);
	}
}

function draw() {
	for (var b in this.bugs) {
		var bug = this.bugs[b];
		bug.draw();
	}
}
