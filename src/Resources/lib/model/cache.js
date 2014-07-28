
(function() {

	var CONFIG = {
		// The caching database name
		DB_NAME: 'Carely_Cache',
		
		// Disables cache (useful during development).
		DISABLE : false,

		// Time to check for objects that will be expired.
		// Will check each CACHE_EXPIRATION_INTERVAL seconds.
		CACHE_EXPIRATION_INTERVAL : 5 * 60,

		// This will avoid the cache expiration task to be set up
		// and will expire objects FROM ' + CONFIG.DB_NAME + ' before get.
		EXPIRE_ON_GET : true
	};

	Ti.App.CarelyCache = function() {
		var init_cache, expire_cache, current_timestamp, get, put, del;
		
		function validateData(o){
			var valid = false;
			if(typeof o !== 'undefined' && o !== null){
				valid = true;
			}
			return valid;
		}
	
		// Cache initialization
		_init_cache = function(cache_expiration_interval) {
			var db = Ti.Database.open(CONFIG.DB_NAME);
			// no remote backup
			db.file.setRemoteBackup(false);
			
			db.execute('CREATE TABLE IF NOT EXISTS ' + CONFIG.DB_NAME + ' (key TEXT UNIQUE, value TEXT, expiration INTEGER, updated_at INTEGER)');
			db.close();
			
			if(!CONFIG || (CONFIG && !CONFIG.EXPIRE_ON_GET)) {
				// set cache expiration task
				setInterval(_expire_cache, cache_expiration_interval * 1000);
				
			}
		};

		_expire_cache = function() {
			return;
			
			var db = Ti.Database.open(CONFIG.DB_NAME);
			var timestamp = _current_timestamp();

			// count how many objects will be deleted
			var count = 0;
			var rs = db.execute('SELECT COUNT(*) FROM ' + CONFIG.DB_NAME + ' WHERE expiration > 0 AND expiration <= ?', timestamp);
			while(rs.isValidRow()) {
				count = rs.field(0);
				rs.next();
			}
			rs.close();

			// deletes everything older than timestamp
			db.execute('DELETE FROM ' + CONFIG.DB_NAME + ' WHERE expiration > 0 AND expiration <= ?', timestamp);
			db.close();
		};

		_current_timestamp = function() {
			var value = Math.floor(new Date().getTime() / 1000);
			
			return value;
		};

		_get = function(key) {
			if(validateData(key) === false){
				return null;
			}
			var db = Ti.Database.open(CONFIG.DB_NAME);

			if(CONFIG.EXPIRE_ON_GET) {
				
				_expire_cache();
			}

			var rs = db.execute('SELECT value FROM ' + CONFIG.DB_NAME + ' WHERE key = ?', key);
			var result = null;
			if(rs.isValidRow()) {
				
				result = JSON.parse(rs.fieldByName('value'));
			} else {
				
			}
			rs.close();
			db.close();

			return result;
		};
		
		_select = function(clause, where, limit) {
			if(validateData(clause) === false){
				return null;
			}
			if(validateData(where) === false){
				return null;
			}
			if(validateData(limit) === false || limit < 1){
				limit = '';
			}
			else if(limit > 0){
				limit = ' LIMIT ' + limit;
			}
			var db = Ti.Database.open(CONFIG.DB_NAME);

			if(CONFIG.EXPIRE_ON_GET) {
				
				_expire_cache();
			}

			var rs = db.execute('SELECT value FROM ' + CONFIG.DB_NAME + ' WHERE key ' + clause + ' ' + where + ' ORDER BY updated_at DESC' + limit);
			var results = [];
			while(rs.isValidRow()) {
				results.push(JSON.parse(rs.fieldByName('value')));
				rs.next();
			}
			
			rs.close();
			db.close();
			
			if(results.length > 0){
				return results;
			}
			else{
				return null;
			}
		};
		
		_putMany = function(items, expiration_seconds) {
			if(validateData(items) === false){
				return false;
			}
			if(items.length < 1){
				return false;
			}
			if(validateData(expiration_seconds) === false){
				expiration_seconds = 300;
			}
			var isDataValid = true;
			for(var i=0, v=items.length; i<v; i++){
				if(validateData(items[i].key) === false || 
				   validateData(items[i].value) === false ||
				   validateData(items[i].updated_at) === false || 
				   validateData(items[i].isJSON) === false){
					isDataValid = false;
					break;
				}
			}
			if(isDataValid === false){
				
				return false;
			}
			
			var curr_timestamp = _current_timestamp();
			var expires_in = expiration_seconds;
			if(expires_in > 0){
				// set to expire
				expires_in = expires_in + curr_timestamp;
			}
			var db = Ti.Database.open(CONFIG.DB_NAME);
			db.execute('BEGIN');
			for(var i=0, v=items.length; i<v; i++){
				
				var query = 'INSERT OR REPLACE INTO ' + CONFIG.DB_NAME + ' (key, value, expiration, updated_at) VALUES (?, ?, ?, ?);';
				db.execute(query, items[i].key, items[i].isJSON === true ? items[i].value : JSON.stringify(items[i].value), expires_in, items[i].updated_at);
			}
			db.execute('COMMIT');
			db.close();
			
			return true;
		};
		
		_put = function(key, value, expiration_seconds, isJSON, updated_at) {
			if(validateData(key) === false){
				return false;
			}
			if(validateData(expiration_seconds) === false){
				expiration_seconds = 300;
			}
			if(validateData(isJSON) === false){
				isJSON = false;
			}
			if(validateData(updated_at) === false){
				return false;
			}

			var curr_timestamp = _current_timestamp();
			var expires_in = expiration_seconds;
			if(expires_in > 0){
				// set to expire
				expires_in = expires_in + curr_timestamp;
			}
			var db = Ti.Database.open(CONFIG.DB_NAME);
			
			var query = 'INSERT OR REPLACE INTO ' + CONFIG.DB_NAME + ' (key, value, expiration, updated_at) VALUES (?, ?, ?, ?);';
			db.execute(query, key, isJSON === true ? value : JSON.stringify(value), expires_in, updated_at);
			db.close();
			
			return true;
		};

		_del = function(key) {
			if(validateData(key) === false){
				return false;
			}
			
			var db = Ti.Database.open(CONFIG.DB_NAME);
			db.execute('DELETE FROM ' + CONFIG.DB_NAME + ' WHERE key = ?', key);
			db.close();
			
			return true;
		};
		
		_clear = function() {
			var db = Ti.Database.open(CONFIG.DB_NAME);
			db.execute('DELETE FROM ' + CONFIG.DB_NAME);
			
			db.close();
			return;
		};
		
		_drop = function() {
			var db = Ti.Database.open(CONFIG.DB_NAME);
			db.execute('DROP TABLE IF EXISTS ' + CONFIG.DB_NAME);
			
			db.close();
			
			var cache_expiration_interval = 30;
			if(CONFIG && CONFIG.CACHE_EXPIRATION_INTERVAL) {
				cache_expiration_interval = CONFIG.CACHE_EXPIRATION_INTERVAL;
			}
			_init_cache(cache_expiration_interval);
			
			return;
		};
		
		return function() {
			// if development environment, disable cache capabilities
			if(CONFIG && CONFIG.DISABLE) {
				return {
					get : function() {},
					select : function() {},
					put : function() {},
					putMany : function(){},
					del : function() {},
					clear : function() {},
					drop : function() {},
					current_timestamp: function() {}
				};
			}

			// initialize everything
			var cache_expiration_interval = 30;
			if(CONFIG && CONFIG.CACHE_EXPIRATION_INTERVAL) {
				cache_expiration_interval = CONFIG.CACHE_EXPIRATION_INTERVAL;
			}

			_init_cache(cache_expiration_interval);

			return {
				get : _get,
				select : _select,
				put : _put,
				putMany : _putMany,
				del : _del,
				clear : _clear,
				drop : _drop,
				current_timestamp : _current_timestamp
			};
		}();

	}(CONFIG);

})(); 