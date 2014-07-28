var navGroup, masterWin, actionsButton;
exports.getNavGroup = function(){
	return navGroup;
};
exports.getMasterWindow = function(){
	return masterWin;
};
exports.getActionsButton = function(){
	return actionsButton;
};

exports.createMasterWindow  = function(){
	var theme = require('/ui/theme'),
		ActionsWindow = require('/ui/ActionsWindow'),
		MenuWindow = require('/ui/MenuWindow'),
		NewsWindow = require('/ui/NewsWindow');
	
	masterWin = Ti.UI.createWindow({
		barColor : theme.barColor,
		tabBarHidden : true,
		navBarHidden : false,
		backgroundColor:theme.winBgColor,
		orientationModes : [Ti.UI.PORTRAIT],
		left:0,
		zIndex:10
	});
	
	var newsWindow = new NewsWindow();
	actionsButton = Ti.UI.createButton({
		backgroundImage:theme.images.checkin_actions,
		height:30,
		width:40,
		isActive:false
	});
	newsWindow.rightNavButton = actionsButton;
	
	newsWindow.rightNavDefaultButton = actionsButton;
	
	var actionsWindow = null,
		currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
	if(currentUser){
		actionsWindow = new ActionsWindow();
	}
	actionsButton.addEventListener('click', function(e){
		if(e){
			e.cancelBubble = true;
		}
		if(!currentUser){
			currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
			if(!currentUser){
				return false;
			}
		}
		
		require('/lib/analytics').trackEvent({
			category : 'activities button',
			action : 'click',
			label : 'first time',
			value : (actionsWindow) ? 0 : 1
		});
		
		if(!actionsWindow){
			actionsWindow = new ActionsWindow();
		}
		if(this.isActive){
			return false;
		}
		this.isActive = true;
		
		navGroup.open(actionsWindow);
	});	
	newsWindow.addEventListener('focus', function(e){
		actionsButton.isActive = false;
	});
	
	var menuButton = Ti.UI.createButton({
		image:theme.images.menu
	});
	
	newsWindow.leftNavButton = menuButton;
	newsWindow.LeftMenuVisible = false;
	
	var animateLeft	= Ti.UI.createAnimation({
		left: Ti.Platform.displayCaps.platformWidth - 50,
		curve: Ti.UI.ANIMATION_CURVE_EASE_OUT,
		duration: 500
	});
	var animateRight = Ti.UI.createAnimation({
		left: 0,
		curve: Ti.UI.ANIMATION_CURVE_EASE_OUT,
		duration: 500
	});
	
	function MenuAnimate(e){
		if(e){
			e.cancelBubble = true;
		}
		if(leftMenu.opacity === 0.0){
			leftMenu.opacity = 1.0;
		}
		if(newsWindow.LeftMenuVisible === false){
			leftMenu.fireEvent('focus');
			masterWin.animate(animateLeft);
			newsWindow.LeftMenuVisible = true;
		} else {
			masterWin.animate(animateRight);
			newsWindow.LeftMenuVisible = false;
		}
	}
	menuButton.addEventListener('click', function(e) {
	  
	  MenuAnimate(e);
	  
	  require('/lib/analytics').trackEvent({
	  	category : 'menu button',
		action : 'click',
		label : null,
		value : null
	  });
		
	});
	
	newsWindow.LeftMenuHide = function(){
		MenuAnimate();
	};
	
	navGroup = Ti.UI.iPhone.createNavigationGroup({
		window:newsWindow,
		left: 0,
   		width: Ti.Platform.displayCaps.platformWidth
	});
	navGroup.goToHome = function(_currWin, _animated){
		
		require('/lib/analytics').trackEvent({
			category : 'app',
			action : 'navigate home',
			label : _currWin ? _currWin.title : null,
			value : null
		});
	  
		Ti.App.Properties.setBool('carely_goToHome', true);
		
		if(_currWin){
			setTimeout(function() {			
				navGroup.close(_currWin, {
					animated : _animated
				});
			}, 200);
		}
	};
	masterWin.add(navGroup);
	
	var leftMenu = new MenuWindow(navGroup, menuButton, actionsButton);
	leftMenu.opacity = 0.0;
	leftMenu.open();
	
	masterWin.addEventListener('open', function(e){
		require('/lib/analytics').trackScreen({ screenName : 'Master' });
	});
	
	return masterWin;
}
