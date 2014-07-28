function NotificationsWindow(params){
	var theme = require('/ui/theme'),
		ui = require('/ui/components'),
		Model = require('/lib/model/model'),
		NotificationsModel = require('/lib/model/notifications');
		
	var isAndroid = Ti.Platform.osname === 'android';
	var currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
	
	var self = Ti.UI.createWindow({
		title : 'Notifications',
		navBarHidden : false,
		backgroundColor : theme.winBgColor,
		orientationModes : [Ti.UI.PORTRAIT],
		barColor : theme.barColor,
		layout:'vertical'
	});
	
	var main_scrollView = Ti.UI.createScrollView({
		contentWidth: 'auto',
		contentHeight: 'auto',
		top: isAndroid ? 50 : 0,
		showVerticalScrollIndicator: true,
		showHorizontalScrollIndicator: false,
		scrollType: 'vertical',
		layout:'vertical'
	});
	self.add(main_scrollView);
	
	var notification_view = Titanium.UI.createView({
		top:theme.defaultItemSpacing,
		left: 10,
		right:10,
		backgroundColor : theme.tableBackgroundColor,
		height : theme.tableDefaultHeight,
		borderColor : theme.tableBorderColor,
		borderRadius : theme.defaultBorderRadius
	});
	main_scrollView.add(notification_view);
	
	var notification_name = Ti.UI.createLabel({
		text : 'Allow notifications',
		color : theme.textColor,
		top : 10,
		left : 10,
		font : theme.defaultFontBold
	});
	notification_view.add(notification_name);
	
	var notification_bool = Ti.UI.createSwitch({
		right : 10,
		value : Ti.App.Properties.getBool('carely_notifications', false),
		style : isAndroid ? Ti.UI.Android.SWITCH_STYLE_CHECKBOX : null
	});
	notification_bool.addEventListener('change', function(e){
		if(e.value === false){
			main_scrollView.remove(notify_table);
			main_scrollView.remove(notify_table_title);
			main_scrollView.contentHeight = 'auto';
		}
		else{
			main_scrollView.add(notify_table_title);
			main_scrollView.add(notify_table);
			main_scrollView.contentHeight = 'auto';
		}
		
		require('/lib/analytics').trackEvent({
			category : 'notifications',
			action : 'enable',
			label : null,
			value : e.value ? 1 : 0
		});
	});
	notification_view.add(notification_bool);
	
	function createSimpleNotificationRows(_items) {
		var rows = [];
		if(_items && _items.length > 0){
			for(var i=0; i<_items.length; i++){
				var row = Titanium.UI.createTableViewRow({
					selectionStyle:Ti.UI.iPhone.TableViewCellSelectionStyle.NONE,
					backgroundColor:theme.tableBackgroundColor,
					height : theme.tableDefaultHeight,
					clickName: _items[i].clickName,
					className : 'SimpleNotification_Row'
				});
				
				var notification_name = Ti.UI.createLabel({
					text : _items[i].name,
					color : theme.textColor,
					top : 10,
					left : 10,
					font : theme.defaultFontBold
				});
				row.add(notification_name); 
		
				var notification_val = date_val = Ti.UI.createSwitch({
					right : 10,
					value : _items[i].value ? _items[i].value : false,
					style : isAndroid ? Ti.UI.Android.SWITCH_STYLE_CHECKBOX : null
				});
				row.add(notification_val); 
		
				rows.push(row);
			}
		}
		return rows;
	}
	
	var simpleNotificationItems = [
		{name:'Follow me', value:true, clickName:'follow'},
		{name:'Like my post', value:false, clickName:'like'},
		{name:'Comment on my post', value:true, clickName:'comment'},
		{name:'Join my activity', value:true, clickName:'join'}
	];
	
	if(currentUser && currentUser.custom_fields && currentUser.custom_fields.notification_settings){
		if(currentUser.custom_fields.notification_settings.follow !== undefined){
			simpleNotificationItems[0].value = currentUser.custom_fields.notification_settings.follow;
		}
		if(currentUser.custom_fields.notification_settings.like !== undefined){
			simpleNotificationItems[1].value = currentUser.custom_fields.notification_settings.like;
		}
		if(currentUser.custom_fields.notification_settings.comment !== undefined){
			simpleNotificationItems[2].value = currentUser.custom_fields.notification_settings.comment;
		}
		if(currentUser.custom_fields.notification_settings.join !== undefined){
			simpleNotificationItems[3].value = currentUser.custom_fields.notification_settings.join;
		}
	}
	
	var notify_table_title = Ti.UI.createLabel({
		text: 'Notify me when others:',
		color: theme.textColor,
		top: theme.defaultItemSpacing,
		left: 13,
		font: theme.defaultFontBold
	});
	if(notification_bool.value === true){
		main_scrollView.add(notify_table_title);
	}
	
	var notify_table = Ti.UI.createTableView({
		data : createSimpleNotificationRows(simpleNotificationItems),
		top : 10,
		left : 10,
		right : 10,
		scrollable: false,
		borderColor: theme.tableBorderColor,
		borderRadius: theme.defaultBorderRadius,
		backgroundColor : theme.tableBackgroundColor,
		height: simpleNotificationItems.length * theme.tableDefaultHeight
	});
	if(notification_bool.value === true){
		main_scrollView.add(notify_table);
	}
	
	self.addEventListener('open', function(e){
		require('/lib/analytics').trackScreen({ screenName : self.title });
	});
	
	self.addEventListener('close', function(changeEvent) {
		if(notification_bool.value === false){
			if (Ti.Network.remoteDeviceUUID !== null) {
				NotificationsModel.unregister(function(e) {
					if(e.success){
						Ti.App.Properties.setBool('carely_notifications', false);
					}
				});
			}
		}
		else{
			currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
			if (currentUser && currentUser.id) {
				var _notification_settings = {
					like:false,
					comment:true,
					join:true,
					follow:true
				};
				var notifications_tags = [];
				if (notify_table && notify_table.data && notify_table.data[0] && 
					notify_table.data[0].rows && notify_table.data[0].rows.length) {
					for (var i = 0; i < notify_table.data[0].rows.length; i++) {
						_notification_settings[notify_table.data[0].rows[i].clickName] = notify_table.data[0].rows[i].children[1].value;
						if (notify_table.data[0].rows[i].children[1].value) {
							notifications_tags.push(currentUser.id + '_' + notify_table.data[0].rows[i].clickName);
						}
					}
				}
			
				NotificationsModel.registerForPushNotifications(currentUser.id, notifications_tags, function(e) {
					if (e.success) {
						Ti.App.Properties.setBool('carely_notifications', true);
					}
				}); 

				// if (Ti.Network.remoteDeviceUUID === null) {
					// NotificationsModel.registerForPushNotifications(currentUser.id, notifications_tags, function(e) {
						// alert(JSON.stringify({
							// method:'registerForPushNotifications',
							// alias:currentUser.id,
							// tags:notifications_tags,
							// data:e
						// }));
						// if (e.success) {
							// Ti.App.Properties.setBool('carely_notifications', true);
						// }
					// });
				// } else {
					// NotificationsModel.register(currentUser.id, notifications_tags, function(e) {
						// alert(JSON.stringify({
							// method:'register',
							// alias:currentUser.id,
							// tags:notifications_tags,
							// data:e
						// }));
						// if (e.success) {
							// Ti.App.Properties.setBool('carely_notifications', true);
						// }
					// });
				// }
				
				var UsersModel = require('/lib/model/users');
				UsersModel.update({
					notification_settings : _notification_settings
				}, function(updateEvent) {
					if (updateEvent.success) {
						currentUser = updateEvent.users[0];
						Ti.App.Properties.setString('carely_user', JSON.stringify(updateEvent.users[0]));
		
						Model.AppCache.users.set(updateEvent.users[0]);
					} else {
						Model.eventDefaultErrorCallback(updateEvent);
					}
				});
			}
		}
	});
	
	return self;
}

