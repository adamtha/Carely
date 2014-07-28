function NewActionWindow(_actionId, addToGroup, openAdvanced, _new_action_params, _new_action_save_cb){
	var _ = require('/lib/underscore'),
		theme = require('/ui/theme'), 
		ui = require('/ui/components'),
		Model = require('/lib/model/model'),
		moment = require('/lib/date/moment'),
		common = require('/lib/common');
	
	var actionJSON = Model.AppCache.actions.get(_actionId);
	
	var isAndroid = Ti.Platform.osname === 'android';
	var currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
	 
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
		title : actionJSON !== null ? L('edit_action') : L('new_action'),
		navBarHidden : isAndroid,
		backgroundColor: theme.winBgColor,
		orientationModes : [Ti.UI.PORTRAIT]
	});
	AddHideKeyboardOnClick(self);
	
	if(isAndroid){
		
	}
	else {
		self.barColor = theme.barColor;

		var saveButton = Ti.UI.createButton({
			title : L('save')
		});
		saveButton.addEventListener('click', function(e) {
			blurText();
			
			if(_new_action_save_cb){
				_new_action_save_cb();
			}
			
			if(this.clickTime && (new Date() - this.clickTime < 1000)){
				return false;
			}
			this.clickTime = new Date();
			
			var actIndicator = require('/ui/ActivityIndicator');
			var indicator = new actIndicator();
			
			var eventJSON = {
				name : action_txt.value.replace(/(^\s*)|(\s*$)/gi,''),
				details : action_desc.value !== defaultDescText ? action_desc.value.replace(/(^\s*)|(\s*$)/gi,'') : '',
				start_time : moment.utc()._d,
				acl_name:'actions_acl',
				custom_fields : {
					text_value : '',
					action_url : '',
					action_by_value:'',
					isPublic : true,
					attributes : [],
					importance : 0,
					disabled:false
				}
			};
			
			var List_tag = JSON.parse(Ti.App.Properties.getString('List_tag', null));
			if(List_tag && List_tag.id && !List_tag.all_activities && currentUser){
				eventJSON.custom_fields['list_tag_' + List_tag.id] = currentUser.id;
			}
			
			if(showingAdvanced){
					eventJSON.custom_fields.text_value = action_comment_desc.value;
					eventJSON.custom_fields.action_by_value = action_by_desc.value;
					if(eventJSON.custom_fields.action_by_value && eventJSON.custom_fields.action_by_value.length){
						eventJSON.custom_fields.action_by_value = eventJSON.custom_fields.action_by_value.trim();
						if(eventJSON.custom_fields.action_by_value.toLowerCase() === 'by'){
							eventJSON.custom_fields.action_by_value = '';
						}
					}
					eventJSON.custom_fields.action_url = action_url_desc.value;
					eventJSON.custom_fields.expiration_date = action_visibility_table.data[0].rows[0].expiration_date;
					eventJSON.custom_fields.isPublic = action_visibility_table.data[0].rows[1].children[1].value;
					
					for (var i = 0, v=attributes_table.data[0].rows.length; i<v; i++) {
						if (attributes_table.data[0].rows[i].hasChild === true && 
							attributes_table.data[0].rows[i].att_JSON_data !== null) {
							eventJSON.custom_fields.attributes.push(attributes_table.data[0].rows[i].att_JSON_data);
						}
					}
			}
			
			if(actionJSON){
				if(actionJSON.acl_name){
					eventJSON.acl_name = undefined;
				}
				if(actionJSON.custom_fields){
					if(actionJSON.custom_fields.disabled){
						eventJSON.custom_fields.disabled = undefined;
					}
				}
			}
			
			if (upload_pic.children[0].onlineSavedPhoto !== null) {
				_photo = upload_pic.children[0].onlineSavedPhoto;
			} 
			if (_photo === null && actionJSON !== null && actionJSON.photo && actionJSON.photo.id) {
				_photo = '';
			}
			
			var nameValid = (eventJSON.name && eventJSON.name.length > 3), 
				photoValid = (_photo !== null);

			if (nameValid === true && photoValid === true) {
				
				//eventJSON.name = eventJSON.name.charAt(0).toUpperCase() + eventJSON.name.substr(1).toLowerCase();
				
				function saveActionItem(){
					var UsersModel = require('/lib/model/users'),
						actionsModel = require('/lib/model/actions');
					
					function updateUserActions(_created, _newAction) {
						var _my_actions = [], _total_actions_created = 0;
						if (currentUser && currentUser.custom_fields) {
							_my_actions = currentUser.custom_fields.my_actions;
							if (currentUser.custom_fields.total_actions_created) {
								_total_actions_created = currentUser.custom_fields.total_actions_created;
							}
						}
						if (_my_actions.indexOf(_newAction.id) === -1) {
							_my_actions.splice(0, 0, _newAction.id);
						}
						_total_actions_created++;
						
						common.refreshHandler.setRefresh.actions(true);
						common.refreshHandler.setRefresh.myActions(true);
						common.refreshHandler.setRefresh.leaderboard(true);
						
						Model.AppCache.actions.set(_newAction);				

						UsersModel.update({
							custom_fields : {
								my_actions : _my_actions
							}
						}, function(updateEvent) {
							indicator.hideModal();
							if (updateEvent.success) {
								Ti.App.Properties.setString('carely_user', JSON.stringify(updateEvent.users[0]));
								currentUser = updateEvent.users[0];
								
								Model.AppCache.users.set(updateEvent.users[0]);
								
								if(_photo !== '' && actionJSON !== null && actionJSON.photo && actionJSON.photo.id){
									var photosModel = require('/lib/model/photos');
									photosModel.remove(actionJSON.photo.id, function(_photoEvent){ });
								}
								
								if(addToGroup){
									var groupActions = Ti.App.Properties.getList('carely_addedActionToGroup', null);
									if(groupActions && groupActions.indexOf(_newAction.id) === -1){
										groupActions.splice(0, 0, _newAction.id);
										Ti.App.Properties.setList('carely_addedActionToGroup', groupActions);
									}
								}
								Ti.App.Properties.setBool('carely_CloseAddActionsWindow', true);
								require('/ui/MasterWindow').getNavGroup().close(self, { animated : true });
							} else {
								Model.eventDefaultErrorCallback(updateEvent);
							}
						});
						
						if(_created && List_tag && List_tag.id && !List_tag.all_activities){
							var createParmas = {
								added_to_list_id : List_tag.id,
								done : {
									total : 0,
									me : 0
								}
							};
							var PostsModel = require('/lib/model/posts');
							PostsModel.create(_newAction.id, _newAction.name, null, PostsModel.postTypes.lists_add, createParmas, function(postEvent) {
								if (postEvent.success) {
									Model.AppCache.posts.set(postEvent.posts[0]);
									common.refreshHandler.setRefresh.news(true);
								} else {
									Model.eventDefaultErrorCallback(postEvent);
								}
							});
						}
					}
	
					if (actionJSON !== null) {
						// update action
						eventJSON.event_id = actionJSON.id;
						if (actionJSON.start_time) {
							eventJSON.start_time = actionJSON.start_time;
						}
						indicator.showModal('Updating action...', 60000, 'Timeout updating action!');
						actionsModel.update(eventJSON, function(updateEvent) {
							if (updateEvent.success) {
								updateUserActions(false, updateEvent.events[0]);
							} else {
								indicator.hideModal();
								Model.eventDefaultErrorCallback(updateEvent);
							}
						});
					} else {
						// create new action
						indicator.showModal('Creating action...', 60000, 'Timeout creating action!');
						actionsModel.create(eventJSON, function(createEvent) {
							if (createEvent.success) {
								updateUserActions(true, createEvent.events[0]);
							} else {
								indicator.hideModal();
								Model.eventDefaultErrorCallback(createEvent);
							}
						});
					}
				}
				if(_photo !== ''){
					if (actionJSON !== null) {
						var photosModel = require('/lib/model/photos');
						indicator.showModal('Uploading photo...', 60000, 'Timeout uploading photo!');
						photosModel.create(_photo, function(_photoEvent){
							indicator.hideModal();
							if(_photoEvent.success){
								eventJSON.photo_id = _photoEvent.photos[0].id;
								saveActionItem();
							}
							else{
								Model.eventDefaultErrorCallback(_photoEvent);
							}
						});
					}
					else{
						eventJSON.photo = _photo;
						eventJSON['photo_sync_sizes[]'] = 'square_75';
						saveActionItem();
					}
				}
				else{
					saveActionItem();
				}
			} else {
				if(nameValid === false){
					Ti.UI.createAlertDialog({
						message : 'Select a name for your activity',
						buttonNames : [L('ok', 'OK')]
					}).show(); 
				}
				if(photoValid === false){
					Ti.UI.createAlertDialog({
						message : 'Select an image for your activity',
						buttonNames : [L('ok', 'OK')]
					}).show(); 
				}
			}
		});
		self.rightNavButton = saveButton;
	}
	
	var main_scrollView = Ti.UI.createScrollView({
		contentWidth: 'auto',
		contentHeight: 'auto',
		top: isAndroid ? 50 : 0,
		showVerticalScrollIndicator: true,
		showHorizontalScrollIndicator: false,
		scrollType: 'vertical',
		layout:'vertical'
	});
	AddHideKeyboardOnClick(main_scrollView);
	self.add(main_scrollView);

	var header_view = new ui.View({
		width: Ti.UI.FILL,
		top:0,
		left:0,
		height:theme.borderedImage.big.height + 20
	});
	AddHideKeyboardOnClick(header_view);
	main_scrollView.add(header_view);
	
	var actionPicItem = theme.images.uploadImage;
	if(actionJSON !== null && actionJSON.photo && actionJSON.photo.urls && actionJSON.photo.urls.square_75){
		actionPicItem = actionJSON.photo.urls.square_75;
	}
	else if(_new_action_params && _new_action_params.pic){
		actionPicItem = _new_action_params.pic;
	}
	
	var upload_pic = new ui.ImageViewBordered(actionPicItem, {
		width : theme.borderedImage.big.width,
		height : theme.borderedImage.big.height,
		left: 6,
		top: 6
	}); 
	upload_pic.children[0].onlineSavedPhoto = null;
	
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
	AddHideKeyboardOnClick(change_view);
	upload_pic.add(change_view);
	
	header_view.add(upload_pic);
	var photo_options_dialog = {
		//destructive:2,
		cancel:3
	};
	if(isAndroid){
		photo_options_dialog.buttonNames = ['Take a Photo', 'Select From Gallery', 'Search Online', 'Cancel'];
		photo_options_dialog.selectedIndex = 3;
	}
	else{
		photo_options_dialog.options = ['Take a Photo', 'Select From Gallery', 'Search Online', 'Cancel'];
	}
	
	var _photo = null;
	if(_new_action_params && _new_action_params.pic){
		_photo = _new_action_params.pic;
	}
	upload_pic.addEventListener('click', function(photoEvent) {
		blurText();
		
		if(this.clickTime && (new Date() - this.clickTime < 1000)){
			return false;
		}
		this.clickTime = new Date();
		
		var photo_dialog = Ti.UI.createOptionDialog(photo_options_dialog);
		photo_dialog.addEventListener('click', function(dialogEvent){
			if(dialogEvent.index === 0){
				// take a photo
				Ti.Media.showCamera({
					success: function(cameraEvent){
						if(cameraEvent.mediaType === Ti.Media.MEDIA_TYPE_PHOTO){
							var ImageFactory = require('ti.imagefactory');
							_photo = ImageFactory.imageAsResized(cameraEvent.media, { width:75, height:75});
							//_photo = ImageFactory.compress(_photo, 0.75);
							upload_pic.children[0].applyProperties({
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
							_photo = ImageFactory.imageAsResized(galleryEvent.media, { width:75, height:75});
							//_photo = ImageFactory.compress(_photo, 0.0);
							upload_pic.children[0].applyProperties({
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
			else if(dialogEvent.index === 2){
				var RemoteImagesWindow = require('/ui/RemoteImagesWindow');
				upload_pic.children[0].onlineSavedPhoto = null;
				var w = new RemoteImagesWindow({
					title : 'Search Online',
					query : action_txt.value,
					photo : upload_pic.children[0]
				});
				w.open({
					animated : true
				}); 
			}
		});
		photo_dialog.show();
	});
	
	var title_view = new ui.View({
		left: upload_pic.width + upload_pic.left + 5,
		top:0,
		layout:'vertical',
		width:Ti.UI.FILL,
		height:Ti.UI.FILL
	});
	AddHideKeyboardOnClick(title_view);
	header_view.add(title_view);
	
	var action_name_title = new ui.Label('Activity name:', {
		color: theme.textColor,
		top: 4,
		left: 3,
		font: theme.defaultFontBold
	});
	AddHideKeyboardOnClick(action_name_title);
	title_view.add(action_name_title);
	
	var def_action_name = '';
	if(actionJSON && actionJSON.name){
		def_action_name = actionJSON.name;
	}
	else if(_new_action_params && _new_action_params.name){
		def_action_name = _new_action_params.name;
	}
	var action_txt = Ti.UI.createTextField({
		top:0,
		left:0,
		right:10,
		paddingLeft:4,
		value: def_action_name,
		width:Ti.UI.FILL,
		height:30,
		font: theme.defaultFont,
		color: theme.textColor,
		textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
		appearance: Ti.UI.KEYBOARD_APPEARANCE_ALERT,
		returnKeyType:Ti.UI.RETURNKEY_NEXT,
		borderColor : theme.tableBorderColor,
		borderRadius : theme.defaultBorderRadius,
		backgroundColor: '#fff',
		hintText:'e.g. running',
		autocapitalization:Ti.UI.TEXT_AUTOCAPITALIZATION_SENTENCES,
		autocorrect:true,
		txtUpdating:false
	});
	action_txt.addEventListener('return', function(e){
		if(action_desc){
			action_desc.focus();
		}
	});
	action_txt.addEventListener('focus', function(e) {
		focusedText = this;
	});
	action_txt.addEventListener('blur', function(e) {
		focusedText = null;
		if(this.value === '') {
		}
	}); 
	action_txt.addEventListener('change', function(e) {
		// if(this.txtUpdating === false){
			// this.txtUpdating = true;
			// if(e.value.length > 26){
				// this.value = e.value.substr(0, 26);
			// }	
			// this.txtUpdating = false;
		// }
	});
	title_view.add(action_txt);
	
	var action_name_comment = new ui.Label('In present progressive', {
		color: theme.lightFontColor,
		top: 0,
		left: 3,
		font: {
			fontSize: 14,
			fontFamily: theme.fontFamily,
			fontWeight : 'normal'
		}
	});
	AddHideKeyboardOnClick(action_name_comment);
	title_view.add(action_name_comment);
	
	var defaultDescText = 'Description';
	if(actionJSON !== null && actionJSON.details){
		defaultDescText = actionJSON.details;
	}
	var action_desc = new ui.TextArea({
		value: defaultDescText,
		height: 70,
		top:0,
		left: 10,
		right:10,
		width:Ti.UI.FILL,
		font: theme.defaultFontItalic,
		color: theme.lightFontColor,
		textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
		appearance: Titanium.UI.KEYBOARD_APPEARANCE_ALERT,
		returnKeyType:Ti.UI.RETURNKEY_NEXT,
		borderColor : theme.tableBorderColor,
		borderRadius : theme.defaultBorderRadius,
		autocapitalization:Ti.UI.TEXT_AUTOCAPITALIZATION_SENTENCES,
		autocorrect:true,
		txtUpdating:false,
		cleanText:(defaultDescText === 'Description')
	});
	action_desc.addEventListener('return', function(e){
		if(action_comment_desc){
			action_comment_desc.focus();
		}
	});
	action_desc.addEventListener('focus', function(e) {
		focusedText = this;
		if(this.cleanText === true) {
			this.font = theme.defaultFont;
			this.color = theme.textColor;
			this.value = '';
			this.cleanText = false;
		}
	});
	action_desc.addEventListener('blur', function(e) {
		focusedText = null;
		if(this.value === '') {
			this.font = theme.defaultFontItalic;
			this.color = theme.lightFontColor;
			this.value = defaultDescText;
			this.cleanText = true;
		}
	}); 
	action_desc.addEventListener('change', function(e) {
		if(this.txtUpdating === false){
			this.txtUpdating = true;
			if(e.value.length > 140){
				this.value = e.value.substr(0, 140);
			}	
			this.txtUpdating = false;
		}
	});
	main_scrollView.add(action_desc);
	
	var advanced_view = Titanium.UI.createView({
		top:theme.defaultItemSpacing,
		left: 10,
		right:10,
		backgroundColor : theme.tableBackgroundColor,
		height : theme.tableDefaultHeight,
		borderColor : theme.tableBorderColor,
		borderRadius : theme.defaultBorderRadius
	});
	advanced_view.addEventListener('click', function(e) {
		blurText();
		
		main_scrollView.remove(faq_actions_label);
		if (action_delete_button) {
			main_scrollView.remove(action_delete_button);
		}
		main_scrollView.remove(advanced_view);
		
		showAdvanced();
		
		if (action_delete_button) {
			main_scrollView.add(action_delete_button);
		}
		main_scrollView.add(faq_actions_label);
		
		main_scrollView.contentHeight = 'auto';
	});
	
	var advanced_label = Ti.UI.createLabel({
		text : 'Advanced settings',
		color : theme.textColor,
		top : 10,
		left : 10,
		font : theme.defaultFontBold
	});
	advanced_view.add(advanced_label);
	
	var advanced_icon = Ti.UI.createImageView({
		top : 14,
		right : 8,
		image : theme.images.disclosureDown,
		hires:true
	});
	advanced_view.add(advanced_icon);
	
	var showingAdvanced = false,
		action_by_desc = null,
		action_comment_desc = null,
		action_url_desc = null,
		action_visibility_table = null,
		attributes_rowCount = 0,
		attributes_table = null;
		
	if(openAdvanced){
		showAdvanced();
	}
	else{
		main_scrollView.add(advanced_view);
	}
	
	function createAttributeRow(_attribute) {
		var row = Titanium.UI.createTableViewRow({
			selectionStyle:Ti.UI.iPhone.TableViewCellSelectionStyle.NONE,
			hasChild : _attribute.hasChild,
			height : theme.tableDefaultHeight,
			attribute_name : _attribute.name,
			attribute_type : _attribute.type,
			att_JSON_data : _attribute.dataJSON,
			backgroundColor:theme.tableBackgroundColor,
			clickName: _attribute.clickName,
			className : 'Attribute_Row'
		});

		// generate the controls based on the JSON results
		switch(_attribute.type) {
			case 'bool':
				var bool_name = Ti.UI.createLabel({
					text : _attribute.name,
					color : theme.textColor,
					top : 10,
					left : 10,
					width : '64%',
					font : theme.defaultFontBold
				});
				row.add(bool_name);

				var bool_action = new ui.Switch({
					right : 10,
					value : _attribute.value,
					style : isAndroid ? Ti.UI.Android.SWITCH_STYLE_CHECKBOX : null
				});
				row.add(bool_action);
				break;
			case 'text':
				var text_action = Ti.UI.createTextField({
					left : 10,
					value : _attribute.value,
					right : 10,
					width : Ti.UI.FILL,
					height : Ti.UI.FILL,
					top : 5,
					bottom : 5,
					font : theme.defaultFontItalic,
					color : theme.lightFontColor,
					textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
					appearance : Titanium.UI.KEYBOARD_APPEARANCE_ALERT,
					returnKeyType : Ti.UI.RETURNKEY_DONE,
					borderColor : '#fff',
					backgroundColor : '#fff',
					backgroundSelectedColor : '#fff',
					txtUpdating : false,
					defaultValue:_attribute.value
				});
				text_action.addEventListener('focus', function(e) {
					if(this.value === 'Anything to add?') {
						this.font = theme.defaultFont;
						this.color = theme.textColor;
						this.value = '';
					}
				});
				text_action.addEventListener('blur', function(e) {
					if(this.value === '') {
						this.font = theme.defaultFontItalic;
						this.color = theme.lightFontColor;
						this.value = this.defaultValue;
					}
				}); 
				text_action.addEventListener('change', function(e) {
					if (this.txtUpdating === false) {
						this.txtUpdating = true;
						if (e.value.length > 30) {
							this.value = e.value.substr(0, 30);
						}
						this.txtUpdating = false;
					}
				});
				row.add(text_action);

				break;
			case 'custom':
				
				var custom_name = Ti.UI.createLabel({
					text : _attribute.name,
					color : theme.textColor,
					top : 10,
					left : 10,
					font : theme.defaultFontBold
				});
				row.add(custom_name);

				var custom_action = Ti.UI.createLabel({
					text : _attribute.value,
					color : theme.tableSelectedValueColor,
					top : 10,
					right : 10,
					font : _attribute.font ? _attribute.font : theme.defaultFont,
					textAlign : Ti.UI.TEXT_ALIGNMENT_RIGHT
				});
				row.add(custom_action);

				break;
			case 'button':
				var button_name = Ti.UI.createLabel({
					text : _attribute.name,
					color : theme.textColor,
					top : 10,
					left : 10,
					width : '100%',
					font : theme.defaultFontBold,
					textAlign : Ti.UI.TEXT_ALIGNMENT_LEFT
				});
				row.add(button_name);
				break;
			default:
				break;
		}
		return row;
	}
	
	function showAdvanced(){
		showingAdvanced = true;
		
		var attributes_title = new ui.Label('Properties', {
			color: theme.textColor,
			top: theme.defaultItemSpacing,
			left: 13,
			font: theme.defaultFontBold
		});
		AddHideKeyboardOnClick(attributes_title);
		main_scrollView.add(attributes_title);
		
		var att_rows = [];
		if(actionJSON !== null && actionJSON.custom_fields && 
		   actionJSON.custom_fields.attributes && actionJSON.custom_fields.attributes.length > 0){
		   	for(var i=0; i<actionJSON.custom_fields.attributes.length; i++){
		   		var att = actionJSON.custom_fields.attributes[i];
		   		var attRow = createAttributeRow({ 
		   			type: 'custom', 
		   			name: att.title, 
		   			value: att.type, 
		   			hasChild:true, 
		   			dataJSON:att 
		   		});
		   		att_rows.push(attRow);
		   		attributes_rowCount++;
		   	}
		}
		var addAttributeButtonRow = createAttributeRow({
				type: 'button', 
				name:'Add Property...', 
				hasChild:true, 
				dataJSON:null
		});
		addAttributeButtonRow.appendedToTable = false;
		
		if(attributes_rowCount < 3){
			addAttributeButtonRow.appendedToTable = true;
			att_rows.push(addAttributeButtonRow);
			attributes_rowCount++;
		}
		
		attributes_table = Ti.UI.createTableView({
			data : att_rows,
			top : 0,
			borderColor : theme.tableBorderColor,
			borderRadius : theme.defaultBorderRadius,
			scrollable: false,
			left: 10,
			right:10,
			backgroundColor:theme.winBgColor,
			height: attributes_rowCount * theme.tableDefaultHeight
		});
		attributes_table.addEventListener('row.add', function(e){
			var r = createAttributeRow({
				type : 'custom',
				name : e.name,
				value : e.value,
				hasChild : true,
				dataJSON : e.jsonData
			});
			attributes_table.insertRowBefore(0, r, {
				animated : true,
				animationStyle : Ti.UI.iPhone.RowAnimationStyle.TOP
			});
			attributes_rowCount++;
			if (attributes_rowCount === 4 && addAttributeButtonRow.appendedToTable === true) {
				addAttributeButtonRow.appendedToTable = false;
				attributes_table.deleteRow(3, {
					animated : true,
					animationStyle : Ti.UI.iPhone.RowAnimationStyle.FADE
				});
				attributes_rowCount--;
			}
			attributes_table.height = attributes_rowCount * theme.tableDefaultHeight;
		});
		attributes_table.addEventListener('row.update', function(e){
			e.row.children[0].text = e.name;
			e.row.children[1].text = e.value;
			e.row.att_JSON_data = e.jsonData;
		});
		attributes_table.addEventListener('row.delete', function(e){
			attributes_table.deleteRow(e.index, {
				animated : true,
				animationStyle : Ti.UI.iPhone.RowAnimationStyle.FADE
			});
			attributes_rowCount--;
			if (attributes_rowCount === 2 && addAttributeButtonRow.appendedToTable === false) {
				addAttributeButtonRow.appendedToTable = true;
				attributes_table.insertRowAfter(1, addAttributeButtonRow, {
					animated : true,
					animationStyle : Ti.UI.iPhone.RowAnimationStyle.BOTTOM
				});
				attributes_rowCount++;
			}
			attributes_table.height = attributes_rowCount * theme.tableDefaultHeight;
		});
		attributes_table.addEventListener('click', function(e){
			blurText();
			
			if(this.clickTime && (new Date() - this.clickTime < 1000)){
				return false;
			}
			this.clickTime = new Date();
			
			if(e.row === addAttributeButtonRow){
				var win = new NewAttributeWindow({rowIndex:e.index, rowData: {att_JSON_data:null}, table:this, newAttribute:true});
				if(isAndroid){
					win.open();
				}
				else{
					require('/ui/MasterWindow').getNavGroup().open(win);
				}
			}
			else if(e.row.hasChild === true) {
				var win = new NewAttributeWindow({rowIndex:e.index, rowData: e.row, table:this, newAttribute:false});
				
				if(isAndroid){
					win.open();
				}
				else{
					require('/ui/MasterWindow').getNavGroup().open(win);
				}
			}
		});
		//attributes_table.setData(att_rows);
		//attributes_table.height = attributes_rowCount * theme.tableDefaultHeight;
		main_scrollView.add(attributes_table);
		att_rows = null;
		
		// identifier field
		var action_by_title = new ui.Label('Activity by', {
			color: theme.textColor,
			top: theme.defaultItemSpacing,
			left: 13,
			font: theme.defaultFontBold
		});
		if(!_new_action_params){
			//AddHideKeyboardOnClick(action_by_title);
			//main_scrollView.add(action_by_title);
		}
		
		var defaultActionByTextValue = 'By ';
		if(actionJSON !== null && actionJSON.custom_fields &&
		   actionJSON.custom_fields.action_by_value && actionJSON.custom_fields.action_by_value.length > 0){
			defaultActionByTextValue = actionJSON.custom_fields.action_by_value;
		}
		
		var by_default_user = 'By John Smith';
		if(currentUser && currentUser.username){
			var uname = common.getUserDisplayName(currentUser);
			
			by_default_user = 'By ' + uname;
		}
		
		action_by_desc = Ti.UI.createTextField({
			top:0,
			left:10,
			right:10,
			paddingLeft:4,
			value: defaultActionByTextValue,
			width:300,
			height:theme.tableDefaultHeight,
			font: theme.defaultFont,
			color: theme.textColor,
			textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
			keyboardType: Ti.UI.KEYBOARD_DEFAULT,
			appearance: Ti.UI.KEYBOARD_APPEARANCE_ALERT,
			returnKeyType:Ti.UI.RETURNKEY_NEXT,
			borderColor : theme.tableBorderColor,
			borderRadius : theme.defaultBorderRadius,
			backgroundColor: '#fff',
			hintText:by_default_user,
			autocapitalization:Ti.UI.TEXT_AUTOCAPITALIZATION_SENTENCES,
			autocorrect:true,
			txtUpdating:false
		});
		action_by_desc.addEventListener('return', function(e){
			if(action_comment_desc){
				action_comment_desc.focus();
			}
		});
		action_by_desc.addEventListener('focus', function(e) {
			focusedText = this;
		});
		action_by_desc.addEventListener('blur', function(e) {
			if(action_by_desc.value && action_by_desc.value.length){
				action_by_desc.value = action_by_desc.value.trim();
				if(action_by_desc.value.toLowerCase() === 'by'){
					action_by_desc.value = '';
				}
			}
			focusedText = null;
		}); 
		action_by_desc.addEventListener('change', function(e) {
			if(this.txtUpdating === false){
				this.txtUpdating = true;
				if(e.value.length > 140){
					this.value = e.value.substr(0, 140);
				}	
				this.txtUpdating = false;
			}
		});
		if(!_new_action_params){
			//main_scrollView.add(action_by_desc);
		}
		
		var action_by_comment = new ui.Label('Help users identify your activity (e.g. "' + by_default_user + '")', {
			color: theme.lightFontColor,
			top: 0,
			left: 13,
			font: {
				fontSize: 14,
				fontFamily: theme.fontFamily,
				fontWeight : 'normal'
			}
		});
		if(!_new_action_params){
			//AddHideKeyboardOnClick(action_by_comment);
			//main_scrollView.add(action_by_comment);
		}
		
		// anything to add field
		var action_comment_title = new ui.Label('Default activity comment', {
			color: theme.textColor,
			top: theme.defaultItemSpacing,
			left: 13,
			font: theme.defaultFontBold
		});
		if(!_new_action_params){
			//AddHideKeyboardOnClick(action_comment_title);
			//main_scrollView.add(action_comment_title);
		}
		
		var defaultCommentTextValue = '';
		if(actionJSON !== null && actionJSON.custom_fields &&
		   actionJSON.custom_fields.text_value && actionJSON.custom_fields.text_value.length > 0){
			defaultCommentTextValue = actionJSON.custom_fields.text_value;
		}
		action_comment_desc = Ti.UI.createTextField({
			top:0,
			left:10,
			right:10,
			paddingLeft:4,
			value: defaultCommentTextValue,
			width:300,
			height:theme.tableDefaultHeight,
			font: theme.defaultFont,
			color: theme.textColor,
			textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
			keyboardType: Ti.UI.KEYBOARD_DEFAULT,
			appearance: Ti.UI.KEYBOARD_APPEARANCE_ALERT,
			returnKeyType:Ti.UI.RETURNKEY_NEXT,
			borderColor : theme.tableBorderColor,
			borderRadius : theme.defaultBorderRadius,
			backgroundColor: '#fff',
			hintText:'Anything to add?',
			autocapitalization:Ti.UI.TEXT_AUTOCAPITALIZATION_SENTENCES,
			autocorrect:true,
			txtUpdating:false
		});
		action_comment_desc.addEventListener('return', function(e){
			if(action_url_desc){
				action_url_desc.focus();
			}
		});
		action_comment_desc.addEventListener('focus', function(e) {
			focusedText = this;
		});
		action_comment_desc.addEventListener('blur', function(e) {
			focusedText = null;
		}); 
		action_comment_desc.addEventListener('change', function(e) {
			if(this.txtUpdating === false){
				this.txtUpdating = true;
				if(e.value.length > 140){
					this.value = e.value.substr(0, 140);
				}	
				this.txtUpdating = false;
			}
		});
		if(!_new_action_params){
			//main_scrollView.add(action_comment_desc);
		}
		
		// action url selector cell
		var action_url_title = new ui.Label('Activity URL', {
			color: theme.textColor,
			top: theme.defaultItemSpacing,
			left: 13,
			font: theme.defaultFontBold
		});
		AddHideKeyboardOnClick(action_url_title);
		main_scrollView.add(action_url_title);
		
		var defaultActionUrl = '';
		if(actionJSON && actionJSON.custom_fields && actionJSON.custom_fields.action_url){
			defaultActionUrl = actionJSON.custom_fields.action_url;
		}
		var rightSearchButton = Titanium.UI.createButton({
			image:theme.images.searchUrl,
			height:26,
			width:26,
			style:Ti.UI.iPhone.SystemButtonStyle.PLAIN
		});
		rightSearchButton.addEventListener('click', function(e){
			blurText();
			
			if(this.clickTime && (new Date() - this.clickTime < 1000)){
				return false;
			}
			this.clickTime = new Date();
			
			var urlWebView = require('/lib/urlWebView');		
			var urlWin = new urlWebView(action_url_desc.value, 'Search Activity URL', {
				text : action_url_desc,
				option_text : 'Use as Activity URL'
			});
			require('/ui/MasterWindow').getNavGroup().open(urlWin);
			
			require('/lib/analytics').trackEvent({
				category : 'url',
				action : 'click',
				label : action_url_desc.value,
				value : null
			});
		});
		action_url_desc = Ti.UI.createTextField({
			top:0,
			left:10,
			right:10,
			paddingLeft:4,
			value: defaultActionUrl,
			width:300,
			height:theme.tableDefaultHeight,
			font: theme.defaultFont,
			color: theme.tableSelectedValueColor,
			textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
			keyboardType:Ti.UI.KEYBOARD_URL,
			appearance: Titanium.UI.KEYBOARD_APPEARANCE_ALERT,
			returnKeyType:Ti.UI.RETURNKEY_DEFAULT,
			rightButton:rightSearchButton,
			rightButtonMode:Ti.UI.INPUT_BUTTONMODE_ONBLUR,
			borderColor : theme.tableBorderColor,
			borderRadius : theme.defaultBorderRadius,
			backgroundColor: '#fff',
			autocapitalization:Ti.UI.TEXT_AUTOCAPITALIZATION_NONE,
			autocorrect:false,
			hintText:'http://site.com/activity-page'
		});
		action_url_desc.addEventListener('focus', function(e) {
			focusedText = this;
		});
		action_url_desc.addEventListener('blur', function(e) {
			focusedText = null;
		});
		main_scrollView.add(action_url_desc);
		
		var action_url_comment = new ui.Label('Related webpage (e.g. activity details)', {
			color: theme.lightFontColor,
			top: 0,
			left: 13,
			font: {
				fontSize: 14,
				fontFamily: theme.fontFamily,
				fontWeight : 'normal'
			}
		});
		AddHideKeyboardOnClick(action_url_comment);
		main_scrollView.add(action_url_comment);
		
			var action_visibility_title = new ui.Label('Activity visibility', {
			color: theme.textColor,
			top: theme.defaultItemSpacing,
			left: 13,
			font: theme.defaultFontBold
		});
		AddHideKeyboardOnClick(action_visibility_title);
		main_scrollView.add(action_visibility_title);
		
		var actionExpirationRow = createAttributeRow({
			type: 'custom', 
			name: L('expiration_date'), 
			value:'Select', 
			hasChild:true, 
			dataJSON:null,
			clickName:'date'
		});
		actionExpirationRow.children[0].width = 'auto';
		actionExpirationRow.children[1].width = Ti.UI.FILL;
		if(actionJSON && actionJSON.custom_fields && actionJSON.custom_fields.expiration_date){
			actionExpirationRow.expiration_date = actionJSON.custom_fields.expiration_date;
			actionExpirationRow.children[0].text = 'Expires';
			//actionExpirationRow.children[0].font = theme.defaultToolTipFontBold;
			actionExpirationRow.children[1].text = moment(actionJSON.custom_fields.expiration_date.value).format('MMMM DD, YYYY');
			//actionExpirationRow.children[1].font = theme.defaultToolTipFontBold;
		}
		
		var actionVisibleRow = createAttributeRow({
			type: 'bool', 
			name: L('action_visible'), 
			value:(actionJSON !== null && actionJSON.custom_fields && actionJSON.custom_fields.isPublic === false ? false : true), 
			hasChild:false, 
			dataJSON:null
		});
		
		action_visibility_table = Ti.UI.createTableView({
			top : 0,
			data:[actionExpirationRow,actionVisibleRow],
			borderColor : theme.tableBorderColor,
			borderRadius : theme.defaultBorderRadius,
			scrollable: false,
			left: 10,
			right:10,
			backgroundColor:theme.winBgColor,
			height: 2 * theme.tableDefaultHeight
		});
		action_visibility_table.addEventListener('click', function(e){
			blurText();
			
			if(this.clickTime && (new Date() - this.clickTime < 1000)){
				return false;
			}
			this.clickTime = new Date();
			
			if(e && e.row.clickName){
				switch(e.row.clickName){
					case 'date':
						var datePicker = require('/lib/datePicker');
						var datePickerWindow = new datePicker.expirationDatePicker({
							title:e.row.attribute_name,
							row:e.row
						});
						require('/ui/MasterWindow').getNavGroup().open(datePickerWindow);
						break;
					default:
						break;
				}
			}
		});
		main_scrollView.add(action_visibility_table);
	
	}
	
	var action_delete_button = null;
	if(actionJSON && actionJSON.id){
		action_delete_button = Ti.UI.createButton({
			title : L('delete').toUpperCase(),
			font : theme.defaultButtonFont,
			width : 300,
			height : 40,
			top : 10,
			left : 10,
			color: theme.whiteFontColor,
			selectedColor:theme.lightFontColor,
			backgroundImage : theme.buttonImage.red.normal,
			backgroundSelectedImage : theme.buttonImage.red.selected,
			//borderRadius: theme.defaultBorderRadius,
			//backgroundGradient: theme.backgroundGradient.red,
			style : isAndroid ? null : Ti.UI.iPhone.SystemButtonStyle.PLAIN
		});
	
		action_delete_button.addEventListener('click', function(e) {
			if (this.clickTime && (new Date() - this.clickTime < 1000)) {
				return false;
			}
			this.clickTime = new Date();
	
			var dlg = Ti.UI.createAlertDialog({
				title : Ti.App.name,
				message : 'Are you sure you want to delete this activity?',
				buttonNames : ['Yes', 'Cancel'],
				cancel : 1
			});
			dlg.addEventListener('click', function(alertEvent) {
				require('/lib/analytics').trackEvent({
					category : 'activity',
					action : 'delete',
					label : _actionId,
					value : alertEvent.index === 0 ? 1 : 0
				});
				
				if (alertEvent.index === 0) {
					// remove action
					var updateJSON = {
						event_id : actionJSON.id,
						acl_name : 'actions_acl_deleted',
						custom_fields : {
							disabled:true
						}
					};
	
					var ActionsModel = require('/lib/model/actions');
					ActionsModel.update(updateJSON, function(updateEvent) {
						if (updateEvent.success) {
							common.refreshHandler.setRefresh.actions(true);
							common.refreshHandler.setRefresh.myActions(true);
	
							Model.AppCache.actions.set(updateEvent.events[0]);
							
							currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
							if (currentUser && currentUser.custom_fields && currentUser.custom_fields.my_actions) {
								var idx = currentUser.custom_fields.my_actions.indexOf(actionJSON.id);
								if(idx > -1){
									currentUser.custom_fields.my_actions.splice(idx, 1);
								}
							}
							
							if(addToGroup){
								var groupActions = Ti.App.Properties.getList('carely_addedActionToGroup', null);
								if(groupActions){
									var idx = groupActions.indexOf(actionJSON.id);
									if(idx > -1){
										groupActions.splice(idx, 1);
										Ti.App.Properties.setList('carely_addedActionToGroup', addedAction);
									}
								}
							}
							
							Ti.App.Properties.setBool('carely_CloseAddActionsWindow', true);
							require('/ui/MasterWindow').getNavGroup().close(self, { animated : true });
						} else {
							Model.eventDefaultErrorCallback(updateEvent);
						}
					});
				}
			});
			dlg.show();
		});
		main_scrollView.add(action_delete_button);
	}	 
	
	var faq_actions_label = Ti.UI.createLabel({
		text : L('faq_actions', 'Learn about Activities'),
		font : theme.defaultFontBold,
		color : theme.darkBlueLink,
		top : theme.defaultItemSpacing,
		width:Ti.UI.FILL,
		textAlign : Ti.UI.TEXT_ALIGNMENT_CENTER
	});
	faq_actions_label.addEventListener('click', function(e){
		blurText();
		
		var urlWebView = require('/lib/urlWebView');
		var urlWin = new urlWebView('http://care.ly/faqs/how-to-create-a-new-action/', 'FAQ', null, false);
		require('/ui/MasterWindow').getNavGroup().open(urlWin);
		
		require('/lib/analytics').trackEvent({
			category : 'url',
			action : 'click',
			label : 'http://care.ly/faqs/how-to-create-a-new-action/',
			value : null
		});
	});
	main_scrollView.add(faq_actions_label);
		
	self.addEventListener('focus', function(e){
		if(Ti.App.Properties.getBool('carely_goToHome', false) === true){
			require('/ui/MasterWindow').getNavGroup().close(this, {animated:false});
		}
		else{
			require('/lib/analytics').trackScreen({ screenName : self.title });
		}
	});
	
	return self;
};

function NewAttributeWindow(params){
	var _ = require('/lib/underscore'),
		theme = require('/ui/theme'), 
		ui = require('/ui/components'),
		moment = require('/lib/date/moment');
		
	var isAndroid = Ti.Platform.osname === 'android';
	var currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
	var action_index = params.rowIndex, action_rowData = params.rowData, action_table = params.table, newAttribute = params.newAttribute;
	
	var self = Ti.UI.createWindow({
		title : 'Property details',
		navBarHidden : isAndroid,
		backgroundColor: theme.winBgColor,
		orientationModes : [Ti.UI.PORTRAIT],
		backButtonTitle:'Save'
	});
	
	if(isAndroid){
		
	}
	else{
		self.barColor = theme.barColor;
		
		var clearButton = Ti.UI.createButton({
			title: L('clear')
		});
		clearButton.addEventListener('click', function(e){
			if(this.clickTime && (new Date() - this.clickTime < 1000)){
				return false;
			}
			this.clickTime = new Date();
			
			text_action.blur();
			text_action.value = '';
			if (attribute_rows !== null){
				while(attribute_rows.length > 1){
					attribute_rows.pop();
				}
				createAttributeTypeRows('On/Off');
			}
			
			require('/lib/analytics').trackEvent({
				category : 'attirbute',
				action : 'clear',
				label : null,
				value : null
			});
		});
		self.rightNavButton = clearButton;
	}
	
	var main_scrollView = new ui.ScrollView({
		contentWidth: 'auto',
		contentHeight: 'auto',
		top: isAndroid ? 50 : 0,
		showVerticalScrollIndicator: true,
		showHorizontalScrollIndicator: true,
		scrollType: 'vertical',
		layout:'vertical'
	});
	self.add(main_scrollView);
	
	var att_name = new ui.Label('Property name:', {
		color : theme.textColor,
		top : 0,
		left : 10,
		font : {
			fontSize : 16,
			fontFamily : theme.fontFamily,
			fontWeight : 'bold'
		}
	}); 
	main_scrollView.add(att_name);
	
	var text_action = Ti.UI.createTextField({
		left : 10,
		right:10,
		paddingLeft:4,
		value : action_rowData.att_JSON_data !== null ? action_rowData.att_JSON_data.title : '',
		width : Ti.UI.FILL,
		height : 31,
		font: theme.defaultFont,
		color: theme.textColor,
		textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
		appearance : Titanium.UI.KEYBOARD_APPEARANCE_ALERT,
		returnKeyType : Ti.UI.RETURNKEY_DONE,
		borderColor : theme.lightFontColor,
		backgroundColor : '#fff',
		txtUpdating : false,
		autocapitalization:Ti.UI.TEXT_AUTOCAPITALIZATION_NONE
	});
	text_action.addEventListener('change', function(e) {
		if(this.txtUpdating === false){
			this.txtUpdating = true;
			if(e.value.length > 20){
				this.value = e.value.substr(0, 20);
			}	
			this.txtUpdating = false;
		}
	});
	main_scrollView.add(text_action);
	
	main_scrollView.addEventListener('click', function(e){
		text_action.blur();
	});
	
	var att_value_name = Ti.UI.createLabel({
		text:'Property value:',
		color : theme.textColor,
		top : 10,
		left : 10,
		font : theme.defaultFontBold
	}); 
	main_scrollView.add(att_value_name);
	
	var defaultListValue = 'e.g. red,blue,green';
	function createAttributeRow(_data) {
		var row = Ti.UI.createTableViewRow({
			selectionStyle:Ti.UI.iPhone.TableViewCellSelectionStyle.NONE,
			hasChild : _data.hasChild,
			attribute_type : _data.type,
			attribute_sub_type : _data.subType,
			backgroundColor:theme.tableBackgroundColor,
			height:theme.tableDefaultHeight,
			className : 'Attribute_Row'
		});

		var name = Ti.UI.createLabel({
			text: _data.name,
			color : theme.textColor,
			top : 12,
			left : 10,
			width : '64%',
			font : theme.defaultFontBold
		});
		row.add(name);

		// generate the controls based on the JSON results
		switch(_data.type) {
			case 'bool':
				var bool_action = Ti.UI.createSwitch({
					right : 10,
					value : _data.value,
					style : isAndroid ? Ti.UI.Android.SWITCH_STYLE_CHECKBOX : null,
					enabled : _data.enabled
				});
				row.hasChild = false;

				row.add(bool_action);
				break;
			case 'text':
				name.top = 5;
				name.width = 'auto';
				name.height = 40;
				row.height = 140;
				var txt_action = Ti.UI.createTextArea({
					value: _data.textValue,
					height:80,
					top : 40,
					left : 10,
					right : 10,
					width:'90%',
					font: theme.defaultFontItalic,
					color: theme.lightFontColor,
					textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
					appearance: Titanium.UI.KEYBOARD_APPEARANCE_ALERT,
					returnKeyType:Ti.UI.RETURNKEY_DONE,
					borderColor:'#fff',
					backgroundSelectedColor:'#fff',
					cleanText: true,
					txtUpdating: false,
					defaultText: _data.textValue,
					autocapitalization:Ti.UI.TEXT_AUTOCAPITALIZATION_NONE,
					defaultValue:_data.textValue
				});
				txt_action.addEventListener('focus', function(e) {
					if(this.value === defaultListValue) {
						this.font = theme.defaultFont;
						this.color = theme.textColor;
						this.value = '';
					}
				});
				txt_action.addEventListener('blur', function(e) {
					if(this.value === '') {
						this.font = theme.defaultFontItalic;
						this.color = theme.lightFontColor;
						this.value = this.defaultValue;
					}
				}); 
				txt_action.addEventListener('change', function(e) {
					if(this.txtUpdating === false){
						this.txtUpdating = true;
						if(e.value.length > 140){
							this.value = e.value.substr(0, 140);
						}	
						this.txtUpdating = false;
					}
				});
				row.add(txt_action);
				break;
			default:
				row.att_vals = _data.value;
				var picker_action = Ti.UI.createLabel({
					text: _data.textValue,
					color : theme.tableSelectedValueColor,
					top : 12,
					right : 10,
					width : '39%',
					font : theme.defaultFont,
					textAlign : Ti.UI.TEXT_ALIGNMENT_RIGHT,
					defaultText: _data.textValue
				});
				row.add(picker_action);
				break;
		}
		return row;
	}

	function createAttributeTypeRows(_type) {
		switch(_type.toLowerCase()) {
			case 'on/off':
				var bool_defaultRow = createAttributeRow({
					type: 'bool', 
					subType: 'bool',
					name: 'Default Value', 
					value: false,
					enabled:false,
					hasChild:false
				});
				attribute_rows.push(bool_defaultRow);
				
				break;
			case 'range':
				var range_allowEmptyRow = createAttributeRow({
					type: 'bool', 
					subType: 'bool',
					name: 'Allow Empty', 
					value: true, 
					enabled:true,
					hasChild:false
				});
				attribute_rows.push(range_allowEmptyRow);
				
				var range_valuesRow = createAttributeRow({
					type: 'picker', 
					subType: 'range',
					name: 'Values', 
					value: null, 
					textValue:'from # to #',
					hasChild:true
				});
				attribute_rows.push(range_valuesRow);
				
				var range_defaultRow = createAttributeRow({
					type: 'picker', 
					subType: 'range_default',
					name: 'Default Value', 
					value: null, 
					textValue:'Select',
					hasChild:true
				});
				attribute_rows.push(range_defaultRow);
				break;
			case 'list':
				var list_allowEmptyRow = createAttributeRow({
					type: 'bool', 
					subType: 'bool',
					name: 'Allow Empty', 
					value: true, 
					enabled:true,
					hasChild:false
				});
				attribute_rows.push(list_allowEmptyRow);
				
				var list_valuesRow = createAttributeRow({
					type: 'text', 
					subType: 'list_values',
					name: 'Selection list: (comma seperated)', 
					value: null, 
					textValue:defaultListValue,
					hasChild:false
				});
				attribute_rows.push(list_valuesRow);
				
				var list_allowMultipleRow = createAttributeRow({
					type: 'bool', 
					subType: 'bool',
					name: 'Allow Multiple Selection', 
					value: false, 
					enabled:true,
					hasChild:false
				});
				attribute_rows.push(list_allowMultipleRow);
				
				var list_defaultRow = createAttributeRow({
					type: 'picker', 
					subType: 'list_default',
					name: 'Default Value', 
					value: null, 
					textValue:'Select',
					hasChild:true
				});
				attribute_rows.push(list_defaultRow);
				break;
			default:
				break;
		}
	}
	
	var attribute_rows = [];
	var mainTextValue = 'On/Off';
	if(action_rowData.att_JSON_data !== null){
		switch(action_rowData.att_JSON_data.type){
			case 'bool':
				mainTextValue = 'On/Off';
				break;
			case 'range':
				mainTextValue = 'Range';
				break;
			case 'dictionary':
				mainTextValue = 'List';
				break;
			default:
				'On/Off';
				break;
		}
	}
	var mainTypeRow = createAttributeRow({
		type: 'picker', 
		subType: 'main',
		name: 'Type', 
		value: ['On/Off', 'List', 'Range'],
		textValue:mainTextValue,
		hasChild:true
	});
	attribute_rows.push(mainTypeRow);

	createAttributeTypeRows(mainTextValue);
	if(action_rowData.att_JSON_data !== null){
		switch(action_rowData.att_JSON_data.type){
			case 'bool':
				attribute_rows[1].children[1].value = action_rowData.att_JSON_data.value; 
				break;
			case 'range':
				attribute_rows[1].children[1].value = true;
				if(typeof action_rowData.att_JSON_data.allowEmpty !== 'undefined'){
					attribute_rows[1].children[1].value = action_rowData.att_JSON_data.allowEmpty;
				}
				attribute_rows[2].children[1].text = action_rowData.att_JSON_data.value;
				attribute_rows[3].children[1].text = action_rowData.att_JSON_data.value.split('-')[0];
				if(typeof action_rowData.att_JSON_data.defaultValue !== 'undefined'){
					attribute_rows[3].children[1].value = action_rowData.att_JSON_data.defaultValue;
				}
				break;
			case 'dictionary':
				attribute_rows[1].children[1].value = true;
				if(typeof action_rowData.att_JSON_data.allowEmpty !== 'undefined'){
					attribute_rows[1].children[1].value = action_rowData.att_JSON_data.allowEmpty;
				}
				attribute_rows[2].children[1].value = action_rowData.att_JSON_data.value.join(',');
				if(typeof action_rowData.att_JSON_data.allowMultiple !== 'undefined'){
					attribute_rows[3].children[1].value = action_rowData.att_JSON_data.allowMultiple;
				} 
				attribute_rows[4].children[1].text = action_rowData.att_JSON_data.value[0];
				if(typeof action_rowData.att_JSON_data.defaultValue !== 'undefined'){
					attribute_rows[4].children[1].value = action_rowData.att_JSON_data.defaultValue;
				}
				break;
			default:
				'On/Off';
				break;
		}
	}
	
	function getAttributeHeight(_data){
		var height = 0;
		for(var ii=0; ii<_data.length; ii++){
			height += _data[ii].height;
		}	
		return height;
	}
	var attributes_table = Ti.UI.createTableView({
		data : attribute_rows,
		top: 0,
		borderColor: theme.tableBorderColor,
		borderRadius: theme.defaultBorderRadius,
		scrollable: false,
		left: 10,
		right:10,
		backgroundColor : theme.tableBackgroundColor,
		height: getAttributeHeight(attribute_rows)
	}); 
	
	var slideIn = Ti.UI.createAnimation({
		bottom : 0
	});
	var slideOut = Ti.UI.createAnimation({
		bottom : -251
	});
	
	attributes_table.addEventListener('click', function(tableEvent) {
		if(this.clickTime && (new Date() - this.clickTime < 1000)){
			return false;
		}
		this.clickTime = new Date();
		
		text_action.blur();
		if (tableEvent.row.hasChild === true && tableEvent.row.attribute_type === 'picker') {
			var slide_view = Ti.UI.createView({
				height : 251,
				bottom : -251
			});
			self.add(slide_view);

			var cancelButton = Ti.UI.createButton({
				systemButton : Ti.UI.iPhone.SystemButton.CANCEL
			});
			cancelButton.addEventListener('click', function(e) {
				if(this.clickTime && (new Date() - this.clickTime < 1000)){
					return false;
				}
				this.clickTime = new Date();
				
				slide_view.animate(slideOut);
				
				setTimeout(function() {
					slide_view.remove(toolBar);
					toolBar = null;
					cancelButton = null
					doneButton = null;
					spaceButton = null;
					
					self.remove(slide_view);
					slide_view = null;
					
				}, 500);
			});
			var spaceButton = Ti.UI.createButton({
				systemButton : Ti.UI.iPhone.SystemButton.FLEXIBLE_SPACE
			});
			var doneButton = Ti.UI.createButton({
				systemButton : Ti.UI.iPhone.SystemButton.DONE
			});
			var toolBar = Ti.UI.iOS.createToolbar({
				top : 0,
				items : [cancelButton, spaceButton, doneButton]
			});
			slide_view.add(toolBar);

			doneButton.addEventListener('click', function(e) {
				if(this.clickTime && (new Date() - this.clickTime < 1000)){
					return false;
				}
				this.clickTime = new Date();
				
				slide_view.animate(slideOut);

				switch(tableEvent.row.attribute_sub_type) {
					case 'main':
						tableEvent.row.children[1].text = picker.getSelectedRow(0).title;
						while (attribute_rows.length > 1) {
							attribute_rows.pop();
						}
						createAttributeTypeRows(picker.getSelectedRow(0).title);
						attributes_table.setData(attribute_rows);
						attributes_table.height = getAttributeHeight(attribute_rows);
						break;
					case 'range':
						tableEvent.row.children[1].text = picker.getSelectedRow(0).title + '-' + picker.getSelectedRow(1).title;
						break;
					case 'range_default':
					case 'list_default':
						tableEvent.row.children[1].text = picker.getSelectedRow(0).title;
						break;
					default:
						tableEvent.row.children[1].text = 'Select';
						break;
				}
				
				setTimeout(function() {
					slide_view.remove(toolBar);
					toolBar = null;
					cancelButton = null
					doneButton = null;
					spaceButton = null;
					
					self.remove(slide_view);
					slide_view = null;
					
				}, 500);
			});

			var picker = Ti.UI.createPicker({
				top : 43,
				selectionIndicator:true,
				useSpinner:true
			});
			
			var slideNow = true;
			var selectedPickerRows = 1;
			switch(tableEvent.row.attribute_sub_type) {
				case 'main':
					for (var i = 0; i < tableEvent.row.att_vals.length; i++) {
						var pickerRow = Ti.UI.createPickerRow({
							title : tableEvent.row.att_vals[i]
						});
						picker.add(pickerRow);
					}
					break;
				case 'range':
					var maxRangeVal = 100;
					selectedPickerRows = 2;
					var fromCol = Ti.UI.createPickerColumn();
					for(var i=0; i<maxRangeVal; i++){
						var fromRow = Ti.UI.createPickerRow({ 
							title : '' + i
						});
						fromCol.addRow(fromRow);
					}
					var toCol = Ti.UI.createPickerColumn();
					for(var i=1; i<maxRangeVal + 1; i++){
						var toRow = Ti.UI.createPickerRow({ 
							title : '' + i
						});
						toCol.addRow(toRow);
					}
					
					picker.add([fromCol, toCol])
					
					picker.addEventListener('change', function(e) {
						if(e.columnIndex === 0){
							var to_rows = [];
							for(var i=e.rowIndex + 1; i<maxRangeVal + 1; i++){
								to_rows.push(Ti.UI.createPickerRow({
									title: '' + i
								}));
							}
							toCol.rows = to_rows;
							picker.reloadColumn(toCol);
							picker.setSelectedRow(1, 0, false);
						}
					});
					
					break;
				case 'range_default':
					if (attribute_rows[2].children[1].text !== attribute_rows[2].children[1].defaultText) {
						var fromTo = attribute_rows[2].children[1].text.split('-');
						if(attribute_rows[1].children[1].value === true){
							var pickerRow = Ti.UI.createPickerRow({
								title : theme.defaultIgnoreValue
							});
							picker.add(pickerRow);
						}
						for (var i = parseInt(fromTo[0]); i <= parseInt(fromTo[1]); i++) {
							var pickerRow = Ti.UI.createPickerRow({
								title : '' + i
							});
							picker.add(pickerRow);
						}
					} else {
						slideNow = false;
					}
					break;
				case 'list_default':
					if(attribute_rows[2].children[1].value !== attribute_rows[2].children[1].defaultText){
						var vals = attribute_rows[2].children[1].value.split(',');
						var firstRow = true;
						if(attribute_rows[1].children[1].value === true){
							var pickerRow = Ti.UI.createPickerRow({
								title : theme.defaultIgnoreValue
							});
							picker.add(pickerRow);
						}
						for (var i=0; i<vals.length; i++) {
							var pickerRow = Ti.UI.createPickerRow({
								title : vals[i]
							});
							picker.add(pickerRow);
							firstRow = false;
						}	
					}
					else{
						slideNow = false;
					}
					break;
				default:
					break;
			}
			
			if(slideNow === true){
				slide_view.add(picker);
				slide_view.animate(slideIn);
				for(var ii=0; ii<selectedPickerRows; ii++){
					picker.setSelectedRow(ii, 0, false);
				}
			}
			else{
				setTimeout(function() {
					slide_view.remove(toolBar);
					toolBar = null;
					cancelButton = null
					doneButton = null;
					spaceButton = null;
					
					self.remove(slide_view);
					slide_view = null;
					
				}, 500);
			}
		}
	}); 

	main_scrollView.add(attributes_table);
	
	var action_delete_button = Ti.UI.createButton({
		title : L('delete').toUpperCase(),
		font : {
			fontSize : 20,
			fontFamily : theme.fontFamily,
			fontWeight : 'bold'
		},
		width : 300,
		height : 40,
		top : 10,
		left : 10,
		color: theme.whiteFontColor,
		selectedColor:theme.lightFontColor,
		backgroundImage : theme.buttonImage.red.normal,
		backgroundSelectedImage : theme.buttonImage.red.selected,
		//borderRadius : theme.defaultBorderRadius,
		//backgroundGradient : theme.backgroundGradient.red,
		style : isAndroid ? null : Ti.UI.iPhone.SystemButtonStyle.PLAIN
	});
	
	var requestDeleteAttribute = false;
	action_delete_button.addEventListener('click', function(e) {
		if(this.clickTime && (new Date() - this.clickTime < 1000)){
			return false;
		}
		this.clickTime = new Date();
		
		requestDeleteAttribute = true;
		require('/ui/MasterWindow').getNavGroup().close(self, {animated:true});		
	});
	main_scrollView.add(action_delete_button);
	
	function trimWhiteSpaces(s) {
		s = s.replace(/(^\s*)|(\s*$)/gi,'');
		s = s.replace(/[ ]{2,}/gi,' ');
		s = s.replace(/\n /,'\n');
		return s;
	}
	
	self.addEventListener('focus', function(e){
		if(Ti.App.Properties.getBool('carely_goToHome', false) === true){
			require('/ui/MasterWindow').getNavGroup().close(this, {animated:false});
		}
		else{
			require('/lib/analytics').trackScreen({ screenName : self.title });
		}
	});
	
	self.addEventListener('open', function(e){
		if(Ti.App.Properties.getBool('carely_goToHome', false) === true){
			require('/ui/MasterWindow').getNavGroup().close(this, {animated:false});
		}
	});
	
	self.addEventListener('close', function(e){
		if(requestDeleteAttribute === true){
			if(newAttribute === false){
				action_table.fireEvent('row.delete', {index:action_index});
				
				require('/lib/analytics').trackEvent({
					category : 'attirbute',
					action : 'delete',
					label : null,
					value : null
				});	
			}
		}
		var attribute_JSON_data = {
			title : trimWhiteSpaces(text_action.value),
			type : null,
			value : null,
			defaultValue : null,
			allowEmpty : true
		};
		if(attribute_JSON_data.title !== ''){
			switch(attribute_rows[0].children[1].text.toLowerCase()) {
				case 'on/off':
					attribute_JSON_data.type = 'bool';
					attribute_JSON_data.value = attribute_rows[1].children[1].value;
					attribute_JSON_data.defaultValue = attribute_JSON_data.value;
					attribute_JSON_data.allowEmpty = false;
					break;
				case 'range':
					attribute_JSON_data.type = 'range';
					attribute_JSON_data.allowEmpty = attribute_rows[1].children[1].value;
					attribute_JSON_data.value = attribute_rows[2].children[1].text;
					attribute_JSON_data.defaultValue = attribute_rows[3].children[1].text;
					break;
				case 'list':
					attribute_JSON_data.type = 'dictionary';
					attribute_JSON_data.allowEmpty = attribute_rows[1].children[1].value;
					var vals = attribute_rows[2].children[1].value.split(',');
					for (var ii = 0, jj = vals.length; ii < jj; ii++) {
						vals[ii] = vals[ii].replace(/(^\s*)|(\s*$)/gi, '');
					}
					attribute_JSON_data.value = attribute_rows[2].children[1].value.split(',');
					attribute_JSON_data.allowMultiple = attribute_rows[3].children[1].value;
					attribute_JSON_data.defaultValue = attribute_rows[4].children[1].text;
					break;
				default:
					attribute_JSON_data.type = '';
					break;
			}
	
			var act_name = 'New Attribute', act_type = 'att type', act_json = null;
			if (attribute_JSON_data.title !== '' && attribute_JSON_data.type !== null && 
				attribute_JSON_data.value !== null && attribute_JSON_data.defaultValue !== null) {
					act_name = attribute_JSON_data.title;
					act_type = attribute_JSON_data.type;
					act_json = attribute_JSON_data;
			}
			var eventType = newAttribute ? 'row.add' : 'row.update';
			action_table.fireEvent(eventType, {
				row : action_rowData,
				name : act_name,
				value : act_type,
				jsonData : act_json
			}); 
			
			require('/lib/analytics').trackEvent({
				category : 'attirbute',
				action : eventType,
				label : act_type + '|' + act_name,
				value : null
			});
		}
	});
	return self;
}

module.exports = NewActionWindow;