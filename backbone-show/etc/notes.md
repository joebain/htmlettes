### Bakcbone.js - Handling Large Collections

Problems:

 * Memory - object duplication, event listeners?
 * Speed - time to load & parse
 * Consistency - unified removal, modification, propgation to the server without feedback loops

Topics:
 
 * Introduction and justification
   - My background
     + C#, Java, TCL, Objective-C
	 + video games and rich UIs
	 + OMG Life for 3 years, now freelance
   - Autographer story
     + show and talk about camera
     + 22,000 lines JS
	 + 2 years development
	 + c++ server, sqlite, mongoose, firefox / safari
	 + backbone architecture
	   - 0.9.1 with heavy modifications
	   - backbone team say something like: "should be able to read and modify"
	   - global event system
	     + events request and inform about process
		 + models reflect state (uistate, photocollection)
		 + controllers are used to handle events, backbone dosen't have them, but it's 20 lines
		   - essentially just Backbone.Controller = Backbone.Events.extend();
 * ProxyCollection
   - unique objects for modification, no memory duplication
   - complexity though, this was a source of bugs
     + delete from proxy means delete from master?
	   - photo.destroy removes from all
	   - photos are also responsible for comunication to server on delete, not collection
	   - collection.reset / .remove means remove from collection
     + potential memory problems with an ever-growing collection
	 + conflicts of intention - e.g. load a new collection, calls reset, objects are removed and /delete is sent to server (this happened with the ProxyTagCollection)
 * bring database optimisation into the frontend
   - avoid joins
   - minimal objects
   - plenty of deffered actions (e.g. PhotoLoader)
 * memory recovery techniques
   - object pooling? dom pooling / resue? making sure event handlers are removed - backbone.destroy or something?
     + these are tricky to get right and not have bugs
	 + performance improvements are hard to gauge
   - is this necessary?
     + firefox memory limits demo
	 + js is not designed for memory management, trying to do it will get you in a tangle
 * speed
   - DOM dominates (??pun)
     + show benchmarks
   - React agree
   - Get a more efficient dom creation system or templates (e.g. jQuery vs CREL)
   - don't clear and render every time, react has the right model
   - avoid repaints, reflows - dom access, picture resizing (?really, we dod ok)
 * Other problems (not backbone)
   - developer tools frequently grind
     + clear console and network tabs frequently
   - test data sets are mesaured in GB and hard to easily pass around and test with
     + use data generators
	 + think about testing from the beginning and take it seriously
 * Problems I didn't have
   - Page load times
   - Cross browser problems, running on phones for example
     + this sort of app would be harder on the web due to the number of images
   - Backbone complexity / un-modifiability
 * Lessons / do it over
   - node-webkit looks like a better solution than ff / webview
   - think about rendering early - react / templates / polymer
   - write more tests, write more benchmarks
     + benchmarks were critical in the end for mesuaring performance, it can be hard to effectively measure this by eye
	 + tests would have been extremely helpful when we came to refactor for performance
   - backbone is still a good choice, especially for non-standard projects like ours where many web libraries are too tied to a traditional use case
     + even though we did find some redundant stuff
	   - sync() is overrided more times than not
	   - never used Backbone.Routes - had to create Backbone.Controller to suit our single-page model




### Images needed

 * Model-View-Controller cycle diagram
 * Object pooling - android listview style
 * Proxy Collection -> Collection diagram

 * autographer calendar view
 * autographer stream view with tag and favourite tags
 * autographer stream view showing rows
