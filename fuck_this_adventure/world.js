var world = {

	things: {
		cat: {
			name: "cat",
			names: ["cat", "kitten", "moggy"],
			position: "floor",
			mood: "scared",

			actions: [
				{
					v:["touch", "stroke"],
					f: function(command) {
						var response = "";
						if (_.contains(["softly", "carefully", "kindly", "slowly"], command.adverb)) {
							world.things.cat.mood = "worried";
							response = "The cat nervously accepts your touch.";
						} else {
							if (world.things.cat.position === "floor") {
								world.things.cat.position = "corner";
								response = "The cat recoils from your touch and runs off to the corner.";
							} else {
								world.things.cat.position = "floor";
								response = "The cat recoils from your touch and runs off to the floor.";
							}
						}
						response += "<br/>" + "The cat is " + world.things.cat.mood + ".";
						return response;
					}
				}
			]

		},

		you: {
			name: "you",
			names: ["you", "yourself"]
		},

		me: {
			name: "me",
			names: ["me", "myself"],
			position: "floor",

			actions: [
				{
					v:["go", "walk", "sit", "stand", "lay", "lie"],
					f: function(command) {
						var place = getPlace(command.object);
						if (place) {
							world.things.me.position = place.name;

							return "You are " + place.preposition + " the " + place.name + "." + "<br/>" + place.description;
						}
					}
				}
			]
		}

	},

	places: {
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
};

_.intersects = function(arr1, arr2) {
	return _.intersection(arr1, arr2).length > 0;
};

var getThing = function(name) {
	for (var t in world.things) {
		var thing = world.things[t];
		if (_.contains(thing.names, name)) {
			return thing;
		}
	}
	return null;
};

var getPlace = function(name) {
	for (var p in world.places) {
		var place = world.places[p];
		if (_.contains(place.names, name)) {
			return place;
		}
	}
	return null;
};

var advanceTheWorld = function(command) {
	var response = "I'm sorry, I don't understand.";
	if (!command.subject || !command.action) {
		return response;
	}
	var subject = getThing(command.subject);
	var object = getThing(command.object);

	if (subject && object && subject.position && object.position && subject.position !== object.position) {
		var location = getPlace(subject.position);
		response = "The " + object.name + " is not " + location.preposition +  " the " + location.name;
		return response;
	}
	if (subject.name === "me") {
		if (!object) {
			object = subject;
		}
		for (var a in object.actions) {
			var action = object.actions[a];
			if (_.contains(action.v, command.action)) {
				response = action.f(command);
				return response;
			}
		}
	}
	return response;
};

