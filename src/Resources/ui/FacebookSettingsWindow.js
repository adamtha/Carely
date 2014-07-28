function FacebookSettingsWindow(params){
	var theme = require('/ui/theme'),
		ui = require('/ui/components'),
		Model = require('/lib/model/model'),
		facebookModule = require('facebook'),
		common = require('/lib/common');
	
	facebookModule.appid = common.FACEBOOK_APP_ID;
	facebookModule.permissions = common.FACEBOOK_APP_PERMISSIONS;
	facebookModule.forceDialogAuth = false;
		
	var isAndroid = Ti.Platform.osname === 'android';
	
	var self = Ti.UI.createWindow({
		title : 'Facebook',
		navBarHidden : false,
		backgroundColor : theme.winBgColor,
		orientationModes : [Ti.UI.PORTRAIT],
		barColor : theme.barColor,
		layout:'vertical'
	});
	
	var fbUserData = JSON.parse(Ti.App.Properties.getString('carely_user_facebook', null));
	if(fbUserData && fbUserData.username && fbUserData.name){
		var fbView = Ti.UI.createView({
			top:10,
			left:0,
			right:0,
			width:Ti.UI.FILL,
			height:32
		});
		
		var fbIcon = Ti.UI.createImageView({
			image: 'https://graph.facebook.com/' + fbUserData.username + '/picture',
			top:0,
			left:10,
			width:32,
			height:32,
			hires:true
		});
		fbView.add(fbIcon);
		
		var fbUserName = Ti.UI.createLabel({
			text:'Linked to: ' + fbUserData.name,
			top:6,
			left:52,
			font : theme.defaultFont,
			color : theme.textColor,
			textAlign : Ti.UI.TEXT_ALIGNMENT_LEFT
		});
		if(fbUserData.link){
			fbUserName.urlLink = fbUserData.link;
			fbUserName.color = theme.urlColor;
			
			fbUserName.addEventListener('touchstart', function(e){
				fbUserName.color = theme.urlColorClicked;
			});
			fbUserName.addEventListener('touchend', function(e){
				fbUserName.color = theme.urlColor;
			});
			fbUserName.addEventListener('click', function(e) {
				fbUserName.color = theme.urlColor;
				if (fbUserName.clickTime && (new Date() - fbUserName.clickTime < 1000)) {
					return false;
				}
				fbUserName.clickTime = new Date();

				var urlWebView = require('/lib/urlWebView');
				var urlWin = new urlWebView(fbUserName.urlLink, fbUserData.name, null, false);
				require('/ui/MasterWindow').getNavGroup().open(urlWin);
				
				require('/lib/analytics').trackEvent({
					category : 'url',
					action : 'click',
					label : fbUserName.urlLink,
					value : null
				});
			});
		}
		fbView.add(fbUserName);
		
		self.add(fbView);
	}
	
	var checkin_row = Ti.UI.createTableViewRow({
		hasChild : false,
		height : theme.tableDefaultHeight,
		width : 'auto',
		className : 'FacebookSettings_Row'
	});

	var checkin_name = Ti.UI.createLabel({
		text : 'Share check ins',
		color : theme.textColor,
		top : 10,
		left : 10,
		width : '64%',
		font : theme.defaultFontBold,
		textAlign : Ti.UI.TEXT_ALIGNMENT_LEFT
	});
	checkin_row.add(checkin_name);

	var checkin_value = Ti.UI.createSwitch({
		right : 10,
		value : true,
		style : isAndroid ? Ti.UI.Android.SWITCH_STYLE_CHECKBOX : null
	});
	checkin_value.addEventListener('change', function(e) {
		settingsChanged = true;
	}); 
 	checkin_row.add(checkin_value);
 	
	var settingsChanged = false, 
		currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
	if(currentUser && currentUser.custom_fields && currentUser.custom_fields.facebook_settings &&
		currentUser.custom_fields.facebook_settings.checkin === false){
		checkin_value.value = false;
	}
	
	var tableView = Ti.UI.createTableView({
		data : [checkin_row],
		top : 10,
		left : 10,
		right : 10,
		borderColor: theme.tableBorderColor,
		borderRadius: theme.defaultBorderRadius,
		backgroundColor : theme.tableBackgroundColor,
		height: theme.tableDefaultHeight
	});
	self.add(tableView);
	
	var unlink_label = Ti.UI.createLabel({
		top : 10,
		text : 'Unlink your Facebook account?',
		font : {
			fontSize : 14,
			fontFamily : theme.fontFamily
		},
		width:Ti.UI.FILL,
		color : theme.lightFontColor,
		textAlign : Ti.UI.TEXT_ALIGNMENT_CENTER
	}); 
	self.add(unlink_label);
	
	var unlink_button = Ti.UI.createButton({
		title : 'unlink'.toUpperCase(),
		font : {
			fontSize : 20,
			fontFamily : theme.fontFamily,
			fontWeight : 'bold'
		},
		width : 300,
		height : 40,
		top : 10,
		left : 10,
		color : theme.whiteFontColor,
		selectedColor : theme.lightFontColor,
		backgroundImage : theme.buttonImage.red.normal,
		backgroundSelectedImage : theme.buttonImage.red.selected,
		style : isAndroid ? null : Ti.UI.iPhone.SystemButtonStyle.PLAIN
	}); 
	unlink_button.addEventListener('click', function(e){
		if(params.externalData && params.externalData.accountId && params.externalData.accountType){
			var dlg = Ti.UI.createAlertDialog({
				title : 'Unlink account',
				message : 'Are you sure you want to unlink this account?',
				buttonNames : ['Yes', 'Cancel'],
				cancel : 1
			});
			dlg.addEventListener('click', function(alertEvent) {
				if (this.clickTime && (new Date() - this.clickTime < 1000)) {
					return false;
				}
				this.clickTime = new Date();
				
				switch(alertEvent.index) {
					case 0:
						var socialModel = require('/lib/model/social'), 
						actIndicator = require('/ui/ActivityIndicator');
						var indicator = new actIndicator();
						indicator.showModal('Unlinking account...', 60000, 'Timeout unlinking account!');
						socialModel.unlinkAccount(params.externalData.accountId, params.externalData.accountType, function(unlinkEvent){
							indicator.hideModal();
							if(unlinkEvent.success){
								var _user = unlinkEvent.users[0];
								if(_user){
									Ti.App.Properties.setString('carely_user', JSON.stringify(_user));
									Model.AppCache.users.set(_user);
								} 
								
								require('/lib/analytics').trackSocial({
									network : 'facebook',
									action : 'unlink',
									target : self.title
								});
									
								if(facebookModule.loggedIn){
									Ti.App.Properties.setString('carely_user_facebook', null);
									facebookModule.logout();
									
									require('/lib/analytics').trackSocial({
										network : 'facebook',
										action : 'logout',
										target : self.title
									});
								}
								require('/ui/MasterWindow').getNavGroup().close(self, { animated : true });
							}
							else{
								Model.eventDefaultErrorCallback(unlinkEvent);
							}
						});
						break;
					default:
						break;
				}
			});
			dlg.show();
		}
	});
	self.add(unlink_button);
	
	var share_title = Ti.UI.createLabel({
		text : 'Share us',
		top : 20,
		color : theme.textColor,
		left : 13,
		font : theme.defaultFontBold
	});
	self.add(share_title);
	
	var publish_row = Ti.UI.createTableViewRow({
		hasChild : false,
		height : theme.tableDefaultHeight,
		width : 'auto',
		className : 'FacebookSettings_Row',
		clickName:'publish'
	});

	var publish_name = Ti.UI.createLabel({
		text : 'Post on wall',
		color : theme.textColor,
		top : 10,
		left : 10,
		width : '64%',
		font : theme.defaultFontBold,
		textAlign : Ti.UI.TEXT_ALIGNMENT_LEFT
	});
	publish_row.add(publish_name);
	
	var invite_row = Ti.UI.createTableViewRow({
		hasChild : false,
		height : theme.tableDefaultHeight,
		width : 'auto',
		className : 'FacebookSettings_Row',
		clickName:'invite'
	});

	var invite_name = Ti.UI.createLabel({
		text : 'Invite friends',
		color : theme.textColor,
		top : 10,
		left : 10,
		width : '64%',
		font : theme.defaultFontBold,
		textAlign : Ti.UI.TEXT_ALIGNMENT_LEFT
	});
	invite_row.add(invite_name);
	
	var share_tableView = Ti.UI.createTableView({
		data : [publish_row, invite_row],
		top : 0,
		left : 10,
		right : 10,
		borderColor: theme.tableBorderColor,
		borderRadius: theme.defaultBorderRadius,
		backgroundColor : theme.tableBackgroundColor,
		height: 2 * theme.tableDefaultHeight
	});
	share_tableView.addEventListener('singletap', function(e){
		if (this.clickTime && (new Date() - this.clickTime < 1000)) {
			return false;
		}
		this.clickTime = new Date();

		if(e && e.row && e.row.clickName && facebookModule.loggedIn){
			
			require('/lib/analytics').trackEvent({
				category : 'facebook settings',
				action : e.row.clickName,
				label : null,
				value : null
			});
			
			switch(e.row.clickName){
				case 'publish':
						facebookModule.dialog('feed', {
							link:'http://care.ly',
							name:Ti.App.name,
							//message:'Checkout this cool iphone app for sharing the things you care about',
							caption:'',
							//picture:'',
							description:'Check out the Carely iPhone app for sharing activities'
						}, function(fbEvent){
							if(fbEvent.success){
								
							}
							else{
								
							}
						});
					break;
				case 'invite':
					facebookModule.dialog('apprequests', {
						message : 'Check out the Carely iPhone app for sharing activities'
					}, function(fbEvent) {
						if (fbEvent.success) {

						} else {

						}
					});
					break;
				default:
					break;
			}
		}
	});
	self.add(share_tableView);
	
	self.addEventListener('open', function(e){
		require('/lib/analytics').trackScreen({ screenName : 'Facebook Settings' });
	});
	
	self.addEventListener('close', function(e){
		if(settingsChanged && facebookModule.loggedIn){
			var Users = require('/lib/model/users');
			var fb_settings = {
				'checkin' : checkin_value.value
			};
			Users.update({
				custom_fields:{
					facebook_settings:fb_settings
				}
			}, function(updateEvent){
				require('/lib/analytics').trackEvent({
					category : 'facebook settings',
					action : 'share',
					label : 'checkin',
					value : checkin_value.value ? 1 : 0
				});
				
				if(updateEvent.success){
					if(updateEvent.users[0]){
						Ti.App.Properties.setString('carely_user', JSON.stringify(updateEvent.users[0]));
						Model.AppCache.users.set(updateEvent.users[0]);
					}
				}
				else{
					Model.eventDefaultErrorCallback(updateEvent);
				}
			});
		}
	});
	
	return self;
}

module.exports = FacebookSettingsWindow;