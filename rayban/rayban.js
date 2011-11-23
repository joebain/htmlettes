var map = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [1,0,0,1,0,0,1,1,1,1,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];
var mapWidth = 26;
var mapHeight = 10;

var player;
var rayHits = [];
var stripWidth = 10;
var numRays;
var viewDist = 500;

var drawHeight;

function init() {
  player = {x:2, y:2, dir:0, speed:0.005, rot_speed:0.002};
  numRays = screenSize.x/stripWidth;
  drawHeight = screenSize.y/2;

  var fov = 60 * Math.PI / 180;
  numRays = Math.ceil(screenSize.x / stripWidth);
  viewDist = (screenSize.x/2) / Math.tan(fov / 2);
}

var topDownScale = 10;
function draw() {
  clear("#000000");

  // draw the walls
  var dist;
  var shade;
  var size;
  var minSize = 100000000;
  var minLineTop = 10000000000000;
  var lineTop;
  var groundTop;
  for (var i = 0; i < numRays ; i++) {
    if (rayHits[i]) {
      shade = (255 - rayHits[i].d)/255;
      shade = shade < 0 ? 0 : shade;
      shade *= (((Math.cos(rayHits[i].wallAngle)+1)*0.25)+0.5);
      size = (0.5*viewDist)/rayHits[i].s;
      if (size < minSize) {
        minSize = size;
        minLineTop = lineTop;
      }
      
      lineTop = screenSize.y/2 - size/2 - 500/size;

//      6a3926
      context.fillStyle = "rgba(" + Math.round(106*shade) + ", "+Math.round(57*shade) +", "+Math.round(38*shade)+", 1)";
      context.fillRect(i*stripWidth, lineTop , stripWidth/2, size);

      groundTop = lineTop + size;
      groundTop = groundTop > screenSize.y ? screenSize.y : groundTop;
      context.fillStyle = "#daf8f6";
      context.fillRect(i*stripWidth+stripWidth*0.5, groundTop, stripWidth/2, screenSize.y-groundTop);

      context.fillStyle = "#3a10a4";
      context.fillRect(i*stripWidth+stripWidth*0.5, 0, stripWidth/2, lineTop);
    }      
  }
  size = 0;
  for (var i = 0; i < numRays ; i++) {
    if (!rayHits[i]) {
      lineTop = minLineTop+minSize/2; 

      groundTop = lineTop + size;
      groundTop = groundTop > screenSize.y ? screenSize.y : groundTop;
      context.fillStyle = "#daf8f6";
      context.fillRect(i*stripWidth+stripWidth*0.5, groundTop, stripWidth/2, screenSize.y-groundTop);

      context.fillStyle = "#3a10a4";
      context.fillRect(i*stripWidth+stripWidth*0.5, 0, stripWidth/2, lineTop);
    }
  }

  // draw the little map
  return;
  context.fillStyle = "#ffffff";
  context.beginPath();
  context.arc(player.x*topDownScale, player.y*topDownScale+drawHeight, 5, 0, Math.PI*2, true);
  context.arc((player.x+Math.cos(player.dir))*topDownScale, (player.y+Math.sin(player.dir))*topDownScale+drawHeight, 2, 0, Math.PI*2, true);
  context.fill();

  for (var i = 0 ; i < map.length ; i++) {
    for (var j = 0 ; j < map[i].length ; j++) {
      if (map[i][j]) {
        context.fillRect(j*topDownScale, i*topDownScale+drawHeight, topDownScale, topDownScale);
      }
    }
  }
  for (var i = 0; i < numRays ; i++) {
    if (rayHits[i]) {
      context.strokeStyle = "#dddddd";
      context.beginPath();
      context.moveTo(player.x*topDownScale, player.y*topDownScale+drawHeight);
      context.lineTo(rayHits[i].x*topDownScale, rayHits[i].y*topDownScale+drawHeight);
      context.stroke();
    }
  }
}

function update(delta) {
  var newy, newx;
  var moveMade = false;
  if (keys[key_up]) {
    newx = player.x + delta * player.speed * Math.cos(player.dir);
    newy = player.y + delta * player.speed * Math.sin(player.dir);
    moveMade = true;
  } else if (keys[key_down]) {
    newx = player.x - delta * player.speed * Math.cos(player.dir);
    newy = player.y - delta * player.speed * Math.sin(player.dir);
    moveMade = true;
  }

  if (moveMade) {
    var mapy = Math.floor(newy);
    var mapx = Math.floor(newx);
    if ( mapx >= 0 && mapx < mapWidth && map[Math.floor(player.y)][mapx] === 0) {
      player.x = newx;
    }
    else {
      console.log("wall x");
    }
    if ( mapy >= 0 && mapy < mapHeight && map[mapy][Math.floor(player.x)] === 0) {
      player.y = newy;
    }
    else {
      console.log("wall y");
    }
  }

  if (keys[key_right]) {
    player.dir += delta * player.rot_speed;
  } else if (keys[key_left]) {
    player.dir -= delta * player.rot_speed;
  }

  castRays();
}

