var cat = {
	name: "cat",
	names: ["cat", "kitten", "moggy", "kitty", "mr cats"],
	position: "floor",
	positions: ["floor", "me", "ceiling", "heaven"],
	mood: "scared",
	trust: 2,
	happiness: 2,

	_calculateMood: function() {
		var mood = "";
		if (this.trust < 3) {
			mood += "nervous";
		} else if (this.trust < 6) {
			mood += "wary";
		}
		if (Math.abs(this.happiness - this.trust) > 3) {
			mood += " but ";
		} else {
			mood += " and ";
		}
		if (this.happiness < 3) {
			mood += "sad";
		} else if (this.happiness < 7) {
			mood += "indifferent towards you";
		} else {
			mood += "happy";
		}
		return mood;
	},

	actions: [
		{
			v:["touch", "stroke"],
			av: ["softly", "carefully", "kindly", "slowly"],
			f: function(command) {
				var response = "";
				if (command.action === "stroke" || _.contains(["softly", "carefully", "kindly", "slowly"], command.adverb)) {
					if (this.trust < 5) {
						this.trust++;
					}

					if (this.trust < 4) {
						response = "The cat nervously accepts your touch.";
					} else if (this.trust < 7) {
						response = "The cat nestles in to you as you stroke it."; 
					} else {
						response = "The cat purrs, it feels safe with you.";
					}
				} else {
					response = "The cat recoils from your touch.";
					if (this.trust > 0) {
						this.trust--;
					}
				}
				return response;
			}
		},
		{
			v: ["sing"],
			av: ["loudly", "quietly", "softly", "gently", "enthusiastically"],
			f: function(command) {
				var response = "";
				if (_.contains(["loudly", "enthusiastically"], command.adverb)) {
					if (this.trust < 5) {
						if (this.happiness > 2) {
							this.happiness--;
							response = "The cat doesn't like such loud signing. You are making it sad.";
						}
					} else {
						if (this.happiness < 10) {
							this.happiness++;
							response = "The cat really digs the way you sing with such gusto. It's bopping it's head.";
						}
					}
				} else if (_.contains(["quietly", "softly"], command.adverb)) {
					if (this.trust < 5) {
						this.trust++;
						response = "Your gentle singing seems to make the cat feel less nervous.";
					}
					if (this.happiness < 3) {
						this.happiness++;
						response = "Your gentle singing seems to make the cat feel more happy.";
					}
				} else {
					if (this.trust > 4) {
						if (this.happiness < 7) {
							this.happiness ++;
							response = "The cat likes your singing.";
						} else {
							response = "The cat still enjoys your signing but it doesn't seem to be as enetertained as before.";
						}
					} else {
						response = "The cat seems to nervous to enjoy the song.";
					}
				}

				if (response === "") {
					response = "The cat doesn't like the way you sing. Perhaps it's a little off key.";
				}

				return response;
			}
		},
		{
			v:["pick"],
			f: function(command) {
				if (this.trust < 3) {
					response = "The cat runs away as you try to pick it up.";
				} else if (this.trust < 5) {
					response = "The cat squirms as you pick it up.";
					this.position = "me";
				} else {
					response = "The cat jumps into your arms.";
					this.position = "me";
				}
				return response;
			}
		},
		{
			v:["look"],
			f: function(command, world) {
				var repsponse = "";
				var waterLevel = world.things.water.level;
				if (this.position === "floor") {
					if (waterLevel < 2) {
						response = "The cat is getting wet.";
					} else if (waterLevel < 3) {
						response = "The cat is struggling to stay above the rising water.";
					} else {
						response = "The cat has drowned. It's body is floating limp on the surface of the water.";
					}
				} else if (this.position === "me") {
					if (waterLevel < 3) {
						response = "The cat is damp, but staying dry in your arms";
					} else if (waterLevel < 4) {
						response = "The cat is starting to get wet, you can't keep it above the water.";
					} else {
						response = "As you swim the cat is getting submerged. But it's ok.";
					}
				}
				this.mood = this._calculateMood();
				response += "<br/>" + "The cat is " + this.mood + ".";
				return response;
			}
		}
	]
};
