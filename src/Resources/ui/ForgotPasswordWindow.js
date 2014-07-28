function ForgotPasswordWindow() {
	var theme = require('/ui/theme'),
		ui = require('/ui/components');

	var isAndroid = Ti.Platform.osname === 'android';
	
	var focusedText = null;
	function blurText(){
		if(focusedText !== null){
			focusedText.blur();
		}
	}
	function AddHideKeyboardOnClick(_item){
		_item.addEventListener('click', blurText);
	}
	
	var self = Ti.UI.createWindow({
		title:Ti.App.name,
		navBarHidden:isAndroid,
		backgroundColor:theme.winBgColor,
		orientationModes : [Ti.UI.PORTRAIT]
	});
	AddHideKeyboardOnClick(self);

	if(isAndroid){
	}
	else{
		self.tabBarHidden = true;
		self.barColor = theme.barColor;
	}
	
	var main_scrollView = Ti.UI.createScrollView({
		contentWidth: 'auto',
		contentHeight: 'auto',
		top: isAndroid ? 50 : 0,
		showVerticalScrollIndicator: true,
		showHorizontalScrollIndicator: true,
		scrollType: 'vertical',
		layout:'vertical',
		backgroundColor: theme.winBgColor1,
		top:10,
		bottom:10,
		left:10,
		right:10,
		width:Ti.UI.FILL,
		height:220,
		borderWidth:1,
		borderColor : theme.tableBorderColor,
		borderRadius : theme.defaultBorderRadius
	});
	AddHideKeyboardOnClick(main_scrollView);
	self.add(main_scrollView);
	
	var forgot_label = new ui.Label('forgot_password', {
		top:10,
		color: theme.darkFontColor,
		left: 10,
		font: theme.defaultFontBold
	});
	AddHideKeyboardOnClick(forgot_label);
	main_scrollView.add(forgot_label);
	
	var forgot_desc_label = Ti.UI.createLabel({
		top:10,
		color: theme.textColor,
		left: 10,
		font: theme.defaultToolTipFont,
		text:'To reset your password, enter your email address and we\'ll send you instructions on how to create a new password'
	});
	AddHideKeyboardOnClick(forgot_desc_label);
	main_scrollView.add(forgot_desc_label);
	
	var user_email = new ui.Label('Email', {
		top:10,
		color: theme.textColor,
		left: 10,
		font: theme.defaultFontBold
	});
	AddHideKeyboardOnClick(user_email);
	main_scrollView.add(user_email);
	
	var email_text = Ti.UI.createTextField({
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
		keyboardType:Ti.UI.KEYBOARD_EMAIL,
		appearance: Titanium.UI.KEYBOARD_APPEARANCE_ALERT,
		returnKeyType:Ti.UI.RETURNKEY_DONE,
		borderColor : theme.tableBorderColor,
		borderRadius : theme.defaultBorderRadius,
		backgroundColor: '#fff',
		txtUpdating:false,
		autocapitalization:Ti.UI.TEXT_AUTOCAPITALIZATION_NONE,
		autocorrect:false
	});
	email_text.addEventListener('return', function(e) {
		reset_btn.fireEvent('click');
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
	
	var reset_btn = Ti.UI.createButton({
		title : L('reset_password', 'Reset password'),
		font : {
			fontSize : 20,
			fontFamily : theme.fontFamily,
			fontWeight : 'bold'
		},
		width : 280,
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
	reset_btn.addEventListener('click', function(e) {
		blurText();
		
		if(this.clickTime && (new Date() - this.clickTime < 1000)){
			return false;
		}
		this.clickTime = new Date();
		
		if(!email_text.value.length){
			email_text.focus();
		}
		else if(emailReg.test(email_text.value) == false){
			email_text.focus();
			Ti.UI.createAlertDialog({
				title : 'Forgot password',
				message : 'Invalid email address!',
				buttonNames : [L('ok', 'OK')]
			}).show();
		}
		else{
			var UsersModel = require('/lib/model/users'), 
			actIndicator = require('/ui/ActivityIndicator');

			var indicator = new actIndicator();
			indicator.showModal('Resetting password', 10000, 'Timeout while resetting password!');
			UsersModel.resetPassword(email_text.value, function(resetEvent) {
				indicator.hideModal();
				
				if (resetEvent.success) {
					Ti.UI.createAlertDialog({
						title : 'Forgot password',
						message : 'Password reset instruction sent to your email!',
						buttonNames : [L('ok', 'OK')]
					}).show();
				} else {
					require('/lib/model/model').eventDefaultErrorCallback(resetEvent);
				}
			});
		}
	});
	main_scrollView.add(reset_btn);
	
	self.addEventListener('focus', function(e){
		if(Ti.App.Properties.getBool('carely_goToHome', false) === true){
			require('/ui/MasterWindow').getNavGroup().close(this, {animated:false});
		}
		else{
			require('/lib/analytics').trackScreen({ screenName : self.title });
		}
	});
	
	self.addEventListener('open', function(e){
		email_text.focus();
		
		if(Ti.App.Properties.getBool('carely_goToHome', false) === true){
			require('/ui/MasterWindow').getNavGroup().close(this, {animated:false});
		}
	});
	
	return self;
}

module.exports = ForgotPasswordWindow; 