function castRays() {
  var stripIdx = 0;
  for (var i=0;i<numRays;i++) {
    rayHits[i] = null;
    // where on the screen does ray go through?
    var rayScreenPos = (-numRays/2 + i) * stripWidth;

    // the distance from the viewer to the point on the screen, simply Pythagoras.
    var rayViewDist = Math.sqrt(rayScreenPos*rayScreenPos + viewDist*viewDist);

    // the angle of the ray, relative to the viewing direction.
    // right triangle: a = sin(A) * c
    var rayAngle = Math.asin(rayScreenPos / rayViewDist);
    castSingleRay(
      player.dir + rayAngle, 	// add the players viewing direction to get the angle in world space
      stripIdx++
    );
  }
}

function castSingleRay(rayAngle, idx) {
  // make sure the angle is between 0 and 360 degrees
  rayAngle %= PI_2;
  if (rayAngle < 0) rayAngle += PI_2;

  // moving right/left? up/down? Determined by which quadrant the angle is in.
  var right = (rayAngle > PI_2 * 0.75 || rayAngle < PI_2 * 0.25);
  var up = !(rayAngle < 0 || rayAngle > Math.PI);

  var angleSin = Math.sin(rayAngle), angleCos = Math.cos(rayAngle);

  var dist = 0;  // the distance to the block we hit
  var xHit = 0, yHit = 0  // the x and y coord of where the ray hit the block
  var wallX;  // the (x,y) map coords of the block
  var wallY;

  // first check against the vertical map/wall lines
  // we do this by moving to the right or left edge of the block we're standing in
  // and then moving in 1 map unit steps horizontally. The amount we have to move vertically
  // is determined by the slope of the ray, which is simply defined as sin(angle) / cos(angle).

  var slope = angleSin / angleCos;  // the slope of the straight line made by the ray
  var dX = right ? 1 : -1;  // we move either 1 map unit to the left or right
  var dY = dX * slope;  // how much to move up or down

  var x = right ? Math.ceil(player.x) : Math.floor(player.x);  // starting horizontal position, at one of the edges of the current map block
  var y = player.y + (x - player.x) * slope;  // starting vertical position. We add the small horizontal step we just made, multiplied by the slope.

  while (x >= 0 && x < mapWidth && y >= 0 && y < mapHeight) {
    var wallX = Math.floor(x + (right ? 0 : -1));
    var wallY = Math.floor(y);

    // is this point inside a wall block?
    if (map[wallY][wallX] > 0) {
      var distX = x - player.x;
      var distY = y - player.y;
      dist = distX*distX + distY*distY;  // the distance from the player to this point, squared.

      xHit = x;  // save the coordinates of the hit. We only really use these to draw the rays on minimap.
      yHit = y;
      break;
    }
    x += dX;
    y += dY;
  }


  var minDist = dist;
  if (dist) {
    drawRay(idx, xHit, yHit, dist, rayAngle, up, right, true);
  }



  slope = angleCos / angleSin;  // the slope of the straight line made by the ray
  dY = up ? 1 : -1;  // how much to move up or down
  dX = dY * slope;  // we move either 1 map unit to the left or right

  y = up ? Math.ceil(player.y) : Math.floor(player.y);
  x = player.x + (y - player.y) * slope;

  dist = 0;  // the distance to the block we hit
  xHit = 0;
  yHit = 0;  // the x and y coord of where the ray hit the block
  while (x >= 0 && x < mapWidth && y >= 0 && y < mapHeight) {
    var wallX = Math.floor(x);
    var wallY = Math.floor(y + (up ? 0 : -1));

    // is this point inside a wall block?
    if (map[wallY][wallX] > 0) {
      var distX = x - player.x;
      var distY = y - player.y;
      dist = distX*distX + distY*distY;  // the distance from the player to this point, squared.

      xHit = x;  // save the coordinates of the hit. We only really use these to draw the rays on minimap.
      yHit = y;
      break;
    }
    x += dX;
    y += dY;
  }

  // horizontal run snipped, basically the same as vertical run

  if (dist && (!minDist || dist < minDist)) {
    drawRay(idx, xHit, yHit, dist, rayAngle, up, right, false);
  }
}

function drawRay(i, x,y, dist, angle, up, right, vertical) {
  var size = Math.sqrt(dist) * Math.cos(player.dir - angle);
  var wallAngle;
  if (vertical) {
    if (right) {
      wallAngle = Math.PI*0.5; //west facing
    } else {
      wallAngle = Math.PI*1.5; //east facing
    }
  } else {
    if (up) {
      wallAngle = 0; //south facing
    } else {
      wallAngle = Math.PI; //north facing
    }
  }
  rayHits[i] = {x:x, y:y, d:dist, a:angle, s:size, wallAngle:wallAngle};
}
