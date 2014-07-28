var Model = require('/lib/model/model'),
	Cloud = require('ti.cloud');

Cloud.debug = Model.debug;
if(Model.user_session){
	Cloud.sessionId = Model.user_session;
}

module.exports = {
	create : function(_to_ids, _body, _subject, _fields, _cb) {
		var params = {
			to_ids: _to_ids,
			body : _body
		};
		if(_subject !== null) {
			params.subject = _subject;
		}
		if(_fields !== null) {
			params.custom_fields = _fields;
		}
		Cloud.Messages.create(params, _cb ? _cb : Model.eventDefaultCallback);
	},
	show : function(_message_id, _cb){
		Cloud.Messages.show({message_id : _message_id}, _cb ? _cb : Model.eventDefaultCallback);
	},
	showInbox : function(_page, _per_page, _cb){
		Cloud.Messages.showInbox({
			page : _page,
			per_page : _per_page
		}, _cb ? _cb : Model.eventDefaultCallback);
	},
	showSent : function(_page, _per_page, _cb){
		Cloud.Messages.showSent({
			page : _page,
			per_page : _per_page
		}, _cb ? _cb : Model.eventDefaultCallback);
	},
	remove : function(_message_id, _cb){
		Cloud.Messages.remove({message_id : _message_id}, _cb ? _cb : Model.eventDefaultCallback);
	}
};
