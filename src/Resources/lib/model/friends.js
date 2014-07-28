var Model = require('/lib/model/model'),
	Cloud = require('ti.cloud');

Cloud.debug = Model.debug;
if(Model.user_session){
	Cloud.sessionId = Model.user_session;
}

module.exports = {
	add : function(_user_ids, _cb) {
		Cloud.Friends.add({
			user_ids:_user_ids,
			approval_required:'false'
		}, _cb ? _cb : Model.eventDefaultCallback);
		
		require('/lib/analytics').trackEvent({
			category : 'friends',
			action : 'follow',
			label : _user_ids,
			value : null
		});
	},
	approve : function(_user_ids, _cb) {
		Cloud.Friends.approve({
			user_ids:_user_ids
		}, _cb ? _cb : Model.eventDefaultCallback);
	},
	requests : function(_cb) {
		Cloud.Friends.requests(null, _cb ? _cb : Model.eventDefaultCallback);
	},
	search : function(_user_id, _followers, _q, _page, _per_page, _cb) {
		var params = {
			user_id:_user_id
		};
		if(_followers){
			params.followers = 'true';
		}
		if(_q){
			params.q = _q;
		}
		if(_page){
			params.page = _page;
		}
		if(_per_page){
			params.per_page = _per_page;
		}
		
		Cloud.Friends.search(params, _cb ? _cb : Model.eventDefaultCallback);
	},
	remove : function(_user_ids, _cb) {
		Cloud.Friends.remove({
			user_ids:_user_ids,
		}, _cb ? _cb : Model.eventDefaultCallback);
		
		require('/lib/analytics').trackEvent({
			category : 'friends',
			action : 'unfollow',
			label : _user_ids,
			value : null
		});
	}
}
