function MenuWindow(navGroup, menuButton, actionsButton) {
	var theme = require('/ui/theme'),
		ui = require('/ui/components'),
		common = require('/lib/common'),
		Model = require('/lib/model/model'),
		ChatsModel = require('/lib/model/chats'),
		moment = require('/lib/date/moment');
	
	var isAndroid = Ti.Platform.osname === 'android';
	
	var self = Ti.UI.createWindow({
		top:   0,
		left:  0,
		width: Ti.Platform.displayCaps.platformWidth - 50,
		zIndex: 1,
		backgroundImage:theme.images.rowBox.menu,
		orientationModes : [Ti.UI.PORTRAIT],
		navBarHidden:true,
		tabBarHidden:true
	});
	
	var tableDefaultHeight = 40;
	function createMenuSection(_items){
		var rows = [];
		if(_items && _items.length > 0){
			for(var i=0, v=_items.length; i<v; i++){
				
				var row = Ti.UI.createTableViewRow({
					hasChild: false,
					height : tableDefaultHeight,
					width : 'auto',
					backgroundImage:theme.images.rowBox.menu,
					className : 'Menu_Row',
					rowTitle: _items[i].title,
					winType: _items[i].winType,
					winTransition : _items[i].transition,
					isWin:_items[i].isWin
				});
				
				if(_items[i].icon){
					var icon = Ti.UI.createImageView({
						image:_items[i].icon,
						width : 20,
						height : 20,
						top:10,
						left:10,
						hires:true
					});
					
					row.add(icon);
				}
				
				if(_items[i].title){
					var name = Ti.UI.createLabel({
						text:_items[i].title,
						color: theme.menuFontColor,
						top:10,
						left:50,
						font: theme.defaultFontBold,
						textAlign : Ti.UI.TEXT_ALIGNMENT_LEFT
					});
					row.add(name);	
				}
				
				rows.push(row);
			}
		}
		
		return Ti.UI.createTableViewSection({
			rows:rows
		})
	}
	
	var _data = [
		{title:'Explore lists', icon: theme.images.menuIcons.explore, winType:'/ui/TagListsWindow', isWin:true, transition:Ti.UI.iPhone.AnimationStyle.FLIP_FROM_RIGHT },
		{title:'Add Friends', icon: theme.images.menuIcons.add_friends, winType:'/ui/FindFriendsWindow', isWin:true },
		{title:'Send feedback', icon: theme.images.menuIcons.feedback, winType:'/ui/FeedbackWindow', isWin:true },
		{title:L('settings', 'Settings'), icon: theme.images.menuIcons.settings, winType:'/ui/SettingsWindow', isWin:true }
	];
	Ti.App.Properties.setBool('carely_groups_refresh', true);
	
	function createUserMenuSection(_user){
		var username = common.getUserDisplayName(_user);
		
		var row = Ti.UI.createTableViewRow({
			hasChild : false,
			height : tableDefaultHeight,
			width : 'auto',
			backgroundImage : theme.images.rowBox.menu,
			className : 'Menu_Row',
			rowTitle : username,
			isUserRow : true,
			winType : '/ui/UserWindow',
			isWin : true
		}); 
		
		var userIcon = theme.defaultIcons.user;
		if (_user.photo && _user.photo.urls && _user.photo.urls.square_75) {
			userIcon = _user.photo.urls.square_75;
		}

		var icon = Ti.UI.createImageView({
			image:userIcon,
			width : 30,
			height : 30,
			top:5,
			left:10,
			hires:true
		});
		row.add(icon);

		var name = Ti.UI.createLabel({
			text : username,
			color : theme.menuFontColor,
			top : 10,
			left : 50,
			font : theme.defaultFontBold,
			textAlign : Ti.UI.TEXT_ALIGNMENT_LEFT
		});
		row.add(name);

		return Ti.UI.createTableViewSection({
			rows:[row]
		});
	}
	
	var menu_section = createMenuSection(_data);
	
	var sectionMessagesView = Ti.UI.createView({
		height : tableDefaultHeight,
		width : 'auto',
		backgroundImage : theme.images.rowBox.menuDark,
		className : 'Menu_Row'
	});
	var sectionMessagesViewName = Ti.UI.createLabel({
		text : 'Notifications',
		color : theme.menuFontColor,
		top : 10,
		left : 10,
		font : theme.defaultFontBold,
		textAlign : Ti.UI.TEXT_ALIGNMENT_LEFT
	});
	sectionMessagesView.add(sectionMessagesViewName);
	
	var sectionMessagesViewRefresh = Ti.UI.createImageView({
		image:theme.images.menuIcons.refresh,
		top:10,
		right:10,
		height:20,
		width:20,
		hires:true,
		clickName:'refresh_notifications',
		bubbleParent:false
	});
	sectionMessagesViewRefresh.addEventListener('singletap', function(e){
		if(e){
			e.cancelBubble = true;
		}
		refreshNotifications();
	});
	sectionMessagesView.add(sectionMessagesViewRefresh);
	
	var sectionMessages = Ti.UI.createTableViewSection({
		headerView : sectionMessagesView,
		className : 'Menu_Row'
	});
	
	function createList_tagSection(_list_tag){

		var row = Ti.UI.createTableViewRow({
			hasChild : false,
			height : tableDefaultHeight,
			width : 'auto',
			backgroundImage : theme.images.rowBox.menu,
			className : 'Menu_Row',
			rowTitle : _list_tag.name,
			isListTagRow : true,
			winType : '/ui/EditTagListWindow',
			isWin : true
		});

		var icon = Ti.UI.createImageView({
			image : theme.images.menuIcons.edit,
			width : 20,
			height : 20,
			top : 10,
			left : 10,
			hires : true
		});

		row.add(icon);

		var name = Ti.UI.createLabel({
			text : _list_tag.name,
			color : theme.menuFontColor,
			top : 10,
			left : 50,
			font : theme.defaultFontBold,
			textAlign : Ti.UI.TEXT_ALIGNMENT_LEFT
		});
		row.add(name);

		return Ti.UI.createTableViewSection({
			rows : [row]
		});
	}
	
	function getTableData(){
		var all_sections = [];
		
		var currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
		if (currentUser) {
			var user_section = createUserMenuSection(currentUser);
			if (user_section) {
				all_sections.push(user_section);
			}
			
			if(currentUser && currentUser.admin === 'true' && currentUser.custom_fields && currentUser.custom_fields.show_admin_features !== false){
				var List_tag = JSON.parse(Ti.App.Properties.getString('List_tag', null));
				if(List_tag && List_tag.id && List_tag.name && !List_tag.all_activities){
					var List_tag_section = createList_tagSection(List_tag);
					if(List_tag_section){
						all_sections.push(List_tag_section);
					}
				}
			}
			
			if(currentUser.id && (last_notifications_check === null || moment().diff(last_notifications_check, 'minutes') > 4)){
				refreshNotifications(); 
			}
		}
		
		if(menu_section){
			all_sections.push(menu_section);
		}
		if(sectionMessages){
			all_sections.push(sectionMessages);
		}
		
		return all_sections;
	}
	
	var navTable = Ti.UI.createTableView({
		data : getTableData(),
		top : 0,
		left : 0,
		right : 0,
		width : 'auto',
		backgroundColor: 'transparent',
		style:Ti.UI.iPhone.TableViewStyle.PLAIN,
		separatorStyle: Ti.UI.iPhone.TableViewSeparatorStyle.NONE,
		hasUser:false,
		canNavigateWindows:true,
		bubbleParent:false,
		scrollsToTop:false
	});
	self.add(navTable);
	
	navTable.addEventListener('click', function(e){
		if(e){
			e.cancelBubble = true;
		}
		if(navTable.canNavigateWindows === false){
			return false;
		}
		if(e && e.source && e.source.clickName === 'refresh_notifications'){
			refreshNotifications();
		}
		else if(e.row && e.row.is_notification){
			if(e.row.follower_id){
				menuButton.fireEvent('click');
				
				var UserWindow = require('/ui/UserWindow');
				var userWindow = new UserWindow(e.row.follower_id);
				require('/ui/MasterWindow').getNavGroup().open(userWindow);
			}
			else if(e.row.suggestion_id){
				menuButton.fireEvent('click');
				actionsButton.fireEvent('click');
			}
			else if(e.row.post_id && e.row.actionClassName){
				var actionItem = Model.AppCache.posts.get(e.row.post_id);
				if (!actionItem) {
					var PostsModel = require('/lib/model/posts');
					PostsModel.show(e.row.post_id, function(showEvent) {
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
	
				function openActionItemWindow(_post_id, _focusComment, _actionClassName) {
					menuButton.fireEvent('click');
					
					var ActionItemWindow = require('/ui/ActionItemWindow');
					var post_window = new ActionItemWindow(_post_id, _focusComment, _actionClassName);
					require('/ui/MasterWindow').getNavGroup().open(post_window);
				}
			}
		}
		else if(e.row.rowTitle && e.row.winType){

			menuButton.fireEvent('click');
			
			var currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
			if (e.row.isUserRow) {
				if (currentUser && currentUser.id) {
					Model.AppCache.users.del(currentUser.id);
				}
			}

			var wType = require(e.row.winType);
			if(wType){
				if (e.row.isWin === false) {
					navGroup.open(Ti.UI.createWindow({
						navBarHidden : false,
						title : e.row.rowTitle,
						barColor : theme.barColor,
						backgroundColor : theme.winBgColor,
						orientationModes : [Ti.UI.PORTRAIT]
					}).add(new wType()));
				} else {
					if(e.row.winTransition){
						new wType().open({modal:true,transition:Ti.UI.iPhone.AnimationStyle.CURL_UP});
					}
					else{
						navGroup.open(new wType());
					}
				}
				navTable.canNavigateWindows = false;
			}
		}
	});
	
	function createNotificationMenuRows(_items){
		var rows = null;
		if (_items && _items.length > 0) {
			for (var i = 0, v = _items.length; i < v; i++) {
				if(_items[i].message){
					var row = Ti.UI.createTableViewRow({
						hasChild : false,
						height : 'auto',
						width : 'auto',
						backgroundImage : theme.images.rowBox.menu,
						className : 'Menu_Row',
						is_notification : true,
						bottom:5
					}); 
					if(_items[i].custom_fields && _items[i].custom_fields.type === 'follow' && _items[i].from && _items[i].from.id){
						row.follower_id =  _items[i].from.id;
					}
					
					if(_items[i].custom_fields && _items[i].custom_fields.post_id){
						row.post_id = _items[i].custom_fields.post_id;
						
						if(_items[i].custom_fields.actionClassName){
							row.actionClassName = _items[i].custom_fields.actionClassName;
						}
						else{
							continue;
						}
					}
					
					if(_items[i].custom_fields && _items[i].custom_fields.suggestion_id){
						row.suggestion_id = _items[i].custom_fields.suggestion_id;
					}
					
					var userIcon = theme.defaultIcons.user;
					if (_items[i].from.photo && _items[i].from.photo.urls && _items[i].from.photo.urls.square_75) {
						userIcon = _items[i].from.photo.urls.square_75;
					}
					
					var icon = new ui.ImageViewBordered(userIcon, {
						width : 30,
						height : 30,
						left : 5,
						top : 5,
						hires:true
					});
					row.add(icon);
					
					var content_view = Ti.UI.createView({
						height:Ti.UI.SIZE,
						width:Ti.UI.FILL,
						top : 2,
						left : icon.left + icon.width + 6,
						layout:'vertical'
					});
					row.add(content_view);
					
					var name = Ti.UI.createLabel({
						text : _items[i].message,
						color : theme.menuFontColor,
						top : 0,
						left : 0,
						font : theme.defaultToolTipFont,
						textAlign : Ti.UI.TEXT_ALIGNMENT_LEFT,
						width : Ti.UI.FILL,
						height : Ti.UI.SIZE
					});
					content_view.add(name);
					
					var date = Ti.UI.createLabel({
						top : 0,
						width : Ti.UI.FILL,
						height : Ti.UI.SIZE,
						left : 0,
						text : moment(_items[i].updated_at).fromNow(),
						font : {
							fontSize : 12,
							fontFamily : theme.fontFamily
						},
						color : theme.lightFontColor,
						textAlign : Ti.UI.TEXT_ALIGNMENT_LEFT
					}); 
					content_view.add(date);
					
					if(!rows){
						rows = [];
					}
					rows.push(row);
				}
			}
		}
		
		return rows;
	}
	
	var last_notifications_check = null;
	var refreshing_indicator = Ti.UI.createActivityIndicator({
		right:10,
		top : 10,
		height : 20,
		width : 20,
		style : Ti.UI.iPhone.ActivityIndicatorStyle.PLAIN
	});
	refreshing_indicator.show();
	
	function refreshNotifications(){
		Ti.UI.iPhone.appBadge = 0;
		var currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
		if (currentUser && currentUser.id) {			
			sectionMessagesView.remove(sectionMessagesViewRefresh);
			sectionMessagesView.add(refreshing_indicator);
			
			sectionMessagesView.add();
			ChatsModel.queryPages(currentUser.id, {
				to_user_id : currentUser.id,
				chat_type : 'notification'
			}, '-updated_at', 1, 5, function(chatEvent) {
				sectionMessagesView.remove(refreshing_indicator);
				sectionMessagesView.add(sectionMessagesViewRefresh);
				
				last_notifications_check = moment();
				if (chatEvent.success) {
					if (chatEvent.chats && chatEvent.chats.length > 0) {
						sectionMessages.rows = createNotificationMenuRows(chatEvent.chats);
						navTable.setData(getTableData());
					}
				}
			});
		}
	}
	
	self.addEventListener('focus', function(e){
		require('/lib/analytics').trackScreen({ screenName : 'Menu' });
		
		if(e){
			e.cancelBubble = true;
		}
		navTable.canNavigateWindows = true;
		
		if(Ti.App.Properties.getBool('carely_menu_restart', false) === true){
			Ti.App.Properties.setBool('carely_menu_restart', false);
			last_notifications_check = null;
			sectionMessages.rows = [];
		}
		
		navTable.setData(getTableData());
	});
	
	return self;
}

module.exports = MenuWindow;