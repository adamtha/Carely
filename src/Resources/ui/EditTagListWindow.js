function EditTagListWindow(_params) {
	var _ = require('/lib/underscore'),
		theme = require('/ui/theme'),
		common = require('/lib/common'),
		Model = require('/lib/model/model'), 
		ObjectsModel = require('/lib/model/objects');
	
	var focusedText = null;
	function blurText(){
		if(focusedText !== null){
			focusedText.blur();
		}
	}
	function AddHideKeyboardOnClick(_item){
		_item.addEventListener('click', blurText);
	}
	
	var saveButton = Ti.UI.createButton({
		systemButton:Ti.UI.iPhone.SystemButton.SAVE
	});
	saveButton.addEventListener('click', function(e) {
		blurText();
		
		if (this.clickTime && (new Date() - this.clickTime < 1000)) {
			return false;
		}
		this.clickTime = new Date();

		require('/lib/analytics').trackEvent({
			category : 'activity list',
			action : 'update',
			label : null,
			value : null
		});
		
		var updateParams = {
			is_private : is_private_switch.value,
			order_rank : (rank_text.value * 1 || 1)
		};
		
		if(facebook_text.contentJSON){
			if(facebook_text.contentJSON.id !== facebook_text.original_id){
				updateParams.facebook_data = facebook_text.contentJSON;
			}
		}
		
		var _list_name = name_text.value.replace(/(^\s*)|(\s*$)/gi, '');
		if (_list_name.length < 3) {
				name_text.focus();
				if(!_list_name.length){
					Ti.UI.createAlertDialog({
						message : 'Select a name for your activity list',
						buttonNames : [L('ok', 'OK')]
					}).show(); 
				}
				else{
					Ti.UI.createAlertDialog({
						message : 'Activity list names should be at least 3 characters long',
						buttonNames : [L('ok', 'OK')]
					}).show(); 
				}
			} else {
				if(_list_name !== name_text.original_value){
					updateParams.name = _list_name;
					updateParams.name_lower = _list_name.toLowerCase();
					updateParams.tags = updateParams.name_lower.split(' ');
				}
				Ti.API.info('updateParams:' + JSON.stringify(updateParams));
				
				var actIndicator = require('/ui/ActivityIndicator');
				var indicator = new actIndicator();
				
				indicator.showModal('Updating activity list...', 60000, 'Timeout creating activity list!');
				if(updateParams.name_lower){
					ObjectsModel.query(ObjectsModel.classNames.tag_lists, {
						name_lower : updateParams.name_lower
					}, null, 1, 0, function(queryEvent) {
						if (queryEvent.success) {
	
							if (queryEvent[ObjectsModel.classNames.tag_lists] && queryEvent[ObjectsModel.classNames.tag_lists].length) {
								indicator.hideModal();
								
								// we already have an activity list with that name
								name_text.focus();
								Ti.UI.createAlertDialog({
									message : 'Activity list with that name already exists!',
									buttonNames : [L('ok', 'OK')]
								}).show(); 
							} else {
								// update activity list
								updateActivityList(indicator, name_text.list_id, updateParams);
							}
						} else {
							indicator.hideModal();
							Model.eventDefaultErrorCallback(queryEvent);
						}
					});
				}
				else{
					updateActivityList(indicator, name_text.list_id, updateParams);
				}
			}
	}); 

	function updateActivityList(indicator, updateId, updateParams) {		
		ObjectsModel.update(ObjectsModel.classNames.tag_lists, updateId, updateParams, null, null, function(updateEvent) {
			if(indicator){
				indicator.hideModal();
			}

			if (updateEvent.success) {
				Ti.App.Properties.setString('List_tag', JSON.stringify(updateEvent[ObjectsModel.classNames.tag_lists][0]));

				require('/ui/MasterWindow').getNavGroup().close(self);
			} else {
				Model.eventDefaultErrorCallback(updateEvent);
			}
		});
	}


	var self = Ti.UI.createWindow({
		title:'Edit list',
		navBarHidden:false,
		backgroundColor:theme.winBgColor,
		orientationModes : [Ti.UI.PORTRAIT],
		barColor : theme.barColor,
		tabBarHidden : true
	});
	
	var main_scrollView = Ti.UI.createScrollView({
		contentWidth: Ti.Platform.displayCaps.platformWidth,
		contentHeight: 'auto',
		top:0,
		showVerticalScrollIndicator: true,
		showHorizontalScrollIndicator: false,
		scrollType: 'vertical',
		layout:'vertical'
	});
	AddHideKeyboardOnClick(main_scrollView);
	self.add(main_scrollView);
	
	var name_title = Ti.UI.createLabel({
		text: 'Activity list name',
		color: theme.textColor,
		top: 10,
		left: 10,
		font: theme.defaultFontBold
	});
	main_scrollView.add(name_title);
	
	var name_text = Ti.UI.createTextField({
		top:4,
		left:10,
		right:10,
		paddingLeft:4,
		value:'',
		width:Ti.UI.FILL,
		height:30,
		font: theme.defaultFont,
		color: theme.textColor,
		textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
		keyboardType:Ti.UI.KEYBOARD_NAMEPHONE_PAD,
		appearance: Titanium.UI.KEYBOARD_APPEARANCE_ALERT,
		returnKeyType:Ti.UI.RETURNKEY_NEXT,
		borderColor : theme.tableBorderColor,
		borderRadius : theme.defaultBorderRadius,
		backgroundColor: '#fff',
		hintText:'list name',
		autocapitalization:Ti.UI.TEXT_AUTOCAPITALIZATION_NONE,
		autocorrect:false,
		txtUpdating:false,
		original_value:''
	});
	name_text.addEventListener('return', function(e) {
		rank_text.focus();
	});
	name_text.addEventListener('focus', function(e) {
		focusedText = this;
	});
	name_text.addEventListener('blur', function(e) {
		focusedText = null;
	});
	name_text.addEventListener('change', function(e) {
		if(!this.value.length){
			this.value = this.original_value;
		}
	});
	main_scrollView.add(name_text);
	
	var rank_title = Ti.UI.createLabel({
		text: 'Activity rank',
		color: theme.textColor,
		top: 10,
		left: 10,
		font: theme.defaultFontBold
	});
	main_scrollView.add(rank_title);
	
	var rank_text = Ti.UI.createTextField({
		top:4,
		left:10,
		right:10,
		paddingLeft:4,
		value:'',
		width:Ti.UI.FILL,
		height:30,
		font: theme.defaultFont,
		color: theme.textColor,
		textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
		keyboardType:Ti.UI.KEYBOARD_NAMEPHONE_PAD,
		appearance: Titanium.UI.KEYBOARD_APPEARANCE_ALERT,
		returnKeyType:Ti.UI.RETURNKEY_NEXT,
		borderColor : theme.tableBorderColor,
		borderRadius : theme.defaultBorderRadius,
		backgroundColor: '#fff',
		hintText:'1',
		autocapitalization:Ti.UI.TEXT_AUTOCAPITALIZATION_NONE,
		autocorrect:false,
		txtUpdating:false,
		original_value:'1'
	});
	rank_text.addEventListener('return', function(e) {
		facebook_text.focus();
	});
	rank_text.addEventListener('focus', function(e) {
		focusedText = this;
	});
	rank_text.addEventListener('blur', function(e) {
		focusedText = null;
	});
	rank_text.addEventListener('change', function(e) {
		if(!this.value.length){
			this.value = this.original_value;
		}
	});
	main_scrollView.add(rank_text);
	
	var facebook_view = Ti.UI.createView({
		height : Ti.UI.SIZE,
		width:Ti.UI.FILL
	});
	AddHideKeyboardOnClick(facebook_view);
	main_scrollView.add(facebook_view);
	
	var facebook_title = Ti.UI.createLabel({
		text: 'Facebook link',
		color: theme.textColor,
		top: 10,
		left: 10,
		right:46,
		font: theme.defaultFontBold
	});
	facebook_view.add(facebook_title);
	
	var facebook_button = Titanium.UI.createButton({
		top: 10,
		right: 10,
		image:theme.images.facebook_icon,
		height:20,
		width:20,
		style:Ti.UI.iPhone.SystemButtonStyle.PLAIN
	});
	facebook_button.addEventListener('click', function(e){
		blurText();
		
		if(this.clickTime && (new Date() - this.clickTime < 1000)){
			return false;
		}
		this.clickTime = new Date();
		
		var currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
		if (currentUser.external_accounts) {
			var fb_token = null;
			for (var i = 0, v = currentUser.external_accounts.length; i < v; i++) {
				if (currentUser.external_accounts[i].external_id && currentUser.external_accounts[i].external_type === 'facebook' &&
					currentUser.external_accounts[i].token) {
					fb_token = currentUser.external_accounts[i].token;
					break;
				}
			}
			
			if(fb_token){
				var ContentFeedSearchWindow = require('/ui/ContentFeedSearchWindow');
				var contentFeedSearchWindow = new ContentFeedSearchWindow(facebook_text.value, 'Search facebook', {text:facebook_text}, fb_token);
				require('/ui/MasterWindow').getNavGroup().open(contentFeedSearchWindow);
			}
		}
	});
	facebook_view.add(facebook_button);
	
	var facebook_text = Ti.UI.createTextField({
		top:4,
		left:10,
		right:10,
		paddingLeft:4,
		value:'',
		width:Ti.UI.FILL,
		height:30,
		font: theme.defaultFont,
		color: theme.textColor,
		textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
		keyboardType:Ti.UI.KEYBOARD_NAMEPHONE_PAD,
		appearance: Titanium.UI.KEYBOARD_APPEARANCE_ALERT,
		returnKeyType:Ti.UI.RETURNKEY_NEXT,
		borderColor : theme.tableBorderColor,
		borderRadius : theme.defaultBorderRadius,
		backgroundColor: '#fff',
		hintText:'facebook link',
		autocapitalization:Ti.UI.TEXT_AUTOCAPITALIZATION_NONE,
		autocorrect:false,
		txtUpdating:false,
		original_value:''
	});
	facebook_text.addEventListener('return', function(e) {
		name_text.focus();
	});
	facebook_text.addEventListener('focus', function(e) {
		focusedText = this;
	});
	facebook_text.addEventListener('blur', function(e) {
		focusedText = null;
	});
	facebook_text.addEventListener('change', function(e) {
		if(!this.value.length && this.contentJSON){
			this.value = this.contentJSON.name;
		}
	});
	main_scrollView.add(facebook_text);
	
	var is_private_view = Ti.UI.createView({
		top:10,
		left:10,
		right:10,
		height : theme.tableDefaultHeight,
		width:Ti.UI.FILL,
		borderColor:theme.tableBorderColor,
		borderRadius:theme.defaultBorderRadius
	});
	AddHideKeyboardOnClick(main_scrollView);
	main_scrollView.add(is_private_view);
	
	var is_private_label = Ti.UI.createLabel({
		text:'Private list',
		top: 10,
		left:0,
		color : theme.textColor,
		font : theme.defaultFontBold
	});
	is_private_view.add(is_private_label);
	
	var is_private_switch = Ti.UI.createSwitch({
		right:0,
		value:false
	});
	is_private_view.add(is_private_switch);
	
	var rss_view = Ti.UI.createView({
		height : Ti.UI.SIZE,
		width:Ti.UI.FILL
	});
	AddHideKeyboardOnClick(rss_view);
	main_scrollView.add(rss_view);
	
	var rss_button = Titanium.UI.createButton({
		top: 10,
		left: (Ti.Platform.displayCaps.platformWidth - 200) / 2,
		title:'Copy RSS link',
		height:30,
		width:200,
		backgroundImage : theme.buttonImage.green.normal,
		backgroundSelectedImage : theme.buttonImage.green.selected,
		font : theme.defaultFontBold,
		style : Ti.UI.iPhone.SystemButtonStyle.PLAIN,
		touchEnabled : true,
		rss_link:''
	});
	rss_button.addEventListener('click', function(e){
		blurText();
		
		if(this.clickTime && (new Date() - this.clickTime < 1000)){
			return false;
		}
		this.clickTime = new Date();
		
		if(this.rss_link && this.rss_link.length){
			Ti.UI.Clipboard.clearText();
			Ti.UI.Clipboard.setText(this.rss_link);
						
			common.showMessageWindow('Copied to clipborad', 140, 140, 2000);
		}
	});
	main_scrollView.add(rss_button);
	
	self.addEventListener('open', function(e){	
		var currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null)),
			List_tag = JSON.parse(Ti.App.Properties.getString('List_tag', null));
		
		if(currentUser && currentUser.admin === 'true' && currentUser.custom_fields && currentUser.custom_fields.show_admin_features !== false){
			// current user is admin
			if(List_tag && List_tag.id && !List_tag.all_activities){
				// list tag is fine
				
				name_text.list_id = List_tag.id;
				name_text.value = List_tag.name;
				name_text.original_value = List_tag.name;
				
				rank_text.value = List_tag.order_rank;
				rank_text.original_value = List_tag.order_rank;
				
				is_private_switch.value = List_tag.is_private;
				
				if(List_tag.facebook_data){
					facebook_text.value = List_tag.facebook_data.name;
					facebook_text.original_id = List_tag.facebook_data.id;
					facebook_text.contentJSON = List_tag.facebook_data;
				}
				
				rss_button.rss_link = 'https://f123c60acc313a41ad9026324916f8a54312bae6.cloudapp.appcelerator.com/rss?id=' + List_tag.id;
				
				self.rightNavButton = saveButton;
			}
			else{
				self.rightNavButton = null;
				main_scrollView.height = 0;
			}
		}
	});
	
	self.addEventListener('focus', function(e){	
		require('/lib/analytics').trackScreen({ screenName : self.title });		
	});
	
	return self;
}

module.exports = EditTagListWindow;