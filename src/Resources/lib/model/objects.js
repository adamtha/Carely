var Model = require('/lib/model/model'),
	Cloud = require('ti.cloud');

Cloud.debug = Model.debug;
if(Model.user_session){
	Cloud.sessionId = Model.user_session;
}

module.exports = {
	classNames:{
		tag_lists:'tag_list',
		suggestions:'suggestions',
		top_list:'top_list',
		facebook_admin_pages:'facebook_admin_pages'
	},
	create: function(_classname, _fields, _acl, _photo, _cb){
		var createParams = {
			classname : _classname,
			fields:_fields
		};
		if(_acl){
			createParams.acl_name = _acl;
		}
		if(_photo){
			createParams.photo = _photo;
			createParams['photo_sync_sizes[]'] = 'square_75';
		}
		Cloud.Objects.create(createParams, _cb ? _cb : Model.eventDefaultCallback);
	},
	update: function(_classname, _id, _fields, _acl, _photo, _cb){
		var updateParams = {
			classname : _classname,
			id:_id,
			fields:_fields
		};
		if(_acl){
			updateParams.acl_name = _acl;
		}
		if(_photo){
			updateParams.photo = _photo;
		}
		Cloud.Objects.update(updateParams, _cb ? _cb : Model.eventDefaultCallback);
	},
	show : function(_classname, _ids, _cb) {
		var queryParams = {
			classname : _classname
		};
		if(_ids.length > 1){
			queryParams.ids = _ids.join(',');
		}
		else{
			queryParams.id = _ids[0];
		}
		Cloud.Objects.show(queryParams, _cb ? _cb : Model.eventDefaultCallback);
	},
	query : function(_classname, _where, _order, _limit, _skip, _cb) {
		var queryParams = {
			classname : _classname
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
		Cloud.Objects.query(queryParams, _cb ? _cb : Model.eventDefaultCallback);
	},
	queryPages : function(_classname, _where, _order, _page, _per_page, _cb) {
		var queryParams = {
			classname : _classname
		};
		if(_where !== null) {
			queryParams.where = _where;
		}
		if(_order !== null) {
			queryParams.order = _order;
		}
		if(_page !== null) {
			queryParams.page = _page;
		}
		if(_per_page !== null) {
			queryParams.per_page = _per_page;
		}
		Cloud.Objects.query(queryParams, _cb ? _cb : Model.eventDefaultCallback);
	},
	remove : function(_classname, _ids, _cb) {
		
		var removeParams = {
			classname : _classname
		};
		if(_ids.length > 1){
			removeParams.ids = _ids.join(',');
		}
		else{
			removeParams.id = _ids[0];
		}
		Cloud.Objects.remove(removeParams, _cb ? _cb : Model.eventDefaultCallback);
	}
};