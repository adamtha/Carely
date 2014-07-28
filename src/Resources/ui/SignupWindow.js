function SignupWindow() {
	var theme = require('/ui/theme'),
		common = require('/lib/common'),
		UserLoginWindow = require('/ui/UserLoginWindow'),
		UserSignupWindow = require('/ui/UserSignupWindow'),
		facebookModule = require('facebook');
		
	facebookModule.appid = common.FACEBOOK_APP_ID;
	facebookModule.permissions = common.FACEBOOK_APP_PERMISSIONS;
	facebookModule.forceDialogAuth = false;
	// facebookModule.addEventListener('logout', function(e){
		// var cl = Ti.Network.createHTTPClient();
		// cl.clearCookies('https://login.facebook.com');
		// cl = null;
	// });
	
	var isAndroid = Ti.Platform.osname === 'android',
		screenTitle = 'App Signup';
	
	var self = Ti.UI.createWindow({
		//title:Ti.App.name,
		navBarHidden:true,
		barColor:theme.barColor,
		backgroundImage:theme.images.carely,
		orientationModes : [Ti.UI.PORTRAIT]
	});
	
	if(isAndroid){
	}
	else{
		//self.barColor = theme.barColor;

		// var skipButton = Ti.UI.createButton({
			// title : L('skip', 'Skip')
			// //style : Ti.UI.iPhone.SystemButtonStyle.BORDERED
		// });
// 
		// skipButton.addEventListener('click', function() {
			// if(this.clickTime && (new Date() - this.clickTime < 1000)){
				// return false;
			// }
			// this.clickTime = new Date();
// 			
			// require('/ui/MasterWindow').getNavGroup().close(self, {animated:false});
		// });
// 
		// self.leftNavButton = Ti.UI.createView();
	}
	
	var facebook_btn = Ti.UI.createButton({
		width : 260,
		height : 43,
		top : 20,
		left : 30,
		backgroundImage:theme.images.social.facebook.connect,
		style: isAndroid ? null : Ti.UI.iPhone.SystemButtonStyle.PLAIN
	});
	// facebook_btn.addEventListener('touchstart', function(e) {
		// this.backgroundImage = theme.images.social.facebook.connectDark;
	// });
	facebook_btn.addEventListener('click', function(e) {
		if(this.clickTime && (new Date() - this.clickTime < 1000)){
			return false;
		}
		this.clickTime = new Date();
		
		//this.backgroundImage = theme.images.social.facebook.connect;
		
		require('/lib/analytics').trackEvent({
			category : 'button',
			action : 'facebook',
			label : 'click',
			value : null
		});
		
		if (facebookModule.loggedIn) {
			Ti.App.Properties.setString('carely_user_facebook', null);
			facebookModule.logout();
			
			require('/lib/analytics').trackSocial({
				network : 'facebook',
				action : 'logout',
				target : screenTitle
			}); 

			return false;
		}
		
		var Model = require('/lib/model/model'),
			actIndicator = require('/ui/ActivityIndicator');
		var indicator = new actIndicator();
		
		var facebookListener = function(fbLoginEvent) {
			try {
				if (fbLoginEvent.success) {
					if(fbLoginEvent.data && fbLoginEvent.data.email && fbLoginEvent.data.email.length > 0){
						Ti.App.Properties.setString('carely_user_facebook', JSON.stringify(fbLoginEvent.data));
						
						indicator.showModal('Signing in', 10000, 'Timeout while signing in!');
						
						var UsersModel = require('/lib/model/users'),
							socialModel = require('/lib/model/social');
						
						// search for a user with the same facebook email
						UsersModel.query({email:fbLoginEvent.data.email}, null, 1, 0, function(queryEvent){
							if(queryEvent.success){
								if(queryEvent.users && queryEvent.users.length > 0){
									
									// user found, check if facebook account connected
									var fb_linked = false;
									if(queryEvent.users[0].external_accounts){
										for(var i=0,v=queryEvent.users[0].external_accounts.length; i<v; i++){
											if(queryEvent.users[0].external_accounts[i].external_type === 'facebook' &&
											   queryEvent.users[0].external_accounts[i].external_id === facebookModule.uid){
												fb_linked = true;
												break;
											}
										}
									}
									
									if(fb_linked){
										// facebook account linked, so just login user
										socialModel.loginAccount(facebookModule.uid, 'facebook', facebookModule.accessToken, function(userLoginEvent){
											indicator.hideModal();
											if(userLoginEvent.success){
									
												require('/lib/analytics').trackSocial({
													network : 'facebook',
													action : 'login',
													target : screenTitle
												}); 

												if(userLoginEvent.meta && userLoginEvent.meta.session_id){
													Ti.App.Properties.setString('carely_user_session', userLoginEvent.meta.session_id);
													Model.user_session = userLoginEvent.meta.session_id;
												}
												
												Ti.App.Properties.setString('carely_user', JSON.stringify(userLoginEvent.users[0]));
												Model.AppCache.users.set(userLoginEvent.users[0]);
												common.refreshHandler.setRefresh.all(true);
										
												require('/ui/MasterWindow').getNavGroup().goToHome(self, false);
												
												Ti.App.fireEvent('geo.handle');
											}
											else{
												Model.eventDefaultErrorCallback(userLoginEvent);
											}
										});
									}
									else{
										indicator.hideModal();
										// facebook account not linked, send to login page and link account after user logs in
										var loginWin = new UserLoginWindow({show:'Facebook', email:fbLoginEvent.data.email});
										require('/ui/MasterWindow').getNavGroup().open(loginWin);
									}
								}
								else{
									// user not found, create a new user and connect the facebook account
									function signupUser(fbData){										
										// generate random password
										var validChars = 'abcdefghijklmnopqrstuvwhzyABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890',
											pass = '';
										for(var j=0; j<10; j++){
											pass += validChars.charAt(Math.floor(Math.random() * validChars.length));
										}
										
										UsersModel.create(
											fbData.username + common.userUniqValue + new Date().valueOf(), 
											fbData.email, 
											pass, 
											pass, 
											'user', 
											null, 
											{
												display_name : fbData.name,
												bio : '',
												location : '',
												phone_number : '',
												selected_group : common.everyone_group,
												my_groups : [],
												my_actions : [],
												my_posts : {},
												total_checkins : 0,
												total_discussions : 0,
												total_likes : 0,
												total_comments : 0,
												fb_user_id : fbData.id
										}, function(signupEvent) {
											indicator.hideModal();
											if (signupEvent.success) {		
												
												require('/lib/analytics').trackSocial({
													network : 'facebook',
													action : 'signup',
													target : screenTitle
												}); 
			
												if (signupEvent.meta && signupEvent.meta.session_id) {
													Ti.App.Properties.setString('carely_user_session', signupEvent.meta.session_id);
													Model.user_session = signupEvent.meta.session_id;
												}
												
												// reset tooltip counters
												Ti.App.Properties.setBool('carely_showActionsOverlay', true);
												Ti.App.Properties.setBool('carely_showNewsOverlay', true);
												
												Ti.App.Properties.setString('carely_user', JSON.stringify(signupEvent.users[0]));
												common.refreshHandler.setRefresh.all(true);
												
												Ti.App.Properties.setString('List_tag', null);
												
												require('/ui/MasterWindow').getNavGroup().goToHome(self, false);

												var uname = common.getUserDisplayName(signupEvent.users[0]);
												
												var EmailsModel = require('/lib/model/emails');
												EmailsModel.welcome(uname, [signupEvent.users[0].email], function(emailEvent) {
												});
												
												Ti.App.Properties.setBool('carely_showNewsOverlay', true)
												Ti.App.Properties.setBool('carely_showActionsOverlay', true);
					
												Ti.App.fireEvent('geo.handle');

												socialModel.linkAccount(facebookModule.uid, 'facebook', facebookModule.accessToken, function(linkEvent) {
													if(linkEvent.success){
														Ti.App.Properties.setString('carely_user', JSON.stringify(linkEvent.users[0]));
														
														require('/lib/analytics').trackSocial({
															network : 'facebook',
															action : 'link',
															target : screenTitle
														});
													}
													else{
														Model.eventDefaultErrorCallback(linkEvent);
													}
												});
											} else {
												Model.eventDefaultErrorCallback(signupEvent);
											}
										});
									}
									
									if(fbLoginEvent.data.picture){
										signupUser(fbLoginEvent.data);
									}
									else{
										facebookModule.requestWithGraphPath('me', {fields:'id,name,username,email,picture'}, 'GET', function(fbqEvent){
											if(fbqEvent.success){
												signupUser(JSON.parse(fbqEvent.result));
											}
											else{
												Model.eventDefaultErrorCallback(fbqEvent);
											}
										});
									} 
								}
							}
							else{
							   Model.eventDefaultErrorCallback(queryEvent);
							}
						});
					}
					else{
						// invalid data returned from facebook
					}
				} else if (fbLoginEvent.error) {
					Model.eventDefaultErrorCallback(fbLoginEvent);
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
		
		facebookModule.forceDialogAuth = false;
		facebookModule.authorize();
	});
	self.add(facebook_btn);
	
	var or_label = Ti.UI.createLabel({
		text : '- OR -',
		font : theme.defaultFont,
		color : theme.menuFontColor,
		width:Ti.UI.FILL,
		textAlign : Ti.UI.TEXT_ALIGNMENT_CENTER,
		height:20,
		top : facebook_btn.top + facebook_btn.height + 5,
		bottom: 5
	}); 
	self.add(or_label);
	
	var signup_btn = Ti.UI.createButton({
		title : L('signup', 'Sign up'),
		font : {
			fontSize : 20,
			fontFamily : theme.fontFamily,
			fontWeight : 'bold'
		},
		width : 200,
		height : 40,
		top : or_label.top + or_label.height + 10,
		left : 60,
		color: theme.whiteFontColor,
		selectedColor:theme.lightFontColor,
		backgroundImage : theme.buttonImage.green.normal,
		backgroundSelectedImage : theme.buttonImage.green.selected,
		//borderRadius:theme.defaultBorderRadius,
		//backgroundGradient: theme.backgroundGradient.green,
		style: isAndroid ? null : Ti.UI.iPhone.SystemButtonStyle.PLAIN
	});
	signup_btn.addEventListener('click', function(e) {
		if(this.clickTime && (new Date() - this.clickTime < 1000)){
			return false;
		}
		this.clickTime = new Date();
		
		require('/lib/analytics').trackEvent({
			category : 'button',
			action : signup_btn.title,
			label : 'click',
			value : null
		});
		
		var signupWin = new UserSignupWindow();
		require('/ui/MasterWindow').getNavGroup().open(signupWin);
	});
	self.add(signup_btn);
	
	var login_btn = Ti.UI.createButton({
		title : L('login', 'Log in'),
		font : {
			fontSize : 20,
			fontFamily : theme.fontFamily,
			fontWeight : 'bold'
		},
		width : 200,
		height : 40,
		top : signup_btn.top + signup_btn.height + 10,
		left : 60,
		color: theme.whiteFontColor,
		selectedColor:theme.lightFontColor,
		backgroundImage : theme.buttonImage.green.normal,
		backgroundSelectedImage : theme.buttonImage.green.selected,
		//borderRadius:theme.defaultBorderRadius,
		//backgroundGradient: theme.backgroundGradient.green,
		style: isAndroid ? null : Ti.UI.iPhone.SystemButtonStyle.PLAIN
	});
	login_btn.addEventListener('click', function(e) {
		if(this.clickTime && (new Date() - this.clickTime < 1000)){
			return false;
		}
		this.clickTime = new Date();
		
		require('/lib/analytics').trackEvent({
			category : 'button',
			action : login_btn.title,
			label : 'click',
			value : null
		});

		var loginWin = new UserLoginWindow();
		require('/ui/MasterWindow').getNavGroup().open(loginWin);
	});
	self.add(login_btn);
	
	self.addEventListener('focus', function(e){
		if(Ti.App.Properties.getBool('carely_goToHome', false) === true){
			require('/ui/MasterWindow').getNavGroup().close(this, {animated:false});
		}
		else{
			require('/lib/analytics').trackScreen({ screenName : screenTitle });
		}
	});
	self.addEventListener('open', function(e){
		Ti.App.Properties.setBool('carely_news_restart', true);
		Ti.App.Properties.setBool('carely_menu_restart', true);
		Ti.App.Properties.setBool('carely_actions_restart', true);
		
		Ti.App.Properties.setBool('carely_handlePushNotifications', true);
		
		Ti.App.CarelyCache.clear();
		
		if(Ti.App.Properties.getBool('carely_goToHome', false) === true){
			require('/ui/MasterWindow').getNavGroup().close(this, {animated:false});
		}
		
		if (facebookModule.loggedIn) {
			Ti.App.Properties.setString('carely_user_facebook', null);
			facebookModule.logout();
			
			require('/lib/analytics').trackSocial({
				network : 'facebook',
				action : 'logout',
				target : screenTitle
			});
		}
		
		setTimeout(function(){
			var UsersModel = require('/lib/model/users');
			UsersModel.queryPages({
				importance : {$gt : 0}
			}, '-importance', 1, 10, function(e){
				require('/lib/analytics').trackEvent({
					category : 'app',
					action : 'start',
					label : 'load default users',
					value : e.success ? e.meta.total_results : 0
				});
				
				var Model = require('/lib/model/model');
				if(e.success){
					if (e.meta.total_results > 0) {
						// cache items
						Model.AppCache.users.setMany(e.users);
						
						Model.AppCache.set('carely_users_first_page', e.users);
					}
				}
				else{
					Model.eventDefaultErrorCallback(e);
				}
			});
		}, 200);
	});
	
	return self;
}

module.exports = SignupWindow; 