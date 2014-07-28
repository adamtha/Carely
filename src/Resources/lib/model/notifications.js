var Model = require('/lib/model/model');

var UrbanAirship = {
	production_mode:!Model.debug,
	production:{
		key : 'mak6gKjMTrWze88pBegFOw',
		secret : 'URBAN-SECRET-PROD',
		master_secret :'URBAN-MASTER-PROD'
	},
	development:{
		key : 'z1gTyy6HQpqqBj6Sj-DYGg',
		secret : 'URBAN-SECRET-DEV',
		master_secret :'URBAN-MASTER-DEV'
	},
	baseurl : 'https://go.urbanairship.com',
	getToken : function() {
		return Ti.Network.remoteDeviceUUID;
	},
	register : function(params, lambda, lambdaerror) {
		var method = 'PUT';
		var token = UrbanAirship.getToken();
		var url = UrbanAirship.baseurl + '/api/device_tokens/' + token;
		var payload = '';
		if(params){
			params.badge = 0;
			payload = JSON.stringify(params);
		}
		UrbanAirship.helper(url, method, payload, function(_data, _status) {
			if (_status == 200) {
				lambda({
					success : true,
					status : _status,
					data : _data,
					action : 'updated'
				});
			} else if (_status == 201) {
				lambda({
					success : true,
					status : _status,
					data : _data,
					action : 'created'
				});
			} else {
				lambda({
					success : false,
					status : _status,
					data : _data
				});
			}
		}, function(xhr, error) {
			lambda({
				success : false,
				xhr : xhr.status,
				error : error
			});
		});
	},
	unregister : function(lambda) {
		var method = 'DELETE';
		var token = UrbanAirship.getToken();
		var url = UrbanAirship.baseurl + '/api/device_tokens/' + token;
		UrbanAirship.helper(url, method, null, function(_data, _status) {
			if (_status == 204) {
				lambda({
					success : true,
					data : _data,
					status : _status
				});
			} else {
				lambda({
					success : false,
					data : _data,
					status : _status
				});
			}
		}, function(xhr, error) {
			lambda({
				success : false,
				xhr : xhr.status,
				error : error
			});
		});
	},
	getAlias : function(lambda) {
		var method = 'GET';
		var token = UrbanAirship.getToken();
		var url = UrbanAirship.baseurl + '/api/device_tokens/' + token;
		UrbanAirship.helper(url, method, null, function(data, status) {
			lambda(data);
		}, function(xhr, e) {
			lambda({
				status : xhr.status,
				e : e
			});
		});
	},
	notify : function(_device_tokens, _aliases, _tags, _badge, _alert, _custom_fields, lambda){
		if((_device_tokens && _device_tokens.length > 2) ||
		   (_aliases && _aliases.length > 2) ||
		   (_tags && _tags.length > 2)){
		   	UrbanAirship.notifyBatch(_device_tokens, _aliases, _tags, _badge, _alert, _custom_fields, lambda);
		   }
		else{
			var method = 'POST';
			var url = UrbanAirship.baseurl + '/api/push/';
			var params = {
				aps:{
					badge: _badge ? _badge : '+1',
					alert: _alert ? _alert : '',
					sound:'default'
				}
			};
			if(_device_tokens){
				params.device_tokens = _device_tokens;
			}
			if(_aliases){
				params.aliases = _aliases;
			}
			if(_tags){
				params.tags = _tags;
			}
			if(_custom_fields){
				for(var k in _custom_fields){
					if(_custom_fields.hasOwnProperty(k)){
						params[k] = _custom_fields[k];
					}
				}
			}	
			UrbanAirship.helper(url, method, params, function(_data, _status) {
				lambda({
					success : true,
					data : _data,
					status : _status
				});
			}, function(xhr, e) {
				lambda({
					success : false,
					status : xhr.status,
					e : e
				});
			});
		}
	},
	notifyBatch : function(_device_tokens, _aliases, _tags, _badge, _alert, _custom_fields, lambda){
		var method = 'POST';
		var url = UrbanAirship.baseurl + '/api/push/batch/';
		var template_item = {
			aps:{
				badge: _badge ? _badge : '+1',
				alert: _alert ? _alert : '',
				sound:'default'
			}
		}
		if(_custom_fields){
			for(var k in _custom_fields){
				if(_custom_fields.hasOwnProperty(k)){
					template_item[k] = _custom_fields[k];
				}
			}
		}
		var template_json = JSON.stringify(template_item), push_items = [], chunks = 2;
		
		if(_device_tokens){
			while(_device_tokens.length){
				var tmp = JSON.parse(template_json);
				tmp.device_tokens = _device_tokens.splice(0, chunks); 
				push_items.push(tmp);
			}
		}
		if(_aliases){
			while(_aliases.length){
				var tmp = JSON.parse(template_json);
				tmp.aliases = _aliases.splice(0, chunks); 
				push_items.push(tmp);
			}
		}
		if(_tags){
			while(_tags.length){
				var tmp = JSON.parse(template_json);
				tmp.tags = _tags.splice(0, chunks); 
				push_items.push(tmp);
			}
		}
		UrbanAirship.helper(url, method, push_items, function(_data, _status) {
			lambda({
				success : true,
				data : _data,
				status : _status
			});
		}, function(xhr, e) {
			lambda({
				success : false,
				status : xhr.status,
				e : e
			});
		});
	},
	helper : function(url, method, params, lambda, lambdaerror) {
		var xhr = Ti.Network.createHTTPClient();
		xhr.setTimeout(60000);
		xhr.onerror = function(e) {
			lambdaerror(this, e);
		};
		xhr.onload = function() {
			lambda(this.responseText, this.status);
		};
		xhr.open(method, url);
		xhr.setRequestHeader('Content-Type', 'application/json');
		if(UrbanAirship.production_mode){
			xhr.setRequestHeader('Authorization', 'Basic ' + Ti.Utils.base64encode(UrbanAirship.production.key + ':' + UrbanAirship.production.master_secret));
		}
		else{
			xhr.setRequestHeader('Authorization', 'Basic ' + Ti.Utils.base64encode(UrbanAirship.development.key + ':' + UrbanAirship.development.master_secret));
		}
		
		if(url === UrbanAirship.baseurl + '/api/push/' || url === UrbanAirship.baseurl + '/api/push/batch/'){
			xhr.setRequestHeader('User-Agent', 'carely-urban-airship/0.1');
			xhr.send(JSON.stringify(params));
		}
		else{
			xhr.send(params);
		}
	}
};
 
