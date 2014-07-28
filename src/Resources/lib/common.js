module.exports = {
	FACEBOOK_APP_ID:'447780868588797',
	FACEBOOK_APP_PERMISSIONS:['email','user_likes','user_groups'],
	times:{
		forever:0,
		minute:60,
		hour:60 * 60,
		day:24 * 60 * 60
	},
	objectIds:{
		users:'users',
		news:'news',
		groups:'groups',
		actions:'actions',
		posts:'posts',
		notifications:'notifications'
	},
	
	// dev
	//everyone_group: '500693fbb685530bea0f5edb',
	
	// production
	everyone_group: '5034dea418897b435a03eb00',
	max_actions:{
		user:50,
		group:9
	},
	max_group_admins:5,
	visible_group_value:100,
	emptyCheckinValue:'!#!none!#!',
	userUniqValue:'!#!user!#!',
	getUserDisplayName : function(_user){
		var _name = '';
		if(_user){
			if (_user.custom_fields && _user.custom_fields.display_name) {
				_name = _user.custom_fields.display_name;	
			}
			else if(_user.username){
				_name = _user.username.split(this.userUniqValue)[0];
			}
		}
		return _name;
	},
	refreshHandler:{
		setRefresh:{
			all: function(value){
				Ti.App.Properties.setBool('carely_users_refresh', value);
				Ti.App.Properties.setBool('carely_news_refresh', value);
				Ti.App.Properties.setBool('carely_groups_refresh', value);
				Ti.App.Properties.setBool('carely_my_actions_refresh', value);
				Ti.App.Properties.setBool('carely_actions_refresh', value);
				Ti.App.Properties.setBool('carely_leaderboard_refresh', value);
			},
			users:function(value){
				Ti.App.Properties.setBool('carely_users_refresh', value);
			},
			news:function(value){
				Ti.App.Properties.setBool('carely_news_refresh', value);
				Ti.App.Properties.setBool('carely_following_refresh', value);
			},
			following:function(value){
				Ti.App.Properties.setBool('carely_following_refresh', value);
			},
			groups:function(value){
				Ti.App.Properties.setBool('carely_groups_refresh', value);
			},
			actions:function(value){
				Ti.App.Properties.setBool('carely_my_actions_refresh', value);
			},
			myActions:function(value){
				Ti.App.Properties.setBool('carely_actions_refresh', value);
			},
			leaderboard:function(value){
				Ti.App.Properties.setBool('carely_leaderboard_refresh', value);
			}
		},
		getRefresh:{
			users:function(){
				return Ti.App.Properties.getBool('carely_users_refresh', false);
			},
			news:function(){
				return Ti.App.Properties.getBool('carely_news_refresh', false);
			},
			following:function(value){
				Ti.App.Properties.getBool('carely_following_refresh', false);
			},
			groups:function(){
				return Ti.App.Properties.getBool('carely_groups_refresh', false);
			},
			actions:function(){
				return Ti.App.Properties.getBool('carely_my_actions_refresh', false);
			},
			myActions:function(){
				return Ti.App.Properties.getBool('carely_actions_refresh', false);
			},
			leaderboard:function(){
				return Ti.App.Properties.getBool('carely_leaderboard_refresh', false);
			}
		}
	},
	ScoreMechanic:{
		action:20,
		checkin:10,
		discussion:10,
		share:2,
		comment:5,
		like:3
	},
	trimWhiteSpaces : function(s) {
		if(s){
			s = s.replace(/(^\s*)|(\s*$)/gi, '');
			s = s.replace(/[ ]{2,}/gi, ' ');
			s = s.replace(/\n /, '\n');
		}
		return s;
	},
	showMessageWindow:function(_msg, _height, _width, _time, _show_indicator, _extra_view){
		var msgWindow = Ti.UI.createWindow({
			modal:false,
			navBarHidden:true,
			touchEnabled:true,
			orientationModes:[Ti.UI.PORTRAIT]
		});
		var view = Ti.UI.createView({
			backgroundColor: '#000',
			top: _height > 0 ? (Ti.Platform.displayCaps.platformHeight - _height + 20) / 2 : 0,
			left:_width > 0 ? (Ti.Platform.displayCaps.platformWidth - _width + 20) / 2 : 0,
			height: _height > 0 ? _height : '100%',
			width: _width > 0 ? _width : '100%',
			opacity: 0.8,
			layout:'vertical',
			borderColor: _height > 0 ? '#000' : undefined,
			borderRadius: _height > 0 ? 10 : undefined
		});
		msgWindow.add(view);
		
		if(_show_indicator){
			if(_height > 0){
				view.height += 49;
			}
			var ind = Ti.UI.createActivityIndicator({
				top: _height > 0 ? 6 : 120,
				left: _width > 0 ? (view.width - 37) / 2 : '42%',
				height:37,
				width:37,
				style : Titanium.UI.iPhone.ActivityIndicatorStyle.BIG
			});
			ind.show();
			view.add(ind);
		}
		var lbl = Ti.UI.createLabel({
			text:_msg,
			top:_show_indicator ? 0 : 10,
			left:10,
			right:10,
			color:'#fff',
			font:{
				fontSize : 20,
				fontFamily : 'Helvetica Neue',
				fontWeight : 'bold',
				fontStyle : 'norma'
			},
			height: _height > 0 ?_height : 'auto',
			width:Ti.UI.FILL,
			textAlign:Ti.UI.TEXT_ALIGNMENT_CENTER
		});
		if(_extra_view && _height > 0){
			lbl.height -= _extra_view.height;
			lbl.height -= 20;
		}
		if(_show_indicator && _height > 0){
			lbl.height -= 20;
		}
		view.add(lbl);
		msgWindow.setMessageText = function(_message){
			lbl.text = _message;
		}
		if(_extra_view){
			view.add(_extra_view);
		}
		msgWindow.show();
		msgWindow.open({animated:false});
		
		if(!_time){
			_time = 5000;
		}
		else if(_time > 0){
			setTimeout(function(){
				msgWindow.hide();
				msgWindow.close({animated:false});
				msgWindow = null;
			}, _time);
		}
		return msgWindow;
	},
	formatGeoLocation:function(location) {
		var formatted_location = '';
		if (location && location.address_components && location.address_components.length) {
			var location_data = {
				total_keys : 0
			};
			for (var i = 0, v = location.address_components.length; i < v; i++) {
				if (location.address_components[i].types && location.address_components[i].types.length) {
					location_data[location.address_components[i].types[0].toLowerCase()] = {
						long_name : location.address_components[i].long_name,
						short_name : location.address_components[i].short_name
					};
					location_data.total_keys++;
				}
			}
			if (location_data.total_keys) {
				var vals = [], to_check = ['establishment', 'neighborhood', 'sublocality', 'locality'];
				for (var i = 0, v = to_check.length; i < v; i++) {
					if (location_data[to_check[i]]) {
						if(vals.indexOf(location_data[to_check[i]].short_name) === -1){
							vals.push(location_data[to_check[i]].short_name);
						}
					}
				}
				if (vals.length) {
					if (vals.length > 1) {
						// two values so were good
						if(vals.length > 2){
							vals.splice(2, 2);
						}
					} else {
						// only one value
						if (location_data.administrative_area_level_3) {
							vals.push(location_data.administrative_area_level_3.long_name);
						} else if (location_data.administrative_area_level_2) {
							vals.push(location_data.administrative_area_level_2.long_name);
						} else if (location_data.administrative_area_level_1) {
							vals.push(location_data.administrative_area_level_1.long_name);
						} else if (location_data.route && (location_data.route.long_name % 1 !== 0)) {
							vals.splice(0, 0, location_data.route.short_name);
						}
					}
					
					formatted_location = vals.join(', ');
				}
			}
		}
		if (formatted_location === '' && location && location.formatted_address) {
			formatted_location = location.formatted_address;
		}
		
		return formatted_location;
	}
};