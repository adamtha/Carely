function LocationWindow(_longitude, _latitude, _location, _output_value) {
	var theme = require('/ui/theme'),
		common = require('/lib/common');
	
	var self = Ti.UI.createWindow({
		title : 'Add location',
		navBarHidden : false,
		barColor : theme.barColor,
		backgroundColor : theme.winBgColor,
		orientationModes : [Ti.UI.PORTRAIT],
		layout : 'vertical'
	});

	var geo_row = Ti.UI.createTableViewRow({
		selectionStyle : Ti.UI.iPhone.TableViewCellSelectionStyle.NONE,
		hasChild : false,
		height : theme.tableDefaultHeight,
		width : 'auto',
		className : 'LocationWindow_Row'
	});

	var geo_name = Ti.UI.createLabel({
		text : 'Share location',
		color : theme.textColor,
		top : 10,
		left : 10,
		width : '64%',
		font : theme.defaultFontBold,
		textAlign : Ti.UI.TEXT_ALIGNMENT_LEFT
	});
	geo_row.add(geo_name);

	var geo_value = Ti.UI.createSwitch({
		right : 10,
		value : true
	});
	geo_value.addEventListener('change', function(e) {
		if(e.value){
			tableView.appendRow(near_row, {animated:true, animationStyle:Ti.UI.iPhone.RowAnimationStyle.BOTTOM});
			tableView.height = 2 * theme.tableDefaultHeight;
			
			self.add(map_lbl);
			self.add(map_view);
		}
		else{
			self.remove(map_view);
			self.remove(map_lbl);
			
			tableView.deleteRow(1, {animated:true, animationStyle:Ti.UI.iPhone.RowAnimationStyle.FADE});
			tableView.height = theme.tableDefaultHeight;
		}
		
		require('/lib/analytics').trackEvent({
			category : 'geo',
			action :'enable',
			label : 'change',
			value : e.value ? 1 : 0
		});
	}); 
 	geo_row.add(geo_value);
	
	var near_row = Titanium.UI.createTableViewRow({
		hasChild : false,
		height : theme.tableDefaultHeight,
		width : 'auto',
		selectionStyle:Ti.UI.iPhone.TableViewCellSelectionStyle.NONE,
		className : 'LocationWindow_Row'
	});

	var near_name = Ti.UI.createLabel({
		text : 'At',
		color : theme.textColor,
		top : 10,
		left : 10,
		font : theme.defaultFontBold,
		width : '30%'
	});
	near_row.add(near_name);

	var near_value = Ti.UI.createTextField({
		value : _location.formatted_address,
		originalValue:_location.formatted_address,
		color : theme.tableSelectedValueColor,
		top : 10,
		right : 10,
		font : theme.defaultFont,
		textAlign : Ti.UI.TEXT_ALIGNMENT_RIGHT,
		appearance : Ti.UI.KEYBOARD_APPEARANCE_ALERT,
		returnKeyType : Ti.UI.RETURNKEY_DONE,
		clearButtonMode:Ti.UI.INPUT_BUTTONMODE_ONFOCUS,
		autocorrect:false,
		borderColor : '#fff',
		backgroundColor : '#fff',
		backgroundSelectedColor : '#fff',
		userText : false,
		touchEnabled : true,
		width : '70%'
	});
	near_value.addEventListener('blur', function(e) {
		if(near_value.value === ''){
			near_value.value = near_value.originalValue;
		}
	});
	near_row.add(near_value);
		
	var tableView = Ti.UI.createTableView({
		data : [geo_row],
		top : 10,
		left : 10,
		right : 10,
		borderColor: theme.tableBorderColor,
		borderRadius: theme.defaultBorderRadius,
		backgroundColor : theme.tableBackgroundColor,
		height: theme.tableDefaultHeight,
		scrollable:false
	});
	self.add(tableView);
	
	var map_lbl = Ti.UI.createLabel({
		text:'Long press to change location',
		top:10,
		left:10,
		width:Ti.UI.FILL,
		font : theme.defaultFont,
		color : theme.textColor,
		textAlign:Ti.UI.TEXT_ALIGNMENT_LEFT
	});
	
	var map_view = Ti.Map.createView({
		top : 0,
		bottom : 10,
		left : 10,
		right : 10,
		width : Ti.UI.FILL,
		mapType : Ti.Map.STANDARD_TYPE,
		animate : true,
		userLocation : true,
		touchEnabled : true
	}); 
	var curr_button = Ti.UI.createImageView({
		image:theme.images.currentLocation,
		bottom:3,
		left:3,
		height:23,
		width:123,
		zIndex:10
	});
	curr_button.addEventListener('singletap', function(e){
		if(e){
			e.cancelBubble = true;
		}
		Ti.Geolocation.getCurrentPosition(function(geoEvent) {
			map_view.removeAllAnnotations();
			if (geoEvent.success && geoEvent.coords.longitude && geoEvent.coords.latitude) {
				map_view.regionFit = true;
				map_view.region = {
					longitude : geoEvent.coords.longitude,
					latitude : geoEvent.coords.latitude,
					latitudeDelta : 0.01,
					longitudeDelta : 0.01
				};
				fetchLocation(geoEvent.coords);
			}
		});
		
		require('/lib/analytics').trackEvent({
			category : 'geo',
			action :'map',
			label : 'current',
			value : null
		});
	});
	map_view.add(curr_button);
	
	function createAnon(anon_longitude, anon_latitude, anon_location){
		
		selected_data = {
			coordinates : [anon_longitude, anon_latitude],
			location : anon_location
		}
		
		near_value.value = common.formatGeoLocation(anon_location); 
		near_value.originalValue = near_value.value;
						
		var anon = Ti.Map.createAnnotation({
			longitude : anon_longitude,
			latitude : anon_latitude,
			title : near_value.value,
			pincolor : Ti.Map.ANNOTATION_RED,
			leftView : Ti.UI.createImageView({
				width : 20,
				height : 20,
				image : theme.images.locationMap,
				hires : true
			}),
			rightButton : Ti.UI.iPhone.SystemButton.DISCLOSURE,
			animate : true,
			location_data : anon_location
		});

		map_view.addAnnotation(anon);
		map_view.selectAnnotation(anon);
	}
	var xhr = Ti.Network.createHTTPClient({
		onload : function(loadEvent) {
			if (this.responseText) {
				var json = JSON.parse(this.responseText);
				if (json && json.results && json.results.length) {
					
					createAnon(xhr.coordinates_to_check.longitude, xhr.coordinates_to_check.latitude, json.results[0]);
				}
			}
		},
		onerror : function(errEvent) {
		}
	}); 
	function fetchLocation(coords){
		xhr.coordinates_to_check = {latitude:coords.latitude, longitude:coords.longitude};
		xhr.open('GET', 'http://maps.google.com/maps/api/geocode/json?sensor=true&language=en&latlng=' + coords.latitude + ',' + coords.longitude);
		xhr.send();
	}
	map_view.addEventListener('regionchanged', function(e) {
		if(e){
			e.cancelBubble = true;
		}
		map_view.actualRegion = e;
		
		require('/lib/analytics').trackEvent({
			category : 'geo',
			action :'map',
			label : 'change region',
			value : null
		});
	});
	map_view.addEventListener('click', function(e) {
		if(e){
			e.cancelBubble = true;
		}
		if(e && e.clicksource){
			if(e.clicksource === 'pin' && e.annotation && e.annotation.title && e.annotation.longitude && e.annotation.latitude && e.annotation.location_data){
				near_value.value = e.annotation.title;
				near_value.originalValue = e.annotation.title;
				
				selected_data = {
					coordinates : [e.annotation.longitude, e.annotation.latitude],
					location : e.annotation.location_data
				}
			}

			if(e.clicksource && e.clicksource === 'rightButton'){
				var w = Ti.UI.createWindow({
					title : (e.annotation && e.annotation.title) ? e.annotation.title : 'Details',
					barColor:theme.barColor,
					navBarHidden : false,
					backgroundColor: '#000',
					orientationModes : [Ti.UI.PORTRAIT],
					translucent:true
				});
				var img_url = 'http://maps.googleapis.com/maps/api/staticmap?maptype=satellite&sensor=true&scale=2&visual_refresh=true&zoom=16&center=' + e.annotation.latitude + ',' + e.annotation.longitude + '&markers=color:blue|' + e.annotation.latitude + ',' + e.annotation.longitude + '&size=' + Ti.Platform.displayCaps.platformWidth + 'x' + Ti.Platform.displayCaps.platformHeight;
				var img = Ti.UI.createImageView({
					image : img_url,
					height : 'auto',
					hires : true
				});
				w.add(img);
				
				require('/ui/MasterWindow').getNavGroup().open(w);
			}
		}
		
		require('/lib/analytics').trackEvent({
			category : 'geo',
			action :'map',
			label : 'select annotation',
			value : (e && e.clicksource) ? 1 : 0
		});
	});
	map_view.addEventListener('longpress', function(e) {
		if(e){
			e.cancelBubble = true;
		}
		if (geo_value.value === false) {
			return;
		}
			
		if(e.y && e.x){
			var mapRegion = map_view.actualRegion || map_view.region, mapWidth = map_view.rect.width, mapHeight = map_view.rect.height;
	
			var coords = {
				latitude : (e.y - mapHeight / 2) * (-mapRegion.latitudeDelta / mapHeight) + mapRegion.latitude,
				longitude : (e.x - mapWidth / 2) * (mapRegion.longitudeDelta / mapWidth) + mapRegion.longitude
			}
			
			fetchLocation(coords);
		}
		
		require('/lib/analytics').trackEvent({
			category : 'geo',
			action :'map',
			label : 'add annotation',
			value : (e.y && e.x) ? 1 : 0
		});
	}); 

	var _message = null, geoEnabled = false;
	if (Ti.Geolocation.locationServicesEnabled) {
		var authorization = Ti.Geolocation.locationServicesAuthorization;
		if (authorization === Ti.Geolocation.AUTHORIZATION_DENIED || authorization === Ti.Geolocation.AUTHORIZATION_RESTRICTED) {
			_message = Ti.App.name + ' needs permission to access your current location';
		}
		else{
			geoEnabled = true;
		}
		// if (authorization === Ti.Geolocation.AUTHORIZATION_DENIED) {
			// _message = 'You have disabled ' + Ti.App.name + ' from running location services.\n Please activate it for better experiance with Carely.';
		// } else if (authorization === Ti.Geolocation.AUTHORIZATION_RESTRICTED) {
			// _message = 'Your system has disabled ' + Ti.App.name + ' from running location services.\n Please activate it for better experiance with Carely.';
		// }
	} else {
		//_message = 'Your device has location services turned off.\n Please turn it on for better experiance with ' + Ti.App.name + '.';
	}
	if (geoEnabled === false) {
		
		geo_value.value = false;
		geo_value.enabled = false;
		
		common.showMessageWindow(_message, 200, 200, 3000);
	} else {
		Ti.App.Properties.setBool('CarelyGeoEnabled', true);
		
		tableView.appendRow(near_row, {animated:true, animationStyle:Ti.UI.iPhone.RowAnimationStyle.BOTTOM});
		tableView.height = 2 * theme.tableDefaultHeight;
		
		self.add(map_lbl);
		self.add(map_view);
	}
	
	require('/lib/analytics').trackEvent({
		category : 'geo',
		action :'enabled',
		label : _message,
		value : geoEnabled ? 1 : 0
	});
				
	self.addEventListener('open', function(e){
		require('/lib/analytics').trackScreen({ screenName : self.title });
		
		if(geo_value.value){
			if(_latitude && _longitude && _location){
				
				near_value.value = common.formatGeoLocation(_location);
				near_value.originalValue = near_value.value;
				
				map_view.regionFit = true;
				map_view.region = {
					longitude : _longitude,
					latitude : _latitude,
					latitudeDelta : 0.01,
					longitudeDelta : 0.01
				}

				createAnon(_longitude, _latitude, _location);
			}
			else{
				Ti.Geolocation.getCurrentPosition(function(geoEvent) {
					if (geoEvent.success && geoEvent.coords.longitude && geoEvent.coords.latitude) {
		
						map_view.regionFit = true;
						map_view.region = {
							longitude : geoEvent.coords.longitude,
							latitude : geoEvent.coords.latitude,
							latitudeDelta : 0.01,
							longitudeDelta : 0.01
						}
						
						fetchLocation(geoEvent.coords);
					}
				});
			}
		}
	});
	
	var selected_data = null;
	self.addEventListener('close', function(e){
		if(geo_value.value){
			if(_output_value && selected_data && selected_data.coordinates && selected_data.location){
				_output_value.post_location = selected_data.location;
				_output_value.coordinates = selected_data.coordinates;
				_output_value.text = near_value.value;
				_output_value.userText = (near_value.value !== near_value.originalValue);
			}
		}
		else{
			_output_value.post_location = null;
			_output_value.coordinates = null;
			_output_value.text = 'Select';
			_output_value.userText = false;
		}
		
		require('/lib/analytics').trackEvent({
			category : 'geo',
			action :'update',
			label : _output_value.text,
			value : geo_value.value ? 1 : 0
		});
	});
	
	return self;
}

module.exports = LocationWindow;