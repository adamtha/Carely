exports.launch = function() {
	var Users = require('/lib/model/users'),
		MasterWindow = require('/ui/MasterWindow');
	
	var currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null)),
		user_session = Ti.App.Properties.getString('carely_user_session', null);
	
	var masterWindow = new MasterWindow.createMasterWindow();
	//masterWindow.hide();
		
	//masterWindow.show();
	
	Ti.App.Properties.setBool('carely_handlePushNotifications', true);
	Ti.App.Properties.setBool('carely_just_loggedin', false);
		
	if(currentUser && user_session !== null){
		var Cloud = require('ti.cloud'),
			common = require('/lib/common');
			
		Cloud.sessionId = user_session;
		
		common.refreshHandler.setRefresh.all(true);

		Ti.App.fireEvent('geo.handle');
		
		require('/lib/analytics').trackEvent({
			category : 'app',
			action : 'start',
			label : 'active session, user login',
			value : null
		});
	}
	else{
		Ti.App.Properties.setString('carely_user', null);
    	
    	var SignupWindow = require('/ui/SignupWindow');
		var signupWin = new SignupWindow();
		
		MasterWindow.getNavGroup().open(signupWin, {animated:false});
		
		require('/lib/analytics').trackEvent({
			category : 'app',
			action : 'start',
			label : 'no session, signup',
			value : null
		});
	}
	masterWindow.open();
}; 