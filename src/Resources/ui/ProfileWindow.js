function ProfileView() {
	var theme = require('/ui/theme'),
		ui = require('/ui/components'),
		moment = require('/lib/date/moment'),
		common = require('/lib/common'),
		Model = require('/lib/model/model');
	
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
		title : 'Profile',
		navBarHidden : isAndroid,
		backgroundColor: theme.winBgColor,
		orientationModes : [Ti.UI.PORTRAIT]
	});
	AddHideKeyboardOnClick(self);
	
	var saveButton = null;
	if(isAndroid){
		
	}
	else{
		self.barColor = theme.barColor;
		
		saveButton = Ti.UI.createButton({
			systemButton:Ti.UI.iPhone.SystemButton.SAVE
		});
		saveButton.addEventListener('click', function(e){
			blurText();
			if(this.clickTime && (new Date() - this.clickTime < 1000)){
				return false;
			}
			this.clickTime = new Date();
			
			saveProfileChanges();
			
			require('/lib/analytics').trackEvent({
				category : 'user',
				action : 'save',
				label : null,
				value : null
			});
		});
		self.rightNavButton = saveButton;
	}
	
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
	AddHideKeyboardOnClick(main_scrollView);
	self.add(main_scrollView);
	
	var top_view = Ti.UI.createView({
		width: Ti.UI.FILL,
		backgroundColor: theme.winBgColor,
		top:0,
		left:0,
		height:theme.borderedImage.bigger.height + 20
	});
	AddHideKeyboardOnClick(top_view);
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
	
	var fbUserData = JSON.parse(Ti.App.Properties.getString('carely_user_facebook', null));
	var _photo = null, remove_photo = false;
	user_pic.addEventListener('click', function(photoEvent) {
		if(this.clickTime && (new Date() - this.clickTime < 1000)){
			return false;
		}
		this.clickTime = new Date();
		
		if(focusedText !== null){
			focusedText.blur();	
		}
		var photo_options_dialog = {
			options:['Take a Photo', 'Select From Gallery']
		};
	
		if (fbUserData && fbUserData.id && fbUserData.name) { 
			photo_options_dialog.options.push('Use Facebook Picture');
		}
		// if(user_pic.image !== theme.defaultIcons.user){
			// photo_options_dialog.options.push('Leave Empty');
		// }
		photo_options_dialog.options.push('Cancel');
		photo_options_dialog.cancel = photo_options_dialog.options.length -1;
		
		var photo_dialog = Ti.UI.createOptionDialog(photo_options_dialog);
		photo_dialog.addEventListener('click', function(dialogEvent){
			if(dialogEvent.index === photo_options_dialog.cancel){
				return;
			}
			
			var selected_val = photo_options_dialog.options[dialogEvent.index];
			require('/lib/analytics').trackEvent({
				category : 'user',
				action : 'photo',
				label : selected_val,
				value : null
			});
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
				case 'Use Facebook Picture':
					_photo = null;
					remove_photo = true;
					user_pic.applyProperties({
						image:'https://graph.facebook.com/' + fbUserData.id + '/picture'
					});
					break;
				case 'Leave Empty':
					_photo = null;
					remove_photo = true;
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
	AddHideKeyboardOnClick(header_view);
	top_view.add(header_view);
	
	var user_title = new ui.Label('user_name', {
		color: theme.textColor,
		left: 0,
		font: theme.defaultFontBold
	});
	AddHideKeyboardOnClick(user_title);
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
		keyboardType:Ti.UI.KEYBOARD_NAMEPHONE_PAD,
		appearance: Titanium.UI.KEYBOARD_APPEARANCE_ALERT,
		returnKeyType:Ti.UI.RETURNKEY_NEXT,
		borderColor : theme.tableBorderColor,
		borderRadius : theme.defaultBorderRadius,
		backgroundColor: '#fff',
		hintText:'Display Name',
		autocapitalization:Ti.UI.TEXT_AUTOCAPITALIZATION_NONE,
		autocorrect:false,
		txtUpdating:false
	});
	username_text.addEventListener('return', function(e) {
		bio_text.focus();
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
	
	var user_bio = new ui.Label('About me', {
		top:0,
		color: theme.textColor,
		left: 10,
		font: theme.defaultFontBold
	});
	AddHideKeyboardOnClick(user_bio);
	main_scrollView.add(user_bio);
	
	var bio_text = Ti.UI.createTextArea({
		top:0,
		left:10,
		right:10,
		//paddingLeft:4,
		value: '',
		width:Ti.UI.FILL,
		height:60,
		font: theme.defaultFont,
		color: theme.textColor,
		textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
		keyboardType:Ti.UI.KEYBOARD_DEFAULT,
		appearance: Titanium.UI.KEYBOARD_APPEARANCE_ALERT,
		returnKeyType:Ti.UI.RETURNKEY_DONE,
		borderColor : theme.tableBorderColor,
		borderRadius : theme.defaultBorderRadius,
		backgroundColor: '#fff',
		hintText:'Say something about yourself',
		autocapitalization:Ti.UI.TEXT_AUTOCAPITALIZATION_SENTENCES,
		suppressReturn:false,
		autocorrect:true,
		txtUpdating:false
	});
	// bio_text.addEventListener('return', function(e) {
		// phone_text.focus();
	// });
	bio_text.addEventListener('focus', function(e) {
		focusedText = this;
	});
	bio_text.addEventListener('blur', function(e) {
		focusedText = null;
	}); 
	bio_text.addEventListener('change', function(e) {
		if(this.txtUpdating === false){
			this.txtUpdating = true;
			if(e.value.length > 100){
				this.value = e.value.substr(0, 100);
			}	
			this.txtUpdating = false;
		}
	});
	main_scrollView.add(bio_text);
	
	var user_phone = new ui.Label('Phone Number', {
		top:10,
		color: theme.textColor,
		left: 10,
		font: theme.defaultFontBold
	});
	AddHideKeyboardOnClick(user_phone);
	main_scrollView.add(user_phone);
	
	var phone_text = Ti.UI.createTextField({
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
		keyboardType:Ti.UI.KEYBOARD_PHONE_PAD,
		appearance: Titanium.UI.KEYBOARD_APPEARANCE_ALERT,
		returnKeyType:Ti.UI.RETURNKEY_NEXT,
		borderColor : theme.tableBorderColor,
		borderRadius : theme.defaultBorderRadius,
		backgroundColor: '#fff',
		hintText:'Visible to other ' + Ti.App.name + ' members',
		autocapitalization:Ti.UI.TEXT_AUTOCAPITALIZATION_NONE,
		autocorrect:false,
		txtUpdating:false
	});
	phone_text.addEventListener('return', function(e) {
		location_text.focus();
	});
	phone_text.addEventListener('focus', function(e) {
		focusedText = this;
	});
	phone_text.addEventListener('blur', function(e) {
		focusedText = null;
	}); 
	phone_text.addEventListener('change', function(e) {
		if(this.txtUpdating === false){
			this.txtUpdating = true;
			if(e.value.length > 20){
				this.value = e.value.substr(0, 20);
			}	
			this.txtUpdating = false;
		}
	});
	main_scrollView.add(phone_text);
	
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
		returnKeyType:Ti.UI.RETURNKEY_NEXT,
		borderColor : theme.tableBorderColor,
		borderRadius : theme.defaultBorderRadius,
		backgroundColor: '#fff',
		hintText:'Email address',
		txtUpdating:false,
		//enabled:false,
		autocapitalization:Ti.UI.TEXT_AUTOCAPITALIZATION_NONE,
		autocorrect:false
	});
	email_text.addEventListener('return', function(e) {
		location_text.focus();
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
	
	var user_share_contacts_view = Ti.UI.createView({
		top:10,
		left:10,
		right:10,
		height : theme.tableDefaultHeight,
		width:Ti.UI.FILL,
		backgroundColor:theme.tableBackgroundColor,
		borderColor:theme.tableBorderColor,
		borderRadius:theme.defaultBorderRadius
	});
	AddHideKeyboardOnClick(user_share_contacts_view);
	main_scrollView.add(user_share_contacts_view);
	
	var user_share_contacts = new ui.Label('Share contacts', {
		top:10,
		left: 10,
		color : theme.textColor,
		font : theme.defaultFontBold
	});
	AddHideKeyboardOnClick(user_share_contacts);
	user_share_contacts_view.add(user_share_contacts);
	
	var user_share_contacts_switch = Ti.UI.createSwitch({
		right:10,
		value:true
	});
	user_share_contacts_view.add(user_share_contacts_switch);
	
	var user_location = new ui.Label('Location', {
		top:10,
		color: theme.textColor,
		left: 10,
		font: theme.defaultFontBold
	});
	AddHideKeyboardOnClick(user_location);
	main_scrollView.add(user_location);
	
	var location_text = Ti.UI.createTextField({
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
		hintText:'Where are you from',
		autocapitalization:Ti.UI.TEXT_AUTOCAPITALIZATION_NONE,
		autocorrect:true,
		txtUpdating:false
	});
	location_text.addEventListener('return', function(e) {
		if(saveButton){
			saveButton.fireEvent('click');
		}
	});
	location_text.addEventListener('focus', function(e) {
		focusedText = this;
	});
	location_text.addEventListener('blur', function(e) {
		focusedText = null;
	}); 
	location_text.addEventListener('change', function(e) {
		if(this.txtUpdating === false){
			this.txtUpdating = true;
			if(e.value.length > 50){
				this.value = e.value.substr(0, 50);
			}	
			this.txtUpdating = false;
		}
	});
	main_scrollView.add(location_text);
	
	function trimWhiteSpaces(s) {
		s = s.replace(/(^\s*)|(\s*$)/gi,"");
		s = s.replace(/[ ]{2,}/gi," ");
		s = s.replace(/\n /,"\n");
		return s;
	}
	
	var currentUser = null;
	function saveProfileChanges() {
		if(!currentUser){
			return;
		}
		
		var updateJSON = {
			email : trimWhiteSpaces(email_text.value)
		};
		
		updateJSON.custom_fields = {};
		
		username_text.value = trimWhiteSpaces(username_text.value);
		if(username_text.value !== ''){
			var _ = require('/lib/underscore'),
				_s = require('/lib/underscore_strings');
				
			var _name_titleize = _s.titleize(username_text.value);
			
			updateJSON.username = _name_titleize + common.userUniqValue + new Date().valueOf();
			updateJSON.custom_fields.display_name = _name_titleize;
		}
		
		updateJSON.custom_fields.bio = trimWhiteSpaces(bio_text.value);
		updateJSON.custom_fields.phone_number = trimWhiteSpaces(phone_text.value);
		updateJSON.custom_fields.location = trimWhiteSpaces(location_text.value);
		updateJSON.custom_fields.share_contacts = user_share_contacts_switch.value;
		
		if (fbUserData && fbUserData.id) { 
			updateJSON.custom_fields.fb_user_id = 'https://graph.facebook.com/' + fbUserData.id + '/picture';
		}
		
		var actIndicator = require('/ui/ActivityIndicator');
		var indicator = new actIndicator();
		if(_photo !== null){
			var photosModel = require('/lib/model/photos');
			indicator.showModal('Uploading photo...', 60000, 'Timeout uploading photo!');
			photosModel.create(_photo, function(_photoEvent) {
				indicator.hideModal();
				if (_photoEvent.success) {
					updateJSON.photo_id = _photoEvent.photos[0].id;
					updateUserDetails(updateJSON);
				} else {
					Model.eventDefaultErrorCallback(_photoEvent);
				}
			}); 
		}
		else{
			if(remove_photo){
				updateJSON.photo = null;
			}
			updateUserDetails(updateJSON);
		}
		
		function updateUserDetails(_updateParmas){
			var UsersModel = require('/lib/model/users');

			indicator.showModal('Updating profile...', 60000, 'Timeout updating profile!');
			UsersModel.update(_updateParmas, function(updateEvent){
				indicator.hideModal();
				if(updateEvent.success){
					currentUser = updateEvent.users[0];
					Ti.App.Properties.setString('carely_user', JSON.stringify(updateEvent.users[0]));
					
					common.refreshHandler.setRefresh.users(true);
					common.refreshHandler.setRefresh.news(true);
					common.refreshHandler.setRefresh.leaderboard(true);
					
					Model.AppCache.users.set(updateEvent.users[0]);
					
					require('/ui/MasterWindow').getNavGroup().close(self);
				}
				else{
					Model.eventDefaultErrorCallback(updateEvent);
				}
			});
		}
	};
	
	function setUserDetails(){
		if (currentUser){
			if(currentUser.photo && currentUser.photo.urls) {
				if(currentUser.photo.urls.thumb_100){
					user_pic.applyProperties({
						image : currentUser.photo.urls.thumb_100
					});
				}
				else if(currentUser.photo.urls.square_75){
					user_pic.applyProperties({
						image : currentUser.photo.urls.square_75
					});
				}
			}
			
			var uname = common.getUserDisplayName(currentUser);
			if(uname){
				username_text.value = uname;
			}
			if(currentUser.email){
				email_text.value = currentUser.email;
			}
			if(currentUser.custom_fields){
				if(currentUser.custom_fields.share_contacts !== undefined){
					if(currentUser.custom_fields.share_contacts === true){
						user_share_contacts_switch.value = true;
					}
					else{
						user_share_contacts_switch.value = false;
					}
				}
				
				if(currentUser.custom_fields.bio){
					bio_text.value = currentUser.custom_fields.bio;
				}
				if(currentUser.custom_fields.phone_number){
					phone_text.value = currentUser.custom_fields.phone_number;
				}
				if(currentUser.custom_fields.location){
					location_text.value = currentUser.custom_fields.location;
				}
				else{
					var coords = Ti.App.Properties.getList('CarelyGeoCoordinates', null);
					if(coords !== null){
						Ti.Geolocation.reverseGeocoder(coords[1], coords[0], function(reverseGeoEvent) {
							if (reverseGeoEvent.success) {
								location_text.value = reverseGeoEvent.places.address;
							}
						});
					}
				}
			}
		}		
	}
	
	function fetchUser(){
		
		currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
		if(currentUser){
			setUserDetails();
		}
		else{
			var UsersModel = require('/lib/model/users'), 
				actIndicator = require('/ui/ActivityIndicator');

			var indicator = new actIndicator();
			indicator.showModal('Getting user details', 10000, 'Timeout while getting user details!');
			UsersModel.current(function(e) {
				indicator.hideModal();
				if (e.success) {
					currentUser = e.users[0];
					Ti.App.Properties.setString('carely_user', JSON.stringify(currentUser));
					setUserDetails();
				} else {
					Model.eventDefaultErrorCallback(e);
				}
			});
		}
	}
	
	self.addEventListener('open', function(e){
		fetchUser();
		
		require('/lib/analytics').trackScreen({ screenName : self.title });
	});
	
	return self;
}

module.exports = ProfileView;