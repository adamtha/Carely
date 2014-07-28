function AboutWindow() {
	var theme = require('/ui/theme'), 
		ui = require('/ui/components');
	
	var isAndroid = Ti.Platform.osname === 'android';
	
	var self = new ui.Window({
		title:'About Carely',
		navBarHidden:isAndroid,
		backgroundColor:theme.winBgColor,
		orientationModes : [Ti.UI.PORTRAIT]
	});
	
	if(isAndroid){
	}
	else{
		self.tabBarHidden = true;
		self.barColor = theme.barColor;
	}
	
	var main_scrollView = Ti.UI.createScrollView({
		contentWidth: 'auto',
		contentHeight: 'auto',
		top: isAndroid ? 50 : 0,
		showVerticalScrollIndicator: true,
		showHorizontalScrollIndicator: true,
		scrollType: 'vertical',
		layout:'vertical',
		viewName: L('checkin', 'Check In')
	});
	self.add(main_scrollView);
	
	var header_view = Ti.UI.createView({
		top:0,
		left:0,
		height:theme.borderedImage.big.height + 12,
		width:Ti.UI.FILL
	});
	main_scrollView.add(header_view);
	
	var carely_logo = Ti.UI.createImageView({
		height:theme.borderedImage.big.height,
		width:theme.borderedImage.big.width,
		top:6,
		left:10,
		image:theme.images.carelyIcon,
		hires:true
	});
	header_view.add(carely_logo);
	
	var carely_header = Ti.UI.createLabel({
		top:6,
		left:carely_logo.left + carely_logo.width + 6,
		right:10,
		width:Ti.UI.FILL,
		height:Ti.UI.FILL,
		text:'Carely is the way to share the activities you care about',
		font:theme.defaultFontBold,
		color:theme.textColor
	});
	header_view.add(carely_header);
	
	var carely_desc = Ti.UI.createLabel({
		top:10,
		left:10,
		right:10,
		width:Ti.UI.FILL,
		text:'Carely helps you discover and join exciting activities taking place all around you!\nCheck in to activities and see what your friends and neighbors are up to - you might get inspired to try something new.\nFrom biking to bungee jumping, don\'t just do it, share it!',
		font:theme.defaultFont,
		color:theme.textColor
	});
	main_scrollView.add(carely_desc);
	
	var url_view = Ti.UI.createView({
		top:10,
		left:0,
		height:20,
		width:Ti.UI.FILL,
		layout:'horizontal'
	});
	main_scrollView.add(url_view);
	
	var carely_site_url = Ti.UI.createLabel({
		top:2,
		left:10,
		text:'visit us at ',
		font:theme.defaultFont,
		color:theme.textColor
	});
	url_view.add(carely_site_url);
	
	var carely_site_url = Ti.UI.createLabel({
		top:2,
		left:-1,
		text:'Care.ly',
		font:theme.defaultFont,
		color:theme.urlColor
	});
	carely_site_url.addEventListener('touchstart', function(e) {
		carely_site_url.color = theme.urlColorClicked;
	}); 
	carely_site_url.addEventListener('click', function(e){
		carely_site_url.color = theme.urlColor;
		
		if (this.clickTime && (new Date() - this.clickTime < 1000)) {
			return false;
		}
		this.clickTime = new Date();
		
		if(self.readyForClicks === false){
			return false;
		}
		
		var urlWebView = require('/lib/urlWebView');
		var urlWin = new urlWebView('http://care.ly', 'Carely', null, false);
		require('/ui/MasterWindow').getNavGroup().open(urlWin);
		self.readyForClicks = false;
		
		require('/lib/analytics').trackEvent({
			category : 'url',
			action : 'click',
			label : 'http://care.ly',
			value : null
		});
	});
	url_view.add(carely_site_url);
	
	self.addEventListener('focus', function(e){
		self.readyForClicks = true;
		
		require('/lib/analytics').trackScreen({ screenName : self.title });
	});
	return self;
}
module.exports = AboutWindow;