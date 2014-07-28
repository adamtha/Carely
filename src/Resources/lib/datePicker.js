exports.expirationDatePicker = function(params){
	var theme = require('/ui/theme'),
		moment = require('/lib/date/moment');
		
	var isAndroid = Ti.Platform.osname === 'android';
	
	var date_value = new Date();
	if(params && params.row && params.row.expiration_date && params.row.expiration_date.value){
		date_value = new Date(params.row.expiration_date.value);
	}
	
	var self = Ti.UI.createWindow({
		title: (params && params.title) ? params.title : 'Set expiration date',
		navBarHidden:isAndroid,
		backgroundColor:theme.winBgColor,
		orientationModes : [Ti.UI.PORTRAIT]
	});
	
	if(isAndroid){
		
	}
	else{
		self.barColor = theme.barColor;
	}
	
	var expire_view = Titanium.UI.createView({
		top:10,
		left: 10,
		right:10,
		backgroundColor : theme.tableBackgroundColor,
		height : theme.tableDefaultHeight,
		borderColor : theme.tableBorderColor,
		borderRadius : theme.defaultBorderRadius
	});
	self.add(expire_view);
	
	var expire_name = Ti.UI.createLabel({
		text : 'Set Expiration date',
		color : theme.textColor,
		top : 10,
		left : 10,
		font : theme.defaultFontBold
	});
	expire_view.add(expire_name);
	
	var expire_bool = Ti.UI.createSwitch({
		right : 10,
		value : false,
		style : isAndroid ? Ti.UI.Android.SWITCH_STYLE_CHECKBOX : null
	});
	expire_bool.addEventListener('change', function(e){
		slide_view.animate(e.value ? slideIn : slideOut);
	});
	expire_view.add(expire_bool);
	
	var slideIn = Ti.UI.createAnimation({
		bottom : 0
	});
	var slideOut = Ti.UI.createAnimation({
		bottom : -226
	});
	
	var slide_view = Ti.UI.createView({
		height : 226,
		bottom : -226
	});
	self.add(slide_view); 
	
	var min_date = new Date();
	min_date.setHours(min_date.getHours() + 1);
	
	var date_picker = Ti.UI.createPicker({
		type : Ti.UI.PICKER_TYPE_DATE,
		top:10,
		selectionIndicator:true,
		minDate:min_date,
		minuteInterval:5,
		value:date_value
	});
	date_picker.addEventListener('change', function(e){
		date_value = e.value;
	});
	slide_view.add(date_picker);
	
	self.addEventListener('open', function(e){
		if(params && params.row && params.row.expiration_date && params.row.expiration_date.value){
			expire_bool.setValue(true);
		}
	});
	self.addEventListener('close', function(e){
		if (params && params.row) {
			if (expire_bool.value) {
				
				date_value = moment(date_value).eod().toDate();
				
				params.row.expiration_date = {
					value : date_value,
					text : moment(date_value).format('MMMM DD, YYYY')
				};
				
				//params.row.children[0].font = theme.defaultToolTipFontBold;
				params.row.children[0].text = 'Expires';
				//params.row.children[1].font = theme.defaultToolTipFontBold;
				params.row.children[1].text = params.row.expiration_date.text;
			} else {
				params.row.expiration_date = undefined;
				params.row.children[0].font = theme.defaultFontBold;
				params.row.children[0].text = L('expiration_date');
				params.row.children[1].font = theme.defaultFontBold;
				params.row.children[1].text = 'Select';
			}
		}
	});
	
	return self;
}

