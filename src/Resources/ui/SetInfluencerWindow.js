function SetInfluencerWindow(_user_id, _influencer) {
	var theme = require('/ui/theme'),
		common = require('/lib/common'),
		Model = require('/lib/model/model');
	
	var self = Ti.UI.createWindow({
		title:'Set Influencer',
		navBarHidden:false,
		tabBarHidden:true,
		barColor:theme.barColor,
		backgroundColor:theme.defaultBgColor,
		orientationModes : [Ti.UI.PORTRAIT],
		layout : 'vertical'
	});
	
	var save_btn = Ti.UI.createButton({
		title:'Save'
	});
	save_btn.addEventListener('click', function(e){
		if(e){
			e.cancelBubble = true;
		}
		
		var _alert_message = null;
		if(_user_id){
			if(selected_row && selected_row.pageJSON && selected_row.pageJSON.id && selected_row.pageJSON.link){
				if(_influencer && _influencer.id === selected_row.pageJSON.id){
					return false;
				}
					
				var UsersModel = require('/lib/model/users');
				UsersModel.update({
					user_id : _user_id,
					custom_fields : {
						influencer_id : selected_row.pageJSON.id,
						influencer_link : selected_row.pageJSON.link,
						influencer_json : selected_row.pageJSON
					}
				}, function(updateEvent) {
					if (updateEvent.success) {
						common.showMessageWindow('Influencer updated successfully', 200, 200, 500);
						Model.AppCache.users.set(updateEvent.users[0]);
						
						require('/ui/MasterWindow').getNavGroup().close(self);
					} else {
						Model.eventDefaultErrorCallback(updateEvent);
					}
				});
			}
			else{
				_alert_message = 'Invalid Facebook page';
			}
		}
		else{
			_alert_message = 'Invalid User id';
		}
		
		if(_alert_message){
			alert(_alert_message);
		}
		
		require('/lib/analytics').trackEvent({
			category : 'influencer',
			action : 'save',
			label : _alert_message,
			value : null
		});
	});
	self.rightNavButton = save_btn;
		
	var last_search = null;
	var search = Ti.UI.createSearchBar({
		barColor : theme.subBarColor,
		hintText : 'Search Facebook page',
		autocapitalization : Ti.UI.TEXT_AUTOCAPITALIZATION_SENTENCES
	});
	search.addEventListener('blur', function(e){
		search.showCancel = false;
	});
	search.addEventListener('focus', function(e) {
		search.showCancel = true;
	});
	search.addEventListener('return', function(e) {
		search.blur();
		if (search.value && search.value.length > 2 && search.value !== last_search) {
			last_search = search.value;
			searchFacebookPage(search.value);
		}
	});
	search.addEventListener('cancel', function(e) {
		search.blur();
	});
	self.add(search);
	
	function createFacebookPageRow(_item){	
		var row = null;
		if(_item && _item.id && _item.name && _item.is_published){
			row = Ti.UI.createTableViewRow({
				height : defaultRowHeight,
				width : Ti.UI.FILL,
				backgroundImage : theme.images.rowBox.normal,
				selectionStyle : Ti.UI.iPhone.TableViewCellSelectionStyle.NONE,
				page_id:_item.id,
				page_link:_item.link,
				hasCheck:false,
				pageJSON:_item,
				className : 'FacebookAdmin_Row'
			});
			
			if(_influencer && _influencer.id === _item.id){
				row.hasCheck = true;
			}
			
			var row_view = Ti.UI.createView({
				height : Ti.UI.FILL,
				width : Ti.UI.FILL
			});
			row.add(row_view);
			
			var pageIcon = theme.images.facebook_icon;
			if(_item.icon){
				pageIcon = _item.icon; 
			}
			else if(_item.picture && _item.picture.data && _item.picture.data.url && _item.picture.data.is_silhouette === false){
				pageIcon = _item.picture.data.url
			}
			
			var icon = Ti.UI.createImageView({
				image : pageIcon,
				width : theme.borderedImage.user.width,
				height : theme.borderedImage.user.height,
				left : 2,
				top : 4,
				hires : true
			});
			row_view.add(icon);
	
			var pageName = Ti.UI.createLabel({
				top : 0,
				left : icon.left + icon.width + 6,
				right : 6,
				height:20,
				text : _item.name,
				font : theme.defaultToolTipFont,
				color : theme.textColor,
				textAlign : Ti.UI.TEXT_ALIGNMENT_LEFT
			});
			row_view.add(pageName);
	
			if(_item.about){
				var pageDesc = Ti.UI.createLabel({
					top : 22,
					left : icon.left + icon.width + 6,
					right : 6,
					text : _item.about,
					font : {
						fontSize : 12,
						fontFamily : theme.fontFamily
					},
					color : theme.lightFontColor,
					textAlign : Ti.UI.TEXT_ALIGNMENT_LEFT
				});
				row_view.add(pageDesc);
			}
		}
		
		return row;
	}
	
	function searchFacebookPage(value){
		tableView.appendRow(loading_row, {animated:false});
		
		footer_view.height = 0;
		
		var facebookModule = require('facebook');
		facebookModule.appid = common.FACEBOOK_APP_ID;
		facebookModule.permissions = common.FACEBOOK_APP_PERMISSIONS;
		facebookModule.forceDialogAuth = false;
		
		facebookModule.requestWithGraphPath(value, {
			fields : 'id,link,name,about,is_published,picture',
			limit : 100,
			offset : 0
		},'GET', function(searchEvent) {
			var fb_page = null;
			
			if (searchEvent.success && searchEvent.result) {
				var page = JSON.parse(searchEvent.result);
				if (page.id && page.name && page.is_published) {
					fb_page = page;
				}
			}

			var row = createFacebookPageRow(fb_page);
			if(row){
				influencer_rows.push(row);
				var _ = require('/lib/underscore');
				influencer_rows = _.uniq(influencer_rows, false, function(p){
					return p.page_id;
				});
			}
			else{
				no_pages_lbl.text = 'Page not found for \'' + value + '\'';
				footer_view.height = Ti.UI.SIZE;
			}
			
			require('/lib/analytics').trackEvent({
				category : 'influencer',
				action : 'search',
				label : value,
				value : row ? 1 : 0
			});
			
			tableView.setData(influencer_rows);
		});
	}
	
	var defaultRowHeight = theme.borderedImage.user.height + 8;
	var influencer_rows = [],
		influencer_row = createFacebookPageRow(_influencer),
		selected_row = null,
		loading_row = Titanium.UI.createTableViewRow({
		height:30,
		backgroundColor:theme.defaultBgColor
	});
	if(influencer_row){
		selected_row = influencer_row;
		influencer_rows.push(influencer_row);
	}
	
	var act_Ind = Titanium.UI.createActivityIndicator({
		left : '43%',
		top : 5,
		height : 'auto',
		width : 'auto',
		color : theme.textColor,
		font : theme.defaultFont,
		style : Titanium.UI.iPhone.ActivityIndicatorStyle.DARK
	});
	act_Ind.show();
	loading_row.add(act_Ind);
	
	var footer_view = Ti.UI.createView({
		height:0,
		width:Ti.UI.FILL
	});
	
	var no_pages_icon = Ti.UI.createImageView({
		image : theme.images.facebook_off,
		width : theme.borderedImage.user.width,
		height : theme.borderedImage.user.height,
		left : 2,
		top : 4,
		hires : true
	});
	footer_view.add(no_pages_icon);

	var no_pages_lbl = Ti.UI.createLabel({
		top : 0,
		left : no_pages_icon.left + no_pages_icon.width + 6,
		right : 6,
		height : 20,
		text : 'No pages found',
		font : theme.defaultToolTipFont,
		color : theme.textColor,
		textAlign : Ti.UI.TEXT_ALIGNMENT_LEFT
	});
	footer_view.add(no_pages_lbl);
	
	var tableView = Ti.UI.createTableView({
		data : influencer_rows,
		top : 0,
		width : Ti.UI.FILL,
		footerView : footer_view,
		style : Ti.UI.iPhone.TableViewStyle.PLAIN,
		separatorStyle : Ti.UI.iPhone.TableViewSeparatorStyle.NONE,
		bubbleParent:false
	});
	tableView.addEventListener('singletap', function(e){
		if(search.showCancel){
			search.blur();
		}
		
		if(e && e.row){
			e.cancelBubble = true;
			
			if(e.row.page_id){
				require('/lib/analytics').trackEvent({
					category : 'influencer',
					action : 'table',
					label : 'click',
					value : e.row.hasCheck ? 1 : 0
				});
		
				e.row.hasCheck = !e.row.hasCheck;
				 
				if(selected_row){
					selected_row.hasCheck = false;
				}
				if(e.row.hasCheck){
					selected_row = e.row;
				}
				else{
					selected_row = null;
				} 
			}
		}
	});
	var _scrolling = false;
	tableView.addEventListener('scroll', function(e){
		if(!_scrolling && search.showCancel){
			search.blur();
		}
		_scrolling = true;
	});
	tableView.addEventListener('scrollEnd', function(e) {
		_scrolling = false;
		
		require('/lib/analytics').trackEvent({
			category : 'influencer',
			action : 'table',
			label : 'scroll',
			value : null
		});
	});
	self.add(tableView);
	
	self.addEventListener('open', function(e){
		require('/lib/analytics').trackScreen({ screenName : self.title });
	});
	
	return self;
}
module.exports = SetInfluencerWindow;