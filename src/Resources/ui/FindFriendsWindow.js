function createUserSection(_item) {
	var theme = require('/ui/theme');
	
	var section_view = Ti.UI.createView({
		height : 24,
		width : Ti.UI.FILL,
		backgroundColor : theme.barColor,
		opacity : 0.9,
		section_title : _item.title
	});

	var divider_top = Ti.UI.createView({
		top : 0,
		backgroundColor : '#111931',
		height : 1
	});
	section_view.add(divider_top);

	var header_lbl = Ti.UI.createLabel({
		text : _item.title,
		left : 6,
		top : 2,
		color : theme.whiteFontColor,
		font : theme.defaultFontBold,
		textAlign : Ti.UI.TEXT_ALIGNMENT_LEFT
	});
	section_view.add(header_lbl);

	var divider_bottom = Ti.UI.createView({
		bottom : 0,
		backgroundColor : '#111931',
		height : 1
	});
	section_view.add(divider_bottom);

	return Ti.UI.createTableViewSection({
		headerView : section_view
	});
}

function InviteFriendsWindow(params){
	var _ = require('/lib/underscore'),
		_s = require('/lib/underscore_strings'),
		theme = require('/ui/theme'), 
		ui = require('/ui/components'),
		moment = require('/lib/date/moment'),
		common = require('/lib/common'),
		facebookModule = require('facebook');
	
	facebookModule.appid = common.FACEBOOK_APP_ID;
	facebookModule.permissions = common.FACEBOOK_APP_PERMISSIONS;
	facebookModule.forceDialogAuth = false;
		
	var isAndroid = Ti.Platform.osname === 'android';
	var currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
	
	var invite_message = 'Check out the ' + Ti.App.name + ' iPhone app for sharing activities'
	
	var _title = 'Invite Friends';
	if(params){
		if(params.contacts){
			_title = 'Contacts';
		}
		else if(params.facebook){
			_title = 'Facebook';
		}
	}
	var self = Ti.UI.createWindow({
		title : _title,
		navBarHidden : isAndroid,
		backgroundColor: theme.defaultBgColor,
		orientationModes : [Ti.UI.PORTRAIT],
		layout:'vertical',
		barColor:theme.barColor
	});
	
	var send_btn = Ti.UI.createButton({
		title:'Send',
		enabled:false
	});
	function sendSMS(){
		var sms = require('bencoding.sms').createSMSDialog({
			barColor : theme.barColor
		});
		if (!sms.canSendText) {
			Ti.UI.createAlertDialog({
				title : 'Not suppoted',
				message : 'This device does not support sending text messages'
			}).show();
		} else {
			sms.setMessageBody(invite_message + ' at http://bit.ly/CarelyAppStoreSMS');
			sms.setToRecipients(to_people);

			sms.addEventListener('completed', function(smsEvent) {
				if(to_emails.length){
					sendEmail();
				}
			});
			sms.addEventListener('cancelled', function(smsEvent) {
				if(to_emails.length){
					sendEmail();
				}
			});
			sms.addEventListener('errored', function(smsEvent) {
				if(to_emails.length){
					sendEmail();
				}
			});
			sms.open({
				animated : true,
				portraitOnly : true
			});
		}
	}
	
	function sendEmail(){
		var emailDialog = Ti.UI.createEmailDialog({
			barColor:theme.barColor
		});
		if (!emailDialog.isSupported()) {
			Ti.UI.createAlertDialog({
				title : 'Error',
				message : 'Email not supported, please configure an account using the apple mail application'
			}).show();
			return;
		}
		var uname = common.getUserDisplayName(currentUser);
		emailDialog.setSubject(uname + ' would like to invite you to ' + Ti.App.name);
		emailDialog.setToRecipients(to_emails);
		emailDialog.setMessageBody(invite_message + ' at http://bit.ly/CarelyAppStoreEmail');

		emailDialog.addEventListener('complete', function(emailEvent) {
			// switch(emailEvent.result){
			// case emailDialog.SENT:
			// break;
			// case emailDialog.SAVED:
			// break;
			// case emailDialog.CANCELLED:
			// break;
			// case emailDialog.FAILED:
			// break;
			// default:
			// break;
			// }
		});
		emailDialog.open();
	}
	send_btn.addEventListener('click', function(e){
		var invite_type = null, invite_num = 0;
		if(params){
			if(params.contacts){
				if(to_people.length){
					invite_type = 'sms';
					invite_num = to_people.length;
					sendSMS();
				}
				else if(to_emails.length){
					invite_type = 'email';
					invite_num = to_emails.length;
					sendEmail();
				}
			}
			else if(params.facebook){
				invite_type = 'facebook';
				invite_num = to_people.length;
				
				facebookModule.dialog('apprequests', {
					message : invite_message + ' at http://bit.ly/CarelyAppStoreFB',
					to:to_people
				}, function(fbEvent) {
					if (fbEvent.success) {

					} else {

					}
				});
			}
		}
		
		require('/lib/analytics').trackEvent({
			category : 'friends',
			action : 'invite',
			label : invite_type,
			value : invite_num
		});
	});
	self.rightNavButton = send_btn;
	
	var to_people = [], to_emails = [], rows_array = [];
	var defaultRowHeight = theme.borderedImage.user.height + 16;
	function createUsersRows(_items) {
		var rows = [];
		if(_items && _items.length > 0) {
			for(var i = 0, l = _items.length; i < l; i++) {
				// ignore current user
				if(currentUser && currentUser.id === _items[i].id){
					continue;
				}
				
				var uname = common.getUserDisplayName(_items[i]);
	
				var row = Ti.UI.createTableViewRow({
					user_id : _items[i].id,
					email : _items[i].email,
					unique_id : _items[i].id,
					height: defaultRowHeight,
					width : Ti.UI.FILL,
					filter : uname,
					backgroundImage:theme.images.rowBox.normal,
					selectionStyle:Ti.UI.iPhone.TableViewCellSelectionStyle.NONE,
					className : 'Users_Row'
				});
				
				if (_items[i] && _items[i].custom_fields && _items[i].custom_fields.suggesting_actions) {
					row.user_action_suggestions = _items[i].custom_fields.suggesting_actions;
				}
					
				var row_view = Ti.UI.createView({
					height : Ti.UI.FILL,
					width : Ti.UI.FILL
				});
				row.add(row_view);
		
				var follow_btn = Ti.UI.createButton({
					title : 'Follow',
					top : 14,
					right : 10,
					height : 24,
					width : 70,
					font : {
						fontSize : 14,
						fontFamily : theme.fontFamily
					},
					textAlign : Ti.UI.TEXT_ALIGNMENT_CENTER,
					backgroundImage : theme.buttonImage.grey.normal,
					backgroundSelectedImage : theme.buttonImage.grey.selected,
					style : Ti.UI.iPhone.SystemButtonStyle.PLAIN,
					clickName : 'follow'
				});
				if (currentUser && currentUser.custom_fields && currentUser.custom_fields.following && currentUser.custom_fields.following.indexOf(_items[i].id) > -1) {
					follow_btn.title = 'Following';
					follow_btn.backgroundImage = theme.buttonImage.green.normal;
					follow_btn.backgroundSelectedImage = theme.buttonImage.green.selected;
				}
				row_view.add(follow_btn);
				
				var userIcon = theme.defaultIcons.user;
				if (_items[i].photo && _items[i].photo.urls && _items[i].photo.urls.square_75) {
					userIcon = _items[i].photo.urls.square_75;
				}
				
				var icon = new ui.ImageViewBordered(userIcon, {
					width : theme.borderedImage.user.width,
					height : theme.borderedImage.user.height,
					left : 8,
					top : 8,
					bottom : 8
				});
				row_view.add(icon);
				
				var userName = Ti.UI.createLabel({
					top:5,
					left:icon.left + icon.width + 6,
					text : uname,
					font : {
						fontSize : 14,
						fontFamily: theme.fontFamily,
						fontWeight : 'bold'
					},
					color:theme.textColor,
					textAlign:Ti.UI.TEXT_ALIGNMENT_LEFT
				});
				row_view.add(userName);
				
				var userDate = Ti.UI.createLabel({
					bottom : 5,
					left:icon.left + icon.width + 6,
					text : 'Since ' + moment(_items[i].updated_at).format('MMM D, YYYY'),
					font : {
						fontSize : 12,
						fontFamily : theme.fontFamily
					},
					color : theme.lightFontColor,
					textAlign:Ti.UI.TEXT_ALIGNMENT_LEFT
				});
				row_view.add(userDate);
				
				rows.push(row);
			}
		}
		if(rows.length){
			rows.sort(function(a,b){
				if(a.filter < b.filter){
					return -1;
				} 
			    else if(a.filter > b.filter){
			    	 return 1;
			    }
			    else{
			    	return 0;
			    }
			});
		}
		return rows;
	}
	
	function createInvitationRows(_items, _execlude_ids){
		var rows = [];
		if(_items && _items.length > 0) {
			for(var i = 0, l = _items.length; i < l; i++) {
				if(_items[i].id && _items[i].name){
					if(_execlude_ids && _execlude_ids.length){
						var avoid_item = false;
						if (params && params.contacts) {
							if(_items[i].email && _items[i].email.length){
								for(var j=0, k=_items[i].email.length; j<k; j++){
									if(_execlude_ids.indexOf(_items[i].email[j]) > -1){
										avoid_item = true;
										break;
									}
								}
							}
						}
						else if (params && params.facebook) {
							if(_execlude_ids.indexOf(_items[i].id) > -1){
								avoid_item = true;
							}
						}
						if(avoid_item){
							continue;
						}
					}
					
					var row = Ti.UI.createTableViewRow({
						height: defaultRowHeight,
						width : Ti.UI.FILL,
						user_id : _items[i].id,
						unique_id : _items[i].id,
						filter : _items[i].name,
						backgroundImage:theme.images.rowBox.normal,
						selectionStyle:Ti.UI.iPhone.TableViewCellSelectionStyle.NONE,
						clickName:'invite',
						className : 'Users_Row'
					});
					
					var row_view = Ti.UI.createView({
						height : Ti.UI.FILL,
						width : Ti.UI.FILL
					});
					row.add(row_view);
					
					var userIcon = theme.defaultIcons.user;
					if (params && params.contacts && _items[i].image) {
						userIcon = _items[i].image;
					}
					else if (params && params.facebook) {
						userIcon = 'https://graph.facebook.com/' + _items[i].id + '/picture';
					}
					
					var icon = new ui.ImageViewBordered(userIcon, {
						width : theme.borderedImage.user.width,
						height : theme.borderedImage.user.height,
						left : 8,
						top : 8,
						bottom : 8
					});
					row_view.add(icon);
					
					var userName = Ti.UI.createLabel({
						top:5,
						left:icon.left + icon.width + 6,
						text : _items[i].name,
						font : {
							fontSize : 14,
							fontFamily: theme.fontFamily,
							fontWeight : 'bold'
						},
						color:theme.textColor,
						textAlign:Ti.UI.TEXT_ALIGNMENT_LEFT
					});
					row_view.add(userName);
					
					var hasPhone = false, hasEmail = false;
					for(var j=0, n=_items[i].id.length; j<n; j++){
						if(_items[i].id[j].type === 'phone'){
							hasPhone = true;
						}
						else if(_items[i].id[j].type === 'email'){
							hasEmail = true;
						}
					}
					
					var phone_icon = Ti.UI.createImageView({
						left:icon.left + icon.width + 6,
						bottom : 8,
						height : 20,
						width : 20,
						image : hasPhone ? theme.images.phone_on : theme.images.phone_off,
						hires:true
					});
					row_view.add(phone_icon); 
					
					var email_icon = Ti.UI.createImageView({
						left:phone_icon.left + phone_icon.width + 4,
						bottom : 8,
						height : 20,
						width : 20,
						image : hasEmail ? theme.images.email_on : theme.images.email_off,
						hires:true
					});
					row_view.add(email_icon); 
					
					rows.push(row);
				}
			}
		}
		if(rows.length){
			rows.sort(function(a, b){
				if(a.filter < b.filter){
					return -1;
				} 
			    else if(a.filter > b.filter){
			    	 return 1;
			    }
			    else{
			    	return 0;
			    }
			});
		}
		return rows;
	}
	
	function createLoadingRow(){
		var loading_row = Titanium.UI.createTableViewRow({
			height:defaultRowHeight,
			backgroundImage:theme.images.rowBox.normal,
			hasChild: false,
			selectionStyle : Ti.UI.iPhone.TableViewCellSelectionStyle.NONE
		});
		
		var act_Ind = Titanium.UI.createActivityIndicator({
			left : '45%',
			top : 14,
			height : 'auto',
			width : 'auto',
			style : Titanium.UI.iPhone.ActivityIndicatorStyle.DARK
		});
		act_Ind.show();
		loading_row.add(act_Ind);
		
		return loading_row;
	}
	
	var users_section = createUserSection({title:'People on ' + Ti.App.name}), 
		invite_section = createUserSection({title:'Invite to ' + Ti.App.name});
	
	users_section.rows = [createLoadingRow()];
	invite_section.rows = [createLoadingRow()];
	
	var search = Ti.UI.createSearchBar({
		barColor: theme.barColor,
		hintText:'Search people to invite'
	});
	search.addEventListener('blur', function(e){
		search.showCancel = false;
	});
	search.addEventListener('focus', function(e){
		search.showCancel = true;
	});
	search.addEventListener('cancel', function(e){
		this.value = '';
		this.blur();
		if(users_section){
			tableView.setData([users_section, invite_section]);
		}
		else{
			tableView.setData([invite_section]);
		}
	});
	search.addEventListener('change', function(e) {
		if(e && e.value && e.value.length){
			var search_rows = [],
					lowerCaseVal = e.value.toLowerCase();
					
			if (users_section && users_section.rows && users_section.rows.length) {
				var rows = _.filter(users_section.rows, function(q) {
					return q.filter.toLowerCase().indexOf(lowerCaseVal) > -1;
				});
				if (rows && rows.length) {
					search_rows = search_rows.concat(rows);
				}
			}
			if (invite_section && invite_section.rows && invite_section.rows.length) {
				var rows = _.filter(invite_section.rows, function(q) {
					return q.filter.toLowerCase().indexOf(lowerCaseVal) > -1;
				});
				if (rows && rows.length) {
					search_rows = search_rows.concat(rows);
				}
			}
			if(search_rows && search_rows.length){
				tableView.setData(search_rows);
			}
			search_rows = null;
		}
		else{
			this.blur();
			if(users_section){
				tableView.setData([users_section, invite_section]);
			}
			else{
				tableView.setData([invite_section]);
			}
		}
	});
	self.add(search);
	
	var act_follow = Ti.UI.createActivityIndicator({
		left : '35%',
		top : 2,
		height : 'auto',
		width : 'auto',
		style : Ti.UI.iPhone.ActivityIndicatorStyle.DARK
	});
	act_follow.show(); 
	
	var tableView = Ti.UI.createTableView({
		data : [users_section, invite_section],
		top : 0,
		left : 0,
		right : 0,
		width : Ti.UI.FILL,
		style:Ti.UI.iPhone.TableViewStyle.PLAIN,
		separatorStyle:Ti.UI.iPhone.TableViewSeparatorStyle.NONE,
		footerView : Ti.UI.createView({height:0})
	});
	tableView.addEventListener('singletap', function(e) {
		if(!search.showCancel){
			search.blur();
		}
		if(e.row && e.row.user_id){
			if(e.row.clickName === 'invite'){
				if(params){
					if(params.contacts){
						if(e.row.user_id.length){
							if(e.row.hasCheck){
								e.row.hasCheck = false;
								if(e.row.selected_data){
									if(e.row.selected_data.type === 'phone'){
										var idx = to_people.indexOf(e.row.selected_data.value);
										if(idx > -1){
											to_people.splice(idx, 1);
										}
									}
									else if(e.row.selected_data.type === 'email'){
										var idx = to_emails.indexOf(e.row.selected_data.value);
										if(idx > -1){
											to_emails.splice(idx, 1);
										}
									}
								}
								send_btn.enabled = (to_people.length + to_emails.length) > 0;
							}
							else{
								if(e.row.user_id.length === 1){
									e.row.hasCheck = true;
									e.row.selected_data = {
										type: e.row.user_id[0].type,
										value: e.row.user_id[0].value
									}
									if(e.row.user_id[0].type === 'phone'){
										if(to_people.indexOf(e.row.user_id[0].value)){
											to_people.push(e.row.user_id[0].value);
										}
									}
									else if(e.row.user_id[0].type === 'email'){
										if(to_emails.indexOf(e.row.user_id[0].value)){
											to_emails.push(e.row.user_id[0].value);
										}
									}
									send_btn.enabled = (to_people.length + to_emails.length) > 0;
								}
								else{
									var options_dialog = {
										options:[],
										types:[]
									};
									for(var i=0, v=e.row.user_id.length; i<v; i++){
										if(e.row.user_id[i].value && e.row.user_id[i].type){
											options_dialog.options.push(e.row.user_id[i].value);
											options_dialog.types.push(e.row.user_id[i].type);
										}
									}
									if(options_dialog.options.length){
										options_dialog.options.push('Cancel');
										options_dialog.cancel = options_dialog.options.length - 1;
										
										var options_dlg = Ti.UI.createOptionDialog(options_dialog);
										options_dlg.addEventListener('click', function(dialogEvent){
											if(dialogEvent.index !== dialogEvent.cancel){
												var selected_value = options_dialog.options[dialogEvent.index],
													selected_type = options_dialog.types[dialogEvent.index];
												e.row.hasCheck = true;
												e.row.selected_data = {
													type: selected_type,
													value: selected_value
												}
												if(selected_type === 'phone'){
													if(to_people.indexOf(selected_value)){
														to_people.push(selected_value);
													}
												}
												else if(selected_type === 'email'){
													if(to_emails.indexOf(selected_value)){
														to_emails.push(selected_value);
													}
												}
												send_btn.enabled = (to_people.length + to_emails.length) > 0;
											}
										});
										options_dlg.show();
									}
								}
							}
						}
					}
					else if(params.facebook){
						e.row.hasCheck = !e.row.hasCheck;
						var idx = to_people.indexOf(e.row.user_id);
						if(e.row.hasCheck){
							if(idx === -1){
								to_people.push(e.row.user_id);
							}
						}
						else if(idx > -1){
							to_people.splice(idx, 1);
						}
						send_btn.enabled = to_people.length > 0;
					}
				}
			}
			else if(e.source && e.source.clickName === 'follow'){
				e.source.title = '';
				e.source.add(act_follow);

				var FriendsModel = require('/lib/model/friends'),
					Model = require('/lib/model/model');
				if (e.source.backgroundImage === theme.buttonImage.grey.normal) {
					FriendsModel.add(e.row.user_id, function(addEvent) {
						e.source.remove(act_follow);
						if (addEvent.success) {
							common.refreshHandler.setRefresh.following(true);
							common.refreshHandler.setRefresh.actions(true);
							common.refreshHandler.setRefresh.news(true);
							
							if(e && e.row && e.row.user_action_suggestions){
								var my_carely_actions = Ti.App.Properties.getList('my_carely_actions', []);
								my_carely_actions = _.union(my_carely_actions, e.row.user_action_suggestions);
								Ti.App.Properties.setList('my_carely_actions', my_carely_actions);
								my_carely_actions = null;
							}
							
							e.source.title = 'Following';
							e.source.backgroundImage = theme.buttonImage.green.normal;
							e.source.backgroundSelectedImage = theme.buttonImage.green.selected;

							var _following = [];
							if (currentUser && currentUser.custom_fields && currentUser.custom_fields.following) {
								_following = _following.concat(currentUser.custom_fields.following);
							}
							if (_following.indexOf(e.row.user_id) === -1) {
								_following.push(e.row.user_id);
								
								var UsersModel = require('/lib/model/users');
								UsersModel.update({
									custom_fields : {
										following : _following
									}
								}, function(updateEvent) {
									if (updateEvent.success) {
										currentUser = updateEvent.users[0];
										Ti.App.Properties.setString('carely_user', JSON.stringify(updateEvent.users[0]));

										Model.AppCache.users.set(updateEvent.users[0]);
									} else {
										Model.eventDefaultErrorCallback(updateEvent);
									}
								});
								
								//Ti.App.fireEvent('following.handle', { following: e.row.user_id });
							}
							if (currentUser && currentUser.id && currentUser.id !== e.row.user_id && currentUser.username) {
								var funame = common.getUserDisplayName(currentUser);
								
								Ti.App.fireEvent('push.notify', {
									tags : [e.row.user_id + '_follow'],
									alert : funame + ' started following you!',
									custom_fields : {
										to_user_id : e.row.user_id,
										type : 'follow'
									}
								});
							}

						} else {
							e.source.title = 'Follow';

							Model.eventDefaultCallback(addEvent);
						}
					});
				} else {
					FriendsModel.remove(e.row.user_id, function(removeEvent) {
						e.source.remove(act_follow);
						if (removeEvent.success) {
							common.refreshHandler.setRefresh.following(true);
							
							e.source.title = 'Follow';
							e.source.backgroundImage = theme.buttonImage.grey.normal;
							e.source.backgroundSelectedImage = theme.buttonImage.grey.selected;

							var _following = [];
							if (currentUser && currentUser.custom_fields && currentUser.custom_fields.following) {
								_following = _following.concat(currentUser.custom_fields.following);
							}
							var follow_idx = _following.indexOf(e.row.user_id);
							if (_following.length > 0 && follow_idx !== -1) {
								_following.splice(follow_idx, 1);
								
								var UsersModel = require('/lib/model/users');
								UsersModel.update({
									custom_fields : {
										following : _following
									}
								}, function(updateEvent) {
									if (updateEvent.success) {
										currentUser = updateEvent.users[0];
										Ti.App.Properties.setString('carely_user', JSON.stringify(updateEvent.users[0]));

										Model.AppCache.users.set(updateEvent.users[0]);
									} else {
										Model.eventDefaultErrorCallback(updateEvent);
									}
								});
							}
							
							if (currentUser && currentUser.id && currentUser.id !== e.row.user_id && currentUser.username) {
								var funame = common.getUserDisplayName(currentUser);
								
								Ti.App.fireEvent('push.notify', {
									aliases : [e.row.user_id + '_follow'],
									alert : funame + ' stopped following you!',
									custom_fields : {
										to_user_id : e.row.user_id,
										type : 'follow'
									}
								});
							}

						} else {
							e.source.title = 'Follow';

							Model.eventDefaultCallback(removeEvent);
						}
					});
				}
			}
			else{
				var UserWindow = require('/ui/UserWindow');
				var userWindow = new UserWindow(e.row.user_id);
				require('/ui/MasterWindow').getNavGroup().open(userWindow);
			}
		}
	});
	self.add(tableView);
	
	function getContactFriends(){
		var all_contacts = Ti.Contacts.getAllPeople();
		if(all_contacts){
			var data = [];
			for (var i = 0, v = all_contacts.length; i < v; i++) {
				if(all_contacts[i].fullName && all_contacts[i].phone){
					var mails = null;
						valid_mails = ['home', 'work', 'other'];
					if(all_contacts[i].email){
						mails = [];
						for(var j=0, n=valid_mails.length; j<n; j++){
							if(all_contacts[i].email[valid_mails[j]] && all_contacts[i].email[valid_mails[j]].length){
								for(var k=0, t=all_contacts[i].email[valid_mails[j]].length; k<t; k++){
									mails.push({value:all_contacts[i].email[valid_mails[j]][k], type:'email'});
								}
							}
						}
					}
					
					var phones = [],
						valid_phones = ['mobile', 'iPhone', 'main', 'home', 'work', 'other'];
					for(var j=0, n=valid_phones.length; j<n; j++){
						if(all_contacts[i].phone[valid_phones[j]] && all_contacts[i].phone[valid_phones[j]].length){
							for(var k=0, t=all_contacts[i].phone[valid_phones[j]].length; k<t; k++){
								phones.push({value:all_contacts[i].phone[valid_phones[j]][k], type:'phone'});
							}
						}
					}
					if(mails && mails.length){
						phones = phones.concat(mails);
					}
					if(phones && phones.length){
						data.push({
							id:phones,
							name:all_contacts[i].fullName,
							image:all_contacts[i].image,
							email:mails
						});
					}
				}
			}
			
			data = _.uniq(data, false, function(n){
				return n.name;
			});
			if(data && data.length){
				var emails = [];
				for(var i=0, v=data.length; i<v; i++){
					if(data[i].email && data[i].email.length){
						for(var j=0, n=data[i].email.length; j<n; j++){
							if(data[i].email[j].value && data[i].email[j].type){
								emails.push(data[i].email[j].value)
							}
						}
					}
				}
				emails = _.uniq(emails, false, function(n){
					return n;
				});
				if(emails && emails.length){
					var Model = require('/lib/model/model'), UsersModel = require('/lib/model/users');
					UsersModel.query({
						email:{'$in' : emails}
					}, null, 100, 0, function(e) {
						var user_rows = null;
						if (e.success) {
							if (e.users && e.users.length > 0) {
								user_rows = createUsersRows(e.users);
							}
						} else {
							Model.eventDefaultErrorCallback(e);
						}
						if(user_rows && user_rows.length){
							users_section.rows = user_rows;
							user_rows = null;
							tableView.setData([users_section, invite_section]);
						}
						else{
							users_section = null;
							tableView.setData([invite_section]);
						}
					});
				}
				else{
					users_section = null;
					tableView.setData([invite_section]);
				}
				
				var contactsRows = createInvitationRows(data, null);
				if(contactsRows && contactsRows.length){
					invite_section.headerView.children[2].text = '' + contactsRows.length;
					
					if(contactsRows.length > 8){
						invite_section.rows = contactsRows.slice(0, 8);
						if(users_section){
							tableView.setData([users_section, invite_section]);	
						}
						else{
							tableView.setData([invite_section]);
						}
						
						for(var i=8, v=contactsRows.length; i<v; i++){
							tableView.appendRow(contactsRows[i], {animated:false});
						}
						contactsRows = null;
					}
					else{
						invite_section.rows = contactsRows;
						if(users_section){
							tableView.setData([users_section, invite_section]);	
						}
						else{
							tableView.setData([invite_section]);
						}
					}	
				}		
			}
			else{
				invite_section.headerView.children[1].text = 'We could not get any contacts friends';
				invite_section.rows = [];
				if(users_section){
					tableView.setData([users_section, invite_section]);	
				}
				else{
					tableView.setData([invite_section]);
				}
			}
		}
		else{
			users_section = null;
			invite_section.headerView.children[1].text = 'We could not get any contacts friends';
			invite_section.rows = [];
			tableView.setData([invite_section]);
		}
	}
	
	function queryContacts(){
		if (Ti.Contacts.contactsAuthorization === Ti.Contacts.AUTHORIZATION_AUTHORIZED) {
			getContactFriends();
		} else if (Ti.Contacts.contactsAuthorization === Ti.Contacts.AUTHORIZATION_UNKNOWN) {
			Ti.Contacts.requestAuthorization(function(contactsEvent) {
				if (contactsEvent.success) {
					getContactFriends();
				}
			});
		}
	}
	
	function getFacebookFriends(){
		var Model = require('/lib/model/model'), 
			socialModel = require('/lib/model/social');
		
		if (facebookModule.loggedIn) {
			facebookModule.requestWithGraphPath('me', {
				fields : 'friends'
			}, 'GET', function(fbqEvent) {
				var fbRows = null;
				if (fbqEvent.success) {
					var fb_result = JSON.parse(fbqEvent.result);
					if (fb_result && fb_result.friends && fb_result.friends.data && fb_result.friends.data.length > 0) {
						fbRows = createInvitationRows(fb_result.friends.data, null);
					}
				}
				
				if(fbRows && fbRows.length){
					invite_section.headerView.children[2].text = '' + fbRows.length;

					if (fbRows.length > 8) {
						invite_section.rows = fbRows.slice(0, 8);
						if(users_section){
							tableView.setData([users_section, invite_section]);
						}
						else{
							tableView.setData([invite_section]);
						}

						for (var i = 8, v = fbRows.length; i < v; i++) {
							tableView.appendRow(fbRows[i], {
								animated : false
							});
						}
					} else {
						invite_section.rows = fbRows;
						if(users_section){
							tableView.setData([users_section, invite_section]);
						}
						else{
							tableView.setData([invite_section]);
						}
					}
					fbRows = null;
				}
				else{
					invite_section.headerView.children[1].text = 'We could not get any facebook friends';
					invite_section.rows = [];
					if(users_section){
						tableView.setData([users_section, invite_section]);
					}
					else{
						tableView.setData([invite_section]);
					}
				}
			});
		}
		else{
			invite_section.headerView.children[1].text = 'We could not get any facebook friends';
			invite_section.rows = [];
			if(users_section){
				tableView.setData([users_section, invite_section]);
			}
			else{
				tableView.setData([invite_section]);
			}
		}
		
		socialModel.searchFacebookFriends(function(searchEvent) {
			
			require('/lib/analytics').trackSocial({
				network : 'facebook',
				action : 'friends',
				target : self.title
			}); 

			var user_rows = null;
			if (searchEvent.success) {
				if (searchEvent.users && searchEvent.users.length > 0) {
					Model.AppCache.users.setMany(searchEvent.users);
					
					user_rows = createUsersRows(searchEvent.users);
				}
			} else {
				Model.eventDefaultCallback(searchEvent);
			}
			if(user_rows && user_rows.length){
				users_section.rows = user_rows;
				user_rows = null;
				tableView.setData([users_section, invite_section]);
			}
			else{
				users_section = null;
				tableView.setData([invite_section]);
			}
		});
	}

	function queryFacebook() {
		var hasFacebookAccountLinked = false;
		if (currentUser && currentUser.external_accounts) {
			for (var i = 0, v = currentUser.external_accounts.length; i < v; i++) {
				if (currentUser.external_accounts[i].external_id && currentUser.external_accounts[i].external_type === 'facebook') {
					hasFacebookAccountLinked = true;
					break;
				}
			}
		}
		
		if (hasFacebookAccountLinked && facebookModule.loggedIn) {
			getFacebookFriends();
		}
		else{
			var facebookListener = function(fbEvent) {
				try {
					if (fbEvent.success) {
						if (fbEvent.data && fbEvent.data.email && fbEvent.data.email.length > 0) {
							Ti.App.Properties.setString('carely_user_facebook', JSON.stringify(fbEvent.data));

							var Model = require('/lib/model/model'), socialModel = require('/lib/model/social'), actIndicator = require('/ui/ActivityIndicator');
							var indicator = new actIndicator();
							indicator.showModal('Connecting account...', 60000, 'Timeout connecting account!');
							socialModel.linkAccount(facebookModule.uid, 'facebook', facebookModule.accessToken, function(linkEvent) {
								indicator.hideModal();
								if (linkEvent.success) {
									var _user = linkEvent.users[0];

									Ti.App.Properties.setString('carely_user', JSON.stringify(_user));
									Model.AppCache.users.set(_user);
									
									require('/lib/analytics').trackSocial({
										network : 'facebook',
										action : 'link',
										target : self.title
									});
														
									getFacebookFriends();
								} else {
									Model.eventDefaultErrorCallback(linkEvent);
								}
							});
						} else {
							// invalid data returned from facebook
						}
					} else {
						if (fbEvent.error) {
							Model.eventDefaultErrorCallback(fbEvent);
						}
					}
				} catch(err) {
				} finally {
					facebookModule.removeEventListener('login', facebookListener);
				}
			}
			facebookModule.addEventListener('login', facebookListener);

			// if (Ti.Platform.canOpenURL('fb://profile')) {
			// facebookModule.forceDialogAuth = false;
			// } else {
			// facebookModule.forceDialogAuth = true;
			// }

			facebookModule.forceDialogAuth = false;
			facebookModule.authorize();
		}
	}
	
	self.addEventListener('open', function(e){
		require('/lib/analytics').trackScreen({ screenName : 'Invite Friends' });
		
		require('/lib/analytics').trackEvent({
			category : 'invite',
			action : self.title,
			label : null,
			value : null
		});
		
		if(params){
			if(params.contacts){
				queryContacts();
			}
			else if(params.facebook){
				queryFacebook();
			}
		}
	});
	return self;	
}

