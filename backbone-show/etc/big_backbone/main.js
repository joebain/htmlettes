var BigModel = Backbone.Model.extend({
	initialize: function() {
	}
});

var BigCollection = Backbone.Collection.extend({
	model: BigModel,

	sync: function(method, models, callbacks) {
		if (method === "read") {
			var arr = [];
			for (var i = 0 ; i < 100 ; i++) {
				arr[i] = {};
				for (var j = 0 ; j < 20 ; j++) {
					arr[i][j] = Math.random()+"";
				}
			}
			callbacks.success(arr);
		} else {
			Backbone.Collection.prototype.sync.apply(this, arguments);
		}
	}
});

var BigView = Backbone.View.extend({
	tagName: "div",
	className: "big-view",

	initialize: function(attrs) {
		this.render();
	},

	render: function() {
		this.el.innerHTML = "";
		for (var a in this.model.attributes) {
			var d = document.createElement("div");
			d.innerHTML = a + ": " + this.model.attributes[a];
			this.el.appendChild(d);
		}
	}
});

var BigListView = Backbone.View.extend({
	el: "#big-list",

	initialize: function(attrs) {
		this.collection.on("reset", this.render, this);
		this.collection.on("add", this.add, this);
		this.render();
	},

	render: function() {
		var that = this;
		this.el.innerHTML = "";
		this.collection.each(function(item) {
			var view = new BigView({model:item});
			that.el.appendChild(view.el);
		});
	},

	add: function(model) {
		var view = new BigView({model:model});
		this.el.appendChild(view.el);
	}
});

$(function() {
	var collection = new BigCollection();
	var bigListView = new BigListView({collection: collection});
	setInterval(function() {
		collection.fetch();
	}, 1000);
});

