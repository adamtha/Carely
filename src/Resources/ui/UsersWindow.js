
function UsersWindow(params) {
	var _ = require('/lib/underscore'),
		_s = require('/lib/underscore_strings'),
		theme = require('/ui/theme'), 
		ui = require('/ui/components'),
		moment = require('/lib/date/moment'),
		common = require('/lib/common');
	
	var isAndroid = Ti.Platform.osname === 'android';
	var currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
	
	var self = Ti.UI.createWindow({
		title : params && params.title ? params.title : 'Users details',
		navBarHidden : isAndroid,
		backgroundColor: theme.defaultBgColor,
		orientationModes : [Ti.UI.PORTRAIT],
		layout:'vertical',
		barColor:theme.barColor
	});
	
	var rows_array = [], exists = {};
	var defaultRowHeight = theme.borderedImage.user.height + 16;
	function createUsersRows(_items, _filterExistingItems) {
		var rows = [];
		if(_items && _items.length > 0) {
			for(var i = 0, l = _items.length; i < l; i++) {
				
				if(_filterExistingItems === true && exists[_items[i].id] === true){
					continue;
				}
				exists[_items[i].id] = true;
				
				var uname = common.getUserDisplayName(_items[i]);

				var row = Ti.UI.createTableViewRow({
					//hasChild : true,
					user_id : _items[i].id,
					created_at: _items[i].created_at,
					height: defaultRowHeight,
					width : Ti.UI.FILL,
					filter : uname,
					backgroundImage:theme.images.rowBox.normal,
					joining:_items[i].joining,
					selectionStyle:Ti.UI.iPhone.TableViewCellSelectionStyle.NONE,
					className : 'Users_Row'
				});
				
				if (_items[i] && _items[i].custom_fields && _items[i].custom_fields.suggesting_actions) {
					row.user_action_suggestions = _items[i].custom_fields.suggesting_actions;
				}
				
				var row_view = Ti.UI.createView({
					height : Ti.UI.FILL,
					width : Ti.UI.FILL
				});
				row.add(row_view);
		
				if(params.selectionUsers){
					if(_items[i].id === currentUser.id){
						continue;
					}
					
					//row.hasChild = false;
					row.hasCheck = (params.selectionUsers.indexOf(_items[i].id) > -1);
					//row.selectionStyle = Ti.UI.iPhone.TableViewCellSelectionStyle.NONE;
				}
				else if(_items[i].id !== currentUser.id){
					var follow_btn = Ti.UI.createButton({
						title:'Follow',
						top:14,
						right:10,
						height:24,
						width:70,
						font : {
							fontSize : 14,
							fontFamily: theme.fontFamily
						},
						textAlign:Ti.UI.TEXT_ALIGNMENT_CENTER,
						backgroundImage : theme.buttonImage.grey.normal,
						backgroundSelectedImage : theme.buttonImage.grey.selected,
						style : Ti.UI.iPhone.SystemButtonStyle.PLAIN,
						clickName : 'follow'
					});
					if(currentUser && currentUser.custom_fields && currentUser.custom_fields.following &&
					   currentUser.custom_fields.following.indexOf(_items[i].id) > -1){
					   	follow_btn.title = 'Following';
						follow_btn.backgroundImage = theme.buttonImage.green.normal;
						follow_btn.backgroundSelectedImage = theme.buttonImage.green.selected;
					}
					row_view.add(follow_btn);
				}
				
				var userIcon = theme.defaultIcons.user;
				if (_items[i].photo && _items[i].photo.urls && _items[i].photo.urls.square_75) {
					userIcon = _items[i].photo.urls.square_75;
				}
				if(userIcon === theme.defaultIcons.user && _items[i].custom_fields && _items[i].custom_fields.fb_user_id){
					userIcon = 'https://graph.facebook.com/' + _items[i].custom_fields.fb_user_id + '/picture';
				}
				
				var icon = new ui.ImageViewBordered(userIcon, {
					width : theme.borderedImage.user.width,
					height : theme.borderedImage.user.height,
					left : 8,
					top : 8,
					bottom : 8
				});
				row_view.add(icon);
				
				var userName = Ti.UI.createLabel({
					top:5,
					left:icon.left + icon.width + 6,
					text : uname,
					font : {
						fontSize : 14,
						fontFamily: theme.fontFamily,
						fontWeight : 'bold'
					},
					color:theme.textColor,
					textAlign:Ti.UI.TEXT_ALIGNMENT_LEFT
				});
				row_view.add(userName);
				
				var userDate = Ti.UI.createLabel({
					bottom : 5,
					left:icon.left + icon.width + 6,
					text : moment(_items[i].updated_at).format('MMM D, YYYY'),
					font : {
						fontSize : 12,
						fontFamily : theme.fontFamily
					},
					color : theme.lightFontColor,
					textAlign:Ti.UI.TEXT_ALIGNMENT_LEFT
				});
				row_view.add(userDate);
				
				rows.push(row);
			}
		}
		return rows;
	}
			
	var _page = 1, _per_page = 10, _updating = false, _more = true, _total_results = 0;
	var loading_row = Titanium.UI.createTableViewRow({
		height: defaultRowHeight,
		width : Ti.UI.FILL,
		//backgroundImage:theme.images.rowBox.normal,
		selectionStyle:Ti.UI.iPhone.TableViewCellSelectionStyle.NONE,
		hasChild: false
	});

	var act_Ind = Titanium.UI.createActivityIndicator({
		left : '45%',
		top : 14,
		height : 'auto',
		width : 'auto',
		style : Ti.UI.iPhone.ActivityIndicatorStyle.DARK
	});
	act_Ind.show();
	loading_row.add(act_Ind);
	
	function startUpdate() {
		_updating = true;
		tableView.appendRow(loading_row);
	}
	function endUpdate() {
		_updating = false;
		
		tableView.setData(rows_array);
	}
	
	function refreshUsers(_where, force) {
		
		startUpdate();
		
		var Model = require('/lib/model/model');
		if(force === false){
			var cachedRows = null;
			if(_where !== null){
				if(_where.user_ids && _where.user_ids.length > 0){
					cachedRows = Model.AppCache.users.selectIn(_where.user_ids);
					if (cachedRows !== null && cachedRows.length === _where.user_ids.length) {
						
					}
					else{
						cachedRows = null;
					}
				}
			}
			else{
				//cachedRows = Model.AppCache.users.selectLike();
			}
			if(cachedRows !== null && cachedRows.length > 0){
				rows_array = createUsersRows(cachedRows, false);
				if(rows_array.length > 0){
					endUpdate();
					return;
				}
			}
		}
		
		var condition = null;
		if(_where !== null){
			if(_where.user_ids && _where.user_ids.length > 0){
				condition = { _id : { '$in' : _where.user_ids } };
			} 
			else if(_where.classname && _where.object_id){
				condition = { review_type: _where.review_type };
			}
			else if(_where){
				condition = _where;
			}
		}
		
		if(condition && condition.friends && condition.user_id){
			var FriendsModel = require('/lib/model/friends');
			FriendsModel.search(condition.user_id, condition.followers !== undefined ? condition.followers : false, null, 1, 100, function(e){
				if(e.success){
					if (e.meta.total_results > 0) {
						_total_results = e.meta.total_results;
						
						if (e.meta.page < e.meta.total_pages) {
							_page += 1;
						}
						else{
							_more = false;
						}
						
						// cache items
						Model.AppCache.users.setMany(e.users);
	
						var newRows = createUsersRows(e.users, true);
						if (newRows.length > 0) {
							rows_array = rows_array.concat(newRows);
						}
						newRows = null
					} else {
						_more = false;
					}
				}
				else{
					Model.eventDefaultCallback(e);
				}
				endUpdate();
			});
		}
		else if(condition && condition.review_type !== undefined){
			var ReviewsModel = require('/lib/model/reviews');
			ReviewsModel.queryPages(_where.classname, _where.object_id, condition, 'review_type,created_at', _page, _per_page, function(e) {
				if (e.success) {
					if (e.meta.total_results > 0) {
						_total_results = e.meta.total_results;
	
						if (e.meta.page < e.meta.total_pages) {
							_page += 1;
						}
						else{
							_more = false;
						}
						
						var users = _.map(e.reviews, function(o){
							var usrr = o.user;
							if(o.rating === 1){
								usrr.joining = 'Maybe joining';
							}
							else if(o.rating === 2){
								usrr.joining = 'Joining activity';
							}
							return usrr;
						});
						
						// cache items
						Model.AppCache.users.setMany(users);
	
						var newRows = createUsersRows(users, true);
						if (newRows.length > 0) {
							rows_array = rows_array.concat(newRows);
						}
						newRows = null;
					} else {
						_more = false;
					}
				} else {
					Model.eventDefaultErrorCallback(e);
				}
				endUpdate();
			});
		}
		else{
			var UsersModel = require('/lib/model/users');
			UsersModel.queryPages(condition, '-created_at', _page, _per_page, function(e) {
				if (e.success) {
					if (e.meta.total_results > 0) {
						_total_results = e.meta.total_results;
	
						if (e.meta.page < e.meta.total_pages) {
							_page += 1;
						}
						else{
							_more = false;
						}
						
						// cache items
						Model.AppCache.users.setMany(e.users);
	
						var newRows = createUsersRows(e.users, true);
						if (newRows.length > 0) {
							rows_array = rows_array.concat(newRows);
						}
						newRows = null
					} else {
						_more = false;
					}
				} else {
					Model.eventDefaultErrorCallback(e);
				}
				endUpdate();
			}); 
		}
	}
	
	var search = Ti.UI.createSearchBar({
		barColor: theme.barColor,
		hintText:'Search users...',
		showCancel:false
	});
	search.addEventListener('cancel', function(e){
		this.blur();
	});
	if(params.search_friends){
		search.addEventListener('return', function(searchEvent){
			this.blur();
			if(this.value !== '' && this.value.length > 0){
				//tableView.setData([loading_row]);
				
				startUpdate();
		
				var Model = require('/lib/model/model'),
					UsersModel = require('/lib/model/users');
				UsersModel.search(this.value, _page, _per_page, function(e) {
					if (e.success) {
						if (e.meta.total_results > 0) {
												
							// cache items
							Model.AppCache.users.setMany(e.users);
		
							var newRows = createUsersRows(e.users, true);
							if (newRows.length > 0) {
								rows_array = newRows.concat(rows_array);
							}
							newRows = null;
						}
					} else {
						Model.eventDefaultErrorCallback(e);
					}
					endUpdate();
				});
			}
		});
	}
	
	var tableView = Ti.UI.createTableView({
		top : isAndroid ? 50 : 0,
		left : 0,
		right : 0,
		width : Ti.UI.FILL,
		filterAttribute : 'filter',
		search:search,
		backgroundColor: 'transparent',
		style:isAndroid ? '' : Ti.UI.iPhone.TableViewStyle.PLAIN,
		separatorStyle: isAndroid ? '' : Ti.UI.iPhone.TableViewSeparatorStyle.NONE,
		footerView : Ti.UI.createView({height:0}),
		canRefreshNow:false,
		bubbleParent:false
	});
	
	var act_follow = Ti.UI.createActivityIndicator({
		left : '35%',
		top : 2,
		height : 'auto',
		width : 'auto',
		style : Ti.UI.iPhone.ActivityIndicatorStyle.DARK
	});
	act_follow.show(); 

	tableView.addEventListener('singletap', function(e) {
		if(e.row && e.row.user_id){
			if(params.selectionUsers){
				e.row.hasCheck = !e.row.hasCheck;
				
				var idx = params.selectionUsers.indexOf(e.row.user_id);
				if(e.row.hasCheck){
					if(idx === -1){
						params.selectionUsers.push(e.row.user_id);
					}
				}
				else{
					if(idx !== -1){
						params.selectionUsers.splice(idx, 1);
					}
				}
				Ti.App.Properties.setList('carely_addedAdminToGroup', params.selectionUsers);
			}
			else{
				if(this.clickTime && (new Date() - this.clickTime < 1000)){
					return false;
				}
				this.clickTime = new Date();
				
				if(e.source && e.source.clickName === 'follow'){
					
					e.source.title = '';
					e.source.add(act_follow);
					
					var FriendsModel = require('/lib/model/friends'),
						Model = require('/lib/model/model');
					if(e.source.backgroundImage === theme.buttonImage.grey.normal){
						FriendsModel.add(e.row.user_id, function(addEvent) {
							e.source.remove(act_follow);
							if (addEvent.success) {
								common.refreshHandler.setRefresh.following(true);
								common.refreshHandler.setRefresh.actions(true);
								common.refreshHandler.setRefresh.news(true);
								
								e.source.title = 'Following';
								e.source.backgroundImage = theme.buttonImage.green.normal;
								e.source.backgroundSelectedImage = theme.buttonImage.green.selected;
								
								if(e && e.row && e.row.user_action_suggestions){
									var my_carely_actions = Ti.App.Properties.getList('my_carely_actions', []);
									my_carely_actions = _.union(my_carely_actions, e.row.user_action_suggestions);
									Ti.App.Properties.setList('my_carely_actions', my_carely_actions);
									my_carely_actions = null;
								}
								
								var _following = [];
								if (currentUser && currentUser.custom_fields && currentUser.custom_fields.following) {
									_following = _following.concat(currentUser.custom_fields.following);
								}
								if (_following.indexOf(e.row.user_id) === -1) {
									_following.push(e.row.user_id);
	
									var UsersModel = require('/lib/model/users');
									UsersModel.update({
										custom_fields : {
											following : _following
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
									
									//Ti.App.fireEvent('following.handle', { following: e.row.user_id });
								}
								if (currentUser && currentUser.id && currentUser.id !== e.row.user_id && currentUser.username) {
									var funame = common.getUserDisplayName(currentUser);
									
									Ti.App.fireEvent('push.notify', {
										tags : [e.row.user_id + '_follow'],
										alert : funame + ' started following you!',
										custom_fields : {
											to_user_id : e.row.user_id,
											type:'follow'
										}
									});
								}
							} else {
								e.source.title = 'Follow';
	
								Model.eventDefaultCallback(addEvent);
							}
						});
					}
					else{
						FriendsModel.remove(e.row.user_id, function(removeEvent){
								e.source.remove(act_follow);
								if(removeEvent.success){
									common.refreshHandler.setRefresh.following(true);
									
									e.source.title = 'Follow';
									e.source.backgroundImage = theme.buttonImage.grey.normal;
									e.source.backgroundSelectedImage = theme.buttonImage.grey.selected;
									
									var _following = [];
									if(currentUser && currentUser.custom_fields && currentUser.custom_fields.following){
										_following = _following.concat(currentUser.custom_fields.following);
									}
									var follow_idx = _following.indexOf(e.row.user_id);
									if (_following.length > 0 && follow_idx !== -1) {
										_following.splice(follow_idx, 1);
										
										var UsersModel = require('/lib/model/users');
										UsersModel.update({
											custom_fields : {
												following : _following
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
											tags : [e.row.user_id + '_follow'],
											alert : funame + ' stopped following you!',
											custom_fields : {
												to_user_id : e.row.user_id,
												type:'follow'
											}
										});
									}
								}
								else{
									e.source.title = 'Follow';
									
									Model.eventDefaultCallback(removeEvent);
								}
							});
					}
				}
				else{
					var UserWindow = require('/ui/UserWindow');
					var userWindow = new UserWindow(e.row.user_id);
					require('/ui/MasterWindow').getNavGroup().open(userWindow);
				}
			}
		}		
	});
	
	var _usersFilter = null;
	if(params) {
		if(params.all_users){
			_usersFilter = null;
		}
		else if(params.user_ids){
			_usersFilter = {
				user_ids : params.user_ids
			};
		}
		else if(params.classname && params.object_id){
			_usersFilter = {
				classname : params.classname,
				object_id : params.object_id
			};
			if(params.review_type){
				_usersFilter.review_type = params.review_type;
			}
		}
		else if(params.condition){
			_usersFilter = params.condition;
		}
		else if(params.friends && params.user_id){
			_usersFilter = {
				friends : true,
				followers: params.followers !== undefined ? params.followers : false,
				user_id:params.user_id
			}
		}
	}
	
	tableView.addEventListener('scroll',function(e){
		if(_more === true && _updating === false && (e.contentOffset.y + e.size.height + 100 > e.contentSize.height)){
			tableView.canRefreshNow = true;
		}
	});
	
	tableView.addEventListener('scrollend', function(e) {
		if(e){
			e.cancelBubble = true;
		}
		
		var loading_new_data = 0;
		if(tableView.canRefreshNow){
			tableView.canRefreshNow = false;

			loading_new_data = 1;
			refreshUsers(_usersFilter, true);
		}
		
		require('/lib/analytics').trackEvent({
			category : 'users',
			action : 'scroll',
			label : 'load data',
			value : loading_new_data
		});
	});
	
	self.add(tableView);
	
	refreshUsers(_usersFilter, false);
	
	self.addEventListener('data.refresh', function(e){
		// currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
// 		
		// var common = require('/lib/common');
		// var refreshNow = common.refreshHandler.getRefresh.users();
		// 
		// if(refreshNow === true){
			// common.refreshHandler.setRefresh.users(false);
			// refreshUsers(_usersFilter, false);	
		// }
	});
	
	self.addEventListener('open', function(e){
		require('/lib/analytics').trackScreen({ screenName : 'Users Details' });
		
		require('/lib/analytics').trackEvent({
			category : 'users',
			action : self.title,
			label : null,
			value : null
		});
	});
	
	return self;
};

module.exports = UsersWindow;
