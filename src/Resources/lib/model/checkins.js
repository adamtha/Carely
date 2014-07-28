var Model = require('/lib/model/model'),
	Cloud = require('ti.cloud');

Cloud.debug = Model.debug;
if(Model.user_session){
	Cloud.sessionId = Model.user_session;
}

module.exports = {
	create : function(_action_id, _content, _photo, _actionData, _cb) {
		var params = {
			event_id: _action_id,
			message : _content
		};
		if(_photo !== null) {
			params.photo = _photo;
			params['photo_sync_sizes[]'] = 'square_75';
		}
		if(_actionData !== null) {
			params.custom_fields = _actionData;
		}
		Cloud.Checkins.create(params, _cb ? _cb : Model.eventDefaultCallback);
	},
	queryPages : function(_where, _order, _page, _per_page, _cb) {
			var queryParams = {
				response_json_depth: 8
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
			Cloud.Checkins.query(queryParams, _cb ? _cb : Model.eventDefaultCallback);
	},
	query : function(_where, _order, _limit, _skip, _cb) {
		var queryParams = {};
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
		Cloud.Checkins.query(queryParams, _cb ? _cb : Model.eventDefaultCallback);
	},
	remove : function(_checkin_id, _keep_photo, _cb) {
		Cloud.Checkins.remove({
			checkin_id : _checkin_id,
			keep_photo: _keep_photo
		}, _cb ? _cb : Model.eventDefaultCallback);
	}
};
