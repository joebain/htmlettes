var currentPage = 0;

var speed = 30;
var waiting = 0;
var seeking = 1;
var state = waiting;

var pageHeight = window.innerHeight;
var target = 0;

var getSnap;

addEventListener("load", function() {
	var pages = document.getElementsByClassName("page");
	getSnap = function(y) {
		y = y || window.scrollY;
		for (var p in pages) {
			var page = pages[p];
			if (y > page.offsetTop && y < page.offsetTop + page.clientHeight) {
				if (Math.abs(y - page.offsetTop) > Math.abs(y - (page.clientHeight+page.offsetTop))) {
					return page.offsetTop + page.clientHeight - pageHeight;
				} else {
					return page.offsetTop;
				}
			}
		}
		if (y < 0) {
			return 0;
		} else {
			return pages[pages.length-1].offsetTop;
		}
	}
	setTimeout(function() {
		document.getElementsByTagName("body")[0].style.opacity = 1;
		for (var p = 0 ; p < pages.length ; p++) {
			var page = pages[p];
			var currentHeight = page.offsetHeight;
			if (pageHeight > currentHeight) {
				page.style.height = pageHeight;
			} else {
				page.style.height = currentHeight;
			}
		}

		var centreds = document.getElementsByClassName("centred");
		for (var c = 0 ; c < centreds.length ; c++) {
			var centred = centreds[c];
			centred.style.height = centred.clientHeight + 20;
			centred.style.width = centred.clientWidth + 20;
			centred.className = "centred post-centred";
		}

		window.addEventListener("keydown", function(e) {
			if (e.keyCode === 40 || e.keyCode == 38) {
				e.preventDefault();
				return false;
			}
		});
		window.addEventListener("keyup", function(e) {
			if (e.keyCode === 40) { // down
				target = getSnap(target+pageHeight+21);
				state = seeking;
				e.preventDefault();
				return false;
			}
			else if (e.keyCode === 38) { // up
				target = getSnap(target-1);
				state = seeking;
				e.preventDefault();
				return false;
			}
		});

	}, 1000);
}, false);

var scrollTimeout;
addEventListener("scroll", function(e) {
	clearTimeout(scrollTimeout);
	scrollTimeout = setTimeout(function() {
		target = getSnap(window.scrollY+pageHeight/2);
		state = seeking;
	}, 500);
});

setInterval(function() {
	if (state === seeking) {
		if (Math.abs(window.scrollY - target) < speed*2) {
			window.scrollTo(0, target);
			state = waiting;
			speed = 1;
		} else if (target > window.scrollY) {
			window.scrollTo(0, window.scrollY + speed);
			speed += 1;
		} else if (target < window.scrollY) {
			window.scrollTo(0, window.scrollY - speed);
			speed += 1;
		}
	}
}, 10);


// some help for later
// shim layer with setTimeout fallback
window.requestAnimFrame = (function(){
	return  window.requestAnimationFrame       ||
		window.webkitRequestAnimationFrame ||
			window.mozRequestAnimationFrame    ||
				function( callback ){
		window.setTimeout(callback, 1000 / 60);
	};
})();


