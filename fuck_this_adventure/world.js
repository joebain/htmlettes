function World() {

	var that = this;

	this.gameDuration = 3*60*1000;

	this.things = {
		cat: cat,

		you: {
			name: "you",
			names: ["you", "yourself"]
		},

		me: me,

		water: {
			name: "water",
			names: ["water"],
			level: 1
		}
	};

	this.places = {
		floor: {
			name: "floor",
			names: ["floor"],
			description: "You are in a small room. The floor is wet. There is a cat in front of you. You don't know how long you have been here.",
			preposition: "on"
		},
		corner: {
			name: "corner",
			names: ["corner"],
			description: "The corner is darker than the rest of the room. But it is just as wet.",
			preposition: "in"
		}
	}

	this.init = function() {
		that.startTime = new Date;
		for (var t in that.things) {
			var thing = that.things[t];
			nouns = _.union(nouns, thing.names, thing.positions);

			for (var a in thing.actions) {
				var action = thing.actions[a];
				verbs = _.union(verbs, action.v);
				adverbs = _.union(adverbs, action.av);
			}
		}
	};


	this.getThing = function(name) {
		for (var t in that.things) {
			var thing = that.things[t];
			if (_.contains(thing.names, name)) {
				return thing;
			}
		}
		return null;
	};

	this.getPlace = function(name) {
		for (var p in that.places) {
			var place = that.places[p];
			if (_.contains(place.names, name)) {
				return place;
			}
		}
		return null;
	};

	this.end = function() {
		that.ended = true;
	};

	this.advance = function(command) {
		if (that.ended) {
			return "You are dead.";
		}
		var response = "I'm sorry, I don't understand.";
		if (!command.subject || !command.action) {
			return response;
		}
		var subject = that.getThing(command.subject);
		var object = that.getThing(command.object);

		that.gameTimeElapsed = new Date - that.startTime;
		that.things.water.level = Math.floor((that.gameTimeElapsed / that.gameDuration) * 10);

		if (that.things.water.level >= 10) {
			that.end();
			return "The water is too high. The entire room is filled and there is no air. You drown.";
		}

		// actually i don't care where things are
//        if (subject && object && subject.position && object.position && subject.position !== object.position) {
//            var location = that.getPlace(subject.position);
//            response = "The " + object.name + " is not " + location.preposition +  " the " + location.name;
//            return response;
//        }
		if (subject.name === "me") {
			if (!object) {
				object = subject;
			}
			for (var a in object.actions) {
				var action = object.actions[a];
				if (_.contains(action.v, command.action)) {
					response = action.f.call(object, command, that);
					return response;
				}
			}
		}
		return response;
	};
};

_.intersects = function(arr1, arr2) {
	return _.intersection(arr1, arr2).length > 0;
};



