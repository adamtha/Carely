
function CheckinWindow(_actionId, _suggestion_id, _suggester_id, _checkin_type){
	var _ = require('/lib/underscore'),
		_s = require('/lib/underscore_strings'),
		theme = require('/ui/theme'), 
		ui = require('/ui/components'),
		moment = require('/lib/date/moment'),
		Model = require('/lib/model/model'),
		PostsModel = require('/lib/model/posts'),
		common = require('/lib/common'),
		facebookModule = require('facebook');
	
	facebookModule.appid = common.FACEBOOK_APP_ID;
	facebookModule.permissions = common.FACEBOOK_APP_PERMISSIONS;
	facebookModule.forceDialogAuth = false;
	
	var _item = Model.AppCache.actions.get(_actionId);
	var isAndroid = Ti.Platform.osname === 'android';
	var currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
	var List_tag = JSON.parse(Ti.App.Properties.getString('List_tag', null));
	
	function blurText(){
		if(checkin_comment.gotFocus === true){
			checkin_comment.blur();
		}
	}
	function AddHideKeyboardOnClick(_item){
		_item.addEventListener('click', blurText);
	}
	
	if(!_checkin_type || _checkin_type > 3){
		_checkin_type = 0;
	}
	
	var _checkin_types = [
		{
			title:'Do it',
			intent:PostsModel.intents.checkin,
			plural:'doing it',
			recent:'CHECKINS',
			button:{
				text:'Do it',
				icon:{
					normal:theme.images.news.checkin,
					selected:theme.images.news.checkin_dark
				}
			}
		},
		{
			title:'Plan it',
			intent:PostsModel.intents.plan,
			plural:'plans it',
			recent:'PLANS',
			button:{
				text:'Plan',
				icon:{
					normal:theme.images.news.plan,
					selected:theme.images.news.plan_dark
				}
			}
		},
		{
			title:'Want it',
			intent:PostsModel.intents.want,
			plural:'wants it',
			recent:'WANTS',
			button:{
				text:'Want',
				icon:{
					normal:theme.images.news.heart,
					selected:theme.images.news.heart_dark
				}
			}
		},
		{
			title:'Talk about it',
			intent:PostsModel.intents.talk,
			plural:'talking about it',
			recent:'DISCUSSIONS',
			button:{
				text:'Talk',
				icon:{
					normal:theme.images.news.talk,
					selected:theme.images.news.talk_dark
				}
			}
		}
	];
	
	var self = Ti.UI.createWindow({
		title: _checkin_types[_checkin_type].title,
		navBarHidden : isAndroid,
		backgroundColor: theme.winBgColor,
		orientationModes : [Ti.UI.PORTRAIT]
	});
	AddHideKeyboardOnClick(self);
	
	if(isAndroid){
		
	}
	else{
		self.barColor = theme.barColor;
		
		var actionButton = Ti.UI.createButton({
				systemButton:Ti.UI.iPhone.SystemButton.ACTION
		});
		actionButton.addEventListener('click', function(e){			
			var action_options = {
				options : []
			};
			var action_importance_value = 0;
			if(_item && _item.custom_fields && _item.custom_fields.importance){
				action_importance_value = _item.custom_fields.importance + 0;
			}
			
			var _is_admin = false,
				_is_owner = false,
				_list_tag_name = 'Current list';
			
			if(currentUser && currentUser.admin === 'true' && currentUser.custom_fields && currentUser.custom_fields.show_admin_features !== false){
				_is_admin = true;
			}
			else if(_item && _item.user && currentUser && _item.user.id === currentUser.id){
				_is_owner = true;
			}
			
			if(List_tag && List_tag.id && !List_tag.all_activities){
				
				if(List_tag.name){
					_list_tag_name = List_tag.name;
				}
				
				if(_item.custom_fields['list_tag_' + List_tag.id]){
					if(_is_admin || _is_owner || 
					   (currentUser && currentUser.id === _item.custom_fields['list_tag_' + List_tag.id])){
						action_options.options.push('Remove from ' + _list_tag_name);
					}
				}
				else{
					if(List_tag.is_private){
						if(_is_admin ||
						   (List_tag.user && currentUser && currentUser.id === List_tag.user.id)){
							action_options.options.push('Add to ' + _list_tag_name);
						}
					}
					else{
						action_options.options.push('Add to ' + _list_tag_name);
					}
				}
			}
			
			if(_is_admin){
				action_options.options.push('Edit activity');
				action_options.options.push('Delete activity');
				action_options.options.push('Increase to ' + (action_importance_value + 1));
				action_options.options.push('Decrease to ' + (action_importance_value - 1));
			}
			else if(_is_owner){
				action_options.options.push('Edit activity');
			}
			
			if (currentUser && currentUser.custom_fields && currentUser.custom_fields.my_actions &&
				currentUser.custom_fields.my_actions.indexOf(_actionId) > -1) {
					action_options.options.push('Remove from Favorites');
			}
			else if(currentUser && currentUser.custom_fields && currentUser.custom_fields.my_actions && 
				currentUser.custom_fields.my_actions.length < common.max_actions.user){
				action_options.options.push('Add to Favorites');
				
				if(_suggestion_id){
					action_options.options.push('Remove from Suggested');
				}
			}
			action_options.options.push('Suggest to followers');
			action_options.options.push('Cancel');
			action_options.cancel = action_options.options.length - 1;
			
			var action_dlg = Ti.UI.createOptionDialog(action_options);
			action_dlg.addEventListener('click', function(dialogEvent){
				var action_importance = 0;
				if(_item && _item.custom_fields && _item.custom_fields.importance){
					action_importance = _item.custom_fields.importance + 0;
				}
				if(dialogEvent.index !== dialogEvent.cancel){
					var option_text = action_options.options[dialogEvent.index];
					require('/lib/analytics').trackEvent({
						category : 'checkin',
						action : 'options',
						label : option_text,
						value : null
					});
					
					if(_s.startsWith(option_text, 'Increase to ')){
						option_text = 'Increase activity rank';
					}
					else if(_s.startsWith(option_text, 'Decrease to ')){
						option_text = 'Decrease activity rank';
					}
					else if(option_text === ('Add to ' + _list_tag_name)){
						option_text = 'Add to list tag';
					}
					else if(option_text === ('Remove from ' + _list_tag_name)){
						option_text = 'Remove from list tag';
					}
					
					var list_tag_id = undefined;
					switch(option_text){
						case 'Remove from list tag':
							list_tag_id = null;
						case 'Add to list tag':
							if(list_tag_id !== null){
								if(currentUser && currentUser.id){
									list_tag_id = currentUser.id;
								}
								else{
									return false;
								}
							}
							
							var updateJSON = {
								event_id : _item.id,
								custom_fields : {}
							};
							updateJSON.custom_fields['list_tag_' + List_tag.id] = list_tag_id;
							
							var ActionsModel = require('/lib/model/actions');
							ActionsModel.update(updateJSON, function(updateEvent) {
								if (updateEvent.success) {
									common.refreshHandler.setRefresh.actions(true);
									_item = updateEvent.events[0];
									Model.AppCache.actions.set(updateEvent.events[0]);
									
									PostsModel.queryPages({
										title : PostsModel.postTypes.lists_add,
										added_to_list_id : List_tag.id,
										event_id : _item.id
									}, null, 1, 1, function(queryPostEvent) {
										if (queryPostEvent.success) {
											if (queryPostEvent.meta.total_results > 0) {
												PostsModel.remove(queryPostEvent.posts[0].id, false, function(removeEvent) {
													if (removeEvent.success) {
														Model.AppCache.posts.del(queryPostEvent.posts[0].id);
														common.refreshHandler.setRefresh.news(true);
													} else {
														Model.eventDefaultErrorCallback(removeEvent);
													}
												});
											}
											
											if(list_tag_id){
												// added to list
												var post_count_id = _item.id + '_' + PostsModel.postTypes.checkin;
												var createParmas = {
													added_to_list_id : List_tag.id,
													done : { 
														total : others_label.totalResults + 1,
														me : currentUser.custom_fields[post_count_id] ? currentUser.custom_fields[post_count_id] : 0
													}
												};
												if(_suggester_id){
													createParmas['[ACS_User]suggester_id'] = _suggester_id;
												}
												PostsModel.create(_item.id, _item.name, null, PostsModel.postTypes.lists_add, createParmas, function(postEvent) {
													if (postEvent.success) {
														Model.AppCache.posts.set(postEvent.posts[0]);
														common.refreshHandler.setRefresh.news(true);
													} else {
														Model.eventDefaultErrorCallback(postEvent);
													}
												});
											}	
										} else {
											Model.eventDefaultErrorCallback(queryPostEvent);
										}
									});
								} else {
									Model.eventDefaultErrorCallback(updateEvent);
								}
							});
							break;
						case 'Edit activity':
							var NewActionWindow = require('/ui/NewActionWindow');
							var win = new NewActionWindow(_item.id, false, true);
							require('/ui/MasterWindow').getNavGroup().open(win);
							break;
						case 'Delete activity':
							var updateJSON = {
								event_id : _item.id,
								acl_name : 'actions_acl_deleted',
								custom_fields : {
									disabled:true
								}
							};
							var ActionsModel = require('/lib/model/actions');
							ActionsModel.update(updateJSON, function(updateEvent) {
								if (updateEvent.success) {
									common.refreshHandler.setRefresh.actions(true);
			
									Model.AppCache.actions.del(updateEvent.events[0]);
									
									require('/ui/MasterWindow').getNavGroup().close(self, { animated : true });
								} else {
									Model.eventDefaultErrorCallback(updateEvent);
								}
							});
							break;
						case 'Increase activity rank':
							action_importance += 2;
						case 'Decrease activity rank':
							action_importance -= 1;
							
							var updateJSON = {
								event_id : _item.id,
								custom_fields : {
									importance:action_importance
								}
							};
							var ActionsModel = require('/lib/model/actions');
							ActionsModel.update(updateJSON, function(updateEvent) {
								if (updateEvent.success) {
									common.refreshHandler.setRefresh.actions(true);
									_item = updateEvent.events[0];
									Model.AppCache.actions.set(updateEvent.events[0]);
									
								} else {
									Model.eventDefaultErrorCallback(updateEvent);
								}
							});
							break;
						case 'Add to Favorites':
							handleFavorites(true);
							break;
						case 'Remove from Favorites':
							handleFavorites(false);
							break;
						case 'Remove from Suggested':
							if(_suggestion_id){
								var ObjectsModel = require('/lib/model/objects');
								var suggestion_update_params = {};
								suggestion_update_params[currentUser.id] = 2;
								ObjectsModel.update(ObjectsModel.classNames.suggestions, 
									_suggestion_id, suggestion_update_params, null, null, function(updateEvent) {
									if (updateEvent.success) {
										common.refreshHandler.setRefresh.actions(true);
										
									} else {
										Model.eventDefaultErrorCallback(updateEvent);
									}
								});
							}
							break;
						case 'Suggest to followers':
								var SuggestActionWindow = require('/ui/SuggestActionWindow');
								var suggestActionWindow = new SuggestActionWindow(_item.id, _item.name);
								require('/ui/MasterWindow').getNavGroup().open(suggestActionWindow);
							break;
						default:
							break;
					}
				}
			});
			action_dlg.show();
		});
		self.rightNavButton = actionButton;
	}
	
	var addedAction = -1, my_action_preferences = [], my_deleted_actions_preferences = [], _my_action_suggestions = null;
	if (currentUser.custom_fields) {
		if (currentUser.custom_fields.my_actions) {
			my_action_preferences = currentUser.custom_fields.my_actions;
		}
		if (currentUser.custom_fields.my_deleted_actions) {
			my_deleted_actions_preferences = currentUser.custom_fields.my_deleted_actions;
		}
		if (currentUser.custom_fields.my_action_suggestions) {
			_my_action_suggestions = currentUser.custom_fields.my_action_suggestions;
		}
	}

	function handleFavorites(_add){
		var idx = my_action_preferences.indexOf(_item.id);
		if (_add) {
			if (idx === -1) {
				// add action
				my_action_preferences.splice(0, 0, _item.id);
				var dix = my_deleted_actions_preferences.indexOf(_item.id);
				if (dix > -1) {
					my_deleted_actions_preferences.splice(dix, 1);
				}
				addedAction = 0;
				
				if (_suggester_id) {
					if (_my_action_suggestions === null) {
						_my_action_suggestions = {};
					}
					_my_action_suggestions[_item.id] = _suggester_id;
				}
				
				currentUser.custom_fields.my_actions = my_action_preferences;
				currentUser.custom_fields.my_deleted_actions = my_deleted_actions_preferences;
				currentUser.custom_fields.my_action_suggestions = _my_action_suggestions;
				
				Ti.App.Properties.setString('carely_user', JSON.stringify(currentUser));

				common.refreshHandler.setRefresh.actions(true);
				
				common.showMessageWindow('Added to Favorites', 140, 140, 2000);
				
				if (_suggestion_id) {
					var ObjectsModel = require('/lib/model/objects');
					var suggestion_update_params = {};
					suggestion_update_params[currentUser.id] = 2;
					ObjectsModel.update(ObjectsModel.classNames.suggestions, _suggestion_id, suggestion_update_params, null, null, function(updateEvent) {
						if (updateEvent.success) {
							common.refreshHandler.setRefresh.actions(true);

						} else {
							Model.eventDefaultErrorCallback(updateEvent);
						}
					});
				}
			}
		} else {
			if (idx !== -1) {
				// remove action
				my_action_preferences.splice(idx, 1);
				if (my_deleted_actions_preferences.indexOf(_item.id) === -1) {
					my_deleted_actions_preferences.splice(0, 0, _item.id);
				}
				addedAction = 1;
				
				if(_my_action_suggestions && _my_action_suggestions[_item.id]){
					_my_action_suggestions[_item.id] = undefined;
				}
				
				currentUser.custom_fields.my_actions = my_action_preferences;
				currentUser.custom_fields.my_deleted_actions = my_deleted_actions_preferences;
				currentUser.custom_fields.my_action_suggestions = _my_action_suggestions;
				
				Ti.App.Properties.setString('carely_user', JSON.stringify(currentUser));

				common.refreshHandler.setRefresh.actions(true);
				
				common.showMessageWindow('Removed from Favorites', 140, 180, 2000);
			}
		}
	}
	
	var main_scrollView = Ti.UI.createScrollView({
		contentWidth: 'auto',
		contentHeight: 'auto',
		top: isAndroid ? 50 : 0,
		showVerticalScrollIndicator: true,
		showHorizontalScrollIndicator: true,
		scrollsToTop : true,
		scrollType: 'vertical',
		layout:'vertical',
		viewName: L('checkin', 'Check In')
	});
	AddHideKeyboardOnClick(main_scrollView);
	self.add(main_scrollView);
	
	var checkin_view = Ti.UI.createView({
		backgroundColor: theme.subBarColor,
		top:0,
		left:0,
		height:theme.borderedImage.small.height + 11,
		width:Ti.UI.FILL
	});
	AddHideKeyboardOnClick(checkin_view);
	main_scrollView.add(checkin_view);
	
	var actionIcon = theme.defaultIcons.action;
	if (_item && _item.photo && _item.photo.urls && _item.photo.urls.square_75) {
		actionIcon = _item.photo.urls.square_75;
	} else if (_item && _item.icon) {
		actionIcon = _item.icon;
	}

	var checkin_pic = new ui.ImageViewBordered(actionIcon, {
		width : theme.borderedImage.small.width,
		height : theme.borderedImage.small.height,
		left: 5,
		top: 5,
		hires:true
	}); 
	AddHideKeyboardOnClick(checkin_pic);
	checkin_view.add(checkin_pic);
					
	var header_view = Ti.UI.createView({
		left: checkin_pic.left + checkin_pic.width + 5,
		top:2,
		bottom:0,
		height:checkin_view.height - 5,
		width:Ti.UI.FILL
	});
	AddHideKeyboardOnClick(header_view);
	checkin_view.add(header_view);
	
	var checkin_title = Ti.UI.createLabel({
		text: _item.name,
		color: '#fff',
		top: 0,
		left: 0,
		font : {
			fontSize : 20,
			fontFamily : theme.fontFamily,
			fontWeight : 'bold'
		},
		minimumFontSize:14,
		width:Ti.UI.FILL,
		height:20
	});
	AddHideKeyboardOnClick(checkin_title);
	header_view.add(checkin_title);
	
	var others_label = Ti.UI.createLabel({
		text: '',
		color: '#fff',
		top: 22,
		left: 0,
		right:36,
		font: {
			fontSize: 14,
			fontFamily: theme.fontFamily
		},
		totalResults:0
	});
	if(_item.custom_fields){
		others_label.totalResults = 0;
		
		if(_item.custom_fields['total_' + _checkin_types[_checkin_type].intent]){
			others_label.totalResults += _item.custom_fields['total_' + _checkin_types[_checkin_type].intent];
		}
	}
	setOthersTextLabel();
	
	AddHideKeyboardOnClick(others_label);
	header_view.add(others_label);
	
	if (_item.custom_fields && _item.custom_fields.expiration_date && _item.custom_fields.expiration_date.value) {
		var expire_val = moment(_item.custom_fields.expiration_date.value).fromNow();
		if(_s.endsWith(expire_val, 'ago')){
			expire_val = 'Activity expired ' + expire_val;
		}
		else{
			expire_val = 'Activity expires ' + expire_val;
		}
		
		var expires_label = Ti.UI.createLabel({
			text : expire_val,
			color : theme.lightRedColor,
			bottom : 0,
			left : 0,
			font : {
				fontSize : 14,
				fontFamily : theme.fontFamily
			},
			expire_date : _item.custom_fields.expiration_date.value
		});
		AddHideKeyboardOnClick(expires_label);
		header_view.add(expires_label);
	}
	
	if(_item.details){
		var action_details_label = Ti.UI.createLabel({
			text:_item.details,
			color: '#fff',
			top: checkin_pic.top + checkin_pic.height,
			left: 5,
			font: {
				fontSize: 14,
				fontFamily: theme.fontFamily
			},
			height:20,
			width:Ti.UI.SIZE
		});
		var mw = require('/ui/MasterWindow').getMasterWindow();
		if (mw) {
			action_details_label.height = 'auto';
			action_details_label.visible = false;
			mw.add(action_details_label);
			var imgAct = action_details_label.toImage();
			mw.remove(action_details_label);
			
			mw = null;
			
			action_details_label.height = imgAct.height;
			action_details_label.visible = true;
			checkin_view.height += action_details_label.height;
		}
		else{
			checkin_view.height += 16;
		}
		AddHideKeyboardOnClick(action_details_label);
		checkin_view.add(action_details_label);
	}
	
	if(_item.custom_fields.action_url){
		checkin_view.height += 16;
		
		var action_url_val = _item.custom_fields.action_url;
		var action_url_parts = action_url_val.match(/([^:]+:\/\/[^\/]+)\//);
		if(action_url_parts && action_url_parts.length && action_url_parts.length > 1){
			action_url_val = action_url_parts[1];
		}
		
		var action_url_label = Ti.UI.createLabel({
			text:action_url_val,
			url_to_open:_item.custom_fields.action_url,
			color: theme.urlColor,
			bottom: 1,
			left: 5,
			font: {
				fontSize: 14,
				fontFamily: theme.fontFamily
			},
			height:20,
			width:Ti.UI.SIZE
		});
		action_url_label.addEventListener('touchstart', function(e) {
			action_url_label.color = theme.urlColorClicked;
		});
		action_url_label.addEventListener('touchend', function(e) {
			action_url_label.color = theme.urlColor;
		});
		action_url_label.addEventListener('click', function(e){
			action_url_label.color = theme.urlColor;
			
			if(action_url_label.clickTime && (new Date() - action_url_label.clickTime < 1000)){
				return false;
			}
			action_url_label.clickTime = new Date();
			
			blurText();
			
			var urlWebView = require('/lib/urlWebView');
			var urlWin = new urlWebView(action_url_label.url_to_open, _item.name, null, false);
			require('/ui/MasterWindow').getNavGroup().open(urlWin);
			
			require('/lib/analytics').trackEvent({
				category : 'url',
				action : 'click',
				label : action_url_label.url_to_open,
				value : null
			});
		});
		checkin_view.add(action_url_label);
	}

	//enter checkin text & take a picture
	var comment_view = Ti.UI.createView({
		left:0,
		top:0,
		height: 70,
		borderColor: theme.borderColor,
		backgroundColor:theme.whiteFontColor,
		layout:'horizontal'
	});
	AddHideKeyboardOnClick(comment_view);
	main_scrollView.add(comment_view);
	
	var defaultCommentText = 'Anything to add?';
	if(_item.custom_fields.text_value && _item.custom_fields.text_value !== ''){
		defaultCommentText = _item.custom_fields.text_value;
	}
	var checkin_comment = Ti.UI.createTextArea({
		value: defaultCommentText,
		height: 70,
		top:0,
		left: 5,
		width:240,
		font: theme.defaultFontItalic,
		color: theme.lightFontColor,
		textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
		appearance: Titanium.UI.KEYBOARD_APPEARANCE_ALERT,
		returnKeyType:Ti.UI.RETURNKEY_DONE,
		borderColor:theme.whiteFontColor,
		gotFocus:false
	});
	
	var cleanText = true;
	checkin_comment.addEventListener('focus', function(e) {
		this.gotFocus = true;
		if(cleanText === true) {
			this.font = theme.defaultFont;
			this.color = theme.textColor;
			this.value = '';
			cleanText = false;
		}
	});
	checkin_comment.addEventListener('blur', function(e) {
		this.gotFocus = false;
		if(this.value === '') {
			this.font = theme.defaultFontItalic;
			this.color = theme.lightFontColor;
			this.value = defaultCommentText;
			cleanText = true;
		}
	}); 
	var txtUpdating = false;
	checkin_comment.addEventListener('change', function(e) {
		if(txtUpdating === false){
			txtUpdating = true;
			if(e.value.length > 140){
				this.value = e.value.substr(0, 140);
			}	
			txtUpdating = false;
		}
	});
	comment_view.add(checkin_comment);
	
	var photo_btn = Ti.UI.createImageView({
		image: theme.images.camera,
		width: 60,
		height: 60,
		top:5,
		bottom:5,
		left: 5
	});
	comment_view.add(photo_btn);
	
	var _photo;
	photo_btn.addEventListener('click', function(photoEvent) {
		if(this.clickTime && (new Date() - this.clickTime < 1000)){
			return false;
		}
		this.clickTime = new Date();
		
		blurText();
		
		var photo_options_dialog = {
			options:['Take a Photo', 'Select From Gallery','Cancel'],
			cancel:2
		};
		
		var photo_dialog = Ti.UI.createOptionDialog(photo_options_dialog);
		photo_dialog.addEventListener('click', function(dialogEvent){
			require('/lib/analytics').trackEvent({
				category : 'checkin',
				action : 'photo',
				label : photo_options_dialog.options[dialogEvent.index],
				value : null
			});
			
			if(dialogEvent.index !== dialogEvent.cancel){
				if(dialogEvent.index === 0){
					// take a photo
					Ti.Media.showCamera({
						success: function(cameraEvent){
							if(cameraEvent.mediaType === Ti.Media.MEDIA_TYPE_PHOTO){
								var ImageFactory = require('ti.imagefactory');
								_photo = ImageFactory.imageAsResized(cameraEvent.media, { width:cameraEvent.media.width / 2, height:cameraEvent.media.height / 2});
								_photo = ImageFactory.compress(_photo, 0.0);
								photo_btn.applyProperties({
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
				}
				else if(dialogEvent.index === 1){
					// select existing photo
					Ti.Media.openPhotoGallery({
						success: function(galleryEvent){
							if(galleryEvent.mediaType === Ti.Media.MEDIA_TYPE_PHOTO){
								var ImageFactory = require('ti.imagefactory');
								_photo = ImageFactory.imageAsResized(galleryEvent.media, { width:galleryEvent.media.width / 2, height:galleryEvent.media.height / 2});
								_photo = ImageFactory.compress(_photo, 0.0);
								photo_btn.applyProperties({
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
				}
			}
		});
		photo_dialog.show();
	});
	
	var checkin_type_bar = Ti.UI.createView({
		top : theme.defaultItemSpacing,
		left : 10,
		right : 10,
		height : 44,
		width : Ti.UI.FILL,
		borderColor : theme.lightBgColor,
		borderWidth : 1,
		borderRadius : theme.defaultBorderRadius,
		touchEnabled : true,
		bubbleParent : false,
		layout : 'horizontal'
	});
	checkin_type_bar.addEventListener('click', function(e){
		if(e && e.source && e.source.index >= 0 && e.source.index <= _checkin_types.length && e.source.index !== _checkin_type){
			// change the prev to normal
			setCheckinIntentPrefs(checkin_type_bar.children[_checkin_type], false);
			// change curr to selected
			setCheckinIntentPrefs(checkin_type_bar.children[e.source.index], true);
			_checkin_type = e.source.index;
			
			if(_checkin_types[e.source.index].intent === PostsModel.intents.plan){
				if(!upcoming_action_row.visible){
					upcoming_action_row.visible = true;
					
					extra_action_rows.splice(0, 0, upcoming_action_row);
					extra_action_table.setData(extra_action_rows);
					extra_action_table.height = extra_action_rows.length * theme.tableDefaultHeight;
				}
				extra_action_table.fireEvent('click', {row:upcoming_action_row});
			}
			else{
				if(upcoming_action_row.visible){
					upcoming_action_row.visible = false;
					
					extra_action_rows.splice(0, 1);
					extra_action_table.setData(extra_action_rows);
					extra_action_table.height = extra_action_rows.length * theme.tableDefaultHeight;
				}
				
				if(_checkin_types[e.source.index].intent === PostsModel.intents.talk){
					checkin_comment.focus();
				}
			}
			
			refreshRecentIntent();
			
			require('/lib/analytics').trackEvent({
				category : 'checkin',
				action : 'intent',
				label : _checkin_types[e.source.index].intent,
				value : null
			});
		}
	});
	
	function setCheckinIntentPrefs(_intent_view, _is_selected){
		if(_intent_view){
			if(_is_selected){
				_intent_view.backgroundGradient = theme.backgroundGradient.tab.selected;
				_intent_view.children[0].image = _checkin_types[_intent_view.index].button.icon.selected;
				_intent_view.children[1].color = theme.textColor;
				
				self.title = _checkin_types[_intent_view.index].title;
			}
			else{
				_intent_view.backgroundGradient = theme.backgroundGradient.tab.normal;
				_intent_view.children[0].image = _checkin_types[_intent_view.index].button.icon.normal;
				_intent_view.children[1].color = '#5C5C5C';
			}
		}
	}
	
	for(var i=0, v=_checkin_types.length; i<v; i++){
		var checkin_type_btn = Ti.UI.createView({
			left : 0,
			height:Ti.UI.FILL,
			width:75,
			layout : 'horizontal',
			backgroundGradient : theme.backgroundGradient.tab.normal,
			index:i,
			bubbleParent : true
		});
		if(i > 0 || i < v - 1){
			checkin_type_btn.left = -1;
			checkin_type_btn.width = 76;
			checkin_type_btn.borderColor = theme.lightBgColor;
			checkin_type_btn.borderWidth = 1;
		}
		
		var checkin_type_btn_icon = Ti.UI.createImageView({
			top:14,
			left:10, 
			height:16,
			width:16,
			image:_checkin_types[i].button.icon.normal,
			hires:true,
			index:i,
			bubbleParent : true
		});
		checkin_type_btn.add(checkin_type_btn_icon);
		
		var checkin_type_btn_txt = Ti.UI.createLabel({
			top:12,
			left:4,
			text:_checkin_types[i].button.text,
			textAlign:Ti.UI.TEXT_ALIGNMENT_LEFT,
			color : '#5C5C5C',
			font : {
				fontSize : 15,
				fontFamily : theme.fontFamily,
				fontWeight : 'bold',
				fontStyle : 'normal'
			},
			index:i,
			bubbleParent : true
		});
		checkin_type_btn.add(checkin_type_btn_txt);
		
		if(i === _checkin_type){
			checkin_type_btn.backgroundGradient = theme.backgroundGradient.tab.selected;
			checkin_type_btn_icon.image = _checkin_types[i].button.icon.selected;
			checkin_type_btn_txt.color = theme.textColor;
		}
		checkin_type_bar.add(checkin_type_btn);
	}
	main_scrollView.add(checkin_type_bar);
	
	if (_item.custom_fields.attributes && _item.custom_fields.attributes.length > 0) {
		function createAttributeRows(_attributes) {
			var rows = [];
			for (var i = 0, v = _attributes.length; i < v; i++) {
				var row = Titanium.UI.createTableViewRow({
					//selectionStyle:Ti.UI.iPhone.TableViewCellSelectionStyle.NONE,
					hasChild : true,
					height : theme.tableDefaultHeight,
					attribute_type : _attributes[i].type,
					allow_multiple : _attributes[i].allowMultiple ? _attributes[i].allowMultiple : false,
					allow_empty : _attributes[i].allowEmpty ? _attributes[i].allowEmpty : false,
					className : 'Attribute_Row'
				});

				attribute_name = Ti.UI.createLabel({
					text: _attributes[i].title,
					color : theme.textColor,
					top : 10,
					left : 10,
					width : '64%',
					font : theme.defaultFontBold
				});
				row.add(attribute_name);

				var attribute_action;
				// generate the controls based on the JSON results
				switch(_attributes[i].type) {
					case 'bool':
						attribute_action = Ti.UI.createSwitch({
							right : 10,
							value : false,
							style : isAndroid ? Ti.UI.Android.SWITCH_STYLE_CHECKBOX : null
						});
						row.hasChild = false;
						break;
					case 'dictionary':
						var dicVals = [];
						if(_attributes[i].allowEmpty){
							dicVals.push(theme.defaultIgnoreValue);
						}
						for(var ii=0, jj=_attributes[i].value.length; ii<jj; ii++){
							dicVals.push(_attributes[i].value[ii].replace(/(^\s*)|(\s*$)/gi,''));
						}
						row.attribute_values = dicVals;
						attribute_action = Ti.UI.createLabel({
							text: _attributes[i].defaultValue,
							color : theme.tableSelectedValueColor,
							top : 10,
							right : 10,
							width : '39%',
							font : theme.defaultFont,
							textAlign : Ti.UI.TEXT_ALIGNMENT_RIGHT
						});
						break;
					case 'range':
						var vals = [];
						if(_attributes[i].allowEmpty){
							vals.push(theme.defaultIgnoreValue);
						}
						var _split = _attributes[i].value.split('-');
						for (var k = parseInt(_split[0]), j = parseInt(_split[1]) + 1; k < j; k++) {
							vals.push(k.toString());
						}

						row.attribute_values = vals;
						attribute_action = Ti.UI.createLabel({
							text: _attributes[i].defaultValue,
							color : theme.tableSelectedValueColor,
							top : 10,
							right : 10,
							width : '35%',
							font : theme.defaultFont,
							textAlign : Ti.UI.TEXT_ALIGNMENT_RIGHT
						});
						break;
					default:
						break;
				}
				row.add(attribute_action);

				rows.push(row);
			}
			return rows;
		}

		var attributes_table = Ti.UI.createTableView({
			data : createAttributeRows(_item.custom_fields.attributes),
			top : theme.defaultItemSpacing,
			borderColor : theme.tableBorderColor,
			borderRadius : theme.defaultBorderRadius,
			scrollable : false,
			left : 10,
			right : 10,
			backgroundColor : theme.tableBackgroundColor,
			height : _item.custom_fields.attributes.length * theme.tableDefaultHeight
		});
		attributes_table.addEventListener('click', function(e) {
			if(this.clickTime && (new Date() - this.clickTime < 1000)){
				return false;
			}
			this.clickTime = new Date();
			
			require('/lib/analytics').trackEvent({
				category : 'attributes',
				action : 'click',
				label : null,
				value : null
			});
			
			blurText();
			if (e.row.hasChild === true) {
				var itemsPicker = require('/lib/itemsPicker');

				var pickerWin = new itemsPicker({
					title : e.row.children[0].text,
					label : e.row.children[1],
					value : e.row.children[1].full_text ? e.row.children[1].full_text : e.row.children[1].text,
					items : e.row.attribute_values,
					allow_empty : e.row.allow_empty,
					allow_multiple : e.row.allow_multiple
				});

				if (isAndroid) {
					pickerWin.open();
				} else {
					require('/ui/MasterWindow').getNavGroup().open(pickerWin);
				}
			}
		});
		main_scrollView.add(attributes_table);
	}
	
	var extra_action_rows = [];
	
	var upcoming_action_row = Titanium.UI.createTableViewRow({
		selectionStyle : Ti.UI.iPhone.TableViewCellSelectionStyle.NONE,
		hasChild : true,
		height : theme.tableDefaultHeight,
		backgroundColor : theme.tableBackgroundColor,
		visible : false,
		clickName : 'upcomin_action',
		className : 'Extra_Action_Row'
	});
	if(_checkin_types[_checkin_type].button.text.toLowerCase() === 'plan'){
		upcoming_action_row.visible = true;
		extra_action_rows.push(upcoming_action_row);
	}
	
	var upcoming_action_name = Ti.UI.createLabel({
		text : 'Planning',
		color : theme.textColor,
		top : 10,
		left : 10,
		font : theme.defaultFontBold,
		width : '50%'
	});
	upcoming_action_row.add(upcoming_action_name);

	var upcoming_action_value = Ti.UI.createLabel({
		text : 'Select',
		color : theme.tableSelectedValueColor,
		top : 10,
		right : 10,
		font : theme.defaultFont,
		textAlign : Ti.UI.TEXT_ALIGNMENT_RIGHT,
		width : Ti.UI.FILL
	});
	upcoming_action_row.add(upcoming_action_value);
	
	var geo_enabled = Ti.App.Properties.getBool('CarelyGeoEnabled', false),
		location_action_value = null;
	if(geo_enabled){
		var location_action_row = Titanium.UI.createTableViewRow({
			selectionStyle : Ti.UI.iPhone.TableViewCellSelectionStyle.NONE,
			hasChild : true,
			height : theme.tableDefaultHeight,
			backgroundColor : theme.tableBackgroundColor,
			clickName : 'location_action',
			className : 'Extra_Action_Row'
		}); 
		
		var location_action_name = Ti.UI.createLabel({
			text : 'At',
			color : theme.textColor,
			top : 10,
			left : 10,
			font : theme.defaultFontBold,
			width : '30%'
		});
		location_action_row.add(location_action_name);
	
		location_action_value = Ti.UI.createLabel({
			text : 'Select',
			color : theme.tableSelectedValueColor,
			top : 10,
			right : 10,
			font : theme.defaultFont,
			textAlign : Ti.UI.TEXT_ALIGNMENT_RIGHT,
			width : '70%'
		});
		location_action_row.add(location_action_value);
		
		extra_action_rows.push(location_action_row);
		
		if(currentUser && currentUser.custom_fields && currentUser.custom_fields.share_location !== false){
			Ti.Geolocation.getCurrentPosition(function(geoEvent) {
				if (geoEvent.success && geoEvent.coords.longitude && geoEvent.coords.latitude) {
					location_action_value.coordinates = [geoEvent.coords.longitude, geoEvent.coords.latitude];
					
					var xhr = Ti.Network.createHTTPClient({
						onload : function(e) {
							if (this.responseText) {
								var json = JSON.parse(this.responseText);
								if (json && json.results && json.results.length) {
									location_action_value.post_location = json.results[0];
									location_action_value.text = common.formatGeoLocation(json.results[0]);
								}
							}
						},
						onerror : function(e) {
							
						}
					});
			
					xhr.open('GET', 'http://maps.google.com/maps/api/geocode/json?sensor=true&language=en&latlng=' + geoEvent.coords.latitude + ',' + geoEvent.coords.longitude);
					xhr.send(); 
				}
			});
		}
	}
	
	var facebook_share_row = Titanium.UI.createTableViewRow({
		selectionStyle : Ti.UI.iPhone.TableViewCellSelectionStyle.NONE,
		hasChild : false,
		height : theme.tableDefaultHeight,
		backgroundColor : theme.tableBackgroundColor,
		clickName : 'facebook_share',
		className : 'Extra_Action_Row'
	}); 
	extra_action_rows.push(facebook_share_row);
	
	var facebook_share_name = Ti.UI.createLabel({
		text : 'Share on Facebook',
		color : theme.textColor,
		top : 10,
		left : 10,
		font : theme.defaultFontBold,
		width : '50%'
	});
	facebook_share_row.add(facebook_share_name);
	
	var fb_share_default = facebookModule.loggedIn;
	if (currentUser && currentUser.custom_fields && currentUser.custom_fields.facebook_settings && 
		currentUser.custom_fields.facebook_settings.checkin === false) {
		fb_share_default = false;
	}
	var fb_share_bool = Ti.UI.createSwitch({
		right : 10,
		value : fb_share_default,
		style : isAndroid ? Ti.UI.Android.SWITCH_STYLE_CHECKBOX : null,
		enabled : facebookModule.loggedIn
	});
	fb_share_bool.addEventListener('click', function(e){
		if(facebookModule.loggedIn === false){
			var facebookListener = function(fbEvent) {
				try {
					if (fbEvent.success) {
						if (fbEvent.data && fbEvent.data.email && fbEvent.data.email.length > 0) {
							Ti.App.Properties.setString('carely_user_facebook', JSON.stringify(fbEvent.data));
							
							var socialModel = require('/lib/model/social'), actIndicator = require('/ui/ActivityIndicator');
							var indicator = new actIndicator();
							indicator.showModal('Connecting account...', 60000, 'Timeout connecting account!');
							socialModel.linkAccount(facebookModule.uid, 'facebook', facebookModule.accessToken, function(linkEvent) {
								indicator.hideModal();
								if (linkEvent.success) {
									var _user = linkEvent.users[0];

									Ti.App.Properties.setString('carely_user', JSON.stringify(_user));
									Model.AppCache.users.set(_user);
									
									fb_share_bool.enabled = true;
									fb_share_bool.value = true;
									
									require('/lib/analytics').trackSocial({
										network : 'facebook',
										action : 'link',
										target : self.title
									}); 

								} else {
									Model.eventDefaultErrorCallback(linkEvent);
								}
							});
						} else {
							// invalid data returned from facebook
						}
					} else{
						if (fbEvent.error) {
							Model.eventDefaultErrorCallback(fbEvent);
						}
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
		}
	});
	facebook_share_row.add(fb_share_bool);	
	
	var extra_action_table = Ti.UI.createTableView({
		data : extra_action_rows,
		top : theme.defaultItemSpacing,
		borderColor : theme.tableBorderColor,
		borderRadius : theme.defaultBorderRadius,
		scrollable : false,
		left : 10,
		right : 10,
		backgroundColor : theme.tableBackgroundColor,
		height : extra_action_rows.length * theme.tableDefaultHeight
	}); 
	extra_action_table.addEventListener('click', function(e){
		if(e){
			e.cancelBubble = true;
		}
		if(this.clickTime && (new Date() - this.clickTime < 1000)){
			return false;
		}
		this.clickTime = new Date();
		
		if(e && e.row && e.row.clickName){
			require('/lib/analytics').trackEvent({
				category : 'extra',
				action : 'click',
				label : e.row.clickName,
				value : null
			});
			
			switch(e.row.clickName){
				case 'upcomin_action':
					var datePicker = require('/lib/datePicker');
					var datePickerWindow = new datePicker.datePicker({
						title : 'Planning',
						row : e.row,
						avoid_empty : true
					});
					if (isAndroid) {
						datePickerWindow.open();
					} else {
						require('/ui/MasterWindow').getNavGroup().open(datePickerWindow);
					}
					break;
				case 'facebook_share':
				
					break;
				case 'location_action':
					var location_params = {
						longitude:null,
						latitude:null, 
						post_location:{
							formatted_address:'Loading'
						}
					}
					if(location_action_value && location_action_value.post_location && location_action_value.coordinates && location_action_value.coordinates.length > 1){
						location_params.longitude = location_action_value.coordinates[0];
						location_params.latitude = location_action_value.coordinates[1];
						location_params.post_location = location_action_value.post_location;
					}
					var LocationWindow = require('/ui/LocationWindow');
					var locationWindow = new LocationWindow(location_params.longitude, location_params.latitude, location_params.post_location, location_action_value);
					require('/ui/MasterWindow').getNavGroup().open(locationWindow);
					break;
				default:
					break;
			}
		}
	});
	main_scrollView.add(extra_action_table);
	
	// var share_view = new ui.View({
		// top: theme.defaultItemSpacing,
		// height:40,
		// left: 10,
		// width:300,
		// layout:'horizontal',
		// backgroundColor: '#d7d7d7',
		// borderRadius:theme.defaultBorderRadius
	// });
	// AddHideKeyboardOnClick(share_view);
	// main_scrollView.add(share_view);
// 	
	// var share_label = new ui.Label('Share to', {
		// color : theme.textColor,
		// top : 10,
		// left : 10,
		// font : theme.defaultFontBold,
		// textAlign:Ti.UI.TEXT_ALIGNMENT_LEFT
	// });
	// AddHideKeyboardOnClick(share_label);
	// share_view.add(share_label);
// 	
	// //facebook
	// var fb_btn = new ui.ImageView('/images/buttons/facebook1_off.png',{
		// width: 32,
		// height: 32,
		// top: 4,
		// left: 90
	// });
	// fb_btn.addEventListener('click', function(e){
		// blurText();
		// if(this.image === '/images/buttons/facebook1_off.png'){
			// this.image = '/images/buttons/facebook1_on.png';
		// }
		// else{
			// this.image = '/images/buttons/facebook1_off.png';
		// }
	// });
	// share_view.add(fb_btn);
// 	
	// //twitter
	// var tw_btn = new ui.ImageView('/images/buttons/twitter1_off.png',{
		// width: 32,
		// height: 32,
		// top: 4,
		// left: 10
	// });
	// tw_btn.addEventListener('click', function(e){
		// blurText();
		// if(this.image === '/images/buttons/twitter1_off.png'){
			// this.image = '/images/buttons/twitter1_on.png';
		// }
		// else{
			// this.image = '/images/buttons/twitter1_off.png';
		// }
	// });
	// share_view.add(tw_btn);
// 	
	// //foursquare
	// var fs_btn = new ui.ImageView('/images/buttons/foursquare_off.png',{
		// width: 32,
		// height: 32,
		// top: 4,
		// left: 10
	// });
	// fs_btn.addEventListener('click', function(e){
		// blurText();
		// if(this.image === '/images/buttons/foursquare_off.png'){
			// this.image = '/images/buttons/foursquare_on.png';
		// }
		// else{
			// this.image = '/images/buttons/foursquare_off.png';
		// }
	// });
	// share_view.add(fs_btn);
	
	var checkin_btn = Ti.UI.createButton({
		width : 300,
		height : 40,
		top : theme.defaultItemSpacing,
		left : 10,
		color: theme.whiteFontColor,
		selectedColor:theme.lightFontColor,
		backgroundImage:theme.buttonImage.checkin.normal,
		backgroundSelectedImage:theme.buttonImage.checkin.selected,
		// borderRadius:theme.defaultBorderRadius,
		// backgroundGradient: theme.backgroundGradient.green,
		style: isAndroid ? null : Ti.UI.iPhone.SystemButtonStyle.PLAIN
	});
	
	function trimWhiteSpaces(s) {
		s = s.replace(/(^\s*)|(\s*$)/gi,"");
		s = s.replace(/[ ]{2,}/gi," ");
		s = s.replace(/\n /,"\n");
		return s;
	}
	
	checkin_btn.addEventListener('click', function(e){
		if(this.clickTime && (new Date() - this.clickTime < 1000)){
			return false;
		}
		this.clickTime = new Date();
			
		blurText();
		var loggedIn = Ti.App.Properties.getString('carely_user', null);
		if(loggedIn === null) {
			//alert('Please login first!');
		} else if(expires_label && expires_label.action_expired){
			//alert('Action expired!');
		}else {
			
			var actionDesc = checkin_comment.value !== defaultCommentText ? checkin_comment.value.replace(/(^\s*)|(\s*$)/gi,'') : '';
			if(trimWhiteSpaces(actionDesc) === ''){
				actionDesc = common.emptyCheckinValue;
			}
			if(_checkin_types[_checkin_type].intent === PostsModel.intents.talk && actionDesc === common.emptyCheckinValue){
				checkin_comment.focus();
				return false;
			}
			
			var action_attributes = [], attributesTextVals = [];
			
			if (_item.custom_fields.attributes && _item.custom_fields.attributes.length > 0) {
				for (var i = 0, v = attributes_table.data[0].rows.length; i < v; i++) {
					var row = attributes_table.data[0].rows[i];
					var attributeName = row.children[0].text;
					var attributeValue = null;
					switch(row.attribute_type) {
						case 'bool':
							if (row.children[1].value === true) {
								attributeValue = row.children[1].value;
								attributesTextVals.push(attributeName);
							}
							break;
						case 'range':
							if (row.children[1].text !== '' && row.children[1].text !== theme.defaultIgnoreValue) {
								attributeValue = row.children[1].text;
								attributesTextVals.push(attributeValue + ' ' + attributeName);
							}
							break;
						case 'dictionary':
							if(row.allow_multiple){
								attributeValue = row.children[1].full_text;
								if(attributeValue && attributeValue.length){
									var lastComma = attributeValue.lastIndexOf(',');
									if(lastComma > -1){
										var tmpVal = attributeName + ' ' + attributeValue.substr(0, lastComma) + ' and ' + attributeValue.substr(lastComma + 1);
										tmpVal = tmpVal.replace(',', ', ');
										attributesTextVals.push(tmpVal);
									}
									else{
										attributesTextVals.push(attributeName + ' ' + attributeValue);
									}
								}
							}
							else if (row.children[1].text !== '' && row.children[1].text !== theme.defaultIgnoreValue) {
								attributeValue = row.children[1].text;
								attributesTextVals.push(attributeName + ' ' + attributeValue);
							}
							break;
					}
					if (attributeValue !== null) {
						action_attributes.push({
							name : attributeName,
							type: row.attribute_type,
							allow_multiple : row.allow_multiple,
							value : attributeValue
						});
					}
				}
			}
			var _attributesText = '';
			if(attributesTextVals.length > 0){
				_attributesText = attributesTextVals.join(', ').replace(/(^\s*)|(\s*$)/gi,'');
				// capitalize
				_attributesText = _attributesText.toLowerCase();
				_attributesText = _attributesText.charAt(0).toUpperCase() + _attributesText.substr(1);	
			}
			attributesTextVals = null;
			
			var actIndicator = require('/ui/ActivityIndicator');
			var indicator = new actIndicator();
			
			var post_count_id = _item.id + '_' + PostsModel.postTypes.checkin;
			if(!currentUser.custom_fields[post_count_id]){
				currentUser.custom_fields[post_count_id] = 0;
			}
			currentUser.custom_fields[post_count_id] += 1;
			
			var postParams = {
				activity_name : _item.name,
				intent:_checkin_types[_checkin_type].intent,
				attributes: action_attributes,
				attributesText: _attributesText,
				done:{
					total:others_label.totalResults + 1,
					me:currentUser.custom_fields[post_count_id]
				}
			}
			
			if(upcoming_action_row.visible && upcoming_action_row.upcoming_date){
				postParams.upcoming_date = upcoming_action_row.upcoming_date;
				postParams.upcoming_date_start = upcoming_action_row.upcoming_date.starts;
			}
			
			if(location_action_value && location_action_value.post_location && 
			   location_action_value.coordinates && location_action_value.coordinates.length > 1){
			   	
				postParams.coordinates = location_action_value.coordinates;
				postParams.post_location = location_action_value.post_location;
				
				if(location_action_value.userText){
					postParams.post_location_user_text = location_action_value.text;
				}
			}
			else{
				postParams.share_location = false;
			}
			
			if(_suggester_id){
				postParams['[ACS_User]suggester_id'] = _suggester_id; 
			}
			
			indicator.showModal('Checking in...', 60000, 'Timeout posting checkin!');
			PostsModel.create(_item.id, actionDesc, _photo, PostsModel.postTypes.checkin, postParams, function(checkinEvent) {
				indicator.hideModal();
				
				Ti.App.Properties.setString('carely_user', JSON.stringify(currentUser));
				
				if(checkinEvent.success) {
					common.refreshHandler.setRefresh.news(true);
					common.refreshHandler.setRefresh.leaderboard(true);
					common.refreshHandler.setRefresh.users(true);
					
					// cache items
					Model.AppCache.posts.setMany(checkinEvent.posts);
						
					Ti.App.Properties.setString('carely_user', JSON.stringify(currentUser));
					Model.AppCache.users.set(currentUser);
					
					var PostActionWindow = require('/ui/PostActionWindow');
						
					var postActionWindow = new PostActionWindow(checkinEvent.posts[0].user.id, checkinEvent.posts[0].id, {
						total : others_label.totalResults + 1,
						me : currentUser.custom_fields[post_count_id]
					});
					require('/ui/MasterWindow').getNavGroup().open(postActionWindow);
					
					var newRows = createRows(checkinEvent.posts, false);
					if (newRows.length > 0) {
						others_label.totalResults += 1;
						setOthersTextLabel();
						
						recent_header_title.text = 'RECENT ' + _checkin_types[_checkin_type].recent.toUpperCase();
						
						recent_header_view.height = 30;
						
						recent_footer_view.height = 0;
						
						if(recent_table_view.height === 0){
							recent_table_view.setData([newRows[0]]);
						}
						else{
							recent_table_view.insertRowBefore(0, newRows[0], {animated:false});
						}
						recent_table_view.height += defaultRowHeight;
						
						main_scrollView.contentHeight = 'auto';
						
						increaseActivityIntent(_item.id, _checkin_types[_checkin_type].intent, 1);
					}

					//TODO: add share functionality
					if(facebookModule.loggedIn && fb_share_bool && fb_share_bool.value === true){
						var shareData = PostsModel.formatForSharing(checkinEvent.posts[0]);
						if(extra_action_table.data[0].rows[0].upcoming_date){
							shareData.upcoming = true;
							shareData.start_time = extra_action_table.data[0].rows[0].upcoming_date.starts.toISOString();
							shareData.end_time = extra_action_table.data[0].rows[0].upcoming_date.ends.toISOString();
						}
						if(shareData){
							var fbUserData = JSON.parse(Ti.App.Properties.getString('carely_user_facebook', null));
							if(fbUserData && fbUserData.username){
								shareData.ref = fbUserData.username;
							}
							Ti.App.fireEvent('posts.share', shareData);
						}
					}
					
					var update_params = {
						custom_fields:{}
					};
					//update_params.custom_fields[post_count_id] = { '$inc' : 1};
					update_params.custom_fields[post_count_id] = currentUser.custom_fields[post_count_id];
					
					var UsersModel = require('/lib/model/users');
					UsersModel.update(update_params, function(updateEvent) {
						if (updateEvent.success) {
							currentUser = updateEvent.users[0];
							Ti.App.Properties.setString('carely_user', JSON.stringify(updateEvent.users[0]));

							Model.AppCache.users.set(updateEvent.users[0]);
						} else {
							Model.eventDefaultErrorCallback(updateEvent);
						}
					});
				} else {
					Model.eventDefaultErrorCallback(checkinEvent);
				}
			});
		}
	});
	main_scrollView.add(checkin_btn);
	
	var recent_header_view = Ti.UI.createView({
		top:theme.defaultItemSpacing - 2,
		height : 30,
		width:Ti.UI.FILL,
		backgroundColor:theme.winBgColor
	});
	main_scrollView.add(recent_header_view);
	
	var recent_header_title = Ti.UI.createLabel({
		color : theme.textColor,
		top : 0,
		left : 13,
		text : '',
		font: theme.defaultToolTipFontBold
	}); 
	recent_header_view.add(recent_header_title);
	
	// var recent_header_count = Ti.UI.createLabel({
		// color : theme.textColor,
		// top : 0,
		// right : 13,
		// text : '',
		// font: theme.defaultToolTipFontBold
	// }); 
	// recent_header_view.add(recent_header_count);
	
	var recent_footer_view = Ti.UI.createView({
		height : 0,
		width:Ti.UI.FILL,
		backgroundColor:theme.tableBackgroundColor
	});
	
	var recent_footer_view_indicator = Ti.UI.createActivityIndicator({
		top : 8,
		height : Ti.UI.FILL,
		width : Ti.UI.FILL,
		font : theme.defaultToolTipFont,
		style : Ti.UI.iPhone.ActivityIndicatorStyle.DARK
	});
	recent_footer_view_indicator.show();
	recent_footer_view.add(recent_footer_view_indicator);
	
	var recent_table_view = Ti.UI.createTableView({
		top : 0,
		height : 0,
		left: 10,
		right:10,
		footerView : recent_footer_view,
		backgroundColor : theme.tableBackgroundColor,
		minRowHeight:defaultRowHeight,
		borderColor: theme.tableBorderColor,
		borderRadius: theme.defaultBorderRadius,
		scrollable: false,
		scrollsToTop : false
	});
	main_scrollView.add(recent_table_view);
	
	function setOthersTextLabel(){
		if(others_label.totalResults > 0){
			if (others_label.totalResults === 1) {
				others_label.text = 'One person ';
				if (_checkin_types[_checkin_type].intent !== PostsModel.intents.want) {
					others_label.text += 'is ';
				}
			} else {
				others_label.text = others_label.totalResults + ' people ';
				if (_checkin_types[_checkin_type].intent !== PostsModel.intents.want) {
					others_label.text += 'are ';
				}
			}
			others_label.text += _checkin_types[_checkin_type].plural;
		}
		else{
			others_label.text = 'Be the first to ' + _checkin_types[_checkin_type].title.toLowerCase();
			others_label.totalResults = 0;
		}
	}
	
	function refreshRecentIntent(){
		recent_header_view.height = 30;
		recent_header_title.text = 'RECENT ' + _checkin_types[_checkin_type].recent.toUpperCase();
		//recent_header_count.text = '';
		//recent_header_count.total_results = 0;
		
		recent_footer_view.height = defaultRowHeight;
		
		recent_table_view.setData([]);
		recent_table_view.height = defaultRowHeight;
		
		others_label.totalResults = 0;
		if(_item && _item.custom_fields['total_' + _checkin_types[_checkin_type].intent]){
			others_label.totalResults += _item.custom_fields['total_' + _checkin_types[_checkin_type].intent];
		}
		setOthersTextLabel();
		
		var queryParams = {
			title:PostsModel.postTypes.checkin,
			event_id:_item.id,
			intent:_checkin_types[_checkin_type].intent
		}
		
		PostsModel.queryPages(queryParams, '-created_at', 1, 10, function(e) {
			recent_footer_view.height = 0;
			
			var rows = null;
			if(e.success) {
				if (e.meta.total_results > 0) {
					others_label.totalResults = e.meta.total_results;
					//recent_header_count.total_results = e.meta.total_results;
					
					//recent_header_count.text = '(' + recent_header_count.total_results + ')';
						
					Model.AppCache.posts.setMany(e.posts);
					
					var rows = createRows(e.posts, _checkin_types[_checkin_type].intent === PostsModel.intents.plan);
				}
			}
			else{
				Model.eventDefaultErrorCallback(e);
			}
			
			setOthersTextLabel();
			
			if(rows && rows.length){
				recent_table_view.setData(rows);
				recent_table_view.height = rows.length * defaultRowHeight;
			}
			else{
				recent_table_view.height = 0;
				recent_header_view.height = 0;
			}
			main_scrollView.contentHeight = 'auto';
		});
	}
	//refreshRecentIntent();
	
	var defaultRowHeight = theme.borderedImage.user.height + 12;
	function createRows(_items, _upcoming){
		var rows = [];
		if(_items && _items.length > 0) {
			for(var i = 0, l = _items.length; i < l; i++) {
				
				var uname = common.getUserDisplayName(_items[i].user);
				
				var row = Ti.UI.createTableViewRow({
					height : defaultRowHeight,
					selectedBackgroundColor : theme.rowHoverColor,
					backgroundColor:theme.tableBackgroundColor,
					hasChild : true,
					className : 'Recent_Row',
					user_name : uname,
					updated_at : _items[i].updated_at,
					actionClassName:PostsModel.postTypes.checkin,
					post_id: _items[i].id,
					user_id : _items[i].user.id
				});
				
				var userIcon = theme.defaultIcons.user;
				if(_items[i].user.photo && _items[i].user.photo.urls && _items[i].user.photo.urls.square_75) {
					userIcon = _items[i].user.photo.urls.square_75;
				}
				else if(_items[i].icon){
					userIcon = _items[i].icon;
				}
				var icon = new ui.ImageViewBordered(userIcon, {
					width : theme.borderedImage.user.width,
					height : theme.borderedImage.user.height,
					left : 6,
					top : 6
				},'user');
				
				row.add(icon);
				
				var name_view = Ti.UI.createView({
					top: 1,
					left: icon.left + icon.width + 6,
					width:Ti.UI.FILL,
					height:20,
					layout:'horizontal'
				});
				row.add(name_view);
				
				var name = Ti.UI.createLabel({
					top: 0,
					left: 0,
					color : theme.darkFontColor,
					text : uname,
					font : theme.defaultFontBold,
					clickName : 'label'
				});
				
				if(_items[i].noChilds) {
					row.hasChild = false;
					name.top = 28;
					name.textAlign = Ti.UI.TEXT_ALIGNMENT_CENTER;
				} else {
					name.top = 2;
				}
				name_view.add(name);
				
				if(_items[i].ratings_count > 0){
					var joining = Ti.UI.createLabel({
						top: 2,
						left: -1,
						color : theme.textColor,
						text : ' and ' + _items[i].ratings_count + ' other' + ((_items[i].ratings_count > 1) ? 's' : ''),
						font : theme.defaultFont,
						clickName : 'label'
					});
					name_view.add(joining);
				}
				
				var date_value = (_items[i].updated_at !== '' ? moment(_items[i].updated_at).fromNow() : '');
				if(_upcoming && _items[i].custom_fields && _items[i].custom_fields.upcoming_date_start){
					date_value = moment(_items[i].custom_fields.upcoming_date_start).fromNow();
					if(_items[i].custom_fields.upcoming_date && _items[i].custom_fields.upcoming_date.all_day === false){
						date_value += ' (' + moment(_items[i].custom_fields.upcoming_date_start).format('ddd, MMM D, h:mm A') + ')';
					}
					else{
						date_value += ' (' + moment(_items[i].custom_fields.upcoming_date_start).format('ddd, MMM D') + ')';
					}
				}
				var date = Ti.UI.createLabel({
					color : theme.lightFontColor,
					bottom : 2,
					left:icon.left + icon.width + 6,
					text : date_value,
					font : {
						fontSize : 14,
						fontFamily : theme.fontFamily
					},
					clickName : 'label'
				});

				row.add(date);
				
				rows.push(row);
			}
		}
		return rows;
	}
	
	recent_table_view.addEventListener('singletap', function(e){
		if(this.clickTime && (new Date() - this.clickTime < 1000)){
			return false;
		}
		this.clickTime = new Date();
		
		blurText();
		
		if(e && e.source && e.row){
			switch(e.source.clickName){
				case 'user':					
					var UserWindow = require('/ui/UserWindow');
					var userWindow = new UserWindow(e.row.user_id);
					require('/ui/MasterWindow').getNavGroup().open(userWindow);
					break;
				default:
					if (e && e.row && e.row.post_id) {
						var actionItem = Model.AppCache.posts.get(e.row.post_id);
						if (!actionItem) {
							PostsModel.show(e.row.post_id, function(showEvent) {
								if (showEvent.success) {
									Model.AppCache.posts.set(showEvent.posts[0]);

									openActionItemWindow(e.row.post_id, false, e.row.actionClassName);
								} else {
									Model.eventDefaultErrorCallback(showEvent);
								}
							});
						} else {
							openActionItemWindow(e.row.post_id, false, e.row.actionClassName);
						}

						function openActionItemWindow(_post_id, _focusComment, _actionClassName) {
							var ActionItemWindow = require('/ui/ActionItemWindow');
							var post_window = new ActionItemWindow(_post_id, _focusComment, _actionClassName);
							require('/ui/MasterWindow').getNavGroup().open(post_window);
						}
					}
					break;
			}
		}
	});
	
	function increaseActivityIntent(_action_id, _intent, _value){
		if(!_action_id){
			return;
		}
		if(!_intent){
			return;
		}
		if(!_value){
			_value = 0;
		}
		
		var ActionsModel = require('/lib/model/actions');
		ActionsModel.show(_action_id, function(showEvent){
			if(showEvent.success){
				Model.AppCache.actions.set(showEvent.events[0]);
				
				var cnt = 0, intent_field = 'total_' + _intent;
				if(showEvent.events[0] && showEvent.events[0].custom_fields && showEvent.events[0].custom_fields[intent_field]){
					cnt += showEvent.events[0].custom_fields[intent_field];
				}
				cnt += _value;
				
				var update_params = {
					event_id:showEvent.events[0].id,
					custom_fields:{}
				}
				update_params.custom_fields[intent_field] = cnt;
				
				ActionsModel.update(update_params,function(updateEvent) {
					if(updateEvent.success){
						Model.AppCache.actions.set(updateEvent.events[0]);
					}
					else{
						Model.eventDefaultErrorCallback(updateEvent);
					}
				});
			}
			else{
				Model.eventDefaultErrorCallback(showEvent);
			}
		});
	}

	self.addEventListener('focus', function(e){
		if(Ti.App.Properties.getBool('carely_goToHome', false) === true){
			require('/ui/MasterWindow').getNavGroup().close(this, {animated:false});
		}
		else{
			require('/lib/analytics').trackScreen({ screenName : 'Checkin' });
			
			require('/lib/analytics').trackEvent({
				category : 'checkin',
				action : self.title,
				label : _actionId,
				value : null
			});
		}
	});
	
	self.addEventListener('open', function(e){
		if(Ti.App.Properties.getBool('carely_goToHome', false) === true){
			require('/ui/MasterWindow').getNavGroup().close(this, {animated:false});
		}
		else{
			if(_checkin_type >= 0 && _checkin_type < _checkin_types.length){
				if(_checkin_types[_checkin_type].intent === PostsModel.intents.talk){
					checkin_comment.focus();
				}
				else if(_checkin_types[_checkin_type].intent === PostsModel.intents.plan){
					extra_action_table.fireEvent('click', {row:upcoming_action_row});
				}
			}
		}
	});
	self.addEventListener('close', function(e){
		currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
		if(_item && currentUser){
			var user_update_params = null;
			if (fb_share_default !== fb_share_bool.value) {
				if(!user_update_params){
					user_update_params = {};
				}
				user_update_params.facebook_settings = { checkin:fb_share_bool.value };
			}
			
			if (addedAction > -1) {
				if (!user_update_params) {
					user_update_params = {};
				}
				user_update_params.my_actions = my_action_preferences;
				user_update_params.my_deleted_actions = my_deleted_actions_preferences;
				user_update_params.my_action_suggestions = _my_action_suggestions;
			}
			
			if (user_update_params) {
				var UsersModel = require('/lib/model/users');
				UsersModel.update({
					custom_fields : user_update_params
				}, function(updateEvent) {
					if (updateEvent.success) {
						
						currentUser = updateEvent.users[0];
						Ti.App.Properties.setString('carely_user', JSON.stringify(currentUser));

						Model.AppCache.users.set(currentUser);
						
						if(addedAction > -1){
							
							PostsModel.queryPages({
								title : PostsModel.postTypes.actions_add,
								user_id : currentUser.id,
								event_id : _item.id
							}, null, 1, 1, function(queryPostEvent) {
								if (queryPostEvent.success) {
									if (queryPostEvent.meta.total_results > 0) {
										PostsModel.remove(queryPostEvent.posts[0].id, false, function(removeEvent) {
											if (removeEvent.success) {
												Model.AppCache.posts.del(queryPostEvent.posts[0].id);
												common.refreshHandler.setRefresh.news(true);
												common.refreshHandler.setRefresh.following(true);
											} else {
												Model.eventDefaultErrorCallback(removeEvent);
											}
										});
									}

									if (addedAction === 0) {
										var post_count_id = _item.id + '_' + PostsModel.postTypes.checkin;
										var createParmas = {
											done : { 
												total : others_label.totalResults + 1,
												me : currentUser.custom_fields[post_count_id] ? currentUser.custom_fields[post_count_id] : 0
											}
										};
										if(_suggester_id){
											createParmas['[ACS_User]suggester_id'] = _suggester_id;
										}
										PostsModel.create(_item.id, _item.name, null, PostsModel.postTypes.actions_add, createParmas, function(postEvent) {
											if (postEvent.success) {
												Model.AppCache.posts.set(postEvent.posts[0]);
												common.refreshHandler.setRefresh.news(true);
											} else {
												Model.eventDefaultErrorCallback(postEvent);
											}
										});
									}
								} else {
									Model.eventDefaultErrorCallback(queryPostEvent);
								}
							});
						}
					} else {
						Model.eventDefaultErrorCallback(updateEvent);
					}
				});
			}
		}
	});
	return self;
};

module.exports = CheckinWindow;