function FindFriendsWindow(params) {
	var _ = require('/lib/underscore'),
		_s = require('/lib/underscore_strings'),
		theme = require('/ui/theme'), 
		ui = require('/ui/components'),
		moment = require('/lib/date/moment'),
		common = require('/lib/common'),
		Model = require('/lib/model/model'),
		facebookModule = require('facebook');
	
	facebookModule.appid = common.FACEBOOK_APP_ID;
	facebookModule.permissions = common.FACEBOOK_APP_PERMISSIONS;
	facebookModule.forceDialogAuth = false;
	
	var isAndroid = Ti.Platform.osname === 'android',
		currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
	
	var self = Ti.UI.createWindow({
		title : 'Following',
		barColor:theme.barColor,
		navBarHidden : isAndroid,
		backgroundColor: theme.defaultBgColor,
		orientationModes : [Ti.UI.PORTRAIT],
		layout:'vertical'
	});
	
	var is_express_setup = false,
		showInviteHeader = true,
		is_suggesters = false;
		addedFollowing = {
			total_following:0
		};
	if(params){
		if(params.title){
			self.title = params.title;
		}
		if(params.suggesters){
			showInviteHeader = false;
			is_suggesters = true;
		}
		if(params.express_setup){
			Ti.App.Properties.setBool('carely_just_loggedin', true);
			
			is_express_setup = true;
			showInviteHeader = false;
			
			var has_following = (currentUser.custom_fields && currentUser.custom_fields.following && currentUser.custom_fields.following.length);
			var skipButton = Ti.UI.createButton({
				title : 'Next',
				enabled : false
			});
			skipButton.addEventListener('click', function(e) {

				if (this.clickTime && (new Date() - this.clickTime < 1000)) {
					return false;
				}
				this.clickTime = new Date();

				var my_default_following = {
					users:[],
					checkins:0
				};

				for(var k in addedFollowing){
					if(addedFollowing.hasOwnProperty(k) && addedFollowing[k]){
						my_default_following.users.push(k);
						my_default_following.checkins += addedFollowing[k].checkins;
					}
				}
				
				require('/lib/analytics').trackEvent({
					category : self.title,
					action : skipButton.title,
					label : 'following',
					value : my_default_following.users.length
				});
				
				Ti.App.Properties.setString('my_default_following', JSON.stringify(my_default_following));
				require('/ui/MasterWindow').getNavGroup().goToHome(self, false);
				
			});
			self.rightNavButton = skipButton;
			if(!params.enable_back){
				self.leftNavButton = Ti.UI.createView();
			}
		}
	}
	
	var defaultRowHeight = theme.borderedImage.user.height + 16, _updating = false;
	var header_view = null;

	if(showInviteHeader){
		header_view = Ti.UI.createView({
			height:Ti.UI.SIZE,
			width:Ti.UI.FILL,
			layout:'vertical'
		});
		
		var contacts_view = createHeaderItem({icon:theme.images.contacts, title:'Contacts', caption:'Find friends from your contacts', clickName:'contacts'}),
		facebook_view = createHeaderItem({icon:theme.images.social.facebook.friends, title:'Facebook', caption:'Find friends from Facebook', clickName:'facebook'});
	
		contacts_view.addEventListener('singletap', function(e){
			var inviteFriendsWindow = new InviteFriendsWindow({contacts:true});
			require('/ui/MasterWindow').getNavGroup().open(inviteFriendsWindow);
			
			require('/lib/analytics').trackEvent({
				category : 'contacts header',
				action : 'click',
				label : 'contacts',
				value : null
			});
		});
		header_view.add(contacts_view);
		
		facebook_view.addEventListener('singletap', function(e){
			var inviteFriendsWindow = new InviteFriendsWindow({facebook:true});
			require('/ui/MasterWindow').getNavGroup().open(inviteFriendsWindow);
			
			require('/lib/analytics').trackEvent({
				category : 'contacts header',
				action : 'click',
				label : 'facebook',
				value : null
			});
		});
		header_view.add(facebook_view);
	}
	
	function createHeaderItem(_item){
		var header_item_view = Ti.UI.createView({
			height:Ti.UI.SIZE,
			width:Ti.UI.FILL
		});
		
		var header_item_icon = Ti.UI.createImageView({
			backgroundImage : _item.icon,
			width : theme.borderedImage.user.width + 4,
			height : theme.borderedImage.user.height + 4,
			left : 8,
			top : 6,
			bottom : 6,
			hires : true
		});
		header_item_view.add(header_item_icon); 

		var header_item_title = Ti.UI.createLabel({
			top : 5,
			left : header_item_icon.left + header_item_icon.width + 6,
			text : _item.title,
			font : {
				fontSize : 14,
				fontFamily : theme.fontFamily,
				fontWeight : 'bold'
			},
			color : theme.darkFontColor,
			textAlign : Ti.UI.TEXT_ALIGNMENT_LEFT
		});
		header_item_view.add(header_item_title);

		var header_item_caption = Ti.UI.createLabel({
			bottom : 5,
			left : header_item_icon.left + header_item_icon.width + 6,
			text : _item.caption,
			font : {
				fontSize : 12,
				fontFamily : theme.fontFamily
			},
			color : theme.lightFontColor,
			textAlign : Ti.UI.TEXT_ALIGNMENT_LEFT
		}); 
		header_item_view.add(header_item_caption);
		
		var header_item_divider = Ti.UI.createView({
			bottom:0,
			height : 1,
			width : Ti.UI.FILL,
			backgroundColor : '#9CC3DD'
		});
		header_item_view.add(header_item_divider);
				
		return header_item_view;
	}
	
	function createUsersRows(_items, _filter_suggesters) {
		var rows = [];
		try{
		if(_items && _items.length > 0) {
			var show_activity_lists = (is_suggesters || is_express_setup);
			for(var i = 0, l = _items.length; i < l; i++) {
				var has_suggesting_actions = false, is_activity_list = false;
				if(_items[i].custom_fields && _items[i].custom_fields.suggesting_actions && _items[i].custom_fields.suggesting_actions.length){
					has_suggesting_actions = true;
				}
				if(_filter_suggesters && !has_suggesting_actions){
					continue;
				}
				
				// ignore current user
				if(currentUser && currentUser.id === _items[i].id){
					continue;
				}
				
				var uname = common.getUserDisplayName(_items[i]);
				
				var row = Ti.UI.createTableViewRow({
					user_id : _items[i].id,
					unique_id : _items[i].id,
					height: defaultRowHeight,
					width : Ti.UI.FILL,
					filter : uname,
					selectionStyle:Ti.UI.iPhone.TableViewCellSelectionStyle.NONE,
					total_checkins:0,
					className : 'Users_Row'
				});
				
				if(show_activity_lists && _items[i].custom_fields && 
				   _items[i].custom_fields.activity_list_name &&
				   _items[i].custom_fields.activity_list_name.length){
				   	is_activity_list = true;
					row.filter = _items[i].custom_fields.activity_list_name;
				}
				
				if (_items[i].custom_fields) {
					if(_items[i].custom_fields.suggesting_actions){
						row.user_action_suggestions = _items[i].custom_fields.suggesting_actions;
					}
					
					if(is_express_setup){
						for (var k in _items[i].custom_fields) {
							if (_items[i].custom_fields.hasOwnProperty(k)) {
								var j = k.split('_');
								if (j && j.length === 2 && (j[1] === 'checkins') && _items[i].custom_fields[k]) {
									row.total_checkins += _items[i].custom_fields[k];
								}
							}
						}
					}
				}
				
				var row_view = Ti.UI.createView({
					height : Ti.UI.FILL,
					width : Ti.UI.FILL
				});
				row.add(row_view);
		
				var follow_btn = Ti.UI.createButton({
					title : 'Follow',
					top : 14,
					right : 10,
					height : 24,
					width : 70,
					font : {
						fontSize : 14,
						fontFamily : theme.fontFamily
					},
					textAlign : Ti.UI.TEXT_ALIGNMENT_CENTER,
					backgroundImage : theme.buttonImage.grey.normal,
					backgroundSelectedImage : theme.buttonImage.grey.selected,
					style : Ti.UI.iPhone.SystemButtonStyle.PLAIN,
					clickName : 'follow'
				});
				if (currentUser && currentUser.custom_fields && currentUser.custom_fields.following && currentUser.custom_fields.following.indexOf(_items[i].id) > -1) {
					follow_btn.title = 'Following';
					follow_btn.backgroundImage = theme.buttonImage.green.normal;
					follow_btn.backgroundSelectedImage = theme.buttonImage.green.selected;
					
					if(is_express_setup){
						var suggesting_actions = 0;
						if(row.user_action_suggestions){
							suggesting_actions = row.user_action_suggestions.length;
						}
						addedFollowing[row.user_id] = {
							checkins:row.total_checkins,
							suggestions:suggesting_actions
						};
						addedFollowing.total_following += 1;
						
						if(self.rightNavButton){
							self.rightNavButton.enabled = addedFollowing.total_following > 0;
						}
					}
				}
				row_view.add(follow_btn);
				
				var userIcon = theme.defaultIcons.user;
				if (_items[i].photo && _items[i].photo.urls && _items[i].photo.urls.square_75) {
					userIcon = _items[i].photo.urls.square_75;
				}
				if(show_activity_lists && 
				   _items[i].custom_fields && 
				   _items[i].custom_fields['[ACS_Photo]activity_list_photo_id'] &&
				   _items[i].custom_fields['[ACS_Photo]activity_list_photo_id'][0] && 
				   _items[i].custom_fields['[ACS_Photo]activity_list_photo_id'][0].urls && 
				   _items[i].custom_fields['[ACS_Photo]activity_list_photo_id'][0].urls.square_75){
					userIcon = _items[i].custom_fields['[ACS_Photo]activity_list_photo_id'][0].urls.square_75;
					is_activity_list = true;
				}
				
				var icon = new ui.ImageViewBordered(userIcon, {
					width : theme.borderedImage.user.width,
					height : theme.borderedImage.user.height,
					left : 8,
					top : 8,
					bottom : 8
				});
				row_view.add(icon);
				
				var userName = Ti.UI.createLabel({
					top:5,
					left:icon.left + icon.width + 6,
					text : row.filter,
					font : {
						fontSize : 14,
						fontFamily: theme.fontFamily,
						fontWeight : 'bold'
					},
					color:theme.textColor,
					textAlign:Ti.UI.TEXT_ALIGNMENT_LEFT
				});
				row_view.add(userName);
				
				if(has_suggesting_actions){
					var user_activity_suggestions = Ti.UI.createLabel({
						bottom : 5,
						left:icon.left + icon.width + 6,
						text : _items[i].custom_fields.suggesting_actions.length + ' Activities',
						font : {
							fontSize : 12,
							fontFamily : theme.fontFamily
						},
						color : theme.lightBgColor,
						textAlign:Ti.UI.TEXT_ALIGNMENT_LEFT
					});
					if(is_activity_list){
						user_activity_suggestions.text += ' \u00B7 By ' + uname;
					}
					else{
						user_activity_suggestions.text = 'Suggesting ' + user_activity_suggestions.text;
					}
					row_view.add(user_activity_suggestions);
				}
				
				var row_divider = Ti.UI.createView({
					bottom:0,
					height : 1,
					width : Ti.UI.FILL,
					backgroundColor : '#9CC3DD'
				});
				row_view.add(row_divider);
				
				rows.push(row);
			}
		}
		}catch(errr){ 
			//Ti.API.info('err:' + JSON.stringify(errr));
		}
		return rows;
	}
	
	function searchFriends(_search_term, _from_auto_complete) {
		if(_search_term && _search_term.length > 2){
			_updating = true;
			_searching = true;
			
			var LowerCaseTerm = _search_term.toLowerCase(),
				CapitalizedTerm = _search_term.charAt(0).toUpperCase() + _search_term.substr(1);
			
			if(header_view){
				header_view.height = 0;
			}
				
			var search_section = createUserSection({title:'Results for \'' + _search_term + '\''});
			var rows = [];
			
			if(suggested_section && suggested_section.rows && suggested_section.rows.length){
				for(var i=0, v=suggested_section.rows.length; i<v; i++){
					if(suggested_section.rows[i].filter && suggested_section.rows[i].filter.length && 
					   suggested_section.rows[i].filter.toLowerCase().indexOf(LowerCaseTerm) > -1){
						rows.push(suggested_section.rows[i]);
					}
				}
			}
			rows = _.uniq(rows, false, function(n){
				return n.unique_id;
			});
			search_section.rows = rows;
			footer_view.height = defaultRowHeight;
			tableView.setData([search_section]);
			
			require('/lib/analytics').trackEvent({
				category : 'search',
				action : 'filter',
				label : _search_term,
				value : rows.length
			});
							
			var UsersModel = require('/lib/model/users');
			
			var _where = {
				display_name : {$regex : '^' + CapitalizedTerm}
			};
			//if(is_suggesters){
			//	_where.suggesting_actions = {$exists : true};
			//}
			//else{
			//	_where.importance = {$gt : 0};
			//}
			UsersModel.query(_where, '-importance', 100, 0, function(queryEvent){
				require('/lib/analytics').trackEvent({
					category : 'search',
					action : 'prefix',
					label : CapitalizedTerm,
					value : (queryEvent.success && queryEvent.users) ? queryEvent.users.length : 0
				});
							
				if (queryEvent.success) {
					if (queryEvent.users && queryEvent.users.length) {
						Model.AppCache.users.setMany(queryEvent.users);

						var newRows = createUsersRows(queryEvent.users);
						if (newRows && newRows.length) {
							if(_searching){
								rows = rows.concat(newRows);
							}
						}
					}
				} else {
					//Model.eventDefaultErrorCallback(queryEvent);
				}
				
				if(_searching){
						UsersModel.search(_search_term, 1, 100, function(searchEvent) {
							require('/lib/analytics').trackEvent({
								category : 'search',
								action : 'full text',
								label : _search_term,
								value : searchEvent.success ? searchEvent.meta.total_results : 0
							});
							
							if (searchEvent.success) {
								if (searchEvent.meta.total_results) {
									Model.AppCache.users.setMany(searchEvent.users);
			
									var newRows = createUsersRows(searchEvent.users);
									if (newRows && newRows.length) {
										if(_searching){
											rows = rows.concat(newRows);
										}
									}
								}
							} else {
								Model.eventDefaultErrorCallback(searchEvent);
							}
							
							if(rows && rows.length){
								rows = _.uniq(rows, false, function(n){
									return n.unique_id;
								});
								search_section.rows = rows;
							}
							else{
								search_section.rows = [];
								search_section.headerView.children[1].text = 'No results for \'' + _search_term + '\'';
							}
							tableView.setData([search_section]);
							rows = null;
							search.value = search.value;
							
							footer_view.height = 0;
						});
					}
					else{
						footer_view.height = 0;
					}
			});
		}
	}
	
	var last_search = null, auto_complete_timer = null, _searching = false;
	var search = Ti.UI.createSearchBar({
		barColor: theme.barColor,
		hintText:'Find People/Activity lists on ' + Ti.App.name
	});
	search.addEventListener('blur', function(e){
		search.showCancel = false;
	});
	search.addEventListener('focus', function(e) {
		search.showCancel = true;
		if(auto_complete_timer){
			clearTimeout(auto_complete_timer);
		}
		last_search = null;
	});
	search.addEventListener('change', function(e) {
		if(auto_complete_timer){
			clearTimeout(auto_complete_timer);
		}
		if(e.value){
			if(!e.value.length){
				_searching = false;
				if(header_view){
					header_view.height = Ti.UI.SIZE;
				}
				if(suggested_section && suggested_section.rows && suggested_section.rows.length){
					tableView.setData(suggested_section);
				}
			}
			else if (e.value.length > 2 && e.value !== last_search) {
				auto_complete_timer = setTimeout(function(){
					last_search = e.value;
					searchFriends(e.value, true);
				}, 500);
				
				require('/lib/analytics').trackEvent({
					category : 'search',
					action : 'auto complete',
					label : e.value,
					value : null
				});
			}
		}
	});
	search.addEventListener('cancel', function(e){
		_searching = false;
		if(auto_complete_timer){
			clearTimeout(auto_complete_timer);
		}
		search.value = '';
		this.blur();
		
		if(header_view){
			header_view.height = Ti.UI.SIZE;
		}
		if(suggested_section && suggested_section.rows && suggested_section.rows.length){
			tableView.setData([suggested_section]);
		}
	});
	search.addEventListener('return', function(e) {
		if(auto_complete_timer){
			clearTimeout(auto_complete_timer);
		}
		
		this.blur();
		if (this.value && this.value.length > 2) {
			auto_complete_timer = setTimeout(function(){
				last_search = this.value;
				searchFriends(this.value, false);
			}, 500);
			
			require('/lib/analytics').trackEvent({
				category : 'search',
				action : 'keyboard',
				label : this.value,
				value : null
			});
		}
	}); 
	self.add(search);
	
	var footer_view = Ti.UI.createView({
		height : 0,
		width:Ti.UI.FILL
	});
	
	var footer_view_indicator = Ti.UI.createActivityIndicator({
		//left : 10,
		//top : 12,
		height : Ti.UI.SIZE,
		width : Ti.UI.FILL,
		//message : '',
		font : theme.defaultToolTipFont,
		style : Ti.UI.iPhone.ActivityIndicatorStyle.DARK
	});
	footer_view_indicator.show();
	footer_view.add(footer_view_indicator);
	
	var act_follow = Ti.UI.createActivityIndicator({
		left : '35%',
		top : 2,
		height : 'auto',
		width : 'auto',
		style : Ti.UI.iPhone.ActivityIndicatorStyle.DARK
	});
	act_follow.show(); 
	
	var tableView = Ti.UI.createTableView({
		top : 0,
		left : 0,
		right : 0,
		headerView:header_view ? header_view : undefined,
		width : Ti.UI.FILL,
		style:Ti.UI.iPhone.TableViewStyle.PLAIN,
		separatorStyle:Ti.UI.iPhone.TableViewSeparatorStyle.NONE,
		footerView : footer_view,
		bubbleParent:false
	});
	tableView.addEventListener('singletap', function(e) {
		if (e.row && e.row.user_id) {
			if (e.source && e.source.clickName === 'follow') {
				
				e.source.title = '';
				e.source.add(act_follow);

				var FriendsModel = require('/lib/model/friends');
				if (e.source.backgroundImage === theme.buttonImage.grey.normal) {
					
					if(is_express_setup){
						var suggesting_actions = 0;
						if(e.row.user_action_suggestions){
							suggesting_actions = e.row.user_action_suggestions.length;
						}
						addedFollowing[e.row.user_id] = {
							checkins:e.row.total_checkins,
							suggestions:suggesting_actions
						};
						addedFollowing.total_following += 1;
						
						if(self.rightNavButton){
							self.rightNavButton.enabled = addedFollowing.total_following > 0;
						}
					}
					
					require('/lib/analytics').trackEvent({
						category : self.title,
						action : 'follow',
						label : e.row.user_id,
						value : e.row.user_action_suggestions ? e.row.user_action_suggestions.length : 0
					});
					
					if(e.row.user_action_suggestions && e.row.user_action_suggestions.length){
						var my_default_actions = JSON.parse(Ti.App.Properties.getString('my_default_actions', null));
						if(!my_default_actions){
							var my_default_actions = {
								actions:[],
								checkins:0
							};
						}
						
						my_default_actions.actions = my_default_actions.actions.concat(e.row.user_action_suggestions);
						my_default_actions.actions = _.uniq(my_default_actions.actions);
						
						Ti.App.Properties.setString('my_default_actions', JSON.stringify(my_default_actions));
					}
							
					FriendsModel.add(e.row.user_id, function(addEvent) {
						e.source.remove(act_follow);
						if (addEvent.success) {
							common.refreshHandler.setRefresh.following(true);
							common.refreshHandler.setRefresh.actions(true);
							common.refreshHandler.setRefresh.news(true);
							
							if(e && e.row && e.row.user_action_suggestions){
								var my_carely_actions = Ti.App.Properties.getList('my_carely_actions', []);
								my_carely_actions = _.union(my_carely_actions, e.row.user_action_suggestions);
								Ti.App.Properties.setList('my_carely_actions', my_carely_actions);
								my_carely_actions = null;
							}
							
							e.source.title = 'Following';
							e.source.backgroundImage = theme.buttonImage.green.normal;
							e.source.backgroundSelectedImage = theme.buttonImage.green.selected;
							
							var _following = [];
							if (currentUser && currentUser.custom_fields && currentUser.custom_fields.following) {
								_following = _following.concat(currentUser.custom_fields.following);
							}
							if (_following.indexOf(e.row.user_id) === -1) {
								_following.push(e.row.user_id);

								if (is_express_setup && self.rightNavButton) {
									self.rightNavButton.title = _following.length ? 'Next' : 'Skip';
								}
								
								var UsersModel = require('/lib/model/users');
								UsersModel.update({
									custom_fields : {
										following : _following
									}
								}, function(updateEvent) {
									if (updateEvent.success) {
										currentUser = updateEvent.users[0];
										Ti.App.Properties.setString('carely_user', JSON.stringify(updateEvent.users[0]));

										Model.AppCache.users.set(updateEvent.users[0]);
									} else {
										Model.eventDefaultErrorCallback(updateEvent);
									}
								});
								
								//Ti.App.fireEvent('following.handle', { following: e.row.user_id });
							}

							if (currentUser && currentUser.id && currentUser.id !== e.row.user_id && currentUser.username) {
								var funame = common.getUserDisplayName(currentUser);
								
								Ti.App.fireEvent('push.notify', {
									tags : [e.row.user_id + '_follow'],
									alert : funame + ' started following you!',
									custom_fields : {
										to_user_id : e.row.user_id,
										type : 'follow'
									}
								});
							}

						} else {
							e.source.title = 'Follow';

							Model.eventDefaultCallback(addEvent);
						}
					});
				} else {
					if(is_express_setup){
						addedFollowing[e.row.user_id] = undefined;
						
						addedFollowing.total_following -= 1;
						
						if(self.rightNavButton){
							self.rightNavButton.enabled = addedFollowing.total_following > 0;
						}
					}
					
					require('/lib/analytics').trackEvent({
						category : self.title,
						action : 'unfollow',
						label : e.row.user_id,
						value : e.row.user_action_suggestions ? e.row.user_action_suggestions.length : 0
					});
					
					FriendsModel.remove(e.row.user_id, function(removeEvent) {
						e.source.remove(act_follow);
						if (removeEvent.success) {
							common.refreshHandler.setRefresh.following(true);

							e.source.title = 'Follow';
							e.source.backgroundImage = theme.buttonImage.grey.normal;
							e.source.backgroundSelectedImage = theme.buttonImage.grey.selected;

							var _following = [];
							if (currentUser && currentUser.custom_fields && currentUser.custom_fields.following) {
								_following = _following.concat(currentUser.custom_fields.following);
							}
							var follow_idx = _following.indexOf(e.row.user_id);
							if (_following.length > 0 && follow_idx !== -1) {
								_following.splice(follow_idx, 1);

								if (is_express_setup && self.rightNavButton) {
									self.rightNavButton.title = _following.length ? 'Next' : 'Skip';
								}

								var UsersModel = require('/lib/model/users');
								UsersModel.update({
									custom_fields : {
										following : _following
									}
								}, function(updateEvent) {
									if (updateEvent.success) {
										currentUser = updateEvent.users[0];
										Ti.App.Properties.setString('carely_user', JSON.stringify(updateEvent.users[0]));

										Model.AppCache.users.set(updateEvent.users[0]);
									} else {
										Model.eventDefaultErrorCallback(updateEvent);
									}
								});
							}
							if (currentUser && currentUser.id && currentUser.id !== e.row.user_id && currentUser.username) {
								var funame = common.getUserDisplayName(currentUser);
								
								Ti.App.fireEvent('push.notify', {
									aliases : [e.row.user_id + '_follow'],
									alert : funame + ' stopped following you!',
									custom_fields : {
										to_user_id : e.row.user_id,
										type : 'follow'
									}
								});
							}
						} else {
							e.source.title = 'Follow';

							Model.eventDefaultCallback(removeEvent);
						}
					});
				}
			} else if(!is_express_setup){
				
				require('/lib/analytics').trackEvent({
					category : self.title,
					action : 'show',
					label : e.row.user_id,
					value : e.row.user_action_suggestions ? e.row.user_action_suggestions.length : 0
				});
					
				var UserWindow = require('/ui/UserWindow');
				var userWindow = new UserWindow(e.row.user_id);
				require('/ui/MasterWindow').getNavGroup().open(userWindow);
			}
		}
	}); 

	var _scrolling = false;
	tableView.addEventListener('scroll',function(e){
		if(!_scrolling && search.showCancel){
			search.blur();
		}
		_scrolling = true;
		
		if (_more && _updating === false && _searching === false && (e.contentOffset.y + e.size.height + 100 > e.contentSize.height)) {
			tableView.canRefreshNow = true;
			
			footer_view.height = defaultRowHeight;
		}
	});
	tableView.addEventListener('scrollEnd', function(e) {
		_scrolling = false;
		
		if(e){
			e.cancelBubble = true;
		}
		
		var loading_new_data = 0;
		if(tableView.canRefreshNow){
			tableView.canRefreshNow = false;

			loading_new_data = 1;
				
			fetchTopUsers();
		}
		
		require('/lib/analytics').trackEvent({
			category : self.title,
			action : 'scroll',
			label : 'load data',
			value : loading_new_data
		});
	});
	self.add(tableView);

	function getUsersToFollowByLikes(_force){
		_updating = true;
		
		facebookModule.requestWithGraphPath('me/likes', {
			fields : 'id',
			limit : 100,
			offset : 0
		}, 'GET', function(fbLikesEvent) {
			var fb_likes = [];
			if (fbLikesEvent.success && fbLikesEvent.result) {
				var likes = JSON.parse(fbLikesEvent.result)
				if (likes && likes.data && likes.data.length > 0) {
					for (var i = 0, v = likes.data.length; i < v; i++) {
						if (likes.data[i].id) {
							fb_likes.push(likes.data[i].id);
						}
					}
				}
			}
			
			require('/lib/analytics').trackEvent({
				category : self.title,
				action : 'query',
				label : 'facebook likes',
				value : fb_likes.length
			});
			
			if (fb_likes.length > 0) {
				
				var UsersModel = require('/lib/model/users');
				UsersModel.queryPages({
					influencer_id : { '$in' : fb_likes }
				}, null, 1, 100, function(e) {
					require('/lib/analytics').trackEvent({
						category : self.title,
						action : 'query',
						label : Ti.App.name + ' users by likes',
						value : (e && e.meta) ? e.meta.total_results : 0
					});
					
					if (e.success) {
						if (e.meta && e.meta.total_results > 0) {
							Model.AppCache.users.setMany(e.users);
							
							if(is_express_setup){
								currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
								var user_ids = _.pluck(e.users, 'id');
								if(user_ids && user_ids.length){
									if(currentUser && currentUser.id){
										user_ids = _.without(user_ids, currentUser.id);
									}
									if(currentUser && currentUser.custom_fields){
										if(!currentUser.custom_fields.following){
											currentUser.custom_fields.following = [];
										}
										
										var diff = _.difference(user_ids, currentUser.custom_fields.following),
											all_following = _.union(currentUser.custom_fields.following, user_ids);
										
										currentUser.custom_fields.following = all_following;
										Ti.App.Properties.setString('carely_user', JSON.stringify(currentUser));
										
										if(diff && diff.length){
											require('/lib/analytics').trackEvent({
												category : self.title,
												action : 'follow',
												label : 'auto follow by likes',
												value : diff.length
											});
											
											var FriendsModel = require('/lib/model/friends');
											FriendsModel.add(diff.join(','), function(addFriendsEvent){
												if(addFriendsEvent.success){

													if(e && e.users && e.users.length){
														var my_carely_actions = Ti.App.Properties.getList('my_carely_actions', []);
														for(var i=0,v=e.users.length; i<v; i++){
															if (e.users[i] && e.users[i].custom_fields && e.users[i].custom_fields.suggesting_actions) {
																my_carely_actions = _.union(my_carely_actions, e.users[i].custom_fields.suggesting_actions);
															}
														}
														Ti.App.Properties.setList('my_carely_actions', my_carely_actions);
														my_carely_actions = null;
													}
													
													UsersModel.update({
														custom_fields : {
															following : all_following
														}
													}, function(updateEvent) {
														if (updateEvent.success) {
															common.refreshHandler.setRefresh.following(true);
															common.refreshHandler.setRefresh.actions(true);
															common.refreshHandler.setRefresh.news(true);
															
															currentUser = updateEvent.users[0];
															Ti.App.Properties.setString('carely_user', JSON.stringify(updateEvent.users[0]));
					
															Model.AppCache.users.set(updateEvent.users[0]);
														} else {
															Model.eventDefaultErrorCallback(updateEvent);
														}
													});
													
													//Ti.App.fireEvent('following.handle', { following: diff.join(',') });
												}
												else{
													Model.eventDefaultErrorCallback(addFriendsEvent);
												}
											});
										}
									}
								}
							}
							
							var rows = createUsersRows(e.users);
							if (rows && rows.length) {
								if(suggested_section.rowCount){
									rows = rows.concat(suggested_section.rows);
								}
									
								rows = _.uniq(rows, false, function(u) {
									return u.user_id;
								});
								
								suggested_section.rows = rows;
							}
						}
					}
					else{
						Model.eventDefaultErrorCallback(e);
					}
					
					if(_force){
						endUpdate(true);
						fetchTopUsers();
					}
					else{
						endUpdate();
					}
				});
			} else {
				if(_force){
					endUpdate(true);
					fetchTopUsers();
				}
				else{
					endUpdate();
				}
			}
		});
	}
	
	function endUpdate(_showLoading){
		var rows = [];
		if(suggested_section && suggested_section.rowCount){
			rows.push(suggested_section);
		}
		tableView.setData(rows);
		
		if(_showLoading){
			footer_view.height = defaultRowHeight;
			_updating = true;
		}
		else{
			footer_view.height = 0;
			_updating = false;
			
			require('/lib/analytics').trackEvent({
				category : self.title,
				action : 'load',
				label : 'rows',
				value : rows.length
			});
		}
	}
	
	
	var suggested_section = createUserSection(
		{
			title : (is_suggesters || is_express_setup) ? 'Top Lists (search for more)' : 'People on ' + Ti.App.name
		});

	function handleTopUsersList(){
		_updating = true;
		
		var top_users = Model.AppCache.get('carely_users_first_page');
		if (top_users && top_users.length) {
			Model.AppCache.users.setMany(top_users);
				
			suggested_section.rows = createUsersRows(top_users);
				
			if(is_suggesters){
				endUpdate(true);
				
				fetchTopUsers(true);
			}
			else{
				if(facebookModule.loggedIn){
					endUpdate(true);
					
					getUsersToFollowByLikes(true);
				}
				else{
					endUpdate();
				}
			}
		}
		else{
			endUpdate(true);
				
			fetchTopUsers(true);
		}
	}
	
	var _page = 1, _more = true;
	function fetchTopUsers(_force){
		_updating = true;
		
		footer_view.height = defaultRowHeight;
		
		if(_force){
			_page = 1;
			_more = true;
		}
		
		var _where = null;
		if(is_suggesters){
			_where = {
				suggesting_actions : {$exists : true}
			};
		}
		else{
			_where = {
				importance : {$gt : 0}
			};
		}
		
		var _per_page = 10;
		if(_page === 1 && !is_suggesters){
			_per_page = 20;
		}
		
		var UsersModel = require('/lib/model/users');
		UsersModel.queryPages(_where, '-importance', _page, _per_page, function(e){
			require('/lib/analytics').trackEvent({
				category : self.title,
				action : 'query',
				label : 'top users',
				value : (e && e.meta) ? e.meta.total_results : 0
			});
			
			if(e.success){
				if (e.meta.total_results > 0) {
					// cache items
					Model.AppCache.users.setMany(e.users);
					
					if(_per_page === 20 && e && e.users && e.users.length){
						Model.AppCache.set('carely_users_first_page', e.users.slice(0, 10));
					}
					
					var rows = createUsersRows(e.users, is_suggesters);
					if (rows && rows.length) {
						if (suggested_section.rowCount) {
							rows = suggested_section.rows.concat(rows);
						}
	
						rows = _.uniq(rows, false, function(u) {
							return u.user_id;
						});
	
						suggested_section.rows = rows;
					}
					
					if (e.meta.page < e.meta.total_pages) {
						_page += 1;
					}
					else{
						_more = false;
					}
				}
				else{
					_more = false;
				}
			}
			else{
				Model.eventDefaultErrorCallback(e);
			}
			
			if(_force){
				endUpdate(true);
				getUsersToFollowByLikes();
			}
			else{
				endUpdate();
			}
		});
	}

	handleTopUsersList();
	
	self.addEventListener('focus', function(e){
		if (Ti.App.Properties.getBool('carely_goToHome', false) === true) {
			require('/ui/MasterWindow').getNavGroup().close(this, {
				animated : false
			});
		}
		else{
			require('/lib/analytics').trackScreen({ screenName : self.title });
		}
	});
	return self;	
}
module.exports = FindFriendsWindow;