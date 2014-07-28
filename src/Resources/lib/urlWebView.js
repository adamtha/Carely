function urlWebView(_url, _title, _searchable, _showNav){
	var theme = require('/ui/theme'),
		common = require('/lib/common');

	if(!_url || _url === '' || _url === 'http://'){
		_url = 'http://www.google.com';
	}
	if(_url.indexOf('http://') === -1 && _url.indexOf('https://') === -1){
		_url = 'http://' + _url;
	}
	
	var isAndroid = Ti.Platform.osname === 'android';
	var currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
	
	var self = Ti.UI.createWindow({
		title : _title,
		navBarHidden : isAndroid,
		backgroundColor: theme.winBgColor,
		orientationModes : [Ti.UI.PORTRAIT]
	});
	
	var action_options_dialog = {
		cancel : 2
	};
	if (isAndroid) {
		action_options_dialog.buttonNames = ['Open in Safari', 'Copy URL', 'Cancel'];
		action_options_dialog.selectedIndex = 2;
	} else {
		action_options_dialog.options = ['Open in Safari', 'Copy URL', 'Cancel'];
	}
	if(_searchable && _searchable.text){
		var option_text = 'Set URL';
		if(_searchable.option_text && _searchable.option_text.length){
			option_text = _searchable.option_text;
		}
		action_options_dialog.cancel = 3;
		if (isAndroid) {
			action_options_dialog.buttonNames = ['Open in Safari', 'Copy URL', option_text, 'Cancel'];
			action_options_dialog.selectedIndex = 3;
		} else {
			action_options_dialog.options = ['Open in Safari', 'Copy URL', option_text, 'Cancel'];
		}
	}
	var action_dialog = Ti.UI.createOptionDialog(action_options_dialog);
	action_dialog.addEventListener('click', function(dialogEvent) {
		switch(dialogEvent.index) {
			case 0:
				// open in safari
				Ti.Platform.openURL(web_view.url);
				break;
			case 1:
				// copy url
				Ti.UI.Clipboard.clearText();
				Ti.UI.Clipboard.setText(web_view.url);				
				break;
			case 2:
				if(dialogEvent.cancel !== dialogEvent.index){
					// use action url
					_searchable.text.value = web_view.getUrl();
					if(isAndroid){
						self.close();
					}
					else{
						require('/ui/MasterWindow').getNavGroup().close(self);
					}
				}		
				break;
			default:
				break;
		}
	}); 

	if(_showNav !== false){
		_showNav = true;
	}
	
	if(isAndroid) {
		
	}
	else{
		self.barColor = theme.barColor;
		
		if(_showNav){
			var rightNavButton = Ti.UI.createButton({
				systemButton : Ti.UI.iPhone.SystemButton.ACTION
			});
			rightNavButton.addEventListener('click', function(e) {
				action_dialog.show();
			});
			self.rightNavButton = rightNavButton; 
		}
	}
	
	if(_showNav){
		var navigation_view = Ti.UI.createView({
			top:0,
			height:48,
			width:Ti.UI.FILL,
			backgroundColor:'#D3D6DD'
		});
		self.add(navigation_view);
		
		var prevButton = Ti.UI.createButton({
			top:11,
			left:6,
			image:theme.images.web.prev,
			height:26,
			width:26,
			style:Ti.UI.iPhone.SystemButtonStyle.PLAIN,
			enabled:false
		});
		prevButton.addEventListener('click', function(e){
			web_view.goBack();
		});
		navigation_view.add(prevButton);
		
		var nextButton = Ti.UI.createButton({
			top:11,
			left:prevButton.left + prevButton.width + 10,
			image:theme.images.web.next,
			height:26,
			width:26,
			style:Ti.UI.iPhone.SystemButtonStyle.PLAIN,
			enabled:false
		});
		nextButton.addEventListener('click', function(e){
			web_view.goForward();
		});
		navigation_view.add(nextButton);
		
		var rightButton = Titanium.UI.createButton({
			image:theme.images.web.refresh,
			style:Ti.UI.iPhone.SystemButtonStyle.PLAIN,
			enabled:false
		});
		rightButton.addEventListener('click', function(e){
			web_view.reload();
		});
		
		var urlText = Ti.UI.createTextField({
			top:6,
			right:6,
			height:36,
			width:230,
			value:_url,
			font: theme.defaultFont,
			color: theme.textColor,
			appearance: Ti.UI.KEYBOARD_APPEARANCE_ALERT,
			returnKeyType:Ti.UI.RETURNKEY_GO,
			keyboardType:Ti.UI.KEYBOARD_URL,
			rightButton:rightButton,
			rightButtonMode:Ti.UI.INPUT_BUTTONMODE_ONBLUR,
			borderStyle:Ti.UI.INPUT_BORDERSTYLE_ROUNDED,
			textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
			paddingLeft:2,
			autocapitalization:Ti.UI.TEXT_AUTOCAPITALIZATION_NONE,
			autocorrect:false
		});
		urlText.addEventListener('blur', function(e){
			if(this.value && this.value.length > 0){
				web_view.setUrl(this.value);
				web_view.reload();
			}
		});
		navigation_view.add(urlText);
		
		var divider_view = Ti.UI.createView({
			backgroundColor:'#111931',
			top:48,
			height:1
		});
		self.add(divider_view);
	}
		
	var web_view = Ti.UI.createWebView({
		top: _showNav ? 49 : 0,
		url:_url,
		enableZoomControls:true,
		willHandleTouches:false,
		scalesPageToFit:true,
		scrollsToTop:true
	});
	web_view.addEventListener('load', function(e){
		if(_showNav){
			urlText.v = e.url;
			prevButton.enabled = web_view.canGoBack();
			nextButton.enabled = web_view.canGoForward();
			rightButton.enabled = true;
		}
	});
	self.add(web_view);
	
	self.addEventListener('open', function(e){
		if(Ti.App.Properties.getBool('carely_goToHome', false) === true){
			require('/ui/MasterWindow').getNavGroup().close(this, {animated:false});
		}
		else{
			require('/lib/analytics').trackScreen({ screenName : 'Web URL' });
			
			require('/lib/analytics').trackEvent({
				category : 'url',
				action : _url,
				label : _title,
				value : null
			}); 
		}
	});
	return self;
}
module.exports = urlWebView;
