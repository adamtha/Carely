function ActionItemBox(_item, _hide_footer){
	var theme = require('/ui/theme'),
		moment = require('/lib/date/moment'), 
		common = require('/lib/common'), 
		Model = require('/lib/model/model'),
		PostsModel = require('/lib/model/posts'),
		ReviewsModel = require('/lib/model/reviews'),
		_ = require('/lib/underscore'),
		_s = require('/lib/underscore_strings');
	
	var defaultColors = {
		white:'#fff',
		black:'#333',
		grey:'#999',
		lightBlue:'#A0D4FF',
		darkBlue:theme.urlColor,
		lightRed:theme.urlColorClicked
	};
	
	var currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
	
	var row = Ti.UI.createTableViewRow({
		height : 'auto',
		className : 'News_Row',
		separatorStyle : Ti.UI.iPhone.TableViewSeparatorStyle.NONE,
		selectionStyle : Ti.UI.iPhone.TableViewCellSelectionStyle.NONE,
		updated_at : _item.updated_at,
		actionClassName : _item.title,
		unique_id : _item.id,
		post_id : _item.id,
		user_id : _item.user.id,
		user_name : common.getUserDisplayName(_item.user),
		backgroundColor : defaultColors.white,
		layout:'vertical'
	});
	if (_item.event) {
		row.action_id = _item.event.id;
		row.action_name = _item.event.name;
	}
	if (_item.user.custom_fields) {
		if (_item.user.custom_fields.display_name) {
			row.user_name = _item.user.custom_fields.display_name;
		}
		if (_item.user.custom_fields.done) {
			row.action_done = _item.custom_fields.done
		}
		// if (_item.custom_fields.original_post_id && _item.custom_fields.original_classname) {
			// row.post_id = _item.custom_fields.original_post_id;
			// row.actionClassName = _item.custom_fields.original_classname;
		// }
	}
	if(_item.custom_fields && _item.custom_fields['[ACS_User]suggester_id'] && _item.custom_fields['[ACS_User]suggester_id'][0]){
		row.suggester_id = _item.custom_fields['[ACS_User]suggester_id'][0].id;
	}
	
	row.can_join = false;
	if(_item.title === PostsModel.postTypes.checkin || _item.title === PostsModel.postTypes.joins){
		if(currentUser && _item.user && currentUser.id !== _item.user.id && currentUser.custom_fields && currentUser.custom_fields.following && currentUser.custom_fields.following.length){
			var user_to_follow = _item.user.id;
			if (_item.custom_fields && _item.custom_fields.original_poster_id) {
				user_to_follow = _item.custom_fields.original_poster_id;
			}
			row.can_join = currentUser.custom_fields.following.indexOf(user_to_follow) !== -1;
		}
	}
	
	if (_item.custom_fields && _item.custom_fields.intent) {
		row.post_intent = _item.custom_fields.intent;
	}
	
	// header
	var header_view = Ti.UI.createView({
		top:6,
		width:Ti.UI.FILL,
		height:theme.borderedImage.user.height,
		left:6,
		view_type_id:'header_view'
	});
	row.add(header_view);
	
	var user_icon = theme.defaultIcons.user;
	if (_item.user.photo && _item.user.photo.urls && _item.user.photo.urls.square_75) {
		user_icon = _item.user.photo.urls.square_75;
	}
	if(user_icon === theme.defaultIcons.user && _item.custom_fields && _item.custom_fields.fb_user_id){
		user_icon = 'https://graph.facebook.com/' + _item.custom_fields.fb_user_id + '/picture';
	}
	
	var user_image = Ti.UI.createImageView({
		top:0,
		left:0,
		image:user_icon,
		width : theme.borderedImage.user.width,
		height : theme.borderedImage.user.height,
		hires:true,
		touchEnabled:true,
		clickName:'user'
	});
	header_view.add(user_image); 

	var uname = common.getUserDisplayName(_item.user);
	row.user_display_name = uname;
	if (_item.custom_fields.original_poster) {
		row.user_display_name = _s.titleize(_item.custom_fields.original_poster);
	}
	if (row.user_display_name && row.user_display_name.length) {
		row.user_display_name = row.user_display_name.trim();
		var space_idx = row.user_display_name.indexOf(' ');
		if (space_idx > 0) {
			row.user_display_name = row.user_display_name.substr(0, space_idx);
		}
	}

	var user_name = Ti.UI.createLabel({
		color : defaultColors.black,
		top : 0,
		left : user_image.width + 6,
		text : uname,
		font : theme.defaultFontBold,
		touchEnabled:true,
		clickName : 'user'
	});
	header_view.add(user_name); 

	var intent_icon = theme.images.news.checkin, intent_text = 'Checked in';
	if(_item.title === PostsModel.postTypes.checkin){
		intent_icon = theme.images.news.checkin;
		intent_text = 'Checked in to';
		
		var intent_type = PostsModel.intents.checkin;
		if(_item.custom_fields && _item.custom_fields.intent){
			intent_type = _item.custom_fields.intent;
		}
		if(_item.custom_fields && _item.custom_fields.upcoming_date_start){
			intent_type = PostsModel.intents.plan;
		}
		
		switch(intent_type){
			case PostsModel.intents.want :
				intent_icon = theme.images.news.heart;
				intent_text = 'Wanted';
				break;
			case PostsModel.intents.talk :
				intent_icon = theme.images.news.talk;
				intent_text = 'Talked about';
				break;
			case PostsModel.intents.plan :
				if(_item.custom_fields.upcoming_date_start){
					intent_icon = theme.images.news.plan;
					
					var planning_date = moment(_item.custom_fields.upcoming_date_start);
					var days_diff = moment().diff(planning_date, 'days');
					if(days_diff === 0){
						if (_item.custom_fields.upcoming_date && _item.custom_fields.upcoming_date.all_day === true) {
							intent_text = 'Planning today';
						}
						else{
							intent_text = 'Planning ' + planning_date.fromNow().replace('minutes', 'mins');
						}
					}
					else if(days_diff > 0){
						intent_text = 'Planned ' + planning_date.fromNow().replace('minutes', 'mins');
					}
					else{
						intent_text = 'Planning ' + planning_date.fromNow().replace('minutes', 'mins');
					}
				}
				break;
			default:
				intent_icon = theme.images.news.checkin;
				intent_text = 'Checked in to';
				break;
		}
	}
	else if(_item.title === PostsModel.postTypes.joins){
		intent_icon = theme.images.news.join;
		if(_item.custom_fields && _item.custom_fields.original_poster){
			intent_text = 'Joined ' + _s.titleize(_item.custom_fields.original_poster) + ' in';
		}
		else{
			intent_text = 'Joining';
		}
	}
	else if(_item.title === PostsModel.postTypes.actions_add){
		intent_icon = theme.images.news.star;
		intent_text = 'Added to Favorites';
	}
	else if(_item.title === PostsModel.postTypes.lists_add){
		intent_icon = theme.images.news.list_add;
		intent_text = 'Added to the list';
	}
	
	var intent_image = Ti.UI.createImageView({
		image:intent_icon,
		bottom : 3,
		left : user_image.width + 6,
		width : 13,
		height : 13,
		hires:true
	});
	header_view.add(intent_image); 
	
	var intent_name = Ti.UI.createLabel({
		bottom : 0,
		left : intent_image.left + intent_image.width + 6,
		width : Ti.UI.FILL,
		text : intent_text,
		color : defaultColors.grey,
		font : {
			fontSize : 13,
			fontFamily : theme.fontFamily
		}
	});
	header_view.add(intent_name);
	
	// content : action
	var action_view = null;
	if(_item.event){
		var action_content_view = Ti.UI.createView({
			top:4,
			bottom:4,
			left:header_view.left + user_image.width + 6,
			height:Ti.UI.SIZE,
			view_type_id:'action_content_view'
		});
		row.add(action_content_view);
			
		var action_icon = theme.defaultIcons.action;
		if (_item.event.photo && _item.event.photo.urls && _item.event.photo.urls.square_75) {
			action_icon = _item.event.photo.urls.square_75;
		} else if (_item.event.icon) {
			action_icon = _item.event.icon;
		}

		var action_image = Ti.UI.createImageView({
			top:0,
			image:action_icon,
			width : theme.borderedImage.big.width,
			height : theme.borderedImage.big.height,
			right : 6,
			hires:true,
			touchEnabled : true,
			clickName : 'action'
		});
		action_content_view.add(action_image); 
		
		action_view = Ti.UI.createView({
			top:0,
			left:0,
			right:action_image.right + action_image.width + 4,
			height:Ti.UI.SIZE,
			width:Ti.UI.SIZE,
			layout:'vertical'
		});
		action_content_view.add(action_view);
		
		var action_name = Ti.UI.createLabel({
			top:0,
			left:0,
			width : Ti.UI.SIZE,
			text : _item.event.name,
			color : defaultColors.black,
			font : theme.defaultFontBold,
			touchEnabled : true,
			clickName : 'action'
		});
		action_view.add(action_name);
		action_view.data_count = 0;
		
		// user generated text
		if (_item.content && _item.content !== common.emptyCheckinValue &&
			_item.content !== _item.event.name) {
				
			var user_generated_text_view = Ti.UI.createView({
				top : 2,
				left : 0,
				height : Ti.UI.SIZE,
				width : Ti.UI.SIZE,
				layout : 'horizontal'
			});
			action_view.add(user_generated_text_view);
			action_view.data_count++;
			
			var user_generated_text_icon = Ti.UI.createImageView({
				top : 2,
				left : 0,
				image : theme.images.news.chat,
				width : 13,
				height : 13,
				hires:true
			});
			user_generated_text_view.add(user_generated_text_icon);

			var user_generated_text = Ti.UI.createLabel({
				top : 0,
				left : 6,
				height : Ti.UI.SIZE,
				width : Ti.UI.SIZE,
				text : _item.content,
				color : defaultColors.black,
				font : theme.defaultToolTipFont,
				touchEnabled : true
			});
			user_generated_text_view.add(user_generated_text);
		}

		if (_item.custom_fields && _item.custom_fields.attributesText && _item.custom_fields.attributesText.length) {
			var attributes_view = Ti.UI.createView({
				top : 2,
				left : 0,
				height : Ti.UI.SIZE,
				width : Ti.UI.SIZE,
				layout : 'horizontal'
			});
			action_view.add(attributes_view);
			action_view.data_count++;
			
			var attributes_icon = Ti.UI.createImageView({
				top : 2,
				left : 0,
				image : theme.images.news.plus,
				width : 13,
				height : 13,
				hires:true
			});
			attributes_view.add(attributes_icon);

			var attributes_text = Ti.UI.createLabel({
				top : 0,
				left : 6,
				height : Ti.UI.SIZE,
				width : Ti.UI.SIZE,
				text : _item.custom_fields.attributesText,
				color : defaultColors.black,
				font : theme.defaultToolTipFont
			});
			attributes_view.add(attributes_text);
		}
		
		// var action_done_text = '';
		// if (_item.custom_fields && _item.custom_fields.done) {
			// if(_item.custom_fields.done.me > 0){
				// var fname = uname.trim();
				// var space_idx = fname.indexOf(' ');
				// if (space_idx > 0) {
					// fname = fname.substr(0, space_idx);
				// }
				// action_done_text = fname + ' did this ';
				// if (_item.custom_fields.done.me === 1) {
					// action_done_text += 'once';
				// } else if (_item.custom_fields.done.me === 2) {
					// action_done_text += 'twice';
				// }
				// else{
					// action_done_text += _item.custom_fields.done.me;
					// action_done_text += ' times';
				// }
			// }
			// else if(_item.event && _item.event.custom_fields){
				// var total_done = 0;
				// if(_item.event.custom_fields['total_' + PostsModel.intents.checkin]){
					// total_done += _item.event.custom_fields['total_' + PostsModel.intents.checkin];
				// }
				// if(_item.event.custom_fields['total_' + PostsModel.intents.want]){
					// total_done += _item.event.custom_fields['total_' + PostsModel.intents.want];
				// }
				// if(_item.event.custom_fields['total_' + PostsModel.intents.talk]){
					// total_done += _item.event.custom_fields['total_' + PostsModel.intents.talk];
				// }
				// if(_item.event.custom_fields['total_' + PostsModel.intents.plan]){
					// total_done += _item.event.custom_fields['total_' + PostsModel.intents.plan];
				// }
				// if(total_done){
					// action_done_text = 'Done ';
					// if (total_done === 1) {
						// action_done_text += 'once in total';
					// } else if (total_done === 2) {
						// action_done_text += 'twice in total';
					// }
					// else{
						// action_done_text += total_done;
						// action_done_text += ' times in total';
					// }
				// }
			// }
		// }
		// if(action_done_text && action_done_text.length){
			// var done_view = Ti.UI.createView({
				// top:2,
				// left:0,
				// height:Ti.UI.SIZE,
				// width : Ti.UI.SIZE,
				// layout : 'horizontal'
			// });
			// action_view.add(done_view);
// 
			// var done_icon = Ti.UI.createImageView({
				// top:2,
				// left:0,
				// image : theme.images.news.chart,
				// width : 13,
				// height : 13,
				// hires:true
			// });
			// done_view.add(done_icon);
// 
			// var done_text = Ti.UI.createLabel({
				// top:0,
				// left : 6,
				// height:Ti.UI.SIZE,
				// width : Ti.UI.SIZE,
				// text : action_done_text,
				// color : defaultColors.black,
				// font : theme.defaultToolTipFont
			// });
			// done_view.add(done_text); 
		// }
		
		if(_item.event.custom_fields && _item.event.custom_fields.action_url && _item.event.custom_fields.action_url.length > 0){
			var action_url_view = Ti.UI.createView({
				top : 2,
				left : action_content_view.left,
				right:6,
				height : Ti.UI.SIZE,
				width : Ti.UI.SIZE,
				layout : 'horizontal',
				touchEnabled:true,
				clickName:'action_url',
				url_to_open:_item.event.custom_fields.action_url,
				view_type_id:'action_url_view'
			});
			if(action_view.data_count < 2){
				action_url_view.left = 0;
				action_view.add(action_url_view);
				action_view.data_count++;
			}
			else{
				row.add(action_url_view);
			}
	
			var action_url_icon = Ti.UI.createImageView({
				top : 2,
				left : 0,
				image : theme.images.news.link,
				width : 13,
				height : 13,
				hires:true,
				touchEnabled:true,
				url_to_open:_item.event.custom_fields.action_url,
				clickName:'action_url'
			});
			action_url_view.add(action_url_icon);
			
			var action_url_val = _item.event.custom_fields.action_url;
			var action_url_parts = action_url_val.match(/[^:]+:\/\/([^\/]+)\//);
			if(action_url_parts && action_url_parts.length && action_url_parts.length > 1){
				action_url_val = action_url_parts[1];
			}
			if(action_url_val && action_url_val.length){
				action_url_val = action_url_val.replace('www.', '');
			}
			
			var action_url_text = Ti.UI.createLabel({
				top : 2,
				left : 6,
				height : Ti.UI.SIZE,
				width : Ti.UI.SIZE,
				text : action_url_val,
				color : defaultColors.darkBlue,
				font : theme.defaultToolTipFont,
				touchEnabled:true,
				url_to_open:_item.event.custom_fields.action_url,
				clickName:'action_url'
			});
			action_url_text.addEventListener('touchstart', function(e) {
				this.color = defaultColors.lightRed;
			});
			action_url_text.addEventListener('touchend', function(e) {
				this.color = defaultColors.darkBlue;
			});
			action_url_view.add(action_url_text);
		}
	}
	
	var date_location_value = moment(_item.updated_at).fromNow().replace('minutes', 'mins');
	if (date_location_value && date_location_value.length) {
		date_location_value = date_location_value.toLowerCase();
		date_location_value = _s.capitalize(date_location_value);
		
		if(_item && _item.user && _item.custom_fields && _item.custom_fields.share_location !== false){
			var item_user = _item.user;
			if(item_user.id === currentUser.id){
				item_user = currentUser;
			}
			if(item_user.custom_fields && item_user.custom_fields.share_location !== false){
				if(_item.custom_fields.post_location_user_text && _item.custom_fields.post_location_user_text.length){
					date_location_value += ' near ';
					date_location_value += _item.custom_fields.post_location_user_text;
				}
				else if(_item.custom_fields.post_location){
					date_location_value += ' near ';
					date_location_value += common.formatGeoLocation(_item.custom_fields.post_location);
				}
			}
		}
		
		var date_location_view = Ti.UI.createView({
			top : 2,
			left : header_view.left + user_image.width + 6,
			right:6,
			height : Ti.UI.SIZE,
			width : Ti.UI.SIZE,
			layout : 'horizontal',
			view_type_id:'date_location_view'
		});
		if (action_view && action_view.data_count < 2) {
			date_location_view.left = 0;
			action_view.add(date_location_view);
			action_view.data_count++;
		} else {
			row.add(date_location_view);
		}

		var date_icon = Ti.UI.createImageView({
			top : 1,
			left : 0,
			image : theme.images.news.globe,
			width : 13,
			height : 13,
			hires:true
		});
		date_location_view.add(date_icon);

		var date_text = Ti.UI.createLabel({
			top : 0,
			left : 6,
			height : Ti.UI.SIZE,
			width : Ti.UI.SIZE,
			text : date_location_value,
			color : defaultColors.grey,
			font : {
				fontSize : 13,
				fontFamily : theme.fontFamily,
			}
		});
		date_location_view.add(date_text);
	}
	
	if(_item.photo && _item.photo.urls && _item.photo.urls.original){
		var user_generated_image = Ti.UI.createImageView({
			image : _item.photo.urls.original,
			originalImage : _item.photo.urls.original,
			left : 6,
			right:6,
			top : 2,
			height : 'auto',
			visible : true,
			hires : true,
			touchEnabled:true,
			clickName : 'photo',
			view_type_id:'user_generated_image'
		});
		row.add(user_generated_image);
	}
	
	var summ = ReviewsModel.ReviewSummary(_item);
	row.totalLikes = summ.likes;
	row.SetConversationValue = function(_summ){
		row.totalLikes = _summ.likes;
		if(like_icon){
			like_icon.image = row.user_like_id ? theme.images.news.like_on : theme.images.news.like_off;
		}
		row.totalComments = _summ.comments;
		if(comment_icon){
			comment_icon.image = row.user_comment_id ? theme.images.news.comment_on : theme.images.news.comment_off;
		}
		row.totalJoins = _summ.joins;
		if(share_icon){
			share_icon.image = row.user_join_id ? theme.images.news.do_it_on : theme.images.news.do_it_off;
		}
		row.SetConversationTextValue();
	}
	row.AddLikes = function(_num){
		if(_num === 0){
			return;
		}
		row.totalLikes += _num;
		if(row.totalLikes < 0){
			row.totalLikes = 0;
		}
		if(like_icon){
			like_icon.image = _num > 0 ? theme.images.news.like_on : theme.images.news.like_off;
		}
		row.SetConversationTextValue();
	}
	
	row.totalComments = summ.comments;
	row.AddComments = function(_num){
		if(_num === 0){
			return;
		}
		row.totalComments += _num;
		if(row.totalComments < 0){
			row.totalComments = 0;
		}
		if(comment_icon){
			comment_icon.image = _num > 0 ? theme.images.news.comment_on : theme.images.news.comment_off;
		}
		row.SetConversationTextValue();
	}
	
	row.totalJoins = summ.joins;
	row.AddJoins = function(_num){
		if(_num === 0){
			return;
		}
		row.totalJoins += _num;
		if(row.totalJoins < 0){
			row.totalJoins = 0;
		}
		if(share_icon){
			share_icon.image = _num > 0 ? theme.images.news.do_it_on : theme.images.news.do_it_off;
		}
		row.SetConversationTextValue();
	}
	row.SetConversationTextValue = function(){
		var has_text = false;
		if(row.totalLikes){
			var likes_txt = '';
			likes_txt = row.totalLikes + ' Like';
			if(row.totalLikes > 1){
				likes_txt += 's';
			}
			if(likes_text){
				likes_text.text = likes_txt;
				has_text = true;
			}
		}
		if(row.totalComments){
			var comm_txt = '';
			if(has_text){
				comm_txt = ' \u00B7 ';
			}
			comm_txt += row.totalComments + ' Comment';
			if(row.totalComments > 1){
				comm_txt += 's';
			}
			if(comments_text){
				comments_text.text = comm_txt;
				has_text = true;
			}
			if(footer_divider && footer_divider.height === 0){
				footer_divider.height = 1;
			}
		}
		if(row.totalJoins){
			var joins_txt = '';
			if(has_text && !post_joining_view){
				joins_txt += ' \u00B7 ';
			}
			joins_txt += row.totalJoins + ' Joining';
			if(joining_text){
				joining_text.text = joins_txt;
				has_text = true;
			}
		}
		if(conversation_view){
			conversation_view.height = has_text ? Ti.UI.SIZE : 0;
		}
		else{
			if(post_likes_view){
				post_likes_view.height = row.totalLikes ? Ti.UI.SIZE : 0;
			}
			if(post_joining_view){
				post_joining_view.height = row.totalJoins ? Ti.UI.SIZE : 0;
			}
		}
		row.height = 'auto';
	}
	
	var conversation_view = null, post_likes_view = null, post_joining_view = null, likes_text = null, comments_text = null, joining_text = null;
	
	if(!_hide_footer){
		conversation_view = Ti.UI.createView({
			top : 2,
			left : header_view.left + user_image.width + 6,
			right : 6,
			height : 0,
			width : Ti.UI.SIZE,
			layout : 'horizontal',
			view_type_id:'conversation_view'
		});
		row.add(conversation_view);
	
		var conversation_icon = Ti.UI.createImageView({
			top : 0,
			left : 0,
			image : theme.images.news.conversation,
			width : 13,
			height : 13,
			hires : true
		});
		conversation_view.add(conversation_icon);
	
		likes_text = Ti.UI.createLabel({
			top : 1,
			left : 6,
			height : Ti.UI.SIZE,
			width : Ti.UI.SIZE,
			text : '',
			color : defaultColors.grey,
			font : {
				fontSize : 13,
				fontFamily : theme.fontFamily,
			},
			touchEnabled:true,
			clickName:'likes'
		});
		conversation_view.add(likes_text);
		
		comments_text = Ti.UI.createLabel({
			top : 1,
			left : -1,
			height : Ti.UI.SIZE,
			width : Ti.UI.SIZE,
			text : '',
			color : defaultColors.grey,
			font : {
				fontSize : 13,
				fontFamily : theme.fontFamily,
			},
			touchEnabled:true,
			clickName:'comments'
		});
		conversation_view.add(comments_text);
		
		joining_text = Ti.UI.createLabel({
			top : 1,
			left : -1,
			height : Ti.UI.SIZE,
			width : Ti.UI.SIZE,
			text : '',
			color : defaultColors.grey,
			font : {
				fontSize : 13,
				fontFamily : theme.fontFamily,
			},
			touchEnabled:true,
			clickName:'joins'
		});
		conversation_view.add(joining_text);
	}
	else{
		post_likes_view = Ti.UI.createView({
			top : 2,
			left : header_view.left + user_image.width + 6,
			right : 6,
			height : 0,
			width : Ti.UI.SIZE,
			layout : 'horizontal',
			view_type_id:'post_likes_view'
		});
		row.add(post_likes_view);
	
		var post_likes_icon = Ti.UI.createImageView({
			top : 0,
			left : 0,
			image : theme.images.news.like_off,
			width : 14,
			height : 14,
			hires : true
		});
		post_likes_view.add(post_likes_icon);
			
		likes_text = Ti.UI.createLabel({
			top : 0,
			left : 6,
			height : Ti.UI.SIZE,
			width : Ti.UI.SIZE,
			text : '',
			color : defaultColors.darkBlue,
			font : {
				fontSize : 13,
				fontFamily : theme.fontFamily,
			},
			touchEnabled:true,
			clickName:'likes'
		});
		likes_text.addEventListener('touchstart', function(e) {
			this.color = defaultColors.lightRed;
		});
		likes_text.addEventListener('touchend', function(e) {
			this.color = defaultColors.darkBlue;
		});
		post_likes_view.add(likes_text);
		
		post_joining_view = Ti.UI.createView({
			top : 2,
			left : header_view.left + user_image.width + 6,
			right : 6,
			height : 0,
			width : Ti.UI.SIZE,
			layout : 'horizontal',
			view_type_id:'post_joining_view'
		});
		row.add(post_joining_view);
	
		var post_joining_icon = Ti.UI.createImageView({
			top : 0,
			left : 0,
			image : theme.images.news.checkin,
			width : 14,
			height : 14,
			hires : true
		});
		post_joining_view.add(post_joining_icon);
	
		joining_text = Ti.UI.createLabel({
			top : 0,
			left : 6,
			height : Ti.UI.SIZE,
			width : Ti.UI.SIZE,
			text : '',
			color : defaultColors.darkBlue,
			font : {
				fontSize : 13,
				fontFamily : theme.fontFamily,
			},
			touchEnabled:true,
			clickName:'joins'
		});
		joining_text.addEventListener('touchstart', function(e) {
			this.color = defaultColors.lightRed;
		});
		joining_text.addEventListener('touchend', function(e) {
			this.color = defaultColors.darkBlue;
		});
		post_joining_view.add(joining_text);
	}
		
	// footer
	if(!_hide_footer){
		var content_divider = Ti.UI.createView({
			top:2,
			width:Ti.UI.FILL,
			height:1,
			backgroundColor:defaultColors.grey
		});
		row.add(content_divider);
	
		var footer_view = Ti.UI.createView({
			top:0,
			left:0,
			right:0,
			height : 30,
			width : Ti.UI.FILL,
			layout:'horizontal',
			view_type_id:'footer_view'
		});
		row.add(footer_view);
	
		var share_view = Ti.UI.createView({
			top:0,
			left:0,
			height:Ti.UI.FILL,
			width:100,
			object_classname : _item.title,
			object_id : _item.id,
			layout:'horizontal',
			touchEnabled:true,
			clickName : 'post_options'
		});
		footer_view.add(share_view);
		
		var share_icon = Ti.UI.createImageView({
			top : 1.5,
			left : 16,
			image : theme.images.news.do_it_off,
			width : 27,
			height : 27,
			hires:true,
			object_classname : _item.title,
			object_id : _item.id,
			touchEnabled:true,
			clickName : 'post_options',
			view_type_id:'share_icon'
		});
		if (row.can_join && currentUser && currentUser.custom_fields.total_joins && currentUser.custom_fields.total_joins.length) {
			var user_join = _.find(currentUser.custom_fields.total_joins, function(elm) {
				return _s.startsWith(elm, _item.id);
			});
			if (user_join) {
				row.user_join_id = user_join.split('_')[1];
				share_icon.image = theme.images.news.do_it_on;
			}
		}
		share_view.add(share_icon);
		
		var share_text = Ti.UI.createLabel({
			top : 7,
			left : 6,
			width : 'auto',
			text : 'Do it',
			color : defaultColors.grey,
			font : theme.defaultFont,
			object_classname : _item.title,
			object_id : _item.id,
			touchEnabled:true,
			clickName : 'post_options'
		});
		share_view.add(share_text);
	
		var share_divider = Ti.UI.createView({
			top:5,
			bottom:5,
			left:0,
			height:Ti.UI.FILL,
			width:1,
			backgroundColor:defaultColors.grey
		});
		footer_view.add(share_divider);
		
		var like_view = Ti.UI.createView({
			top:0,
			left:0,
			height:Ti.UI.FILL,
			width:100,
			object_classname : _item.title,
			object_id : _item.id,
			layout:'horizontal',
			touchEnabled:true,
			clickName : 'like'
		});
		footer_view.add(like_view);
		
		var like_icon = Ti.UI.createImageView({
			top : 5,
			left : 20,
			image : theme.images.news.like_off,
			width : 20,
			height : 20,
			hires:true,
			object_classname : _item.title,
			object_id : _item.id,
			touchEnabled:true,
			clickName : 'like',
			view_type_id:'like_icon'
		});
		if (currentUser && currentUser.custom_fields.total_likes && currentUser.custom_fields.total_likes.length) {
			var user_like = _.find(currentUser.custom_fields.total_likes, function(elm) {
				return _s.startsWith(elm, _item.id);
			});
			if (user_like) {
				row.user_like_id = user_like.split('_')[1];
				like_icon.image = theme.images.news.like_on;
			}
		}
		like_view.add(like_icon);
		
		var like_text = Ti.UI.createLabel({
			top : 7,
			left : 6,
			width : 'auto',
			text : 'Like',
			color : defaultColors.grey,
			font : theme.defaultFont,
			object_classname : _item.title,
			object_id : _item.id,
			touchEnabled:true,
			clickName : 'like'
		});
		like_view.add(like_text);
		
		var like_divider = Ti.UI.createView({
			top:5,
			bottom:5,
			left:0,
			height:Ti.UI.FILL,
			width:1,
			backgroundColor:defaultColors.grey
		});
		footer_view.add(like_divider);
		
		var comment_view = Ti.UI.createView({
			top:0,
			left:0,
			height:Ti.UI.FILL,
			width:118,
			object_classname : _item.title,
			object_id : _item.id,
			layout:'horizontal',
			touchEnabled:true,
			clickName : 'comment'
		});
		footer_view.add(comment_view);
		
		var comment_icon = Ti.UI.createImageView({
			top : 5,
			left : 10,
			image : theme.images.news.comment_off,
			width : 20,
			height : 20,
			hires:true,
			object_classname : _item.title,
			object_id : _item.id,
			touchEnabled:true,
			clickName : 'comment',
			view_type_id:'comment_icon'
		});
		if (currentUser && currentUser.custom_fields.total_comments && currentUser.custom_fields.total_comments.length) {
			var user_comment = _.find(currentUser.custom_fields.total_comments, function(elm) {
				return _s.startsWith(elm, _item.id);
			});
			if (user_comment) {
				row.user_comment_id = user_comment.split('_')[1];
				comment_icon.image = theme.images.news.comment_on;
			}
		}
		comment_view.add(comment_icon);
		
		var comment_text = Ti.UI.createLabel({
			top : 7,
			left : 6,
			width : 'auto',
			text : 'Comment',
			color : defaultColors.grey,
			font : theme.defaultFont,
			object_classname : _item.title,
			object_id : _item.id,
			touchEnabled:true,
			clickName : 'comment'
		});
		comment_view.add(comment_text);
	}	
	
	var footer_divider = Ti.UI.createView({
		top: _hide_footer ? 2 : 0,
		width:Ti.UI.FILL,
		height:_hide_footer ? (row.totalComments ? 1 : 0) : 2,
		backgroundColor:'#9CC3DD',
		view_type_id:'footer_divider'
	});
	row.add(footer_divider);
	
	row.SetConversationTextValue();
	
	return row;
}

module.exports = ActionItemBox;

