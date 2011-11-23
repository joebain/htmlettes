var thisTime;
var delta;
var lastTime;
var interval;
var targetInterval = 33;

var gameDuration;

var canvas;
var timeDiv;
var scoreDiv;
var context;
var keys = [];

var originalReactorSize = 70;
var homeSize;
var reactor;
var screenSize = {x:600, y:600};
var controllers;
var minControllerSize = 2;

var shake;
var drift;
var controlFactor = 0.00000001;
var friction = 0.8;
var shakeIncreaseFactor = 0.001;
var driftIncreaseFactor = 0.000000001;
var driftAffectFactor = 200;
var shakeAffectFactor = 10;
var recoveryFactor = 1.3;
var recovering;
var reactorGrowth;
var recoverDistance = 0.1;

var lost = true;
var minDist = 1000;

var newScore;

function initWorld() {
  firstTime = new Date().getTime();
  lastTime = new Date().getTime();
  gameDuration = 0;

  homeSize = originalReactorSize;
  reactor = {x:300, y:300, size:originalReactorSize, velX:0, velY:0};
  screenSize = {x:600, y:600};
  controllers = [
    {x:100, y:100, size:30, key:81},//q
    {x:100, y:500, size:30, key:90},//z
    {x:500,y:100, size:30, key:80},//p
    {x:500, y:500, size:30, key:190}//.
  ];

  shake = 0;
  drift = 0.0001;

  recovering = 0;
  reactorGrowth = 0;

  lost = false;
  newScore = false;

  showScores();
  $("#enterHighScore").hide(1000);
}

function submitScore() {
  if (!newScore) return;
  var name = $("#nameInput").val();
  var time = Math.round(gameDuration*10);
  if (name !== "" && name !== "name" && time > 0) {
    newScore = false;
    $("#enterHighScore").hide(1000);
    $.get(
        "scores.php",
        {name: name, time:time},
        function(a,b,c,d) {
          console.log("success");
          showScores();
        }).error(function(a,b,c,d) {
      console.log("erorr sending score");
    });
  }
}

function showScores() {
  $.getJSON(
      "scores.php",
      function(scores) {
        console.log("got scores");
        scoreDiv.empty();
        for (var i in scores) {
          var score = scores[i];
          var aScoreDiv = $("<div>");
          var scoreNameDiv = $("<div>");
          scoreNameDiv.addClass("scoreName");
          scoreNameDiv.text(score.name);
          var scoreScoreDiv = $("<div>");
          scoreScoreDiv.addClass("scoreScore");
          scoreScoreDiv.text((score.time/10).toFixed(1) + "s");
          aScoreDiv.append(scoreNameDiv);
          aScoreDiv.append(scoreScoreDiv);
          scoreDiv.append(aScoreDiv);
        }
      }).error(
        function(dunno,message,error) {
          console.log("an error getting scores");
          console.log(error.message);
        });
}

var actualR, actualB, actualG, r, g, colour;
function draw() {
  //clear
  r = Math.round(minDist);
  r = r < 0 ? 0 : r;
  r = r > 255 ? 255 : r;
  r = 255 - r;
  g = 255;
  g *= (reactorGrowth+1);
  if (g > 255) g = 255-(g-255);
  g *= recovering;
  g = Math.round(g);
  actualB = 255-(r+g);
  actualR = 255-g;
  actualG = 255-r;
  colour = "rgba("+actualR+","+actualG+","+actualB+",1)";
  context.fillStyle=colour;
  context.fillRect(0,0,screenSize.x, screenSize.y);

  //reactor
  context.strokeStyle = "#000000";
  context.fillStyle = "#000000";
  context.beginPath();
  context.arc(reactor.x, reactor.y, reactor.size, 0, Math.PI*2, true);
  context.fill();

  // home
  context.beginPath();
  context.arc(screenSize.x/2, screenSize.y/2, homeSize, 0, Math.PI*2, true);
  context.stroke();

  //controllers
  for (var i in controllers) {
    var controller = controllers[i];
    context.strokeStyle = "#000000";
    context.fillStyle = "#000000";
    context.beginPath();
    context.arc(controller.x, controller.y, controller.size, 0, Math.PI*2, true);
    context.fill();
  }


  // restart
  if ( lost) {
    context.textAlign = "center";
    context.font = "30pt monospace";
    context.strokeStyle = "#000000";
    context.lineWidth = 2;
    context.fillStyle = colour;
    context.strokeText("space to start", screenSize.x/2, screenSize.y/2);
    context.fillText("space to start", screenSize.x/2, screenSize.y/2);
  }

  // score
  timeDiv.innerHTML = (gameDuration).toFixed(1) + "s";
}

