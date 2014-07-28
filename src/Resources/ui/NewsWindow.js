
function NewsWindow() {
	var _ = require('/lib/underscore'),
		_s = require('/lib/underscore_strings'), 
		theme = require('/ui/theme'), 
		ui = require('/ui/components'),
		moment = require('/lib/date/moment'),
		ActionItemBox = require('/ui/ActionItemBox'),
		Model = require('/lib/model/model'),
		common = require('/lib/common');
	
	var currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null)),
		defaultRows = getInitialDefaultRows('news_initial_default_rows'),
		List_tag = JSON.parse(Ti.App.Properties.getString('List_tag', null));
	
	if(!List_tag){
		List_tag = { name: Ti.App.name, id: null };
	}
	var tag_list_view = Ti.UI.createView({
		top:0,
		height:Ti.UI.FILL,
		width:200
	});
	tag_list_view.addEventListener('touchstart', function(e){
		if(!tag_list_icon.is_showing){
			tag_list_view.add(tag_list_icon);
			tag_list_icon.is_showing = true;
		}
	});
	tag_list_view.addEventListener('touchend', function(e){
		if(tag_list_icon.is_showing){
			setTimeout(function() {
				if(tag_list_icon.is_showing){
					tag_list_view.remove(tag_list_icon);
					tag_list_icon.is_showing = false;
				}
			}, 150);
		}
	});
	tag_list_view.addEventListener('click', function(e){
		openListTagWindow();
	});
	
	function openListTagWindow(_setupMode){
		if(updating){
			return false;
		}
			
		var TagListsWindow = require('/ui/TagListsWindow');
		var win_params = null;
		if(_setupMode){
			win_params = { setupMode:true };
		}
		var tagListsWindow = new TagListsWindow(win_params);
		tagListsWindow.open({modal:true,transition:Ti.UI.iPhone.AnimationStyle.CURL_UP});
	}
	
	var tag_list_lbl = Ti.UI.createLabel({
		//top:,
		//left:0,
		text : List_tag.name,
		font : {
			fontSize : 18,
			fontFamily : theme.fontFamily,
			fontWeight : 'bold'
		},
		color : theme.defaultBgColor,
		textAlign : Ti.UI.TEXT_ALIGNMENT_CENTER
	});
	tag_list_view.add(tag_list_lbl);
	
	var tag_list_icon = Ti.UI.createImageView({
		image : theme.images.splash,
		width : 32,
		height : 32,
		left : 84,
		top : 6,
		hires:true
	});
	
	var self = Ti.UI.createWindow({
		//title:'News',
		navBarHidden : false,
		barColor:theme.barColor,
		backgroundColor:theme.tableBackgroundColor,
		orientationModes : [Ti.UI.PORTRAIT],
		titleControl:tag_list_view,
		left:0,
		zIndex:10,
		opacity:0.0
	});
	
	var FollowingNavButton = Ti.UI.createButton({
		backgroundImage:theme.images.add_friends_green,
		height:30,
		width:40,
		readyForClicks:false
	});
	FollowingNavButton.addEventListener('click', function(e){
		if(updating){
			return false;
		}
		
		if(!FollowingNavButton.readyForClicks){
			return false;
		}
		
		var FindFriendsWindow = require('/ui/FindFriendsWindow');
		var findFriendsWindow = new FindFriendsWindow();
		require('/ui/MasterWindow').getNavGroup().open(findFriendsWindow);
		
		FollowingNavButton.readyForClicks = false;
	});
	
	function getInitialDefaultRows(_key){
		var rows = Model.AppCache.get(_key);
		if(rows === null){
			rows = [];
		}
		return rows;
	}
	
	function createNewsRows(_items) {
		var rows = [];
		if (_items && _items !== null && _items.length > 0) {
			for (var i = 0, v = _items.length; i < v; i++) {
				if(!_items[i].event){
					continue;
				}
				
				var row = new ActionItemBox(_items[i]);
				if (row !== null) {
					rows.push(row);
				}
			}
		}
		return rows;
	}
	
	var footer_view = Ti.UI.createView({
		height : 0,
		width:Ti.UI.FILL,
		layout:'vertical'
	});
	var change_filter_lbl = Ti.UI.createLabel({
		text : 'Change list to see other posts',
		height : 0,
		width : Ti.UI.FILL,
		textAlign : Ti.UI.TEXT_ALIGNMENT_CENTER,
		font : theme.defaultFontBold,
		color : theme.darkBlueLink
	});
	change_filter_lbl.addEventListener('click', function(e){
		
		news_table.top = 0;
		news_table.scrollToTop(0, {animated:false});
		
		openListTagWindow();
			
		require('/lib/analytics').trackEvent({
			category : 'change filter',
			action : 'click',
			label : List_tag ? List_tag.name : null,
			value : !more ? 1 : 0
		});
	});
	footer_view.add(change_filter_lbl);
	
	var footer_view_indicator = Ti.UI.createActivityIndicator({
		//left : 10,
		top : 5,
		height : Ti.UI.SIZE,
		width : Ti.UI.FILL,
		//message : '',
		font : theme.defaultToolTipFont,
		style : Ti.UI.iPhone.ActivityIndicatorStyle.DARK
	});
	footer_view_indicator.show();
	footer_view.add(footer_view_indicator);
	
	var news_table = Ti.UI.createTableView({
		top : 0,
		backgroundColor : theme.tableBackgroundColor,
		height : 'auto',
		separatorStyle : Ti.UI.iPhone.TableViewSeparatorStyle.NONE,
		//headerView : header_view,
		footerView : footer_view,
		scrollsToTop : true,
		readyForClicks : true,
		bubbleParent:false
	});
	
	news_table.addEventListener('dragStart', function(e) {
		if (self.LeftMenuVisible && self.LeftMenuVisible === true) {
			self.LeftMenuHide();
		}
	});

	news_table.addEventListener('singletap', function(e) {
		if(e){
			e.cancelBubble = true;
		}
		else{
			return false;
		}
		
		if(!e.row){
			return false;
		}
		
		if (self.LeftMenuVisible && self.LeftMenuVisible === true) {
			self.LeftMenuHide();
			return false;
		}

		if (news_table.readyForClicks === false) {
			return false;
		}
		
		if (e && e.source) {
			currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
			var focusComment = false;
			
			var analitics_action = e.source.clickName;
			if(e.source.clickName === 'like' && e.row.user_like_id){
				analitics_action = 'unlike';
			}
			
			require('/lib/analytics').trackEvent({
				category : 'news',
				action : analitics_action,
				label : e.row.post_id,
				value : null
			});
			
			switch(e.source.clickName) {
				case 'add_friends':
					var FindFriendsWindow = require('/ui/FindFriendsWindow');
					var findFriendsWindow = new FindFriendsWindow();
					require('/ui/MasterWindow').getNavGroup().open(findFriendsWindow);
					news_table.readyForClicks = false;
					break;
				case 'user':
					var UserWindow = require('/ui/UserWindow');
					var userWindow = new UserWindow(e.source.user_id ? e.source.user_id : e.row.user_id);
					require('/ui/MasterWindow').getNavGroup().open(userWindow);
					news_table.readyForClicks = false;
					break;
				case 'action_url':
					if(e.source.url_to_open){
						var urlWebView = require('/lib/urlWebView');
						var urlWin = new urlWebView(e.source.url_to_open, e.row.action_name, null, false);
						require('/ui/MasterWindow').getNavGroup().open(urlWin);
						news_table.readyForClicks = false;
						
						require('/lib/analytics').trackEvent({
							category : 'url',
							action : 'click',
							label : e.source.url_to_open,
							value : null
						});
					}
					break;
				case 'like':
					if (e.row.user_like_id) {
						// unlike
						e.row.AddLikes(-1);
						
						var ReviewsModel = require('/lib/model/reviews');
						ReviewsModel.Remove(e.row.actionClassName, e.row.post_id, e.row.user_like_id, function(reviewEvent) {
							if (reviewEvent.success) {

								var like_val = e.row.user_like_id;
								e.row.user_like_id = undefined;

								currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
								var _total_likes = [];
								if (currentUser.custom_fields.total_likes) {
									_total_likes = _total_likes.concat(currentUser.custom_fields.total_likes);
								}
								var like_idx = _total_likes.indexOf(e.row.post_id + '_' + like_val);
								if (_total_likes.length > 0 && like_idx !== -1) {
									_total_likes.splice(like_idx, 1);

									Ti.App.Properties.setString('carely_user', JSON.stringify(currentUser));

									var PostsModel = require('/lib/model/posts');
									PostsModel.show(e.row.post_id, function(showEvent) {
										if (showEvent.success) {
											Model.AppCache.posts.set(showEvent.posts[0]);

											common.refreshHandler.setRefresh.news(true);
											common.refreshHandler.setRefresh.leaderboard(true);

											var summ = ReviewsModel.ReviewSummary(showEvent.posts[0]);
											e.row.SetConversationValue(summ);
										} else {
											Model.eventDefaultErrorCallback(showEvent);
										}
									});

									var UsersModel = require('/lib/model/users');
									UsersModel.update({
										custom_fields : {
											total_likes : _total_likes
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
							} else {
								e.row.AddLikes(1);
								Model.eventDefaultErrorCallback(reviewEvent);
							}
						});
					} else {
						// like
						e.row.AddLikes(1);
						
						var ReviewsModel = require('/lib/model/reviews');
						ReviewsModel.Like(e.row.actionClassName, e.row.post_id, function(reviewEvent) {
							if (reviewEvent.success) {
								e.row.user_like_id = reviewEvent.reviews[0].id;

								currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
								var _total_likes = [];
								if (currentUser.custom_fields.total_likes) {
									_total_likes = _total_likes.concat(currentUser.custom_fields.total_likes);
								}
								_total_likes.push(e.row.post_id + '_' + reviewEvent.reviews[0].id);
								Ti.App.Properties.setString('carely_user', JSON.stringify(currentUser));

								var PostsModel = require('/lib/model/posts');
								PostsModel.show(e.row.post_id, function(showEvent) {
									if (showEvent.success) {
										Model.AppCache.posts.set(showEvent.posts[0]);

										common.refreshHandler.setRefresh.news(true);
										common.refreshHandler.setRefresh.leaderboard(true);

										var summ = ReviewsModel.ReviewSummary(showEvent.posts[0]);
										e.row.SetConversationValue(summ);
									} else {
										Model.eventDefaultErrorCallback(showEvent);
									}
								});

								var UsersModel = require('/lib/model/users');
								UsersModel.update({
									custom_fields : {
										total_likes : _total_likes
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

								if (currentUser && currentUser.id && currentUser.id !== e.row.user_id && currentUser.username) {
									var funame = common.getUserDisplayName(currentUser);
									
									Ti.App.fireEvent('push.notify', {
										tags : [e.row.user_id + '_like'],
										alert : funame + ' likes your post!',
										custom_fields : {
											post_id : e.row.post_id,
											to_user_id : e.row.user_id,
											actionClassName : e.row.actionClassName,
											type : 'like'
										}
									});
								}
							} else {
								e.row.AddLikes(-1);
								e.row.user_like_id = undefined;
								Model.eventDefaultErrorCallback(reviewEvent);
							}
						});
					}
					break;
				case 'post_options':
						var action_options = {
							options : [],
							cancel : 0
						};
						if(e.row.action_id){
							action_options.options.push('Do it');
							//action_options.options.push('Plan it');
							action_options.options.push('Want it');
							action_options.options.push('Talk about it');
						}
						if(e.row.can_join){
							if(e.row.user_join_id){
								if(e.row.user_display_name){
									action_options.options.push('Unjoin ' + e.row.user_display_name);
								}
								else{
									action_options.options.push('Unjoin');
								}
							}
							else{
								if(e.row.user_display_name){
									action_options.options.push('Join ' + e.row.user_display_name);
								}
								else{
									action_options.options.push('Join');
								}
							}
						}
						if(e.row.action_id){
							if (currentUser && currentUser.custom_fields && currentUser.custom_fields.my_actions){
								if(currentUser.custom_fields.my_actions.indexOf(e.row.action_id) > -1){
									action_options.options.push('Remove from Favorites');
								}
								else if(currentUser.custom_fields.my_actions.length < common.max_actions.user){
									action_options.options.push('Add to Favorites');
								}
							}
							action_options.options.push('Suggest to followers');
						}
						if(e.row.post_id && currentUser && currentUser.admin === 'true' && 
						   currentUser.custom_fields && currentUser.custom_fields.show_admin_features !== false){
							action_options.options.push('Delete');
						}
						
						if(!action_options.options.length){
							break;
						}
						action_options.options.push('Cancel');
						action_options.cancel = action_options.options.length - 1;
						
						var action_dlg = Ti.UI.createOptionDialog(action_options);
						action_dlg.isClicked = false;
						action_dlg.addEventListener('click', function(dialogEvent){
							if(action_dlg.isClicked){
								return false;
							}
							action_dlg.isClicked = true;
							
							if(dialogEvent.index !== dialogEvent.cancel){
								var addToMyActions = -1, checkin_type = null;
								var option_text = action_options.options[dialogEvent.index];
								if(option_text.indexOf('Join') === 0){
									option_text = 'Join';
								}
								else if(option_text.indexOf('Unjoin') === 0){
									option_text = 'Unjoin';
								}
								
								require('/lib/analytics').trackEvent({
									category : 'news',
									action : option_text,
									label : e.row.post_id,
									value : null
								});
								
								switch(option_text){
									case 'Delete':
										if(!e.row.post_id){
											return false;
										}
										
										var del_dlg = Ti.UI.createAlertDialog({
											message:'Are you sure that you want to delete this post?',
											buttonNames:['Delete', 'Cancel'],
											cancel:1
										});
										del_dlg.addEventListener('click', function(alertEvent){
											if(alertEvent.index === 0){
												var PostsModel = require('/lib/model/posts');
												PostsModel.remove(e.row.post_id, false, function(deleteEvent) {
													if (deleteEvent.success) {
														news_table.deleteRow(e.row, {animated:false});
														
														Model.AppCache.posts.del(e.row.post_id);
													}
													else{
														Model.eventDefaultErrorCallback(deleteEvent);
													}
												});
											}
										});
										del_dlg.show();
										break;
									case 'Do it':
										checkin_type = 0;
									case 'Plan it':
										if(checkin_type === null){
											checkin_type = 2;
										}
									case 'Want it':
										if(checkin_type === null){
											checkin_type = 2;
										}
									case 'Talk about it':
										if(checkin_type === null){
											checkin_type = 3;
										}
										
										if(!e.row.action_id){
											return false;
										}
										var _action_item = Model.AppCache.actions.get(e.row.action_id);
										if(_action_item){
											var CheckinWindow = require('/ui/CheckinWindow');
											var win = new CheckinWindow(e.row.action_id, null, e.row.suggester_id, checkin_type);
											require('/ui/MasterWindow').getNavGroup().open(win);
										}
										else{
											var ActionsModel = require('/lib/model/actions');
											ActionsModel.show(e.row.action_id, function(showEvent){
												if(showEvent.success){
													Model.AppCache.actions.set(showEvent.events[0]);
													
													var CheckinWindow = require('/ui/CheckinWindow');
													var win = new CheckinWindow(e.row.action_id, null, e.row.suggester_id, checkin_type);
													require('/ui/MasterWindow').getNavGroup().open(win);
												}
												else{
													Model.eventDefaultErrorCallback(showEvent);
												}
											});
										}
										break;
									case 'Add to Favorites':
										addToMyActions = 0;
									case 'Remove from Favorites':
										if(addToMyActions < 0){
											addToMyActions = 1;
										}
										
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
										if (addToMyActions === 0) {
											if (idx === -1) {
												my_action_preferences.splice(0, 0, e.row.action_id);
												var dix = my_deleted_actions_preferences.indexOf(e.row.action_id);
												if (dix > -1) {
													my_deleted_actions_preferences.splice(dix, 1);
												}
												addedAction = 0;
												
												if(e.row.suggester_id){
													if(_my_action_suggestions === null){
														_my_action_suggestions = {};
													}
													_my_action_suggestions[e.row.action_id] = e.row.suggester_id;
												}
												
												currentUser.custom_fields.my_actions = my_action_preferences;
												currentUser.custom_fields.my_deleted_actions = my_deleted_actions_preferences;
												currentUser.custom_fields.my_action_suggestions = _my_action_suggestions;
												
												Ti.App.Properties.setString('carely_user', JSON.stringify(currentUser));
								
												common.refreshHandler.setRefresh.actions(true);
								
												common.showMessageWindow('Added to Favorites', 140, 140, 4000);
											}
										} else {
											if (idx !== -1) {
												my_action_preferences.splice(idx, 1);
												if (my_deleted_actions_preferences.indexOf(e.row.action_id) === -1) {
													my_deleted_actions_preferences.splice(0, 0, e.row.action_id);
												}
												addedAction = 1;
												
												if(_my_action_suggestions && _my_action_suggestions[e.row.action_id]){
													_my_action_suggestions[e.row.action_id] = undefined;
												}
												
												currentUser.custom_fields.my_actions = my_action_preferences;
												currentUser.custom_fields.my_deleted_actions = my_deleted_actions_preferences;
												currentUser.custom_fields.my_action_suggestions = _my_action_suggestions;
												
												Ti.App.Properties.setString('carely_user', JSON.stringify(currentUser));
								
												common.refreshHandler.setRefresh.actions(true);
								
												common.showMessageWindow('Removed from Favorites', 140, 180, 4000);
											}
										}
										
										var user_update_params = {
											my_actions : my_action_preferences,
											my_deleted_actions : my_deleted_actions_preferences,
											my_action_suggestions : _my_action_suggestions
										};
										var UsersModel = require('/lib/model/users');
										UsersModel.update({
											custom_fields : user_update_params
										}, function(updateEvent) {
											if (updateEvent.success) {
												currentUser = updateEvent.users[0];
												Ti.App.Properties.setString('carely_user', JSON.stringify(currentUser));
						
												Model.AppCache.users.set(currentUser);
												
												if(addToMyActions > -1){
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
																		
																		if (addToMyActions === 1) {
																			refreshNews(true);
																		}
																	} else {
																		Model.eventDefaultErrorCallback(removeEvent);
																	}
																});
															}
						
															if (addToMyActions === 0) {
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
																	if(e.row.suggester_id){
																		createParams['[ACS_User]suggester_id'] = e.row.suggester_id;
																	}
																	
																	PostsModel.create(e.row.action_id, e.row.action_name, null, PostsModel.postTypes.actions_add, createParams, function(postEvent) {
																		if (postEvent.success) {
																			Model.AppCache.posts.set(postEvent.posts[0]);
																			refreshNews(true);
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
												}
											} else {
												Model.eventDefaultErrorCallback(updateEvent);
											}
										});
										break;
									case 'Suggest to followers':
										var SuggestActionWindow = require('/ui/SuggestActionWindow');
										var suggestActionWindow = new SuggestActionWindow(e.row.action_id, e.row.action_name);
										require('/ui/MasterWindow').getNavGroup().open(suggestActionWindow);
										break;
									case 'Join':
										e.row.AddJoins(1);

										var ReviewsModel = require('/lib/model/reviews');
										var join_value = 2;
										
										var actIndicator = require('/ui/ActivityIndicator');
										var indicator = new actIndicator();
										
										indicator.showModal('Joining activity...', 60000, 'Timeout joining activity!');
										ReviewsModel.Join(e.row.actionClassName, e.row.post_id, join_value, function(reviewEvent) {
											if (reviewEvent.success) {
												e.row.user_join_id = reviewEvent.reviews[0].id;
		
												currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
												var _total_joins = [];
												if (currentUser.custom_fields.total_joins) {
													_total_joins = _total_joins.concat(currentUser.custom_fields.total_joins);
												}
												_total_joins.push(e.row.post_id + '_' + reviewEvent.reviews[0].id);
												Ti.App.Properties.setString('carely_user', JSON.stringify(currentUser));
		
												var PostsModel = require('/lib/model/posts');
												PostsModel.show(e.row.post_id, function(showEvent) {
													if (showEvent.success) {
														Model.AppCache.posts.set(showEvent.posts[0]);
		
														common.refreshHandler.setRefresh.news(true);
														common.refreshHandler.setRefresh.leaderboard(true);
		
														var summ = ReviewsModel.ReviewSummary(showEvent.posts[0]);
														e.row.SetConversationValue(summ);
													} else {
														Model.eventDefaultErrorCallback(showEvent);
													}
												});
		
												if(e.row.action_id && e.row.action_name){
													var queryParams = {
														title:{'$in' : [PostsModel.postTypes.checkin, PostsModel.postTypes.joins]},
														event_id:e.row.action_id,
														upcoming_date_start : {$exists : false}
													}
													PostsModel.queryPages(queryParams, null, 1, 1, function(queryEvent) {
														if (queryEvent.success) {
															var post_count_id = e.row.action_id + '_' + PostsModel.postTypes.checkin;
															var total_done = 0;
															if (queryEvent.meta.total_results > 0) {
																total_done = queryEvent.meta.total_results;
															}
															total_done += 1;
															
															if(!currentUser.custom_fields[post_count_id]){
																currentUser.custom_fields[post_count_id] = 0;
															}
															currentUser.custom_fields[post_count_id] += 1;
															
															var createParams = {
																original_post_id : e.row.post_id,
																original_classname : e.row.actionClassName,
																original_poster_id : e.row.user_id,
																original_poster : e.row.user_name,
																intent:e.row.post_intent,
																done : {
																	total : total_done,
																	me : currentUser.custom_fields[post_count_id]
																}
															};
															if (e.row.suggester_id) {
																createParams['[ACS_User]suggester_id'] = e.row.suggester_id;
															}

															PostsModel.create(e.row.action_id, e.row.action_name, null, PostsModel.postTypes.joins, createParams, function(postEvent){
																indicator.hideModal();
																if (postEvent.success) {
																	Model.AppCache.posts.set(postEvent.posts[0]);
																	
																	var PostActionWindow = require('/ui/PostActionWindow');
																	var postActionWindow = new PostActionWindow(postEvent.posts[0].user.id, postEvent.posts[0].id, {
																		total : total_done,
																		me : currentUser.custom_fields[post_count_id]
																	}); 
																	require('/ui/MasterWindow').getNavGroup().open(postActionWindow);
																	
																	var ActionsModel = require('/lib/model/actions');
																	var action_update_params = {
																		event_id : e.row.action_id,
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
																	
																	var UsersModel = require('/lib/model/users');
																	var userUpdateParams = {
																		custom_fields:{
																			total_joins : _total_joins
																		}
																	};
																	userUpdateParams.custom_fields[post_count_id] = currentUser.custom_fields[post_count_id];
																	UsersModel.update(userUpdateParams, function(updateEvent) {
																		if (updateEvent.success) {
																			currentUser = updateEvent.users[0];
																			Ti.App.Properties.setString('carely_user', JSON.stringify(updateEvent.users[0]));
												
																			Model.AppCache.users.set(updateEvent.users[0]);
																		} else {
																			Model.eventDefaultErrorCallback(updateEvent);
																		}
																	});
																	
																	common.refreshHandler.setRefresh.news(true);
																	refreshNews(true);
																}
																else{
																	Model.eventDefaultErrorCallback(postEvent);
																}
															});
														} else {
															indicator.hideModal();
															Model.eventDefaultErrorCallback(queryEvent);
														}
													});
												}
												else{
													indicator.hideModal();
													var UsersModel = require('/lib/model/users');
													UsersModel.update({
														custom_fields : {
															total_joins : _total_joins
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
		
												if (currentUser && currentUser.id && currentUser.id !== e.row.user_id && currentUser.username) {
													var funame = common.getUserDisplayName(currentUser);
													
													Ti.App.fireEvent('push.notify', {
														tags : [e.row.user_id + '_join'],
														alert : funame + ' joined your activity!',
														custom_fields : {
															post_id : e.row.post_id,
															to_user_id : e.row.user_id,
															actionClassName : e.row.actionClassName,
															type : 'join'
														}
													});
												}
											} else {
												indicator.hideModal();
												e.row.AddJoins(-1);
												Model.eventDefaultErrorCallback(reviewEvent);
											}
										});
										break;
									case 'Unjoin':
										e.row.AddJoins(-1);
										
										var ReviewsModel = require('/lib/model/reviews');
										ReviewsModel.Remove(e.row.actionClassName, e.row.post_id, e.row.user_join_id, function(reviewEvent) {
											if (reviewEvent.success) {
				
												var join_val = e.row.user_join_id;
												e.row.user_join_id = undefined;
				
												currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
												var _total_joins = [];
												if (currentUser.custom_fields.total_joins) {
													_total_joins = _total_joins.concat(currentUser.custom_fields.total_joins);
												}
												var join_idx = _total_joins.indexOf(e.row.post_id + '_' + join_val);
												if (_total_joins.length > 0 && join_idx !== -1) {
													_total_joins.splice(join_idx, 1);
				
													Ti.App.Properties.setString('carely_user', JSON.stringify(currentUser));
				
													var PostsModel = require('/lib/model/posts');
													PostsModel.show(e.row.post_id, function(showEvent) {
														if (showEvent.success) {
															Model.AppCache.posts.set(showEvent.posts[0]);
				
															common.refreshHandler.setRefresh.news(true);
															common.refreshHandler.setRefresh.leaderboard(true);
				
															var summ = ReviewsModel.ReviewSummary(showEvent.posts[0]);
															e.row.SetConversationValue(summ);
														} else {
															Model.eventDefaultErrorCallback(showEvent);
														}
													});
				
													PostsModel.queryPages({
														title : PostsModel.postTypes.joins,
														original_post_id : e.row.post_id,
														user_id : currentUser.id
													}, null, 1, 1, function(queryPostEvent) {
														if (queryPostEvent.success) {
															if (queryPostEvent.meta.total_results > 0) {
																PostsModel.remove(queryPostEvent.posts[0].id, false, function(removeEvent) {
																	if (removeEvent.success) {
																		Model.AppCache.posts.del(queryPostEvent.posts[0].id);
																		
																		common.refreshHandler.setRefresh.news(true);
																		refreshNews(true);
																	} else {
																		Model.eventDefaultErrorCallback(removeEvent);
																	}
				
																	var queryParams = {
																		title : {
																			'$in' : [PostsModel.postTypes.checkin, PostsModel.postTypes.joins]
																		},
																		event_id : e.row.action_id,
																		upcoming_date_start : {
																			$exists : false
																		}
																	}
																	PostsModel.queryPages(queryParams, null, 1, 1, function(queryEvent) {
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
																			currentUser.custom_fields[post_count_id] += 1;
				
																			var ActionsModel = require('/lib/model/actions');
																			var action_update_params = {
																				event_id : e.row.action_id,
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
																			
																			var UsersModel = require('/lib/model/users');
																			var userUpdateParams = {
																				custom_fields : {
																					total_joins : _total_joins
																				}
																			};
																			userUpdateParams.custom_fields[post_count_id] = currentUser.custom_fields[post_count_id];
				
																			UsersModel.update(userUpdateParams, function(updateEvent) {
																				if (updateEvent.success) {
																					currentUser = updateEvent.users[0];
																					Ti.App.Properties.setString('carely_user', JSON.stringify(updateEvent.users[0]));
				
																					Model.AppCache.users.set(updateEvent.users[0]);
																				} else {
																					Model.eventDefaultErrorCallback(updateEvent);
																				}
																			});
																		} else {
																			Model.eventDefaultErrorCallback(queryEvent);
																		}
																	});
																}); 
															}
														} else {
															Model.eventDefaultErrorCallback(queryPostEvent);
														}
													});
												}
											} else {
												e.row.AddJoins(1);
												Model.eventDefaultErrorCallback(reviewEvent);
											}
										});
										break;
									default:
										break;
								}
							}
						});
						action_dlg.show();
					break;
				case 'comment':
					focusComment = true;
				default:
					if (e && e.row && e.row.post_id) {
						var actionItem = Model.AppCache.posts.get(e.row.post_id);
						if (!actionItem) {
							var PostsModel = require('/lib/model/posts');
							PostsModel.show(e.row.post_id, function(showEvent) {
								if (showEvent.success) {
									Model.AppCache.posts.set(showEvent.posts[0]);

									openActionItemWindow(e.row.post_id, focusComment, e.row.actionClassName);
								} else {
									Model.eventDefaultErrorCallback(showEvent);
								}
							});
						} else {
							openActionItemWindow(e.row.post_id, focusComment, e.row.actionClassName);
						}

						function openActionItemWindow(_post_id, _focusComment, _actionClassName) {
							var ActionItemWindow = require('/ui/ActionItemWindow');
							var post_window = new ActionItemWindow(_post_id, _focusComment, _actionClassName);
							require('/ui/MasterWindow').getNavGroup().open(post_window);
							news_table.readyForClicks = false;
						}
					}
					break;
			}
		}
	});
	
	// pull to refresh
	var PullToRefresh = require('/ui/PullToRefresh');
	var puller = new PullToRefresh();
	news_table.headerPullView = puller._view;
	
	var page = 1, more = true, updating = false;
	function endUpdate() {
		updating = false;
		
		if(news_table.pullRefresh){
			news_table.pullRefresh = false;
			
			news_table.top = 0;
			news_table.scrollToTop(0, {
				animated : false
			});
			
			puller.end(news_table, function() {});
		}
		
		if(more === false){
			footer_view_indicator.hide();
			
			change_filter_lbl.height = Ti.UI.FILL;
		}
		else{
			footer_view.height = 0;
		}
	}
	
	function getEmptyListRow(){
		var emptyListRow = Ti.UI.createTableViewRow({
			height : Ti.UI.SIZE,
			width : Ti.UI.FILL,
			selectionStyle : Ti.UI.iPhone.TableViewCellSelectionStyle.NONE,
			className : 'Empty_List_Row'
		});
		var emptyListImage = Ti.UI.createImageView({
			image : theme.images.empty_list_tag,
			height : Ti.UI.FILL,
			hires : true
		});
		if (List_tag) {
			if (List_tag.is_favorites) {
				emptyListImage.image = theme.images.empty_list_favorites;
			} else if (List_tag.is_following) {
				emptyListImage.image = theme.images.empty_list_friends;
				emptyListImage.touchEnabled = true;
				emptyListImage.clickName = 'add_friends';
			}
		}
		emptyListRow.add(emptyListImage); 
		
		return emptyListRow;
	}
	
	function dataPostsCallback(_posts, _page, _avoid_updates){
		
		force = false;
		
		var _rows = [];
		
		if(_posts && _posts.length){
			_rows = createNewsRows(_posts);
		}
		
		require('/lib/analytics').trackEvent({
			category : 'news',
			action : 'rows',
			label : List_tag ? List_tag.name : null,
			value : _rows ? _rows.length : 0
		});
		
		if(_page === 1){
			if(_rows.length > 0){
				defaultRows = _posts;
			}
			else{
				defaultRows = null;
				
				_rows = [getEmptyListRow()];
			}
			
			setTimeout(function(){
				news_table.setData(_rows);
			}, 100);
			Model.AppCache.set('news_initial_default_rows', defaultRows);
		}
		else{
			if (_rows && _rows.length) {
				setTimeout(function() {
					news_table.appendRow(_rows, {
						animated : false
					});
				}, 100);
			}
		}
		
		setTimeout(function(){	
			if(!_avoid_updates){
				endUpdate();
			}
		}, 100);
	}
	
	var next_posts = null;
	function fetchNews(_where) {
		
		var cur_page = page;
		if(next_posts && cur_page > 1){
			setTimeout(function(){
				dataPostsCallback(next_posts, cur_page, true);
				next_posts = null;
			}, 100);
		}
		
		var PostsModel = require('/lib/model/posts');
		PostsModel.queryPages(_where, '-created_at', cur_page, 10, function(e) {
			
			require('/lib/analytics').trackEvent({
				category : 'news',
				action : 'load',
				label : List_tag ? List_tag.name : null,
				value : page
			});
			
			if (e.success) {
				if (e.meta.total_results > 0) {
					
					if (e.meta.page < e.meta.total_pages) {
						page += 1;
					}
					else{
						more = false;
					}

					// cache items
					Model.AppCache.posts.setMany(e.posts);
				} else {
					more = false;
				}
			} else {
				Model.eventDefaultErrorCallback(e);
			}
			
			if(next_posts && cur_page > 1){
				setTimeout(function(){
					dataPostsCallback(next_posts, cur_page, true);
					next_posts = null;
				}, 100);
			}
			
			if(more && e && e.posts){
				next_posts = e.posts.splice(5,10);
			}
			setTimeout(function(){
				dataPostsCallback(e.posts, cur_page);
			}, 100);
		});
	}
	
	// scrolling refresh
	function refreshNews(force) {
		
		updating = true;
		
		if (force === true) {
			more = true;
			page = 1;
			next_posts = null;
		}
		
		footer_view_indicator.show();
		change_filter_lbl.height = 0;
			
		var _where = null;
		List_tag = JSON.parse(Ti.App.Properties.getString('List_tag', null));
		
		require('/lib/analytics').trackEvent({
			category : 'news',
			action : 'refresh',
			label : List_tag ? List_tag.name : null,
			value : force ? 1 : 0
		});
		
		if(List_tag){
			if(List_tag.id && !List_tag.all_activities){
				_where = { tags_array : 'list_tag_' + List_tag.id };
			}
			else{
				currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
				
				if(List_tag.is_favorites){
					if(currentUser && currentUser.custom_fields && currentUser.custom_fields.my_actions &&
				   	   currentUser.custom_fields.my_actions.length){
						_where = { event_id : { '$in' : currentUser.custom_fields.my_actions } };
					}
					else{
						// empty favorites
						dataPostsCallback(null,1);
						updating = false;
						return false;
					}
				}
				else if(List_tag.is_following){
					if(currentUser && currentUser.custom_fields && currentUser.custom_fields.following && currentUser.custom_fields.following.length){
						_where = { user_id : {'$in' : [currentUser.id].concat(currentUser.custom_fields.following) } };
					}
					else{
						// empty following
						dataPostsCallback(null,1);
						updating = false;
						return false;
					}
				}
			} 
		}
		
		footer_view.height = 30;

		// recent
		if (force === true) {
			force = false;
			
			if (defaultRows && defaultRows.length) {
				news_table.setData(createNewsRows(defaultRows));
			} else {
				news_table.setData([]);
			}
		}

		fetchNews(_where);
	}

	news_table.addEventListener('scroll', function(e) {
		if(e){
			e.cancelBubble = true;
		}
		news_table.scrollEnd = false;
		
		if (e.contentOffset.y < 0) {
			if (updating === false) {
				puller.scroll(e);
			}
		} else {
			if (e.contentOffset.y + e.size.height + 100 > e.contentSize.height) {
				footer_view.height = 30;
				
				news_table.canRefreshNow = true;
			}
		}
	});
	
	news_table.addEventListener('scrollend', function(e) {
		if(e){
			e.cancelBubble = true;
		}
		
		var loading_new_data = 0;
		if(news_table.canRefreshNow){
			news_table.canRefreshNow = false;

			if (more && updating === false) {
				loading_new_data = 1;
				refreshNews(false);
			}
		}
		
		require('/lib/analytics').trackEvent({
			category : 'news',
			action : 'scroll',
			label : 'load data',
			value : loading_new_data
		});
	});

	news_table.addEventListener('dragEnd', function(e) {
		if(e){
			e.cancelBubble = true;
		}
		if (updating === true) {
			return false;
		}

		puller.begin(e, news_table, function() {
			news_table.pullRefresh = true;
			refreshNews(true);
		});
	});
	
	self.add(news_table);
	
	function handleNewsOverlay(){
		var showNewsOverlay = Ti.App.Properties.getBool('carely_showNewsOverlay', true);
		if(showNewsOverlay){
			Ti.App.Properties.setBool('carely_showNewsOverlay', false);
			var win = Ti.UI.createWindow({
				navBarHidden : true,
				backgroundImage:theme.images.newsOverlay,
				orientationModes : [Ti.UI.PORTRAIT]
			});
			win.addEventListener('click', function(e){
				this.close({duration:500,opacity:0});
			});
			win.open();
		}
	}
	
	function handlePushNotifications() {
		var handle_push_notifications = Ti.App.Properties.getBool('carely_handlePushNotifications', true);
		if(handle_push_notifications){
			Ti.App.Properties.setBool('carely_handlePushNotifications', false);
			
			if(currentUser && currentUser.id){
				var NotificationsModel = require('/lib/model/notifications');
				var notifications_tags = [];
				
				if(currentUser && currentUser.custom_fields && currentUser.custom_fields.notification_settings){
					if(currentUser.custom_fields.notification_settings.like){
						notifications_tags.push(currentUser.id + '_like');
					}
					if(currentUser.custom_fields.notification_settings.comment){
						notifications_tags.push(currentUser.id + '_comment');
					}
					if(currentUser.custom_fields.notification_settings.join){
						notifications_tags.push(currentUser.id + '_join');
					}
					if(currentUser.custom_fields.notification_settings.follow){
						notifications_tags.push(currentUser.id + '_follow');
					}
				}
				else{
					notifications_tags.push(currentUser.id + '_comment');
					notifications_tags.push(currentUser.id + '_join');
					notifications_tags.push(currentUser.id + '_follow');
				}
				
				NotificationsModel.registerForPushNotifications(currentUser.id, notifications_tags, function(e){
						if (e.success) {
							Ti.App.Properties.setBool('carely_notifications', true);	
						}
						
						var notifications_tags_desc = [];
						if(notifications_tags && notifications_tags.length){
							for(var i=0, v=notifications_tags.length; i<v; i++){
								notifications_tags_desc.push(notifications_tags[i].replace(currentUser.id + '_', ''));
							}
						}
						require('/lib/analytics').trackEvent({
							category : 'push notifications',
							action : 'register',
							label : notifications_tags_desc.join(','),
							value : (e && e.success) ? 1 : 0
						});
						
						notifications_tags_desc = null;
					});
			}
		}
	}
	
	self.addEventListener('focus', function(e){
		require('/lib/analytics').trackScreen({ screenName : self.title });
		
		currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
		if(!currentUser){
			return false;
		}
		
		handleNewsOverlay();
		handlePushNotifications();
			
		if(self.opacity === 0.0){
			self.opacity = 1.0;
		}
		Ti.App.Properties.setBool('carely_goToHome', false);
		Ti.App.Properties.setBool('carely_running', true);
		
		news_table.readyForClicks = true;
		FollowingNavButton.readyForClicks = true;
		
		if(Ti.App.Properties.getBool('carely_openFriends', false) === true){
			Ti.App.Properties.setBool('carely_openFriends', false);
			
			var FindFriendsWindow = require('/ui/FindFriendsWindow');
			var findFriendsWindow = new FindFriendsWindow();
			require('/ui/MasterWindow').getNavGroup().open(findFriendsWindow);
		}
		
		var refreshNow = common.refreshHandler.getRefresh.news();
		if(Ti.App.Properties.getBool('carely_news_restart', false) === true){
			Ti.App.Properties.setBool('carely_news_restart', false);
			
			defaultRows = [];
			Model.AppCache.set('news_initial_default_rows', defaultRows);
			news_table.setData([]);
			
			refreshNow = true;
		}
	
		List_tag = JSON.parse(Ti.App.Properties.getString('List_tag', null));
		if(!List_tag){
			updating = false;
			openListTagWindow(true);
			return false;
		}
		else{
			if(List_tag.is_following){
				self.rightNavButton = FollowingNavButton;
			}
			else if(self.rightNavButton !== self.rightNavDefaultButton){
				self.rightNavButton = self.rightNavDefaultButton;
			}
		}
		tag_list_lbl.text = List_tag.name;
		self.title = tag_list_lbl.text;
		
		if(refreshNow === true){
			common.refreshHandler.setRefresh.news(false);
			
			news_table.top = 0;
			news_table.scrollToTop(0, {animated:false});
				
			refreshNews(true);
		}
	});
	
	return self;
}
module.exports = NewsWindow;