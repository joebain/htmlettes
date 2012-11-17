var input;
var output;
var illustrationEl;

var parser;


window.onload = function() {
	input = document.getElementById("input");
	output = document.getElementById("output");

	illustrationEl = document.getElementById("illustration");


	// set up the world
	var world = new World;
	world.init();


	// initial description
	output.innerHTML = world.getPlace(world.things.me.position).description;


	// process input
	input.addEventListener("keydown", function(e) {
		if (e.keyCode === 13) /*enter*/ {
			var command = parseInput(input.value);
			var response = world.advance(command);
			output.innerHTML = response;
			output.innerHTML +=  "<br/>Water level: " + world.things.water.level; 
			input.value = "";
		}
	});

	
	// get the grammar

	var xhr = new XMLHttpRequest();
	xhr.open("GET", "grammar.pjs");
	xhr.onreadystatechange = function() {
		if (xhr.readyState === 4 && xhr.status === 200) {
			var grammar = xhr.responseText;
			grammar = grammar.replace("$VERBS", _.map(verbs, function(s){return "\""+s+"\"";}).join("\n        \/ "));
			grammar = grammar.replace("$NOUNS", _.map(nouns, function(s){return "\""+s+"\"";}).join("\n        \/ "));
			grammar = grammar.replace("$ADJECTIVES", _.map(adjectives, function(s){return "\""+s+"\"";}).join("\n        \/ "));
			grammar = grammar.replace("$ADVERBS", _.map(adverbs, function(s){return "\""+s+"\"";}).join("\n        \/ "));
			grammar = grammar.replace("$ARTICLES", _.map(articles, function(s){return "\""+s+"\"";}).join("\n        \/ "));
			grammar = grammar.replace("$PREPOSITIONS", _.map(prepositions, function(s){return "\""+s+"\"";}).join("\n        \/ "));
			parser = PEG.buildParser(grammar);
		}
	};
	xhr.send();

	// set up the illustration
	var illustration = new Illustration(illustrationEl, world);
	var startTime = new Date().getTime();
	var thisTime = startTime, lastTime = startTime;
	setInterval(function() {
		lastTime = thisTime;
		thisTime = new Date().getTime();
		var delta = (thisTime - lastTime)/1000.0;
		illustration.update(delta);
		illustration.draw();
	}, 1000/30);
};


var ADVERB = "RB";
var ADJECTIVE = "JJ";
var VERB = "VB";
var NOUN = "NN";
var ARTICLE = "DT";
var PREPOSITION = "IN";

var PREPOSITIONAL_PHRASE = "PP";
var NOUN_PHRASE = "NP";
var VERB_PHRASE = "VP";

var isA = function(word, type) {
	switch(type) {
		case NOUN:
			return _.contains(nouns, word);
		case VERB:
			return _.contains(verbs, word);
		case ADJECTIVE:
			return _.contains(adjectives, word);
		case ADVERB:
			return _.contains(adverbs, word);
		case ARTICLE:
			return _.contains(articles, word);
		case PREPOSITION:
			return _.contains(prepositions, word);
	}
	return false;
};

var parseInput = function(text) {

	var words = text.split(/[ ,\.\?\!]+/);

	var parsedWords = parser.parse(text);

	var command = {};

	var explore = function(input, state) {
		if (input.type) {
			switch(input.type) {
				case PREPOSITIONAL_PHRASE:
					state = "object";
				break;
				case ADVERB:
					command.adverb = input.value;
				break;
				case VERB:
					command.action = input.value;
				break;
				case NOUN:
					if (state === "object") {
						command.object = input.value;
					} else if (state === "subject") {
						command.subject = input.value;
					}
				break;
				case ARTICLE:
					if (state === "object") {
						command.objectArticle = input.value;
					} else if (state === "subject") {
						command.subjectArticle = input.value;
					}
				break
			}
		}
		if (Object.prototype.toString.apply(input) === "[object Array]") {
			for (var i in input) {
				explore(input[i], state);
			}
		}
		if (Object.prototype.toString.apply(input.value) === "[object Array]") {
			for (var i in input.value) {
				explore(input.value[i], state);
			}
		}
	};
	explore(parsedWords, "subject");

	
	if (!command.object) {
		command.object = command.subject;
		command.subject = undefined;
	}
	if (!command.objectArticle) {
		command.objectArticle = command.subjectArticle;
		command.subjectArticle = undefined;
	}

	if (!command.subject) {
		command.subject = "me";
	}

	return command;
};
