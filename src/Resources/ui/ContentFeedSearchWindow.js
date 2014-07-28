function ContentFeedSearchWindow(_query, _title, _searchable, _token){
	var _ = require('/lib/underscore'),
		theme = require('/ui/theme'), 
		ui = require('/ui/components');

	var isAndroid = Ti.Platform.osname === 'android';
	
	var self = Ti.UI.createWindow({
		title : _title ? _title : 'Content feed search',
		navBarHidden : isAndroid,
		backgroundColor: theme.winBgColor,
		orientationModes : [Ti.UI.PORTRAIT],
		modal:true
	});
	
	if(isAndroid){
	}
	else{
		self.barColor = theme.barColor;
	}
	
	var search = Ti.UI.createSearchBar({
		top:0,
		autocapitalization:Ti.UI.TEXT_AUTOCAPITALIZATION_NONE,
		autocorrect:false,
		barColor:theme.barColor,
		hintText:'e.g. your facebook page name',
		showCancel:false,
		softKeyboardOnFocus:true,
		height:43,
		width:'auto',
		touchEnabled:true,
		value:_query
	});
	search.addEventListener('cancel', function(e){
		this.blur();
	});
	search.addEventListener('return', function(e){
		this.blur();
		if(this.value !== '' && this.value.length > 0){
			rows_array = [];
			_nextPage = 'https://graph.facebook.com/search?type=page&fields=id,name,link,category,picture,is_published,likes,talking_about_count&q=' + Ti.Network.encodeURIComponent(this.value);
			if(_token){
				_nextPage += '&access_token=';
				_nextPage += _token;
			}
			refreshFbPageItems();
		}
	});
	self.add(search);
	
	var rows_array = [], defaultRowHeight = theme.borderedImage.big.height + 12;
	function createFbPageItemRow(_item){
		var row = null;
		if(_item !== null && _item.is_published === true){
			row = Ti.UI.createTableViewRow({
				hasChild : true,
				contentJSON : {
					id: _item.id,
					name: _item.name,
					link: _item.link,
					category: _item.category,
					picture: _item.picture
				},
				width : Ti.UI.FILL,
				height : defaultRowHeight,
				backgroundImage : theme.images.rowBox.normal,
				//selectionStyle:Ti.UI.iPhone.TableViewCellSelectionStyle.NONE,
				isMyGroup : false,
				className : 'Group_Row'
			});

			var itemIcon = theme.images.facebook_icon;
			if(_item.picture && _item.picture.data && _item.picture.data.url && _item.picture.data.is_silhouette === false){
				itemIcon = _item.picture.data.url;
			}

			var icon = new ui.ImageViewBordered(itemIcon, {
				width : theme.borderedImage.big.width,
				height : theme.borderedImage.big.height,
				left : 5,
				top : 4,
				bottom : 8
			});

			row.add(icon);
			
			var name = Ti.UI.createLabel({
				top : 2,
				left : icon.left + icon.width + 6,
				text : _item.name,
				font : theme.defaultFontBold,
				color : theme.textColor,
				textAlign : Ti.UI.TEXT_ALIGNMENT_LEFT
			});
			row.add(name);

			var category = Ti.UI.createLabel({
				top : 22,
				left : icon.left + icon.width + 6,
				text : _item.category,
				font : {
					fontSize : 14,
					fontFamily : theme.fontFamily
				},
				color : theme.textColor,
				textAlign : Ti.UI.TEXT_ALIGNMENT_LEFT
			});
			row.add(category); 
			
			var stats_msg = '';
			if (_item.likes && _item.likes > 0) {
				stats_msg += _item.likes + ' likes';
			}
			if (_item.talking_about_count && _item.talking_about_count > 0) {
				stats_msg += ' \u2022 ' + _item.talking_about_count + ' talking about it';
			}
			
			var stats = Ti.UI.createLabel({
				bottom : 6,
				left : icon.left + icon.width + 6,
				text : stats_msg,
				font : {
					fontSize : 12,
					fontFamily : theme.fontFamily
				},
				color : theme.lightFontColor,
				textAlign : Ti.UI.TEXT_ALIGNMENT_LEFT
			});
			row.add(stats);
		}
		return row;
	}
	
	var loading_row = Ti.UI.createTableViewRow({
		height:defaultRowHeight,
		backgroundImage:theme.images.rowBox.normal,
		hasChild: false
	});
	
	//displaying an activity indicator - only works in iOS, in Android will display a label
	if(isAndroid){
		var droid_loader = Ti.UI.createLabel({
			color:'#fff',
			top:10,
			width:'100%',
			textAlign:Ti.UI.TEXT_ALIGNMENT_CENTER,
			text:'Loading...',
			font: {
				fontSize: 14,
				fontFamily: theme.fontFamily
			}
		});
		loading_row.add(droid_loader);
	}
	else{
		var act_Ind = Ti.UI.createActivityIndicator({
			left:'45%',
			top:35,
			height:'auto',
			width:'auto',
			style: Ti.UI.iPhone.ActivityIndicatorStyle.DARK
		});
		act_Ind.show();
		loading_row.add(act_Ind);
	}
	
	var _nextPage = null, _updating = false, _loadingAppended = false;
	function startUpdate() {
		_updating = true;

		if (_loadingAppended === false) {
			tableView.appendRow(loading_row);
			_loadingAppended = true;
		}
	}
	function endUpdate() {
		_updating = false;
		_loadingAppended = false;
		
		tableView.setData(rows_array);
	}

	var xhr = Ti.Network.createHTTPClient({
		autoEncodeUrl:false,
		autoRedirect:false,
		timeout : 10000,
		onerror : function(e) {
			_nextPage = null;
			
			endUpdate();
		},
		onload : function(e) {
			_nextPage = null;
			try{
				var resp = JSON.parse(xhr.responseText);
				if(resp.paging && resp.paging.next){
					_nextPage = resp.paging.next;
				}
				if(resp.data && resp.data.length > 0){
					for(var i=0, v=resp.data.length; i<v; i++){
						var row = createFbPageItemRow(resp.data[i]);
						if(row){
							rows_array.push(row);
						}
					}
				}
			}
			catch(err){
				
			}
			finally{
				endUpdate();
			}
		}
	}); 
	
	var tableView = Ti.UI.createTableView({
		top : isAndroid ? 50 : 43,
		left : 0,
		right : 0,
		width : Ti.UI.FILL,
		backgroundColor: 'transparent',
		style:isAndroid ? '' : Ti.UI.iPhone.TableViewStyle.PLAIN,
		separatorStyle: isAndroid ? '' : Ti.UI.iPhone.TableViewSeparatorStyle.NONE,
		footerView : new ui.ViewTransparent()
	}); 
	
	var touchEndEvent = null;
	tableView.addEventListener('touchend', function(e){
		touchEndEvent = e;
	});
	tableView.addEventListener('click', function(ee) {
		if(this.clickTime && (new Date() - this.clickTime < 1000)){
			return false;
		}
		this.clickTime = new Date();
		
		var e = (touchEndEvent !== null ? touchEndEvent : ee);
		touchEndEvent = null;
		
		var action_options_dialog = {
			cancel:1
		};
		if (isAndroid) {
		} else {
			action_options_dialog.options = ['Use as Content Feed'];
		}
		
		if(e.rowData.contentJSON.link && e.rowData.contentJSON.name){
			action_options_dialog.options.push('Open Webpage');
			action_options_dialog.cancel += 1;
		}
		action_options_dialog.options.push('Cancel');
		
		var action_dialog = Ti.UI.createOptionDialog(action_options_dialog);
		action_dialog.addEventListener('click', function(dialogEvent) {
			switch(dialogEvent.index) {
				case 0:
					// use content feed
					_searchable.text.value = e.rowData.contentJSON.name;
					_searchable.text.contentJSON = e.rowData.contentJSON;
					if(isAndroid){
						self.close();
					}
					else{
						require('/ui/MasterWindow').getNavGroup().close(self);
					}
					break;
				case 1:
					// open webpage
					var urlWebView = require('/lib/urlWebView');
					var urlWin = new urlWebView(e.rowData.contentJSON.link, e.rowData.contentJSON.name, null, false);
					if (isAndroid) {
						urlWin.open();
					} else {
						require('/ui/MasterWindow').getNavGroup().open(urlWin);
					}		
					break;
				default:
					break;
			}
		});
		action_dialog.show();
	});
	tableView.addEventListener('scroll',function(e){
		if(_nextPage !== null && _updating === false){
			var startRefresh = false;
			if(isAndroid){
				startRefresh = (e.totalItemCount < e.firstVisibleItem + e.visibleItemCount + 3);
			}
			else{
				startRefresh = (e.contentOffset.y + e.size.height + 100 > e.contentSize.height);
			}
			if(startRefresh){
				_updating = true;
				refreshFbPageItems();
			}
		}
	});
	self.add(tableView);
	
	function refreshFbPageItems() {
		if(_nextPage !== null){
			try{
				startUpdate();
				
				xhr.open('GET', _nextPage);
				xhr.send();
				
				_nextPage = null;
			}
			catch(err){
				
				endUpdate();
			}
		}
	}
	
	search.fireEvent('return');
	
	return self;
}
module.exports = ContentFeedSearchWindow;