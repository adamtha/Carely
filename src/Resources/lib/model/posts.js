var Model = require('/lib/model/model'),
	Cloud = require('ti.cloud');

Cloud.debug = Model.debug;
if(Model.user_session){
	Cloud.sessionId = Model.user_session;
}

module.exports = {
	postTypes:{
		discussion:'discussions',
		checkin:'checkins',
		group:'groups_join',
		actions_add:'actions_add',
		lists_add:'lists_add',
		joins:'joins'
	},
	intents:{
		checkin:'do',
		want:'want',
		talk:'talk',
		plan:'plan'
	},
	create : function(_action_id, _content, _photo, _title, _fields, _cb) {
		
		function createPostCallback(e){
			if(e && e.success){
				// increment posts count for this tag
				
				// var List_tag = JSON.parse(Ti.App.Properties.getString('List_tag', null));
				// if(List_tag && List_tag.id){
					// Ti.App.fireEvent('lists.update_posts_count', {id:List_tag.id});
				// }
			}	
				
			if(_cb){
				_cb(e);
			}
			else{
				Model.eventDefaultCallback(e);
			}
		}
		
		var postParams = {
			event_id: _action_id,
			content : _content,
			title: _title,
			response_json_depth: 4,
			custom_fields:{}
		}, 
		post_tags = [];
		
		post_tags.push('activity_' + _action_id);
		var _activity_item = Model.AppCache.actions.get(_action_id);
		if (_activity_item && _activity_item.custom_fields) {
			for (var k in _activity_item.custom_fields) {
				if (_activity_item.custom_fields.hasOwnProperty(k)) {
					var str = k + '';
					if (str.length >= 'list_tag_'.length && str.substr(0, 'list_tag_'.length) === 'list_tag_') {
						post_tags.push(str);
					}
				}
			}
		}

		var common = require('/lib/common');
		if(_content && _content.length && _content !== common.emptyCheckinValue){
			post_tags.push(_content.toLowerCase());
			var content_list = _content.toLowerCase().split(' ');
			for(var i=0,v=content_list.length;i<v;i++){
				if(content_list[i].length > 2){
					post_tags.push(content_list[i]);
				}
			}
		}
			
		var currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));	
		if(currentUser){
			if(currentUser.id){
				post_tags.push('user_' + currentUser.id);
			}
			var user_display_name = common.getUserDisplayName(currentUser);
			if(user_display_name && user_display_name.length){
				post_tags.push(user_display_name.toLowerCase());
				var user_name_split = user_display_name.toLowerCase().split(' ');
				for(var i=0,v=user_name_split.length;i<v;i++){
					if(user_name_split[i].length > 2){
						post_tags.push(user_name_split[i]);
					}
				}
			}
		}
		
		var List_tag = JSON.parse(Ti.App.Properties.getString('List_tag', null));
		if(List_tag && List_tag.id && !List_tag.all_activities){
			post_tags.push('list_tag_' + List_tag.id);
			if(List_tag.name && List_tag.name.length){
				post_tags.push(List_tag.name.toLowerCase());
				var list_tag_split = List_tag.name.toLowerCase().split(' ');
				for(var i=0,v=list_tag_split.length;i<v;i++){
					if(list_tag_split[i].length > 2){
						post_tags.push(list_tag_split[i]);
					}
				}
			}
		}	
		
		if(_fields !== null) {
			postParams.custom_fields = _fields;
			
			if(_fields.intent && _fields.intent.length){
				post_tags.push('intent_' + _fields.intent);
				post_tags.push(_fields.intent);
			}
			
			if(_fields.activity_name && _fields.activity_name.length){
				post_tags.push(_fields.activity_name.toLowerCase());
				var activity_name_split = _fields.activity_name.toLowerCase();
				for(var i=0,v=activity_name_split.length;i<v;i++){
					if(activity_name_split[i].length > 2){
						post_tags.push(activity_name_split[i]);
					}
				}
			}
			
			if(_fields['[ACS_User]suggester_id']){
				post_tags.push('suggestion_' + _fields['[ACS_User]suggester_id']);
			}
		}
		
		if(_photo !== null) {
			postParams.photo = _photo;
			postParams['photo_sync_sizes[]'] = 'medium_500';
		}
		
		if(post_tags.length){
			var _ = require('/lib/underscore');
			postParams.tags = _.uniq(post_tags).join(',');
		}
		
		var geo_enabled = Ti.App.Properties.getBool('CarelyGeoEnabled', false);
		if(geo_enabled){
			
			var xhr = Ti.Network.createHTTPClient({
				onload : function(loadEvent) {
					if (this.responseText) {
						var json = JSON.parse(this.responseText);
						if (json && json.results && json.results.length) {
							postParams.custom_fields.post_location = json.results[0];
						}
					}
					Cloud.Posts.create(postParams, createPostCallback);
				},
				onerror : function(errorEvent) {
					Cloud.Posts.create(postParams, createPostCallback);
				}
			}); 

			if(postParams.custom_fields.coordinates && postParams.custom_fields.coordinates.length > 0){
				if(postParams.custom_fields.post_location){
					Cloud.Posts.create(postParams, createPostCallback);
				}
				else{
					xhr.open('GET', 'http://maps.google.com/maps/api/geocode/json?sensor=true&language=en&latlng=' + postParams.custom_fields.coordinates[1] + ',' + postParams.custom_fields.coordinates[0]);
					xhr.send();
				}
			}
			else{
				Ti.Geolocation.getCurrentPosition(function(geoEvent){
					if(geoEvent.success && geoEvent.coords && geoEvent.coords.longitude && geoEvent.coords.latitude){
						
						postParams.custom_fields.coordinates = [geoEvent.coords.longitude, geoEvent.coords.latitude];
						
						xhr.open('GET', 'http://maps.google.com/maps/api/geocode/json?sensor=true&language=en&latlng=' + geoEvent.coords.latitude + ',' + geoEvent.coords.longitude);
						xhr.send();
					}
					else{
						Cloud.Posts.create(postParams, createPostCallback);
					}
				});
			}
		}
		else{
			Cloud.Posts.create(postParams, createPostCallback);
		}
		
		require('/lib/analytics').trackEvent({
			category : 'post',
			action : 'create',
			label : _title,
			value : _action_id
		}); 

	},
	queryPages : function(_where, _order, _page, _per_page, _cb) {
			var queryParams = {
				response_json_depth: 4
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
			Cloud.Posts.query(queryParams, _cb ? _cb : Model.eventDefaultCallback);
	},
	query : function(_where, _order, _limit, _skip, _cb) {
		var queryParams = {
			response_json_depth: 4
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
		Cloud.Posts.query(queryParams, _cb ? _cb : Model.eventDefaultCallback);
	},
	show : function(_post_id, _cb) {
		Cloud.Posts.show({ post_id : _post_id }, _cb ? _cb : Model.eventDefaultCallback);
	},
	update : function(_params, _cb) {
		Cloud.Posts.update(_params, _cb ? _cb : Model.eventDefaultCallback);
		
		require('/lib/analytics').trackEvent({
			category : 'post',
			action : 'update',
			label : _params ? _params.post_id : null,
			value : null
		}); 
	},
	remove : function(_post_id, _keep_photo, _cb) {
		Cloud.Posts.remove({
			post_id : _post_id,
			keep_photo: _keep_photo
		}, _cb ? _cb : Model.eventDefaultCallback);
		
		require('/lib/analytics').trackEvent({
			category : 'post',
			action : 'delete',
			label : _post_id,
			value : null
		});
	},
	formatForSharing: function(_post){
		var shareData = null;
		try{
			shareData = {
				post_id : _post.id,
				message : ''
			}
			if (_post.photo && _post.photo.urls && _post.photo.urls.original) {
				 shareData.picture = _post.photo.urls.original;
			 }
			var common = require('/lib/common');
			if (_post.content && _post.content !== common.emptyCheckinValue) {
				shareData.message += _post.content;
			}
		}
		catch(errr){
			shareData = null;
		}
		
		return shareData;
	}
};