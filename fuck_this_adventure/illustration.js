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
	var shape1 = new Box2D.b2EdgeShape();
	shape1.Set(new Box2D.b2Vec2(0, 0), new Box2D.b2Vec2(0, height*physScale));
	ground.CreateFixture(shape1, 0.0);
	var shape2 = new Box2D.b2EdgeShape();
	shape2.Set(new Box2D.b2Vec2(width*physScale, 0), new Box2D.b2Vec2(width*physScale, height*physScale));
	ground.CreateFixture(shape2, 0.0);

	this.particleSize = 5;
	this.num_particles = 100;

	var particles = [];

	var density = 1.0;

	var shape = new Box2D.b2CircleShape();
	shape.set_m_radius(that.particleSize*physScale);

	var addParticleAt = function(x,y) {
		var pos = new Box2D.b2Vec2(x,y);
		var bd = new Box2D.b2BodyDef();
		bd.set_type(Box2D.b2_dynamicBody);
		bd.set_position(pos);
		var body = world.CreateBody(bd);
		body.CreateFixture(shape, density);

		return body;
	};

	this.init = function() {
		var p = 0;
		var int = setInterval(function() {
			particles[p] = addParticleAt(width*physScale*0.5,height*physScale*0.5);
			p++;
			if (p >= that.num_particles) {
				clearInterval(int);
				return;
			}
		}, 100);
	};

	this.init();


	this.update = function(delta) {
		world.Step(delta, 2, 2);
	};

	this.draw = function() {
		ctx.fillStyle = "rgb(60,50,50)";
		ctx.clearRect(0, 0, width, height);

		for (var p = 0 ; p < particles.length; p++) {
			var particle = particles[p];
			var x = particle.GetPosition().get_x() / physScale;
			var y = height - particle.GetPosition().get_y() / physScale;
			ctx.beginPath();

			var grd = ctx.createRadialGradient(x, y, that.particleSize, x, y, that.particleSize*4);
			grd.addColorStop(1, 'rgba(30,100,230,0)');
			grd.addColorStop(0, 'rgba(30,100,230,1)');

			ctx.fillStyle = grd;

			ctx.arc(x, y,that.particleSize*4,0,Math.PI*2,false);

			ctx.fill();
		}


		// do the blobbing
		var imDat = ctx.getImageData(0, 0, width, height);
		for (x = 0 ; x < imDat.width ; x++) {
			for (y = 0; y < imDat.height ; y++) {
				var index = (y*4)*imDat.width+(x*4);
				var alpha = imDat.data[index+3];
				if (alpha > 127) {
					alpha = 255;
				} else {
					alpha = 0;
				}
				imDat.data[index+3] = alpha;
			}
		}
		ctx.putImageData(imDat, 0, 0);
	};
};
