var Model = require('/lib/model/model'),
	Cloud = require('ti.cloud');

Cloud.debug = Model.debug;
if(Model.user_session){
	Cloud.sessionId = Model.user_session;
}

var EmailsModel = {
	send : function(_template, _recipients, _from, _fields, _cb) {
		var params = {
			appname:Ti.App.name,
			template:_template,
			recipients:_recipients.join(',')
		};
		if(_from){
			params.from = _from;
		}
		if(_fields){
			for(var key in _fields){
				if(_fields.hasOwnProperty(key)){
					params[key] = _fields[key];
				}
			}
		}
		Cloud.Emails.send(params, _cb ? _cb : Model.eventDefaultCallback);
	}
}

module.exports = {
	welcome: function(_username, _emails, _cb){
		EmailsModel.send('Welcome', _emails, 'no-reply@care.ly', {
			username:_username
		}, _cb);
		
		require('/lib/analytics').trackEvent({
			category : 'email',
			action : 'welcome',
			label : _username,
			value : null
		});
	},
	feedback: function(_username, _useremail, _feedback, _cb){
		EmailsModel.send('Feedback', ['feedback@care.ly'], _useremail, {
			username:_username,
			feedback:_feedback
		}, _cb);
		
		require('/lib/analytics').trackEvent({
			category : 'email',
			action : 'feedback',
			label : _username,
			value : null
		});
	}
};