function lose() {
  lost = true;

  newScore = true;

  $("#enterHighScore").show(1000);
}

function update(delta) {

  if (lost) {
    if ( keys[32]) {//space
      initWorld();
    }
    else {
      return;
    }
  }
  
  gameDuration = (thisTime - firstTime)/1000;
  
  // distance to edge
  var leftDist = reactor.x +reactor.size/4;
  var rightDist = screenSize.x - (reactor.x -reactor.size/4);
  var topDist = reactor.y +reactor.size/4;
  var bottomDist = screenSize.y - (reactor.y -reactor.size/4);

  if (rightDist < 0) lose();
  if (leftDist < 0) lose();
  if (topDist < 0) lose();
  if (bottomDist < 0) lose();
  
  minDist = leftDist < rightDist ? leftDist : rightDist;
  minDist = minDist < topDist ? minDist : topDist;
  minDist = minDist < bottomDist ? minDist : bottomDist;


  drift += delta*driftIncreaseFactor;

  reactorGrowth = thisTime/1000 % 2;
  reactorGrowth = reactorGrowth -1;

  reactor.size += reactorGrowth;
  reactor.velX += drift * (Math.random()-0.5) * driftAffectFactor;
  reactor.velY += drift * (Math.random()-0.5) * driftAffectFactor;

  
  var controllerGrowth = delta/8;

  var controllerCount = 0;
  for (var i in controllers) {
    if (controllerCount > 2) break;
    var controller = controllers[i];
    controller.size -= controllerGrowth;
    if ( keys[controller.key]) {
      controllerCount++;
      controller.size += controllerGrowth*2;
    }
    if (controller.size < minControllerSize) controller.size = minControllerSize;
    else if (controller.size > 80) controller.size = 80;

    reactor.velX += (controller.x - reactor.x)*delta*controlFactor*(controller.size-minControllerSize);
    reactor.velY += (controller.y - reactor.y)*delta*controlFactor*(controller.size-minControllerSize);
  }

  reactor.velX * friction;
  reactor.velY * friction;
  reactor.x += reactor.velX * delta;
  reactor.y += reactor.velY * delta;
 
  //shake
  var instability = 1 - minDist/(screenSize.x/2);
  shake += delta*shakeIncreaseFactor*instability;
  reactor.x += shake * (Math.random()-0.5) * shakeAffectFactor;
  reactor.y += shake * (Math.random()-0.5) * shakeAffectFactor;

  recovering = instability < recoverDistance ? (recoverDistance-instability) * 1/recoverDistance : 0;
  if (recovering) {
    shake -= delta*shakeIncreaseFactor*recoveryFactor;
    if (shake < 0) shake = 0;

    homeSize = homeSize*(1-recovering)+reactor.size*recovering;
  }
}

function loop() {
  thisTime = new Date().getTime();
  delta = thisTime-lastTime;
  update(delta);
  draw();
  lastTime = thisTime;
  interval = targetInterval - (new Date().getTime() - thisTime);
  interval = interval < 1 ? 1 : interval;
  setTimeout(loop, interval);
}

function init() {
  canvas = document.getElementById("canvas");

  context = canvas.getContext("2d");
  timeDiv = document.getElementById("time");
  scoreDiv = $("#scores");

  window.onkeydown = keysdown;
  window.onkeyup = keysup;

  initWorld();
  lost = true;
  loop();
}

function keysup(e) {
  keys[e.keyCode] = false;
}

function keysdown(e) {
  keys[e.keyCode] = true;
  if (e.keyCode == 32) return false;//don't make space bar page down
}

window.onload = init;