exports.datePicker1 = function(params){
	var _ = require('/lib/underscore'),
		theme = require('/ui/theme'), 
		ui = require('/ui/components'),
		moment = require('/lib/date/moment');

	var isAndroid = Ti.Platform.osname === 'android';
	
	var self = Ti.UI.createWindow({
		title:params.title,
		navBarHidden:isAndroid,
		backgroundColor:theme.winBgColor,
		orientationModes : [Ti.UI.PORTRAIT]
	});
	
	if(isAndroid){
		
	}
	else{
		self.barColor = theme.barColor;
		
		var doneButton = Ti.UI.createButton({
			title:L('done', 'Done')
		});
		doneButton.addEventListener('click', function(e){
			if(params.row){
				params.row.expiration_date = {
					starts:startDate,
					ends:endDate,
					all_day:full_day,
					text_value:date_table.data[0].rows[0].children[1].text + '\n' + date_table.data[0].rows[1].children[1].text
				};
				
				params.row.children[0].font = theme.defaultToolTipFontBold;
				params.row.children[0].text = 'Starts\nEnds';
				params.row.children[1].font = theme.defaultToolTipFontBold;
				params.row.children[1].text = params.row.expiration_date.text_value;
			}
			require('/ui/MasterWindow').getNavGroup().close(self);
		});
		self.rightNavButton = doneButton;
	}
	
	var full_day = false;
	if(params.row && params.row.expiration_date && params.row.expiration_date.all_day){
		full_day = params.row.expiration_date.all_day;
	}	
	function formatDate(_date, _format){
		var date_txt = '';
		if(_date){
			if(full_day){
				date_txt = moment(_date).format('dd, MM Do YYYY');
			}
			else if(_format){
				date_txt = moment(_date).format(_format);
			}
			else{
				date_txt = moment(_date).format('dd, MM Do YYYY, hh:mm');
			}
		}
		return date_txt;
	}

	function createDateRow(_item) {
		var row = Titanium.UI.createTableViewRow({
			selectionStyle:Ti.UI.iPhone.TableViewCellSelectionStyle.NONE,
			backgroundColor:theme.tableBackgroundColor,
			height : theme.tableDefaultHeight,
			date_name : _item.name,
			date_value : _item.value,
			date_format : _item.format,
			clickName: _item.clickName,
			className : 'Date_Row'
		});
		
		var date_name = Ti.UI.createLabel({
			text : _item.name,
			color : theme.textColor,
			top : 10,
			left : 10,
			font : theme.defaultFontBold
		});
		row.add(date_name); 

		var date_val = null;
		switch(_item.type) {
			case 'bool':
				date_val = Ti.UI.createSwitch({
					right : 10,
					value : _item.value ? _item.value : false,
					style : isAndroid ? Ti.UI.Android.SWITCH_STYLE_CHECKBOX : null
				});
				break;
			case 'label':
				date_val = Ti.UI.createLabel({
					text : formatDate(_item.value, _item.format),
					color : theme.tableSelectedValueColor,
					top : 10,
					right : 10,
					font : _item.font ? _item.font : theme.defaultFontBold,
					textAlign : Ti.UI.TEXT_ALIGNMENT_RIGHT,
					width:Ti.UI.FILL
				});
			default:
				break;
		}
		if(date_val !== null){
			row.add(date_val);
			if (_item.callback && _item.callback.name && _item.callback.func) {
				date_val.addEventListener(_item.callback.name, _item.callback.func);
			}
		}

		return row;
	}

	var date_rows = [];
	var selected_row = null, startDate = new Date(), endDate = new Date();
	if(params.row && params.row.expiration_date && params.row.expiration_date.starts){
		startDate = params.row.expiration_date.starts;
	}
	if(params.row && params.row.expiration_date && params.row.expiration_date.ends){
		endDate = params.row.expiration_date.ends;
	}
	else{
		endDate.setHours(endDate.getHours() + 1);
	}
	var startsRow = createDateRow({
		name:L('starts'),
		clickName:'date_start',
		type:'label',
		font:theme.defaultToolTipFontBold,
		value:startDate
	});
	date_rows.push(startsRow);
	
	var EndsRow = createDateRow({
		name:L('ends'),
		clickName:'date_end',
		type:'label',
		font:theme.defaultToolTipFontBold,
		value:endDate,
		format:'hh:mm'
	});
	date_rows.push(EndsRow);
	
	var allDayRow = createDateRow({
		name:L('all_day'),
		type:'bool',
		value:full_day,
		callback:{
			name:'change',
			func:function(e){
				full_day = e.value;
				if(e.value === true){
					date_picker.setType(Ti.UI.PICKER_TYPE_DATE);
				}
				else{
					date_picker.setType(Ti.UI.PICKER_TYPE_DATE_AND_TIME);
				}
				for(var i=0, v=2; i<v; i++){
					switch(selected_row.clickName){
						case 'date_start':
							date_table.data[0].rows[i].children[1].text = formatDate(date_table.data[0].rows[i].date_value, date_table.data[0].rows[i].date_format);
							break;
						case 'date_end':
							if(startDate){
								if(startDate.getFullYear() === date_table.data[0].rows[i].date_value.getFullYear() && 
								   startDate.getMonth() === date_table.data[0].rows[i].date_value.getMonth() && 
								   startDate.getDate() === date_table.data[0].rows[i].date_value.getDate()){
								   	date_table.data[0].rows[i].children[1].text = formatDate(date_table.data[0].rows[i].date_value, date_table.data[0].rows[i].date_format);
								}
								else{
									date_table.data[0].rows[i].children[1].text = formatDate(date_table.data[0].rows[i].date_value);
								}
							}
							else{
								date_table.data[0].rows[i].children[1].text = formatDate(date_table.data[0].rows[i].date_value, date_table.data[0].rows[i].date_format);
							}
							break;
						default:
							break;
					}
				}
			}
		}
	});
	date_rows.push(allDayRow);
	
	var date_table = Ti.UI.createTableView({
		top : 10,
		data:date_rows,
		borderColor : theme.tableBorderColor,
		borderRadius : theme.defaultBorderRadius,
		scrollable: false,
		left: 10,
		right:10,
		backgroundColor:theme.tableBackgroundColor,
		height: date_rows.length * theme.tableDefaultHeight
	});
	self.add(date_table);

	date_table.addEventListener('click', function(e){
		if(e && e.row.clickName){
			switch(e.row.clickName){
				case 'date_start':
					date_picker.setMinDate(new Date());
					break;
				case 'date_end':
					date_picker.setMinDate(startDate);
					break;
				default:
					break;
			}
			if (selected_row !== null && selected_row !== e.row) {
				selected_row.backgroundColor = theme.tableBackgroundColor;
			}
			e.row.backgroundColor = theme.lightBlueFontColor;
			selected_row = e.row;
			date_picker.setValue(e.row.date_value); 
		}
	});
	
	var date_picker = Ti.UI.createPicker({
		type : full_day ? Ti.UI.PICKER_TYPE_DATE : Ti.UI.PICKER_TYPE_DATE_AND_TIME,
		bottom : 56,
		selectionIndicator:true
	});
	self.add(date_picker);
	date_picker.addEventListener('change', function(e) {
		if(selected_row !== null){
			selected_row.date_value = e.value;
			switch(selected_row.clickName){
				case 'date_start':
					startDate = e.value;
					selected_row.children[1].text = formatDate(selected_row.date_value, selected_row.date_format);
					break;
				case 'date_end':
					endDate = e.value;
					if(startDate){
						if(startDate.getFullYear() === e.value.getFullYear() && 
						   startDate.getMonth() === e.value.getMonth() && 
						   startDate.getDate() === e.value.getDate()){
							selected_row.children[1].text = formatDate(selected_row.date_value, selected_row.date_format);
						}
						else{
							selected_row.children[1].text = formatDate(selected_row.date_value);
						}
					}
					else{
						selected_row.children[1].text = formatDate(selected_row.date_value, selected_row.date_format);
					}
					break;
				default:
					break;
			}
		}
	});
	
	var date_clear_button = new ui.Button({
		title : L('delete').toUpperCase(),
		font : theme.defaultFontBold,
		width : 200,
		height : 40,
		bottom : 10,
		left : 60,
		borderRadius : theme.defaultBorderRadius,
		backgroundGradient : theme.backgroundGradient.red,
		style : isAndroid ? null : Ti.UI.iPhone.SystemButtonStyle.PLAIN
	});
	self.add(date_clear_button);
	date_clear_button.addEventListener('click', function(e) {
		if(params.row){
			params.row.expiration_date = undefined;
			params.row.children[0].font = theme.defaultFontBold;
			params.row.children[0].text = 'Expiration date';
			params.row.children[1].font = theme.defaultFontBold;
			params.row.children[1].text = 'Select';
		}
		require('/ui/MasterWindow').getNavGroup().close(self);
	}); 

	date_table.fireEvent('click', {row:date_table.data[0].rows[0]});
	
	return self;
}

