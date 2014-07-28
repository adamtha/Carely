function LeaderBoardView(_parent, _post_id, _user_id, _max_results, _show_more){
	var theme = require('/ui/theme'), 
		ui = require('/ui/components'),
		moment = require('/lib/date/moment'),
		Model = require('/lib/model/model'),
		common = require('/lib/common'),
		PostsModel = require('/lib/model/posts');
		
	var isAndroid = Ti.Platform.osname === 'android';
	var currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
	if (currentUser !== null && _user_id === undefined) {
		_user_id = currentUser.id;
	}
	
	var _user = Model.AppCache.users.get(_user_id);
	var _post = Model.AppCache.posts.get(_post_id);
	if(_post.title === PostsModel.postTypes.joins){
		_post.title = PostsModel.postTypes.checkin;
	}
	var _post_count_id = _post.event.id + '_' + _post.title;
	
	var act_Ind = Titanium.UI.createActivityIndicator({
		left : '45%',
		top : 6,
		height : 'auto',
		width : 'auto',
		style : Titanium.UI.iPhone.ActivityIndicatorStyle.DARK,
		isShowing:false
	});
	act_Ind.show();
	
	var self = Ti.UI.createTableView({
		top : 0,
		//borderColor : theme.tableBorderColor,
		//borderRadius : theme.defaultBorderRadius,
		scrollable : false,
		left : 0,
		right : 0,
		backgroundColor : theme.winBgColor,
		style:isAndroid ? '' : Ti.UI.iPhone.TableViewStyle.PLAIN,
		separatorStyle: isAndroid ? '' : Ti.UI.iPhone.TableViewSeparatorStyle.NONE,
		scrollable:false,
		scrollsToTop:true
	});
	self.addEventListener('singletap', function(e){
		if (this.clickTime && (new Date() - this.clickTime < 1000)) {
			return false;
		}
		this.clickTime = new Date();

		if(e){
			e.cancelBubble = true;
		}
		
		if (e && e.row && e.row.user_id){
			var UserWindow = require('/ui/UserWindow');
			var userWindow = new UserWindow(e.row.user_id);
			require('/ui/MasterWindow').getNavGroup().open(userWindow);
		}
		else if(e && e.row && e.row.show_more){
			var leaders_win = Ti.UI.createWindow({
				title:'Leaderboard',
				navBarHidden : isAndroid,
				backgroundColor : theme.winBgColor,
				orientationModes : [Ti.UI.PORTRAIT],
				barColor : theme.barColor
			});
			var leaders_scrollView = Ti.UI.createScrollView({
				contentWidth: 'auto',
				contentHeight: 'auto',
				top: isAndroid ? 50 : 0,
				showVerticalScrollIndicator: true,
				showHorizontalScrollIndicator: false,
				scrollType: 'vertical',
				layout:'vertical',
				backgroundColor: theme.winBgColor
			});
			leaders_win.add(leaders_scrollView);
			
			var leaders_view =  new LeaderBoardView(leaders_scrollView, _post_id ,_user_id, 50, false);
			leaders_scrollView.add(leaders_view);
			leaders_view.addEventListener('data.refreshed', function(ee){
				leaders_scrollView.contentHeight = 'auto';
			});
			leaders_win.addEventListener('focus', function(e){
				if(Ti.App.Properties.getBool('carely_goToHome', false) === true){
					require('/ui/MasterWindow').getNavGroup().close(this, {animated:false});
				}
			});
			leaders_win.addEventListener('open', function(ee){
				if(Ti.App.Properties.getBool('carely_goToHome', false) === true){
					require('/ui/MasterWindow').getNavGroup().close(this, {animated:false});
				}
				else{
					leaders_view.fireEvent('data.refresh');
				}
			});
			require('/ui/MasterWindow').getNavGroup().open(leaders_win);
		}
	});
	
	var defaultRowHeight = theme.borderedImage.user.height + 12;
	function createLeaderRows(_items){
		var rows = [];
		if(_items && _items.length > 0) {
			for(var i = 0, l = _items.length; i < l; i++) {
				
				var _item = _items[i];
				
				var leader_row = Ti.UI.createTableViewRow({
					height : defaultRowHeight,
					width : Ti.UI.FILL,
					className : 'Leader_Row',
					user_id : _item.id,
					//selectionStyle : Ti.UI.iPhone.TableViewCellSelectionStyle.NONE,
					backgroundImage : theme.images.rowBox.normal,
					hasChild: true
				});
				
				var pos = Ti.UI.createLabel({
					top:14,
					left:10,
					text : '#' + (i + 1),
					font : theme.defaultFont,
					color : theme.darkBlueLink,
					textAlign : Ti.UI.TEXT_ALIGNMENT_LEFT
				});
				leader_row.add(pos);
				
				var userIcon = theme.defaultIcons.user;
				if (_item.photo && _item.photo.urls && _item.photo.urls.square_75) {
					userIcon = _item.photo.urls.square_75;
				}
				
				var icon = new ui.ImageViewBordered(userIcon, {
					width : theme.borderedImage.user.width,
					height : theme.borderedImage.user.height,
					left : 42,
					top : 6
				});
				leader_row.add(icon);
				
				var uname = common.getUserDisplayName(_item);
				
				var username = Ti.UI.createLabel({
					top:14,
					left: icon.left + icon.width + 6,
					text : uname,
					font : theme.defaultFont,
					color:theme.textColor,
					textAlign:Ti.UI.TEXT_ALIGNMENT_LEFT
				});
				leader_row.add(username);
				
				var total_count = 0;
				if(_item.custom_fields[_post_count_id]){
					total_count = _item.custom_fields[_post_count_id];
				}
				var score = Ti.UI.createLabel({
					top:14,
					right: 10,
					text : total_count,
					font : theme.defaultFont,
					color:theme.darkBlueLink,
					textAlign:Ti.UI.TEXT_ALIGNMENT_RIGHT
				});
				leader_row.add(score);
				
				rows.push(leader_row);
			}
		}
		return rows;
	}
	
	function createShowMoreRow(){
		
		var row = Ti.UI.createTableViewRow({
			height : 30,
			width : Ti.UI.FILL,
			className : 'Leader_Row',
			backgroundImage : theme.images.rowBox.suggested,
			hasChild : true,
			show_more : true
		});
		
		var lbl = Ti.UI.createLabel({
			text:'Show more',
			height:Ti.UI.FILL,
			width:Ti.UI.FILL,
			textAlign:Ti.UI.TEXT_ALIGNMENT_CENTER,
			font : theme.defaultFontBold,
			color:theme.darkBlueLink
		});
		row.add(lbl);
		
		return row;
	}
	
	var _page = 1, _more = true, _updating = false;
	function refreshLeaderboard(){
		self.setData([]);
		self.height = 0;
		_parent.add(act_Ind);

		var where = {};
		where[_post_count_id] = {'$gt' : 0};
		
		var UsersModel = require('/lib/model/users');
		UsersModel.queryPages(where, '-' + _post_count_id, _page, _max_results, function(e){
			_parent.remove(act_Ind);
			if(e.success){
				if(e.users.length > 0){
					
					self.total_users = e.meta.total_results;
					
					if (e.meta.page < e.meta.total_pages) {
						_page += 1;
					}
					else{
						_more = false;
					}
					
					var newRows = createLeaderRows(e.users);
					if(newRows.length > 0){
						if(_show_more && _more){
							var more_row = createShowMoreRow();
							newRows.push(more_row);
						}
						self.setData(newRows);
						self.height = newRows.length * defaultRowHeight;
					}
				}
			}
			else{
				Model.eventDefaultErrorCallback(e);
			}
			self.fireEvent('data.refreshed');
		});
	}
	
	self.addEventListener('data.refresh', function(e){
		refreshLeaderboard();
	});
	
	return self;
}

module.exports = LeaderBoardView;