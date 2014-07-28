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
		case 'actions_add':
		case 'checkins':
		case 'discussions':
		case 'joins':
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
	Comment : function(_classname, _id, _content, _cb) {
		var objectId = getObjectIdByClassname(_classname);
		if(objectId === null){
			//alert('invalid class name!');
		}
		else{
			var params = {
				content:_content,
				allow_duplicate:1,
				custom_fields:{
					review_type:'comment'
				}
			};
			params[objectId] = _id;
			Cloud.Reviews.create(params, _cb ? _cb : Model.eventDefaultCallback);
			
			require('/lib/analytics').trackEvent({
				category : 'interaction',
				action : 'comment',
				label : _id,
				value : null
			});
		}		
	},
	Like : function(_classname, _id, _cb) {
		var objectId = getObjectIdByClassname(_classname);
		if(objectId === null){
			//alert('invalid class name!');
		}
		else{
			var params = {
				rating:10,
				allow_duplicate:1,
				custom_fields:{
					review_type:'like'
				}
			};
			params[objectId] = _id;
			Cloud.Reviews.create(params, _cb ? _cb : Model.eventDefaultCallback);
			
			require('/lib/analytics').trackEvent({
				category : 'interaction',
				action : 'like',
				label : _id,
				value : null
			});
		}
	},
	Join : function(_classname, _id, _rating, _cb) {
		var objectId = getObjectIdByClassname(_classname);
		if(objectId === null){
			//alert('invalid class name!');
		}
		else{
			var params = {
				rating:_rating,
				allow_duplicate:1,
				custom_fields:{
					review_type:'join'
				}
			};
			params[objectId] = _id;
			Cloud.Reviews.create(params, _cb ? _cb : Model.eventDefaultCallback);
			
			require('/lib/analytics').trackEvent({
				category : 'interaction',
				action : 'join',
				label : _id,
				value : null
			});
		}
	},
	Remove : function(_classname, _id, _reviewId, _cb) {
		var objectId = getObjectIdByClassname(_classname);
		if(objectId === null){
			//alert('invalid class name!');
		}
		else{
			var params = {
				review_id:_reviewId
			};
			params[objectId] = _id;
			Cloud.Reviews.remove(params, _cb ? _cb : Model.eventDefaultCallback);
			
			require('/lib/analytics').trackEvent({
				category : 'review',
				action : 'delete',
				label : _reviewId,
				value : null
			});
		}
	},
	queryPages : function(_classname, _id, _where, _order, _page, _per_page, _cb) {
		var objectId = getObjectIdByClassname(_classname);
		if(objectId === null){
			//alert('invalid class name!');
		}
		else{
			var queryParams = {
				response_json_depth:8
			};
			queryParams[objectId] = _id;
			
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
			Cloud.Reviews.query(queryParams, _cb ? _cb : Model.eventDefaultCallback);
		}
	},
	ReviewSummary: function(_review) {
		var summ = {
			joins:0,
			maybe_joins:0,
			likes:0,
			comments:0
		};
		if(_review){
			if(_review.reviews_count && _review.reviews_count > 0){
				summ.comments = _review.reviews_count;
				if(_review.ratings_count && _review.ratings_count > 0){
					summ.comments -= _review.ratings_count;
				}
			}
			if(_review.ratings_count && _review.ratings_count > 0 && _review.ratings_summary){
				// ratings [0:comment, 1:maybe join, 2:join, 10:like]
				if(_review.ratings_summary["1"] && _review.ratings_summary["1"] > 0){
					summ.maybe_joins = _review.ratings_summary["1"];
				}
				if(_review.ratings_summary["2"] && _review.ratings_summary["2"] > 0){
					summ.joins = _review.ratings_summary["2"];
				}
				if(_review.ratings_summary["10"] && _review.ratings_summary["10"] > 0){
					summ.likes = _review.ratings_summary["10"];
				}
			}
		}
		return summ;
	}
};
