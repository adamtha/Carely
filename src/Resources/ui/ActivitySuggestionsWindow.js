function ActivitySuggestionsWindow(_params) {
	var _ = require('/lib/underscore'),
		theme = require('/ui/theme'),
		moment = require('/lib/date/moment'), 
		Model = require('/lib/model/model'), 
		ObjectsModel = require('/lib/model/objects'),
		common = require('/lib/common');
		
	var currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null)),
		_is_admin = false;
	if(currentUser && currentUser.admin === 'true' && currentUser.custom_fields && currentUser.custom_fields.show_admin_features !== false){
		_is_admin = true;
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
		text : 'Suggestions',
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
		navBarHidden:false,
		backgroundColor:theme.defaultBgColor,
		orientationModes : [Ti.UI.PORTRAIT],
		barColor : theme.barColor,
		tabBarHidden : true
	});	
	
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
	
	var FollowingNavButton = Ti.UI.createButton({
		backgroundImage:theme.images.add_friends_green,
		height:30,
		width:40,
		readyForClicks:false
	});
	FollowingNavButton.addEventListener('click', function(e){
		handleAddFriends();
	});
	self.rightNavButton = FollowingNavButton;
	
	function handleAddFriends(){
		if(_updating){
			return false;
		}
		
		Ti.App.Properties.setBool('carely_openFriends', true);
		
		var anim = Ti.UI.createAnimation();
		if(_params && _params.parent_win){
			anim.parent_win = _params.parent_win;
			anim.addEventListener('complete', function(e){
				setTimeout(function(){
					anim.parent_win.close();
				}, 200)
			});
		}
		self.close(anim);
	}
		
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
			category : 'suggestion',
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
			category : 'suggestion',
			action : 'click',
			label : (e && e.row && e.row.suggestion_id) ? e.row.suggestion_id : null,
			value : (e && e.row && e.row.action_id) ? e.row.action_id : null
		});
		
		if(e && e.row && e.row.action_id){
			if(e.source && e.source.clickName){
				
				if(!currentUser){
					currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
				}
				
				switch(e.source.clickName){
					case 'add_friends':
						handleAddFriends();
						break;
					case 'suggestion_accept':
						require('/lib/analytics').trackEvent({
							category : 'suggestion',
							action : 'accept',
							label : (e.row.suggestion_id) ? e.row.suggestion_id : null,
							value : e.row.action_id
						});
						
						var my_action_preferences = [], my_deleted_actions_preferences = [], _my_action_suggestions = null;
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
						if (idx === -1) {
							// add action
							if (my_action_preferences.length >= common.max_actions.user) {
								Ti.UI.createAlertDialog({
									title : 'Add action',
									message : 'Users currently limited to ' + common.max_actions.user + ' actions at most!',
									buttonNames : [L('ok', 'OK')]
								}).show();
	
								return;
							}

							var sg_idx = -1;
							for(var i=0, v=activity_rows.length; i<v; i++){
								if(activity_rows[i].suggestion_id === e.row.suggestion_id){
									sg_idx = i;
									break;
								}
							}
							if(sg_idx > -1){
								activity_rows.splice(sg_idx, 1);
								common.showMessageWindow('Added to Favorites', 140, 140, 2000);
								endUpdate();
								
								my_action_preferences.splice(0, 0, e.row.action_id);
								var dix = my_deleted_actions_preferences.indexOf(e.row.action_id);
								if (dix > -1) {
									my_deleted_actions_preferences.splice(dix, 1);
								}
								
								if(e.row.suggested_by_id){
									if(_my_action_suggestions === null){
										_my_action_suggestions = {};
									}
									_my_action_suggestions[e.row.action_id] = e.row.suggested_by_id;
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
												
												PostsModel.queryPages({
													title : {
														'$in' : [PostsModel.postTypes.checkin, PostsModel.postTypes.joins]
													},
													event_id : e.row.action_id,
													upcoming_date_start : {
														$exists : false
													}
												}, null, 1, 1, function(queryEvent) {
													if (queryEvent.success) {
														var post_count_id = e.row.action_id + '_' + PostsModel.postTypes.checkin;
														var total_done = 0;
														if (queryEvent.meta.total_results > 0) {
															total_done = queryEvent.meta.total_results;
														}
														total_done += 1;

														if (!currentUser.custom_fields[post_count_id]) {
															currentUser.custom_fields[post_count_id] = 0;
														}

														var createParams = {
															done : {
																total : total_done,
																me : currentUser.custom_fields[post_count_id]
															}
														};
														if (_my_action_suggestions && _my_action_suggestions[e.row.action_id]) {
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
													} else {
														Model.eventDefaultErrorCallback(queryEvent);
													}
												}); 

											} else {
												Model.eventDefaultErrorCallback(queryPostEvent);
											}
										});
									} else {
										Model.eventDefaultErrorCallback(updateEvent);
									}
								});
								
								if(e.row.suggestion_id){
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
						}
						break;
					case 'suggestion_reject':
						if(e.row.suggestion_id){
							
							require('/lib/analytics').trackEvent({
								category : 'suggestion',
								action : 'reject',
								label : e.row.suggestion_id,
								value : e.row.action_id
							});
							
							var sg_idx = -1;
							for(var i=0, v=activity_rows.length; i<v; i++){
								if(activity_rows[i].suggestion_id === e.row.suggestion_id){
									sg_idx = i;
									break;
								}
							}
							if(sg_idx > -1){
								activity_rows.splice(sg_idx, 1);
								common.showMessageWindow('Suggested Action removed', 140, 140, 2000);
								endUpdate();
								
								if(currentUser && currentUser.id){
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
		if(_item && _item['[ACS_Event]action_id'] && _item['[ACS_User]from_id']){
			var suggested_action_item = _item['[ACS_Event]action_id'][0],
				suggested_by_item = _item['[ACS_User]from_id'][0];
			
			if(suggested_action_item.custom_fields){
				if(suggested_action_item.custom_fields.disabled || suggested_action_item.custom_fields.importance < 1){
					return null;
				}
			}
			
			var row = Ti.UI.createTableViewRow({
				height : defaultRowHeight,
				width : Ti.UI.FILL,
				filter : suggested_action_item.name,
				//backgroundImage : theme.images.rowBox.normal,
				backgroundColor : '#fff',
				selectionStyle : Ti.UI.iPhone.TableViewCellSelectionStyle.NONE,
				suggestion_id : _item.id,
				suggested_by_id : suggested_by_item.id,
				action_id : suggested_action_item.id,
				action_name : suggested_action_item.name,
				updated_at : _item.updated_at,
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
				width : 130,
				zIndex:10,
				layout:'horizontal'
			});
			row_view.add(action_favorites_view);
			
			var accept_icon = Ti.UI.createButton({
				top : 5,
				left : 0,
				width : 60,
				height : 30,
				title : 'Accept',
				backgroundImage : theme.buttonImage.green.normal,
				backgroundSelectedImage : theme.buttonImage.green.selected,
				font : theme.defaultToolTipFont,
				style : Ti.UI.iPhone.SystemButtonStyle.PLAIN,
				touchEnabled : true,
				clickName : 'suggestion_accept'
			});
			action_favorites_view.add(accept_icon);
			
			var reject_icon = Ti.UI.createButton({
				top : 5,
				left : 10,
				width : 60,
				height : 30,
				title : 'Reject',
				backgroundImage : theme.buttonImage.red.normal,
				backgroundSelectedImage : theme.buttonImage.red.selected,
				font : theme.defaultToolTipFont,
				style : Ti.UI.iPhone.SystemButtonStyle.PLAIN,
				touchEnabled : true,
				clickName : 'suggestion_reject'
			});
			action_favorites_view.add(reject_icon);
					
			var action_expires = null;
			if (suggested_action_item.user && suggested_action_item.custom_fields && suggested_action_item.custom_fields.expiration_date && suggested_action_item.custom_fields.expiration_date.value) {
				var days_diff = moment().diff(moment(suggested_action_item.custom_fields.expiration_date.value), 'days');
				if(days_diff > 1){
					if(!currentUser || suggested_action_item.user.id !== currentUser.id){
						return null;
					}
					action_expires = 'Expired ' + moment(suggested_action_item.custom_fields.expiration_date.value).fromNow();
				}
				else if(days_diff > 0){
					action_expires = 'Expires Today';
				}
				else if(days_diff > -3){
					action_expires = 'Expires ' + moment(suggested_action_item.custom_fields.expiration_date.value).fromNow();
					row.backgroundImage = theme.images.rowBox.red;
				}
			}
			
			var actionIcon = theme.defaultIcons.action;
			if (suggested_action_item.photo && suggested_action_item.photo.urls && suggested_action_item.photo.urls.square_75) {
				actionIcon = suggested_action_item.photo.urls.square_75;
			} else if (suggested_action_item.icon) {
				actionIcon = suggested_action_item.icon;
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
				text : suggested_action_item.name,
				font : theme.defaultFontBold,
				color : theme.darkFontColor,
				textAlign : Ti.UI.TEXT_ALIGNMENT_LEFT
			});
			action_name_view.add(actionName);
			
			var _checkins = 0, _upcomings = 0, _discussions = 0, _wants = 0;
			if (suggested_action_item.custom_fields){
				if (suggested_action_item.custom_fields.total_do) {
					_checkins = suggested_action_item.custom_fields.total_do;
				}
				if (suggested_action_item.custom_fields.total_plan) {
					_upcomings = suggested_action_item.custom_fields.total_plan;
				}
				if (suggested_action_item.custom_fields.total_talk) {
					_discussions = suggested_action_item.custom_fields.total_talk;
				}
				if (suggested_action_item.custom_fields.total_want) {
					_wants = suggested_action_item.custom_fields.total_want;
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
			
			if(suggested_action_item.custom_fields && suggested_action_item.custom_fields.action_url && suggested_action_item.custom_fields.action_url.length){
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
			if(suggested_by_item && suggested_by_item.username){
				var _s = require('/lib/underscore_strings');
				
				byName = 'By ' + _s.titleize(suggested_by_item.username);
				if (suggested_by_item.custom_fields && suggested_by_item.custom_fields.display_name) {
					byName = 'By ' + suggested_by_item.custom_fields.display_name;
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
		else{
			return null;
		}
	}
	
	function createActionRows(_items) {
		var rows = [], deleted_actions = [];
		if(_items && _items.length > 0) {
			for(var i = 0, l = _items.length; i < l; i++) {	
				var row = createActionRow(_items[i]);
				if(row !== null){
					rows.push(row);
				}
			}
		}
		return rows;
	}
	
	function getEmptyListRow(){
		var emptyListRow = Ti.UI.createTableViewRow({
			action_id : 'empty_row',
			height : Ti.UI.SIZE,
			width : Ti.UI.FILL,
			selectionStyle : Ti.UI.iPhone.TableViewCellSelectionStyle.NONE,
			className : 'Empty_List_Row'
		});
		var emptyListImage = Ti.UI.createImageView({
			image : theme.images.empty_list_suggestions,
			height : Ti.UI.FILL,
			touchEnabled : true,
			clickName : 'add_friends',
			hires : true
		});
		emptyListRow.add(emptyListImage); 
		
		return emptyListRow;
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
		
		if(activity_rows.length > 0){
			tableView.setData(activity_rows);
		}
		else{
			header_view.height = 0;
			tableView.setData([getEmptyListRow()]);
		}
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
		
		currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
		if(currentUser && currentUser.id){
			var _where = {};
			_where[currentUser.id] = { '$in' : [0,1]};
			
			footer_view.height = Ti.UI.SIZE;
			ObjectsModel.queryPages(ObjectsModel.classNames.suggestions, _where, '-created_at', _page, 10, function(e) {
				
				footer_view.height = 0;
				
				if (e.success) {
					
					if (e.meta.total_results > 0) {
						if (e.meta.page < e.meta.total_pages) {
							_page += 1;
						}
						else{
							_more = false;
						}
						
						var action_rows = createActionRows(e[ObjectsModel.classNames.suggestions]);
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
			_more = false;
			endUpdate();
			_updating = false;
		}
	}
	
	refreshActions(true);
	
	self.addEventListener('focus', function(e) {
		require('/lib/analytics').trackScreen({ screenName : self.title });
	});
	
	self.addEventListener('close', function(e) {
		if(!currentUser){
			currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
		}
		if (activity_rows && currentUser && currentUser.custom_fields && currentUser.custom_fields.total_suggestions !== activity_rows.length) {
			// update user
			currentUser.custom_fields.total_suggestions = activity_rows.length;
			Ti.App.Properties.setString('carely_user', JSON.stringify(currentUser));
			
			var UsersModel = require('/lib/model/users');
			UsersModel.update({
				custom_fields : {
					total_suggestions : activity_rows.length
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
	});

	return self;
}

module.exports = ActivitySuggestionsWindow;