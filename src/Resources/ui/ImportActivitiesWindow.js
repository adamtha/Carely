function ImportActivitiesWindow(_params) {
	var _ = require('/lib/underscore'),
		theme = require('/ui/theme'),
		moment = require('/lib/date/moment'), 
		Model = require('/lib/model/model'), 
		ActionsModel = require('/lib/model/actions'),
		common = require('/lib/common');
		
	var currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null)),
		_is_admin = false;
	if(currentUser && currentUser.admin === 'true' && currentUser.custom_fields && currentUser.custom_fields.show_admin_features !== false){
		_is_admin = true;
	}
	
	var List_tag = JSON.parse(Ti.App.Properties.getString('List_tag', null));
	
	var self = Ti.UI.createWindow({
		title: (_params && _params.title) ? _params.title : 'Activities',
		navBarHidden:false,
		backgroundColor:theme.defaultBgColor,
		orientationModes : [Ti.UI.PORTRAIT],
		barColor : theme.barColor,
		tabBarHidden : true
	});	
	
	var defaultRowHeight = theme.borderedImage.big.height + 12;
	
	var last_search = null, auto_complete_timer = null;
	var search = Ti.UI.createSearchBar({
		barColor : theme.subBarColor,
		hintText : 'Filter activities',
		autocapitalization : Ti.UI.TEXT_AUTOCAPITALIZATION_SENTENCES
	});
	search.addEventListener('blur', function(e){
		search.showCancel = false;
	});
	search.addEventListener('change', function(e) {
		if(auto_complete_timer){
			clearTimeout(auto_complete_timer);
		}

		if(e.value){
			if(!e.value.length){
				_searching = false;
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
	});
	search.addEventListener('return', function(e) {
		if(auto_complete_timer){
			clearTimeout(auto_complete_timer);
		}
		this.blur();

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
		_searching = false;
		search.blur();
		endUpdate();
	});
		
	function searchAction(_search_term){
		if(_search_term && _search_term.length > 2){
			var LowerCaseTerm = _search_term.toLowerCase(),
				CapitalizedTerm = _search_term.charAt(0).toUpperCase() + _search_term.substr(1);
			_searching = true;
			var search_section = createActionSection({title:'Results for \'' + _search_term + '\''})
			
			var rows = [];
			if(activity_rows && activity_rows.length){
				for(var i=0, v=activity_rows.length; i<v; i++){
					if(activity_rows[i].filter && activity_rows[i].filter.length && 
					   activity_rows[i].filter.toLowerCase().indexOf(LowerCaseTerm) > -1){
						rows.push(activity_rows[i]);
					}
				}
			}
			
			require('/lib/analytics').trackEvent({
				category : 'search',
				action : 'filter',
				label : _search_term,
				value : rows.length
			});
				
			if (rows && rows.length) {
				rows = _.uniq(rows, false, function(n) {
					return n.action_id;
				});
				search_section.rows = rows;
				search_section.headerView.children[2].text = '' + search_section.rowCount;
			} else {
				search_section.rows = [];
				search_section.headerView.children[1].text = 'No results for \'' + _search_term + '\'';
				search_section.headerView.children[2].text = '';
			}
			tableView.setData([search_section]);
			rows = null;
			search.value = search.value;
		}
	}
	
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
		
		if(e && e.row && e.row.action_id){
			if(e.source && e.source.clickName){
				switch(e.source.clickName){
					case 'list_actions':
						if(e.source.enabled){
							if(!currentUser){
								currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
							}
							if(!List_tag){
								List_tag = JSON.parse(Ti.App.Properties.getString('List_tag', null));
							}
							if(List_tag && List_tag.id){
								e.source.in_list = !e.source.in_list;
							
								var ui_val_num = e.source.in_list ? 1 : 0;
								e.source.title = e.source.ui_values.title[ui_val_num];
								e.source.backgroundImage = e.source.ui_values.backgroundImage[ui_val_num];
								e.source.backgroundSelectedImage = e.source.ui_values.backgroundSelectedImage[ui_val_num];
								
								var update_list_JSON = {
									event_id : e.row.action_id,
									custom_fields : {}
								};
								if(e.source.in_list){
									// added to list
									update_list_JSON.custom_fields['list_tag_' + List_tag.id] = currentUser.id;
									common.showMessageWindow('Added to List', 140, 140, 2000);
								}
								else{
									// removed from list
									update_list_JSON.custom_fields['list_tag_' + List_tag.id] = null;
									common.showMessageWindow('Removed from List', 140, 180, 2000);
								}
								
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
												
												if(e.source.in_list){
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
						break;
					default:
						break;
				}
			}			
		}
	});
	self.add(tableView);
	
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
			className : 'Action_Row'
		});
		
		var row_view = Ti.UI.createView({
			height : Ti.UI.FILL,
			width : Ti.UI.FILL
		});
		row.add(row_view);
		
		if(!currentUser){
			currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
		}
		if(!List_tag){
			List_tag = JSON.parse(Ti.App.Properties.getString('List_tag', null));
		}
		if(List_tag && List_tag.id && !List_tag.all_activities){
			var favorites_icon = Ti.UI.createButton({
				top : 25,
				right : 24,
				width : 60,
				height : 30,
				title: 'Add',
				backgroundImage:theme.buttonImage.green.normal,
				backgroundSelectedImage:theme.buttonImage.green.selected,
				font:theme.defaultToolTipFont,
				style : Ti.UI.iPhone.SystemButtonStyle.PLAIN,
				enabled : true,
				touchEnabled : true,
				in_list:false,
				ui_values:{
					title:['Add','Remove'],
					backgroundImage:[theme.buttonImage.green.normal,theme.buttonImage.red.normal],
					backgroundSelectedImage:[theme.buttonImage.green.selected,theme.buttonImage.red.selected]
				},
				clickName : 'list_actions'
			});
			row_view.add(favorites_icon);
			
			if(_item.custom_fields && _item.custom_fields['list_tag_' + List_tag.id]){
				favorites_icon.in_list = true;
				favorites_icon.title = 'Remove';
				favorites_icon.backgroundImage = theme.buttonImage.red.normal;
				favorites_icon.backgroundSelectedImage = theme.buttonImage.red.selected;
				
				var _is_owner = false, _added_by_me = false;
				if(_item && _item.user && currentUser && _item.user.id === currentUser.id){
					_is_owner = true;
				}
				if(currentUser && currentUser.id === _item.custom_fields['list_tag_' + List_tag.id]){
					_added_by_me = true;
				}
				if(_is_admin || _is_owner || _added_by_me){
					favorites_icon.enabled = true;
					favorites_icon.touchEnabled = true;
				}
				else{
					favorites_icon.enabled = false;
					favorites_icon.touchEnabled = false;
				}
			}
		}
				
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
					continue;
				}
				
				if(!_is_admin && _items[i].custom_fields && _items[i].custom_fields.importance < 1){
					continue;
				}
					
				var row = createActionRow(_items[i]);
				if(row !== null){
					rows.push(row);
				}
			}
		}
		return rows;
	}
	
	
	function endUpdate() {
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
		
		_updating = true;
		_more = true;
		
		if(_force){
			_page = 1;
			activity_rows = [];
		}
		
		queryActivities();
	}
	
	function queryActivities(){
		_updating = true;

		var _where = {
			disabled : false
		};
		
		if(!_is_admin){
			_where.importance = { '$gt' : 0 };
		}
		
		if(_params && _params.list_id){
			if(_params.list_id !== 'ALL'){
				_where['list_tag_' + _params.list_id] = {$exists : true};
			}
			
			footer_view.height = Ti.UI.SIZE;
		
			ActionsModel.queryPages(_where, '-importance', _page, 10, function(e) {
				
				footer_view.height = 0;
				
				if (e.success) {
					
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
		else{
			endUpdate();
			_updating = false;
		}
	}
	
	refreshActions(true);
	
	self.addEventListener('focus', function(e) {
		require('/lib/analytics').trackScreen({ screenName : self.title });
	});
	
	return self;
}

module.exports = ImportActivitiesWindow;