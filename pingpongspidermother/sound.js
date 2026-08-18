/*
 * Minimal stand-in for soundmanager2, backed by plain HTML5 <audio>.
 *
 * Only implements the bits this game uses. The one behaviour modern browsers
 * force on us is that audio can't start until the user has interacted with the
 * page, so any play() before that is queued and flushed on the first
 * keypress/click.
 */
(function(global) {

	var unlocked = false;
	var pendingPlays = {};
	var muted = false;
	var sounds = [];

	function unlock() {
		if (unlocked) return;
		unlocked = true;
		window.removeEventListener("keydown", unlock, true);
		window.removeEventListener("pointerdown", unlock, true);
		window.removeEventListener("touchend", unlock, true);

		var queued = pendingPlays;
		pendingPlays = {};
		for (var id in queued) {
			if (queued.hasOwnProperty(id)) queued[id]();
		}
	}

	window.addEventListener("keydown", unlock, true);
	window.addEventListener("pointerdown", unlock, true);
	window.addEventListener("touchend", unlock, true);

	function start(el) {
		el.muted = muted;
		try {
			el.currentTime = 0;
		} catch (e) {}
		var p = el.play();
		if (p && p["catch"]) {
			p["catch"](function() {
				// Autoplay was blocked after all - wait for a real gesture.
				unlocked = false;
			});
		}
	}

	function Sound(options) {
		this.id = options.id;
		this.multishot = !!options.multishot;

		var el = new Audio(options.url);
		el.preload = "auto";
		el.loop = options.loops > 1;
		el.volume = (options.volume === undefined ? 100 : options.volume) / 100;
		el.muted = muted;
		this.el = el;
		this.pool = [el];

		if (options.onload) {
			var onload = options.onload;
			var self = this;
			el.addEventListener("canplaythrough", function fire() {
				el.removeEventListener("canplaythrough", fire);
				onload.call(self);
			});
		}
		if (options.onfinish && !el.loop) {
			var onfinish = options.onfinish;
			var self2 = this;
			el.addEventListener("ended", function() {
				onfinish.call(self2);
			});
		}

		sounds.push(this);
	}

	// Overlapping playback (multishot) needs one element per simultaneous
	// voice, so grab a free one from the pool or clone a new one.
	Sound.prototype.free = function() {
		if (!this.multishot) return this.el;
		for (var i = 0; i < this.pool.length; i++) {
			var el = this.pool[i];
			if (el.paused || el.ended) return el;
		}
		var clone = this.el.cloneNode();
		clone.volume = this.el.volume;
		this.pool.push(clone);
		return clone;
	};

	Sound.prototype.play = function() {
		var self = this;
		if (!unlocked) {
			pendingPlays[this.id] = function() { self.play(); };
			return this;
		}
		start(this.free());
		return this;
	};

	Sound.prototype.stop = function() {
		for (var i = 0; i < this.pool.length; i++) this.pool[i].pause();
		return this;
	};

	Sound.prototype.setVolume = function(volume) {
		for (var i = 0; i < this.pool.length; i++) this.pool[i].volume = volume / 100;
		return this;
	};

	function applyMute() {
		for (var i = 0; i < sounds.length; i++) {
			for (var j = 0; j < sounds[i].pool.length; j++) {
				sounds[i].pool[j].muted = muted;
			}
		}
	}

	global.soundManager = {
		enabled: true,

		// Kept so the old setup code can assign to them harmlessly.
		url: "",
		flashVersion: 0,
		useFlashBlock: false,

		createSound: function(options) {
			return new Sound(options);
		},

		mute: function() { muted = true; applyMute(); },
		unmute: function() { muted = false; applyMute(); },

		onready: function(callback) { setTimeout(callback, 0); },
		ontimeout: function() {}
	};

})(window);