module.exports = NotificationsWindow;


// 
// function NotificationsWindow(params){
	// var theme = require('/ui/theme'),
		// ui = require('/ui/components'),
		// Model = require('/lib/model/model'),
		// NotificationsModel = require('/lib/model/notifications');
// 		
	// var isAndroid = Ti.Platform.osname === 'android';
	// var currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
// 	
	// var self = Ti.UI.createWindow({
		// title : 'Notifications',
		// navBarHidden : false,
		// backgroundColor : theme.winBgColor,
		// orientationModes : [Ti.UI.PORTRAIT],
		// barColor : theme.barColor,
		// layout:'vertical'
	// });
// 	
	// var main_scrollView = Ti.UI.createScrollView({
		// contentWidth: 'auto',
		// contentHeight: 'auto',
		// top: isAndroid ? 50 : 0,
		// showVerticalScrollIndicator: true,
		// showHorizontalScrollIndicator: false,
		// scrollType: 'vertical',
		// layout:'vertical'
	// });
	// self.add(main_scrollView);
// 	
	// var token_btn = Ti.UI.createButton({
		// title : 'Send using token',
		// font : {
			// fontSize : 20,
			// fontFamily : theme.fontFamily,
			// fontWeight : 'bold'
		// },
		// width : 300,
		// height : 40,
		// top : 10,
		// left : 10,
		// color : theme.whiteFontColor,
		// selectedColor : theme.lightFontColor,
		// backgroundImage : theme.buttonImage.red.normal,
		// backgroundSelectedImage : theme.buttonImage.red.selected,
		// style : isAndroid ? null : Ti.UI.iPhone.SystemButtonStyle.PLAIN,
		// enabled : false
	// }); 
	// token_btn.addEventListener('click', function(e){
		// var _device_tokens = [Ti.Network.remoteDeviceUUID],
			// alert = 'This is a device token message !!!';
