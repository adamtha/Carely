function InfluencerSettingsWindow() {
	var theme = require('/ui/theme'),
		_ = require('/lib/underscore'),
		common = require('/lib/common'),
		Model = require('/lib/model/model'),
		facebookModule = require('facebook');
	
	facebookModule.appid = common.FACEBOOK_APP_ID;
	facebookModule.permissions = common.FACEBOOK_APP_PERMISSIONS;
	facebookModule.forceDialogAuth = false;
	
	var currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
	var self = Ti.UI.createWindow({
		title:'Activity List',
		navBarHidden:false,
		tabBarHidden:true,
		barColor:theme.barColor,
		backgroundColor:theme.defaultBgColor,
		orientationModes : [Ti.UI.PORTRAIT]
	});
		
	var header_view = Ti.UI.createView({
		height:Ti.UI.SIZE,
		width:Ti.UI.FILL,
		layout:'vertical'
	});
	
	var activity_list_top_title = Ti.UI.createLabel({
		top:4,
		left:10,
		right:10,
		width:Ti.UI.FILL,
		text:'To create an Activity List simply permanently suggest activities. Optional settings:',
		font:theme.defaultToolTipFont,
		color:theme.textColor
	});
	header_view.add(activity_list_top_title);
	
	var activity_list_title = Ti.UI.createLabel({
		top:10,
		left:10,
		right:10,
		width:Ti.UI.FILL,
		text:'Name your list',
		font:theme.defaultFontBold,
		color:theme.textColor
	});
	header_view.add(activity_list_title);
	
	var activity_list_subtitle = Ti.UI.createLabel({
		top:4,
		left:10,
		right:10,
		width:Ti.UI.FILL,
		text:'Give your activity list a separate name from your own user name by entering:',
		font:theme.defaultToolTipFont,
		color:theme.textColor
	});
	header_view.add(activity_list_subtitle);
		
	var activity_list_view = Ti.UI.createView({
		height : theme.borderedImage.big.height + 12,
		width : Ti.UI.FILL,
		backgroundImage : theme.images.rowBox.normal
	});
	header_view.add(activity_list_view);

	var activity_list_icon = Ti.UI.createImageView({
		image : theme.images.uploadImage,
		width : theme.borderedImage.big.width,
		height : theme.borderedImage.big.height,
		left : 5,
		top : 4,
		bottom : 8,
		hires : true,
		onlineSavedPhoto : null,
		setEmptyPhoto : false
	});
	if(currentUser && currentUser.custom_fields && currentUser.custom_fields['[ACS_Photo]activity_list_photo_id'] &&
	   currentUser.custom_fields['[ACS_Photo]activity_list_photo_id'][0] && currentUser.custom_fields['[ACS_Photo]activity_list_photo_id'][0].urls && currentUser.custom_fields['[ACS_Photo]activity_list_photo_id'][0].urls.square_75){
		activity_list_icon.image = currentUser.custom_fields['[ACS_Photo]activity_list_photo_id'][0].urls.square_75;
	}
	activity_list_view.add(activity_list_icon);

	var activity_list_icon_change_view = Ti.UI.createLabel({
		top : 2,
		left : 2,
		right : 2,
		backgroundColor : '#000',
		height : 'auto',
		width : Ti.UI.FILL,
		opacity : 0.65,
		text : 'Change',
		font : theme.defaultFont,
		color : '#fff',
		textAlign : Ti.UI.TEXT_ALIGNMENT_CENTER
	});
	activity_list_icon.add(activity_list_icon_change_view);

	var activity_list_name_view = Ti.UI.createView({
		top : 2,
		left : activity_list_icon.left + activity_list_icon.width + 6,
		layout : 'vertical',
		width : Ti.UI.FILL,
		height : Ti.UI.FILL
	});
	activity_list_view.add(activity_list_name_view);

	var activity_list_name = Ti.UI.createLabel({
		top : 0,
		left : 0,
		text : 'Activity list name:',
		font : theme.defaultFontBold,
		color : theme.darkFontColor,
		textAlign : Ti.UI.TEXT_ALIGNMENT_LEFT
	});
	activity_list_name_view.add(activity_list_name);

	var activity_list_txt = Ti.UI.createTextField({
		top : 0,
		left : 0,
		right:4,
		paddingLeft : 4,
		value : '',
		width : Ti.UI.FILL,
		height : 30,
		font : theme.defaultFont,
		color : theme.darkFontColor,
		textAlign : Ti.UI.TEXT_ALIGNMENT_LEFT,
		appearance : Ti.UI.KEYBOARD_APPEARANCE_ALERT,
		returnKeyType : Ti.UI.RETURNKEY_DONE,
		borderColor : theme.tableBorderColor,
		borderRadius : theme.defaultBorderRadius,
		backgroundColor : '#fff',
		hintText : 'e.g. Sam\'s Yoga Tips',
		autocapitalization : Ti.UI.TEXT_AUTOCAPITALIZATION_SENTENCES,
		autocorrect : true,
		clearButtonMode : Ti.UI.INPUT_BUTTONMODE_ONFOCUS,
		txtUpdating : false
	});
	activity_list_txt.addEventListener('change', function(e) {
		if (e) {
			e.cancelBubble = true;
		}
		if (this.txtUpdating === false) {
			this.txtUpdating = true;
			if (e.value.length > 26) {
				this.value = e.value.substr(0, 26);
			}
			this.txtUpdating = false;
		}
	});
	if(currentUser && currentUser.custom_fields && currentUser.custom_fields.activity_list_name &&
	   currentUser.custom_fields.activity_list_name.length){
		activity_list_txt.value = currentUser.custom_fields.activity_list_name;
	}
	activity_list_name_view.add(activity_list_txt);

	var activity_list_comment = Ti.UI.createLabel({
		top : 0,
		left : 0,
		text : 'Your username will appear near it',
		font : theme.defaultToolTipFont,
		color : theme.lightFontColor,
		textAlign : Ti.UI.TEXT_ALIGNMENT_LEFT
	});
	if(currentUser && currentUser.custom_fields && currentUser.custom_fields.suggesting_actions &&
	   currentUser.custom_fields.suggesting_actions.length){
	   	var uname = common.getUserDisplayName(currentUser);
		
		activity_list_comment.text = currentUser.custom_fields.suggesting_actions.length + ' Activities \u00B7 By ' + uname;
	}
	activity_list_name_view.add(activity_list_comment); 
	
	var _photo = null,
		photo_options_dialog = {
			options : ['Take a Photo', 'Select From Gallery', 'Search Online', 'Set Empty', 'Cancel'],
			cancel : 4
		};
	
	activity_list_icon.addEventListener('click', function(e){
		var photo_dialog = Ti.UI.createOptionDialog(photo_options_dialog);
		photo_dialog.addEventListener('click', function(dialogEvent) {
			if(dialogEvent.index === photo_options_dialog.cancel){
				return;
			}
			
			var selected_val = photo_options_dialog.options[dialogEvent.index];
			
			require('/lib/analytics').trackEvent({
				category : 'activity list',
				action :'photo',
				label : selected_val,
				value : null
			}); 

			switch(selected_val){
				case 'Take a Photo':
					_photo = null;
					// take a photo
					Ti.Media.showCamera({
						success : function(cameraEvent) {
							if (cameraEvent.mediaType === Ti.Media.MEDIA_TYPE_PHOTO) {
								var ImageFactory = require('ti.imagefactory');
								_photo = ImageFactory.imageAsResized(cameraEvent.media, {
									width : 75,
									height : 75
								});
								//_photo = ImageFactory.compress(_photo, 0.75);
								activity_list_icon.applyProperties({
									image : _photo
								});
							}
						},
						cancel : function(cameraEvent) {
						},
						error : function(cameraEvent) {
							// if(cameraEvent.code === Ti.Media.NO_CAMERA){
							// alert('Please run on device!');
							// }
							// else{
							// alert('unexpected error: ' + cameraEvent.code);
							// }
						},
						saveToPhotoGallery : true,
						allowEditing : false,
						mediaTypes : [Ti.Media.MEDIA_TYPE_PHOTO]
					});
					break;
				case 'Select From Gallery':
					_photo = null;
					// select existing photo
					Ti.Media.openPhotoGallery({
						success : function(galleryEvent) {
							if (galleryEvent.mediaType === Ti.Media.MEDIA_TYPE_PHOTO) {
								var ImageFactory = require('ti.imagefactory');
								_photo = ImageFactory.imageAsResized(galleryEvent.media, {
									width : 75,
									height : 75
								});
								//_photo = ImageFactory.compress(_photo, 0.0);
								activity_list_icon.applyProperties({
									image : _photo
								});
							}
						},
						cancel : function(galleryEvent) {
						},
						error : function(galleryEvent) {
							// if(galleryEvent.code === Ti.Media.NO_CAMERA){
							// alert('Please run on device!');
							// }
							// else{
							// alert('unexpected error: ' + galleryEvent.code);
							// }
						},
						allowEditing : false,
						mediaTypes : [Ti.Media.MEDIA_TYPE_PHOTO]
					});
					break;
				case 'Search Online':
					_photo = null;
					activity_list_icon.onlineSavedPhoto = null;
					activity_list_icon.image = theme.images.uploadImage;
					
					var RemoteImagesWindow = require('/ui/RemoteImagesWindow');
					var w = new RemoteImagesWindow({
						title : 'Search Online',
						query : activity_list_txt.value,
						photo : activity_list_icon
					});
					w.open({
						animated : true
					});
					break;
				case 'Set Empty':
					_photo = null;
					activity_list_icon.applyProperties({
						image : theme.images.uploadImage,
						setEmptyPhoto : true
					});
					break;
				default:
					break;
			}
		});
		photo_dialog.show();
	});
	
	var fb_title = Ti.UI.createLabel({
		top:10,
		left:10,
		right:10,
		width:Ti.UI.FILL,
		text:'Link list to Facebook page',
		font:theme.defaultFontBold,
		color:theme.textColor
	});
	header_view.add(fb_title);
	
	var fb_subtitle = Ti.UI.createLabel({
		top:4,
		left:10,
		right:10,
		width:Ti.UI.FILL,
		text:'People who Like your Facebook page will automatically follow you on ' + Ti.App.name + ' and will receive your suggested activities. When they share these activities to Facebook, that post will link back to your Facebook page',
		font:theme.defaultToolTipFont,
		color:theme.textColor
	});
	header_view.add(fb_subtitle);
	
	var select_title = Ti.UI.createLabel({
		top:10,
		left:10,
		right:10,
		width:Ti.UI.FILL,
		text:'Select page',
		font:theme.defaultFontBold,
		color:theme.textColor
	});
	header_view.add(select_title);
	
	var header_view_divider = Ti.UI.createView({
		top:2,
		height : 1,
		width : Ti.UI.FILL,
		backgroundColor : '#9CC3DD'
	});
	header_view.add(header_view_divider);
	
	var footer_view = Ti.UI.createView({
		height:Ti.UI.SIZE,
		width:Ti.UI.FILL,
		layout:'vertical'
	});
	
	var influencer_url = Ti.UI.createLabel({
		top:10,
		left:10,
		right:10,
		height:30,
		width:Ti.UI.FILL,
		text:'Learn more...',
		font:theme.defaultFontBold,
		textAlign:Ti.UI.TEXT_ALIGNMENT_CENTER,
		color:theme.urlColor
	});
	influencer_url.addEventListener('touchstart', function(e) {
		influencer_url.color = theme.urlColorClicked;
	}); 
	influencer_url.addEventListener('click', function(e){
		if(e){
			e.cancelBubble = true;
		}
		
		influencer_url.color = theme.urlColor;
		
		if (this.clickTime && (new Date() - this.clickTime < 1000)) {
			return false;
		}
		this.clickTime = new Date();
		
		var urlWebView = require('/lib/urlWebView');
		var urlWin = new urlWebView('http://care.ly/suggest', 'Carely', null, false);
		require('/ui/MasterWindow').getNavGroup().open(urlWin);
		
		require('/lib/analytics').trackEvent({
			category : 'url',
			action : 'click',
			label : 'http://care.ly/suggest',
			value : null
		});
	});
	footer_view.add(influencer_url);
	
	var defaultRowHeight = theme.borderedImage.user.height + 8;
	var facebook_connect_row = createConnectToFacebookRow(),
		noPages_row = createFacebookPageRow({ name:'No pages found', icon:theme.images.facebook_off }),
		loading_row = Titanium.UI.createTableViewRow({
		height:30,
		backgroundColor:theme.defaultBgColor
	});
	
	var act_Ind = Titanium.UI.createActivityIndicator({
		left : '43%',
		top : 5,
		height : 'auto',
		width : 'auto',
		color : theme.textColor,
		font : theme.defaultFont,
		style : Titanium.UI.iPhone.ActivityIndicatorStyle.DARK
	});
	act_Ind.show();
	loading_row.add(act_Ind);
	
	var selected_row = null, can_set_empty_influencer = false;
	
	var tableView = Ti.UI.createTableView({
		data : [loading_row],
		top : 0,
		headerView:header_view,
		footerView : footer_view,
		width : Ti.UI.FILL,
		style : Ti.UI.iPhone.TableViewStyle.PLAIN,
		separatorStyle : Ti.UI.iPhone.TableViewSeparatorStyle.NONE,
		bubbleParent:false
	});
	tableView.addEventListener('singletap', function(e){
		
		if(e && e.row){
			e.cancelBubble = true;
			
			if(e.row.fb_connect){
				ConncetFacebook();
			}
			else if(e.row.page_id){
				e.row.hasCheck = !e.row.hasCheck;
				
				require('/lib/analytics').trackEvent({
					category : 'activity list',
					action :'facebook page',
					label : e.row.page_link,
					value : e.row.hasCheck ? 1 : 0
				});
				 
				if(selected_row){
					selected_row.hasCheck = false;
				}
				if(e.row.hasCheck){
					selected_row = e.row;
				}
				else{
					can_set_empty_influencer = true;
					selected_row = null;
				} 
			}
		}
	});
	self.add(tableView);  
	
	function createConnectToFacebookRow() {
		var row = Ti.UI.createTableViewRow({
			height : defaultRowHeight,
			width : Ti.UI.FILL,
			backgroundImage : theme.images.rowBox.normal,
			selectionStyle : Ti.UI.iPhone.TableViewCellSelectionStyle.NONE,
			fb_connect : true,
			className : 'FacebookAdmin_Row'
		});

		var row_view = Ti.UI.createView({
			height : Ti.UI.FILL,
			width : Ti.UI.FILL
		});
		row.add(row_view);

		var icon = Ti.UI.createImageView({
			image : theme.images.facebook_icon,
			width : 32,
			height : 32,
			left : 2,
			top : 3,
			hires : true
		});
		row_view.add(icon);

		var name = Ti.UI.createLabel({
			top : 0,
			left : icon.left + icon.width + 6,
			right : 6,
			height : Ti.UI.FILL,
			width : Ti.UI.FILL,
			text : 'Connect to Facebook',
			font : theme.defaultFontBold,
			color : theme.barColor,
			textAlign : Ti.UI.TEXT_ALIGNMENT_LEFT
		});
		row_view.add(name);

		return row;
	}

	function createFacebookPageRow(_item){	
		var row = null;
		if(_item && _item.id && _item.name && _item.is_published){
			row = Ti.UI.createTableViewRow({
				height : defaultRowHeight,
				width : Ti.UI.FILL,
				backgroundImage : theme.images.rowBox.normal,
				selectionStyle : Ti.UI.iPhone.TableViewCellSelectionStyle.NONE,
				page_id:_item.id,
				page_link:_item.link,
				hasCheck:false,
				pageJSON:_item,
				className : 'FacebookAdmin_Row'
			});
			
			var row_view = Ti.UI.createView({
				height : Ti.UI.FILL,
				width : Ti.UI.FILL
			});
			row.add(row_view);
			
			var pageIcon = theme.images.facebook_icon;
			if(_item.icon){
				pageIcon = _item.icon; 
			}
			else if(_item.picture && _item.picture.data && _item.picture.data.url && _item.picture.data.is_silhouette === false){
				pageIcon = _item.picture.data.url
			}
			
			var icon = Ti.UI.createImageView({
				image : pageIcon,
				width : theme.borderedImage.user.width,
				height : theme.borderedImage.user.height,
				left : 2,
				top : 4,
				hires : true
			});
			row_view.add(icon);
	
			var pageName = Ti.UI.createLabel({
				top : 0,
				left : icon.left + icon.width + 6,
				right : 6,
				height:20,
				text : _item.name,
				font : theme.defaultToolTipFont,
				color : theme.textColor,
				textAlign : Ti.UI.TEXT_ALIGNMENT_LEFT
			});
			row_view.add(pageName);
	
			if(_item.about){
				var pageDesc = Ti.UI.createLabel({
					top : 22,
					left : icon.left + icon.width + 6,
					right : 6,
					text : _item.about,
					font : {
						fontSize : 12,
						fontFamily : theme.fontFamily
					},
					color : theme.lightFontColor,
					textAlign : Ti.UI.TEXT_ALIGNMENT_LEFT
				});
				row_view.add(pageDesc);
			}
			
			if(!currentUser){
				currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
			}
			if(currentUser && currentUser.custom_fields && currentUser.custom_fields.influencer_id === _item.id){
			   	row.hasCheck = true;
			   	selected_row = row;
			}
		}
		
		return row;
	}
	
	function createFacebookPageRows(_items){
		var rows = [];
		if(_items && _items.length){
			for(var i=0,v=_items.length; i<v; i++){
				var row = createFacebookPageRow(_items[i]);
				if(row){
					rows.push(row);
				}
			}
		}
		return rows;
	}
	
	function getFacebookPageLikes(){

		facebookModule.requestWithGraphPath('me/likes', {
			fields : 'id,link,name,about,is_published,picture',
			limit : 100,
			offset : 0
		}, 'GET', function(fbLikesEvent) {
			try{
				var fb_likes = [];
				if (fbLikesEvent.success && fbLikesEvent.result) {
					var likes = JSON.parse(fbLikesEvent.result);
					if (likes && likes.data && likes.data.length > 0) {
						for (var i = 0, v = likes.data.length; i < v; i++) {
							if (likes.data[i].id && likes.data[i].name && likes.data[i].is_published) {
								fb_likes.push(likes.data[i]);
							}
						}
					}
				}
				if (fb_likes && fb_likes.length > 0) {
					require('/lib/analytics').trackEvent({
						category : 'activity list',
						action :'my likes',
						label : null,
						value : fb_likes.length
					});
					
					var pageRows = createFacebookPageRows(fb_likes);
					if(pageRows && pageRows.length){
						tableView.setData(pageRows);
					}
					else{
						tableView.setData([noPages_row]);
					}
				}
				else{
					tableView.setData([noPages_row]);
				}
			}catch(err){
				tableView.setData([noPages_row]);
			}
			finally{
				
			}
		});
	}
	
	function ConncetFacebook(){
		var facebookListener = function(e) {
			tableView.setData([loading_row]);
			
			if (e) {
				e.cancelBubble = true;
			}
			try {
				if (e.success) {
					if (e.data && e.data.email && e.data.email.length > 0) {
						Ti.App.Properties.setString('carely_user_facebook', JSON.stringify(e.data));
						
						var socialModel = require('/lib/model/social'), actIndicator = require('/ui/ActivityIndicator');
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

								getFacebookPageLikes();
								
							} else {
								tableView.setData([facebook_connect_row]);
								
								Model.eventDefaultErrorCallback(linkEvent);
							}
						});
					}
				}
				else{
					tableView.setData([facebook_connect_row]);
					if (e.error) {
						Model.eventDefaultErrorCallback(e);
					}
				}
			} catch(err) {
				tableView.setData([facebook_connect_row]);
			} finally {
				facebookModule.removeEventListener('login', facebookListener);
			}
		}
		facebookModule.addEventListener('login', facebookListener);

		if (facebookModule.loggedIn) {
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
	
	if (facebookModule.loggedIn) {
		getFacebookPageLikes();
	}
	else{
		var non_fb_rows = [];
		if(!currentUser){
			currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
		}
		if(currentUser && currentUser.custom_fields && currentUser.custom_fields.influencer_json){
			var pageRow = createFacebookPageRow(JSON.parse(currentUser.custom_fields.influencer_json));
			if(pageRow){
				non_fb_rows.push(pageRow);
			}
		}
		
		non_fb_rows.push(facebook_connect_row);
		
		tableView.setData(non_fb_rows);
		non_fb_rows = null;
	}
	
	function updateUserSettings(_update_params){
		var UsersModel = require('/lib/model/users');
		UsersModel.update(_update_params, function(updateEvent) {
			if (updateEvent.success) {
				Ti.App.Properties.setString('carely_user', JSON.stringify(updateEvent.users[0]));
				Model.AppCache.users.set(updateEvent.users[0]);
			} else {
				Model.eventDefaultErrorCallback(updateEvent);
			}
		});
	}
	
	self.addEventListener('focus', function(e){
		require('/lib/analytics').trackScreen({ screenName : self.title });
	});
	
	self.addEventListener('close', function(e){
		var need_update = false, 
			_influencer_json = null, 
			update_params = {
				custom_fields : {}
			};
		if(selected_row && selected_row.pageJSON){
			_influencer_json = selected_row.pageJSON;
		}
		if(!currentUser){
			currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
		}
		if(currentUser && currentUser.custom_fields){
			if(_influencer_json){
				if(!currentUser.custom_fields.influencer_id){
					need_update = true;
				}
				else if(currentUser.custom_fields.influencer_id !== _influencer_json.id){
					need_update = true;
				}
			}
			else{
				if(can_set_empty_influencer && currentUser.custom_fields.influencer_id){
					need_update = true;
				}
			}
			
			if(activity_list_txt.value.length){
				if(activity_list_txt.value !== currentUser.custom_fields.activity_list_name){
					need_update = true;
					update_params.custom_fields.activity_list_name = activity_list_txt.value;
				}
			}
			else{
				if(currentUser.custom_fields.activity_list_name){
					need_update = true;
					update_params.custom_fields.activity_list_name = null;
				}
			}
		}
		
		if(need_update){
			require('/lib/analytics').trackEvent({
				category : 'activity list',
				action :'update facebook page',
				label : _influencer_json ? _influencer_json.link : null,
				value : _influencer_json ? 1 : 0
			});
					
			if(_influencer_json){
				update_params.custom_fields.influencer_json = _influencer_json;
				update_params.custom_fields.influencer_id = _influencer_json.id;
				update_params.custom_fields.influencer_link = _influencer_json.link;
			}
			else{
				update_params.custom_fields.influencer_id = null;
				update_params.custom_fields.influencer_link = null;
				update_params.custom_fields.influencer_json = null;
			}
		}
		
		if (activity_list_icon.onlineSavedPhoto !== null) {
			_photo = activity_list_icon.onlineSavedPhoto;
		}
		
		if(activity_list_icon.setEmptyPhoto){
			update_params.custom_fields['[ACS_Photo]activity_list_photo_id'] = null;
		}
		
		if(_photo !== null){
			var photosModel = require('/lib/model/photos');
			photosModel.create(_photo, function(_photoEvent) {
				if (_photoEvent.success) {
					update_params.custom_fields['[ACS_Photo]activity_list_photo_id'] = _photoEvent.photos[0].id;
					updateUserSettings(update_params);
				} else {
					Model.eventDefaultErrorCallback(_photoEvent);
				}
			});
		}
		else{
			if(need_update){
				updateUserSettings(update_params);
			}
		}
	});
	
	return self;
}
module.exports = InfluencerSettingsWindow;