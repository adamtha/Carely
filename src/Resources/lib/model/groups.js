var Model = require('/lib/model/model'),
	Cloud = require('ti.cloud');

Cloud.debug = Model.debug;
if(Model.user_session){
	Cloud.sessionId = Model.user_session;
}

module.exports = {
	create : function(params, _cb) {
		Cloud.Places.create(params, _cb ? _cb : Model.eventDefaultCallback);
	},
	update : function(params, _cb){
		Cloud.Places.update(params, _cb ? _cb : Model.eventDefaultCallback);
	},
	show: function(group_id, _cb){
		Cloud.Places.show({place_id:group_id}, _cb ? _cb : Model.eventDefaultCallback);
	},
	search : function(_where, _page, _per_page, _cb){
		var queryParams = {
				response_json_depth: 3
			};
			if (_where !== null) {
				queryParams.q = _where;
			}
			if (_page !== null) {
				queryParams.page = _page;
			}
			if (_per_page !== null) {
				queryParams.per_page = _per_page;
			}
			Cloud.Places.search(queryParams, _cb ? _cb : Model.eventDefaultCallback);
	},
	queryPages : function(_where, _order, _page, _per_page, _cb) {
			var queryParams = {
				response_json_depth: 3
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
			Cloud.Places.query(queryParams, _cb ? _cb : Model.eventDefaultCallback);
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
		Cloud.Places.query(queryParams, _cb ? _cb : Model.eventDefaultCallback);
	},
	remove : function(_place_id, _keep_photo, _cb) {
		Cloud.Places.remove({
			place_id : _place_id,
			keep_photo : _keep_photo
		}, _cb ? _cb : Model.eventDefaultCallback);
	}
};