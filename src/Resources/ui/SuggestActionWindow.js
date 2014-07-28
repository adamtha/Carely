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

	var value_lbl = Ti.UI.createLabel({
		text : _item.value ? _item.value : '',
		right : 6,
		top : 2,
		color : theme.whiteFontColor,
		font : theme.defaultFont,
		textAlign : Ti.UI.TEXT_ALIGNMENT_RIGHT
	});
	section_view.add(value_lbl);
		
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
		Model = require('/lib/model/model'),
		facebookModule = require('facebook');
	
	facebookModule.appid = common.FACEBOOK_APP_ID;
	fb.permissions = common.FACEBOOK_APP_PERMISSIONS;
	fb.forceDialogAuth = false;
		
	var isAndroid = Ti.Platform.osname === 'android';
	var currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
	var actionItem = Model.AppCache.actions.get(params.action_id);
	
	var invite_message = 'Check out the' + Ti.App.name + 'iPhone app for sharing activities';
	if(actionItem && actionItem.name){
		invite_message = 'Try out ' + actionItem.name + ' with the ' + Ti.App.name + ' iPhone app';
	}
	
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
	
	var invite_section = createUserSection({title:'Invite to' + Ti.App.name});
	
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
		tableView.setData([invite_section]);
	});
	search.addEventListener('change', function(e) {
		if(e && e.value && e.value.length){
			if(invite_section && invite_section.rowCount){
				var lowerCaseVal = e.value.toLowerCase();
				var search_rows = _.filter(invite_section.rows, function(q){
					return q.filter.toLowerCase().indexOf(lowerCaseVal) > -1;
				});
				if(search_rows && search_rows.length){
					tableView.setData(search_rows);
				}
			}
		}
		else{
			this.blur();
			tableView.setData([invite_section]);
		}
	});
	self.add(search);
	
	var loading_section = Ti.UI.createTableViewSection({
		headerView:Ti.UI.createView({
			height:0
		})
	});
	
	var loading_row = Titanium.UI.createTableViewRow({
		height:defaultRowHeight,
		backgroundImage:theme.images.rowBox.normal,
		hasChild: false,
		selectionStyle : Ti.UI.iPhone.TableViewCellSelectionStyle.NONE
	});
	loading_section.add(loading_row);
	
	var act_Ind = Titanium.UI.createActivityIndicator({
		left : '45%',
		top : 14,
		height : 'auto',
		width : 'auto',
		style : Titanium.UI.iPhone.ActivityIndicatorStyle.DARK
	});
	act_Ind.show();
	loading_row.add(act_Ind);
	
	var tableView = Ti.UI.createTableView({
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
			else{
				var UserWindow = require('/ui/UserWindow');
				var userWindow = new UserWindow(e.row.user_id);
				require('/ui/MasterWindow').getNavGroup().open(userWindow);
			}
		}
	});
	self.add(tableView);
	
	function getContactFriends(){
		contactsRows = null;
		var all_contacts = Ti.Contacts.getAllPeople();
		if(all_contacts){
			tableView.setData([loading_section]);
			
			var data = [];
			for (var i = 0, v = all_contacts.length; i < v; i++) {
				if(all_contacts[i].fullName && all_contacts[i].phone){
					var mails = null;
					var mails = null,
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
				contactsRows = createInvitationRows(data, null);		
			}
		}
		
		if (contactsRows && contactsRows.length) {
			invite_section.headerView.children[2].text = '' + contactsRows.length;

			if (contactsRows.length > 8) {
				invite_section.rows = contactsRows.slice(0, 8);
				tableView.setData([invite_section]);

				for (var i = 8, v = contactsRows.length; i < v; i++) {
					tableView.appendRow(contactsRows[i], {
						animated : false
					});
				}
				contactsRows = null;
			} else {
				invite_section.rows = contactsRows;
				tableView.setData([invite_section]);
			}
		} else {
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
		
		if (facebookModule.loggedIn) {
			tableView.setData([loading_section]);
			
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
						tableView.setData([invite_section]);

						for (var i = 8, v = fbRows.length; i < v; i++) {
							tableView.appendRow(fbRows[i], {
								animated : false
							});
						}
					} else {
						invite_section.rows = fbRows;
						tableView.setData([invite_section]);
					}
					fbRows = null;
				}
				else{
					invite_section.headerView.children[1].text = 'We could not get any facebook friends';
					invite_section.rows = [];
					tableView.setData([invite_section]);
				}
			});
		}
		else{
			invite_section.headerView.children[1].text = 'We could not get any facebook friends';
			invite_section.rows = [];
			tableView.setData([invite_section]);
		}
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

							var socialModel = require('/lib/model/social'), actIndicator = require('/ui/ActivityIndicator');
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
			label : actionItem ? actionItem.name : null,
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

