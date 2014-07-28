var Model = require('/lib/model/model'),
	Cloud = require('ti.cloud');

Cloud.debug = Model.debug;
if(Model.user_session){
	Cloud.sessionId = Model.user_session;
}

var getObjectIdByClassname = function(_classname){
	var objectId = null;
	switch(_classname) {
		case 'groups':
			objectId = 'place_id';
			break;
		case 'actions':
			objectId = 'event_id';
			break;
		case 'groups_join':
		case 'checkins':
		case 'discussions':
			objectId = 'post_id';
			break;
		case 'comments':
			objectId = 'review_id';
			break;
		default:
			break;
	}
	return objectId;
};

module.exports = {
	Like : function(_classname, _id, _fields, _cb) {
		var objectId = getObjectIdByClassname(_classname);
		if(objectId === null){
			//alert('invalid class name!');
		}
		else{
			var params = {
				custom_fields:_fields
			};
			params[objectId] = _id;
			Cloud.Likes.create(params, _cb ? _cb : Model.eventDefaultCallback);
		}		
	},
	Unlike : function(_classname, _id, _cb) {
		var objectId = getObjectIdByClassname(_classname);
		if(objectId === null){
			//alert('invalid class name!');
		}
		else{
			var params = {};
			params[objectId] = _id;
			Cloud.Likes.remove(params, _cb ? _cb : Model.eventDefaultCallback);
		}
	}
};
