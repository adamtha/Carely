function UserWindow(_user_id) {
	var _ = require('/lib/underscore'),
		_s = require('/lib/underscore_strings'),
		theme = require('/ui/theme'),
		Model = require('/lib/model/model'),
		FriendsModel = require('/lib/model/friends'),
		moment = require('/lib/date/moment'),
		common = require('/lib/common'),
		ActionItemBox = require('/ui/ActionItemBox'),
		PostsModel = require('/lib/model/posts');
	
	var isAndroid = Ti.Platform.osname === 'android',
		currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null)),
		_user = null;
	if(currentUser && _user_id === undefined){
		_user_id = currentUser.id;
	}
	
	var self = Ti.UI.createWindow({
		title : '',
		navBarHidden : isAndroid,
		backgroundColor: theme.defaultBgColor,
		orientationModes : [Ti.UI.PORTRAIT],
		barColor : theme.barColor
	});
	
	if(currentUser && currentUser.id === _user_id){
		var settings_btn = Ti.UI.createButton({
			image:theme.images.gear
		});
		settings_btn.addEventListener('click', function(e){
			if(e){
				e.cancelBubble = true;
			}
			var SettingsWindow = require('/ui/SettingsWindow');
			var settingsWindow = new SettingsWindow();
			require('/ui/MasterWindow').getNavGroup().open(settingsWindow);
			
			require('/lib/analytics').trackEvent({
				category : 'settings',
				action : 'click',
				label : null,
				value : null
			});
		});
		self.rightNavButton = settings_btn;
	}
	else{
		var contacts_btn = Ti.UI.createButton({
			systemButton:Ti.UI.iPhone.SystemButton.ACTION
		});
		contacts_btn.addEventListener('click', function(e){
			if(e){
				e.cancelBubble = true;
			}
			showContactBar();
			
			require('/lib/analytics').trackEvent({
				category : 'contacts',
				action : 'click',
				label : null,
				value : null
			});
		});
		self.rightNavButton = contacts_btn;
	}
	
	var activeContacts = null;
	function showContactBar() {
		if (activeContacts) {
			var contact_options_dialog = {
				options : [],
				cancel : 0
			};
			if(currentUser && currentUser.admin === 'true' && currentUser.custom_fields && currentUser.custom_fields.show_admin_features !== false){
				var user_importance_value = 0;
				if(_user && _user.custom_fields && _user.custom_fields.importance){
					user_importance_value = _user.custom_fields.importance + 0;
				}
				if(user_importance_value < 0){
					user_importance_value = 0;
				}
				contact_options_dialog.options.push('Increase to ' + (user_importance_value + 1));
				if(user_importance_value > 0){
					contact_options_dialog.options.push('Decrease to ' + (user_importance_value - 1));
				}
				contact_options_dialog.options.push('Set influencer page');
			}
			if (activeContacts.email) {
				contact_options_dialog.options.push('Send Email');
			}
			if (activeContacts.phone_number) {
				contact_options_dialog.options.push('Call');
				contact_options_dialog.options.push('SMS');
			}
			if (activeContacts.facebook) {
				var fb = require('facebook');
				if(fb.loggedIn){
					contact_options_dialog.options.push('Facebook');
				}
			}
			if (contact_options_dialog.options.length === 0) {
				return;
			}
			contact_options_dialog.options.push('Cancel');
			contact_options_dialog.cancel = contact_options_dialog.options.length - 1;

			var contact_dialog = Ti.UI.createOptionDialog(contact_options_dialog);
			contact_dialog.addEventListener('click', function(dialogEvent) {
				var ev_name = contact_options_dialog.options[dialogEvent.index];
				require('/lib/analytics').trackEvent({
					category : 'contacts',
					action : 'options',
					label : ev_name,
					value : null
				});
				
				if(_s.startsWith(ev_name, 'Increase to ')){
					ev_name = 'Increase user rank';
				}
				else if(_s.startsWith(ev_name, 'Decrease to ')){
					ev_name = 'Decrease user rank';
				}
				
				var user_importance_value = 0;
				if(_user && _user.custom_fields && _user.custom_fields.importance){
					user_importance_value = _user.custom_fields.importance + 0;
				}
				if(user_importance_value < 0){
					user_importance_value = 0;
				}
				
				switch(ev_name) {
					case 'Send Email':
						// email
						var emailDialog = Ti.UI.createEmailDialog();
						if (!emailDialog.isSupported()) {
							Ti.UI.createAlertDialog({
								title : 'Error',
								message : 'Email not supported, please configure an account using the apple mail application'
							}).show();
							return;
						}
						emailDialog.setBarColor(theme.barColor);
						emailDialog.setSubject('Hi ' + activeContacts.username);
						emailDialog.setToRecipients([activeContacts.email]);
						emailDialog.setMessageBody('What would you like to say?');

						emailDialog.addEventListener('complete', function(emailEvent) {
							// switch(emailEvent.result){
							// case emailDialog.SENT:
							// break;
							// case emailDialog.SAVED:
							// break;
							// case emailDialog.CANCELLED:
							// break;
							// case emailDialog.FAILED:
							// break;
							// default:
							// break;
							// }
						});
						emailDialog.open();
						break;
					case 'SMS':
						// email
						Ti.Platform.openURL('sms:' + activeContacts.phone_number);
						break;
					case 'Call':
						// call
						Ti.Platform.openURL('tel:' + activeContacts.phone_number);
						break;
					case 'Facebook':
						// facebook
						var urlWebView = require('/lib/urlWebView');
						var urlWin = new urlWebView('http://m.facebook.com/' + activeContacts.facebook, activeContacts.username, null, false);
						require('/ui/MasterWindow').getNavGroup().open(urlWin);
						
						require('/lib/analytics').trackEvent({
							category : 'url',
							action : 'click',
							label : 'http://m.facebook.com/' + activeContacts.facebook,
							value : null
						});
						break;
					case 'Twitter':
						//twitter
						break;
					case 'Increase user rank':
						user_importance_value += 2;
					case 'Decrease user rank':
						user_importance_value -= 1;
						
						var UsersModel = require('/lib/model/users');
						UsersModel.update({
							user_id : _user_id,
							custom_fields : {
								importance : user_importance_value > 0 ? user_importance_value : 0
							}
						}, function(updateEvent) {
							if (updateEvent.success) {
								_user = updateEvent.users[0];

								Model.AppCache.users.set(updateEvent.users[0]);
							} else {
								Model.eventDefaultErrorCallback(updateEvent);
							}
						});
						break;
					case 'Set influencer page':
						var SetInfluencerWindow = require('/ui/SetInfluencerWindow');
						var setInfluencerWindow = new SetInfluencerWindow(_user_id, influencer_section.curr_influencer);
						require('/ui/MasterWindow').getNavGroup().open(setInfluencerWindow);
						break;
					default:
						break;
				}
			});
			contact_dialog.show();
		}
	}
	
	var header_view = Ti.UI.createView({
		height:Ti.UI.SIZE,
		width:Ti.UI.FILL,
		layout:'vertical'
	});
	
	var top_view = Ti.UI.createView({
		height:theme.borderedImage.big.height + 12,
		width: Ti.UI.FILL,
		backgroundColor: theme.subBarColor
	});
	header_view.add(top_view);
	
	var user_pic = Ti.UI.createImageView({
		image:theme.defaultIcons.user,
		width : theme.borderedImage.big.width,
		height : theme.borderedImage.big.height,
		left: 6,
		top: 6
	}); 
	top_view.add(user_pic);
	
	var following_row = Ti.UI.createTableViewRow({
		height:32,
		selectionStyle : Ti.UI.iPhone.TableViewCellSelectionStyle.NONE,
		className : 'Following_Row'
	});
	
	var following_row_view = Ti.UI.createView({
		height:Ti.UI.FILL,
		width:Ti.UI.FILL,
		layout:'horizontal'
	});
	following_row.add(following_row_view);
	
	var following_view = Ti.UI.createView({
		height:Ti.UI.FILL,
		width:'50%',
		layout:'horizontal',
		borderColor:theme.tableBorderColor,
		borderWidth:1,
		clickName : 'following'
	});
	following_row_view.add(following_view);
	
	var following_num = Ti.UI.createLabel({
		top:6,
		width:'30%',
		text:'0',
		color : theme.barColor,
		font : theme.defaultFontBold,
		textAlign:Ti.UI.TEXT_ALIGNMENT_RIGHT,
		total_results:0,
		clickName : 'following'
	});
	if(currentUser && currentUser.id === _user_id && currentUser.custom_fields && currentUser.custom_fields.following){
		following_num.text = currentUser.custom_fields.following.length.toString();
		following_num.total_results = currentUser.custom_fields.following.length;
	}
	following_view.add(following_num);
	
	var following_title = Ti.UI.createLabel({
		top:6,
		width:'70%',
		text:' Following',
		color : theme.textColor,
		font : theme.defaultFont,
		textAlign:Ti.UI.TEXT_ALIGNMENT_LEFT,
		clickName : 'following'
	});
	following_view.add(following_title);
	
	var followers_view = Ti.UI.createView({
		height:Ti.UI.FILL,
		width:'50%',
		layout:'horizontal',
		clickName : 'followers'
	});
	following_row_view.add(followers_view);
	
	var followers_num = Ti.UI.createLabel({
		top:6,
		width:'30%',
		text:'0',
		color : theme.barColor,
		font : theme.defaultFontBold,
		textAlign:Ti.UI.TEXT_ALIGNMENT_RIGHT,
		total_results:0,
		clickName : 'followers'
	});
	followers_view.add(followers_num);
	
	var followers_title = Ti.UI.createLabel({
		top:6,
		width:'70%',
		text:' Followers',
		color : theme.textColor,
		font : theme.defaultFont,
		textAlign:Ti.UI.TEXT_ALIGNMENT_LEFT,
		clickName : 'followers'
	});
	followers_view.add(followers_title);
	
	var following_btn_row = Ti.UI.createTableViewRow({
		height:32,
		selectionStyle : Ti.UI.iPhone.TableViewCellSelectionStyle.NONE,
		className : 'Following_Row'
	});
	
	var act_follow = Ti.UI.createActivityIndicator({
		left : '45%',
		top : 2,
		height : 'auto',
		width : 'auto',
		style : Ti.UI.iPhone.ActivityIndicatorStyle.DARK
	});
	act_follow.show();
	
	var following_btn = null, edit_profile_lbl = null;
	if(currentUser && currentUser.id === _user_id){
		following_btn_row.hasChild = true;
		edit_profile_lbl = Ti.UI.createLabel({
			top:8,
			width:Ti.UI.FILL,
			text:'Edit profile',
			color : theme.textColor,
			font : theme.defaultFont,
			textAlign:Ti.UI.TEXT_ALIGNMENT_CENTER,
			clickName : 'profile'
		});
		following_btn_row.add(edit_profile_lbl);
	}
	else{
		following_btn = Ti.UI.createButton({
			title:'Follow',
			top:4,
			bottom:4,
			height:Ti.UI.FILL,
			left:6,
			right:6,
			width:Ti.UI.FILL,
			font : theme.defaultFont,
			textAlign:Ti.UI.TEXT_ALIGNMENT_CENTER,
			backgroundImage : theme.buttonImage.grey.normal,
			backgroundSelectedImage : theme.buttonImage.grey.selected,
			style : Ti.UI.iPhone.SystemButtonStyle.PLAIN,
			clickName : 'follow'
		});
		if(currentUser && currentUser.custom_fields && currentUser.custom_fields.following &&
		   currentUser.custom_fields.following.indexOf(_user_id) > -1){
		   	following_btn.title = 'Following';
			following_btn.backgroundImage = theme.buttonImage.green.normal;
			following_btn.backgroundSelectedImage = theme.buttonImage.green.selected;
		}
		following_btn_row.add(following_btn);
	}
	
	function setFollowingData(){
		// FriendsModel.search(_user_id, null, null, 1, 1, function(e){
			// if(e.success){
				// if(e.meta && e.meta.total_results){
					// following_num.text = e.meta.total_results;
				// }
			// }
			// else{
				// Model.eventDefaultCallback(e);
			// }
		// });
		FriendsModel.search(_user_id, true, null, 1, 1, function(e){
			if(e.success){
				if(e.meta && e.meta.total_results){
					followers_num.total_results = e.meta.total_results;
					followers_num.text = e.meta.total_results.toString();
				}
			}
			else{
				Model.eventDefaultCallback(e);
			}
		});
	}
	
	setFollowingData();
	
	var following_table = Ti.UI.createTableView({
		data:[following_row, following_btn_row],
		top : 6,
		left : 6 + user_pic.left + user_pic.width,
		right : 6,
		borderColor: theme.tableBorderColor,
		//borderRadius: theme.defaultBorderRadius,
		backgroundColor: theme.tableBackgroundColor,
		scrollable : false,
		height : following_row.height + following_btn_row.height,
		bubbleParent:false
	});
	following_table.addEventListener('singletap', function(e){
		if(e){
			e.cancelBubble = true;
		}
		if(this.clickTime && (new Date() - this.clickTime < 1000)){
			return false;
		}
		this.clickTime = new Date();
		
		if(e && e.source && e.source.clickName){
			
			require('/lib/analytics').trackEvent({
				category : 'user',
				action : e.source.clickName,
				label : _user_id,
				value : e.source.clickName === 'follow' ? ((following_btn && following_btn.title === 'Follow') ? 1 : 0) : null
			});
				
			switch(e.source.clickName){
				case 'following':
					if(following_num.total_results){
						var UsersWindow = require('/ui/UsersWindow');
						var usersWindow = new UsersWindow({
							title : 'Following',
							friends:true,
							followers : false,
							user_id:_user_id
						});
						require('/ui/MasterWindow').getNavGroup().open(usersWindow);
					}
					break;
				case 'followers':
					if(followers_num.total_results){
						var UsersWindow = require('/ui/UsersWindow');
						var usersWindow = new UsersWindow({
							title : 'Followers',
							friends:true,
							followers : true,
							user_id:_user_id
						});
						require('/ui/MasterWindow').getNavGroup().open(usersWindow);
					}
					break;
				case 'profile':
					if(edit_profile_lbl){
						var ProfileWindow = require('/ui/ProfileWindow');
						var win = new ProfileWindow();
						require('/ui/MasterWindow').getNavGroup().open(win);
					}
					break;
				case 'follow':
					if(following_btn){
						following_btn.title = '';
						following_btn.add(act_follow);
						
						if(following_btn.backgroundImage === theme.buttonImage.grey.normal){
							FriendsModel.add(_user_id, function(addEvent){
								following_btn.remove(act_follow);
								if(addEvent.success){
									common.refreshHandler.setRefresh.following(true);
									common.refreshHandler.setRefresh.actions(true);
									common.refreshHandler.setRefresh.news(true);
									
									following_btn.title = 'Following';
									following_btn.backgroundImage = theme.buttonImage.green.normal;
									following_btn.backgroundSelectedImage = theme.buttonImage.green.selected;
									
									if(_user && _user.custom_fields && _user.custom_fields.suggesting_actions){
										var my_carely_actions = Ti.App.Properties.getList('my_carely_actions', []);
										my_carely_actions = _.union(my_carely_actions, _user.custom_fields.suggesting_actions);
										Ti.App.Properties.setList('my_carely_actions', my_carely_actions);
										my_carely_actions = null;
									}
									
									var _following = [];
									if(currentUser && currentUser.custom_fields && currentUser.custom_fields.following){
										_following = _following.concat(currentUser.custom_fields.following);
									}
									if (_following.indexOf(_user_id) === -1) {
										_following.push(_user_id);
										
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
										
										//Ti.App.fireEvent('following.handle', { following: _user_id });
									}
									if (currentUser && currentUser.id && currentUser.id !== _user_id && currentUser.username) {
										var funame = common.getUserDisplayName(currentUser);
										
										Ti.App.fireEvent('push.notify', {
											tags : [_user_id + '_follow'],
											alert : funame + ' started following you!',
											custom_fields : {
												to_user_id : _user_id,
												type:'follow'
											}
										});
									}
								}
								else{
									following_btn.title = 'Follow';
									Model.eventDefaultCallback(addEvent);
								}
							});
						}
						else{
							FriendsModel.remove(_user_id, function(removeEvent){
								following_btn.remove(act_follow);
								if(removeEvent.success){
									common.refreshHandler.setRefresh.following(true);
									
									following_btn.title = 'Follow';
									following_btn.backgroundImage = theme.buttonImage.grey.normal;
									following_btn.backgroundSelectedImage = theme.buttonImage.grey.selected;
									
									var _following = [];
									if(currentUser && currentUser.custom_fields && currentUser.custom_fields.following){
										_following = _following.concat(currentUser.custom_fields.following);
									}
									var follow_idx = _following.indexOf(_user_id);
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
									if (currentUser && currentUser.id && currentUser.id !== _user_id && currentUser.username) {
										var funame = common.getUserDisplayName(currentUser);
										
										Ti.App.fireEvent('push.notify', {
											tags : [_user_id + '_follow'],
											alert : funame + ' stopped following you!',
											custom_fields : {
												to_user_id : _user_id,
												type:'follow'
											}
										});
									}
								}
								else{
									following_btn.title = 'Following';
									
									Model.eventDefaultCallback(removeEvent);
								}
							});
						}	
					}					
					break;
				default:
					break;
			}
		}
	});
	top_view.add(following_table);
	
	var bio_view = Ti.UI.createView({
		top:0,
		left:0,
		right:0,
		height:20,
		backgroundColor: theme.subBarColor
	});
	header_view.add(bio_view);
	  
	var bio_text = Ti.UI.createLabel({
		text:'',
		color : theme.whiteFontColor,
		top : 0,
		left : 6,
		right: 6,
		height:'auto',
		font : theme.defaultFont,
		textAlign : Ti.UI.TEXT_ALIGNMENT_LEFT
	});
	bio_view.add(bio_text);
	
	var divider_view = Ti.UI.createView({
		backgroundColor : '#999',
		height : 1
	});
	header_view.add(divider_view);
	
	var suggestion_section = createStatsSection({ title: 'Activity suggestions' }),
		influencer_section = createStatsSection({ title: 'Linked Facebook page' });
	influencer_section.curr_influencer = null;
	
	function setActionSuggestions(_suggested_action_ids){
		if(_suggested_action_ids && _suggested_action_ids.length){
			
			suggestion_section.rows = [createLoadingRow()];
			endUpdate();
			
			var ActionsModel = require('/lib/model/actions');
			ActionsModel.queryPages({
				_id : {
					'$in' : _suggested_action_ids
				}
			}, 'name', 1, 100, function(queryEvent) {
				suggestion_section.rows = [];
				
				if (queryEvent.success) {
					if (queryEvent.meta.total_results > 0) {
						Model.AppCache.actions.setMany(queryEvent.events);
						
						var suggestion_rows = createStatRows(queryEvent.events, true);
						if(suggestion_rows && suggestion_rows.length){
							suggestion_section.rows = suggestion_rows;
						}
					}
				} else {
					Model.eventDefaultErrorCallback(queryEvent);
				}
				
				endUpdate();
			});
		}
	}
	
	function setInfluencers(_influencer){
		if(_influencer && _influencer.name){
			influencer_section.curr_influencer = _influencer;
			
			var influencerIcon = theme.images.facebook_icon;
			if(_influencer.picture && _influencer.picture.data && _influencer.picture.data.url && _influencer.picture.data.is_silhouette === false){
				influencerIcon = _influencer.picture.data.url
			}
			var influencer_row = createStatRow({
				icon:influencerIcon,
				name:_influencer.name
			});
			influencer_row.hasChild = false;
			influencer_row.influencer = true;
			
			influencer_section.rows = [influencer_row];
			
			endUpdate();
		}
	}
	
	var stats_top_view = Ti.UI.createView({
		height:42,
		width:Ti.UI.FILL,
		backgroundColor:theme.defaultBgColor,
		opacity:0.8
	});
	
	var activity_section = Ti.UI.createTableViewSection({
		headerView:stats_top_view
	});
	
	var stats_top_divider = Ti.UI.createView({
		top:0,
		height:1,
		width:Ti.UI.FILL,
		backgroundColor:'#111931'
	});
	stats_top_view.add(stats_top_divider);
			
	var stats_label = Ti.UI.createLabel({
		text:'Activity',
		top:10,
		left:10,
		color : theme.textColor,
		font : theme.defaultFontBold,
		textAlign : Ti.UI.TEXT_ALIGNMENT_LEFT
	});
	stats_top_view.add(stats_label);
	
	var stats_mode_view = Ti.UI.createView({
		top:3,
		right:10,
		height:32,
		width:80,
		//borderRadius:theme.defaultBorderRadius,
		//borderWidth:2,
		//borderColor:'#999',
		layout:'horizontal',
		selected_mode:null
	});
	stats_top_view.add(stats_mode_view);
	
	var stats_grid_view = Ti.UI.createView({
		height:Ti.UI.FILL,
		width:40
		//borderColor:'#999'
	});
	stats_grid_view.addEventListener('touchstart', function(e){
		stats_grid_view.backgroundColor = theme.tableSelectedValueColor;
	});
	stats_grid_view.addEventListener('touchend', function(e){
		stats_grid_view.backgroundColor = theme.defaultBgColor;
	});
	stats_grid_view.addEventListener('click', function(e){
		if(e){
				e.cancelBubble = true;
			}
		if(grid_icon.image === theme.images.list_off){
			grid_icon.image = theme.images.list_on;
			list_icon.image = theme.images.grid_off;
			
			list_query_params.event_id = undefined;
			tableView.separatorStyle = Ti.UI.iPhone.TableViewSeparatorStyle.SINGLE_LINE;
			stats_mode_view.selected_mode = 'grid';
			refreshStats(true);
			
			require('/lib/analytics').trackEvent({
				category : 'user',
				action : 'stats',
				label : stats_mode_view.selected_mode,
				value : null
			});
		}
	});
	stats_mode_view.add(stats_grid_view);
	
	var grid_icon = Ti.UI.createImageView({
		image : theme.images.list_on,
		width : 32,
		height : 32,
		//height : Ti.UI.FILL,
		left : 4,
		hires:true
	});
	stats_grid_view.add(grid_icon);
	
	var stats_list_view = Ti.UI.createView({
		height:Ti.UI.FILL,
		width:40
	});
	stats_list_view.addEventListener('touchstart', function(e){
		stats_list_view.backgroundColor = theme.tableSelectedValueColor;
	});
	stats_list_view.addEventListener('touchend', function(e){
		stats_list_view.backgroundColor = theme.defaultBgColor;
	});
	stats_list_view.addEventListener('click', function(e){
		if(e){
			e.cancelBubble = true;
		}
		if(list_icon.image === theme.images.grid_off){
			grid_icon.image = theme.images.list_off;
			list_icon.image = theme.images.grid_on;
			
			tableView.separatorStyle = Ti.UI.iPhone.TableViewSeparatorStyle.NONE;
			stats_mode_view.selected_mode = 'list';
			refreshActivity(true);
			
			require('/lib/analytics').trackEvent({
				category : 'user',
				action : 'stats',
				label : stats_mode_view.selected_mode,
				value : null
			});
		}
	});
	stats_mode_view.add(stats_list_view);
	
	var list_icon = Ti.UI.createImageView({
		image : theme.images.grid_off,
		width : 30,
		height : 32,
		left : 4,
		hires:true
	});
	stats_list_view.add(list_icon);
	
	var stats_bottom_divider = Ti.UI.createView({
		bottom:0,
		height:1,
		width:Ti.UI.FILL,
		backgroundColor:'#E0E0E0'
	});
	stats_top_view.add(stats_bottom_divider);
		
	function createLoadingRow(){
		var row = Titanium.UI.createTableViewRow({
			height:40,
			backgroundColor:theme.defaultBgColor
		});
		
		var act_Ind = Titanium.UI.createActivityIndicator({
			//left : 110,
			//top : 5,
			height : 'auto',
			width : 'auto',
			//message : 'Loading...',
			color : theme.textColor,
			font : theme.defaultFont,
			style : Titanium.UI.iPhone.ActivityIndicatorStyle.DARK
		});
		act_Ind.show();
		row.add(act_Ind);
		
		return row;
	}
	
	var loading_section = Ti.UI.createTableViewSection({
		headerView:Ti.UI.createView({
			height:0
		})
	});
	loading_section.rows = [createLoadingRow()];
	
	var _page = 1, _more = true, _updating = false;
	var tableView = Ti.UI.createTableView({
		data : [loading_section],
		backgroundColor : theme.tableBackgroundColor,
		separatorStyle : Ti.UI.iPhone.TableViewSeparatorStyle.SINGLE_LINE,
		scrollable : true,
		scrollsToTop:true,
		height : 'auto',
		headerView : header_view,
		footerView : Ti.UI.createView({height:0}),
		bubbleParent:false,
		canRefreshNow:false
	});
	
	function SetConversationTextValue(_row){
		if(!_row){
			return;
		}
		if(!_row.children){
			return;
		}
		
		var has_text = false,
			conversation_view = _.findWhere(_row.children, {view_type_id:'conversation_view'}),
			post_likes_view = _.findWhere(_row.children, {view_type_id:'post_likes_view'}),
			post_joining_view = _.findWhere(_row.children, {view_type_id:'post_joining_view'}),
			likes_text = null,
			comments_text = null,
			joining_text = null;
		
		if(conversation_view){
			likes_text = conversation_view.children[1];
			comments_text = conversation_view.children[2];
			joining_text = conversation_view.children[3];
		}
		else{
			if(post_likes_view){
				likes_text = post_likes_view.children[1];
			}
			if(post_joining_view){
				joining_text = post_joining_view.children[1];
			}
		}
		
		if(_row.totalLikes){
			var likes_txt = '';
			likes_txt = _row.totalLikes + ' Like';
			if(_row.totalLikes > 1){
				likes_txt += 's';
			}
			if(likes_text){
				likes_text.text = likes_txt;
				has_text = true;
			}
		}
		if(_row.totalComments){
			var comm_txt = '';
			if(has_text){
				comm_txt = ' \u00B7 ';
			}
			comm_txt += _row.totalComments + ' Comment';
			if(_row.totalComments > 1){
				comm_txt += 's';
			}
			if(comments_text){
				comments_text.text = comm_txt;
				has_text = true;
			}
			var footer_divider = _.findWhere(_row.children, {view_type_id:'footer_divider'});
			if(footer_divider && footer_divider.height === 0){
				footer_divider.height = 1;
			}
		}
		if(_row.totalJoins){
			var joins_txt = '';
			if(has_text && !post_joining_view){
				joins_txt += ' \u00B7 ';
			}
			joins_txt += _row.totalJoins + ' Joining';
			if(joining_text){
				joining_text.text = joins_txt;
				has_text = true;
			}
		}
		
		if(conversation_view){
			conversation_view.height = has_text ? Ti.UI.SIZE : 0;
		}
		else{
			if(post_likes_view){
				post_likes_view.height = _row.totalLikes ? Ti.UI.SIZE : 0;
			}
			if(post_joining_view){
				post_joining_view.height = _row.totalJoins ? Ti.UI.SIZE : 0;
			}
		}
		_row.height = 'auto';
	}
	
	function SetConversationValue(_row, _summ){
		_row.totalLikes = _summ.likes;
		_row.totalComments = _summ.comments;
		_row.totalJoins = _summ.joins;
		
		var footer_view = _.findWhere(_row.children, {view_type_id:'footer_view'});
		if(footer_view && footer_view.children){
			// share
			if(footer_view.children.length > 0 && footer_view.children[0] && footer_view.children[0].children[0]){
				footer_view.children[0].children[0].image = _row.user_join_id ? theme.images.news.do_it_on : theme.images.news.do_it_off;
			} 
			// like
			if(footer_view.children.length > 2 && footer_view.children[2] && footer_view.children[2].children[0]){
				footer_view.children[2].children[0].image = _row.user_like_id ? theme.images.news.like_on : theme.images.news.like_off;
			} 
			// comment
			if(footer_view.children.length > 3 && footer_view.children[4] && footer_view.children[4].children[0]){
				footer_view.children[4].children[0].image = _row.user_comment_id ? theme.images.news.comment_on : theme.images.news.comment_off;
			}
		}
		SetConversationTextValue(_row);
	}
	function addLikes(_row, _num){
		if(!_row){
			return;
		}
		if(!_row.children){
			return;
		}
		if(_num === 0){
			return;
		}
		
		_row.totalLikes += _num;
		if(_row.totalLikes < 0){
			_row.totalLikes = 0;
		}
		var footer_view = _.findWhere(_row.children, {view_type_id:'footer_view'});
		if(footer_view && footer_view.children && footer_view.children.length > 1 && footer_view.children[2] && footer_view.children[2].children[0]){
			footer_view.children[2].children[0].image = _num > 0 ? theme.images.news.like_on : theme.images.news.like_off;
		}
		
		SetConversationTextValue(_row);
	}
	function AddJoins(_row, _num){
		if(!_row){
			return;
		}
		if(!_row.children){
			return;
		}
		if(_num === 0){
			return;
		}
		
		_row.totalJoins += _num;
		if(_row.totalJoins < 0){
			_row.totalJoins = 0;
		}
		var footer_view = _.findWhere(_row.children, {view_type_id:'footer_view'});
		if(footer_view && footer_view.children && footer_view.children.length > 0 && footer_view.children[0] && footer_view.children[0].children[0]){
			footer_view.children[0].children[0].image = _num > 0 ? theme.images.news.do_it_on : theme.images.news.do_it_off;
		}
		
		SetConversationTextValue(_row);
	}
	
	tableView.addEventListener('singletap', function(e) {
		if(e){
			e.cancelBubble = true;
		}
		if(this.clickTime && (new Date() - this.clickTime < 1000)){
			return false;
		}
		this.clickTime = new Date();

		if (e && e.row) {
			
			require('/lib/analytics').trackEvent({
				category : 'news',
				action : analitics_action,
				label : e.row.post_id,
				value : null
			});
			
			if(e.row.influencer){
				
			}
			else if(e.row.stat_id){
				if(e.row.is_suggestion){
					var _action_item = Model.AppCache.actions.get(e.row.stat_id);
					if(_action_item){
						var CheckinWindow = require('/ui/CheckinWindow');
						var win = new CheckinWindow(e.row.stat_id, null, _user_id);
						require('/ui/MasterWindow').getNavGroup().open(win);
					}
					else{
						ActionsModel.show(e.row.action_id, function(showEvent){
							if(showEvent.success){
								Model.AppCache.actions.set(showEvent.events[0]);
								
								var CheckinWindow = require('/ui/CheckinWindow');
								var win = new CheckinWindow(e.row.stat_id, null, _user_id);
								require('/ui/MasterWindow').getNavGroup().open(win);
							}
							else{
								Model.eventDefaultErrorCallback(showEvent);
							}
						});
					}
				}
				else{
					list_query_params.event_id = e.row.stat_id;
					grid_icon.image = theme.images.list_off;
					list_icon.image = theme.images.grid_on;
							
					tableView.separatorStyle = Ti.UI.iPhone.TableViewSeparatorStyle.NONE;
					stats_mode_view.selected_mode = 'list';
					refreshActivity(true);
				}
			}
			else{
				if (e && e.source) {
					var focusComment = false;

					switch(e.source.clickName) {
						case 'user':
							// var u_id = e.row.user_id;
							// if(e.source.user_id){
								// u_id = e.source.user_id;
							// }
							// if(u_id !== _user_id){
								// var userWindow = new UserWindow(u_id);
								// require('/ui/MasterWindow').getNavGroup().open(userWindow);
							// }
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
						case 'like':
							if (e.row.user_like_id) {
								// unlike
								addLikes(e.row, -1);
								
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
		
											PostsModel.show(e.row.post_id, function(showEvent) {
												if (showEvent.success) {
													Model.AppCache.posts.set(showEvent.posts[0]);
		
													common.refreshHandler.setRefresh.news(true);
													common.refreshHandler.setRefresh.leaderboard(true);
		
													var summ = ReviewsModel.ReviewSummary(showEvent.posts[0]);
													SetConversationValue(e.row, summ);
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
										addLikes(e.row, 1);
										Model.eventDefaultErrorCallback(reviewEvent);
									}
								});
							} else {
								// like
								addLikes(e.row, 1);
								
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
		
										PostsModel.show(e.row.post_id, function(showEvent) {
											if (showEvent.success) {
												Model.AppCache.posts.set(showEvent.posts[0]);
		
												common.refreshHandler.setRefresh.news(true);
												common.refreshHandler.setRefresh.leaderboard(true);
		
												var summ = ReviewsModel.ReviewSummary(showEvent.posts[0]);
												SetConversationValue(e.row, summ);
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
										addLikes(e.row, -1);
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
								if(!action_options.options.length){
									break;
								}
								action_options.options.push('Cancel');
								action_options.cancel = action_options.options.length - 1;
								
								var action_dlg = Ti.UI.createOptionDialog(action_options);
								action_dlg.addEventListener('click', function(dialogEvent){
									if(dialogEvent.index !== dialogEvent.cancel){
										var addToMyActions = -1, checkin_type = null;
										var option_text = action_options.options[dialogEvent.index];
										if(option_text.indexOf('Join') === 0){
											option_text = 'Join';
										}
										else if(option_text.indexOf('Unjoin') === 0){
											option_text = 'Unjoin';
										}
										switch(option_text){
											case 'Do it':
												checkin_type = 0;
											case 'Plan it':
												if(checkin_type === null){
													checkin_type = 1;
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
												AddJoins(e.row, 1);
												
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
				
														PostsModel.show(e.row.post_id, function(showEvent) {
															if (showEvent.success) {
																Model.AppCache.posts.set(showEvent.posts[0]);
				
																common.refreshHandler.setRefresh.news(true);
																common.refreshHandler.setRefresh.leaderboard(true);
				
																var summ = ReviewsModel.ReviewSummary(showEvent.posts[0]);
																SetConversationValue(e.row, summ);
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
																		original_post_id:e.row.post_id,
																		original_classname:e.row.actionClassName,
																		original_poster_id:e.row.user_id,
																		original_poster:e.row.user_name,
																		intent:e.row.post_intent,
																		done:{
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
														AddJoins(e.row, -1);
														Model.eventDefaultErrorCallback(reviewEvent);
													}
												});
												break;
											case 'Unjoin':
												AddJoins(e.row, -1);
												
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
						
															PostsModel.show(e.row.post_id, function(showEvent) {
																if (showEvent.success) {
																	Model.AppCache.posts.set(showEvent.posts[0]);
						
																	common.refreshHandler.setRefresh.news(true);
																	common.refreshHandler.setRefresh.leaderboard(true);
						
																	var summ = ReviewsModel.ReviewSummary(showEvent.posts[0]);
																	SetConversationValue(e.row, summ);
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
														AddJoins(e.row, 1);
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
						case 'comments':
							if (e.source.totalComments && e.source.totalComments > 0) {
								var UsersWindow = require('/ui/UsersWindow');
								var usersWindow = new UsersWindow({
									title : 'Comments details',
									classname : e.row.actionClassName,
									object_id : e.row.post_id,
									review_type : 'comment'
								});
								require('/ui/MasterWindow').getNavGroup().open(usersWindow);
							}
							break;
						case 'comment':
							focusComment = true;
						default:
							if (e && e.row && e.row.post_id) {
								var actionItem = Model.AppCache.posts.get(e.row.post_id);
								if (!actionItem) {
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
								}
							}
							break;
					}
				}
			}
		}
	}); 
	
	tableView.addEventListener('scroll', function(e) {
		if(e){
			e.cancelBubble = true;
		}
		if (e.contentOffset.y + e.size.height + 100 > e.contentSize.height) {
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

			if (_more && _updating === false) {
				if(stats_mode_view && stats_mode_view.selected_mode){
					switch(stats_mode_view.selected_mode){
						case 'list':
							refreshActivity(false);
							loading_new_data = 1;
							break;
						case 'grid':
							refreshStats(false);
							loading_new_data = 1;
							break;
						default:
							break;
					}
				}
			}
		}
		
		require('/lib/analytics').trackEvent({
			category : 'news',
			action : 'scroll',
			label : 'load data',
			value : loading_new_data
		});
	});
	self.add(tableView);
	
	function createStatRow(_stat_item, _is_suggestion) {
		var _count = 0;
		if (_is_suggestion === false) {
			if (_user && _user.custom_fields) {
				var checkins_count_id = _stat_item.id + '_checkins';
				if (_user.custom_fields[checkins_count_id]) {
					_count += _user.custom_fields[checkins_count_id];
				}
			}
			if (_count === 0) {
				return null;
			}
		}

		var row = Ti.UI.createTableViewRow({
			hasChild : true,
			height : theme.borderedImage.user.height + 4,
			width : Ti.UI.FILL,
			stat_id : _stat_item.id,
			filter : _stat_item.name,
			stat_value : _count,
			is_suggestion : _is_suggestion,
			className : 'Stat_Row'
		});

		var actionIcon = theme.defaultIcons.action;
		if (_stat_item.photo && _stat_item.photo.urls && _stat_item.photo.urls.square_75) {
			actionIcon = _stat_item.photo.urls.square_75;
		}
		else if(_stat_item.icon){
			actionIcon = _stat_item.icon;
		}

		var stat_icon = Ti.UI.createImageView({
			image : actionIcon,
			width : theme.borderedImage.user.width,
			height : theme.borderedImage.user.height,
			left : 2,
			top : 2,
			bottom : 2,
			hires : true
		});
		row.add(stat_icon);

		var stat_name = Ti.UI.createLabel({
			text : _stat_item.name,
			color : theme.textColor,
			top : 10,
			left : stat_icon.left + stat_icon.width + 6,
			width : '70%',
			font : theme.defaultFontBold,
			textAlign : Ti.UI.TEXT_ALIGNMENT_LEFT
		});
		row.add(stat_name);

		if (_is_suggestion === false) {
			var stat_value = Ti.UI.createLabel({
				text : _count,
				width : '30%',
				color : theme.tableSelectedValueColor,
				top : 10,
				right : 10,
				font : theme.defaultFont,
				textAlign : Ti.UI.TEXT_ALIGNMENT_RIGHT
			});
			row.add(stat_value);
		}

		return row;
	}
	
	function createStatRows(_items, _is_suggestion) {
		var rows = [];
		if(_items && _items.length){
			for(var i=0, v=_items.length; i<v; i++){
				var row = createStatRow(_items[i], _is_suggestion);
				if(row){
					rows.push(row);
				}
			}
		}
		return rows;
	}

	function createStatsSection(_item) {
		var section_view = Ti.UI.createView({
			height : 42,
			width : Ti.UI.FILL,
			backgroundColor : theme.defaultBgColor,
			opacity : 0.8
		});
	
		var divider_top = Ti.UI.createView({
			top : 0,
			backgroundColor : '#111931',
			height : 1
		});
		section_view.add(divider_top);
	
		var header_lbl = Ti.UI.createLabel({
			text : _item.title,
			left : 10,
			top : 10,
			color : theme.textColor,
			font : theme.defaultFontBold,
			textAlign : Ti.UI.TEXT_ALIGNMENT_LEFT
		});
		section_view.add(header_lbl);
			
		var divider_bottom = Ti.UI.createView({
			bottom : 0,
			backgroundColor : '#E0E0E0',
			height : 1
		});
		section_view.add(divider_bottom);
	
		return Ti.UI.createTableViewSection({
			headerView : section_view
		});
	}
	
	function endUpdate(_append_loading) {
		var rows = [];
		if(suggestion_section && suggestion_section.rowCount){
			rows.push(suggestion_section);
		}
		if(influencer_section && influencer_section.rowCount){
			rows.push(influencer_section);
		}
		if(activity_section && activity_section.rowCount){
			rows.push(activity_section);
		}
		if(_append_loading){
			rows.push(loading_section);
		}
		tableView.setData(rows);
	}
	
	var _stat_ids = null, _suggested_action_ids = null;
	function refreshStats(_force){
		if(_stat_ids && _stat_ids.length){
			_updating = true;
			_more = true;
	
			if (_force) {
				_page = 1;
				activity_section.rows = [createLoadingRow()];
				endUpdate();
			}
			else{
				endUpdate(true);
			}

			var ActionsModel = require('/lib/model/actions');
			ActionsModel.queryPages({
				_id : {
					'$in' : _stat_ids
				}
			}, null, _page, 10, function(e) {
				if (_force) {
					activity_section.rows = [];
				}
				
				if (e.success) {
					if (e.meta.total_results > 0) {
						Model.AppCache.actions.setMany(e.events);

						var stat_rows = createStatRows(e.events, false);
						if(stat_rows && stat_rows.length){
							if (_page === 1) {
								activity_section.rows = stat_rows;
							} else {
								if (activity_section.rowCount) {
									activity_section.rows = activity_section.rows.concat(stat_rows);
								} else {
									activity_section.rows = stat_rows;
								}
							}
							stat_rows = null;
						}
						
						if(activity_section.rowCount){
							activity_section.rows.sort(function(a, b) {
								return b.stat_value - a.stat_value;
							});
						}
						
						if (e.meta.page < e.meta.total_pages) {
							_page += 1;
						}
						else{
							_more = false;
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
	}
	
	var list_query_params = {
		user_id : _user_id
		//title : {
		//	'$in' : [PostsModel.postTypes.checkin, PostsModel.postTypes.joins]
		//}
	};

	function createActivityRows(_items){
		var rows = [];
		if (_items && _items.length > 0) {
			for (var i = 0, l = _items.length; i < l; i++) {
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
	
	function refreshActivity(_force){
		_updating = true;
		_more = true;

		if (_force) {
			_page = 1;
			activity_section.rows = [createLoadingRow()];
			endUpdate();
		}
		else {
			endUpdate(true);
		}
		
		PostsModel.queryPages(list_query_params, '-updated_at', _page, 10, function(e) {
			if (_force) {
				activity_section.rows = [];
			}
			
			if (e.success) {
				if (e.meta.total_results > 0) {

					Model.AppCache.posts.setMany(e.posts);

					var newRows = createActivityRows(e.posts);
					if (newRows && newRows.length > 0) {
						if (_page === 1) {
							activity_section.rows = newRows;
						} else {
							if (activity_section.rowCount) {
								activity_section.rows = activity_section.rows.concat(newRows);
							} else {
								activity_section.rows = newRows;
							}
						}
						newRows = null;
					}
					
					if (e.meta.page < e.meta.total_pages) {
						_page += 1;
					}
					else{
						_more = false;
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
	
	var set_stats = true;
	function setUserDetails() {
		if (_user !== null) {
			var uname = common.getUserDisplayName(_user);
			
			if(uname){
				self.title = uname;
			}
			else{
				self.title = '';
			}
			
			var user_temp_pic = theme.defaultIcons.user;
			if (_user.photo && _user.photo.urls) {
				if(_user.photo.urls.square_75){
					user_temp_pic = _user.photo.urls.square_75;
				}
				else if(_user.photo.urls.original){
					user_temp_pic = _user.photo.urls.original;
				}
			}
			if(user_temp_pic === theme.defaultIcons.user && _user.custom_fields && _user.custom_fields.fb_user_id){
				user_temp_pic = 'https://graph.facebook.com/' + _user.custom_fields.fb_user_id + '/picture';
			}
			user_pic.applyProperties({
				image : user_temp_pic
			});
			user_temp_pic = null;
			
			if (_user.custom_fields) {
				if (_user.custom_fields.bio && _user.custom_fields.bio.length) {
					if(bio_text.text !== _user.custom_fields.bio){
						bio_text.text = _user.custom_fields.bio;
					
						var mw = require('/ui/MasterWindow').getMasterWindow();
						if (mw) {
							bio_text.visible = false;
					
							mw.add(bio_text);
							var imgBio = bio_text.toImage();
							bio_view.height = imgBio.height;
							mw.remove(bio_text);
							bio_text.visible = true;
							
							mw = null;
						}
					}
				}
				else{
					bio_text.text = '';
					bio_view.height = 0;
				}
				
				if(_user.custom_fields.following){
					following_num.text = _user.custom_fields.following.length.toString();
					following_num.total_results = _user.custom_fields.following.length.toString();
				}
				else{
					following_num.text = '0';
					following_num.total_results = 0;
				}
				
				activeContacts = {
					username : uname,
					email : _user.email
				};
				if(_user.custom_fields.share_contacts === true){
					if (_user.custom_fields.phone_number) {
						activeContacts.phone_number = _user.custom_fields.phone_number;
					}
					
					// TODO: same for twitter/facebook
					if(_user.external_accounts && _user.external_accounts.length > 0){
						for (var i = 0, v = _user.external_accounts.length; i < v; i++) {
							if (_user.external_accounts[i].external_id && 
								_user.external_accounts[i].external_type === 'facebook') {
									activeContacts.facebook = _user.external_accounts[i].external_id;
								break;
							}
						}
					}
				}
				
				if(_user.custom_fields.influencer_json){
					setInfluencers(_user.custom_fields.influencer_json);
				}
				// if (_user.custom_fields.total_joins && _user.custom_fields.total_joins.length > 0) {
					// joins_num.text = _user.custom_fields.total_joins.length.toString();
					// joins_icon.image = theme.images.join;
				// } else {
					// joins_num.text = '0';
					// joins_icon.image = theme.images.join_off;
				// }
				// if (_user.custom_fields.total_likes && _user.custom_fields.total_likes.length > 0) {
					// likes_num.text = _user.custom_fields.total_likes.length.toString();
					// likes_icon.image = theme.images.like_on;
				// } else {
					// likes_num.text = '0';
					// likes_icon.image = theme.images.like_off;
				// }
				// if (_user.custom_fields.total_comments && _user.custom_fields.total_comments.length > 0) {
					// comments_num.text = _user.custom_fields.total_comments.length.toString();
					// comments_icon.image = theme.images.chat;
				// } else {
					// comments_num.text = '0';
					// comments_icon.image = theme.images.chat_off;
				// }
			}
		}

		//header_view.height = Ti.UI.SIZE;
		//tableView.height = 'auto';
		
		if(set_stats){
			set_stats = false;
			var dic = {}, actions_arr = [];
			for (var k in _user.custom_fields) {
				if (_user.custom_fields.hasOwnProperty(k)) {
					var j = k.split('_');
					if (j && j.length === 2 && (j[1] === 'checkins')) {
						if (!dic[j[0]]) {
							dic[j[0]] = 0;
						}
						dic[j[0]] += _user.custom_fields[k];
					}
				}
			}
			for (var k in dic) {
				actions_arr.push({
					id : k,
					val : dic[k]
				});
			}
			dic = null;
			
			if (actions_arr.length > 0) {
				actions_arr.sort(function(a, b) {
					return b.val - a.val;
				});
				
				_stat_ids = _.pluck(actions_arr, 'id');
				actions_arr = null;
				
				grid_icon.image = theme.images.list_on;
				list_icon.image = theme.images.grid_off;
				
				list_query_params.event_id = undefined;
				tableView.separatorStyle = Ti.UI.iPhone.TableViewSeparatorStyle.SINGLE_LINE;
				stats_mode_view.selected_mode = 'grid';
				refreshStats(true);
			}
			
			if(_user && _user.custom_fields){
				if(_user.custom_fields.suggesting_actions && 
				   _user.custom_fields.suggesting_actions.length){
				   	setActionSuggestions(_user.custom_fields.suggesting_actions);
				}
			}
		}
	}
	
	function userEventHandler(e) {
		if (e.success) {
			_user = e.users[0];
			Model.AppCache.users.set(_user);
			setUserDetails();
		} else {
			Model.eventDefaultErrorCallback(e);
		}
	}

	function fetchUser(){
		contact_options_dialog = {
			cancel : 1
		};
		if (isAndroid) {
			contact_options_dialog.buttonNames = ['Send Email', 'Cancel'];
			contact_options_dialog.selectedIndex = 1;
		} else {
			contact_options_dialog.options = ['Send Email', 'Cancel'];
		}
		
		_user = Model.AppCache.users.get(_user_id);
		if(_user){
			setUserDetails();
		}
		else{
			var UsersModel = require('/lib/model/users');
			if(currentUser && currentUser.id === _user_id){
				UsersModel.current(userEventHandler);
			}
			else{
				UsersModel.get(_user_id, userEventHandler);
			}
		}
	}
	
	self.addEventListener('focus', function(e){
		if(Ti.App.Properties.getBool('carely_goToHome', false) === true){
			require('/ui/MasterWindow').getNavGroup().close(this, {animated:false});
		}
		else{
			fetchUser();
			
			require('/lib/analytics').trackScreen({ screenName : 'User Details' });
			
			require('/lib/analytics').trackEvent({
				category : 'user',
				action : 'show',
				label : _user_id,
				value : null
			});
		}
	});
	
	return self;
};

module.exports = UserWindow;
