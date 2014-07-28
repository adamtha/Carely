Ti.include('/lib/model/cache.js');
Ti.include('/lib/appEvents.js');
Ti.include('/lib/appRater.js');
	
(function() {
	Ti.UI.backgroundImage = 'images/default_image.png';
	
	// var ui_issues = [
	// Ti.UI.iPhone.createNavigationGroup,
	// Ti.App.iOS.registerBackgroundService
	// ];
	
	//Ti.App.CarelyCache.drop();
	//Ti.App.Properties.setBool('carely_welcome', false);
	//Ti.App.Properties.setInt('carely_action_tooltip', 0);
	//Ti.App.Properties.setBool('carely_showNewsOverlay', true);
	//Ti.App.Properties.setBool('carely_showActionsOverlay', true);
	//Ti.App.Properties.setString('carely_user', null);
	
	Ti.Geolocation.purpose = Ti.App.name + ' location services';
	Ti.Geolocation.accuracy = Ti.Geolocation.ACCURACY_BEST;
	Ti.Geolocation.activityType = Ti.Geolocation.ACTIVITYTYPE_OTHER;
    Ti.Geolocation.distanceFilter = 5;
	Ti.Geolocation.headingFilter = 1;
		
	Rater.init(Ti.App.name,'555614041');
 	
	var app = require('/ui/bootstrap');
	app.launch();
 })();