var Model = require('/lib/model/model'),
	Cloud = require('ti.cloud');

Cloud.debug = Model.debug;
if(Model.user_session){
	Cloud.sessionId = Model.user_session;
}

module.exports = {
	create : function(_to_ids, _message, _fields, _cb) {
		var params = {
			to_ids : _to_ids,
			message : _message
		};
		if (_fields !== null) {
			params.custom_fields = JSON.stringify(_fields);
		}
		Cloud.Chats.create(params, _cb ? _cb : Model.eventDefaultCallback);
	},
	queryPages : function(_participate_ids, _where, _order, _page, _per_page, _cb) {
		var queryParams = {
			participate_ids : _participate_ids,
			response_json_depth : 4
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
		Cloud.Chats.query(queryParams, _cb ? _cb : Model.eventDefaultCallback);
	},
	query : function(_participate_ids, _where, _order, _limit, _skip, _cb) {
		var queryParams = {
			participate_ids : _participate_ids,
			response_json_depth : 4
		};
		if (_where !== null) {
			queryParams.where = _where;
		}
		if (_order !== null) {
			queryParams.order = _order;
		}
		if (_limit !== null) {
			queryParams.limit = _limit;
		}
		if (_skip !== null) {
			queryParams.skip = _skip;
		}
		Cloud.Chats.query(queryParams, _cb ? _cb : Model.eventDefaultCallback);
	}
};
