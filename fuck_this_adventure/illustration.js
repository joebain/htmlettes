var Illustration = function(el, world, input) {

	var that = this;

	el.width = window.innerWidth;
	el.height = window.innerHeight;
	var width = el.width;
	var height = el.height;

	var ctx = el.getContext("2d");


	var physScale = 0.01;

	var gravity = new Box2D.b2Vec2(0,-10);
	var world = new Box2D.b2World(gravity);

	var bd_ground = new Box2D.b2BodyDef();
	var ground = world.CreateBody(bd_ground);

	var shape0 = new Box2D.b2EdgeShape();
	shape0.Set(new Box2D.b2Vec2(0, 0), new Box2D.b2Vec2(width*physScale, 0));
	ground.CreateFixture(shape0, 0.0);


	this.minDistance = 400;
	this.repulsionFactor = 0.3;
	this.repulsionBase = 100;
	this.gravity = 10;
	this.deceleration = 0.8;
	this.maxVelocity = 20;
	this.particleSize = 10;
	this.num_particles = 20;

	var gui = new dat.GUI();
	gui.add(this, "minDistance", 0, 1000);
	gui.add(this, "repulsionFactor", 0, 2);
	gui.add(this, "repulsionBase", 0, 200);
	gui.add(this, "gravity", -100, 100);
	gui.add(this, "num_particles", 1, 1000);
	gui.add(this, "deceleration", 0, 1);
	gui.add(this, "maxVelocity", 0, 100);
	gui.add(this, "particleSize", 1, 100);

	var particles = [];

	var density = 1.0;


	var addParticleAt = function(x,y) {
		var shape = new Box2D.b2CircleShape();
		shape.set_m_radius(that.particleSize*physScale);
		var pos = new Box2D.b2Vec2(x,y);
		var bd = new Box2D.b2BodyDef();
		bd.set_type(Box2D.b2_dynamicBody);
		bd.set_position(pos);
		var body = world.CreateBody(bd);
		body.CreateFixture(shape, density);
		body.SetAwake(1);
		body.SetActive(1);

		return body;
	};

	this.init = function() {
		var p = 0;
		var int = setInterval(function() {
			particles[p] = addParticleAt(width*physScale*0.5,height*physScale*0.5);
			p++;
			if (p >= this.num_particles) {
				clearInterval(int);
			}
		}, 300);
//            particles[p] = {
//                x:Math.random()*5+width*0.5,
//                y:Math.random()*5+height*0.5,
//                vel: {
//                    x:0,
//                    y:0
//                }
//            };
//        }
	};

	this.init();


	this.update = function() {
		world.Step(1.0/30, 2, 2);

		/*
		for (var p = 0 ; p < this.num_particles; p++) {
			var particle = particles[p];
			for (var q = p+1 ; q < this.num_particles; q++) {
				var qarticle = particles[q];
				var xd = particle.x - qarticle.x;
				var yd = particle.y - qarticle.y;
				var xxd = xd*xd;
				var yyd = yd*yd;
				if (xd !== 0 && yd !== 0 && xxd + yyd < that.minDistance) {
					particle.vel.y += (-yd)*yd*that.repulsionFactor + that.repulsionBase;
					particle.vel.x += (-xd)*xd*that.repulsionFactor + that.repulsionBase;
					qarticle.vel.y += -((-yd)*yd*that.repulsionFactor + that.repulsionBase);
					qarticle.vel.x += -((-xd)*xd*that.repulsionFactor + that.repulsionBase);
				}
			}
		}
		for (var p = 0 ; p < this.num_particles; p++) {
			var particle = particles[p];
			particle.vel.y += that.gravity;
			if (particle.y > height) {
				particle.vel.y = 0;
			}
			if (particle.x < 0) {
				particle.vel.x += that.gravity;
			} else if (particle.x > width) {
				particle.vel.x -= that.gravity;
			}
			if (particle.vel.x > that.maxVelocity) {
				particle.vel.x = that.maxVelocity;
			} else if (particle.vel.x < -that.maxVelocity) {
				particle.vel.x = -that.maxVelocity;
			}
			if (particle.vel.y > that.maxVelocity) {
				particle.vel.y = that.maxVelocity;
			} else if (particle.vel.y < -that.maxVelocity) {
				particle.vel.y = -that.maxVelocity;
			}
			particle.vel.x *= that.deceleration;
			particle.vel.y *= that.deceleration;
			particle.x += particle.vel.x;
			particle.y += particle.vel.y;
		}
		*/
	};

	this.draw = function() {
		ctx.fillStyle = "rgb(60,50,50)";
		ctx.clearRect(0, 0, width, height);

		for (var p = 0 ; p < that.num_particles; p++) {
			var particle = particles[p];
			var x = particle.GetPosition().get_x() / physScale;
			var y = height - particle.GetPosition().get_y() / physScale;
			ctx.beginPath();

			var grd = ctx.createRadialGradient(x, y, that.particleSize/4, x, y, that.particleSize);
			grd.addColorStop(1, 'rgba(30,100,230,0)');
			grd.addColorStop(0, 'rgba(30,100,230,1)');

			ctx.fillStyle = grd;

			ctx.arc(x, y,that.particleSize,0,Math.PI*2,false);

			ctx.fill();
		}


		// do the blobbing
		var imDat = ctx.getImageData(0, 0, width, height);
		for (x = 0 ; x < imDat.width ; x++) {
			for (y = 0; y < imDat.height ; y++) {
				var index = (y*4)*imDat.width+(x*4);
//                var red = imDat.data[index];
//                var green = imDat.data[index+1];
//                var blue = imDat.data[index+2];
				var alpha = imDat.data[index+3];
				if (alpha > 127) {
					alpha = 255;
				} else {
					alpha = 0;
				}
				imDat.data[index+3] = alpha;
			}
		}
//        var rawDat = imDat.data;
//        for (var i = 0 ; i < rawDat.length ; i++) {
//            var col = rawDat[i];
//            if (col > 0) {
//                if ((col >> 6) & 0x0000FF > 127) {
//                    col |= 0xFF000000;
//                } else {
//                    col &= 0x00FFFFFF;
//                }
//            }
//        }
		ctx.putImageData(imDat, 0, 0);
	};
};
