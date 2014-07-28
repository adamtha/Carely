function ActionItemWindow(itemId, fucosComment, classname){
	var _ = require('/lib/underscore'),
		_s = require('/lib/underscore_strings'), 
		theme = require('/ui/theme'), 
		ui = require('/ui/components'),
		moment = require('/lib/date/moment'),
		common = require('/lib/common'),
		ReviewsModel = require('/lib/model/reviews'),
		Model = require('/lib/model/model'),
		ActionItemBox = require('/ui/ActionItemBox');
	
	var actionItem = Model.AppCache.posts.get(itemId);	
	var isAndroid = Ti.Platform.osname === 'android';
	var currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
	
	function blurText(){
		if(post_comment_text.gotFocus === true){
			post_comment_text.blur();
		}
	}
	function AddHideKeyboardOnClick(_item){
		_item.addEventListener('click', blurText);
	}
	
	var title = 'News Details';
	if(actionItem.event && actionItem.event.name && actionItem.event.name !== ''){
		title = actionItem.event.name;
	}
	
	var self = Ti.UI.createWindow({
		title: title,
		navBarHidden : false,
		barColor:theme.barColor,
		backgroundColor:theme.tableBackgroundColor,
		windowSoftInputMode:isAndroid ? Ti.UI.Android.SOFT_INPUT_ADJUST_RESIZE : null,
		orientationModes : [Ti.UI.PORTRAIT]
	});
	AddHideKeyboardOnClick(self);
	
	var news_row = new ActionItemBox(actionItem, true);
	if (news_row.can_join && currentUser && currentUser.custom_fields.total_joins && currentUser.custom_fields.total_joins.length) {
		var user_join = _.find(currentUser.custom_fields.total_joins, function(elm) {
			return _s.startsWith(elm, itemId);
		});
		if (user_join) {
			news_row.user_join_id = user_join.split('_')[1];
		}
	}
	if (currentUser && currentUser.custom_fields.total_likes && currentUser.custom_fields.total_likes.length) {
		var user_like = _.find(currentUser.custom_fields.total_likes, function(elm) {
			return _s.startsWith(elm, itemId);
		});
		if (user_like) {
			news_row.user_like_id = user_like.split('_')[1];
		}
	}
	
	var share_btn = Ti.UI.createButton({
		systemButton:Ti.UI.iPhone.SystemButton.ACTION
	});
	share_btn.addEventListener('click', function(e) {
		
		require('/lib/analytics').trackEvent({
			category : 'news',
			action : 'post_options',
			label : news_row.post_id,
			value : null
		}); 

		var action_options = {
			options : [],
			cancel : 0
		};
		if (news_row.action_id) {
			action_options.options.push('Do it');
			//action_options.options.push('Plan it');
			action_options.options.push('Want it');
			action_options.options.push('Talk about it');
		}
		if (news_row.can_join) {
			if (news_row.user_join_id) {
				if (news_row.user_display_name) {
					action_options.options.push('Unjoin ' + news_row.user_display_name);
				} else {
					action_options.options.push('Unjoin');
				}
			} else {
				if (news_row.user_display_name) {
					action_options.options.push('Join ' + news_row.user_display_name);
				} else {
					action_options.options.push('Join');
				}
			}
		}
		if (news_row.action_id) {
			if (currentUser && currentUser.custom_fields && currentUser.custom_fields.my_actions) {
				if (currentUser.custom_fields.my_actions.indexOf(news_row.action_id) > -1) {
					action_options.options.push('Remove from Favorites');
				} else if (currentUser.custom_fields.my_actions.length < common.max_actions.user) {
					action_options.options.push('Add to Favorites');
				}
			}
			action_options.options.push('Suggest to followers');
		}
		if (!action_options.options.length) {
			return false;
		}
		action_options.options.push('Cancel');
		action_options.cancel = action_options.options.length - 1;

		var action_dlg = Ti.UI.createOptionDialog(action_options);
		action_dlg.addEventListener('click', function(dialogEvent) {
			if (dialogEvent.index !== dialogEvent.cancel) {
				var addToMyActions = -1, checkin_type = null;
				var option_text = action_options.options[dialogEvent.index];
				if (option_text.indexOf('Join') === 0) {
					option_text = 'Join';
				} else if (option_text.indexOf('Unjoin') === 0) {
					option_text = 'Unjoin';
				}
				
				require('/lib/analytics').trackEvent({
					category : 'news',
					action : option_text,
					label : news_row.post_id,
					value : null
				}); 
				
				switch(option_text) {
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
										
						if (!news_row.action_id) {
							return false;
						}
						var _action_item = Model.AppCache.actions.get(news_row.action_id);
						if (_action_item) {
							var CheckinWindow = require('/ui/CheckinWindow');
							var win = new CheckinWindow(news_row.action_id, null, news_row.suggester_id, checkin_type);
							require('/ui/MasterWindow').getNavGroup().open(win);
						} else {
							var ActionsModel = require('/lib/model/actions');
							ActionsModel.show(news_row.action_id, function(showEvent) {
								if (showEvent.success) {
									Model.AppCache.actions.set(showEvent.events[0]);

									var CheckinWindow = require('/ui/CheckinWindow');
									var win = new CheckinWindow(news_row.action_id, null, news_row.suggester_id, checkin_type);
									require('/ui/MasterWindow').getNavGroup().open(win);
								} else {
									Model.eventDefaultErrorCallback(showEvent);
								}
							});
						}
						break;
					case 'Add to Favorites':
						addToMyActions = 0;
					case 'Remove Favorites':
						if (addToMyActions < 0) {
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
						var idx = my_action_preferences.indexOf(news_row.action_id);
						if (addToMyActions === 0) {
							if (idx === -1) {
								my_action_preferences.splice(0, 0, news_row.action_id);
								var dix = my_deleted_actions_preferences.indexOf(news_row.action_id);
								if (dix > -1) {
									my_deleted_actions_preferences.splice(dix, 1);
								}
								addedAction = 0;
								
								if(news_row.suggester_id){
									if(_my_action_suggestions === null){
										_my_action_suggestions = {};
									}
									_my_action_suggestions[news_row.action_id] = news_row.suggester_id;
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
								if (my_deleted_actions_preferences.indexOf(news_row.action_id) === -1) {
									my_deleted_actions_preferences.splice(0, 0, news_row.action_id);
								}
								addedAction = 1;
								
								if(_my_action_suggestions && _my_action_suggestions[news_row.action_id]){
									_my_action_suggestions[news_row.action_id] = undefined;
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

								if (addToMyActions > -1) {
									var PostsModel = require('/lib/model/posts');
									PostsModel.queryPages({
										title : PostsModel.postTypes.actions_add,
										user_id : currentUser.id,
										event_id : news_row.action_id
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

											if (addToMyActions === 0) {
												PostsModel.queryPages({
													title : {
														'$in' : [PostsModel.postTypes.checkin, PostsModel.postTypes.joins]
													},
													event_id : news_row.action_id,
													upcoming_date_start : {
														$exists : false
													}
												}, null, 1, 1, function(queryEvent) {
													if (queryEvent.success) {
														var post_count_id = news_row.action_id + '_' + PostsModel.postTypes.checkin;
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
														if(news_row.suggester_id){
															createParams['[ACS_User]suggester_id'] = news_row.suggester_id;
														}
														PostsModel.create(news_row.action_id, news_row.action_name, null, PostsModel.postTypes.actions_add, createParams, function(postEvent) {
															if (postEvent.success) {
																Model.AppCache.posts.set(postEvent.posts[0]);
															} else {
																Model.eventDefaultErrorCallback(postEvent);
															}
														});
													} else {
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
							var suggestActionWindow = new SuggestActionWindow(news_row.action_id, news_row.action_name);
							require('/ui/MasterWindow').getNavGroup().open(suggestActionWindow);
						break;
					case 'Join':
						news_row.AddJoins(1);

						var join_value = 2;

						var actIndicator = require('/ui/ActivityIndicator');
						var indicator = new actIndicator();

						indicator.showModal('Joining activity...', 60000, 'Timeout joining activity!');
						ReviewsModel.Join(news_row.actionClassName, news_row.post_id, join_value, function(reviewEvent) {
							if (reviewEvent.success) {
								news_row.user_join_id = reviewEvent.reviews[0].id;

								currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
								var _total_joins = [];
								if (currentUser.custom_fields.total_joins) {
									_total_joins = _total_joins.concat(currentUser.custom_fields.total_joins);
								}
								_total_joins.push(news_row.post_id + '_' + reviewEvent.reviews[0].id);
								Ti.App.Properties.setString('carely_user', JSON.stringify(currentUser));

								var PostsModel = require('/lib/model/posts');
								PostsModel.show(news_row.post_id, function(showEvent) {
									if (showEvent.success) {
										Model.AppCache.posts.set(showEvent.posts[0]);

										common.refreshHandler.setRefresh.news(true);
										common.refreshHandler.setRefresh.leaderboard(true);

										var summ = ReviewsModel.ReviewSummary(showEvent.posts[0]);
										news_row.SetConversationValue(summ);
									} else {
										Model.eventDefaultErrorCallback(showEvent);
									}
								});

								if (news_row.action_id && news_row.action_name) {
									var queryParams = {
										title : {
											'$in' : [PostsModel.postTypes.checkin, PostsModel.postTypes.joins]
										},
										event_id : news_row.action_id,
										upcoming_date_start : {
											$exists : false
										}
									}
									PostsModel.queryPages(queryParams, null, 1, 1, function(queryEvent) {
										if (queryEvent.success) {
											var post_count_id = news_row.action_id + '_' + PostsModel.postTypes.checkin;
											var total_done = 0;
											if (queryEvent.meta.total_results > 0) {
												total_done = queryEvent.meta.total_results;
											}
											total_done += 1;

											if (!currentUser.custom_fields[post_count_id]) {
												currentUser.custom_fields[post_count_id] = 0;
											}
											currentUser.custom_fields[post_count_id] += 1;
											
											var createParams = {
												original_post_id : news_row.post_id,
												original_classname : news_row.actionClassName,
												original_poster_id : news_row.user_id,
												original_poster : news_row.user_name,
												intent:news_row.post_intent,
												done : {
													total : total_done,
													me : currentUser.custom_fields[post_count_id]
												}
											};
											if(news_row.suggester_id){
												createParams['[ACS_User]suggester_id'] = news_row.suggester_id;
											}
											
											PostsModel.create(news_row.action_id, news_row.action_name, null, PostsModel.postTypes.joins, createParams, function(postEvent) {			
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
														event_id : news_row.action_id,
														custom_fields : {}
													}
													action_update_params.custom_fields['total_' + PostsModel.intents.checkin] = total_done;
													
													ActionsModel.update(action_update_params, function(actionUpdateEvent) {
														if (actionUpdateEvent.success) {

															Model.AppCache.actions.set(actionUpdateEvent.events[0]);

															common.refreshHandler.setRefresh.actions(true);
														} else {
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

													common.refreshHandler.setRefresh.news(true);
												} else {
													Model.eventDefaultErrorCallback(postEvent);
												}
											});
										} else {
											indicator.hideModal();
											Model.eventDefaultErrorCallback(queryEvent);
										}
									});
								} else {
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

								if (currentUser && currentUser.id && currentUser.id !== news_row.user_id && currentUser.username) {
									var funame = common.getUserDisplayName(currentUser); 
									Ti.App.fireEvent('push.notify', {
										tags : [news_row.user_id + '_join'],
										alert : funame + ' joined your activity!',
										custom_fields : {
											post_id : news_row.post_id,
											to_user_id : news_row.user_id,
											actionClassName : news_row.actionClassName,
											type : 'join'
										}
									});
								}
							} else {
								indicator.hideModal();
								news_row.AddJoins(-1);
								Model.eventDefaultErrorCallback(reviewEvent);
							}
						});
						break;
					case 'Unjoin':
						news_row.AddJoins(-1);

						ReviewsModel.Remove(news_row.actionClassName, news_row.post_id, news_row.user_join_id, function(reviewEvent) {
							if (reviewEvent.success) {

								var join_val = news_row.user_join_id;
								news_row.user_join_id = undefined;

								currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
								var _total_joins = [];
								if (currentUser.custom_fields.total_joins) {
									_total_joins = _total_joins.concat(currentUser.custom_fields.total_joins);
								}
								var join_idx = _total_joins.indexOf(news_row.post_id + '_' + join_val);
								if (_total_joins.length > 0 && join_idx !== -1) {
									_total_joins.splice(join_idx, 1);

									Ti.App.Properties.setString('carely_user', JSON.stringify(currentUser));

									var PostsModel = require('/lib/model/posts');
									PostsModel.show(news_row.post_id, function(showEvent) {
										if (showEvent.success) {
											Model.AppCache.posts.set(showEvent.posts[0]);

											common.refreshHandler.setRefresh.news(true);
											common.refreshHandler.setRefresh.leaderboard(true);

											var summ = ReviewsModel.ReviewSummary(showEvent.posts[0]);
											news_row.SetConversationValue(summ);
										} else {
											Model.eventDefaultErrorCallback(showEvent);
										}
									});

									PostsModel.queryPages({
										title : PostsModel.postTypes.joins,
										original_post_id : news_row.post_id,
										user_id : currentUser.id
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

													var queryParams = {
														title : {
															'$in' : [PostsModel.postTypes.checkin, PostsModel.postTypes.joins]
														},
														event_id : news_row.action_id,
														upcoming_date_start : {
															$exists : false
														}
													}
													PostsModel.queryPages(queryParams, null, 1, 1, function(queryEvent) {
														if (queryEvent.success) {
															var post_count_id = news_row.action_id + '_' + PostsModel.postTypes.checkin;
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
																event_id : news_row.action_id,
																custom_fields : {}
															}
															action_update_params.custom_fields['total_' + PostsModel.intents.checkin] = total_done;
															ActionsModel.update(action_update_params, function(actionUpdateEvent) {
																if (actionUpdateEvent.success) {

																	Model.AppCache.actions.set(actionUpdateEvent.events[0]);

																	common.refreshHandler.setRefresh.actions(true);
																} else {
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
								news_row.AddJoins(1);
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
	}); 

	self.rightNavButton = share_btn;
		
	var news_data = [news_row];
	var news_table = Ti.UI.createTableView({
		data : news_data,
		top : 0,
		backgroundColor : theme.tableBackgroundColor,
		height : 'auto',
		separatorStyle : Ti.UI.iPhone.TableViewSeparatorStyle.NONE,
		scrollsToTop : true,
		footerView : Ti.UI.createView({ height:50 }),
		bubbleParent:false,
		canRefreshNow:false
	});
	self.add(news_table);
	
	function postLike(){
		blurText();
		if(news_row && news_row.actionClassName && news_row.post_id){
			if(news_row.user_like_id){
				news_row.AddLikes(-1);
				commentToolBarButton.image = theme.images.news.like_off;
				
				ReviewsModel.Remove(news_row.actionClassName, news_row.post_id, news_row.user_like_id, function(reviewEvent) {
					if (reviewEvent.success) {

						var like_val = e.row.user_like_id;
						news_row.user_like_id = undefined;

						currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
						var _total_likes = [];
						if (currentUser.custom_fields.total_likes) {
							_total_likes = _total_likes.concat(currentUser.custom_fields.total_likes);
						}
						var like_idx = _total_likes.indexOf(news_row.post_id + '_' + like_val);
						if (_total_likes.length > 0 && like_idx !== -1) {
							_total_likes.splice(like_idx, 1);

							Ti.App.Properties.setString('carely_user', JSON.stringify(currentUser));

							var PostsModel = require('/lib/model/posts');
							PostsModel.show(news_row.post_id, function(showEvent) {
								if (showEvent.success) {
									Model.AppCache.posts.set(showEvent.posts[0]);

									common.refreshHandler.setRefresh.news(true);
									common.refreshHandler.setRefresh.leaderboard(true);

									var summ = ReviewsModel.ReviewSummary(showEvent.posts[0]);
									news_row.SetConversationValue(summ);
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
						news_row.AddLikes(1);
						commentToolBarButton.image = theme.images.news.like_on;
						Model.eventDefaultErrorCallback(reviewEvent);
					}
				});
			}
			else{
				news_row.AddLikes(1);
				commentToolBarButton.image = theme.images.news.like_on;
				
				ReviewsModel.Like(news_row.actionClassName, news_row.post_id, function(reviewEvent) {
					if (reviewEvent.success) {
						news_row.user_like_id = reviewEvent.reviews[0].id;

						currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
						var _total_likes = [];
						if (currentUser.custom_fields.total_likes) {
							_total_likes = _total_likes.concat(currentUser.custom_fields.total_likes);
						}
						_total_likes.push(news_row.post_id + '_' + reviewEvent.reviews[0].id);
						Ti.App.Properties.setString('carely_user', JSON.stringify(currentUser));

						var PostsModel = require('/lib/model/posts');
						
						PostsModel.show(news_row.post_id, function(showEvent) {
							if (showEvent.success) {
								actionItem = showEvent.posts[0];
								Model.AppCache.posts.set(showEvent.posts[0]);

								common.refreshHandler.setRefresh.news(true);
								common.refreshHandler.setRefresh.leaderboard(true);

								var summ = ReviewsModel.ReviewSummary(showEvent.posts[0]);
								news_row.SetConversationValue(summ);
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

						if (currentUser && currentUser.id && currentUser.id !== news_row.user_id && currentUser.username) {
							var funame = common.getUserDisplayName(currentUser);
							
							Ti.App.fireEvent('push.notify', {
								tags : [news_row.user_id + '_like'],
								alert : funame + ' likes your post!',
								custom_fields : {
									post_id : news_row.post_id,
									to_user_id : news_row.user_id,
									actionClassName : news_row.actionClassName,
									type : 'like'
								}
							});
						}
					} else {
						news_row.AddLikes(-1);
						news_row.user_like_id = undefined;
						commentToolBarButton.image = theme.images.news.like_off;
						
						Model.eventDefaultErrorCallback(reviewEvent);
					}
				});
			}
		}
	}
	
	function postComment(){
		blurText();
		if(news_row && news_row.actionClassName && news_row.post_id){
			var actionDesc = post_comment_text.value !== defaultCommentText ? post_comment_text.value : '';
			if (common.trimWhiteSpaces(actionDesc) === '') {
				post_comment_text.value = defaultCommentText;
			} else {
				ReviewsModel.Comment(news_row.actionClassName, news_row.post_id, actionDesc, function(reviewEvent) {
					post_comment_text.value = defaultCommentText;
					if (reviewEvent.success) {
						
						common.refreshHandler.setRefresh.news(true);
						common.refreshHandler.setRefresh.leaderboard(true);
						
						var newRows = createCommentRows(reviewEvent.reviews);
						if(newRows.length > 0){
							if(!news_row.totalComments){
								news_row.totalComments = 1;
								news_row.SetConversationTextValue();
							} 
							comments_data = newRows.concat(comments_data);
							endUpdate();
							newRows = null;
						}
						
						currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
						var _total_comments = [];
						if (currentUser.custom_fields.total_comments) {
							_total_comments = _total_comments.concat(currentUser.custom_fields.total_comments);
						}
						_total_comments.push(news_row.post_id + '_' + reviewEvent.reviews[0].id);
						
						var PostsModel = require('/lib/model/posts');
						PostsModel.show(news_row.post_id, function(showEvent) {
							if (showEvent.success) {
								actionItem = showEvent.posts[0];
								Model.AppCache.posts.set(actionItem);
	
								common.refreshHandler.setRefresh.news(true);
								common.refreshHandler.setRefresh.leaderboard(true);
								
								var summ = ReviewsModel.ReviewSummary(showEvent.posts[0]);
								news_row.SetConversationValue(summ);
							} else {
								Model.eventDefaultErrorCallback(showEvent);
							}
						}); 
	
						var UsersModel = require('/lib/model/users');
						UsersModel.update({
							custom_fields : {
								total_comments : _total_comments
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
						if (currentUser && currentUser.id && currentUser.id !== news_row.user_id && currentUser.username) {
							var funame = common.getUserDisplayName(currentUser);
							
							var alert_message = funame + ' wrote a comment on your post';
							if(actionDesc && actionDesc.length){
								alert_message += ': ';
								if(actionDesc.length > 100){
									alert_message += actionDesc.substr(0, 100);
									alert_message += '...';
								}
								else{
									alert_message += actionDesc;
								}
							}
							else{
								alert_message += '!';
							}
							
							Ti.App.fireEvent('push.notify', {
								tags : [news_row.user_id + '_comment'],
								alert : alert_message,
								custom_fields : {
									post_id : news_row.post_id,
									to_user_id : news_row.user_id,
									actionClassName : news_row.actionClassName,
									type:'comment'
								}
							});
						}
	
					} else {
						Model.eventDefaultErrorCallback(reviewEvent);
					}
				});
			}
		}	
	}
	
	news_table.addEventListener('click', function(e){
		if(e){
			e.cancelBubble = true;
		}
		if(this.clickTime && (new Date() - this.clickTime < 1000)){
			return false;
		}
		this.clickTime = new Date();
		
		blurText();
		
		if(e && e.row && e.row.prev_comments){
			if(!_updating){
				news_table.updateRow(1, loading_row, {animated:false});
				fetchComments();
			}
			
			require('/lib/analytics').trackEvent({
				category : 'news',
				action : 'comments',
				label : 'click',
				value : _page
			});
		}
		else if (e && e.source) {
			currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
			
			require('/lib/analytics').trackEvent({
				category : 'news',
				action : e.source.clickName,
				label : e.row.post_id,
				value : null
			});
			
			switch(e.source.clickName) {
				case 'user':
					var UserWindow = require('/ui/UserWindow');
					var userWindow = new UserWindow(e.source.user_id ? e.source.user_id : e.row.user_id);
					require('/ui/MasterWindow').getNavGroup().open(userWindow);
					break;
				case 'action':
					if(!e.row.action_id){
						return false;
					}
					var _action_item = Model.AppCache.actions.get(e.row.action_id);
					if(_action_item){
						var CheckinWindow = require('/ui/CheckinWindow');
						var win = new CheckinWindow(e.row.action_id);
						require('/ui/MasterWindow').getNavGroup().open(win);
					}
					else{
						var ActionsModel = require('/lib/model/actions');
						ActionsModel.show(e.row.action_id, function(showEvent){
							if(showEvent.success){
								Model.AppCache.actions.set(showEvent.events[0]);
								
								var CheckinWindow = require('/ui/CheckinWindow');
								var win = new CheckinWindow(e.row.action_id);
								require('/ui/MasterWindow').getNavGroup().open(win);
							}
							else{
								Model.eventDefaultErrorCallback(showEvent);
							}
						});
					}
					break;
				case 'action_url':
					if(e.source.url_to_open){
						var urlWebView = require('/lib/urlWebView');
						var urlWin = new urlWebView(e.source.url_to_open, e.row.action_name, null, false);
						require('/ui/MasterWindow').getNavGroup().open(urlWin);
						
						require('/lib/analytics').trackEvent({
							category : 'url',
							action : 'click',
							label : e.source.url_to_open,
							value : null
						});
					}
					break;
				case 'likes':
					if (news_row.totalLikes) {
						var UsersWindow = require('/ui/UsersWindow');
						var usersWindow = new UsersWindow({
							title : 'Likes',
							classname : e.row.actionClassName,
							object_id : e.row.post_id,
							review_type : 'like'
						});
						require('/ui/MasterWindow').getNavGroup().open(usersWindow);
					}
					break;
				case 'joins':
					if (news_row.totalJoins) {
						var UsersWindow = require('/ui/UsersWindow');
						var usersWindow = new UsersWindow({
							title : 'Joining',
							classname : e.row.actionClassName,
							object_id : e.row.post_id,
							review_type : 'join'
						});
						require('/ui/MasterWindow').getNavGroup().open(usersWindow);
					}
					break;
				default:
					break;
			}
		}
	});

	
	function createCommentRows(_items){
		var rows = [];
			
		if(_items && _items.length > 0) {
			for(var i = 0, l = _items.length; i < l; i++) {
				
				if(_items[i].content && _items[i].content.length){
					var row = Ti.UI.createTableViewRow({
						height : 'auto',
						className : 'News_Row',
						separatorStyle : Ti.UI.iPhone.TableViewSeparatorStyle.SINGLE_LINE,
						selectionStyle : Ti.UI.iPhone.TableViewCellSelectionStyle.NONE,
						updated_at : _items[i].updated_at,
						user_id : _items[i].user.id
					});
					
					var userIcon = theme.defaultIcons.user;
					if (_items[i].user.photo && _items[i].user.photo.urls && _items[i].user.photo.urls.square_75) {
						userIcon = _items[i].user.photo.urls.square_75;
					}
					
					var icon = Ti.UI.createImageView({
						image : userIcon,
						width : theme.borderedImage.user.width,
						height : theme.borderedImage.user.height,
						left : 6,
						top : 6,
						clickName:'user'
					});
					row.add(icon);
					
					var content = Ti.UI.createView({
						left : icon.width + icon.left + 6,
						top : 4,
						layout : 'vertical',
						height : Ti.UI.SIZE,
						width : Ti.UI.SIZE
					});
					row.add(content);

					var uname = common.getUserDisplayName(_items[i].user);

					var user_name = Ti.UI.createLabel({
						color : '#333',
						top : 0,
						left : 0,
						text : uname,
						font : theme.defaultFontBold,
						textAlign : Ti.UI.TEXT_ALIGNMENT_LEFT,
						height:Ti.UI.SIZE,
						width : Ti.UI.SIZE,
						clickName:'user'
					});
					content.add(user_name);
					
					var details = Ti.UI.createLabel({
						color : '#333',
						top : 0,
						left : 0,
						text : _items[i].content,
						font : theme.defaultToolTipFont,
						height:Ti.UI.SIZE,
						width : Ti.UI.SIZE
					});
					content.add(details);
					
					var date_value = moment(_items[i].updated_at).fromNow().replace('minutes', 'mins');
					if(date_value && date_value.length){
						var date = Ti.UI.createLabel({
							color : '#999',
							top : 0,
							left : 0,
							height:Ti.UI.SIZE,
							width : Ti.UI.SIZE,
							text : date_value,
							font : {
								fontSize : 13,
								fontFamily : theme.fontFamily
							}
						});
						content.add(date);
					}
					
					//var row_divider = Ti.UI.createView({
					//	bottom:0,
					//	height : 1,
					//	width : Ti.UI.FILL,
					//	backgroundColor : '#999'
					//});
					//row.add(row_divider);
					
					rows.push(row); 
				}
			}
		}

		return rows;
	}
	
	var loading_row = Ti.UI.createTableViewRow({
		height:30,
		selectionStyle : Ti.UI.iPhone.TableViewCellSelectionStyle.NONE
	});
	
	var act_Ind = Ti.UI.createActivityIndicator({
		left : '45%',
		top : 5,
		height : 'auto',
		width : 'auto',
		style : Ti.UI.iPhone.ActivityIndicatorStyle.DARK
	});
	act_Ind.show();
	loading_row.add(act_Ind);
	
	var prev_comments_row = Ti.UI.createTableViewRow({
		height:30,
		prev_comments:true,
		selectionStyle : Ti.UI.iPhone.TableViewCellSelectionStyle.NONE
	});

	var prev_comments_icon = Ti.UI.createImageView({
		top : 5,
		left : 6,
		image : theme.images.news.comment_off,
		width : 20,
		height : 20,
		hires:true
	});
	prev_comments_row.add(prev_comments_icon);
	
	var prev_comments_lbl = Ti.UI.createLabel({
		top : 7,
		left : prev_comments_icon.left + prev_comments_icon.width + 6,
		width : 'auto',
		text : 'View previous comments...',
		color : '#999',
		font : theme.defaultFont
	});
	prev_comments_row.add(prev_comments_lbl);
	
	function endUpdate(){
		var rows = [news_row];
		if(_more){
			rows.push(prev_comments_row);
		}
		if(comments_data && comments_data.length){
			rows = rows.concat(comments_data);
		}
		news_table.setData(rows);
		rows = null;
		_updating = false;
	}
	
	var comments_data = [], _page = 1, _updating = false, _more = true;
	function fetchComments(){
		_updating = true;
			
		ReviewsModel.queryPages(classname, actionItem.id, {review_type: 'comment'}, '-created_at', _page, 10, function(e) {
			if(e.success) {
				if (e.meta.total_results > 0) {
					if (e.meta.page < e.meta.total_pages) {
						_page += 1;
					}
					else{
						_more = false;
					}
					
					var newRows = createCommentRows(e.reviews);
					if(newRows && newRows.length > 0){
						comments_data = newRows.concat(comments_data);
						newRows = null;
					}
				}
				else{
					_more = false;
				}
			} else {
				Model.eventDefaultErrorCallback(e);
			}
			
			require('/lib/analytics').trackEvent({
				category : 'news',
				action : 'comments',
				label : 'rows',
				value : comments_data.length
			});
			
			endUpdate();	
			
			_updating = false;
		});
	}

	var post_comment_view = Ti.UI.createView({
		bottom:0,
		height:40,
	});
	self.add(post_comment_view);
	
	var defaultCommentText = 'Add a comment...';
	var post_comment_text = Ti.UI.createTextField({
		top : 5,
		left : 36,
		height : 30,
		width : 265,
		value : defaultCommentText,
		font : theme.defaultFontItalic,
		color : theme.lightFontColor,
		textAlign : Ti.UI.TEXT_ALIGNMENT_LEFT,
		borderStyle : Ti.UI.INPUT_BORDERSTYLE_ROUNDED,
		returnKeyType:Ti.UI.RETURNKEY_DONE,
		gotFocus:false,
		txtUpdating:false,
		cleanText:true
	}); 
	
	var commentToolBarButton = Ti.UI.createImageView({
		image : news_row.user_like_id ? theme.images.news.like_on : theme.images.news.like_off,
		top : 3,
		width : 26,
		height : 26,
		left : 2,
		hires : true
	});
	commentToolBarButton.addEventListener('click', function(e) {
		postLike();
	});
	var commentToolBar = Ti.UI.iOS.createToolbar({
		items : [commentToolBarButton, post_comment_text],
		bottom : 0,
		borderTop : true,
		borderBottom : false,
		translucent : true,
		barColor : '#999',
		height : 'auto'
	});
	post_comment_view.add(commentToolBar);

	post_comment_text.addEventListener('focus',function(e){
		this.gotFocus = true;
		post_comment_view.animate({bottom:216,duration:170});
		
		if(this.cleanText === true) {
			this.font = theme.defaultFont;
			this.color = theme.textColor;
			this.value = '';
			this.cleanText = false;
		}
	});
	post_comment_text.addEventListener('blur',function(e){
		this.gotFocus = false;
		post_comment_view.animate({bottom:0,duration:170});
		
		if(this.value === '') {
			this.font = theme.defaultFontItalic;
			this.color = theme.lightFontColor;
			this.value = defaultCommentText;
			this.cleanText = true;
		}
	});
	post_comment_text.addEventListener('change', function(e) {
		if(this.txtUpdating === false){
			this.txtUpdating = true;
			if(e.value.length > 140){
				this.value = e.value.substr(0, 140);
			}	
			this.txtUpdating = false;
		}
	});
	post_comment_text.addEventListener('return', function(e) {
		postComment();
	});
	
	//news_table.addEventListener('scroll',function(e){
	//	if(_more === true && _updating === false){
	//		if(e.contentOffset.y + e.size.height + 100 > e.contentSize.height){
	//			fetchComments();
	//		}
	//	}
	//});
	
	if (news_row.totalComments > 0) {
		news_table.appendRow(loading_row);
		fetchComments();
	} else {
		_more = false;
	}
	
	self.addEventListener('focus', function(e){
		if(e){
			e.cancelBubble = true;
		}
		if(Ti.App.Properties.getBool('carely_goToHome', false) === true){
			require('/ui/MasterWindow').getNavGroup().close(this, {animated:false});
		}
		else{
			require('/lib/analytics').trackScreen({ screenName : 'News Details' });
			
			require('/lib/analytics').trackEvent({
				category : 'news',
				action : 'show',
				label : itemId,
				value : null
			});
		}
	});
	
	self.addEventListener('open', function(e){
		if(e){
			e.cancelBubble = true;
		}
		if(Ti.App.Properties.getBool('carely_goToHome', false) === true){
			require('/ui/MasterWindow').getNavGroup().close(this, {animated:false});
		}
		else if(fucosComment && fucosComment === true){
			fucosComment = false;
			setTimeout(function(){
				post_comment_text.focus();
			}, 500);
		}
	});
	
	return self;
}

module.exports = ActionItemWindow;