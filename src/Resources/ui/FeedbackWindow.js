function FeedbackWindow() {
	var theme = require('/ui/theme');
	
	function AddHideKeyboardOnClick(_item){
		_item.addEventListener('click', function(e){
			feedback_text.blur();
		});
	}
	
	var self = Ti.UI.createWindow({
		title : 'Send feedback',
		navBarHidden : false,
		backgroundColor : theme.winBgColor,
		orientationModes : [Ti.UI.PORTRAIT],
		barColor : theme.barColor
	});
	AddHideKeyboardOnClick(self);
	
	var main_scrollView = Ti.UI.createScrollView({
		contentWidth: 'auto',
		contentHeight: 'auto',
		top: 0,
		showVerticalScrollIndicator: true,
		showHorizontalScrollIndicator: false,
		scrollType: 'vertical',
		layout:'vertical'
	});
	AddHideKeyboardOnClick(main_scrollView);
	self.add(main_scrollView);
	
	var feedback_label = Ti.UI.createLabel({
		text : 'Got a cool feature idea? Found a bug? Any questions? Please let us know!',
		color : theme.textColor,
		top : theme.defaultItemSpacing / 2,
		left : 13,
		font : theme.defaultFont
	});
	main_scrollView.add(feedback_label);

	var feedback_text = Ti.UI.createTextArea({
		top : theme.defaultItemSpacing / 2,
		left : 10,
		right : 10,
		paddingLeft : 4,
		value : '',
		width : Ti.UI.FILL,
		height : 80,
		font : theme.defaultFont,
		color : theme.textColor,
		textAlign : Ti.UI.TEXT_ALIGNMENT_LEFT,
		keyboardType : Ti.UI.KEYBOARD_DEFAULT,
		appearance : Titanium.UI.KEYBOARD_APPEARANCE_ALERT,
		returnKeyType : Ti.UI.RETURNKEY_DEFAULT,
		borderColor : theme.tableBorderColor,
		borderRadius : theme.defaultBorderRadius,
		backgroundColor : '#fff',
		hintText : 'Feedback',
		autocapitalization : Ti.UI.TEXT_AUTOCAPITALIZATION_SENTENCES,
		autocorrect : true,
		suppressReturn:false
	});
	// feedback_text.addEventListener('return', function(e) {
		// this.value += '\n';
	// });
	main_scrollView.add(feedback_text);
	
	self.addEventListener('focus', function(e) {
		if (Ti.App.Properties.getBool('carely_goToHome', false) === true) {
			require('/ui/MasterWindow').getNavGroup().close(this, {
				animated : false
			});
		}
		else{
			feedback_text.focus();
			require('/lib/analytics').trackScreen({ screenName : self.title });
		}
	});
	
	var feedback_btn = Ti.UI.createButton({
		title : 'Submit',
		font : {
			fontSize : 20,
			fontFamily : theme.fontFamily,
			fontWeight : 'bold'
		},
		width : 300,
		height : 40,
		top : theme.defaultItemSpacing,
		left : 10,
		color: theme.whiteFontColor,
		selectedColor:theme.lightFontColor,
		backgroundImage:theme.buttonImage.green.normal,
		backgroundSelectedImage:theme.buttonImage.green.selected,
		style: Ti.UI.iPhone.SystemButtonStyle.PLAIN
	});
	function trimWhiteSpaces(s) {
		s = s.replace(/(^\s*)|(\s*$)/gi,"");
		s = s.replace(/[ ]{2,}/gi," ");
		s = s.replace(/\n /,"\n");
		return s;
	}
	feedback_btn.addEventListener('click', function(e){
		if(this.clickTime && (new Date() - this.clickTime < 1000)){
			return false;
		}
		this.clickTime = new Date();
		
		var content = feedback_text.value = feedback_text.value.replace(/(^\s*)|(\s*$)/gi, '');
		if (trimWhiteSpaces(content) === '') {
			Ti.UI.createAlertDialog({
				title : Ti.App.name,
				message : 'Feedback content cannot be empty'
			}).show();
		} else {
			var dlg = Ti.UI.createAlertDialog({
				message:'Thank you',
				buttonNames:[L('ok', 'OK')]
			});
			dlg.addEventListener('click', function(ee){
				require('/ui/MasterWindow').getNavGroup().close(self);
			});
			var currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
			if(currentUser && currentUser.email && currentUser.username){
				var emailsModel = require('/lib/model/emails'),
					common = require('/lib/common');
					
				var uname = common.getUserDisplayName(currentUser);
				emailsModel.feedback(uname, currentUser.email, content, function(emailEvent){
					if(!emailEvent.success){
						if(emailEvent.message){
							dlg.message = emailEvent.message;
						}
						else if(emailEvent.error){
							dlg.message = emailEvent.error;
						}
						else{
							dlg.message = 'Unknown error, please try again later';
						}
					}
					dlg.show();
				});
			}
			else{
				dlg.message = 'Couldnt get user details!';
				dlg.show();
			}
		}
	});
	main_scrollView.add(feedback_btn);
	
	return self;
}

module.exports = FeedbackWindow;