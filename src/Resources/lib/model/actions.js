var Model = require('/lib/model/model'),
	Cloud = require('ti.cloud');

Cloud.debug = Model.debug;
if(Model.user_session){
	Cloud.sessionId = Model.user_session;
}

module.exports = {
	create : function(params, _cb){
		Cloud.Events.create(params, _cb ? _cb : Model.eventDefaultCallback);
		
		require('/lib/analytics').trackEvent({
			category : 'activity',
			action : 'create',
			label : params ? params.name : null,
			value : null
		});
	},
	update : function(params, _cb){
		Cloud.Events.update(params, _cb ? _cb : Model.eventDefaultCallback);
		
		require('/lib/analytics').trackEvent({
			category : 'activity',
			action : 'update',
			label : params ? params.event_id : null,
			value : null
		});
	},
	show : function(ids, _cb){
		var params = {};
		if(ids.indexOf(',') !== -1){
			params.event_ids = ids;
		}
		else{
			params.event_id = ids;
		}
		Cloud.Events.show(params, _cb ? _cb : Model.eventDefaultCallback);
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
			Cloud.Events.search(queryParams, _cb ? _cb : Model.eventDefaultCallback);
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
			Cloud.Events.query(queryParams, _cb ? _cb : Model.eventDefaultCallback);
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
		Cloud.Events.query(queryParams, _cb ? _cb : Model.eventDefaultCallback);
	},
	remove : function(_event_id, _keep_photo, _cb) {
		Cloud.Events.remove({
			event_id : _event_id,
			keep_photo : _keep_photo
		}, _cb ? _cb : Model.eventDefaultCallback);
		
		require('/lib/analytics').trackEvent({
			category : 'activity',
			action : 'delete',
			label : _event_id,
			value : null
		});
	}
};