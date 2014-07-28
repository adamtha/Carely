
var GA = require('analytics.google'),
	Model = require('/lib/model/model');

//GA.optOut = true;
GA.debug = Model.debug;
GA.trackUncaughtExceptions = true;

var tracker = GA.getTracker('UA-36834121-2');

module.exports = {
	trackEvent : function(e){
		// measure events
		// fields:
		// category - interaction group name
		// action - interaction type name
		// label (optional) - additional interaction data
		// value (optional) - additional interaction numerical data
		
		if(tracker && e && e.category && e.category.length &&
		   e.action && e.action.length){
			tracker.trackEvent({
				category : e.category,
				action : e.action,
				label : e.label,
				value : e.value
			});
		}
	},
	trackScreen : function(e){		
		// measure screen views
		// fields:
		// screenName - the screen view name
		
		if(tracker && e && e.screenName && e.screenName.length){
			tracker.trackScreen(e.screenName);
		}
	},
	trackSocial : function(e){
		// measure social interactions
		// fields:
		// network – represents the social network with which the user is interacting (e.g. Google+, Facebook, Twitter, etc.).
		// action – represents the social action taken (e.g. Like, Share, +1, etc.).
		// target (optional) – represents the content on which the social action is being taken (i.e. a specific article or video).
				
		if(tracker && e && e.network && e.network.length &&
		   e.action && e.action.length){
			tracker.trackSocial({
				network : e.network,
				action : e.action,
				target : e.target
			});
		}
	}
}