exports.datePicker = function(params){
	var _ = require('/lib/underscore'),
		theme = require('/ui/theme'), 
		ui = require('/ui/components'),
		moment = require('/lib/date/moment');

	var isAndroid = Ti.Platform.osname === 'android';
	
	var self = Ti.UI.createWindow({
		title:params.title,
		navBarHidden:isAndroid,
		backgroundColor:theme.winBgColor,
		orientationModes : [Ti.UI.PORTRAIT]
	});
	
	if(isAndroid){
		
	}
	else{
		self.barColor = theme.barColor;
	}
	
	var full_day = false;
	if(params.row && params.row.upcoming_date && params.row.upcoming_date.all_day){
		full_day = params.row.upcoming_date.all_day;
	}	
	function formatDate(_date, _format){
		var date_txt = '';
		if(_date){
			if(full_day){
				date_txt = moment(_date).format('ddd, MMM D');
			}
			else if(_format){
				date_txt = moment(_date).format(_format);
			}
			else{
				date_txt = moment(_date).format('ddd, MMM D, h:mm A');
			}
		}
		return date_txt;
	}

	function createDateRow(_item) {
		var row = Titanium.UI.createTableViewRow({
			selectionStyle:Ti.UI.iPhone.TableViewCellSelectionStyle.NONE,
			backgroundColor:theme.tableBackgroundColor,
			height : theme.tableDefaultHeight,
			date_name : _item.name,
			date_value : _item.value,
			date_format : _item.format,
			clickName: _item.clickName,
			header : _item.header,
			className : 'Date_Row'
		});
		
		var date_name = Ti.UI.createLabel({
			text : _item.name,
			color : theme.textColor,
			top : 10,
			left : 10,
			font : theme.defaultFontBold
		});
		row.add(date_name); 

		var date_val = null;
		switch(_item.type) {
			case 'bool':
				date_val = Ti.UI.createSwitch({
					right : 10,
					value : _item.value ? _item.value : false,
					style : isAndroid ? Ti.UI.Android.SWITCH_STYLE_CHECKBOX : null
				});
				break;
			case 'label':
				date_val = Ti.UI.createLabel({
					text : formatDate(_item.value, _item.format),
					color : theme.tableSelectedValueColor,
					top : 10,
					right : 10,
					font : theme.defaultFont,
					textAlign : Ti.UI.TEXT_ALIGNMENT_RIGHT,
					width:Ti.UI.FILL
				});
			default:
				break;
		}
		if(date_val !== null){
			row.add(date_val);
			if (_item.callback && _item.callback.name && _item.callback.func) {
				date_val.addEventListener(_item.callback.name, _item.callback.func);
			}
		}

		return row;
	}

	var upcoming_action_view = Titanium.UI.createView({
		top : theme.defaultItemSpacing,
		left : 10,
		right : 10,
		backgroundColor : theme.tableBackgroundColor,
		height : theme.tableDefaultHeight,
		borderColor : theme.tableBorderColor,
		borderRadius : theme.defaultBorderRadius
	});
	if(params && params.avoid_empty){
		upcoming_action_view.visible = false;
	}
	else{
		upcoming_action_view.visible = true;
		self.add(upcoming_action_view);
	}
	
	var upcoming_action_name = Ti.UI.createLabel({
		text : 'Upcoming activity',
		color : theme.textColor,
		top : 10,
		left : 10,
		font : theme.defaultFontBold
	});
	upcoming_action_view.add(upcoming_action_name);
	
	var upcoming_action_bool = Ti.UI.createSwitch({
		right : 10,
		value : true,
		style : isAndroid ? Ti.UI.Android.SWITCH_STYLE_CHECKBOX : null
	});
	upcoming_action_bool.addEventListener('change', function(e){
		if (e.value === true) {
			date_table.height = 3 * theme.tableDefaultHeight;
			slide_view.animate(slideIn);
			date_table.fireEvent('click', {
				row : date_table.data[0].rows[0]
			});
		} else {
			date_table.height = 0;
			slide_view.animate(slideOut);
		}
	});
	upcoming_action_view.add(upcoming_action_bool);
	
	var selected_row = null, startDate = new Date(), endDate = new Date();
	if(params.row && params.row.upcoming_date && params.row.upcoming_date.starts){
		startDate = new Date(params.row.upcoming_date.starts);
	}
	if(params.row && params.row.upcoming_date && params.row.upcoming_date.ends){
		endDate = new Date(params.row.upcoming_date.ends);
	}
	else{
		endDate.setHours(endDate.getHours() + 1);
	}
	var startsRow = createDateRow({
		name:L('starts'),
		clickName:'date_start',
		type:'label',
		font:theme.defaultToolTipFontBold,
		value:startDate
	});
	
	var EndsRow = createDateRow({
		name:L('ends'),
		clickName:'date_end',
		type:'label',
		font:theme.defaultToolTipFontBold,
		value:endDate
		//format:'hh:mm'
	});
	
	var allDayRow = createDateRow({
		name:L('all_day'),
		type:'bool',
		value:full_day,
		callback:{
			name:'change',
			func:function(e){
				full_day = e.value;
				if(e.value === true){
					date_picker.setType(Ti.UI.PICKER_TYPE_DATE);
				}
				else{
					date_picker.setType(Ti.UI.PICKER_TYPE_DATE_AND_TIME);
				}
				for(var i=0, v=2; i<v; i++){
					switch(selected_row.clickName){
						case 'date_start':
							date_table.data[0].rows[i].children[1].text = formatDate(date_table.data[0].rows[i].date_value, date_table.data[0].rows[i].date_format);
							break;
						case 'date_end':
							if(startDate){
								if(startDate.getFullYear() === date_table.data[0].rows[i].date_value.getFullYear() && 
								   startDate.getMonth() === date_table.data[0].rows[i].date_value.getMonth() && 
								   startDate.getDate() === date_table.data[0].rows[i].date_value.getDate()){
								   	date_table.data[0].rows[i].children[1].text = formatDate(date_table.data[0].rows[i].date_value, date_table.data[0].rows[i].date_format);
								}
								else{
									date_table.data[0].rows[i].children[1].text = formatDate(date_table.data[0].rows[i].date_value);
								}
							}
							else{
								date_table.data[0].rows[i].children[1].text = formatDate(date_table.data[0].rows[i].date_value, date_table.data[0].rows[i].date_format);
							}
							break;
						default:
							break;
					}
				}
				
				date_table.fireEvent('click', {
					row : date_table.data[0].rows[0]
				}); 
			}
		}
	});
	
	var date_table = Ti.UI.createTableView({
		top : upcoming_action_view.visible ? 63 : theme.defaultItemSpacing,
		data:[startsRow, EndsRow, allDayRow],
		borderColor : theme.tableBorderColor,
		borderRadius : theme.defaultBorderRadius,
		scrollable: false,
		left: 10,
		right:10,
		backgroundColor:theme.tableBackgroundColor,
		height: 3 * theme.tableDefaultHeight
	});
	self.add(date_table);

	date_table.addEventListener('click', function(e){

		if (selected_row !== null && selected_row !== e.row) {
			selected_row.backgroundColor = theme.tableBackgroundColor;
		}

		if(e && e.row.clickName){
			switch(e.row.clickName){
				case 'date_start':
					date_picker.setMinDate(new Date());
					break;
				case 'date_end':
					date_picker.setMinDate(startDate);
					break;
				default:
					break;
			}
			e.row.backgroundColor = theme.rowHoverColor;
			selected_row = e.row;
			date_picker.setValue(e.row.date_value); 
		}
	});

	var slideIn = Ti.UI.createAnimation({
		bottom : 0
	});
	var slideOut = Ti.UI.createAnimation({
		bottom : -226
	});
		
	var slide_view = Ti.UI.createView({
		height : 226,
		bottom : 0
	});
	self.add(slide_view); 

	var date_picker = Ti.UI.createPicker({
		type : full_day ? Ti.UI.PICKER_TYPE_DATE : Ti.UI.PICKER_TYPE_DATE_AND_TIME,
		top : 10,
		selectionIndicator:true,
		minuteInterval:5,
		minDate: new Date()
	});
	slide_view.add(date_picker);
	
	date_picker.addEventListener('change', function(e) {
		if(selected_row !== null){
			selected_row.date_value = e.value;
			switch(selected_row.clickName){
				case 'date_start':
					startDate = e.value;
					selected_row.children[1].text = formatDate(selected_row.date_value, selected_row.date_format);
					
					endDate = new Date(startDate);
					if(full_day === false){
						endDate.setHours(endDate.getHours() + 1);
					}
					date_table.data[0].rows[1].date_value = endDate;
					date_table.data[0].rows[1].children[1].text = formatDate(date_table.data[0].rows[1].date_value, date_table.data[0].rows[1].date_format);
					break;
				case 'date_end':
					endDate = e.value;
					if(startDate){
						if(startDate.getFullYear() === e.value.getFullYear() && 
						   startDate.getMonth() === e.value.getMonth() && 
						   startDate.getDate() === e.value.getDate()){
							selected_row.children[1].text = formatDate(selected_row.date_value, selected_row.date_format);
						}
						else{
							selected_row.children[1].text = formatDate(selected_row.date_value);
						}
					}
					else{
						selected_row.children[1].text = formatDate(selected_row.date_value, selected_row.date_format);
					}
					break;
				default:
					break;
			}
		}
	});
	
	self.addEventListener('open', function(e){
		date_table.fireEvent('click', {
			row : date_table.data[0].rows[0]
		});
		
		require('/lib/analytics').trackScreen({ screenName : 'Date Picker' });
			
		require('/lib/analytics').trackEvent({
			category : 'date picker',
			action : self.title,
			label : null,
			value : null
		});
	});
			
	self.addEventListener('close', function(e){
		if(params.row && upcoming_action_bool.value === true){
			params.row.upcoming_date = {
				starts : startDate,
				ends : endDate,
				all_day : full_day,
				text_value : date_table.data[0].rows[0].children[1].text + '\n' + date_table.data[0].rows[1].children[1].text
			};

			//params.row.children[0].text = 'Planning';
			params.row.children[1].text = date_table.data[0].rows[0].children[1].text; 
		}
		else{
			// default
			params.row.upcoming_date = null;
			//params.row.children[0].text = 'Planning';
			params.row.children[1].text = 'Select';
		}
	});
	return self;
}
