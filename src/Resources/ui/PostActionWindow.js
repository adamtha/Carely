function PostActionWindow(_user_id, _post_id, _stats) {
	var _ = require('/lib/underscore'), 
		theme = require('/ui/theme'), 
		ui = require('/ui/components'), 
		moment = require('/lib/date/moment'),
		Model = require('/lib/model/model'),
		PostsModel = require('/lib/model/posts'),
		LeaderBoardView = require('/ui/LeaderBoardView');
	
	var isAndroid = Ti.Platform.osname === 'android';
	var currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
	if (currentUser !== null && _user_id === undefined) {
		_user_id = currentUser.id;
	}
	var _user = Model.AppCache.users.get(_user_id);
	var _post = Model.AppCache.posts.get(_post_id);
	
	var self = Ti.UI.createWindow({
		title : 'Congratulations!',
		navBarHidden : isAndroid,
		backgroundColor : theme.winBgColor,
		orientationModes : [Ti.UI.PORTRAIT]
	});

	if (isAndroid) {
		
	} else {
		self.barColor = theme.barColor;

		var doneButton = Ti.UI.createButton({
			title:L('done', 'Done')
		});
		doneButton.addEventListener('click', function(e) {
			if(this.clickTime && (new Date() - this.clickTime < 1000)){
				return false;
			}
			this.clickTime = new Date();
			
			if(isAndroid){
				self.close();
			}
			else{
				require('/ui/MasterWindow').getNavGroup().goToHome(self, true);
			}
		});
		self.rightNavButton = doneButton;
	}
	
	var main_scrollView = Ti.UI.createScrollView({
		contentWidth: 'auto',
		contentHeight: 'auto',
		top: isAndroid ? 50 : 0,
		showVerticalScrollIndicator: true,
		showHorizontalScrollIndicator: false,
		scrollType: 'vertical',
		layout:'vertical',
		backgroundColor: theme.winBgColor
	});
	self.add(main_scrollView);
	
	var action_view = Ti.UI.createView({
		width:Ti.UI.FILL,
		height:28,
		layout:'horizontal'
	});
	main_scrollView.add(action_view);
	
	var action_doer_label = Ti.UI.createLabel({
		top : 6,
		left : 10,
		text : 'You',
		font : theme.defaultFontBold,
		color : theme.darkBlueLink,
		textAlign : Ti.UI.TEXT_ALIGNMENT_LEFT
	});
	action_doer_label.addEventListener('click', function(e){
		if (this.clickTime && (new Date() - this.clickTime < 1000)) {
			return false;
		}
		this.clickTime = new Date();

		if(e){
			e.cancelBubble = true;
		}
		
		var UserWindow = require('/ui/UserWindow');
		var userWindow = new UserWindow(_user_id);
		require('/ui/MasterWindow').getNavGroup().open(userWindow);
		
		require('/lib/analytics').trackEvent({
			category : 'user',
			action : 'show',
			label : _user_id,
			value : null
		});
	});
	action_view.add(action_doer_label);
	
	var post_action_desc = ' checked in to ';
	if(_post.title === PostsModel.postTypes.checkin){
		post_action_desc = ' checked in to ';
	}
	else if(_post.title === PostsModel.postTypes.discussion){
		post_action_desc = ' wrote about ';
	}
	else if(_post.title === PostsModel.postTypes.joins){
		post_action_desc = ' joined ';
	}
	else if(_post.title === PostsModel.postTypes.actions_add){
		post_action_desc = ' added ';
	}
	var action_label = Ti.UI.createLabel({
		top : 6,
		left : -1,
		text : post_action_desc,
		font : theme.defaultFont,
		color : theme.textColor,
		textAlign : Ti.UI.TEXT_ALIGNMENT_LEFT
	});
	action_view.add(action_label);
	
	var action_name_label = Ti.UI.createLabel({
		top : 6,
		left : -1,
		text : _post.event.name,
		font : theme.defaultFontBold,
		color : theme.darkBlueLink,
		textAlign : Ti.UI.TEXT_ALIGNMENT_LEFT
	});
	action_view.add(action_name_label);
	
	function addStatHeaderView(_title, _last){
		var stats_divider_top = Ti.UI.createView({
			top: _last ? -1 : 6,
			backgroundColor : '#111931',
			height : 1
		});
		main_scrollView.add(stats_divider_top); 
		
		var stats_view = Ti.UI.createView({
			top:0,
			width:Ti.UI.FILL,
			height:24,
			backgroundColor:theme.barColor
		});
		main_scrollView.add(stats_view);
		
		var stats_label = Ti.UI.createLabel({
			top : 2,
			left : 10,
			text : _title.toUpperCase(),
			font : theme.defaultFontBold,
			color : '#fff',
			textAlign : Ti.UI.TEXT_ALIGNMENT_LEFT
		});
		stats_view.add(stats_label);
		
		var stats_divider_bottom = Ti.UI.createView({
			top:0,
			backgroundColor : '#111931',
			height : 1
		});
		main_scrollView.add(stats_divider_bottom);
	}
	
	function addStatView(_stat_title, _state_count){
		var stat_view = Ti.UI.createView({
			top : 6,
			width:Ti.UI.FILL,
			height:29,
			backgroundImage:theme.images.rowBox.normal,
			backgroundColor:'transparent'
		});
		main_scrollView.add(stat_view);
		
		var stat_label = Ti.UI.createLabel({
			top : 0,
			left : 10,
			text : _stat_title,
			font : theme.defaultFont,
			color : theme.textColor,
			textAlign : Ti.UI.TEXT_ALIGNMENT_LEFT
		});
		stat_view.add(stat_label);
		
		var stat_count_label = Ti.UI.createLabel({
			top : 0,
			right : 10,
			text : _state_count,
			font : theme.defaultFont,
			color : theme.tableSelectedValueColor,
			textAlign : Ti.UI.TEXT_ALIGNMENT_RIGHT
		});
		stat_view.add(stat_count_label);
	}
	
	addStatHeaderView('stats', false);
	
	function createStatRows(_items){
		var rows = [];
		if(_items && _items.length > 0) {
			for(var i = 0, l = _items.length; i < l; i++) {
				
				var _item = _items[i];
				
				var stat_row = Ti.UI.createTableViewRow({
					height : theme.tableDefaultHeight,
					width : Ti.UI.FILL,
					className : 'Stat_Row',
					selectionStyle : Ti.UI.iPhone.TableViewCellSelectionStyle.NONE,
					backgroundImage : theme.images.rowBox.normal,
					hasChild: false
				});
				
				var stat_title = Ti.UI.createLabel({
					top : 11,
					left : 10,
					text : _item.title,
					font : theme.defaultFont,
					color : theme.textColor,
					textAlign : Ti.UI.TEXT_ALIGNMENT_LEFT
				});
				stat_row.add(stat_title);
				
				var stat_value = Ti.UI.createLabel({
					top : 11,
					right : 10,
					text : _item.value,
					font : theme.defaultFont,
					color : theme.darkBlueLink,
					textAlign : Ti.UI.TEXT_ALIGNMENT_RIGHT
				});
				stat_row.add(stat_value);
				
				rows.push(stat_row);
			}
		}
		return rows;
	}
	
	var stat_rows = createStatRows([
		{title:'Your check ins to this', value:_stats.me},
		{title:'Total check ins to this', value:_stats.total}
	]);
	var statsTable = Ti.UI.createTableView({
		data:stat_rows,
		top : 0,
		scrollable : false,
		left : 0,
		right : 0,
		backgroundColor : theme.winBgColor,
		style:isAndroid ? '' : Ti.UI.iPhone.TableViewStyle.PLAIN,
		separatorStyle: isAndroid ? '' : Ti.UI.iPhone.TableViewSeparatorStyle.NONE,
		height:stat_rows.length * theme.tableDefaultHeight
	});
	main_scrollView.add(statsTable);
	
	addStatHeaderView('leaderboard', true);
	
	var leaderboard = new LeaderBoardView(main_scrollView, _post_id ,_user_id, 3, true);
	leaderboard.addEventListener('data.refreshed', function(ee) {
		main_scrollView.contentHeight = 'auto';
	}); 

	main_scrollView.add(leaderboard);
	
	var refresh_leader = true;
	self.addEventListener('focus', function(e){
		if(Ti.App.Properties.getBool('carely_goToHome', false) === true){
			require('/ui/MasterWindow').getNavGroup().close(this, {animated:false});
		}
		else{
			require('/lib/analytics').trackScreen({ screenName : self.title });
			
			require('/lib/analytics').trackEvent({
				category : 'post checkin',
				action : 'show',
				label : _post_id,
				value : null
			});
		}
	});
	self.addEventListener('open', function(e){
		if(Ti.App.Properties.getBool('carely_goToHome', false) === true){
			require('/ui/MasterWindow').getNavGroup().close(this, {animated:false});
		}
		else if(refresh_leader){
			refresh_leader = false;
			leaderboard.fireEvent('data.refresh');
		}
	});
	
	return self;
};

module.exports = PostActionWindow; 