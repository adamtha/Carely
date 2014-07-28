(function(){
	function handleGEO(e){
		Ti.App.Properties.setBool('CarelyGeoEnabled', false);
		
		var _message = null, geoEnabled = false;
		if(Ti.Geolocation.locationServicesEnabled){
			var authorization = Ti.Geolocation.locationServicesAuthorization;
			if (authorization === Ti.Geolocation.AUTHORIZATION_DENIED || authorization === Ti.Geolocation.AUTHORIZATION_RESTRICTED) {
				_message = 'Carely needs permission to show you nearby activities';
			}
			else{
				geoEnabled = true;
			}
		}
		if (geoEnabled === false) {
			var common = require('/lib/common');
			common.showMessageWindow(_message, 200, 200, 3000);
		}
		else{
			Ti.App.Properties.setBool('CarelyGeoEnabled', true);
			Ti.Geolocation.getCurrentPosition(function(geoEvent){
			});
		}
	}
	Ti.App.addEventListener('geo.handle', handleGEO);
    
	function shareOnFacebook(e){
		var facebookModule = require('facebook'),
			common = require('/lib/common');
		facebookModule.appid = common.FACEBOOK_APP_ID;
		facebookModule.permissions = common.FACEBOOK_APP_PERMISSIONS;
		facebookModule.forceDialogAuth = false;
		
		// // User and Friends
		// 'email', 
		// 'user_likes', 
		// 'user_groups',
		// // Extended
		// 'read_stream', 
		// 'publish_stream',
		// // Open Graph
		// 'publish_actions', 
		// 'user_actions:carelyactions', 
		// 'friends_actions:carelyactions'	
		
		if(e && e.post_id && facebookModule.loggedIn){
			facebookModule.reauthorize(['publish_actions'], 'me', function(authEvent){
				if (authEvent.success) {
					var data = {
						//'message' : e.message ? e.message : '',
						'activity' : 'http://carely.herokuapp.com/activity?postid=' + e.post_id,
						'fb:explicitly_shared':'true',
						'ref':e.ref
					};
					if (e.picture) {
						// data = {
							// 'message' : e.message,
							// 'activity' : 'http://carely.herokuapp.com/activity?postid=' + e.post_id,
							// 'fb:explicitly_shared' : 'true',
							// 'image[0][url]' : e.picture,
							// 'image[0][user_generated]' : 'true'
						// }
					}
					
					var action_url = 'me/carelyactions:';
					if(e.upcoming && e.start_time && e.end_time){
						action_url += 'plan';
						data['start_time'] = e.start_time;
						data['end_time'] = e.end_time;
					}
					else{
						action_url += 'checkin';
					}
					facebookModule.requestWithGraphPath(action_url, data, 'POST', function(fbEvent) {
						if (fbEvent.success) {

							require('/lib/analytics').trackSocial({
								network : 'facebook',
								action : 'share',
								target : e.post_id
							});

					    } else {
					    	var err_msg = 'Could not post check-in to facebook!';
					        if (fbEvent.error) {
					        	err_msg = fbEvent.error;
					        }
					        require('/lib/model/model').eventDefaultErrorCallback({
					        	message : err_msg,
					        	type : 'Facebook checkin',
					        	post_data : data
					        });
					    }
					});
				}
				else{
					if(authEvent.error){
						alert(authEvent.error);
					}
				}
			});
		}
	}
	Ti.App.addEventListener('posts.share', shareOnFacebook);
	
	function notifyPush(e){
		if(e){
			if(e.alert && e.custom_fields && e.custom_fields.to_user_id && e.custom_fields.type){
				var ChatsModel = require('/lib/model/chats');
				e.custom_fields.chat_type = 'notification';
				ChatsModel.create(e.custom_fields.to_user_id, e.alert, e.custom_fields, function(chatEvent){
					require('/lib/analytics').trackEvent({
						category : 'notifications',
						action : 'menu',
						label : e.alert,
						value : null
					});
					// if(chatEvent.success){
					// }
					// else{
						// require('/lib/model/model').eventDefaultErrorCallback(chatEvent);
					// }
				});
			}
			
			if(e.alert && (e.device_tokens || e.aliases || e.tags)){
				var NotificationsModel = require('/lib/model/notifications');
				var custom_data = null;
				if(e.custom_fields){
					if(e.custom_fields.post_id && e.custom_fields.actionClassName){
						custom_data = {post_id:e.custom_fields.post_id};
					}
					else if(e.custom_fields.type === 'follow' && e.custom_fields.to_user_id){
						custom_data = {user_id:e.custom_fields.to_user_id};
					}
					else if(e.custom_fields.type === 'suggest' && e.custom_fields.suggestion_id){
						custom_data = {suggestion_id:e.custom_fields.suggestion_id};
					}
				}
				NotificationsModel.notify(e.device_tokens, e.aliases, e.tags, e.badge, e.alert, custom_data, function(notifyEvent) {
					// if (notifyEvent.success) {
// 						
					// }
					 // else {
						// require('/lib/model/model').eventDefaultErrorCallback(notifyEvent);
					// }
				});
			}
		}
	}
	Ti.App.addEventListener('push.notify', notifyPush);
	
	function pushHandler(e) {
		try{
			if(Ti.UI.iPhone.appBadge && Ti.UI.iPhone.appBadge > 0){
				Ti.UI.iPhone.appBadge--;
			}
		}
		catch(err){}
		
		if (e && e.data && e.data.post_id) {
			function openActionItemWindow(_post_id, _focusComment, _actionClassName) {
				var ActionItemWindow = require('/ui/ActionItemWindow');
				var post_window = new ActionItemWindow(_post_id, _focusComment, _actionClassName);
				require('/ui/MasterWindow').getNavGroup().open(post_window);
			}
			
			var Model = require('/lib/model/model');
			var actionItem = Model.AppCache.posts.get(e.data.post_id);
			if (!actionItem) {
				var PostsModel = require('/lib/model/posts');
				PostsModel.show(e.data.post_id, function(showEvent) {
					if (showEvent.success) {
						Model.AppCache.posts.set(showEvent.posts[0]);

						openActionItemWindow(showEvent.posts[0].id, false, showEvent.posts[0].title);
					} else {
						Model.eventDefaultErrorCallback(showEvent);
					}
				});
			} else {
				openActionItemWindow(actionItem.id, false, actionItem.title);
			}
		} else if (e && e.data && e.data.user_id) {
			var UserWindow = require('/ui/UserWindow');
			var userWindow = new UserWindow(e.data.user_id);
			require('/ui/MasterWindow').getNavGroup().open(userWindow);
		} else if (e && e.data && e.data.suggestion_id) {
			var mw = require('/ui/MasterWindow');
			if(mw.getActionsButton()){
				mw.getActionsButton().fireEvent('click');
			}
		}
	}
	Ti.App.addEventListener('push.handle', pushHandler);
	
	function updateListTagPostsCount(e){
		if(e && e.id){
			var PostsModel = require('/lib/model/posts'),
				Model = require('/lib/model/model');
			PostsModel.queryPages({
				tags_array : 'list_tag_' + e.id
			}, null, 1, 1, function(queryEvent) {
				if(queryEvent.success){
					if (queryEvent.meta.total_results > 0) {
						var ObjectsModel = require('/lib/model/objects');
						ObjectsModel.update(ObjectsModel.classNames.tag_lists, e.id, {
							total_posts : queryEvent.meta.total_results
						}, null, null, function(updateEvent) {
							if (updateEvent.success) {
								if (updateEvent[ObjectsModel.classNames.tag_lists] && updateEvent[ObjectsModel.classNames.tag_lists][0]) {
									//Ti.App.Properties.setString('List_tag', JSON.stringify(updateEvent[ObjectsModel.classNames.tag_lists][0]));
								}
							} else {
								Model.eventDefaultCallback(updateEvent);
							}
						});
					}
				}
				else{
					Model.eventDefaultErrorCallback(queryEvent);
				}
			});
		}
	}
	Ti.App.addEventListener('lists.update_posts_count', updateListTagPostsCount);
	
	function updateListTagUsersCount(e){
		if(e && e.id){
			var UsersModel = require('/lib/model/users'),
				Model = require('/lib/model/model');
			UsersModel.queryPages({
				'[CUSTOM_tag_list]list_tag_id' : e.id
			}, null, 1, 1, function(queryEvent) {
				if(queryEvent.success){
					if (queryEvent.meta.total_results > 0) {
						var ObjectsModel = require('/lib/model/objects');
						ObjectsModel.update(ObjectsModel.classNames.tag_lists, e.id, {
							total_users : queryEvent.meta.total_results
						}, null, null, function(updateEvent) {
							if (updateEvent.success) {
								if (updateEvent[ObjectsModel.classNames.tag_lists] && updateEvent[ObjectsModel.classNames.tag_lists][0]) {
									//Ti.App.Properties.setString('List_tag', JSON.stringify(updateEvent[ObjectsModel.classNames.tag_lists][0]));
								}
							} else {
								Model.eventDefaultCallback(updateEvent);
							}
						});
					}
				}
				else{
					Model.eventDefaultErrorCallback(queryEvent);
				}
			});
		}
	}
	Ti.App.addEventListener('lists.update_users_count', updateListTagUsersCount);
	
	Ti.App.addEventListener('pause', function(e) {
		Ti.App.Properties.setBool('carely_running', false);

		Ti.App.removeEventListener('push.notify', notifyPush);
		Ti.App.removeEventListener('push.handle', pushHandler);
		Ti.App.removeEventListener('geo.handle', handleGEO);
		Ti.App.removeEventListener('lists.update_posts_count', updateListTagPostsCount);
		Ti.App.removeEventListener('lists.update_users_count', updateListTagUsersCount);
		
		Ti.App.removeEventListener('posts.share', shareOnFacebook);
	});
	Ti.App.addEventListener('resume', function(e) {
		Ti.App.Properties.setBool('carely_running', true);
		Ti.App.Properties.setBool('carely_news_restart', true);
		Ti.App.Properties.setBool('carely_just_loggedin', false);
		Ti.App.Properties.setBool('carely_following_restart', true);
		Ti.App.Properties.setBool('carely_menu_restart', true);

		Ti.App.addEventListener('push.notify', notifyPush);
		Ti.App.addEventListener('push.handle', pushHandler);
		Ti.App.addEventListener('geo.handle', handleGEO);
		Ti.App.addEventListener('lists.update_posts_count', updateListTagPostsCount);
		Ti.App.addEventListener('lists.update_users_count', updateListTagUsersCount);
		
		Ti.App.addEventListener('posts.share', shareOnFacebook);
	});
})();