function SuggestActionWindow(_action_id, _action_name) {
	var _ = require('/lib/underscore'),
		_s = require('/lib/underscore_strings'),
		theme = require('/ui/theme'), 
		ui = require('/ui/components'),
		moment = require('/lib/date/moment'),
		common = require('/lib/common'),
		Model = require('/lib/model/model')
		FriendsModel = require('/lib/model/friends');
	
	var isAndroid = Ti.Platform.osname === 'android';
	var currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));

	var self = Ti.UI.createWindow({
		title : 'Suggest activity',
		barColor:theme.barColor,
		navBarHidden : isAndroid,
		backgroundColor: theme.defaultBgColor,
		orientationModes : [Ti.UI.PORTRAIT],
		layout:'vertical'
	});
	
	var suggest_btn = Ti.UI.createButton({
		title:'Send',
		enabled:false
	});
	var to_users = [], indicator = null;
	var actIndicator = require('/ui/ActivityIndicator');
	var indicator = new actIndicator();
	suggest_btn.addEventListener('click', function(e){
		indicator.showModal('Sending suggestion...', 60000, 'Timeout sending suggestion!');
		
		if(all_followers_selected){
			getAllFollowers(1);
			
			currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
			if (all_future_followers_row.rightImage && currentUser && currentUser.custom_fields) {
				var _suggesting_actions = [];
				if (currentUser.custom_fields.suggesting_actions && currentUser.custom_fields.suggesting_actions.length) {
					_suggesting_actions = currentUser.custom_fields.suggesting_actions;
				}
				if (_suggesting_actions.indexOf(_action_id) === -1) {
					_suggesting_actions.push(_action_id);
					
					currentUser.custom_fields.suggesting_actions = _suggesting_actions;
					Ti.App.Properties.setString('carely_user', JSON.stringify(currentUser));
		
					var UsersModel = require('/lib/model/users');
					UsersModel.update({
						custom_fields : {
							suggesting_actions : _suggesting_actions
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
			}
		}
		else{
			sendSuggestion();
		}
		
		require('/lib/analytics').trackEvent({
			category : 'suggestion',
			action : 'send',
			label : _action_id,
			value : all_followers_selected ? 1 : 0
		});
	});
	self.rightNavButton = suggest_btn;
	
	function getAllFollowers(_cur_page){
		if(_cur_page === 1){
			to_users = [];
		}
		FriendsModel.search(currentUser.id, true, null, _cur_page, 100, function(e){
			if(e.success){
				if(e.meta && e.meta.total_results){
					for(var i=0, v=e.users.length; i<v; i++){
						to_users.push(e.users[i].id);
					}
					if (e.meta.page < e.meta.total_pages) {
						_cur_page += 1;
						getAllFollowers(_cur_page);
					} else {
						// finished with all users
						sendSuggestion();
					}				
				}
				else{
					// has no followers
					to_users = null;
					sendSuggestion();
					indicator.hideModal();
				}
			}
			else{
				indicator.hideModal();
				Model.eventDefaultCallback(e);
			}
		});
	}
	
	function sendSuggestion(){
		if(_action_id && currentUser && currentUser.id && to_users && to_users.length){
			var ObjectsModel = require('/lib/model/objects');
			ObjectsModel.query(ObjectsModel.classNames.suggestions, {
				'[ACS_User]from_id' : currentUser.id,
				'[ACS_Event]action_id' : _action_id
			}, null, 1, 0, function(queryEvent) {
				if (queryEvent.success) {
					var update_params = {
						'[ACS_User]from_id' : currentUser.id,
						'[ACS_Event]action_id' : _action_id
					};
					// update status: 0-new, 1-seen, 2-deleted
					for(var i=0, v=to_users.length; i<v; i++){
						update_params[to_users[i]] = 0;
					}
					
					if (queryEvent[ObjectsModel.classNames.suggestions] && queryEvent[ObjectsModel.classNames.suggestions].length) {
						// update suggestion
						ObjectsModel.update(ObjectsModel.classNames.suggestions, queryEvent[ObjectsModel.classNames.suggestions][0].id, update_params, null, null, function(updateEvent) {
							indicator.hideModal();
							if (updateEvent.success) {
								
								common.showMessageWindow('Activity suggested successfully', 200, 200, 3000);
								
								if (currentUser && currentUser.id && currentUser.username) {
									var funame = common.getUserDisplayName(currentUser);
									
									Ti.App.fireEvent('push.notify', {
										aliases : to_users,
										alert : funame + ' suggested an activity: ' + _action_name,
										custom_fields : {
											suggestion_id : updateEvent[ObjectsModel.classNames.suggestions][0].id,
											to_user_id : to_users.join(','),
											type : 'suggest'
										}
									});
								}
								require('/ui/MasterWindow').getNavGroup().close(self, { animated : true });
							} else {
								Model.eventDefaultErrorCallback(updateEvent);
							}
						}); 

					} else {
						// create new suggestion
						ObjectsModel.create(ObjectsModel.classNames.suggestions, update_params, 'actions_acl', null, function(createEvent) {
							indicator.hideModal();
							if (createEvent.success) {
								common.showMessageWindow('Activity suggested successfully', 200, 200, 3000);
								
								if (currentUser && currentUser.id && currentUser.username) {
									var funame = common.getUserDisplayName(currentUser);
									
									Ti.App.fireEvent('push.notify', {
										aliases : to_users,
										alert : funame + ' suggested an activity: ' + _action_name,
										custom_fields : {
											suggestion_id : createEvent[ObjectsModel.classNames.suggestions][0].id,
											to_user_id : to_users.join(','),
											type : 'suggest'
										}
									});
								}
								require('/ui/MasterWindow').getNavGroup().close(self, { animated : true });
							} else {
								Model.eventDefaultErrorCallback(createEvent);
							}
						});
					}
				} else {
					indicator.hideModal();
					Model.eventDefaultErrorCallback(queryEvent);
				}
			});
		}
		else{
			common.showMessageWindow('Activity suggested successfully', 200, 200, 3000);
			require('/ui/MasterWindow').getNavGroup().close(self, { animated : true });
		}
	}
	
	var defaultRowHeight = theme.borderedImage.user.height + 16, _updating = false, _searching = false;
	var header_view = Ti.UI.createView({
		height:Ti.UI.SIZE,
		width:Ti.UI.FILL,
		layout:'vertical'
	});

	var search = Ti.UI.createSearchBar({
		barColor: theme.barColor,
		hintText:'Search followers'
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
		header_content_view.height = Ti.UI.SIZE;
		tableView.setData([all_followers_section, followers_section]);
		_searching = false;
	});
	search.addEventListener('change', function(e) {
		if(e && e.value && e.value.length && followers_section && followers_section.rowCount){
			var lowerCaseVal = e.value.toLowerCase();
			var search_rows = _.filter(followers_section.rows, function(q){
				return q.filter.toLowerCase().indexOf(lowerCaseVal) > -1;
			});
			var search_section = null;
			if(search_rows && search_rows.length){
				search_section = createUserSection({ title:'Search results for \'' + e.value + '\'' });
				search_section.rows = search_rows;
			}
			else{
				search_section = createUserSection({ title:'No results for \'' + e.value + '\'' });
			}
			header_content_view.height = 0;
			tableView.setData([search_section]);
			_searching = true;
		}
		else{
			this.blur();
			header_content_view.height = Ti.UI.SIZE;
			tableView.setData([all_followers_section, followers_section]);
			_searching = false;
		}
	});
	header_view.add(search);
	
	var header_content_view = Ti.UI.createView({
		height:Ti.UI.SIZE,
		width:Ti.UI.FILL,
		layout:'vertical'
	});
	header_view.add(header_content_view);
	
	var contacts_view = createHeaderItem({icon:theme.images.contacts, title:'Contacts', caption:'Suggest to friends from your contacts', clickName:'contacts'}),
		facebook_view = createHeaderItem({icon:theme.images.social.facebook.friends, title:'Facebook', caption:'Suggest to friends from Facebook', clickName:'facebook'});
	
	contacts_view.addEventListener('singletap', function(e){
		if(search.showCancel){
			search.blur();
		}
		var inviteFriendsWindow = new InviteFriendsWindow({contacts:true, action_id:_action_id});
		require('/ui/MasterWindow').getNavGroup().open(inviteFriendsWindow);
		
		require('/lib/analytics').trackEvent({
			category : 'contacts header',
			action : 'click',
			label : 'contacts',
			value : null
		});
	});
	header_content_view.add(contacts_view);
	
	facebook_view.addEventListener('singletap', function(e){
		if(search.showCancel){
			search.blur();
		}
		var inviteFriendsWindow = new InviteFriendsWindow({facebook:true, action_id:_action_id});
		require('/ui/MasterWindow').getNavGroup().open(inviteFriendsWindow);
		
		require('/lib/analytics').trackEvent({
			category : 'contacts header',
			action : 'click',
			label : 'facebook',
			value : null
		});
	});
	header_content_view.add(facebook_view);
	
	function createAllFollowersRow(_item){
		var row = Ti.UI.createTableViewRow({
			height: defaultRowHeight,
			width : Ti.UI.FILL,
			backgroundImage:theme.images.rowBox.normal,
			selectionStyle:Ti.UI.iPhone.TableViewCellSelectionStyle.NONE,
			all_followers : _item.all_followers,
			className : 'All_Followers_Row'
		});
		
		var row_view = Ti.UI.createView({
			height : Ti.UI.FILL,
			width : Ti.UI.FILL
		});
		row.add(row_view);

		var icon = new ui.ImageViewBordered(_item.icon, {
			width : theme.borderedImage.user.width,
			height : theme.borderedImage.user.height,
			left : 8,
			top : 8,
			bottom : 8
		});
		row_view.add(icon);

		var row_title = Ti.UI.createLabel({
			top : 5,
			left : icon.left + icon.width + 6,
			text : _item.title,
			font : theme.defaultToolTipFontBold,
			color : theme.textColor,
			textAlign : Ti.UI.TEXT_ALIGNMENT_LEFT
		});
		row_view.add(row_title); 
		
		if(_item.subtitle){
			var row_subtitle = Ti.UI.createLabel({
				bottom : 5,
				left : icon.left + icon.width + 6,
				text : _item.subtitle,
				font : {
					fontSize : 12,
					fontFamily : theme.fontFamily
				},
				color : theme.lightFontColor,
				textAlign : Ti.UI.TEXT_ALIGNMENT_LEFT
			}); 
			row_view.add(row_subtitle);
		}
		
		return row;
	}
	
	var all_followers_section = createUserSection({ title:'Suggest to ALL followers' });
	var all_followers_selected = false,
		all_followers_row = createAllFollowersRow({
			icon:theme.images.followers.current,
			title:'One time suggestion',
			subtitle:'Suggest to all current followers',
			all_followers:'current'
		}),
	    all_future_followers_row = createAllFollowersRow({
			icon:theme.images.followers.future,
			title:'Permanent suggestion',
			subtitle:'Suggest to all current and future followers',
			all_followers:'current_future'
		});
	
	if(currentUser && currentUser.custom_fields && currentUser.custom_fields.suggesting_actions && 
		currentUser.custom_fields.suggesting_actions.length &&
		currentUser.custom_fields.suggesting_actions.indexOf(_action_id) > -1){
			all_future_followers_row.rightImage = theme.images.check_arrow.black;
			all_followers_selected = true;
	}
	search.touchEnabled = !all_followers_selected;
	suggest_btn.enabled = all_followers_selected;
	all_followers_section.rows = [all_followers_row, all_future_followers_row];
		
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
					height: defaultRowHeight,
					width : Ti.UI.FILL,
					filter : uname,
					backgroundImage:theme.images.rowBox.normal,
					selectionStyle:Ti.UI.iPhone.TableViewCellSelectionStyle.NONE,
					clickable : true,
					className : 'Users_Row'
				});
				
				if(all_followers_selected){
					row.clickable = false;
					row.rightImage = theme.images.check_arrow.grey;
				}
				
				var row_view = Ti.UI.createView({
					height:Ti.UI.FILL,
					width:Ti.UI.FILL
				});
				row.add(row_view);
				
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
		return rows;
	}
	
	var loading_section = Ti.UI.createTableViewSection({
		headerView:Ti.UI.createView({
			height:0
		})
	});
	
	var loading_row = Titanium.UI.createTableViewRow({
		height:defaultRowHeight,
		backgroundImage:theme.images.rowBox.normal,
		hasChild: false,
		selectionStyle : Ti.UI.iPhone.TableViewCellSelectionStyle.NONE
	});
	loading_section.add(loading_row);
	
	var act_Ind = Titanium.UI.createActivityIndicator({
		left : '45%',
		top : 14,
		height : 'auto',
		width : 'auto',
		style : Titanium.UI.iPhone.ActivityIndicatorStyle.DARK
	});
	act_Ind.show();
	loading_row.add(act_Ind);
	
	var followers_section = createUserSection({ title:'Select followers' });
	
	var tableView = Ti.UI.createTableView({
		data : [all_followers_section, followers_section],
		top : 0,
		left : 0,
		right : 0,
		headerView:header_view,
		width : Ti.UI.FILL,
		style:Ti.UI.iPhone.TableViewStyle.PLAIN,
		separatorStyle:Ti.UI.iPhone.TableViewSeparatorStyle.NONE,
		footerView : Ti.UI.createView({height:0}),
		bubbleParent:false,
		canRefreshNow:false
	});
	tableView.addEventListener('singletap', function(e) {
		if(_updating){
			return false;
		}
		
		if(search.showCancel){
			search.blur();
		}
		
		var _item_click_header = null, _item_clicked = null;
		if (e && e.row) {
			if(e.row.user_id && e.row.clickable){
				_item_click_header = 'single user';
				
				e.row.rightImage = e.row.rightImage ? undefined : theme.images.check_arrow.black;
							
				var idx = to_users.indexOf(e.row.user_id);
				if(e.row.rightImage){
					if(idx === -1){
						to_users.push(e.row.user_id);
						
						_item_clicked = 1;
					}
				}
				else{
					if(idx > -1){
						to_users.splice(idx, 1);
						
						_item_clicked = 0;
					}
				}
				
				suggest_btn.enabled = to_users.length > 0;				
			}
			else if(e.row.all_followers){
				to_users = [];
				if(e.row.all_followers === 'current'){
					_item_click_header = 'current followers';
					_item_clicked = e.row.rightImage ? 0 : 1;
					
					e.row.rightImage = e.row.rightImage ? undefined : theme.images.check_arrow.black;
					all_future_followers_row.rightImage = undefined;
				}
				else if(e.row.all_followers === 'current_future'){
					_item_click_header = 'current and future followers';
					_item_clicked = e.row.rightImage ? 0 : 1;
					
					e.row.rightImage = e.row.rightImage ? undefined : theme.images.check_arrow.black;
					all_followers_row.rightImage = undefined;
					
					if(!e.row.rightImage){
						currentUser = JSON.parse(Ti.App.Properties.getString('carely_user', null));
						if (currentUser && currentUser.custom_fields) {
							var _suggesting_actions = [];
							if (currentUser.custom_fields.suggesting_actions && currentUser.custom_fields.suggesting_actions.length) {
								_suggesting_actions = currentUser.custom_fields.suggesting_actions;
							}
							if (_suggesting_actions.indexOf(_action_id) > -1) {
								_suggesting_actions.splice(idx, 1);
								
								currentUser.custom_fields.suggesting_actions = _suggesting_actions;
								Ti.App.Properties.setString('carely_user', JSON.stringify(currentUser));
					
								var UsersModel = require('/lib/model/users');
								UsersModel.update({
									custom_fields : {
										suggesting_actions : _suggesting_actions
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
						}
					}
				}
				
				var followers_setting = {
					rightImage : e.row.rightImage ? theme.images.check_arrow.grey : undefined,
					clickable : e.row.rightImage ? false : true
				}
				
				all_followers_selected = !followers_setting.clickable;
				search.touchEnabled = !all_followers_selected;
				
				for(var i=0, v=followers_section.rowCount; i<v; i++){
					followers_section.rows[i].rightImage = followers_setting.rightImage;
					followers_section.rows[i].clickable = followers_setting.clickable;
				}
				
				suggest_btn.enabled = all_followers_selected;
			}
		}
		
		require('/lib/analytics').trackEvent({
			category : 'suggestion',
			action : 'table',
			label : _item_click_header,
			value : _item_clicked
		});
	});
	
	var _scrolling = false;
	tableView.addEventListener('scroll',function(e){
		if(all_followers_selected){
			return false;
		}
		if(!_scrolling && search.showCancel){
			search.blur();
		}
		if (_more && _updating === false && _searching === false && (e.contentOffset.y + e.size.height + 100 > e.contentSize.height)) {
			tableView.canRefreshNow = true;
			
			tableView.appendSection(loading_section, {animated:false});
		}
		_scrolling = true;
	});
	tableView.addEventListener('scrollEnd', function(e) {
		_scrolling = false;
		
		var loading_new_data = 0;
		if(tableView.canRefreshNow){
			tableView.canRefreshNow = false;
			
			queryFollowers();
		}

		require('/lib/analytics').trackEvent({
			category : self.title,
			action : 'scroll',
			label : 'load data',
			value : loading_new_data
		});
	});
	self.add(tableView);
	
	var _more = true, _page = 1;
	function queryFollowers() {
		if(_updating){
			return false;
		}
		if(!_more){
			return false;
		}
		_updating = true;
		
		//tableView.appendSection(loading_section, {animated:false});
		
		var first_results = _page === 1;
		FriendsModel.search(currentUser.id, true, null, _page, 10, function(e){
			var newRows = null, _total_followers = 0;
			if(e.success){
				if(e.meta && e.meta.total_results){
					_total_followers = e.meta.total_results;
					
					if (e.meta.page < e.meta.total_pages) {
						_page += 1;
					}
					else{
						_more = false;
					}
					
					Model.AppCache.users.setMany(e.users);
					newRows = createUsersRows(e.users);					
				}
			}
			else{
				Model.eventDefaultCallback(e);
			}
			
			if (newRows && newRows.length) {
				followers_section.headerView.children[1].text = 'Suggest to SELECTED followers';
				followers_section.headerView.children[2].text = '' + _total_followers;
				
				if (first_results) {
					followers_section.rows = newRows;
				} else {
					if (followers_section.rowCount) {
						followers_section.rows = followers_section.rows.concat(newRows);
					} else {
						followers_section.rows = newRows;
					}
				}
				newRows = null;
			}
			else{
				followers_section.headerView.children[1].text = 'You have no followers';
				followers_section.headerView.children[2].text = '';
			}
			tableView.setData([all_followers_section, followers_section]);
			_updating = false;
		});
	}
	
	self.addEventListener('open', function(e){
		if (Ti.App.Properties.getBool('carely_goToHome', false) === true) {
			require('/ui/MasterWindow').getNavGroup().close(this, {
				animated : false
			});
		}
		else{
			queryFollowers();
		}
	});
	
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
module.exports = SuggestActionWindow;