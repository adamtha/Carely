var Model = require('/lib/model/model'),
	Cloud = require('ti.cloud');

Cloud.debug = Model.debug;
if(Model.user_session){
	Cloud.sessionId = Model.user_session;
}

module.exports = {
	create : function(_photo, _cb, _onSendStream, _onDataStream) {
		var params = {
			photo:_photo
		};
		params['photo_sync_sizes[]'] = 'square_75';
		Cloud.Photos.create(params, _cb ? _cb : Model.eventDefaultCallback);
	},
	remove : function(_photo_id, _cb) {
		Cloud.Photos.remove({
			photo_id : _photo_id
		}, _cb ? _cb : Model.eventDefaultCallback);
	}
};
