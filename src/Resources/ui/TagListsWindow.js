
function TagListsWindow(_params) {
	var _ = require('/lib/underscore'),
		theme = require('/ui/theme'),
		common = require('/lib/common'),
		Model = require('/lib/model/model'),
		ObjectsModel = require('/lib/model/objects');

	var currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null)),
		_is_admin = false,
		_is_setup_mode = false;
	if(currentUser && currentUser.admin === 'true' && currentUser.custom_fields && currentUser.custom_fields.show_admin_features !== false){
		_is_admin = true;
	}
	if(_params && _params.setupMode){
		_is_setup_mode = true;
	}
		
	var List_tag = JSON.parse(Ti.App.Properties.getString('List_tag', null)),
		defaultRows = Model.AppCache.get('List_tag_default_rows');
	if(!defaultRows === null){
		defaultRows = [];
	}
	
	var title_view = Ti.UI.createView({
		top:0,
		height:Ti.UI.FILL,
		width:200
	});
	title_view.addEventListener('touchstart', function(e){
		if(!title_icon.is_showing){
			title_view.add(title_icon);
			title_icon.is_showing = true;
		}
	});
	title_view.addEventListener('touchend', function(e){
		if(title_icon.is_showing){
			setTimeout(function() {
				if(title_icon.is_showing){
					title_view.remove(title_icon);
					title_icon.is_showing = false;
				}
			}, 150);
		}
	});
	title_view.addEventListener('click', function(e){
		if(_updating){
			return false;
		}
		
		self.close();
	});
	
	var title_lbl = Ti.UI.createLabel({
		text : 'Activity lists',
		font : {
			fontSize : 18,
			fontFamily : theme.fontFamily,
			fontWeight : 'bold'
		},
		color : theme.defaultBgColor,
		textAlign : Ti.UI.TEXT_ALIGNMENT_CENTER
	});
	title_view.add(title_lbl);
	
	var title_icon = Ti.UI.createImageView({
		image : theme.images.splash,
		width : 32,
		height : 32,
		left : 84,
		top : 6,
		hires:true
	});
	
	var self = Ti.UI.createWindow({
		titleControl:title_view,
		title:title_lbl.text,
		navBarHidden:false,
		backgroundColor:theme.defaultBgColor,
		orientationModes : [Ti.UI.PORTRAIT],
		barColor : theme.barColor,
		tabBarHidden : true
	});
	
	var skipBtn = null;
	if(List_tag){
		var skipBtn = Ti.UI.createButton({
			title:'Back'
		});
		skipBtn.addEventListener('click', function(e){
			if(_updating){
				return false;
			}
			
			self.close();
		});
		self.leftNavButton = skipBtn;
	}
	
	var defaultRowHeight = theme.borderedImage.big.height + 12,
		new_tag_list_row = null,
		tag_list_rows = [],
		_updating = false;
	
	var saveBtn = Ti.UI.createButton({
		systemButton : Ti.UI.iPhone.SystemButton.SAVE
	});
	saveBtn.addEventListener('click', function(e){
		handleNewTagList(false);
	});
	
	var cancelBtn = Ti.UI.createButton({
		systemButton : Ti.UI.iPhone.SystemButton.CANCEL
	});
	cancelBtn.addEventListener('click', function(e){		
		handleNewTagList(true);
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
		
		require('/lib/analytics').trackEvent({
			category : 'activity list',
			action : 'new',
			label : 'click',
			value : null
		}); 

		handleCreateNewTagList(e);
	});
	self.rightNavButton = createNewButton;
	
	function handleCreateNewTagList(e){
		if(_updating){
			return false;
		}
		
		_updating = true;
		new_tag_list_row = createNewTagListRow(e ? e.list_tag_name : '');
		var new_tag_list_section = createTagListSection({
			title : 'Create a new activity list'
		});
		new_tag_list_section.add(new_tag_list_row);
		tableView.setData([new_tag_list_section]);

		search.value = '';
		header_view.height = 0;
		if(header_items_view){
			header_items_view.height = Ti.UI.SIZE;
		}
		_searching = false;
		self.rightNavButton.enabled = true;
		search.blur();
		
		search.touchEnabled = false;
		self.leftNavButton = cancelBtn;
		self.rightNavButton = saveBtn;
		tableView.scrollable = false;
		new_tag_list_row.list_txt.focus();

		require('/lib/analytics').trackEvent({
			category : 'activity list',
			action : 'new',
			label : 'click',
			value : null
		});
	}
	
	function handleNewTagList(_cancel){
		require('/lib/analytics').trackEvent({
			category : 'activity list',
			action : 'new',
			label : _cancel ? 'cancel' : 'save',
			value : null
		});
		
		if(new_tag_list_row && new_tag_list_row.list_txt){
			new_tag_list_row.list_txt.blur();
		}
		
		if(_cancel){
			_updating = false;
			search.value = '';
			_searching = false;
			self.rightNavButton.enabled = true;
			search.blur();
			
			new_tag_list_row = null;
			
			header_view.height = Ti.UI.SIZE;
			self.leftNavButton = skipBtn;
			self.rightNavButton = createNewButton;
			search.touchEnabled = true;
			
			endUpdate();
			tableView.scrollable = true;
		}
		else{
			var _list_name = new_tag_list_row.list_txt.value.replace(/(^\s*)|(\s*$)/gi, '');
			if (_list_name.length < 3) {
				new_tag_list_row.list_txt.focus();
				if(!_list_name.length){
					Ti.UI.createAlertDialog({
						message : 'Select a name for your activity list',
						buttonNames : [L('ok', 'OK')]
					}).show(); 
				}
				else{
					Ti.UI.createAlertDialog({
						message : 'Activity list names should be at least 3 characters long',
						buttonNames : [L('ok', 'OK')]
					}).show(); 
				}
			} else {
				var actIndicator = require('/ui/ActivityIndicator');
				var indicator = new actIndicator();
				
				indicator.showModal('Creating activity list...', 60000, 'Timeout creating activity list!');
				ObjectsModel.query(ObjectsModel.classNames.tag_lists, {
					name_lower : _list_name.toLowerCase()
				}, null, 1, 0, function(queryEvent) {
					if (queryEvent.success) {

						if (queryEvent[ObjectsModel.classNames.tag_lists] && queryEvent[ObjectsModel.classNames.tag_lists].length) {
							indicator.hideModal();
							
							// we already have an activity list with that name
							new_tag_list_row.list_txt.focus();
							Ti.UI.createAlertDialog({
								message : 'Activity list with that name already exists!',
								buttonNames : [L('ok', 'OK')]
							}).show(); 
						} else {
							
							// save activity list
							var createParams = {
								name : _list_name,
								name_lower : _list_name.toLowerCase(),
								total_activities : 0,
								total_posts : 0,
								total_users : 0,
								is_private : false,
								is_active : true,
								order_rank : 1,
								tags : [],
								activity_pics : []
							};
							if(new_tag_list_row && new_tag_list_row.order_rank){
								createParams.order_rank = (new_tag_list_row.order_rank * 1 || 1);
							}
							createParams.tags.push(createParams.name_lower);
							createParams.tags = createParams.tags.concat(createParams.name_lower.split(' '));
							
							// no activity list with that name, create one
							ObjectsModel.create(ObjectsModel.classNames.tag_lists, createParams, 'actions_acl', null, function(createEvent){
								indicator.hideModal();
								
								_updating = false;
								header_view.height = Ti.UI.SIZE;
								self.leftNavButton = skipBtn;
								self.rightNavButton = createNewButton;
								search.touchEnabled = true;
								
								endUpdate();
								tableView.scrollable = true;
								
								if(createEvent.success){
									List_tag = createEvent[ObjectsModel.classNames.tag_lists][0];					
									Ti.App.Properties.setString('List_tag', JSON.stringify(List_tag));
									
									var UsersModel = require('/lib/model/users');
									UsersModel.update({
										custom_fields : {
											'[CUSTOM_tag_list]list_tag_id' : List_tag.id
										}
									}, function(updateEvent) {
										if (updateEvent.success) {
											Ti.App.Properties.setString('carely_user', JSON.stringify(updateEvent.users[0]));
											Model.AppCache.users.set(updateEvent.users[0]);

											Ti.App.fireEvent('lists.update_users_count', { id : List_tag.id });
										} else {
											Model.eventDefaultErrorCallback(updateEvent);
										}
									});
									
									Ti.App.Properties.setBool('carely_news_restart', true);
									Ti.App.Properties.setBool('carely_actions_restart', true);
									Model.AppCache.set('news_initial_default_rows', null);
									
									self.close();
									
									var ImportActivityWindow = require('/ui/ImportActivityWindow');
									var win = new ImportActivityWindow();
									require('/ui/MasterWindow').getNavGroup().open(win);
									
								}
								else{
									Model.eventDefaultErrorCallback(createEvent);
								}
							});
						}
					} else {
						indicator.hideModal();
						Model.eventDefaultErrorCallback(queryEvent);
					}
				});
			}	
		}
	}
	
	var last_search = null, auto_complete_timer = null, _searching = false;
	var search = Ti.UI.createSearchBar({
		barColor : theme.subBarColor,
		hintText : 'Search activity lists',
		autocapitalization : Ti.UI.TEXT_AUTOCAPITALIZATION_SENTENCES
	});
	search.addEventListener('blur', function(e){
		search.showCancel = false;
	});
	search.addEventListener('change', function(e) {
		if(auto_complete_timer){
			clearTimeout(auto_complete_timer);
		}
		
		if(_updating){
			return false;
		}
		if(new_tag_list_row){
			return false;
		}

		if(e.value){
			if(!e.value.length){
				_searching = false;
				self.rightNavButton.enabled = true;
				endUpdate();
			}
			else if (e.value.length > 2 && e.value !== last_search) {
				auto_complete_timer = setTimeout(function(){
					last_search = e.value;
					searchActivityList(e.value);
					
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
		
		if(_updating){
			return false;
		}
		if(new_tag_list_row){
			return false;
		}
		if (this.value && this.value.length > 2 && this.value !== last_search) {
			auto_complete_timer = setTimeout(function(){
				last_search = this.value;
				searchActivityList(this.value);
				
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
		_searching = false;
		if(header_items_view){
			header_items_view.height = Ti.UI.SIZE;
		}
		self.rightNavButton.enabled = true;
		search.blur();
		endUpdate();
	});
	
	var createListTagFromSearchRow = Ti.UI.createTableViewRow({
		height : Ti.UI.SIZE,
		width : Ti.UI.FILL,
		backgroundImage : theme.images.rowBox.normal,
		selectionStyle : Ti.UI.iPhone.TableViewCellSelectionStyle.NONE,
		createListTagFromSearchRow : true,
		search_term : null,
		className : 'NewFromSearch_Row'
	});

	var createListTagFromSearch_view = Ti.UI.createView({
		height : Ti.UI.SIZE,
		width : Ti.UI.FILL
	});
	createListTagFromSearchRow.add(createListTagFromSearch_view);

	var createListTagFromSearch_icon = Ti.UI.createImageView({
		image : theme.images.plus,
		width : theme.borderedImage.big.width,
		height : theme.borderedImage.big.height,
		left : 5,
		top : 4,
		bottom : 8,
		hires : true
	});
	createListTagFromSearch_view.add(createListTagFromSearch_icon);

	var createListTagFromSearch_name = Ti.UI.createLabel({
		top : 2,
		left : createListTagFromSearch_icon.left + createListTagFromSearch_icon.width + 6,
		text : '',
		width : Ti.UI.FILL,
		height : Ti.UI.SIZE,
		font : theme.defaultFontBold,
		color : theme.barColor,
		textAlign : Ti.UI.TEXT_ALIGNMENT_LEFT
	});
	createListTagFromSearch_view.add(createListTagFromSearch_name);
	
	function searchActivityList(_search_term){
		if(_updating){
			return false;
		}
		
		if(_search_term && _search_term.length > 2){
			var LowerCaseTerm = _search_term.toLowerCase();
			_searching = true;
			_updating = true;
			
			footer_view.height = Ti.UI.SIZE;
			if(header_items_view){
				header_items_view.height = 0;
			}
			
			var search_section = createTagListSection({title:'Results for \'' + _search_term + '\''})
			var rows = [];
			for(var i=0, v=tag_list_rows.length; i<v; i++){
				if(tag_list_rows[i].filter && tag_list_rows[i].filter.length && 
				   tag_list_rows[i].filter.toLowerCase().indexOf(LowerCaseTerm) > -1){
					rows.push(tag_list_rows[i]);
				}
			}
			
			rows = _.uniq(rows, false, function(n){
				return n.list_id;
			});
			search_section.rows = rows;
			tableView.setData([search_section]);
			
			require('/lib/analytics').trackEvent({
				category : 'search',
				action : 'filter',
				label : _search_term,
				value : rows.length
			});
			
			var q_search_params = {
				is_active : true,
				tags_array : LowerCaseTerm
			}
			
			if(!_is_admin){
				q_search_params.order_rank = { '$gt' : 0 };
			}
			
			ObjectsModel.queryPages(ObjectsModel.classNames.tag_lists, q_search_params, '-order_rank', 1, 100, function(queryEvent) {
				footer_view.height = 0;
				
				if(queryEvent.success){
					if(queryEvent.meta.total_results > 0){
						var search_rows = createActivityListRows(queryEvent[ObjectsModel.classNames.tag_lists]);
						if(search_rows && search_rows.length){
							rows = rows.concat(search_rows);
							rows = _.uniq(rows, false, function(n){
								return n.list_id;
							});
						}
					}
				}
				else{
					Model.eventDefaultErrorCallback(queryEvent);
				}
				
				
				createListTagFromSearch_name.text = 'Create a new "' + _search_term + '" activity list';
				createListTagFromSearchRow.search_term = _search_term;
				
				if(rows && rows.length){
					rows.push(createListTagFromSearchRow);
					search_section.rows = rows;
				}
				else{
					search_section.rows = [createListTagFromSearchRow];
					search_section.headerView.children[1].text = 'No results for \'' + _search_term + '\'';
				}
				tableView.setData([search_section]);
				
				_updating = false;
				_searching = false;
				
				rows = null;
				search.value = search.value;
			});
		}
	}
	
	var header_view = Ti.UI.createView({
		height : Ti.UI.SIZE,
		width:Ti.UI.FILL,
		layout:'vertical'
	});
	header_view.add(search);
	
	var header_items_view = null;
	if(!_is_setup_mode){
		header_items_view = Ti.UI.createView({
			top:5,
			bottom:5,
			height : 93,
			width:Ti.UI.FILL,
			items_width:93,
			items_height:93,
			layout:'horizontal'
		});
		header_view.add(header_items_view);
		
		var favorites_btn = Ti.UI.createButton({
			image:theme.images.list_favorites,
			left:10,
			width:header_items_view.items_width,
			height:header_items_view.items_height
		});
		favorites_btn.addEventListener('click', function(e){
			if(_updating){
				return false;
			}
			
			List_tag = {
				name : 'Favorites',
				is_favorites : true,
				id : null
			};
			Ti.App.Properties.setString('List_tag', JSON.stringify(List_tag));
				
			Ti.App.Properties.setBool('carely_news_restart', true);
			Ti.App.Properties.setBool('carely_actions_restart', true);
			Model.AppCache.set('news_initial_default_rows', null);
			
			self.close();
		});
		header_items_view.add(favorites_btn);
		
		if(currentUser && currentUser.custom_fields && currentUser.custom_fields.my_actions && currentUser.custom_fields.my_actions.length > 0){
			var favorites_lbl = Ti.UI.createLabel({
				top : 2,
				right : 4,
				font : {
					fontSize : 15,
					fontFamily : theme.fontFamily,
					fontWeight : 'bold'
				},
				text : '' + currentUser.custom_fields.my_actions.length,
				color : theme.whiteFontColor,
				textAlign : Ti.UI.TEXT_ALIGNMENT_RIGHT
			});
			favorites_btn.add(favorites_lbl);
		}
		
		var suggested_btn = Ti.UI.createButton({
			image:theme.images.list_suggested,
			left:10,
			width:header_items_view.items_width,
			height:header_items_view.items_height
		});
		suggested_btn.addEventListener('click', function(e){
			// open suggested window
			if(_updating){
				return false;
			}
			
			var ActivitySuggestionsWindow = require('/ui/ActivitySuggestionsWindow');
			var activitySuggestionsWindow = new ActivitySuggestionsWindow({
				parent_win:self
			});
			activitySuggestionsWindow.open({modal:true,transition:Ti.UI.iPhone.AnimationStyle.FLIP_FROM_LEFT});
		});
		header_items_view.add(suggested_btn);
		
		if(currentUser && currentUser.custom_fields && currentUser.custom_fields.total_suggestions > 0){
			var suggested_lbl = Ti.UI.createLabel({
				top : 2,
				right : 4,
				font : {
					fontSize : 15,
					fontFamily : theme.fontFamily,
					fontWeight : 'bold'
				},
				text : '' + currentUser.custom_fields.total_suggestions,
				color : theme.whiteFontColor,
				textAlign : Ti.UI.TEXT_ALIGNMENT_RIGHT
			});
			suggested_btn.add(suggested_lbl);
		}
		
		var following_btn = Ti.UI.createButton({
			image:theme.images.list_following,
			left:10,
			width:header_items_view.items_width,
			height:header_items_view.items_height
		});
		following_btn.addEventListener('click', function(e){
			if(_updating){
				return false;
			}
			
			List_tag = {
				name : 'Following',
				id : null,
				is_following : true
			};
			Ti.App.Properties.setString('List_tag', JSON.stringify(List_tag));
			
			Ti.App.Properties.setBool('carely_news_restart', true);
			Ti.App.Properties.setBool('carely_actions_restart', true);
			Model.AppCache.set('news_initial_default_rows', null);
							
			self.close();
		});
		header_items_view.add(following_btn);
		
		if(currentUser && currentUser.custom_fields && currentUser.custom_fields.following && currentUser.custom_fields.following.length > 0){
			var following_lbl = Ti.UI.createLabel({
				top : 2,
				right : 4,
				font : {
					fontSize : 15,
					fontFamily : theme.fontFamily,
					fontWeight : 'bold'
				},
				text : '' + currentUser.custom_fields.following.length,
				color : theme.whiteFontColor,
				textAlign : Ti.UI.TEXT_ALIGNMENT_RIGHT
			});
			following_btn.add(following_lbl);
		}
	}
	
	var header_divider = Ti.UI.createView({
		bottom: 0,
		width:Ti.UI.FILL,
		height:1,
		backgroundColor:'#9CC3DD'
	});
	header_view.add(header_divider);
	
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
		backgroundColor : theme.tableBackgroundColor,
		height : 'auto',
		separatorStyle : Ti.UI.iPhone.TableViewSeparatorStyle.NONE,
		headerView : header_view,
		footerView : footer_view,
		scrollsToTop : true,
		canRefreshNow : false,
		bubbleParent:false
	});
	
	// pull to refresh
	var PullToRefresh = require('/ui/PullToRefresh');
	var puller = new PullToRefresh();
	tableView.headerPullView = puller._view;
	
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
			queryTagLists(true);
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
		if(new_tag_list_row){
			return false;
		}
		if (e.contentOffset.y < 0) {
			if (_updating === false && _searching === false) {
				puller.scroll(e);
			}
		} else {
			if (_updating === false && _searching === false && _more && e.contentOffset.y + e.size.height + 100 > e.contentSize.height) {
				tableView.canRefreshNow = true;
			}
		}
	});
	tableView.addEventListener('scrollEnd', function(e) {
		_scrolling = false;
		
		var loading_new_data = 0;
		if(tableView.canRefreshNow){
			tableView.canRefreshNow = false;

			loading_new_data = 1;
				
			_updating = true;
			
			queryTagLists(false);
		}
		
		require('/lib/analytics').trackEvent({
			category : 'activity list',
			action : 'scroll',
			label : 'load data',
			value : loading_new_data
		});
	});
	tableView.addEventListener('singletap', function(e){
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
		
		if(tableView.input_text_updating){
			//tableView.input_text_updating = false;
			return false;
		}
		
		if(_updating){
			return false;
		}
		
		require('/lib/analytics').trackEvent({
			category : 'activity list',
			action : 'click',
			label : (e && e.row && e.row.tag_list_id) ? e.row.tag_list_id : null,
			value : null
		});
		
		if(e && e.row){
			if(e.row.createListTagFromSearchRow){
				require('/lib/analytics').trackEvent({
					category : 'activity list',
					action : 'new from search',
					label : e.row.search_term,
					value : null
				});
				
				if(auto_complete_timer){
					clearTimeout(auto_complete_timer);
				}
				
				handleCreateNewTagList({ list_tag_name : e.row.search_term });
			}
			else if(e.row.list_id){
				if(e.row.enableEdit && e.source && (e.source.clickName === 'listName' || e.source.clickName === 'listRank')){
					e.source.focus();
				}
				else{
					if(e.row.itemJSON){
						if(!e.row.is_current_list){
							Ti.App.Properties.setString('List_tag', e.row.itemJSON);

							if (e.row.list_id) {
								var UsersModel = require('/lib/model/users');
								UsersModel.update({
									custom_fields : {
										'[CUSTOM_tag_list]list_tag_id' : e.row.list_id
									}
								}, function(updateEvent) {
									if (updateEvent.success) {
										Ti.App.Properties.setString('carely_user', JSON.stringify(updateEvent.users[0]));
										Model.AppCache.users.set(updateEvent.users[0]);
					
										Ti.App.fireEvent('lists.update_users_count', {
											id : e.row.list_id
										});
									} else {
										Model.eventDefaultErrorCallback(updateEvent);
									}
								});
							}
					
							Ti.App.Properties.setBool('carely_news_restart', true);
							Ti.App.Properties.setBool('carely_actions_restart', true);
							Model.AppCache.set('news_initial_default_rows', null);
						}
						self.close();
					}
				}
			}
		}
	});
	self.add(tableView);
	
	function endUpdate(){
		if(tableView.pullRefresh){
			tableView.pullRefresh = false;
			
			tableView.top = 0;
			tableView.scrollToTop(0, {
				animated : false
			});
			puller.end(tableView, function() {});
		}
		
		tableView.setData(tag_list_rows);
	}
	
	var _page = 1, _more = true;
	function queryTagLists(_force){
		_updating = true;
		_more = true;
		
		search.touchEnabled = false;
		createNewButton.enabled = false;
		
		if(_force){
			_page = 1;
			tag_list_rows = [];
			
			if (defaultRows && defaultRows.length) {
				var rows = createActivityListRows(defaultRows);
				if (rows && rows.length) {
					tag_list_rows = tag_list_rows.concat(rows);
				}
				rows = null;
			}
			tableView.setData(tag_list_rows);
		}
		footer_view.height = Ti.UI.SIZE;
		
		var query_params = {
			is_active : true
		};
		if(!_is_admin){
			query_params.order_rank = { '$gt' : 0 };
		}
		
		ObjectsModel.queryPages(ObjectsModel.classNames.tag_lists, query_params, '-order_rank', _page, 7, function(queryEvent) {
			
			footer_view.height = 0;
			
			if(queryEvent.success){
				if(queryEvent.meta.total_results > 0){
					if(queryEvent.meta.page === 1){
						defaultRows = queryEvent[ObjectsModel.classNames.tag_lists];
						Model.AppCache.set('List_tag_default_rows', queryEvent[ObjectsModel.classNames.tag_lists]);
						
						tag_list_rows = [];
					}
					
					if (queryEvent.meta.page < queryEvent.meta.total_pages) {
						_page += 1;
					}
					else{
						_more = false;
					}
					
					var rows = createActivityListRows(queryEvent[ObjectsModel.classNames.tag_lists]);
					if(rows && rows.length){
						tag_list_rows = tag_list_rows.concat(rows);
						tag_list_rows = _.uniq(tag_list_rows, false, function(n){
							return n.list_id;
						});
					}
				}
				else{
					if(queryEvent.meta.page === 1){
						Model.AppCache.set('List_tag_default_rows', null);
					}
					
					_more = false;
				}
			}
			else{
				Model.eventDefaultErrorCallback(queryEvent);
			}

			endUpdate();
						
			_updating = false;
			search.touchEnabled = true;
			createNewButton.enabled = true;
		});
	}
	
	function createTagListSection(_item){

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
		
		var divider_bottom = Ti.UI.createView({
			bottom:0,
			backgroundColor : '#111931',
			height : 1
		});
		section_view.add(divider_bottom);
		
		return Ti.UI.createTableViewSection({ headerView: section_view});
	}
	
	function createNewTagListRow(_name) { 
		var row = Ti.UI.createTableViewRow({
			height : Ti.UI.SIZE,
			width : Ti.UI.FILL,
			list_name : _name,
			order_rank : 1,
			backgroundColor : '#fff',
			selectionStyle : Ti.UI.iPhone.TableViewCellSelectionStyle.NONE,
			is_new_tag_list:true,
			className : 'ActivityList_Row'
		});
		
		var row_view = Ti.UI.createView({
			height : Ti.UI.SIZE,
			width : Ti.UI.FILL,
			layout : 'vertical'
		});
		row.add(row_view);
		
		var title_view = Ti.UI.createView({
			height : Ti.UI.SIZE,
			width : Ti.UI.FILL
		});
		row_view.add(title_view);
		
		var list_name_txt = Ti.UI.createTextField({
			//top : 5,
			left : 4,
			right : 28,
			paddingLeft : 4,
			textAlign : Ti.UI.TEXT_ALIGNMENT_LEFT,
			value : _name,
			font : theme.defaultFontBold,
			color : theme.barColor,
			touchEnabled : true,
			editable : true,
			height:30,
			width : Ti.UI.FILL,
			appearance: Ti.UI.KEYBOARD_APPEARANCE_ALERT,
			returnKeyType:Ti.UI.RETURNKEY_DONE,
			borderColor : theme.tableBorderColor,
			borderRadius : theme.defaultBorderRadius,
			borderWidth : 1,
			backgroundColor: '#fff',
			hintText:'Activity name (3+ chars long)',
			autocapitalization:Ti.UI.TEXT_AUTOCAPITALIZATION_SENTENCES,
			autocorrect:true,
			valueEdited:false,
			clickName:'listName'
		});
		list_name_txt.addEventListener('return', function(e) {
			if (this.value.length > 2) {
				row.list_name = list_name_txt.value;
				
				handleNewTagList(false);
			}
			else{
				Ti.UI.createAlertDialog({
					message : 'Activity list names should be at least 3 characters long',
					buttonNames : [L('ok', 'OK')]
				}).show();
			}
		});

		if (_is_admin) {
			list_name_txt.right += 36;
			list_name_txt.returnKeyType = Ti.UI.RETURNKEY_NEXT;
			
			var rank_txt = Ti.UI.createTextField({
				//top : 5,
				right : 28,
				paddingLeft : 4,
				textAlign : Ti.UI.TEXT_ALIGNMENT_CENTER,
				value : '1',
				font : theme.defaultFontBold,
				color : theme.barColor,
				touchEnabled : true,
				editable : true,
				height:30,
				width : 30,
				appearance : Ti.UI.KEYBOARD_APPEARANCE_ALERT,
				returnKeyType : Ti.UI.RETURNKEY_NEXT,
				keyboardType : Ti.UI.KEYBOARD_NUMBERS_PUNCTUATION,
				borderColor : theme.tableBorderColor,
				borderRadius : theme.defaultBorderRadius,
				borderWidth : 1,
				backgroundColor : '#fff',
				hintText:'1',
				autocapitalization : Ti.UI.TEXT_AUTOCAPITALIZATION_NONE,
				autocorrect:false,
				valueEdited : false,
				clickName : 'listRank'
			});
			rank_txt.addEventListener('return', function(e) {
				if (this.value.length) {
					row.order_rank = (this.value * 1 || 1);
				}
				else{
					this.value = '1';
					row.order_rank = 1;
				}
				
				list_name_txt.focus();
			});
			title_view.add(rank_txt);
		}
		title_view.add(list_name_txt);
		row.list_txt = list_name_txt;
		
		var disclosure_icon = Ti.UI.createImageView({
			image : theme.images.disclosure,
			width : 13,
			height : 13,
			right : 6,
			top : 8,
			hires : true
		});
		title_view.add(disclosure_icon);
		
		var thumbs_view = Ti.UI.createView({
			height : 61,
			width : Ti.UI.FILL,
			layout : 'horizontal',
			thumb_height:54,
			thumb_width:54,
			thumb_space:4,
		});
		row_view.add(thumbs_view);
		
		for (var i = 0; i < 5; i++) {
			var icon = Ti.UI.createImageView({
				top:2,
				image : theme.images.add_activity_empty_box,
				width : thumbs_view.thumb_width,
				height : thumbs_view.thumb_height,
				left : thumbs_view.thumb_space,
				hires : true
			});
			thumbs_view.add(icon);
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
	
	function updateActivityListData(updateId, updateParams, indicator){
		if(!indicator){
			var actIndicator = require('/ui/ActivityIndicator');
			var indicator = new actIndicator();
					
			indicator.showModal('Updating activity list...', 60000, 'Timeout creating activity list!');
		}
		
		ObjectsModel.update(ObjectsModel.classNames.tag_lists, updateId, updateParams, null, null, function(updateEvent) {
			indicator.hideModal();
			if (updateEvent.success) {
				if (updateEvent[ObjectsModel.classNames.tag_lists] && updateEvent[ObjectsModel.classNames.tag_lists].length) {
					for (var i = 0, v = tag_list_rows.length; i < v; i++) {
						if (tag_list_rows[i].list_id === updateEvent[ObjectsModel.classNames.tag_lists][0].id) {
							
							tag_list_rows[i].itemJSON = JSON.stringify(updateEvent[ObjectsModel.classNames.tag_lists][0]);
							
							endUpdate();
							break;
						}
					}
				}
			} else {
				Model.eventDefaultErrorCallback(updateEvent);
			}
		});
	}
	
	function updateActivityList(updateId, updateParams){

		if(updateId && updateParams){
			if(updateParams.name_lower){
				var actIndicator = require('/ui/ActivityIndicator');
				var indicator = new actIndicator();
						
				indicator.showModal('Updating activity list...', 60000, 'Timeout creating activity list!');
				ObjectsModel.query(ObjectsModel.classNames.tag_lists, {
					name_lower : updateParams.name_lower
				}, null, 1, 0, function(queryEvent) {
					if (queryEvent.success) {
						if (queryEvent[ObjectsModel.classNames.tag_lists] && queryEvent[ObjectsModel.classNames.tag_lists].length) {
							indicator.hideModal();
							
							Ti.UI.createAlertDialog({
								message : 'Activity list with that name already exists!',
								buttonNames : [L('ok', 'OK')]
							}).show(); 
						} else {
							updateActivityListData(updateId, updateParams, indicator);
						}
					} else {
						indicator.hideModal();
						Model.eventDefaultErrorCallback(queryEvent);
					}
				});
			}
			else if(updateParams.order_rank !== undefined){
				updateActivityListData(updateId, updateParams);
			}	
		}
	}
	
	function createActivityListRow(_item) {
		if(!_item){
			return null;
		}
							
		var row = Ti.UI.createTableViewRow({
			height : Ti.UI.SIZE,
			width : Ti.UI.FILL,
			filter : _item.name,
			backgroundColor : '#fff',
			selectionStyle : Ti.UI.iPhone.TableViewCellSelectionStyle.NONE,
			//backgroundImage : theme.images.rowBox.normal,
			list_id : _item.id,
			list_name : _item.name,
			updated_at : _item.updated_at,
			total_posts : 0,
			total_activities : 0,
			total_users : 0,
			is_current_list : false,
			enableEdit : false,
			className : 'ActivityList_Row'
		});
		
		if(currentUser && (_is_admin || (_item && _item.user && currentUser.id === _item.user.id))){
			row.enableEdit = true;
		}
		
		if(_item.all_activities){
			row.enableEdit = false;
			row.all_activities_row = true;
		}
		
		row.itemJSON = JSON.stringify(_item);
		
		if(List_tag && List_tag.id === _item.id){
			row.is_current_list = true;
		}
		
		if (_item.total_users){
			row.total_users = _item.total_users;
		}
		if (_item.total_activities){
			row.total_activities = _item.total_activities;
		}
		
		var row_view = Ti.UI.createView({
			height : Ti.UI.SIZE,
			width : Ti.UI.FILL,
			layout : 'vertical'
		});
		row.add(row_view);
		
		var title_view = Ti.UI.createView({
			height : Ti.UI.SIZE,
			width : Ti.UI.FILL
		});
		row_view.add(title_view);
		
		var list_name_txt = Ti.UI.createTextField({
			//top : 5,
			left : 4,
			right : 28,
			paddingLeft : 4,
			textAlign : Ti.UI.TEXT_ALIGNMENT_LEFT,
			value : _item.name,
			original_value : _item.name,
			font : theme.defaultFontBold,
			color : row.enableEdit ? theme.barColor : theme.darkFontColor,
			touchEnabled : true,
			editable : row.enableEdit,
			height:30,
			width : Ti.UI.FILL,
			borderWidth : 0,
			backgroundColor: '#fff',
			appearance: Ti.UI.KEYBOARD_APPEARANCE_ALERT,
			returnKeyType:Ti.UI.RETURNKEY_DONE,
			autocapitalization:Ti.UI.TEXT_AUTOCAPITALIZATION_SENTENCES,
			hintText:'Activity name (3+ chars long)',
			autocorrect:true,
			valueEdited:false,
			list_id : _item.id,
			clickName:'listName'
		});
		if(row.enableEdit){
			list_name_txt.addEventListener('focus', function(e){
				tableView.input_text_updating = true;
			});
			list_name_txt.addEventListener('blur', function(e){
				tableView.input_text_updating = false;
				if(this.valueEdited){
					this.valueEdited = false;
				}
				else{
					this.value = this.original_value;
				}
			});
			list_name_txt.addEventListener('return', function(e){
				tableView.input_text_updating = false;
				if(this.value.length > 2){
					if(this.value !== this.original_value){
						this.valueEdited = true;
						
						this.value = this.value.replace(/(^\s*)|(\s*$)/gi, '');
						updateActivityList(this.list_id, { name : this.value, name_lower : this.value.toLowerCase() });
					}
				}
				else{
					Ti.UI.createAlertDialog({
						message : 'Activity list names should be at least 3 characters long',
						buttonNames : [L('ok', 'OK')]
					}).show(); 
				}
			});
			
			if(_is_admin){
				list_name_txt.right += 36;
				 
				var rank_txt = Ti.UI.createTextField({
					//top : 5,
					right : 28,
					paddingLeft : 4,
					textAlign : Ti.UI.TEXT_ALIGNMENT_CENTER,
					value : _item.order_rank,
					original_value : _item.order_rank,
					font : theme.defaultFontBold,
					color : row.enableEdit ? theme.barColor : theme.darkFontColor,
					touchEnabled : true,
					editable : row.enableEdit,
					height:30,
					width : 30,
					appearance: Ti.UI.KEYBOARD_APPEARANCE_ALERT,
					returnKeyType:Ti.UI.RETURNKEY_DONE,
					keyboardType:Ti.UI.KEYBOARD_NUMBERS_PUNCTUATION,
					borderColor : theme.tableBorderColor,
					borderRadius : theme.defaultBorderRadius,
					borderWidth : 1,
					backgroundColor: '#fff',
					hintText:'1',
					autocapitalization:Ti.UI.TEXT_AUTOCAPITALIZATION_NONE,
					autocorrect:false,
					valueEdited:false,
					list_id : _item.id,
					clickName:'listRank'
				});
				rank_txt.addEventListener('focus', function(e){
					tableView.input_text_updating = true;
				});
				rank_txt.addEventListener('blur', function(e){
					tableView.input_text_updating = false;
					if(this.valueEdited){
						this.valueEdited = false;
					}
					else{
						this.value = this.original_value;
					}
				});
				rank_txt.addEventListener('return', function(e){
					tableView.input_text_updating = false;
					if(this.value.length){
						if(this.value !== this.original_value){
							this.valueEdited = true;
							
							updateActivityList(this.list_id, { order_rank : (this.value * 1 || 1) });
						}
					}
				});
				title_view.add(rank_txt);
			}
		}
		title_view.add(list_name_txt);

		var disclosure_icon = Ti.UI.createImageView({
			image : theme.images.disclosure,
			width : 13,
			height : 13,
			right : 6,
			top : 8,
			hires : true
		});
		title_view.add(disclosure_icon);
		
		var thumbs_view = Ti.UI.createView({
			height : 61,
			width : Ti.UI.FILL,
			layout : 'horizontal',
			total_thumbs : 0,
			thumb_height:54,
			thumb_width:54,
			thumb_space:4,
		});
		row_view.add(thumbs_view);
		
		if(row.total_activities > 0 && _item.activity_pics && _item.activity_pics.length > 0){
			var total_activities = row.total_activities;
			
			for(var i=0,v=_item.activity_pics.length; i<v && i<5; i++){
				
				var icon = Ti.UI.createImageView({
					top:2,
					image : _item.activity_pics[i],
					width : thumbs_view.thumb_width,
					height : thumbs_view.thumb_height,
					left : thumbs_view.thumb_space,
					hires:true
				});
				thumbs_view.add(icon);
				
				thumbs_view.total_thumbs++;
				total_activities--;
			}
			if(total_activities > 0){
				var activities_more = Ti.UI.createLabel({
					left : 1,
					right : 1,
					width : Ti.UI.FILL,
					height : Ti.UI.SIZE,
					text : '+' + total_activities,
					font : {
						fontSize : 14,
						fontFamily : theme.fontFamily
					},
					minimumFontSize : 12,
					color : theme.lightBgColor,
					textAlign : Ti.UI.TEXT_ALIGNMENT_LEFT
				});
				if(total_activities > 99){
					// activities_more.font = {
						// fontSize : 13,
						// fontFamily : theme.fontFamily
					// }; 
				}
				thumbs_view.add(activities_more);
			}
		}
		
		if(thumbs_view.total_thumbs < 5){
			for(var i=thumbs_view.total_thumbs; i<5; i++){
				var icon = Ti.UI.createImageView({
					top:2,
					image : theme.images.add_activity_empty_box,
					width : thumbs_view.thumb_width,
					height : thumbs_view.thumb_height,
					left : thumbs_view.thumb_space,
					hires : true
				});
				thumbs_view.add(icon);
			}
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
	
	function createActivityListRows(_items) {
		var rows = [];
		if(_items && _items.length > 0) {
			for(var i = 0, l = _items.length; i < l; i++) {
				// skip disabled actions
				if(!_items[i].is_active){
					continue;
				}
				var row = createActivityListRow(_items[i]);
				if(row !== null){
					rows.push(row);
				}
			}
		}
		return rows;
	}
	
	queryTagLists(true);
	
	self.addEventListener('focus', function(e){	
		require('/lib/analytics').trackScreen({ screenName : self.title });
	});
	
	return self;
}

module.exports = TagListsWindow;