module.exports = {
	registerForPushNotifications : function(_user_id, _tags, _cb){
		require('/lib/analytics').trackEvent({
			category : 'push notifications',
			action : 'register',
			label : _user_id,
			value : null
		});
						
		Ti.Network.registerForPushNotifications({
		    types:[
		        Titanium.Network.NOTIFICATION_TYPE_BADGE,
		        Titanium.Network.NOTIFICATION_TYPE_ALERT,
		        Titanium.Network.NOTIFICATION_TYPE_SOUND
		    ],
		    success: function(e){
				var deviceToken = e.deviceToken;
				var params = {
					alias : _user_id
				};
				if (_tags && _tags.length) {
					params.tags = _tags;
				}
				
				UrbanAirship.register(params, function(data) {
					Ti.App.Properties.setBool('carely_notifications', true);
					if (_cb) {
						_cb(data);
					}
				}, function(errorregistration) {
					Ti.App.Properties.setBool('carely_notifications', false);
					Model.eventDefaultCallback(errorregistration);
				});
		    },
		    error: function(e){
		    	Model.eventDefaultCallback(e);
		    },
		    callback: function(e){
		    	Ti.App.fireEvent('push.handle', e);
		    }
		});
	},
	register : function(_user_id, _tags, _cb){
		
		require('/lib/analytics').trackEvent({
			category : 'push notifications',
			action : 'register',
			label : _user_id,
			value : null
		});
		
		var params = {
			alias : _user_id
		};
		if (_tags && _tags.length) {
			params.tags = _tags;
		}
		UrbanAirship.register(params, function(data) {
			Ti.App.Properties.setBool('carely_notifications', true);
			if (_cb) {
				_cb(data);
			}
		}, function(errorregistration) {
			Ti.App.Properties.setBool('carely_notifications', false);
			Model.eventDefaultCallback(errorregistration);
		}); 

	},
	unregister : function(_cb){
		UrbanAirship.unregister(_cb);
		
		var currUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
		
		require('/lib/analytics').trackEvent({
			category : 'push notifications',
			action : 'unregister',
			label : currUser ? currUser.id : null,
			value : null
		});
	},
	notify : function(_device_tokens, _aliases, _tags, _badge, _alert, _custom_fields, _cb){
		UrbanAirship.notify(_device_tokens, _aliases, _tags, _badge, _alert, _custom_fields, _cb);
		
		var currUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
		
		require('/lib/analytics').trackEvent({
			category : 'push notifications',
			action : 'send',
			label : _alert,
			value : null
		});
	}
};

