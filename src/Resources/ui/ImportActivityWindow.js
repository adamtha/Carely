function ImportActivityListWindow(_params) {
	var _ = require('/lib/underscore'),
		theme = require('/ui/theme'),
		common = require('/lib/common'),
		Model = require('/lib/model/model'),
		ObjectsModel = require('/lib/model/objects');
		
	var currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null)),
		_is_admin = false;
	if(currentUser && currentUser.admin === 'true' && currentUser.custom_fields && currentUser.custom_fields.show_admin_features !== false){
		_is_admin = true;
	}
		
	var List_tag = JSON.parse(Ti.App.Properties.getString('List_tag', null)),
		defaultRows = Model.AppCache.get('List_tag_default_rows');
	if(!defaultRows === null){
		defaultRows = [];
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
		require('/ui/MasterWindow').getNavGroup().close(self, {animated:true});
	});
	
	var title_lbl = Ti.UI.createLabel({
		text : 'Add activities',
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
		title:'Add activities',
		navBarHidden:false,
		backgroundColor:theme.defaultBgColor,
		orientationModes : [Ti.UI.PORTRAIT],
		barColor : theme.barColor,
		tabBarHidden : true
	});	
	
	var defaultRowHeight = theme.borderedImage.big.height + 12,
		tag_list_rows = [],
		_updating = false;
	
	var last_search = null, auto_complete_timer = null, _searching = false;
	var search = Ti.UI.createSearchBar({
		barColor : theme.subBarColor,
		hintText : 'Search activity lists',
		autocapitalization : Ti.UI.TEXT_AUTOCAPITALIZATION_SENTENCES
	});
	search.addEventListener('blur', function(e){
		search.showCancel = false;
	});
	search.addEventListener('change', function(e) {
		if(auto_complete_timer){
			clearTimeout(auto_complete_timer);
		}
		
		if(_updating){
			return false;
		}

		if(e.value){
			if(!e.value.length){
				_searching = false;
				endUpdate();
			}
			else if (e.value.length > 2 && e.value !== last_search) {
				auto_complete_timer = setTimeout(function(){
					last_search = e.value;
					searchActivityList(e.value);
					
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
		
		if(_updating){
			return false;
		}
		
		if (this.value && this.value.length > 2 && this.value !== last_search) {
			auto_complete_timer = setTimeout(function(){
				last_search = this.value;
				searchActivityList(this.value);
				
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
	
	function searchActivityList(_search_term){
		if(_updating){
			return false;
		}
		
		if(_search_term && _search_term.length > 2){
			var LowerCaseTerm = _search_term.toLowerCase();
			_searching = true;
			_updating = true;
			
			footer_view.height = Ti.UI.SIZE;
			
			var search_section = createTagListSection({title:'Results for \'' + _search_term + '\''})
			var rows = [];
			for(var i=0, v=tag_list_rows.length; i<v; i++){
				if(tag_list_rows[i].filter && tag_list_rows[i].filter.length && 
				   tag_list_rows[i].filter.toLowerCase().indexOf(LowerCaseTerm) > -1){
					rows.push(tag_list_rows[i]);
				}
			}
			
			rows = _.uniq(rows, false, function(n){
				return n.list_id;
			});
			search_section.rows = rows;
			tableView.setData([search_section]);
			
			require('/lib/analytics').trackEvent({
				category : 'search',
				action : 'filter',
				label : _search_term,
				value : rows.length
			});
			
			var q_search_params = {
				is_active : true,
				tags_array : LowerCaseTerm
			}
			
			if(!_is_admin){
				q_search_params.order_rank = { '$gt' : 0 };
			}
			
			ObjectsModel.queryPages(ObjectsModel.classNames.tag_lists, q_search_params, '-order_rank', 1, 100, function(queryEvent) {
				footer_view.height = 0;
				
				if(queryEvent.success){
					if(queryEvent.meta.total_results > 0){
						var search_rows = createActivityListRows(queryEvent[ObjectsModel.classNames.tag_lists]);
						if(search_rows && search_rows.length){
							rows = rows.concat(search_rows);
							rows = _.uniq(rows, false, function(n){
								return n.list_id;
							});
						}
					}
				}
				else{
					Model.eventDefaultErrorCallback(queryEvent);
				}
				
				if(rows && rows.length){
					search_section.rows = rows;
				}
				else{
					search_section.rows = [];
					search_section.headerView.children[1].text = 'No results for \'' + _search_term + '\'';
				}
				tableView.setData([search_section]);
				
				_updating = false;
				_searching = false;
				
				rows = null;
				search.value = search.value;
			});
		}
	}
	
	var header_view = Ti.UI.createView({
		height : Ti.UI.SIZE,
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
		backgroundColor : theme.tableBackgroundColor,
		height : 'auto',
		separatorStyle : Ti.UI.iPhone.TableViewSeparatorStyle.NONE,
		headerView : header_view,
		footerView : footer_view,
		scrollsToTop : true,
		canRefreshNow : false,
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
			queryTagLists(true);
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
			if (_updating === false && _searching === false) {
				puller.scroll(e);
			}
		} else {
			if (_updating === false && _searching === false && _more && e.contentOffset.y + e.size.height + 100 > e.contentSize.height) {
				tableView.canRefreshNow = true;
			}
		}
	});
	tableView.addEventListener('scrollEnd', function(e) {
		_scrolling = false;
		
		var loading_new_data = 0;
		if(tableView.canRefreshNow){
			tableView.canRefreshNow = false;

			loading_new_data = 1;
				
			_updating = true;
			
			queryTagLists(false);
		}
		
		require('/lib/analytics').trackEvent({
			category : 'activity list',
			action : 'scroll',
			label : 'load data',
			value : loading_new_data
		});
	});
	tableView.addEventListener('singletap', function(e){
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
		
		if(_updating){
			return false;
		}
		
		require('/lib/analytics').trackEvent({
			category : 'activity list',
			action : 'click',
			label : (e && e.row && e.row.tag_list_id) ? e.row.tag_list_id : null,
			value : null
		});
		
		if(e && e.row && e.row.list_id){
			// open list activities
			var ImportActivitiesWindow = require('/ui/ImportActivitiesWindow');
			var win = new ImportActivitiesWindow({
				list_id : e.row.all_activities_row ? 'ALL' : e.row.list_id,
				title : e.row.list_name
			});
			require('/ui/MasterWindow').getNavGroup().open(win);
		}
	});
	self.add(tableView);
	
	function endUpdate(){
		if(tableView.pullRefresh){
			tableView.pullRefresh = false;
			
			tableView.top = 0;
			tableView.scrollToTop(0, {
				animated : false
			});
			puller.end(tableView, function() {});
		}
		
		tableView.setData(tag_list_rows);
	}
	
	var _page = 1, _more = true;
	function queryTagLists(_force){
		_updating = true;
		_more = true;
		
		search.touchEnabled = false;
		
		if(_force){
			_page = 1;
			tag_list_rows = [];
			
			if (defaultRows && defaultRows.length) {
				var rows = createActivityListRows(defaultRows);
				if (rows && rows.length) {
					tag_list_rows = tag_list_rows.concat(rows);
				}
				rows = null;
			}
			tableView.setData(tag_list_rows);
		}
		footer_view.height = Ti.UI.SIZE;
		
		var query_params = {
			is_active : true
		};
		if(!_is_admin){
			query_params.order_rank = { '$gt' : 0 };
		}
		
		ObjectsModel.queryPages(ObjectsModel.classNames.tag_lists, query_params, '-order_rank', _page, 7, function(queryEvent) {
			
			footer_view.height = 0;
			
			if(queryEvent.success){
				if(queryEvent.meta.total_results > 0){
					if(queryEvent.meta.page === 1){
						defaultRows = queryEvent[ObjectsModel.classNames.tag_lists];
						Model.AppCache.set('List_tag_default_rows', queryEvent[ObjectsModel.classNames.tag_lists]);
						
						tag_list_rows = [];
					}
					
					if (queryEvent.meta.page < queryEvent.meta.total_pages) {
						_page += 1;
					}
					else{
						_more = false;
					}
					
					var rows = createActivityListRows(queryEvent[ObjectsModel.classNames.tag_lists]);
					if(rows && rows.length){
						tag_list_rows = tag_list_rows.concat(rows);
						tag_list_rows = _.uniq(tag_list_rows, false, function(n){
							return n.list_id;
						});
					}
				}
				else{
					if(queryEvent.meta.page === 1){
						Model.AppCache.set('List_tag_default_rows', null);
					}
					
					_more = false;
				}
			}
			else{
				Model.eventDefaultErrorCallback(queryEvent);
			}

			endUpdate();
						
			_updating = false;
			search.touchEnabled = true;
		});
	}
	
	function createTagListSection(_item){

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
		
		var divider_bottom = Ti.UI.createView({
			bottom:0,
			backgroundColor : '#111931',
			height : 1
		});
		section_view.add(divider_bottom);
		
		return Ti.UI.createTableViewSection({ headerView: section_view});
	}
	
	function createActivityListRow(_item) {
		if(!_item){
			return null;
		}
		if(List_tag && List_tag.id === _item.id){
			return null;
		}
							
		var row = Ti.UI.createTableViewRow({
			height : Ti.UI.SIZE,
			width : Ti.UI.FILL,
			filter : _item.name,
			backgroundColor : '#fff',
			//selectionStyle : Ti.UI.iPhone.TableViewCellSelectionStyle.NONE,
			//backgroundImage : theme.images.rowBox.normal,
			list_id : _item.id,
			list_name : _item.name,
			updated_at : _item.updated_at,
			total_posts : 0,
			total_activities : 0,
			total_users : 0,
			all_activities_row : false,
			enableEdit : false,
			className : 'ActivityList_Row'
		});
		
		if(_item.all_activities){
			row.all_activities_row = true;
		}
		
		row.itemJSON = JSON.stringify(_item);
		
		if (_item.total_users){
			row.total_users = _item.total_users;
		}
		if (_item.total_activities){
			row.total_activities = _item.total_activities;
		}
		
		var row_view = Ti.UI.createView({
			height : Ti.UI.SIZE,
			width : Ti.UI.FILL,
			layout : 'vertical'
		});
		row.add(row_view);
		
		var title_view = Ti.UI.createView({
			height : Ti.UI.SIZE,
			width : Ti.UI.FILL
		});
		row_view.add(title_view);
		
		var list_name_txt = Ti.UI.createTextField({
			//top : 5,
			left : 4,
			right : 28,
			paddingLeft : 4,
			textAlign : Ti.UI.TEXT_ALIGNMENT_LEFT,
			value : _item.name,
			original_value : _item.name,
			font : theme.defaultFontBold,
			color : theme.darkFontColor,
			touchEnabled : true,
			editable : false,
			height:30,
			width : Ti.UI.FILL,
			borderWidth : 0,
			backgroundColor: '#fff',
			appearance: Ti.UI.KEYBOARD_APPEARANCE_ALERT,
			returnKeyType:Ti.UI.RETURNKEY_DONE,
			autocapitalization:Ti.UI.TEXT_AUTOCAPITALIZATION_SENTENCES,
			hintText:'Activity name (3+ chars long)',
			autocorrect:true,
			valueEdited:false,
			list_id : _item.id,
			clickName:'listName'
		});
		title_view.add(list_name_txt);

		var disclosure_icon = Ti.UI.createImageView({
			image : theme.images.disclosure,
			width : 13,
			height : 13,
			right : 6,
			top : 8,
			hires : true
		});
		title_view.add(disclosure_icon);
		
		var thumbs_view = Ti.UI.createView({
			height : 61,
			width : Ti.UI.FILL,
			layout : 'horizontal',
			total_thumbs : 0,
			thumb_height:54,
			thumb_width:54,
			thumb_space:4,
		});
		row_view.add(thumbs_view);
		
		if(row.total_activities > 0 && _item.activity_pics && _item.activity_pics.length > 0){
			var total_activities = row.total_activities;
			
			for(var i=0,v=_item.activity_pics.length; i<v && i<5; i++){
				
				var icon = Ti.UI.createImageView({
					top:2,
					image : _item.activity_pics[i],
					width : thumbs_view.thumb_width,
					height : thumbs_view.thumb_height,
					left : thumbs_view.thumb_space,
					hires:true
				});
				thumbs_view.add(icon);
				
				thumbs_view.total_thumbs++;
				total_activities--;
			}
			if(total_activities > 0){
				var activities_more = Ti.UI.createLabel({
					left : 1,
					right : 1,
					width : Ti.UI.FILL,
					height : Ti.UI.SIZE,
					text : '+' + total_activities,
					font : {
						fontSize : 14,
						fontFamily : theme.fontFamily
					},
					minimumFontSize : 12,
					color : theme.lightBgColor,
					textAlign : Ti.UI.TEXT_ALIGNMENT_LEFT
				});
				if(total_activities > 99){
					// activities_more.font = {
						// fontSize : 13,
						// fontFamily : theme.fontFamily
					// }; 
				}
				thumbs_view.add(activities_more);
			}
		}
		
		if(thumbs_view.total_thumbs < 5){
			for(var i=thumbs_view.total_thumbs; i<5; i++){
				var icon = Ti.UI.createImageView({
					top:2,
					image : theme.images.add_activity_empty_box,
					width : thumbs_view.thumb_width,
					height : thumbs_view.thumb_height,
					left : thumbs_view.thumb_space,
					hires : true
				});
				thumbs_view.add(icon);
			}
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
	
	function createActivityListRows(_items) {
		var rows = [];
		if(_items && _items.length > 0) {
			for(var i = 0, l = _items.length; i < l; i++) {
				// skip disabled actions
				if(!_items[i].is_active){
					continue;
				}
				var row = createActivityListRow(_items[i]);
				if(row !== null){
					rows.push(row);
				}
			}
		}
		return rows;
	}
	
	queryTagLists(true);
	
	self.addEventListener('focus', function(e){	
		require('/lib/analytics').trackScreen({ screenName : self.title });
	});
	
	return self;
}

module.exports = ImportActivityListWindow;