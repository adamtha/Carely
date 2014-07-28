function UserSignupWindow() {
	var theme = require('/ui/theme');

	var isAndroid = Ti.Platform.osname === 'android';
	
	var focusedText = null;
	function blurText(){
		if(focusedText !== null){
			focusedText.blur();
		}
	}
	
	var self = Ti.UI.createWindow({
		title : L('signup', 'Sign up'),
		navBarHidden : isAndroid,
		backgroundColor: theme.winBgColor,
		orientationModes : [Ti.UI.PORTRAIT]
	});
	
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
	
	var top_view = Ti.UI.createView({
		width: Ti.UI.FILL,
		backgroundColor: theme.winBgColor,
		top:0,
		left:0,
		height:theme.borderedImage.bigger.height + 20
	});
	main_scrollView.add(top_view);
	
	var user_pic = Ti.UI.createImageView({
		image:theme.defaultIcons.user,
		width : theme.borderedImage.big.width,
		height : theme.borderedImage.big.height,
		left: 10,
		top: 10
	});
	
	var change_view = Ti.UI.createLabel({
		top:2,
		left:2,
		right:2,
		backgroundColor: '#000',
		height: 'auto',
		width: Ti.UI.FILL,
		opacity: 0.65,
		text:'Change',
		font:theme.defaultFont,
		color:'#fff',
		textAlign:Ti.UI.TEXT_ALIGNMENT_CENTER
	});
	user_pic.add(change_view);
	
	var _photo = null;
	user_pic.addEventListener('click', function(photoEvent) {
		if(this.clickTime && (new Date() - this.clickTime < 1000)){
			return false;
		}
		this.clickTime = new Date();
		
		blurText();
		
		var photo_options_dialog = {
			options:['Take a Photo', 'Select From Gallery']
		};
		if(user_pic.image !== theme.defaultIcons.user){
			photo_options_dialog.options.push('Leave Empty');
		}
		photo_options_dialog.options.push('Cancel');
		photo_options_dialog.cancel = photo_options_dialog.options.length -1;
		
		var photo_dialog = Ti.UI.createOptionDialog(photo_options_dialog);
		photo_dialog.addEventListener('click', function(dialogEvent){
			if(dialogEvent.index === photo_options_dialog.cancel){
				return;
			}
			
			var selected_val = photo_options_dialog.options[dialogEvent.index];
			switch(selected_val){
				case 'Take a Photo':
					// take a photo
					Ti.Media.showCamera({
						success: function(cameraEvent){
							if(cameraEvent.mediaType === Ti.Media.MEDIA_TYPE_PHOTO){
								var ImageFactory = require('ti.imagefactory');
								_photo = ImageFactory.imageAsResized(cameraEvent.media, {
									width : 75,
									height : 75
								});
								//_photo = ImageFactory.imageAsResized(cameraEvent.media, { width:cameraEvent.media.width / 2, height:cameraEvent.media.height / 2});
								//_photo = ImageFactory.compress(_photo, 0.0);
								user_pic.applyProperties({
									image:_photo
								});
							}
						},
						cancel: function(cameraEvent){	
						},
						error: function(cameraEvent){
							// if(cameraEvent.code === Ti.Media.NO_CAMERA){
								// alert('Please run on device!');
							// }
							// else{
								// alert('unexpected error: ' + cameraEvent.code);
							// }
						},
						saveToPhotoGallery:true,
						allowEditing:false,
						mediaTypes: [Ti.Media.MEDIA_TYPE_PHOTO]
					});
					break;
				case 'Select From Gallery':
					// select existing photo
					Ti.Media.openPhotoGallery({
						success: function(galleryEvent){
							if(galleryEvent.mediaType === Ti.Media.MEDIA_TYPE_PHOTO){
								var ImageFactory = require('ti.imagefactory');
								_photo = ImageFactory.imageAsResized(galleryEvent.media, {
									width : 75,
									height : 75
								});
								//_photo = ImageFactory.imageAsResized(galleryEvent.media, { width:galleryEvent.media.width / 2, height:galleryEvent.media.height / 2});
								//_photo = ImageFactory.compress(_photo, 0.0);
								user_pic.applyProperties({
									image:_photo
								});
							}
						},
						cancel: function(galleryEvent){	
						},
						error: function(galleryEvent){
							// if(galleryEvent.code === Ti.Media.NO_CAMERA){
								// alert('Please run on device!');
							// }
							// else{
								// alert('unexpected error: ' + galleryEvent.code);
							// }
						},
						allowEditing:false,
						mediaTypes: [Ti.Media.MEDIA_TYPE_PHOTO]
					});
					break;
				case 'Leave Empty':
					_photo = null;
					user_pic.applyProperties({
						image : theme.defaultIcons.user
					}); 
					break;
				default:
					break;
			}
		});
		photo_dialog.show();
	});
	top_view.add(user_pic);
	
	var header_view = Ti.UI.createView({
		left: user_pic.left + user_pic.width + 6,
		top:8,
		bottom:8,
		height:Ti.UI.FILL,
		width:Ti.UI.FILL,
		layout:'vertical'
	});
	top_view.add(header_view);
	
	var user_title = Ti.UI.createLabel({
		text: 'Your Name',
		color: theme.textColor,
		left: 0,
		font: theme.defaultFontBold
	});
	header_view.add(user_title);
	
	var username_text = Ti.UI.createTextField({
		top:0,
		left:0,
		right:10,
		paddingLeft:4,
		value:'',
		width:Ti.UI.FILL,
		height:30,
		font: theme.defaultFont,
		color: theme.textColor,
		textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
		keyboardType:Ti.UI.KEYBOARD_DEFAULT,
		appearance: Titanium.UI.KEYBOARD_APPEARANCE_ALERT,
		returnKeyType:Ti.UI.RETURNKEY_NEXT,
		borderColor : theme.tableBorderColor,
		borderRadius : theme.defaultBorderRadius,
		backgroundColor: '#fff',
		autocapitalization:Ti.UI.TEXT_AUTOCAPITALIZATION_WORDS,
		autocorrect:false
	});
	username_text.addEventListener('return', function(e) {
		email_text.focus();
	});
	username_text.addEventListener('focus', function(e) {
		focusedText = this;
	});
	username_text.addEventListener('blur', function(e) {
		focusedText = null;
	}); 
	username_text.addEventListener('change', function(e) {
		if(this.txtUpdating === false){
			this.txtUpdating = true;
			if(e.value.length > 20){
				this.value = e.value.substr(0, 20);
			}	
			this.txtUpdating = false;
		}
	});
	header_view.add(username_text);
	
	var user_email = Ti.UI.createLabel({
		text: 'Email',
		top:0,
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
		value: '',
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
		text: 'Password',
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
		returnKeyType:Ti.UI.RETURNKEY_JOIN,
		borderColor : theme.tableBorderColor,
		borderRadius : theme.defaultBorderRadius,
		backgroundColor: '#fff',
		txtUpdating:false,
		autocapitalization:Ti.UI.TEXT_AUTOCAPITALIZATION_NONE,
		autocorrect:false,
		passwordMask:true
	});
	password_text.addEventListener('return', function(e) {
		signup_btn.fireEvent('click');
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
	
	var signup_btn = Ti.UI.createButton({
		title : L('signup', 'Sign up'),
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
		style: isAndroid ? null : Ti.UI.iPhone.SystemButtonStyle.PLAIN
	});
	
	var emailReg = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
	signup_btn.addEventListener('click', function(e){
		blurText();
		
		if(this.clickTime && (new Date() - this.clickTime < 1000)){
			return false;
		}
		this.clickTime = new Date();
		
		var UsersModel = require('/lib/model/users'),
			common = require('/lib/common'),
			actIndicator = require('/ui/ActivityIndicator');
		
		if(!_photo && user_pic.image !== theme.defaultIcons.user){
			_photo = user_pic.toImage();
		}
		
		if(!username_text.value.length){
			username_text.focus();
		}
		else if(!email_text.value.length){
			email_text.focus();
		}
		else if(emailReg.test(email_text.value) == false){
			email_text.focus();
			Ti.UI.createAlertDialog({
				title : 'Signup',
				message : 'Invalid email address!',
				buttonNames : [L('ok', 'OK')]
			}).show();
		}
		else if(!password_text.value.length){
			password_text.focus();
		}
		else if(password_text.value.length < 3){
			password_text.focus();
			Ti.UI.createAlertDialog({
				title : 'Signup',
				message : 'Password must be at least 3 charecters long!',
				buttonNames : [L('ok', 'OK')]
			}).show();
		}
		else{
			var indicator = new actIndicator();
			indicator.showModal('Signing in', 10000, 'Timeout while signing in!');
			
			var _ = require('/lib/underscore'),
				_s = require('/lib/underscore_strings');
				
			var _name_titleize = _s.titleize(username_text.value);
			
			UsersModel.create(
				_name_titleize + common.userUniqValue + new Date().valueOf(), 
				email_text.value, 
				password_text.value, 
				password_text.value, 
				'user', 
				_photo, 
				{
					display_name : _name_titleize,
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
					total_comments : 0
			}, function(signupEvent) {
				indicator.hideModal();
				if (signupEvent.success) {
					if (signupEvent.meta && signupEvent.meta.session_id) {
						Ti.App.Properties.setString('carely_user_session', signupEvent.meta.session_id);
						require('/lib/model/model').user_session = signupEvent.meta.session_id;
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
					
					Ti.App.fireEvent('geo.handle');
				} else {
					require('/lib/model/model').eventDefaultErrorCallback(signupEvent);
				}
			}); 
		}
	});
	main_scrollView.add(signup_btn);
	
	self.addEventListener('focus', function(e){
		if(Ti.App.Properties.getBool('carely_goToHome', false) === true){
			require('/ui/MasterWindow').getNavGroup().close(this, {animated:false});
		}
		else{
			require('/lib/analytics').trackScreen({ screenName : self.title });
		}
	});
	
	self.addEventListener('open', function(e){
		username_text.focus();
		
		if(Ti.App.Properties.getBool('carely_goToHome', false) === true){
			require('/ui/MasterWindow').getNavGroup().close(this, {animated:false});
		}
	});
	
	return self;
}

module.exports = UserSignupWindow; 