var async   = require('async');
var express = require('express');
var util    = require('util');
var url = require('url');
var http = require('http');

// create an express webserver
var app = express.createServer(
  express.logger(),
  express.static(__dirname + '/public'),
  express.bodyParser(),
  express.cookieParser(),
  // set this to a secret value to encrypt session cookies
  express.session({ secret: process.env.SESSION_SECRET || 'SECRET_KEY_HERE' }),
  require('faceplate').middleware({
    app_id: process.env.FACEBOOK_APP_ID,
    secret: process.env.FACEBOOK_SECRET,
    scope:  'user_likes'
  })
);

// listen to the PORT given to us in the environment
var port = process.env.PORT || 3000;

app.listen(port, function() {
  console.log("Listening on " + port);
});

app.dynamicHelpers({
  'host': function(req, res) {
    return req.headers['host'];
  },
  'scheme': function(req, res) {
    req.headers['x-forwarded-proto'] || 'http'
  },
  'url': function(req, res) {
    return function(path) {
      return app.dynamicViewHelpers.scheme(req, res) + app.dynamicViewHelpers.url_no_scheme(path);
    }
  },
  'url_no_scheme': function(req, res) {
    return function(path) {
      return '://' + app.dynamicViewHelpers.host(req, res) + path;
    }
  },
});

function render_page_finish(res, req, app, user){
	res.render('index.ejs', {
		layout:    false,
		req:       req,
		app:       app,
		user:      user
	});
}

function create_page_post_data(appc_post, res, req, app, user){
	if(appc_post['event'] && appc_post['event']['name']){
		req.activity = {
			url:'http://carely.herokuapp.com' + req.url,
			title:appc_post['event']['name'],
			image:appc_post['event']['photo']['urls']['original'],
			description:'',
			done:'',
			attributes:''
		}
		if(appc_post['event']){
			if(appc_post['event']['details']){
				req.activity.description = appc_post['event']['details'];
			}
		}
		if(appc_post['custom_fields']){
			if(appc_post['custom_fields']['[ACS_User]suggester_id'] && appc_post['custom_fields']['[ACS_User]suggester_id'][0] && appc_post['custom_fields']['[ACS_User]suggester_id'][0]['custom_fields']){
				var suggester_fields = appc_post['custom_fields']['[ACS_User]suggester_id'][0]['custom_fields'];
				if(suggester_fields && suggester_fields['influencer_json'] && suggester_fields['influencer_json']['name']){
					req.activity.suggester = 'Suggested by ' + suggester_fields['influencer_json']['name'];
				}
			}
			if(appc_post['content'] && appc_post['content'] !== '!#!none!#!'){
				req.activity.attributes = appc_post['content'];
			}
			if(appc_post['custom_fields']['done'] && appc_post['custom_fields']['done']['me']){
				req.activity.done = 'Done ';
				if(appc_post['custom_fields']['done']['me'] === 1){
					req.activity.done += 'once';
				}
				else if(appc_post['custom_fields']['done']['me'] === 2){
					req.activity.done += 'twice';
				}
				else{
					req.activity.done += appc_post['custom_fields']['done']['me'];
					req.activity.done += ' times';
				}
							
				if(appc_post['user'] && appc_post['user']['custom_fields'] && appc_post['user']['custom_fields']['display_name']){
					req.activity.done += ' by ' + appc_post['user']['custom_fields']['display_name'];
				}
			}
		}
		console.log("req.activity: " + JSON.stringify(req.activity));
	}
	render_page_finish(res, req, app, user);
}

function render_page(req, res) {
  req.facebook.app(function(app) {
    req.facebook.me(function(user) {
	  if(req.query && req.query['postid']){
		console.log("requesting: https://api.cloud.appcelerator.com/v1/posts/show.json?key=62E2f6XQcFJ2BZg3HkCEppnq1w3uu2UV&post_id=" + req.query['postid']);
		http.get({
			host: 'api.cloud.appcelerator.com',
			port: 80,
			path: '/v1/posts/show.json?key=62E2f6XQcFJ2BZg3HkCEppnq1w3uu2UV&post_id=' + req.query['postid']
		}, function(postResp) {
		  console.log("Got response: " + postResp.statusCode);
		  try{
		  var postBody = '';
		  postResp.on("data", function(chunk) {
			postBody += chunk;
		  });
		  
		  postResp.on("end", function() {
			var parsed_post = JSON.parse(postBody);
			if(parsed_post['response'] && parsed_post['response']['posts'] && parsed_post['response']['posts'].length > 0){
				var appc_post = parsed_post['response']['posts'][0];
				if(req.query && req.query['fb_source']){
					var redirect_url = 'http://care.ly';
					if(appc_post && appc_post['custom_fields'] && appc_post['custom_fields']['[ACS_User]suggester_id'] && appc_post['custom_fields']['[ACS_User]suggester_id'][0] && appc_post['custom_fields']['[ACS_User]suggester_id'][0]['custom_fields'] && appc_post['custom_fields']['[ACS_User]suggester_id'][0]['custom_fields']['influencer_link']){
						redirect_url = appc_post['custom_fields']['[ACS_User]suggester_id'][0]['custom_fields']['influencer_link'];
					}
					console.log("redirecting: " + redirect_url);
					// need redirect
					res.writeHead(302, {
						'Location': redirect_url,
						'fb_app': 'Carely',
						'fb_ref': req.query['fb_ref'],
						'fb_source': req.query['fb_source']
					});
					res.end();
				}
				else{
					create_page_post_data(appc_post, res, req, app, user);
				}
			}
			else{
				console.log("no post data!!!");
				render_page_finish(res, req, app, user);
			}
		  });
		  }
		catch(postExp){
			console.log("Exception: " + postExp.message);
			render_page_finish(res, req, app, user);
		}
		}).on('error', function(err) {
		  console.log("Got error: " + err.message);
		  render_page_finish(res, req, app, user);
		});
	  }
	  else{
		render_page_finish(res, req, app, user);
	  }
    });
  });
}

function handle_facebook_request(req, res) {

  // if the user is logged in
  if (req.facebook.token) {

    async.parallel([
      function(cb) {
        // query 4 friends and send them to the socket for this socket id
        req.facebook.get('/me/friends', { limit: 4 }, function(friends) {
          req.friends = friends;
          cb();
        });
      },
      function(cb) {
        // query 16 photos and send them to the socket for this socket id
        req.facebook.get('/me/photos', { limit: 16 }, function(photos) {
          req.photos = photos;
          cb();
        });
      },
      function(cb) {
        // query 4 likes and send them to the socket for this socket id
        req.facebook.get('/me/likes', { limit: 4 }, function(likes) {
          req.likes = likes;
          cb();
        });
      },
      function(cb) {
        // use fql to get a list of my friends that are using this app
        req.facebook.fql('SELECT uid, name, is_app_user, pic_square FROM user WHERE uid in (SELECT uid2 FROM friend WHERE uid1 = me()) AND is_app_user = 447780868588797', function(result) {
          req.friends_using_app = result;
          cb();
        });
      }
    ], function() {
      render_page(req, res);
    });

  } else {
    render_page(req, res);
  }
}

app.get('/activity', handle_facebook_request);
app.get('/', handle_facebook_request);
app.post('/', handle_facebook_request);
