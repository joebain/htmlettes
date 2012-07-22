var screenBorder = 50;

var texts = [];
var textVelMax = 1;
var textSizeMax = 40;
var textSizeMin = 15;
var textAccel ={x: 0.1, y:1.0, s:0.01};
var textMaxVel ={x: 2, y:3, s:0.2};
var baseHue = Math.random()*360.0;
function init() {
	for (var i = 0 ; i < 10 ; i++) {
		var text = {};
		text.x = Math.random()*screenSize.x;
		text.y = Math.random()*screenSize.y;
		text.oldx = text.x;
		text.oldy = text.y;
		text.size = 24;
		text.vx = 0;
		text.vy = 0;
		text.vs = 0;
		text.vx = (Math.random()-0.5)*textMaxVel.x;
		text.vy = (Math.random()-0.5)*textMaxVel.y;
		text.vs = (Math.random()-0.5)*textMaxVel.s;
		text.text = "lozenge";
		var color = Math.floor(Math.random()*10);
		var light = 50;
		var sat = 70;
		switch (color) {
			case 1:
			color = baseHue - 30;
			light = sat + step(Math.random()*30-15,15);
			sat = sat + step(Math.random()*30-15,15);
			break;
			case 2:
			color = baseHue + 30;
			light = sat + step(Math.random()*30-15,15);
			sat = sat + step(Math.random()*30-15,15);
			break;
			case 3:
			light = sat + step(Math.random()*30-15,15);
			sat = sat + step(Math.random()*30-15,15);
			default:
			color = baseHue + 180;
			break;
		}
		color = wrap(color, 360);
		text.color = "hsl("  + color + ", " + sat + "%, " + light +"%)";
		texts[i] = text;
	}
}

function update(delta) {
	for (var t in texts) {
		var text = texts[t];
//        text.vx += (Math.random()-0.5)*textAccel.x;
//        text.vy += (Math.random()-0.5)*textAccel.y;
//        text.vs += (Math.random()-0.5)*textAccel.s;
//        text.vx = clamp(text.vx, textMaxVel.x);
//        text.vy = clamp(text.vy, textMaxVel.y);
//        text.vs = clamp(text.vs, textMaxVel.s);

		text.oldx = text.x;
		text.oldy = text.y;
		text.olds = text.size;
		text.x += text.vx;
		text.y += text.vy;
		text.size += text.vs;

		text.x = wrap(text.x, -screenBorder, screenSize.x+screenBorder);
		text.y = wrap(text.y, -screenBorder, screenSize.y+screenBorder);
		if (text.size > textSizeMax) {
			text.vs = -Math.abs(text.vs);
			text.size = text.olds;
		}
		if (text.size < textSizeMin) {
			text.vs = Math.abs(text.vs);
			text.size = text.olds;
		}

	}
		texts = sort(texts);

}

function sort(texts) {
//    return texts;
	if (texts.length <= 1) return texts;

	var pivot = Math.floor((texts.length-1)/2);
//    console.log(pivot);
	var pText = texts[pivot];
	var low = [], high = [];
	for (var t in texts) {
		var text = texts[t];
		if (text === pText) continue;
		if (text.size < pText.size) low.push(text);
		else high.push(text);
	}
//    console.log(high.length + ", " + low.length);
	return sort(low).concat([pText]).concat(sort(high));
}


var fontSize = 40;
var fontInlineDiff = 0;
var fontOutlineSize = 1;
var m;
function draw() {
	for (var t in texts) {
		var text = texts[t];

		context.font = text.size + "px Arial Black";
		context.strokeStyle = text.color;
		context.fillStyle = text.color;
		m = context.measureText(text.text);
//        context.fillText(text.text ,text.x-m.width*0.5,text.y+text.size*0.5);
		context.fillText(text.text ,text.oldx-m.width*0.5,text.oldy+text.olds*0.5);

		context.lineWidth = fontOutlineSize * text.size/10;;
		context.font = text.size + "px Arial Black";
		context.strokeStyle = text.color;
		m = context.measureText(text.text);
//        context.strokeText(text.text ,text.x-m.width*0.5,text.y+text.size*0.5);
		context.strokeText(text.text ,text.oldx-m.width*0.5,text.oldy+text.olds*0.5);

		m = context.measureText(text.text);
		context.strokeText(text.text ,text.oldx-m.width*0.5,text.oldy+text.size*0.5);
		context.font = text.size-fontInlineDiff + "px Arial Black";
		context.fillStyle = "#eeeeee";
		m = context.measureText(text.text);
		context.fillText(text.text ,text.x+fontInlineDiff*0.5-m.width*0.5,text.y-fontInlineDiff*0.5+text.size*0.5);

	}
}
