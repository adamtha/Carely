
var common = require('/lib/common'),
	moment = require('/lib/date/moment');

var isErrorShowing = false;

module.exports = {
	user_session : Ti.App.Properties.getString('carely_user_session', null),
	debug:true,
	eventDefaultErrorCallback : function(e) {
		if(isErrorShowing === false){
			isErrorShowing = true;
			
			if(!e){
				return false;
			}
			
			try{
				//var analytics = require('/lib/analytics');
				//analytics.logError('error', e);
			}
			catch(err){
				//Ti.API.info('analytics error: ' + JSON.stringify(err));
			}
			
			var dlg = Ti.UI.createAlertDialog({
				message:'unknown',
				buttonNames:[L('ok', 'OK')]
			});
			if(!Ti.Network.online){
				dlg.title = 'Network Unavailable'
				dlg.message = 'There seems to be a problem with your network connection.\n Please check and try again later.';
			}
			else{
				if(e.message && e.message.length){
					if(e.message.indexOf('A connection failure occurred') !== -1){
						dlg.title = 'Network Unavailable'
						dlg.message = 'There seems to be a problem with your network connection.\n Please check and try again later.';
					}
					else if(e.code === 401 || e.code === 400 || e.code === 404){
						dlg.message = e.message;
					}
				}
				else if(e.error && e.error.length){
					if(e.error.indexOf('A connection failure occurred') !== -1){
						dlg.title = 'Network Unavailable'
						dlg.message = 'There seems to be a problem with your network connection.\n Please check and try again later.';
					}
					else if(e.code === 401 || e.code === 400 || e.code === 404){
						dlg.message = e.error;
					}
				}
				else{
					dlg = null;
				}
			}
			if(dlg && dlg.message !== 'unknown'){
				dlg.addEventListener('click', function(dlgClick){
					isErrorShowing = false;
				});
				dlg.show();
			}
		}
	},
	eventDefaultCallback : function(e) {
		if(e.success) {
			//alert('Success:\\nJSON: ' + JSON.stringify(e));
		} else {
			this.eventDefaultErrorCallback(e);
		}
	},
	AppCache:{
		get:function(_key) {
			return Ti.App.CarelyCache.get(_key);
		},
		set:function(_key, _value, _time) {
			Ti.App.CarelyCache.put(_key, _value, _time ? _time : common.times.day, false, moment().valueOf());
		},
		del:function(_key){
			return Ti.App.CarelyCache.del(_key);
		},
		setMany:function(_items) {
			Ti.App.CarelyCache.putMany(_items, common.times.day);
		},
		getPreferences:function(_key) {
			return Ti.App.CarelyCache.get(_key + '_Preferences');
		}, 
		setPreferences:function(_key, _value) {
			Ti.App.CarelyCache.put(_key + '_Preferences', _value, common.times.forever, false);
		},
		notifications:{
			selectLike:function(_limit){
				return Ti.App.CarelyCache.select('like', '\'' + common.objectIds.notifications + '_%\'', _limit);
			},
			set:function(_value){
				Ti.App.CarelyCache.put(common.objectIds.notifications + '_' + _value.id, _value, common.times.day, false, moment(_value.updated_at).valueOf());
			},
			del:function(_id){
				return Ti.App.CarelyCache.del(common.objectIds.notifications + '_' + _id);
			}
		},
		users:{
			selectLike:function(_limit){
				return Ti.App.CarelyCache.select('like', '\'' + common.objectIds.users + '_%\'', _limit);
			},
			selectIn:function(_values){
				return Ti.App.CarelyCache.select('in', '(\'' + common.objectIds.users + '_' + _values.join('\',\'' + common.objectIds.users + '_') + '\')');
			},
			get:function(_id){
				return Ti.App.CarelyCache.get(common.objectIds.users + '_' + _id);
			},
			set:function(_value){
				Ti.App.CarelyCache.put(common.objectIds.users + '_' + _value.id, _value, common.times.day, false, moment(_value.updated_at).valueOf());
			},
			setMany:function(_users) {
				var _items = [];
				for(var i=0, v=_users.length; i<v; i++){
					_items.push({
						key: common.objectIds.users + '_' + _users[i].id,
						value: _users[i],
						isJSON: false,
						updated_at: moment(_users[i].updated_at).valueOf()
					});
				}
				Ti.App.CarelyCache.putMany(_items, common.times.day);
			},
			del:function(_id){
				return Ti.App.CarelyCache.del(common.objectIds.users + '_' + _id);
			}
		},
		actions:{
			selectLike:function(_limit){
				return Ti.App.CarelyCache.select('like', '\'' + common.objectIds.actions + '_%\'', _limit);
			},
			selectIn:function(_values){
				return Ti.App.CarelyCache.select('in', '(\'' + common.objectIds.actions + '_' + _values.join('\',\'' + common.objectIds.actions + '_') + '\')');
			},
			get:function(_id){
				return Ti.App.CarelyCache.get(common.objectIds.actions + '_' + _id);
			},
			set:function(_value){
				Ti.App.CarelyCache.put(common.objectIds.actions + '_' + _value.id, _value, common.times.day, false, moment(_value.updated_at).valueOf());
				if (_value.user) {
					Ti.App.CarelyCache.put(common.objectIds.users + '_' + _value.user.id, _value.user, common.times.day, false, moment(_value.user.updated_at).valueOf());
				}
			},
			setMany:function(_actions) {
				var _items = [];
				for(var i=0, v=_actions.length; i<v; i++){
					_items.push({
						key: common.objectIds.actions + '_' + _actions[i].id,
						value: _actions[i],
						isJSON: false,
						updated_at: moment(_actions[i].updated_at).valueOf()
					});
					if (_actions[i].user) {
						_items.push({
							key: common.objectIds.users + '_' + _actions[i].user.id,
							value: _actions[i].user,
							isJSON: false,
							updated_at: moment(_actions[i].user.updated_at).valueOf()
						});
					}
				}
				Ti.App.CarelyCache.putMany(_items, common.times.day);
			},
			del:function(_id){
				return Ti.App.CarelyCache.del(common.objectIds.actions + '_' + _id);
			}
		},
		groups:{
			selectLike:function(_limit){
				return Ti.App.CarelyCache.select('like', '\'' + common.objectIds.groups + '_%\'', _limit);
			},
			selectIn:function(_values){
				return Ti.App.CarelyCache.select('in', '(\'' + common.objectIds.groups + '_' + _values.join('\',\'' + common.objectIds.groups + '_') + '\')');
			},
			get:function(_id){
				return Ti.App.CarelyCache.get(common.objectIds.groups + '_' + _id);
			},
			set:function(_value){
				Ti.App.CarelyCache.put(common.objectIds.groups + '_' + _value.id, _value, common.times.day, false, moment(_value.updated_at).valueOf());
				if (_value.user) {
					Ti.App.CarelyCache.put(common.objectIds.users + '_' + _value.user.id, _value.user, common.times.day, false, moment(_value.user.updated_at).valueOf());
				}
			},
			setMany:function(_groups) {
				var _items = [];
				for(var i=0, v=_groups.length; i<v; i++){
					_items.push({
						key: common.objectIds.groups + '_' + _groups[i].id,
						value: _groups[i],
						isJSON: false,
						updated_at: moment(_groups[i].updated_at).valueOf()
					});
					if (_groups[i].user) {
						_items.push({
							key: common.objectIds.users + '_' + _groups[i].user.id,
							value: _groups[i].user,
							isJSON: false,
							updated_at: moment(_groups[i].user.updated_at).valueOf()
						});
					}
				}
				Ti.App.CarelyCache.putMany(_items, common.times.day);
			},
			del:function(_id){
				return Ti.App.CarelyCache.del(common.objectIds.groups + '_' + _id);
			},
			getActions:function(_id){
				return Ti.App.CarelyCache.get(common.objectIds.groups + 'Actions_' + _id);
			},
			setActions:function(_id, _values){
				Ti.App.CarelyCache.put(common.objectIds.groups + 'Actions_' + _id, _values, common.times.day, false, moment().valueOf());
				if (_values.length > 0) {
					for (var i = 0; i < _values.length; i++) {
						Ti.App.CarelyCache.put(common.objectIds.actions + '_' + _values[i].id, _values[i], common.times.day, false, moment(_values[i].updated_at).valueOf());
					}
				}
			}
		},
		posts:{
			selectLike:function(_limit){
				return Ti.App.CarelyCache.select('like', '\'' + common.objectIds.posts + '_%\'', _limit);
			},
			selectIn:function(_values){
				return Ti.App.CarelyCache.select('in', '(\'' + common.objectIds.posts + '_' + _values.join('\',\'' + common.objectIds.posts + '_') + '\')');
			},
			get:function(_id){
				return Ti.App.CarelyCache.get(common.objectIds.posts + '_' + _id);
			},
			set:function(_value){
				Ti.App.CarelyCache.put(common.objectIds.posts + '_' + _value.id, _value, common.times.day, false, moment(_value.updated_at).valueOf());
				if (_value.user) {
					Ti.App.CarelyCache.put(common.objectIds.users + '_' + _value.user.id, _value.user, common.times.day, false, moment(_value.user.updated_at).valueOf());
				}
				if (_value.event) {
					Ti.App.CarelyCache.put(common.objectIds.actions + '_' + _value.event.id, _value.event, common.times.day, false, moment(_value.event.updated_at).valueOf());
				}
			},
			setMany:function(_posts) {
				var _items = [];
				for(var i=0, v=_posts.length; i<v; i++){
					_items.push({
						key: common.objectIds.posts + '_' + _posts[i].id,
						value: _posts[i],
						isJSON: false,
						updated_at: moment(_posts[i].updated_at).valueOf()
					});
					if (_posts[i].user) {
						_items.push({
							key: common.objectIds.users + '_' + _posts[i].user.id,
							value: _posts[i].user,
							isJSON: false,
							updated_at: moment(_posts[i].user.updated_at).valueOf()
						});
					}
					if (_posts[i].event) {
						_items.push({
							key: common.objectIds.actions + '_' + _posts[i].event.id,
							value: _posts[i].event,
							isJSON: false,
							updated_at: moment(_posts[i].event.updated_at).valueOf()
						});
					}
				}
				Ti.App.CarelyCache.putMany(_items, common.times.day);
			},
			getCount:function(_id, _type){
				return Ti.App.CarelyCache.get(_id + '_count_' + _type);
			},
			setCount:function(_id, _type, _count){
				if(_id !== undefined && _id !== null && _type !== undefined && _type !== null && _count !== undefined && _count !== null){
					Ti.App.CarelyCache.put(_id + '_count_' + _type, _count, common.times.day, false, moment().valueOf());
				}
			},
			del:function(_id){
				return Ti.App.CarelyCache.del(common.objectIds.posts + '_' + _id);
			}
		}
	}
};
