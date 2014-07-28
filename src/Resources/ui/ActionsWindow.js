function ActionsWindow(params) {
	var _ = require('/lib/underscore'),
		theme = require('/ui/theme'),
		moment = require('/lib/date/moment'), 
		Model = require('/lib/model/model'), 
		ActionsModel = require('/lib/model/actions'),
		common = require('/lib/common');
	
	var isAndroid = Ti.Platform.osname === 'android';
	var currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null)),
		_is_admin = false;
	if(currentUser && currentUser.admin === 'true' && currentUser.custom_fields && currentUser.custom_fields.show_admin_features !== false){
		_is_admin = true;
	}
	var List_tag = JSON.parse(Ti.App.Properties.getString('List_tag', null));
	
	var self = Ti.UI.createWindow({
		title : 'Activities',
		navBarHidden : isAndroid,
		backgroundColor : theme.defaultBgColor,
		orientationModes : [Ti.UI.PORTRAIT],
		barColor : theme.barColor,
		layout:'vertical'
	});
	
	var saveButton = null;
	if (params && params.hideToolTip) {

	} else {
		var cancelButton = Ti.UI.createButton({
			systemButton : Ti.UI.iPhone.SystemButton.CANCEL
		});
		cancelButton.addEventListener('click', function(e) {
			if(e){
				e.cancelBubble = true;
			}
			
			if(new_action_row){
				new_action_row.action_txt.blur();
			}
			
			header_view.height = Ti.UI.SIZE;
			search.touchEnabled = true;
			self.leftNavButton = undefined;
			self.rightNavButton = createNewButton;
			endUpdate();
			new_action_active = false;
			tableView.scrollable = true;
			
			require('/lib/analytics').trackEvent({
				category : 'activity',
				action : 'new',
				label : 'cancel',
				value : null
			});
		});
		saveButton = Ti.UI.createButton({
			systemButton : Ti.UI.iPhone.SystemButton.SAVE
		});
		saveButton.addEventListener('click', function(e) {
			if(e){
				e.cancelBubble = true;
			}
			saveAction();
			
			require('/lib/analytics').trackEvent({
				category : 'activity',
				action : 'new',
				label : 'save',
				value : null
			});
		}); 
		var createNewButton = Ti.UI.createButton({
			systemButton : Ti.UI.iPhone.SystemButton.COMPOSE
		});
		createNewButton.addEventListener('click', function(e) {
			if (this.clickTime && (new Date() - this.clickTime < 1000)) {
				return false;
			}
			this.clickTime = new Date();
			
			if(_updating){
				return false;
			}
			if(e){
				e.cancelBubble = true;
			}
			
			if(!List_tag){
				List_tag = JSON.parse(Ti.App.Properties.getString('List_tag', null));
			}
			if(List_tag && List_tag.id && !List_tag.all_activities){
				var action_options = {
					options : ['Create new activity', 'Add from other lists', 'Cancel'],
					cancel : 2
				};
				var action_dlg = Ti.UI.createOptionDialog(action_options);
				action_dlg.addEventListener('click', function(dialogEvent){
					if(dialogEvent.index !== dialogEvent.cancel){
						
						require('/lib/analytics').trackEvent({
							category : 'activity',
							action : 'new',
							label : action_options[dialogEvent.index],
							value : null
						});
						
						if(dialogEvent.index === 0){
							// create new activity
							handleCreateNewAction();
						}
						else if(dialogEvent.index === 1){
							// add existing from another list
							var ImportActivityWindow = require('/ui/ImportActivityWindow');
							var win = new ImportActivityWindow();
							require('/ui/MasterWindow').getNavGroup().open(win);
						}
					}
				});
				action_dlg.show();
			}
			else{
				handleCreateNewAction()
			}
		});
		self.rightNavButton = createNewButton;
	}
	
	function handleCreateNewAction(){
		if(!currentUser){
			currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
		}
		
		if (currentUser && currentUser.custom_fields && currentUser.custom_fields.my_actions) {
			if (currentUser.custom_fields.my_actions.length >= common.max_actions.user) {
				Ti.UI.createAlertDialog({
					title : 'Add activities',
					message : 'Users currently are limited to ' + common.max_actions.user + ' activities at most!',
					buttonNames : [L('ok', 'OK')]
				}).show();
				return;
			}
		}

		new_action_row = createNewActionRow();
		var new_action_section = createActionSection({
			title : 'Create a new activity'
		});
		new_action_section.add(new_action_row);
		tableView.setData([new_action_section]);

		header_view.height = 0;
		search.touchEnabled = false;
		self.leftNavButton = cancelButton;
		self.rightNavButton = saveButton;
		new_action_active = true;
		tableView.scrollable = false;
		new_action_row.action_txt.focus();

		require('/lib/analytics').trackEvent({
			category : 'activity',
			action : 'new',
			label : 'click',
			value : null
		});
	}
	
	var photo_options_dialog = {
		options : ['Take a Photo', 'Select From Gallery', 'Search Online', 'Cancel'],
		cancel : 3
	};
	var photo_dialog = Ti.UI.createOptionDialog(photo_options_dialog);
	photo_dialog.addEventListener('click', function(dialogEvent) {
		
		require('/lib/analytics').trackEvent({
			category : 'activity',
			action : 'photo',
			label : photo_options_dialog.options[dialogEvent.index],
			value : null
		});
		
		if (dialogEvent.index === 0) {
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
						new_action_row.action_icon.applyProperties({
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
		} else if (dialogEvent.index === 1) {
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
						new_action_row.action_icon.applyProperties({
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
		} else if (dialogEvent.index === 2) {
			_photo = null;
			new_action_row.action_icon.onlineSavedPhoto = null;
			new_action_row.action_icon.image = theme.images.uploadImage;

			var RemoteImagesWindow = require('/ui/RemoteImagesWindow');
			var w = new RemoteImagesWindow({
				title : 'Search Online',
				query : new_action_row.action_txt.value,
				photo : new_action_row.action_icon
			});
			w.open({
				animated : true
			});
		}
	}); 

	function saveAction(_no_err_msg){
		var action_name = new_action_row.action_txt.value.replace(/(^\s*)|(\s*$)/gi, '');
		if (action_name.length < 4) {
			new_action_row.action_txt.focus();
			if(!action_name.length){
				Ti.UI.createAlertDialog({
					message : 'Select a name for your activity',
					buttonNames : [L('ok', 'OK')]
				}).show(); 
			}
			else{
				Ti.UI.createAlertDialog({
					message : 'Activity names should be at least 4 characters long',
					buttonNames : [L('ok', 'OK')]
				}).show(); 
			}
		} else {
			//search.blur();
			var action_image = new_action_row.action_icon;
			if (action_image.onlineSavedPhoto !== null) {
				_photo = action_image.onlineSavedPhoto;
			}
			if (_photo && action_image.image !== theme.images.uploadImage) {
				
				header_view.height = Ti.UI.SIZE;
				search.touchEnabled = true;
				self.leftNavButton = undefined;
				self.rightNavButton = createNewButton;
				endUpdate();
				new_action_active = false;
				tableView.scrollable = true;
				
				//action_name = action_name.charAt(0).toUpperCase() + action_name.substr(1).toLowerCase();
				
				var eventJSON = {
					name : action_name,
					details : '',
					start_time : moment.utc()._d,
					acl_name : 'actions_acl',
					custom_fields : {
						text_value : '',
						action_url : '',
						action_by_value : '',
						isPublic : true,
						attributes : [],
						importance : 1,
						disabled : false
					}
				};
				eventJSON.photo = _photo;
				eventJSON['photo_sync_sizes[]'] = 'square_75';

				if(List_tag && List_tag.id && !List_tag.all_activities && currentUser){
					eventJSON.custom_fields['list_tag_' + List_tag.id] = currentUser.id;
				}
				
				if(new_action_row.action_url_txt && new_action_row.action_url_txt.value && new_action_row.action_url_txt.value.length){
					eventJSON.custom_fields.action_url = new_action_row.action_url_txt.value;
				}
				
				var UsersModel = require('/lib/model/users'), actIndicator = require('/ui/ActivityIndicator');
				var indicator = new actIndicator();
				
				// create new action
				indicator.showModal('Creating activity...', 60000, 'Timeout creating activity!');
				ActionsModel.create(eventJSON, function(createEvent) {
					if (createEvent.success) {
						new_action_row.action_txt.blur();
						
						var _newAction = createEvent.events[0];
								
						currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
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

						Model.AppCache.actions.set(_newAction);

						var action_row = createActionRow(_newAction);
						if(action_row){
							activity_rows = activity_rows.splice(0, 0, action_row);
							endUpdate();
						}

						UsersModel.update({
							custom_fields : {
								my_actions : _my_actions,
								total_actions_created : _total_actions_created
							}
						}, function(updateEvent) {
							indicator.hideModal();
							if (updateEvent.success) {
								Ti.App.Properties.setString('carely_user', JSON.stringify(updateEvent.users[0]));
								currentUser = updateEvent.users[0];

								Model.AppCache.users.set(updateEvent.users[0]);
							} else {
								Model.eventDefaultErrorCallback(updateEvent);
							}
						});
						
						if(List_tag && List_tag.id && !List_tag.all_activities && currentUser){
							var createParmas = {
								added_to_list_id : List_tag.id,
								done : {
									total : 0,
									me : 0
								}
							};
							var PostsModel = require('/lib/model/posts');
							PostsModel.create(createEvent.events[0].id, createEvent.events[0].name, null, PostsModel.postTypes.lists_add, createParmas, function(postEvent) {
								if (postEvent.success) {
									Model.AppCache.posts.set(postEvent.posts[0]);
									common.refreshHandler.setRefresh.news(true);
								} else {
									Model.eventDefaultErrorCallback(postEvent);
								}
							});
						}
					} else {
						indicator.hideModal();
						Model.eventDefaultErrorCallback(createEvent);
					}
				});
			} else {
				//photo_dialog.show();
				Ti.UI.createAlertDialog({
					message : 'Select an image for your activity',
					buttonNames : [L('ok', 'OK')]
				}).show();
			}
		}
	}
	
	var new_action_row = null, new_action_active = false, _photo = null;
	
	var defaultRowHeight = theme.borderedImage.big.height + 12;
	
	var last_search = null, auto_complete_timer = null;
	var search = Ti.UI.createSearchBar({
		barColor : theme.subBarColor,
		hintText : 'Search activities',
		autocapitalization : Ti.UI.TEXT_AUTOCAPITALIZATION_SENTENCES
	});
	search.addEventListener('blur', function(e){
		search.showCancel = false;
	});
	search.addEventListener('change', function(e) {
		if(auto_complete_timer){
			clearTimeout(auto_complete_timer);
		}
		if(new_action_active){
			return false;
		}

		if(e.value){
			if(!e.value.length){
				instructions_view.height = Ti.UI.SIZE;
				_searching = false;
				self.rightNavButton.enabled = true;
				endUpdate();
			}
			else if (e.value.length > 2 && e.value !== last_search) {
				auto_complete_timer = setTimeout(function(){
					last_search = e.value;
					searchAction(e.value);
					
					require('/lib/analytics').trackEvent({
						category : 'search',
						action : 'auto complete',
						label : e.value,
						value : null
					});
				}, 500);
			}
		}
	});
	search.addEventListener('focus', function(e) {
		search.showCancel = true;
		if(auto_complete_timer){
			clearTimeout(auto_complete_timer);
		}
		last_search = null;
		self.rightNavButton.enabled = false;
	});
	search.addEventListener('return', function(e) {
		if(auto_complete_timer){
			clearTimeout(auto_complete_timer);
		}
		this.blur();
		if(new_action_active){
			return false;
		}
		if (this.value && this.value.length > 2 && this.value !== last_search) {
			auto_complete_timer = setTimeout(function(){
				last_search = this.value;
				searchAction(this.value);
				
				require('/lib/analytics').trackEvent({
					category : 'search',
					action : 'keyboard',
					label : this.value,
					value : null
				});
			}, 500);
		}
	});
	search.addEventListener('cancel', function(e) {
		if(auto_complete_timer){
			clearTimeout(auto_complete_timer);
		}
		search.value = '';
		instructions_view.height = Ti.UI.SIZE;
		_searching = false;
		self.rightNavButton.enabled = true;
		search.blur();
		endUpdate();
	});
	
	var createActionFromSearchRow = Ti.UI.createTableViewRow({
		height : Ti.UI.SIZE,
		width : Ti.UI.FILL,
		backgroundColor : '#fff',
		selectionStyle : Ti.UI.iPhone.TableViewCellSelectionStyle.NONE,
		createActionFromSearchRow : true,
		search_term : null,
		className : 'NewFromSearch_Row'
	});
	
	var createActionFromSearch_view = Ti.UI.createView({
		height:Ti.UI.SIZE,
		width:Ti.UI.FILL
	});
	createActionFromSearchRow.add(createActionFromSearch_view);
	
	var createActionFromSearch_icon = Ti.UI.createImageView({
		image : theme.images.plus,
		width : theme.borderedImage.big.width,
		height : theme.borderedImage.big.height,
		left : 5,
		top : 4,
		bottom : 8,
		hires:true
	});
	createActionFromSearch_view.add(createActionFromSearch_icon);

	var createActionFromSearch_name = Ti.UI.createLabel({
		top : 2,
		left : createActionFromSearch_icon.left + createActionFromSearch_icon.width + 6,
		text : 'Create a new ',
		width : Ti.UI.FILL,
		height : Ti.UI.SIZE,
		font : theme.defaultFontBold,
		color : theme.barColor,
		textAlign : Ti.UI.TEXT_ALIGNMENT_LEFT
	});
	createActionFromSearch_view.add(createActionFromSearch_name); 
	
	var createActionFromSearchRow_divider = Ti.UI.createView({
		bottom:0,
		height : 1,
		width : Ti.UI.FILL,
		backgroundColor : '#9CC3DD'
	});
	createActionFromSearch_view.add(createActionFromSearchRow_divider);
		
	function searchAction(_search_term){
		if(_search_term && _search_term.length > 2){
			var LowerCaseTerm = _search_term.toLowerCase(),
				CapitalizedTerm = _search_term.charAt(0).toUpperCase() + _search_term.substr(1);
			_searching = true;
			instructions_view.height = 0;
			var search_section = createActionSection({title:'Results for \'' + _search_term + '\''})
			
			footer_view.height = Ti.UI.SIZE;
			
			var rows = [];
			if(activity_rows && activity_rows.length){
				for(var i=0, v=activity_rows.length; i<v; i++){
					if(activity_rows[i].filter && activity_rows[i].filter.length && 
					   activity_rows[i].filter.toLowerCase().indexOf(LowerCaseTerm) > -1){
						rows.push(activity_rows[i]);
					}
				}
			}
			rows = _.uniq(rows, false, function(n){
				return n.action_id;
			});
			search_section.rows = rows;
			search_section.headerView.children[2].text = '' + search_section.rowCount;
			tableView.setData([search_section]);
			
			require('/lib/analytics').trackEvent({
				category : 'search',
				action : 'filter',
				label : _search_term,
				value : rows.length
			});
			
			var q_search_params = {
				disabled : false,
				name : {$regex : '^' + CapitalizedTerm }
			}
			if(!_is_admin){
				q_search_params.importance = { '$gt' : 0 };
			}
			
			ActionsModel.query(q_search_params, null, 100, 0, function(queryEvent){
				
				footer_view.height = 0;
				
				require('/lib/analytics').trackEvent({
					category : 'search',
					action : 'prefix',
					label : CapitalizedTerm,
					value : (queryEvent.success && queryEvent.events) ? queryEvent.events.length : 0
				});
				
				if (queryEvent.success) {
					if (queryEvent.events && queryEvent.events.length) {
						Model.AppCache.actions.setMany(queryEvent.events);

						var newRows = createActionRows(queryEvent.events);
						if (newRows.length) {
							if(_searching){
								rows = rows.concat(newRows);
							}
						}
					}
				} else {
					//Model.eventDefaultErrorCallback(queryEvent);
				}
				
				if(_searching){
						ActionsModel.search(_search_term, 1, 100, function(searchEvent) {
							require('/lib/analytics').trackEvent({
								category : 'search',
								action : 'full text',
								label : _search_term,
								value : searchEvent.success ? searchEvent.meta.total_results : 0
							});
							
							if (searchEvent.success) {
								if (searchEvent.meta.total_results) {
									Model.AppCache.actions.setMany(searchEvent.events);
			
									var newRows = createActionRows(searchEvent.events);
									if (newRows.length) {
										if(_searching){
											rows = rows.concat(newRows);
										}
									}
								}
							} else {
								Model.eventDefaultErrorCallback(searchEvent);
							}
							
							createActionFromSearch_name.text = 'Create a new "' + _search_term + '" activity';
							createActionFromSearchRow.search_term = _search_term;
							if(rows && rows.length){
								rows = _.uniq(rows, false, function(n){
									return n.action_id;
								});
								rows.push(createActionFromSearchRow);
								search_section.rows = rows;
								search_section.headerView.children[2].text = '' + search_section.rowCount;
							}
							else{
								search_section.rows = [createActionFromSearchRow];
								search_section.headerView.children[1].text = 'No results for \'' + _search_term + '\'';
								search_section.headerView.children[2].text = '';
							}
							tableView.setData([search_section]);
							rows = null;
							search.value = search.value;
						});
					}
			});
		}
	}
	//self.add(search);
	
	function createActionSection(_item){

		var section_view = Ti.UI.createView({
			height:24,
			width:Ti.UI.FILL,
			backgroundColor:theme.barColor,
			opacity:0.9,
			section_title : _item.title
		});
		
		var divider_top = Ti.UI.createView({
			top:0,
			backgroundColor : '#111931',
			height : 1
		});
		section_view.add(divider_top);
		
		var header_lbl = Ti.UI.createLabel({
			text : _item.title,
			left : 6,
			top : 2,
			color:theme.whiteFontColor,
			font:theme.defaultFontBold,
			textAlign:Ti.UI.TEXT_ALIGNMENT_LEFT
		});
		section_view.add(header_lbl);
		
		var value_lbl = Ti.UI.createLabel({
			text : _item.value ? _item.value : '',
			right : 6,
			top : 2,
			color : theme.whiteFontColor,
			font : theme.defaultFont,
			textAlign : Ti.UI.TEXT_ALIGNMENT_RIGHT
		});
		section_view.add(value_lbl);
		
		var divider_bottom = Ti.UI.createView({
			bottom:0,
			backgroundColor : '#111931',
			height : 1
		});
		section_view.add(divider_bottom);
		
		return Ti.UI.createTableViewSection({ headerView: section_view});
	}
	
	var activity_rows = [];
	var header_view = Ti.UI.createView({
		height:Ti.UI.SIZE,
		width:Ti.UI.FILL,
		layout:'vertical'
	});
	header_view.add(search);
	
	var instructions_view = Ti.UI.createView({
		height : Ti.UI.SIZE,
		width : Ti.UI.FILL,
		layout:'vertical'
	});
	header_view.add(instructions_view);
	
	var create_new_view = Ti.UI.createView({
		height : 30,
		width : Ti.UI.FILL,
		top : 0,
		left : 5,
		right : 5,
		layout : 'horizontal'
	});
	instructions_view.add(create_new_view);

	var tap_left_lbl = Ti.UI.createLabel({
		text : 'Tap ',
		top : 4,
		font : theme.defaultToolTipFont,
		color : theme.darkFontColor,
		textAlign : Ti.UI.TEXT_ALIGNMENT_LEFT
	});
	create_new_view.add(tap_left_lbl);

	var create_new_icon = Ti.UI.createImageView({
		image : theme.images.create_new,
		top : 2,
		left : 2,
		height : 23,
		width : 27,
		hires : true
	});
	create_new_view.add(create_new_icon);

	var tap_right_lbl = Ti.UI.createLabel({
		text : 'to add activities to the list',
		top : 4,
		left : 2,
		font : theme.defaultToolTipFont,
		color : theme.darkFontColor,
		textAlign : Ti.UI.TEXT_ALIGNMENT_LEFT
	});
	create_new_view.add(tap_right_lbl);

	var swipe_view = Ti.UI.createView({
		height : 30,
		width : Ti.UI.FILL,
		top : 2,
		left : 5,
		right : 5,
		layout : 'horizontal'
	});
	instructions_view.add(swipe_view);

	var swipe_left_lbl = Ti.UI.createLabel({
		text : 'Swipe',
		top : 2,
		font : theme.defaultToolTipFont,
		color : theme.darkFontColor,
		textAlign : Ti.UI.TEXT_ALIGNMENT_LEFT
	});
	swipe_view.add(swipe_left_lbl);

	var swipe_icon = Ti.UI.createImageView({
		image : theme.images.swipe_arrow,
		top : 0,
		left : 2,
		height : 28,
		width : 36,
		hires : true
	});
	swipe_view.add(swipe_icon);

	var swipe_right_lbl = Ti.UI.createLabel({
		text : 'activity to add it to lists',
		top : 2,
		left : 2,
		font : theme.defaultToolTipFont,
		color : theme.darkFontColor,
		textAlign : Ti.UI.TEXT_ALIGNMENT_LEFT
	});
	swipe_view.add(swipe_right_lbl); 
	
	var instructions_view_divider = Ti.UI.createView({
		bottom: 0,
		width:Ti.UI.FILL,
		height:1,
		backgroundColor:'#9CC3DD'
	});
	instructions_view.add(instructions_view_divider);
	
	var footer_view = Ti.UI.createView({
		height : 0,
		width:Ti.UI.FILL
	});
	var footer_view_indicator = Ti.UI.createActivityIndicator({
		top : 5,
		height : Ti.UI.SIZE,
		width : Ti.UI.FILL,
		font : theme.defaultToolTipFont,
		style : Ti.UI.iPhone.ActivityIndicatorStyle.DARK
	});
	footer_view_indicator.show();
	footer_view.add(footer_view_indicator);
	
	var tableView = Ti.UI.createTableView({
		top : 0,
		left : 0,
		right : 0,
		width : Ti.UI.FILL,
		headerView : header_view,
		style : Ti.UI.iPhone.TableViewStyle.PLAIN,
		scrollsToTop : true,
		separatorStyle : Ti.UI.iPhone.TableViewSeparatorStyle.NONE,
		footerView : footer_view,
		bubbleParent:false
	});
	
	// pull to refresh
	var PullToRefresh = require('/ui/PullToRefresh');
	var puller = new PullToRefresh();
	tableView.headerPullView = puller._view;
	
	var lastRowSwiped = null;
	function handleSwipe(_row, _hide){
		if(_row && _row.children && _row.children[0] && _row.children[0].children && _row.children[0].children.length > 1){
			if(_row.children[0].is_showing){
				_row.children[0].is_showing = false;
				_row.children[0].children[0].animate({opacity:0.0, duration: 300});
				_row.children[0].children[0].hide();
						
				_row.children[0].children[1].animate({opacity:1.0, duration: 300});
				_row.children[0].children[1].show();
			}
			else if(!_hide){
				_row.children[0].is_showing = true;
				_row.children[0].children[0].animate({opacity:1.0, duration: 300});
				_row.children[0].children[0].show();
						
				_row.children[0].children[1].animate({opacity:0.0, duration: 300});
				_row.children[0].children[1].hide();
			}
			lastRowSwiped = _row;
		}
	}
	tableView.addEventListener('swipe', function(e) {
		if(e){
			e.cancelBubble = true;
		}
		if(new_action_active){
			return false;
		}
		if(e && e.row && e.row.action_id && e.row.can_swipe){
			if(lastRowSwiped && lastRowSwiped.action_id !== e.row.action_id){
				handleSwipe(lastRowSwiped, true);
			}
			handleSwipe(e.row, false);
		}
		
		require('/lib/analytics').trackEvent({
			category : 'activity',
			action : 'table',
			label : 'swipe',
			value : (e && e.row && e.row.children && e.row.children[0] && e.row.children[0].is_showing) ? 1 : 0
		});
	});
	
	var _scrolling = false;
	tableView.addEventListener('dragEnd', function(e) {
		if(e){
			e.cancelBubble = true;
		}
		if (_updating === true) {
			return false;
		}

		puller.begin(e, tableView, function() {
			tableView.pullRefresh = true;
			refreshActions(true);
		});
	});
	
	tableView.addEventListener('scroll', function(e) {
		if(e){
			e.cancelBubble = true;
		}
		if(!_scrolling && search.showCancel){
			search.blur();
		}
		
		_scrolling = true;
		if(new_action_active){
			return false;
		}
		if (e.contentOffset.y < 0) {
			if (_updating === false) {
				puller.scroll(e);
			}
		} else {
			if (_updating === false && _more && e.contentOffset.y + e.size.height + 100 > e.contentSize.height) {
				footer_view.height = Ti.UI.SIZE;
				
				tableView.canRefreshNow = true;
			}
		}
	});
	tableView.addEventListener('scrollEnd', function(e) {
		_scrolling = false;
		
		var loading_new_data = 0;
		if(tableView.canRefreshNow){
			tableView.canRefreshNow = false;

			queryActivities();
		}
		
		require('/lib/analytics').trackEvent({
			category : 'activity',
			action : 'scroll',
			label : 'load data',
			value : loading_new_data
		});
	});
	
	tableView.addEventListener('singletap', function(e) {
		if(e){
			e.cancelBubble = true;
		}
		if(this.clickTime && (new Date() - this.clickTime < 1000)){
			return false;
		}
		this.clickTime = new Date();
		
		if(search.showCancel){
			search.blur();
		}
		
		require('/lib/analytics').trackEvent({
			category : 'activity',
			action : 'click',
			label : (e && e.row && e.row.action_id) ? e.row.action_id : null,
			value : null
		});
		
		if(new_action_active && e){
			if(e.row && e.row.new_action_row){
				if(e.source){
					require('/lib/analytics').trackEvent({
						category : 'activity',
						action : 'new',
						label : e.source.clickName,
						value : null
					});
					
					if(e.source.clickName === 'action_icon'){
						photo_dialog.show();
					}
					else if(e.source.clickName === 'action_full_edit'){
						var action_txt = '', action_icon = null;
						if(new_action_row){
							if(new_action_row.action_txt){
								action_txt = new_action_row.action_txt.value;
							}
							
							if(new_action_row.action_icon){
								if (new_action_row.action_icon.onlineSavedPhoto !== null) {
									_photo = new_action_row.action_icon.onlineSavedPhoto;
								}
								if (_photo && new_action_row.action_icon.image !== theme.images.uploadImage) {
									action_icon = _photo;
								}
							}
						}
						
						var NewActionWindow = require('/ui/NewActionWindow');
						var newActionWindow = new NewActionWindow(null, false, true, {
							name : action_txt,
							pic : action_icon
						}, self.leftNavButton ? function() { self.leftNavButton.fireEvent('click');} : null);
						require('/ui/MasterWindow').getNavGroup().open(newActionWindow);
					}
				}
			}
		}
		else if(e && e.row && e.row.createActionFromSearchRow && createActionFromSearchRow.search_term){
			
			require('/lib/analytics').trackEvent({
				category : 'activity',
				action : 'new from search',
				label : createActionFromSearchRow.search_term,
				value : null
			}); 

			if(auto_complete_timer){
				clearTimeout(auto_complete_timer);
			}
			
			if (currentUser.custom_fields && currentUser.custom_fields.my_actions) {
				if (currentUser.custom_fields.my_actions.length >= common.max_actions.user) {
					Ti.UI.createAlertDialog({
						title : 'Add activities',
						message : 'Users currently are limited to ' + common.max_actions.user + ' activities at most!',
						buttonNames : [L('ok', 'OK')]
					}).show();
					return;
				}
			}
			
			search.value = '';
			header_view.height = 0;
			instructions_view.height = Ti.UI.SIZE;
			_searching = false;
			self.rightNavButton.enabled = true;
			search.blur();
			
			new_action_row = createNewActionRow(createActionFromSearchRow.search_term);
			var new_action_section = createActionSection({title:'Create new activity'});
			new_action_section.add(new_action_row);
			tableView.setData([new_action_section]);
			
			search.touchEnabled = false;
			self.leftNavButton = cancelButton;
			self.rightNavButton = saveButton;
			new_action_active = true;
			tableView.scrollable = false;
			new_action_row.action_txt.focus();
		}
		else if(e && e.row){
			if(e.row.findActivitySuggesters){
				var FindFriendsWindow = require('/ui/FindFriendsWindow');
				var win = new FindFriendsWindow({
					suggesters : true,
					title: 'Activity Lists'
				});
				require('/ui/MasterWindow').getNavGroup().open(win);
				
				require('/lib/analytics').trackEvent({
					category : 'activity',
					action : 'click',
					label : 'find activity lists',
					value : null
				}); 
			}
			else if(e.row.action_id){
				require('/lib/analytics').trackEvent({
					category : 'activity',
					action : (e.source && e.source.clickName) ? e.source.clickName : 'show',
					label : e.row.action_id,
					value : null
				});
				
				if(lastRowSwiped){
					if(e.source && e.source.clickName === 'my_actions' || e.source.clickName === 'list_actions'){
						
					}
					else{
						handleSwipe(lastRowSwiped, true);
						lastRowSwiped = null;
					}
				}
				if(e.source && e.source.clickName === 'list_actions'){
					if(!currentUser){
						currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
					}
					if(!List_tag){
						List_tag = JSON.parse(Ti.App.Properties.getString('List_tag', null));
					}
					if(List_tag && List_tag.id){
						var update_list_JSON = {
							event_id : e.row.action_id,
							custom_fields : {}
						},
						_can_update_list_activities = false,
						_added_to_list = false;
						
						if(e.row.in_list_actions === true){
							// remove action from list
							e.source.image = theme.images.activity_list_off;
							e.row.in_list_actions = false;
							
							common.showMessageWindow('Removed from List', 140, 180, 2000);
							
							update_list_JSON.custom_fields['list_tag_' + List_tag.id] = null;
							
							_can_update_list_activities = true;
						}
						else{
							if(currentUser && currentUser.id){
								// add action to list
								e.source.image = theme.images.activity_list_on;
								e.row.in_list_actions = true;
								common.showMessageWindow('Added to List', 140, 140, 2000);
								
								update_list_JSON.custom_fields['list_tag_' + List_tag.id] = currentUser.id;
								
								_can_update_list_activities = true;
								_added_to_list = true;
							}
						}
						
						if(_can_update_list_activities){
							ActionsModel.update(update_list_JSON, function(updateEvent) {
								if (updateEvent.success) {
									common.refreshHandler.setRefresh.actions(true);
									
									Model.AppCache.actions.set(updateEvent.events[0]);
									
									var PostsModel = require('/lib/model/posts');
									PostsModel.queryPages({
										title : PostsModel.postTypes.lists_add,
										added_to_list_id : List_tag.id,
										event_id : e.row.action_id
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
											
											if(_added_to_list){
												// added to list
												var post_count_id = e.row.action_id + '_' + PostsModel.postTypes.checkin;
												var createParmas = {
													added_to_list_id : List_tag.id,
													done : { 
														total : e.row.checkins,
														me : currentUser.custom_fields[post_count_id] ? currentUser.custom_fields[post_count_id] : 0
													}
												};
												PostsModel.create(e.row.action_id, e.row.action_name, null, PostsModel.postTypes.lists_add, createParmas, function(postEvent) {
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
						}
					}
				}
				else if(e.source && e.source.clickName === 'my_actions'){
					currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
					if (currentUser) {
						var actionAdded = false, my_action_preferences = [], my_deleted_actions_preferences = [], _my_action_suggestions = null;
						if(currentUser.custom_fields){
							if(currentUser.custom_fields.my_actions){
								my_action_preferences = currentUser.custom_fields.my_actions;
							}
							if(currentUser.custom_fields.my_deleted_actions){
								my_deleted_actions_preferences = currentUser.custom_fields.my_deleted_actions;
							}
							if(currentUser.custom_fields.my_action_suggestions){
								_my_action_suggestions = currentUser.custom_fields.my_action_suggestions;
							}
						}
						var idx = my_action_preferences.indexOf(e.row.action_id);
	
						if (e.row.in_my_actions === true && idx > -1) {
							// remove action
							e.source.image = theme.images.favorites_off;
							e.row.in_my_actions = false;
							
							my_action_preferences.splice(idx, 1);
							if (my_deleted_actions_preferences.indexOf(e.row.action_id) === -1) {
								my_deleted_actions_preferences.splice(0, 0, e.row.action_id);
							}
							common.showMessageWindow('Removed from Favorites', 140, 180, 2000);
							
							if(_my_action_suggestions && _my_action_suggestions[e.row.action_id]){
								_my_action_suggestions[e.row.action_id] = undefined;
							}
						} else if (idx === -1) {
							// add action
							e.source.image = theme.images.favorites_on;
							e.row.in_my_actions = true;
							
							actionAdded = true;
							if (my_action_preferences.length >= common.max_actions.user) {
								Ti.UI.createAlertDialog({
									title : 'Add activity',
									message : 'Users currently limited to ' + common.max_actions.user + ' activities at most!',
									buttonNames : [L('ok', 'OK')]
								}).show();
	
								return;
							}
	
							my_action_preferences.splice(0, 0, e.row.action_id);
							var dix = my_deleted_actions_preferences.indexOf(e.row.action_id);
							if (dix > -1) {
								my_deleted_actions_preferences.splice(dix, 1);
							}
							common.showMessageWindow('Added to Favorites', 140, 140, 2000);
							
							if(e.row.suggested_by_id){
								if(_my_action_suggestions === null){
									_my_action_suggestions = {};
								}
								_my_action_suggestions[e.row.action_id] = e.row.suggested_by_id;
							}
						}
	
						currentUser.custom_fields.my_actions = my_action_preferences;
						currentUser.custom_fields.my_deleted_actions = my_deleted_actions_preferences;
						currentUser.custom_fields.my_action_suggestions = _my_action_suggestions;
						
						Ti.App.Properties.setString('carely_user', JSON.stringify(currentUser));
						
						var UsersModel = require('/lib/model/users');
						UsersModel.update({
							custom_fields : {
								my_actions : my_action_preferences,
								my_deleted_actions : my_deleted_actions_preferences,
								my_action_suggestions : _my_action_suggestions
							}
						}, function(updateEvent) {
							if (updateEvent.success) {
		
								Ti.App.Properties.setString('carely_user', JSON.stringify(updateEvent.users[0]));
								currentUser = updateEvent.users[0];
		
								Model.AppCache.users.set(updateEvent.users[0]);
		
								var PostsModel = require('/lib/model/posts');
								PostsModel.queryPages({
									title : PostsModel.postTypes.actions_add,
									user_id : currentUser.id,
									event_id : e.row.action_id
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
		
										if (actionAdded) {
											PostsModel.queryPages({
												title:{'$in' : [PostsModel.postTypes.checkin, PostsModel.postTypes.joins]},
												event_id:e.row.action_id,
												upcoming_date_start : {$exists : false}
											}, null, 1, 1, function(queryEvent) {
												if(queryEvent.success) {
													var post_count_id = e.row.action_id + '_' + PostsModel.postTypes.checkin;
													var total_done = 0;
													if (queryEvent.meta.total_results > 0) {
														total_done = queryEvent.meta.total_results;
													}
													total_done += 1;
													
													if(!currentUser.custom_fields[post_count_id]){
														currentUser.custom_fields[post_count_id] = 0;
													}
													
													var createParams = {
														done : {
															total : total_done,
															me : currentUser.custom_fields[post_count_id]
														}
													};
													if(_my_action_suggestions && _my_action_suggestions[e.row.action_id]){
														createParams['[ACS_User]suggester_id'] = _my_action_suggestions[e.row.action_id];
													}
													
													PostsModel.create(e.row.action_id, e.row.action_name, null, PostsModel.postTypes.actions_add, createParams, function(postEvent) {
														if (postEvent.success) {
															Model.AppCache.posts.set(postEvent.posts[0]);
															common.refreshHandler.setRefresh.news(true);
														} else {
															Model.eventDefaultErrorCallback(postEvent);
														}
													});
												}
												else{
													Model.eventDefaultErrorCallback(queryEvent);
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
						
						if(e.row.suggestion_id){
							var ObjectsModel = require('/lib/model/objects');
							var suggestion_update_params = {};
							suggestion_update_params[currentUser.id] = 2;
							ObjectsModel.update(ObjectsModel.classNames.suggestions, e.row.suggestion_id, suggestion_update_params, null, null, function(updateEvent) {
								if (updateEvent.success) {
									
								} else {
									Model.eventDefaultErrorCallback(updateEvent);
								}
							});
						}
					}
				}
				else if(e.source && e.source.clickName === 'checkin'){
					instantCheckinAction(e.row.action_id, e.row.suggested_by_id);
				}
				else if(e.source && e.source.clickName === 'suggested_reject'){
					common.showMessageWindow('Suggested activity removed', 140, 140, 2000);
	
					if(e.row.suggestion_id){
						var ObjectsModel = require('/lib/model/objects');
						var suggestion_update_params = {};
						suggestion_update_params[currentUser.id] = 2;
						ObjectsModel.update(ObjectsModel.classNames.suggestions, 
							e.row.suggestion_id, suggestion_update_params, null, null, function(updateEvent) {
							if (updateEvent.success) {
								
							} else {
								Model.eventDefaultErrorCallback(updateEvent);
							}
						});
					}
				}
				else{
					var suggester_id = null;
					if(e.row.suggested_by_id){
						suggester_id = e.row.suggested_by_id;
					}
					else if(currentUser && currentUser.custom_fields && currentUser.custom_fields.my_action_suggestions && 
					   currentUser.custom_fields.my_action_suggestions[e.row.action_id]){
						suggester_id = currentUser.custom_fields.my_action_suggestions[e.row.action_id]; 
					}
					
					if(e.row.children && e.row.children[0] && e.row.children[0].new_stripe){
						e.row.children[0].remove(e.row.children[0].new_stripe);
						e.row.children[0].new_stripe = undefined;
					}
					
					if (e.row.suggestion_id && e.row.is_new_suggestion) {
						e.row.is_new_suggestion = false;
						
						var ObjectsModel = require('/lib/model/objects');
						var suggestion_update_params = {};
						suggestion_update_params[currentUser.id] = 1;
						ObjectsModel.update(ObjectsModel.classNames.suggestions, e.row.suggestion_id, suggestion_update_params, null, null, function(updateEvent) {
							if (updateEvent.success) {
								
							} else {
								Model.eventDefaultErrorCallback(updateEvent);
							}
						});
					}
					
					var _action_item = Model.AppCache.actions.get(e.row.action_id);
					if(_action_item){
						var CheckinWindow = require('/ui/CheckinWindow');
						var win = new CheckinWindow(e.row.action_id, e.row.suggestion_id, suggester_id);
						require('/ui/MasterWindow').getNavGroup().open(win);
					}
					else{
						ActionsModel.show(e.row.action_id, function(showEvent){
							if(showEvent.success){
								Model.AppCache.actions.set(showEvent.events[0]);
								
								var CheckinWindow = require('/ui/CheckinWindow');
								var win = new CheckinWindow(e.row.action_id, e.row.suggestion_id, suggester_id);
								require('/ui/MasterWindow').getNavGroup().open(win);
							}
							else{
								Model.eventDefaultErrorCallback(showEvent);
							}
						});
					}
				}
			}
		}
	});
	self.add(tableView);
	
	function instantCheckinAction(_actionId, _suggested_by_id){
		currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
		if(!currentUser){
			return false;
		}
		
		var PostsModel = require('/lib/model/posts');
		var queryParams = {
			title:{'$in' : [PostsModel.postTypes.checkin, PostsModel.postTypes.joins]},
			event_id:_actionId,
			upcoming_date_start : {$exists : false}
		}
		
		var actIndicator = require('/ui/ActivityIndicator');
		var indicator = new actIndicator();
		
		indicator.showModal('Checking in...', 60000, 'Timeout posting checkin!');
		PostsModel.queryPages(queryParams, null, 1, 1, function(queryEvent) {
			if(queryEvent.success) {
				var post_count_id = _actionId + '_' + PostsModel.postTypes.checkin;
				var total_done = 0;
				if (queryEvent.meta.total_results > 0) {
					total_done = queryEvent.meta.total_results;
				}
				total_done += 1;
				
				if(!currentUser.custom_fields[post_count_id]){
					currentUser.custom_fields[post_count_id] = 0;
				}
				currentUser.custom_fields[post_count_id] += 1;
				
				var postParams = {
					attributes : [],
					attributesText : '',
					intent:PostsModel.intents.checkin,
					done : {
						total : total_done,
						me : currentUser.custom_fields[post_count_id]
					}
				}
				
				if(_suggested_by_id){
					postParams['[ACS_User]suggester_id'] = _suggested_by_id;
				}
				
				PostsModel.create(_actionId, common.emptyCheckinValue, null, PostsModel.postTypes.checkin, postParams, function(checkinEvent) {
					indicator.hideModal();
					if(checkinEvent.success) {
						common.refreshHandler.setRefresh.news(true);
						common.refreshHandler.setRefresh.leaderboard(true);
						common.refreshHandler.setRefresh.users(true);
						
						Model.AppCache.posts.setMany(checkinEvent.posts);
						
						Ti.App.Properties.setString('carely_user', JSON.stringify(currentUser));
						Model.AppCache.users.set(currentUser);
						
						var PostActionWindow = require('/ui/PostActionWindow');

						var postActionWindow = new PostActionWindow(checkinEvent.posts[0].user.id, checkinEvent.posts[0].id, {
							total : total_done,
							me : currentUser.custom_fields[post_count_id]
						}); 
						require('/ui/MasterWindow').getNavGroup().open(postActionWindow);
						
						var action_update_params = {
							event_id : _actionId,
							custom_fields : {}
						}
						action_update_params.custom_fields['total_' + PostsModel.intents.checkin] = total_done; 

						ActionsModel.update(action_update_params,function(actionUpdateEvent) {
							if(actionUpdateEvent.success){
								
								Model.AppCache.actions.set(actionUpdateEvent.events[0]);
								
								common.refreshHandler.setRefresh.actions(true);
							}
							else{
								Model.eventDefaultErrorCallback(actionUpdateEvent);
							}
						});
						
						if(currentUser && currentUser.custom_fields && 
							currentUser.custom_fields.facebook_settings && 
							currentUser.custom_fields.facebook_settings.checkin === true){
							var shareData = PostsModel.formatForSharing(checkinEvent.posts[0]);
							if(shareData){
								Ti.App.fireEvent('posts.share', shareData);
							}
						}
						
						var user_update_params = {
							custom_fields:{}
						};
						user_update_params.custom_fields[post_count_id] = currentUser.custom_fields[post_count_id];
						
						var UsersModel = require('/lib/model/users');
						UsersModel.update(user_update_params, function(updateEvent) {
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
			} else {
				indicator.hideModal();
				Model.eventDefaultErrorCallback(queryEvent);
			}
		});
	}

	function createNewActionRow(_action_name) {  
		
		var row = Ti.UI.createTableViewRow({
			height : defaultRowHeight + 40,
			width : Ti.UI.FILL,
			backgroundImage : theme.images.rowBox.normal,
			selectionStyle : Ti.UI.iPhone.TableViewCellSelectionStyle.NONE,
			new_action_row:true,
			className : 'Action_Row'
		});
		
		var row_view = Ti.UI.createView({
			height : Ti.UI.FILL,
			width : Ti.UI.FILL
		});
		row.add(row_view);
		
		var icon = Ti.UI.createImageView({
			image:theme.images.uploadImage,
			width : theme.borderedImage.big.width,
			height : theme.borderedImage.big.height,
			left : 5,
			top : 4,
			bottom : 8,
			hires:true,
			clickName:'action_icon'
		});
		row_view.add(icon);
		icon.onlineSavedPhoto = null;
		
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
		icon.add(change_view);
		row.action_icon = icon;
		
		var action_name_view = Ti.UI.createView({
			top : 2,
			left : icon.left + icon.width + 6,
			layout : 'vertical',
			width : Ti.UI.FILL,
			height:defaultRowHeight - 2
		});
		row_view.add(action_name_view); 

		var actionName = Ti.UI.createLabel({
			top : 0,
			left : 0,
			text : 'Activity name:',
			font : theme.defaultFontBold,
			color : theme.darkFontColor,
			textAlign : Ti.UI.TEXT_ALIGNMENT_LEFT
		});
		action_name_view.add(actionName);
		
		var action_text_view = Ti.UI.createView({
			top : 0,
			left : 0,
			width : Ti.UI.FILL,
			height:Ti.UI.SIZE
			//layout : 'horizontal'
		});
		action_name_view.add(action_text_view);
		
		var action_txt = Ti.UI.createTextField({
			top:0,
			left:0,
			right:42,
			paddingLeft:4,
			value: _action_name ? _action_name : '',
			width:Ti.UI.FILL,
			height:30,
			font: theme.defaultFont,
			color: theme.darkFontColor,
			textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
			appearance: Ti.UI.KEYBOARD_APPEARANCE_ALERT,
			returnKeyType:Ti.UI.RETURNKEY_DONE,
			borderColor : theme.tableBorderColor,
			borderRadius : theme.defaultBorderRadius,
			backgroundColor: '#fff',
			hintText:'e.g. Running',
			autocapitalization:Ti.UI.TEXT_AUTOCAPITALIZATION_SENTENCES,
			autocorrect:true,
			txtUpdating:false,
			clickName:'action_name'
		});
		action_txt.addEventListener('return', function(e) {
			if (row.action_icon && row.action_icon.image !== theme.images.uploadImage) {
				action_txt.blur();
			}
			else{
				// open image options
				photo_dialog.show();
			}
		});
		action_text_view.add(action_txt);
		row.action_txt = action_txt;
		
		var action_text_icon = Ti.UI.createImageView({
			image:theme.images.three_dots,
			width : 32,
			height : 32,
			right : 5,
			hires:true,
			clickName:'action_full_edit'
		});
		action_text_view.add(action_text_icon);
		
		var actionComment = Ti.UI.createLabel({
			top : 0,
			left : 0,
			text : 'In present progressive',
			font : theme.defaultToolTipFont,
			color: theme.lightFontColor,
			textAlign : Ti.UI.TEXT_ALIGNMENT_LEFT
		});
		action_name_view.add(actionComment);
		
		var action_url_view = Ti.UI.createView({
			top : defaultRowHeight,
			left : 5,
			right : 5,
			layout : 'horizontal',
			width : Ti.UI.FILL,
			height:Ti.UI.FILL
		});
		row_view.add(action_url_view); 

		var actionUrl = Ti.UI.createLabel({
			top : 6,
			left : 0,
			text : 'URL:',
			font : theme.defaultFontBold,
			color : theme.darkFontColor,
			textAlign : Ti.UI.TEXT_ALIGNMENT_LEFT
		});
		action_url_view.add(actionUrl);

		var action_url_txt = Ti.UI.createTextField({
			top:2,
			left:0,
			paddingLeft:4,
			value:'',
			width:Ti.UI.FILL,
			height:30,
			font: theme.defaultFont,
			color: theme.darkFontColor,
			textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
			keyboardType:Ti.UI.KEYBOARD_URL,
			appearance: Ti.UI.KEYBOARD_APPEARANCE_ALERT,
			returnKeyType:Ti.UI.RETURNKEY_DEFAULT,
			borderColor : theme.tableBorderColor,
			borderRadius : theme.defaultBorderRadius,
			backgroundColor: '#fff',
			hintText:'http://site.com/activity-page',
			autocapitalization:Ti.UI.TEXT_AUTOCAPITALIZATION_NONE,
			autocorrect:false,
			txtUpdating:false,
			clickName:'action_url'
		});
		action_url_view.add(action_url_txt);
		row.action_url_txt = action_url_txt;
		
		return row;
	}
	
	function createActionRow(_item) {   
		var row = Ti.UI.createTableViewRow({
			height : defaultRowHeight,
			width : Ti.UI.FILL,
			filter : _item.name,
			//backgroundImage : theme.images.rowBox.normal,
			backgroundColor : '#fff',
			selectionStyle : Ti.UI.iPhone.TableViewCellSelectionStyle.NONE,
			action_id : _item.id,
			action_name : _item.name,
			updated_at : _item.updated_at,
			in_my_actions : false,
			in_list_actions : false,
			can_swipe : true,
			className : 'Action_Row'
		});
		
		var row_view = Ti.UI.createView({
			height : Ti.UI.FILL,
			width : Ti.UI.FILL
		});
		row.add(row_view);
		
		var action_favorites_view = Ti.UI.createView({
			top : 20,
			right : 10,
			height : 40,
			width : 100,
			zIndex:10,
			layout:'horizontal'
		});
		row_view.add(action_favorites_view);
		action_favorites_view.hide();
		
		var favorites_icon = Ti.UI.createImageView({
			image: theme.images.favorites_off,
			left : 30,
			width : 40,
			height : 40,
			touchEnabled : true,
			clickName : 'my_actions',
			hires : true,
			zIndex:10
		});

		if(!currentUser){
			currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
		}
		if(currentUser && currentUser.custom_fields && currentUser.custom_fields.my_actions &&
		   currentUser.custom_fields.my_actions.length &&
		   currentUser.custom_fields.my_actions.indexOf(_item.id) > -1){
		   	
		   	favorites_icon.image = theme.images.favorites_on;
		   	row.in_my_actions = true;
		   	
		   }
		action_favorites_view.add(favorites_icon);
		
		if(!List_tag){
			List_tag = JSON.parse(Ti.App.Properties.getString('List_tag', null));
		}
		if(List_tag && List_tag.id && !List_tag.all_activities){
			
			var list_icon = Ti.UI.createImageView({
				image: theme.images.activity_list_off,
				left : 16,
				width : 40,
				height : 40,
				touchEnabled : true,
				clickName : 'list_actions',
				hires : true,
				zIndex:10
			});
			
			if(_item.custom_fields && _item.custom_fields['list_tag_' + List_tag.id]){
				// already in list, only admin/activity owner/one who added can remove from list
				list_icon.image = theme.images.activity_list_on;
				row.in_list_actions = true;
					
				var _is_owner = false, _added_by_me = false;
				if(_item && _item.user && currentUser && _item.user.id === currentUser.id){
					_is_owner = true;
				}
				if(currentUser && currentUser.id === _item.custom_fields['list_tag_' + List_tag.id]){
					_added_by_me = true;
				}
				if(_is_admin || _is_owner || _added_by_me){
					favorites_icon.left = 0;
					action_favorites_view.add(list_icon);
				}
			}
			else{
				// not in list every one can add to list
				favorites_icon.left = 0;
				action_favorites_view.add(list_icon);
			}
		}
		
		var action_checkin_view = Ti.UI.createView({
			top : 20,
			right : 0,
			height : 40,
			width : 90,
			zIndex:10
		});
		row_view.add(action_checkin_view);

		var instaCheckin = Ti.UI.createButton({
			top : 0,
			right : 24,
			width : 40,
			height : 40,
			backgroundImage : theme.buttonImage.checkin.small.normal,
			backgroundSelectedImage : theme.buttonImage.checkin.small.selected,
			style : Ti.UI.iPhone.SystemButtonStyle.PLAIN,
			touchEnabled : true,
			clickName : 'checkin'
		});
		action_checkin_view.add(instaCheckin);

		var disclosure_icon = Ti.UI.createImageView({
			image : theme.images.disclosure,
			width : 13,
			height : 13,
			right : 4,
			top : 13,
			hires : true
		});
		action_checkin_view.add(disclosure_icon);
		
		var action_expires = null;
		if (_item.user && _item.custom_fields && _item.custom_fields.expiration_date && _item.custom_fields.expiration_date.value) {
			var days_diff = moment().diff(moment(_item.custom_fields.expiration_date.value), 'days');
			if(days_diff > 1){
				if(!currentUser || _item.user.id !== currentUser.id){
					return null;
				}
				action_expires = 'Expired ' + moment(_item.custom_fields.expiration_date.value).fromNow();
			}
			else if(days_diff > 0){
				action_expires = 'Expires Today';
			}
			else if(days_diff > -3){
				action_expires = 'Expires ' + moment(_item.custom_fields.expiration_date.value).fromNow();
				row.backgroundImage = theme.images.rowBox.red;
			}
		}
		
		var actionIcon = theme.defaultIcons.action;
		if (_item.photo && _item.photo.urls && _item.photo.urls.square_75) {
			actionIcon = _item.photo.urls.square_75;
		} else if (_item.icon) {
			actionIcon = _item.icon;
		}

		var icon = Ti.UI.createImageView({
			image : actionIcon,
			width : theme.borderedImage.big.width,
			height : theme.borderedImage.big.height,
			left : 5,
			top : 4,
			bottom : 8,
			hires:true
		});
		row_view.add(icon);
		
		var action_name_view = Ti.UI.createView({
			top : 2,
			left : icon.left + icon.width + 6,
			layout : 'horizontal',
			width : Ti.UI.FILL,
			height:22,
			zIndex:1
		});
		row_view.add(action_name_view); 

		var actionName = Ti.UI.createLabel({
			top : 0,
			left : 0,
			text : _item.name,
			font : theme.defaultFontBold,
			color : theme.darkFontColor,
			textAlign : Ti.UI.TEXT_ALIGNMENT_LEFT
		});
		action_name_view.add(actionName);
		
		var _checkins = 0, _upcomings = 0, _discussions = 0, _wants = 0;
		if (_item.custom_fields){
			if (_item.custom_fields.total_do) {
				_checkins = _item.custom_fields.total_do;
			}
			if (_item.custom_fields.total_plan) {
				_upcomings = _item.custom_fields.total_plan;
			}
			if (_item.custom_fields.total_talk) {
				_discussions = _item.custom_fields.total_talk;
			}
			if (_item.custom_fields.total_want) {
				_wants = _item.custom_fields.total_want;
			}
		}
		row.checkins = _checkins + _upcomings + _discussions + _wants;
		
		var action_stats_view = Ti.UI.createView({
			top : 22,
			left : icon.left + icon.width + 6,
			height : 20,
			width : 106,
			layout : 'horizontal'
		});
		row_view.add(action_stats_view);
		
		var checkin_icon = Ti.UI.createImageView({
			image : theme.images.checkin_small,
			width : 13,
			height : 13,
			left : 0,
			top : 2,
			hires:true
		});
		action_stats_view.add(checkin_icon);
		
		var checkin_num = Ti.UI.createLabel({
			top : 0,
			left : 4,
			text : _checkins,
			font : {
				fontSize : 14,
				fontFamily : theme.fontFamily
			},
			color : theme.lightBgColor,
			textAlign : Ti.UI.TEXT_ALIGNMENT_LEFT
		});
		action_stats_view.add(checkin_num);
		
		var upcoming_icon = Ti.UI.createImageView({
			image : theme.images.upcoming,
			width : 13,
			height : 13,
			left : 10,
			top : 2,
			hires:true
		});
		action_stats_view.add(upcoming_icon); 
		
		var upcoming_num = Ti.UI.createLabel({
			top : 0,
			left : 4,
			text : _upcomings,
			font : {
				fontSize : 14,
				fontFamily : theme.fontFamily
			},
			color : theme.lightBgColor,
			textAlign : Ti.UI.TEXT_ALIGNMENT_LEFT
		});
		action_stats_view.add(upcoming_num);
		
		if(_item.custom_fields && _item.custom_fields.action_url && _item.custom_fields.action_url.length){
			var action_url_icon = Ti.UI.createImageView({
				image : theme.images.news.link,
				width : 13,
				height : 13,
				left : 10,
				top : 2,
				hires:true
			});
			action_stats_view.add(action_url_icon);
		}
		
		if(action_expires){
			var action_expires_lbl = Ti.UI.createLabel({
				top : 36,
				left : icon.left + icon.width + 6,
				text : action_expires,
				font : theme.defaultToolTipFont,
				height : 22,
				width : Ti.UI.SIZE,
				color : row.backgroundImage === theme.images.rowBox.red ? theme.darkFontColor : theme.lightRedColor,
				textAlign : Ti.UI.TEXT_ALIGNMENT_LEFT,
				zIndex:1
			});
			row_view.add(action_expires_lbl);
		}
		
		var byName = '';
		if(_item.is_following){
			if(_item.user && _item.user.username){
				byName = 'Done by ' + common.getUserDisplayName(_item.user);
			}
		}
		else if (_item.custom_fields && _item.custom_fields.action_by_value && _item.custom_fields.action_by_value.length) {
			byName = _item.custom_fields.action_by_value.trim();
			if(byName.toLowerCase() === 'by'){
				byName = '';
			}
		}
		
		if(byName !== ''){
			var actionBy = Ti.UI.createLabel({
				bottom : 2,
				left : icon.left + icon.width + 6,
				right : 10,
				text : byName,
				font : theme.defaultToolTipFont,
				height : 22,
				width : Ti.UI.FILL,
				color : theme.darkFontColor,
				textAlign : Ti.UI.TEXT_ALIGNMENT_LEFT
			});
			row_view.add(actionBy);
		}
		
		var row_divider = Ti.UI.createView({
			bottom:0,
			height : 1,
			width : Ti.UI.FILL,
			backgroundColor : '#9CC3DD'
		});
		row_view.add(row_divider);
		
		return row;
	}
	
	function createActionRows(_items) {
		var rows = [], deleted_actions = [];
		if(_items && _items.length > 0) {
			for(var i = 0, l = _items.length; i < l; i++) {
				// skip disabled actions
				if(_items[i].custom_fields && _items[i].custom_fields.disabled){
					deleted_actions.push(_items[i].id);
				}
				else{
					if(!_is_admin && _items[i].custom_fields && _items[i].custom_fields.importance < 1){
						continue;
					}
					
					var row = createActionRow(_items[i]);
					if(row !== null){
						rows.push(row);
					}
				}
			}
		}
		if(deleted_actions.length){
			// update user actions, remove deleted
			currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
			if (currentUser && currentUser.custom_fields && currentUser.custom_fields.my_actions && 
			currentUser.custom_fields.my_actions.length) {
				var current_actions = _.without(currentUser.custom_fields.my_actions,deleted_actions);
				if(current_actions && current_actions.length !== currentUser.custom_fields.my_actions.length){
					var UsersModel = require('/lib/model/users');
					UsersModel.update({
						custom_fields : {
							my_actions : current_actions
						}
					}, function(updateEvent) {
						if (updateEvent.success) {
							currentUser = updateEvent.users[0];
							Ti.App.Properties.setString('carely_user', JSON.stringify(updateEvent.users[0]));

							Model.AppCache.users.set(updateEvent.users[0]);
						} else {
							Model.eventDefaultErrorCallback(updateEvent);
						}
					});
				}
			}
		}
		return rows;
	}
	
	
	function endUpdate() {
		if(lastRowSwiped){
			handleSwipe(lastRowSwiped, true);
			lastRowSwiped = null;
		}
		
		if(tableView.pullRefresh){
			tableView.pullRefresh = false;
			
			tableView.top = 0;
			tableView.scrollToTop(0, {
				animated : false
			});
			puller.end(tableView, function() {});
		}
		
		tableView.setData(activity_rows);
	}
	
	var _page = 1, _more = true, _updating = false, _searching = false;
	function refreshActions(_force){
		if(_updating){
			return;
		}
		
		common.refreshHandler.setRefresh.actions(false);
		
		_updating = true;
		_more = true;
		
		if(_force){
			_page = 1;
			activity_rows = [];
		}
		
		queryActivities();
	}
	
	function handleListActivities(e){
		if(e.meta && e.meta.page === 1){
			List_tag = JSON.parse(Ti.App.Properties.getString('List_tag', null));
			if(List_tag && List_tag.id && List_tag.total_activities !== e.meta.total_results){
				var update_params = {
					total_activities : e.meta.total_results
				}
				
				if(!List_tag.all_activities){
					update_params.activity_pics = [];
					if (e.events && e.events.length) {
						for (var i = 0, v = e.events.length; i < v && i < 5; i++) {
							if (e.events[i] && e.events[i].photo && e.events[i].photo.urls) {
								if (e.events[i].photo.urls.square_75) {
									update_params.activity_pics.push(e.events[i].photo.urls.square_75);
								} else if (e.events[i].photo.urls.thumb_100) {
									update_params.activity_pics.push(e.events[i].photo.urls.thumb_100);
								} else if (e.events[i].photo.urls.original) {
									update_params.activity_pics.push(e.events[i].photo.urls.original);
								}
							}
						}
					}
				}

				var ObjectsModel = require('/lib/model/objects');
				ObjectsModel.update(ObjectsModel.classNames.tag_lists, List_tag.id, update_params, null, null, function(updateEvent) {
					if (updateEvent.success) {
						if (updateEvent[ObjectsModel.classNames.tag_lists] && updateEvent[ObjectsModel.classNames.tag_lists][0]) {
							Ti.App.Properties.setString('List_tag', JSON.stringify(updateEvent[ObjectsModel.classNames.tag_lists][0]));
						}
					} else {
						Model.eventDefaultCallback(updateEvent);
					}
				});
			}
		}
	}
	
	function queryActivities(){
		_updating = true;

		var _where = {
			disabled : false
		};

		if(!_is_admin){
			_where.importance = { '$gt' : 0 };
		}
			
		List_tag = JSON.parse(Ti.App.Properties.getString('List_tag', null));
		if(List_tag){
			if(List_tag.id && !List_tag.all_activities){
				_where['list_tag_' + List_tag.id] = {$exists : true};
			}
			else if(List_tag.is_favorites){
				currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
				if(currentUser && currentUser.custom_fields && currentUser.custom_fields.my_actions &&
			   	   currentUser.custom_fields.my_actions.length){
					_where._id = { '$in' : currentUser.custom_fields.my_actions };
				}
				else{
					// empty favorites
					endUpdate();
					_updating = false;
					_more = false;
					return false;
				}
			}
			else if(List_tag.is_following){
				currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
				if(currentUser && currentUser.custom_fields && currentUser.custom_fields.my_actions &&
			   	   currentUser.custom_fields.my_actions.length){
					_where._id = { '$in' : currentUser.custom_fields.my_actions };
				}
				else{
					// empty following
					endUpdate();
					_updating = false;
					_more = false;
					return false;
				}
			}
		}
		
		footer_view.height = Ti.UI.SIZE;
		
		ActionsModel.queryPages(_where, '-importance', _page, 10, function(e) {
			
			footer_view.height = 0;
			
			if (e.success) {
				
				handleListActivities(e);
				
				if (e.meta.total_results > 0) {
					if (e.meta.page < e.meta.total_pages) {
						_page += 1;
					}
					else{
						_more = false;
					}
					
					// cache items
					Model.AppCache.actions.setMany(e.events);

					var action_rows = createActionRows(e.events);
					if (action_rows && action_rows.length) {
						activity_rows = activity_rows.concat(action_rows);
					}
				} else {
					_more = false;
				}
			} else {
				Model.eventDefaultErrorCallback(e);
			}
			
			endUpdate();
			_updating = false;
		});
	}
	
	function handleActionsOverlay(){
		var showActionsOverlay = Ti.App.Properties.getBool('carely_showActionsOverlay', true);
		if(showActionsOverlay){
			Ti.App.Properties.setBool('carely_showActionsOverlay', false);
			var win = Ti.UI.createWindow({
				navBarHidden : true,
				backgroundImage:theme.images.actionsOverlay,
				orientationModes : [Ti.UI.PORTRAIT]
			});
			win.addEventListener('click', function(e){
				this.close({duration:500,opacity:0});
			});
			win.open();
		}
	}
	
	self.addEventListener('close', function(e) {
		search.blur();
	});
	
	self.addEventListener('open', function(e) {
		
		if (Ti.App.Properties.getBool('carely_goToHome', false) === true) {
			require('/ui/MasterWindow').getNavGroup().close(this, {
				animated : false
			});
		}
		handleActionsOverlay();
		
		// if (Ti.App.Properties.getBool('carely_actions_restart', false) === true) {
			// Ti.App.Properties.setBool('carely_actions_restart', false);
// 			
			// activity_rows = [];
// 			
			// common.refreshHandler.setRefresh.actions(true);
// 			
			// endUpdate();
		// }
		
		activity_rows = [];
		endUpdate();
					
		Ti.App.Properties.setBool('carely_actions_restart', false);
		common.refreshHandler.setRefresh.actions(false);
		refreshActions(true);
	});
	
	self.addEventListener('focus', function(e) {
		
		if (Ti.App.Properties.getBool('carely_goToHome', false) === true) {
			require('/ui/MasterWindow').getNavGroup().close(this, {
				animated : false
			});
		} else{
			require('/lib/analytics').trackScreen({ screenName : self.title });
			
			currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
			List_tag = JSON.parse(Ti.App.Properties.getString('List_tag', null));
			
			if(new_action_active){
				if (new_action_active) {
					if (new_action_row) {
						setTimeout(function() {
							new_action_row.action_txt.fireEvent('focus');
						}, 200);
					}
				}
				return false;
			}
			else{
				search.blur();
				search.touchEnabled = true;
				self.rightNavButton.enabled = true;
				
				var refreshNow = common.refreshHandler.getRefresh.actions();
				
				if (Ti.App.Properties.getBool('carely_actions_restart', false) === true) {
					Ti.App.Properties.setBool('carely_actions_restart', false);
					
					activity_rows = [];
					endUpdate();
					
					refreshNow = true;
				}
				
				
				if (refreshNow) {
					common.refreshHandler.setRefresh.actions(false);
					refreshActions(true);
				}
			}
		}
	});
	
	return self;
}

module.exports = ActionsWindow;