// 			
		// NotificationsModel.notify(_device_tokens, null, null, null, alert, null, function(notifyEvent) {
			// alert(JSON.stringify(notifyEvent));
		// });	
	// });
	// main_scrollView.add(token_btn);
// 	
	// var tag_btn = Ti.UI.createButton({
		// title : 'Send using tags',
		// font : {
			// fontSize : 20,
			// fontFamily : theme.fontFamily,
			// fontWeight : 'bold'
		// },
		// width : 300,
		// height : 40,
		// top : 10,
		// left : 10,
		// color : theme.whiteFontColor,
		// selectedColor : theme.lightFontColor,
		// backgroundImage : theme.buttonImage.red.normal,
		// backgroundSelectedImage : theme.buttonImage.red.selected,
		// style : isAndroid ? null : Ti.UI.iPhone.SystemButtonStyle.PLAIN,
		// enabled : false
	// }); 
	// tag_btn.addEventListener('click', function(e){
		// var _tags = [currentUser.id + '_comment'],
			// alert = 'This is a tags message !!!';
// 			
		// NotificationsModel.notify(null, null, _tags, null, alert, null, function(notifyEvent) {
			// alert(JSON.stringify(notifyEvent));
		// });	
	// });
	// main_scrollView.add(tag_btn);
// 	
	// var notifications_tags = [currentUser.id + '_comment', currentUser.id + '_join', currentUser.id + '_like'];
	// NotificationsModel.registerForPushNotifications(currentUser.id, notifications_tags, function(e) {
		// alert(JSON.stringify({
			// method : 'registerForPushNotifications',
			// alias : currentUser.id,
			// tags : notifications_tags,
			// data : e
		// }));
		// if (e.success) {
			// Ti.App.Properties.setBool('carely_notifications', true);
			// token_btn.enabled = true;
			// tag_btn.enabled = true;
		// }
	// }); 
// 
	// return self;
// }
// 
// module.exports = NotificationsWindow;