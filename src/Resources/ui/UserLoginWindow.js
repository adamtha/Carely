function UserLoginWindow(params) {
	var theme = require('/ui/theme');

	var isAndroid = Ti.Platform.osname === 'android';
	
	var focusedText = null;
	function blurText(){
		if(focusedText !== null){
			focusedText.blur();
		}
	}
	
	var self = Ti.UI.createWindow({
		title:L('login', 'Log in'),
		navBarHidden:isAndroid,
		backgroundColor:theme.winBgColor,
		orientationModes : [Ti.UI.PORTRAIT]
	});
	
	if(params && params.show){
		self.title += (' with ' + params.show);
	}
	
	self.tabBarHidden = true;
	self.barColor = theme.barColor;
	
	var main_scrollView = Ti.UI.createScrollView({
		contentWidth: 'auto',
		contentHeight: 'auto',
		top: isAndroid ? 50 : 0,
		showVerticalScrollIndicator: true,
		showHorizontalScrollIndicator: true,
		scrollType: 'vertical',
		layout:'vertical',
		backgroundColor: theme.winBgColor
	});
	self.add(main_scrollView);
	
	var user_email = Ti.UI.createLabel({
		text:'Email',
		top:10,
		color: theme.textColor,
		left: 10,
		font: theme.defaultFontBold
	});
	main_scrollView.add(user_email);
	
	var email_text = Ti.UI.createTextField({
		top:0,
		left:10,
		right:10,
		paddingLeft:4,
		value: params && params.email ? params.email : '',
		width:Ti.UI.FILL,
		height:30,
		font: theme.defaultFont,
		color: theme.textColor,
		textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
		keyboardType:Ti.UI.KEYBOARD_EMAIL,
		appearance: Titanium.UI.KEYBOARD_APPEARANCE_ALERT,
		returnKeyType:Ti.UI.RETURNKEY_NEXT,
		borderColor : theme.tableBorderColor,
		borderRadius : theme.defaultBorderRadius,
		backgroundColor: '#fff',
		txtUpdating:false,
		autocapitalization:Ti.UI.TEXT_AUTOCAPITALIZATION_NONE,
		autocorrect:false
	});
	email_text.addEventListener('return', function(e) {
		password_text.focus();
	});
	email_text.addEventListener('focus', function(e) {
		focusedText = this;
	});
	email_text.addEventListener('blur', function(e) {
		focusedText = null;
	}); 
	email_text.addEventListener('change', function(e) {
		if(this.txtUpdating === false){
			this.txtUpdating = true;
			if(e.value.length > 50){
				this.value = e.value.substr(0, 50);
			}	
			this.txtUpdating = false;
		}
	});
	main_scrollView.add(email_text);
	
	var user_password = Ti.UI.createLabel({
		text:'Password',
		top:10,
		color: theme.textColor,
		left: 10,
		font: theme.defaultFontBold
	});
	main_scrollView.add(user_password);
	
	var password_text = Ti.UI.createTextField({
		top:0,
		left:10,
		right:10,
		paddingLeft:4,
		value: '',
		width:Ti.UI.FILL,
		height:30,
		font: theme.defaultFont,
		color: theme.textColor,
		textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
		keyboardType:Ti.UI.KEYBOARD_DEFAULT,
		appearance: Titanium.UI.KEYBOARD_APPEARANCE_ALERT,
		returnKeyType:Ti.UI.RETURNKEY_DONE,
		borderColor : theme.tableBorderColor,
		borderRadius : theme.defaultBorderRadius,
		backgroundColor: '#fff',
		passwordMask:true,
		txtUpdating:false,
		autocapitalization:Ti.UI.TEXT_AUTOCAPITALIZATION_NONE,
		autocorrect:false
	});
	password_text.addEventListener('return', function(e) {
		login_btn.fireEvent('click');
	});
	password_text.addEventListener('focus', function(e) {
		focusedText = this;
	});
	password_text.addEventListener('blur', function(e) {
		focusedText = null;
	}); 
	password_text.addEventListener('change', function(e) {
		if(this.txtUpdating === false){
			this.txtUpdating = true;
			if(e.value.length > 50){
				this.value = e.value.substr(0, 50);
			}	
			this.txtUpdating = false;
		}
	});
	main_scrollView.add(password_text);
	
	var forgot_password = Ti.UI.createLabel({
		text : L('forgot_password', 'Forgot your password?'),
		font : theme.defaultFontBold,
		color : theme.urlColor,
		top : 10,
		width:Ti.UI.FILL,
		textAlign : Ti.UI.TEXT_ALIGNMENT_CENTER
	});
	forgot_password.addEventListener('touchstart', function(e) {
		forgot_password.color = theme.urlColorClicked;
	});
	forgot_password.addEventListener('click', function(e){
		forgot_password.color = theme.urlColor;
		
		blurText();
		
		var ForgotPasswordWindow = require('/ui/ForgotPasswordWindow');
		var forgotPasswordWindow = new ForgotPasswordWindow();
		require('/ui/MasterWindow').getNavGroup().open(forgotPasswordWindow);
		
		require('/lib/analytics').trackEvent({
			category : 'password',
			action : 'forgot',
			label : email_text.value,
			value : null
		});
	});
	main_scrollView.add(forgot_password);
	
	var login_btn = Ti.UI.createButton({
		title : L('login', 'Log in'),
		font : {
			fontSize : 20,
			fontFamily : theme.fontFamily,
			fontWeight : 'bold'
		},
		width : 300,
		height : 40,
		top : theme.defaultItemSpacing,
		left : 10,
		color: theme.whiteFontColor,
		selectedColor:theme.lightFontColor,
		backgroundImage : theme.buttonImage.green.normal,
		backgroundSelectedImage : theme.buttonImage.green.selected,
		//borderRadius:theme.defaultBorderRadius,
		//backgroundGradient: theme.backgroundGradient.green,
		style: isAndroid ? null : Ti.UI.iPhone.SystemButtonStyle.PLAIN
	});
	
	var emailReg = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
	login_btn.addEventListener('click', function(e) {
		blurText();
		
		if(this.clickTime && (new Date() - this.clickTime < 1000)){
			return false;
		}
		this.clickTime = new Date();
		
		if(!email_text.value.length){
			email_text.focus();
		}
		else if(!password_text.value.length){
			password_text.focus();
		}
		else if(password_text.value.length < 3){
			password_text.focus();
			Ti.UI.createAlertDialog({
				title : 'Login',
				message : 'Password must be at least 3 charecters long!',
				buttonNames : [L('ok', 'OK')]
			}).show();
		}
		else{
			var Model = require('/lib/model/model'),
				UsersModel = require('/lib/model/users'), 
			actIndicator = require('/ui/ActivityIndicator');

			var indicator = new actIndicator();
			indicator.showModal('Logging in', 10000, 'Timeout while logging in!');
			UsersModel.login(email_text.value, password_text.value, function(loginEvent) {
				indicator.hideModal();
				if (loginEvent.success) {
					if (loginEvent.meta && loginEvent.meta.session_id) {
						Ti.App.Properties.setString('carely_user_session', loginEvent.meta.session_id);
						Model.user_session = loginEvent.meta.session_id;
					}

					var common = require('/lib/common');
					Ti.App.Properties.setString('carely_user', JSON.stringify(loginEvent.users[0]));
					Model.AppCache.users.set(loginEvent.users[0]);
					common.refreshHandler.setRefresh.all(true);

					require('/ui/MasterWindow').getNavGroup().goToHome(self, false);
					
					Ti.App.fireEvent('geo.handle'); 

					if(params && params.show){
						// link share account
						var fb = require('facebook');
						if(params.show === 'Facebook' && fb.loggedIn){
							var socialModel = require('/lib/model/social');
							socialModel.linkAccount(fb.uid, 'facebook', fb.accessToken, function(linkEvent) {
								if (linkEvent.success) {
									Ti.App.Properties.setString('carely_user', JSON.stringify(linkEvent.users[0]));
									Model.AppCache.users.set(linkEvent.users[0]);
									
									require('/lib/analytics').trackSocial({
										network : 'facebook',
										action : 'link',
										target : self.title
									});
								} else {
									Model.eventDefaultErrorCallback(linkEvent);
								}
							});
						}
						else{
							// error
						}
					}
				} else {
					Model.eventDefaultErrorCallback(loginEvent);
				}
			});
		}
	});
	main_scrollView.add(login_btn);
	
	self.addEventListener('focus', function(e){
		if(Ti.App.Properties.getBool('carely_goToHome', false) === true){
			require('/ui/MasterWindow').getNavGroup().close(this, {animated:false});
		}
		else{
			require('/lib/analytics').trackScreen({ screenName : self.title });
		}
	});
	
	self.addEventListener('open', function(e){
		if(params && params.show){
			email_text.enabled = false;
			Ti.UI.createAlertDialog({
				title:'Login with ' + params.show,
				message:'The provided email is assosiated with an existing user.\n\nplease login with your password and we\'ll connect the ' + params.show + ' account\n\nonce completed you\'ll be able to use the ' + params.show + ' connect button properly on your next logins',
				buttonNames : [L('ok', 'OK')]
			}).show();
			password_text.focus();
		}
		else{
			email_text.focus();
		}
		
		if(Ti.App.Properties.getBool('carely_goToHome', false) === true){
			require('/ui/MasterWindow').getNavGroup().close(this, {animated:false});
		}
	});

	return self;
}

module.exports = UserLoginWindow; 