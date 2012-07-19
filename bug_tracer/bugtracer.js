window.onload = function(e) {

	// get the paramaters
	var word;
	var style;
	var source;
	var inverse;
	var lightOnDark;
	var fadeOut;
	getUrlParams();

	function getUrlParams() {
		var query = decodeURI(window.location.search.substr(1)).split("&");
		var params = {};
		for (var q in query) {
			var param = query[q].split("=");
			params[param[0]] = param[1];
		}

		word = params.word || "joeba.in";
		style = params.style || "circles";
		source = params.source || "word";
		inverse = params.inverse || "yes";
		inverse = inverse == "yes";
		lightOnDark = params.lightOnDark || "no";
		lightOnDark = lightOnDark == "yes";
		fadeOut = params.fadeOut || 1.0;
	}
	function setUrlParams() {
		var params = {
			word:textInput.value || word,
			inverse:inverseSelect.checked?"yes":"no",
			lightOnDark:lightOnDarkSelect.checked?"yes":"no",
			style:styleSelect.value,
			fadeOut:fadeOutRange.value
		};
		var query = "?";
		for (var p in params) {
			query += p + "=" + params[p] + "&";
		}
		query = query.substr(0,query.length-1);
		var newLoc = window.location.href.replace(window.location.search, "");
		newLoc += query;
		window.history.pushState(null, document.title, newLoc);
	}


	// handle the form etc
	var button = document.getElementById("tabRevealButton");
	var form = document.getElementById("settingsForm");
	var textInput = document.getElementById("setWordTextInput");
	var inverseSelect = document.getElementById("inverseCheckbox");
	var lightOnDarkSelect = document.getElementById("lightOnDarkCheckbox");
	var styleSelect = document.getElementById("styleSelect");
	var fadeOutRange = document.getElementById("fadeOutRange");

	textInput.value = word;
	inverseSelect.checked = inverse;
	lightOnDarkSelect.checked = lightOnDark;
	styleSelect.value = style;
	fadeOutRange.value = fadeOut;
	fadeOutRange.onchange = function() {
		fadeOut = fadeOutRange.value;
	};

	var formHeight = form.clientHeight;
	form.style.top = 0;//-formHeight;
	button.onclick = function(e) {
		if (form.style.top === "" || parseInt(form.style.top) === -formHeight) {
			form.style.top = 0;
		} else {
			form.style.top = -formHeight;
		}
	};


	function showTabs(activeTabName) {
		var sourceTabs = document.getElementsByClassName("sourceTab");
		for (var s = 0 ; s < sourceTabs.length ; s++) {
			var sourceName = sourceTabs[s].getElementsByClassName("sourceTabLabel")[0];
			var sourceContent = sourceTabs[s].getElementsByClassName("sourceContent")[0];
			if (sourceName.textContent.toLowerCase() === activeTabName) {
				sourceContent.style.display = "";
				sourceName.classList.add("active");
				sourceName.classList.remove("inactive");
			} else {
				sourceContent.style.display = "none";
				sourceName.classList.add("inactive");
				sourceName.classList.remove("active");
			}
		}
		formHeight = form.clientHeight;
	}
	showTabs(source);

	var sourceTabs = document.getElementsByClassName("sourceTab");
	for (var s = 0 ; s < sourceTabs.length ; s++) {
		var sourceName = sourceTabs[s].getElementsByClassName("sourceTabLabel")[0];
		(function(sourceName) {
			sourceName.onclick = function() {
				source = sourceName.textContent.toLowerCase();
				showTabs(source);
			};
		})(sourceName);
	}


	var canvas = document.getElementById("canvas");
	var context = canvas.getContext('2d');
	var pWidth = document.body.clientWidth;
	var pHeight = document.body.clientHeight;

	canvas.height = pHeight;
	canvas.width = pWidth;
	var gridSize = 10;

	function resetCanvas() {
		if (lightOnDark) {
			context.globalCompositeOperation = "lighter";
			context.fillStyle = "#333";
		} else {
			context.globalCompositeOperation = "darker";
			context.fillStyle = "#ddd";
		}
		context.clearRect(0,0,pWidth, pHeight);
		context.fillRect(0,0,pWidth, pHeight);
	}

	var backCanvas = document.createElement("canvas");
	backCanvas.width = Math.floor(pWidth/gridSize);
	backCanvas.height = Math.floor(pHeight/gridSize);
	var bContext = backCanvas.getContext("2d");
	var bImData = bContext.getImageData(0,0,backCanvas.width, backCanvas.height);
	function fillBackCanvas() {
//        setTimeout(function() {
			bContext.fillStyle = "#fff";
			var fontSize = backCanvas.height*(1/0.9)
			var textMeasurements;
			do {
				fontSize = Math.round(fontSize*0.9);
				bContext.font = fontSize+ 'px "Arial Black", "Arial Bold", Gadget, sans-serif';
//                console.log(bContext.font);
				textMeasurements = bContext.measureText(word);
//                console.log(textMeasurements.width);
			} while (textMeasurements.width*gridSize > pWidth);

			bContext.clearRect(0, 0, backCanvas.width, backCanvas.height);
			bContext.fillText(word, -textMeasurements.width/2 + backCanvas.width/2, backCanvas.height/2 + fontSize/3);
			bImData = bContext.getImageData(0,0,backCanvas.width, backCanvas.height);

//        }, 1000);
	}


	var bug = function() {
		var colour = "#ff0";
		var rand = Math.random();
		if (rand < 0.33) {
			colour = "#0ff";
		} else if (rand < 0.66) {
			colour = "#f0f";
		}
		var bugX = Math.floor(Math.random() * pWidth);
		var bugY = Math.floor(Math.random() * pHeight);
		var bugvy = Math.random()-0.5;
		var bugvx = Math.random()-0.5;

		this.update = function() {
			bugvx += Math.random()*2-1;
			bugvy += Math.random()*2-1;
			var oldBugX = bugX;
			var oldBugY = bugY;
			var newBugX = bugX + Math.round(bugvx)*gridSize;
			var newBugY = bugY + Math.round(bugvy)*gridSize;
			var isWhite = function(x,y,imData) {
				x = Math.floor(x/gridSize);
				y = Math.floor(y/gridSize);
				var r = imData.data[y*imData.width*4+x*4];
				var g = imData.data[y*imData.width*4+x*4+1];
				var b = imData.data[y*imData.width*4+x*4+2];
				return r > 0 || g > 0 || b > 0;
			};
			for (var chances = 0 ; chances < 4 ; chances++) {
				var shouldRetry = false;
				if (inverse) {
					shouldRetry = (!isWhite(bugX,bugY,bImData) && isWhite(newBugX, newBugY, bImData));
				} else {
					shouldRetry = (isWhite(bugX,bugY,bImData) && !isWhite(newBugX, newBugY, bImData));
				}
				if (shouldRetry) {
					if (Math.random() > 0.5) {
						bugvy *= -1;
					} else {
						bugvx *= -1;
					}
				} else {
					break;
				}
				newBugX = bugX + Math.round(bugvx)*gridSize;
				newBugY = bugY + Math.round(bugvy)*gridSize;
			}
			bugX += Math.round(bugvx)*gridSize;
			bugY += Math.round(bugvy)*gridSize;
			var wrapped_around = false;
			if (bugX > pWidth) { wrapped_around = true;  bugX -= pWidth;}
			if (bugX < 0) { wrapped_around = true;  bugX += pWidth;}
			if (bugY > pHeight) { wrapped_around = true;  bugY -= pHeight;}
			if (bugY < 0) { wrapped_around = true;  bugY += pHeight;}
			if (bugvx > 1) {  bugvx = 1;}
			if (bugvx < -1) {  bugvx = -1;}
			if (bugvy > 1) {  bugvy = 1;}
			if (bugvy < -1) {  bugvy = -1;}


			switch (style) {
				case "circles":
					var circleSize = gridSize*0.5*Math.random();

				context.fillStyle = colour;
				context.beginPath();
				context.arc(bugX-circleSize/2, bugY-circleSize/2, circleSize, 0, Math.PI*2, true); 
				context.fill();
				break;

				case "lines":
					// dont draw if we wrapped around
					if (!wrapped_around) {
					if (lightOnDark) {
						context.strokeStyle = "#fff";
					} else {
						context.strokeStyle = "#000";
					}
					context.beginPath();
					context.moveTo(oldBugX, oldBugY); 
					context.lineTo(bugX, bugY); 
					context.stroke();
				}
				break;

				case "grey_circles":
					if (lightOnDark) {
						context.fillStyle = "#111";
					} else {
//                        context.fillStyle = "#eee";
						context.fillStyle = "#666";
					}
					var halfRectSize = 0.2;
					//context.fillRect(bugX-gridSize*halfRectSize, bugY-gridSize*halfRectSize, gridSize*halfRectSize*2, gridSize*halfRectSize*2);
					context.beginPath();
					context.arc(bugX-gridSize*halfRectSize, bugY-gridSize*halfRectSize, gridSize*halfRectSize*2, 0, Math.PI*2, true); 
					context.fill();
					break;

				case "squares":
					if (lightOnDark) {
						context.fillStyle = "hsl(" + rand*255 + ",80%,40%)";
					} else {
						context.fillStyle = "hsl(" + rand*255 + ",80%,50%)";
					}
					var halfRectSize = 0.5;
					context.fillRect(bugX-gridSize*halfRectSize, bugY-gridSize*halfRectSize, gridSize*halfRectSize*2, gridSize*halfRectSize*2);
//                    context.beginPath();
//                    context.arc(bugX-gridSize*halfRectSize, bugY-gridSize*halfRectSize, gridSize*halfRectSize*2, 0, Math.PI*2, true); 
//                    context.fill();
					break;
			}
		};
		return this;
	};

	var bugs = [];
	function setupBugs() {
		bugs = [];
		var numberOfBugs = 30;
		if (inverse) numberOfBugs = numberOfBugs* 10;
		for (var i = 0 ; i < numberOfBugs ; i++) {
			bugs[i] = new bug();
		}
	}

	function init() {
		resetCanvas();
		fillBackCanvas();
		setupBugs();
	}
	init();

	form.onsubmit = function(e) {
		e.preventDefault();

		setUrlParams();
		getUrlParams();

		init();
		return true;
	};




	var updateInterval = 50;
	var update = function() {
		
		var fadeOutMult = Math.pow(fadeOut,4);
		if (lightOnDark) {
			context.globalCompositeOperation = "source-over";
			context.fillStyle = "rgba(51,51,51, " +fadeOutMult+ ")";
		} else {
			context.globalCompositeOperation = "source-over";
			context.fillStyle = "rgba(221,221,221, " +fadeOutMult+ ")";
		}
		context.fillRect(0,0,pWidth, pHeight);

		if (lightOnDark) {
			context.globalCompositeOperation = "lighter";
		} else {
			context.globalCompositeOperation = "darker";
		}

		for (var i in bugs) {
			bugs[i].update();
		}
		setTimeout(update, updateInterval);
	};
	update();

};
