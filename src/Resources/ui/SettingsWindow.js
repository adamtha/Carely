
function SettingsWindow() {
	var theme = require('/ui/theme'), 
		ui = require('/ui/components'),
		common = require('/lib/common'),
		Model = require('/lib/model/model'),
		facebookModule = require('facebook');

	facebookModule.appid = common.FACEBOOK_APP_ID;
	facebookModule.permissions = common.FACEBOOK_APP_PERMISSIONS;
	facebookModule.forceDialogAuth = false;
	
	var isAndroid = Ti.Platform.osname === 'android';
	
	var self = new ui.Window({
		title:L('settings'),
		navBarHidden:isAndroid,
		backgroundColor:theme.winBgColor,
		orientationModes : [Ti.UI.PORTRAIT],
		barColor : theme.barColor,
		tabBarHidden : true
	});
	
	var rowDefaultHeight = theme.borderedImage.user.height + 4;
	
	function createSettingsRow(_item) {
		var row = Ti.UI.createTableViewRow({
			hasChild : _item.hasChild,
			header : _item.header,
			height : rowDefaultHeight,
			width : 'auto',
			className : 'Setting_Row',
			itemJSON : _item
		});
		if(_item.backgroundImage){
			row.backgroundImage = _item.backgroundImage;
			row.selectionStyle = Ti.UI.iPhone.TableViewCellSelectionStyle.NONE;
		}
		else if(_item.backgroundColor){
			row.backgroundColor = _item.backgroundColor;
		}
		else{
			row.backgroundColor = theme.tableBackgroundColor;
		}

		var name = Ti.UI.createLabel({
			text : _item.title,
			color : theme.textColor,
			top : 10,
			left : 10,
			font : theme.defaultFontBold,
			width:Ti.UI.FILL,
			textAlign : Ti.UI.TEXT_ALIGNMENT_LEFT
		});
		if(_item.color){
			name.color = _item.color;
		}
		if(_item.textAlign){
			name.textAlign = _item.textAlign;
		}
		
		if(_item.value){
			name.width = 'auto';
			name.textAlign = Ti.UI.TEXT_ALIGNMENT_LEFT;
			
			row.add(name);
			
			var value = Ti.UI.createLabel({
				text : _item.value,
				color : theme.tableSelectedValueColor,
				top : 10,
				right : 10,
				font : theme.defaultFont,
				width:'auto',
				textAlign : Ti.UI.TEXT_ALIGNMENT_RIGHT
			});
			row.add(value);
		}
		else if(_item.valueSwitch){
			name.width = 'auto';
			name.textAlign = Ti.UI.TEXT_ALIGNMENT_LEFT;
			
			row.add(name);
			
			var switchVal = Ti.UI.createSwitch({
				right : 10,
				value : _item.valueSwitch.value
			});
			if(_item.valueSwitch.callback){
				switchVal.addEventListener('change', _item.valueSwitch.callback);
			}
			row.add(switchVal);
		}
		else{
			row.add(name);
		}

		return row;
	}
	
	var currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null)),
		_admin_options = true, _default_admin_options = true;
	
	var showAdminOptionsCallback = function(e){
		_admin_options = e.value;
		currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
		if(currentUser && currentUser.custom_fields){
			currentUser.custom_fields.show_admin_features = _admin_options;
			Ti.App.Properties.setString('carely_user', JSON.stringify(currentUser));
		}
	}
	
	if(currentUser.admin === 'true'){
		if(currentUser && currentUser.custom_fields && currentUser.custom_fields.show_admin_features === false){
			_admin_options = false;
			_default_admin_options = false;
		}
	}
	
	function getFacebookRow() {
		var fbData = {
			title : 'Facebook',
			value : 'Not connected',
			connected : false,
			hasChild : true
		};
		currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
		if (currentUser.external_accounts) {
			var facebookFound = false;
			for (var i = 0, v = currentUser.external_accounts.length; i < v && !facebookFound; i++) {
				if (currentUser.external_accounts[i].external_id && currentUser.external_accounts[i].external_type === 'facebook') {
					fbData.value = 'Connected';
					fbData.connected = true;
					fbData.externalData = {
						accountId : currentUser.external_accounts[i].external_id,
						accountType : currentUser.external_accounts[i].external_type
					};
					facebookFound = true;
				}
			}
		}

		return createSettingsRow(fbData);
	}
	
	var _share_location = true, _share_location_original = true;
	if(currentUser && currentUser.custom_fields && currentUser.custom_fields.share_location === false){
		_share_location = false;
		_share_location_original = false;
	}
	var shareLocationCallback = function(e){
		_share_location = e.value;
		currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
		if(currentUser && currentUser.custom_fields){
			currentUser.custom_fields.share_location = _share_location;
			Ti.App.Properties.setString('carely_user', JSON.stringify(currentUser));
			common.refreshHandler.setRefresh.news(true);
		}
	}
	
	function handleFacebook(_data){
		if(_data.connected && facebookModule.loggedIn){
			var FacebookSettingsWindow = require('/ui/FacebookSettingsWindow');
			var win = new FacebookSettingsWindow(_data);
			require('/ui/MasterWindow').getNavGroup().open(win);
		}
		else{
			var facebookListener = function(e) {
				if(e){
					e.cancelBubble = true;
				}
				try {
					if (e.success) {
						if(e.data && e.data.email && e.data.email.length > 0){
							Ti.App.Properties.setString('carely_user_facebook', JSON.stringify(e.data));
							
							var socialModel = require('/lib/model/social'), 
								actIndicator = require('/ui/ActivityIndicator');
							var indicator = new actIndicator();
							indicator.showModal('Connecting account...', 60000, 'Timeout connecting account!');
							socialModel.linkAccount(facebookModule.uid, 'facebook', facebookModule.accessToken, function(linkEvent) {
								indicator.hideModal();
								if (linkEvent.success) {
									var _user = linkEvent.users[0];
	
									Ti.App.Properties.setString('carely_user', JSON.stringify(_user));
									Model.AppCache.users.set(_user);
									
									require('/lib/analytics').trackSocial({
										network : 'facebook',
										action : 'link',
										target : self.title
									});
									
									refreshSettings();
								} else {
									Model.eventDefaultErrorCallback(linkEvent);
								}
							});
						}
						else{
							// invalid data returned from facebook
						}
					} else if (e.error) {
						Model.eventDefaultErrorCallback(e);
					}
				} catch(err) {

				} finally {
					facebookModule.removeEventListener('login', facebookListener);
				}
			}
			facebookModule.addEventListener('login', facebookListener);
			
			// if (Ti.Platform.canOpenURL('fb://profile')) {
				// facebookModule.forceDialogAuth = false;
			// } else {
				// facebookModule.forceDialogAuth = true;
			// }
			
			if(facebookModule.loggedIn){
				Ti.App.Properties.setString('carely_user_facebook', null);
				facebookModule.logout();
				
				require('/lib/analytics').trackSocial({
					network : 'facebook',
					action : 'logout',
					target : self.title
				}); 

			}
			facebookModule.forceDialogAuth = false;
			facebookModule.authorize();
		}
	}
	
	function createLoginButton(){
		var loggedIn = Ti.App.Properties.getString('carely_user', null);
		
		var row = Ti.UI.createTableViewRow({
			hasChild : false,
			header : '',
			height : rowDefaultHeight,
			width : 'auto',
			className : 'Setting_Row',
			selectionStyle:Ti.UI.iPhone.TableViewCellSelectionStyle.NONE,
			itemJSON:{
				title:loggedIn ? 'Logout' : 'Login'
			}
		});
		
		var btn = Ti.UI.createButton({
			height:Ti.UI.FILL,
			width:Ti.UI.FILL,
			title:loggedIn ? 'Logout' : 'Login',
			color:theme.whiteFontColor,
			textAlign:Ti.UI.TEXT_ALIGNMENT_CENTER,
			font:theme.defaultButtonFont,
			backgroundImage:loggedIn ? theme.buttonImage.red.normal : theme.buttonImage.green.normal,
			backgroundSelectedImage:loggedIn ? theme.buttonImage.red.selected : theme.buttonImage.green.selected
		});
		row.add(btn);
		
		return row;
	}

		
	var footerView = Ti.UI.createView({
		height : 30,
		width : Ti.UI.FILL
	});
	var footerTitle = Ti.UI.createLabel({
		top:5,
		height : Ti.UI.FILL,
		width : Ti.UI.FILL,
		color : theme.textColor,
		text : Ti.App.name + ' v' + Ti.App.version,
		textAlign : Ti.UI.TEXT_ALIGNMENT_CENTER,
		font : theme.defaultFontBold
	});
	footerView.add(footerTitle);
	
	var settings_table = Ti.UI.createTableView({
		data : createSettingsRows(),
		style : Ti.UI.iPhone.TableViewStyle.GROUPED,
		backgroundColor:theme.winBgColor,
		footerView : footerView,
		scrollsToTop:true,
		bubbleParent:false
	}); 
	self.add(settings_table);
	
	settings_table.addEventListener('singletap', function(e){
		if(e){
			e.cancelBubble = true;
		}
		
		if(e && e.row && e.row.itemJSON && e.row.itemJSON.title){
			switch(e.row.itemJSON.title){
				// Admin section
				case 'All Users':
					var UsersWindow = require('/ui/UsersWindow');
					var win = new UsersWindow({
						title:'All Users',
						all_users:true
					});
					require('/ui/MasterWindow').getNavGroup().open(win);
					break;
				
				// Account section
				case 'Edit Profile':			
					var ProfileWindow = require('/ui/ProfileWindow');
					var win = new ProfileWindow();
					require('/ui/MasterWindow').getNavGroup().open(win);
					break;
				case 'Add Friends':
					var FindFriendsWindow = require('/ui/FindFriendsWindow');
					var findFriendsWindow = new FindFriendsWindow();
					require('/ui/MasterWindow').getNavGroup().open(findFriendsWindow);
					break;
				case 'Facebook':
					handleFacebook(e.row.itemJSON);
					break;
				case 'Notifications':
					var NotificationsWindow = require('/ui/NotificationsWindow');
					var win = new NotificationsWindow();
					require('/ui/MasterWindow').getNavGroup().open(win);
					break;
				case 'Clear Cache':
					var dlg = Ti.UI.createAlertDialog({
						message : 'Are you sure?',
						buttonNames: ['Clear','Cancel'],
						cancel:1
					});
					dlg.addEventListener('click', function(alertEvent){
						if(alertEvent){
							alertEvent.cancelBubble = true;
						}
						
						switch(alertEvent.index){
							case 0:
								Ti.App.CarelyCache.clear();
								common.refreshHandler.setRefresh.all(true);
								try{
									currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
								}catch(err){}
								
								if(isAndroid){
									self.close();
								}
								else{
									require('/ui/MasterWindow').getNavGroup().goToHome(self, true);
								}
								break;
							default:
								break;
						}
					});
					dlg.show();
					break;
				// About carely section
				case 'About':
					var AboutWindow = require('/ui/AboutWindow');
					var aboutWindow = new AboutWindow();
					require('/ui/MasterWindow').getNavGroup().open(aboutWindow);
					break;
				case 'Frequently Asked Questions':
					var urlWebView = require('/lib/urlWebView');
					var urlWin = new urlWebView('http://care.ly/faqs', 'FAQ', null, false);
					require('/ui/MasterWindow').getNavGroup().open(urlWin);
					
					require('/lib/analytics').trackEvent({
						category : 'url',
						action : 'click',
						label : 'http://care.ly/faqs',
						value : null
					});
					break;
				case 'Rate Our App':
					Ti.Platform.openURL('itms-apps://ax.itunes.apple.com/WebObjects/MZStore.woa/wa/viewContentsUserReviews?type=Carely&id=555614041');
					break;
				case 'Send Feedback':
					var FeedbackWindow = require('/ui/FeedbackWindow');
					var win = new FeedbackWindow();
					require('/ui/MasterWindow').getNavGroup().open(win);
					break;
				// Login/Logout section
				case 'Login':
					require('/ui/MasterWindow').getNavGroup().close(self, { animated : false });
					Ti.App.fireEvent('signupwin.open');
					break;
				case 'Logout':
					var dlg = Ti.UI.createAlertDialog({
						message : 'Are you sure?',
						buttonNames: ['Logout','Cancel'],
						cancel:1
					});
					dlg.addEventListener('click', function(alertEvent){
						if(alertEvent){
							alertEvent.cancelBubble = true;
						}
						
						switch(alertEvent.index){
							case 0:
								var Users = require('/lib/model/users'), 
									actIndicator = require('/ui/ActivityIndicator');
				
								var indicator = new actIndicator();
								indicator.showModal('Logging out', 10000, 'Timeout while logging out!');
								Users.logout(function(logoutEvent) {
									indicator.hideModal();
									if(logoutEvent.success) {
										var MasterWindow = require('/ui/MasterWindow'),
											SignupWindow = require('/ui/SignupWindow');
											
										currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
										
										Ti.App.CarelyCache.clear();
										common.refreshHandler.setRefresh.all(true);
																				
										Ti.App.Properties.setString('carely_user', null);
										if (facebookModule.loggedIn) {
											Ti.App.Properties.setString('carely_user_facebook', null);
											facebookModule.logout();
											
											require('/lib/analytics').trackSocial({
												network : 'facebook',
												action : 'logout',
												target : self.title
											});
										}
										MasterWindow.getNavGroup().close(self, {animated : false});
								    	Ti.App.Properties.setString('carely_user_session', null);
								    	Model.user_session = null;
								    	
										var signupWin = new SignupWindow();
										MasterWindow.getNavGroup().open(signupWin, {animated:false});
									} else {
										Model.eventDefaultErrorCallback(logoutEvent);
									}
								});
								break;
							default:
								break;
						}
					});
					dlg.show();
					break;
				default:
					break;
			}
			
			require('/lib/analytics').trackEvent({
				category : 'table',
				action : e.row.itemJSON.title,
				label : e.row.itemJSON.header ? e.row.itemJSON.header : null,
				value : null
			});
		}
	});
	
	function createSettingsRows(){
		var rows = [];
		currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
		_admin_options = true;
		_default_admin_options = true;
		if(currentUser.admin === 'true'){
			rows.push(createSettingsRow({ title : 'All Users', hasChild : true }));
			if(currentUser && currentUser.custom_fields && currentUser.custom_fields.show_admin_features === false){
				_admin_options = false;
				_default_admin_options = false;
			}
			rows.push(createSettingsRow({ title : 'Show admin options', hasChild : false, valueSwitch : { value : _admin_options, callback : showAdminOptionsCallback } }));
		}
		rows.push(createSettingsRow({ title : 'Edit Profile', hasChild : true, header:'Account' }));
		rows.push(getFacebookRow());
		
		_share_location = true;
		_share_location_original = true;
		if(currentUser && currentUser.custom_fields && currentUser.custom_fields.share_location === false){
			_share_location = false;
			_share_location_original = false;
		}
		rows.push(createSettingsRow({ title : 'Share location', hasChild : false, valueSwitch : { value : _share_location, callback : shareLocationCallback } }));
		
		rows.push(createSettingsRow({ title : 'Notifications', hasChild : true }));
	
		rows.push(createSettingsRow({ title : 'About', hasChild : true, header:'About ' + Ti.App.name }));
		rows.push(createSettingsRow({ title : 'Rate Our App', hasChild : true }));
		rows.push(createSettingsRow({ title : 'Send Feedback', hasChild : true }));
		rows.push(createSettingsRow({ title : 'Frequently Asked Questions', hasChild : true }));
		
		rows.push(createSettingsRow({ title : 'Clear Cache', hasChild : false, header:''}));
		
		//rows.push(createSettingsRow({ title : 'Terms of Service', hasChild : false }));
		//rows.push(createSettingsRow({ title : 'Privacy Policy', hasChild : false }));
		
		rows.push(createLoginButton());
		
		return rows;
	}
	
	function refreshSettings() {
		settings_table.setData(createSettingsRows());
	}

	self.addEventListener('close', function(e){
		self.remove(settings_table);
		settings_table = null;
		self = null;
		
		var update_params = {
			custom_fields:{}
		}, need_update = false;
		currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
		// if(currentUser && currentUser.username && currentUser.username.indexOf('function valueof() { [native code] }') > -1){
			// update_params.username = currentUser.username.replace('function valueof() { [native code] }', new Date().valueOf() + '');
			// need_update = true;
		// }
		if(currentUser && currentUser.custom_fields){
			if(_share_location !== _share_location_original){
				currentUser.custom_fields.share_location = _share_location;
				update_params.custom_fields.share_location = _share_location;
				need_update = true;
			}
			if(currentUser.admin === 'true' && _admin_options !== _default_admin_options){
				currentUser.custom_fields.show_admin_features = _admin_options;
				update_params.custom_fields.show_admin_features = _admin_options;
				need_update = true;
			}
			
			if(need_update){
				Ti.App.Properties.setString('carely_user', JSON.stringify(currentUser));
				common.refreshHandler.setRefresh.news(true);
				
				var UsersModel = require('/lib/model/users');
				UsersModel.update(update_params, function(updateEvent) {
					if (updateEvent.success) {
						currentUser = updateEvent.users[0];
						Ti.App.Properties.setString('carely_user', JSON.stringify(updateEvent.users[0]));
	
						Model.AppCache.users.set(updateEvent.users[0]);
						
						common.refreshHandler.setRefresh.news(true);
					} else {
						Model.eventDefaultErrorCallback(updateEvent);
					}
				});
			}
		}
	});
	
	self.addEventListener('focus', function(e){
		
		if(Ti.App.Properties.getBool('carely_goToHome', false) === true){
			require('/ui/MasterWindow').getNavGroup().close(this, {animated:false});
		}
		else{
			refreshSettings();
			require('/lib/analytics').trackScreen({ screenName : self.title });
		}
	});
	self.addEventListener('open', function(e){
		
		if(Ti.App.Properties.getBool('carely_goToHome', false) === true){
			require('/ui/MasterWindow').getNavGroup().close(this, {animated:false});
		}
	});
	
	return self;
}
module.exports = SettingsWindow;