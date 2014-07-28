var Model = require('/lib/model/model'),
	Cloud = require('ti.cloud');

Cloud.debug = Model.debug;
if(Model.user_session){
	Cloud.sessionId = Model.user_session;
}

module.exports = {
	create : function(_username, _email, _password, _passwordConfirmation, _role, _photo, _fields, _cb) {
		var createParams = {
			username : _username,
			email : _email,
			password : _password,
			password_confirmation : _passwordConfirmation,
			role: _role
		};
		if(_photo) {
			createParams.photo = _photo;
			createParams['photo_sync_sizes[]'] = 'square_75';
		}
		if(_fields) {
			createParams.custom_fields = _fields;
		}
		Cloud.Users.create(createParams, _cb ? _cb : Model.eventDefaultCallback);
		
		require('/lib/analytics').trackEvent({
			category : 'user',
			action : 'create',
			label : _email,
			value : null
		});
	},
	get : function(_userIds, _cb) {
		var params = {};
		if(_userIds.indexOf(',') !== -1) {
			params = { user_ids : _userIds };
		}
		else{
			params = { user_id : _userIds };
		}
		Cloud.Users.show(params, _cb ? _cb : Model.eventDefaultCallback);
	},
	isLoggedIn: function(){
		return Ti.App.Properties.hasProperty('carely_user_session');
		//return Cloud.hasStoredSession();
	},
	current : function(_cb) {
		Cloud.Users.showMe( _cb ? _cb : Model.eventDefaultCallback);
	},
	queryPages : function(_where, _order, _page, _per_page, _cb) {
			var queryParams = {
				response_json_depth: 4
			};
			if (_where !== null) {
				queryParams.where = _where;
			}
			if (_order !== null) {
				queryParams.order = _order;
			}
			if (_page !== null) {
				queryParams.page = _page;
			}
			if (_per_page !== null) {
				queryParams.per_page = _per_page;
			}
			Cloud.Users.query(queryParams, _cb ? _cb : Model.eventDefaultCallback);
	},
	query : function(_where, _order, _limit, _skip, _cb) {
		var queryParams = {
			response_json_depth: 4
		};
		if(_where !== null) {
			queryParams.where = _where;
		}
		if(_order !== null) {
			queryParams.order = _order;
		}
		if(_limit !== null) {
			queryParams.limit = _limit;
		}
		if(_skip !== null) {
			queryParams.skip = _skip;
		}
		Cloud.Users.query(queryParams, _cb ? _cb : Model.eventDefaultCallback);
	},
	search : function(_q, _page, _per_page, _cb) {
		var queryParams = {
			response_json_depth : 4
		};
		if (_q !== null) {
			queryParams.q = _q;
		}
		if (_page !== null) {
			queryParams.page = _page;
		}
		if (_per_page !== null) {
			queryParams.per_page = _per_page;
		}
		Cloud.Users.search(queryParams, _cb ? _cb : Model.eventDefaultCallback);
	},
	update : function(_params, _cb) {
		Cloud.Users.update(_params, _cb ? _cb : Model.eventDefaultCallback);
	},
	remove : function(_cb) {
		Cloud.Users.remove({
			keep_photo : false
		}, _cb ? _cb : Model.eventDefaultCallback);
	},
	login : function(_email, _password, _cb) {
		Cloud.Users.login({
			login : _email,
			password : _password
		}, _cb ? _cb : Model.eventDefaultCallback);
		
		require('/lib/analytics').trackEvent({
			category : 'user',
			action : 'login',
			label : _email,
			value : null
		});
	},
	logout : function(_cb) {
		Cloud.Users.logout(_cb ? _cb : Model.eventDefaultCallback);
		
		var currUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
		
		require('/lib/analytics').trackEvent({
			category : 'user',
			action : 'logout',
			label : currUser ? currUser.email : null,
			value : null
		});
	},
	resetPassword : function(_email, _cb) {
		Cloud.Users.requestResetPassword({
			email : _email
		}, _cb ? _cb : Model.eventDefaultCallback);
		
		require('/lib/analytics').trackEvent({
			category : 'user',
			action : 'reset password',
			label : _email,
			value : null
		});
	}
};
