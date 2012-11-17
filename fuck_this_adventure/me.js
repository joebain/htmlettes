var me = {
	name: "me",
	names: ["me", "myself"],
	position: "floor",
	positions: ["floor"],

	actions: [
		{
		v:["go", "walk", "sit", "stand", "lay", "lie"],
		f: function(command, world) {
			var place = world.getPlace(command.object);
			if (place) {
				this.position = place.name;

				return "You are " + place.preposition + " the " + place.name + "." + "<br/>" + place.description;
			}
		}
	}
	]
};
