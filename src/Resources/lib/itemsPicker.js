function itemsPicker(params){
	var theme = require('/ui/theme'), 
		ui = require('/ui/components');

	var isAndroid = Ti.Platform.osname === 'android';
	
	var self = new ui.Window({
		title:params.title,
		navBarHidden:isAndroid,
		backgroundColor:theme.winBgColor,
		orientationModes : [Ti.UI.PORTRAIT]
	});
	
	if(isAndroid){
	}
	else{
		self.tabBarHidden = true;
		self.barColor = theme.barColor;
	}
	
	var rows = [];
	var selectedRow = null;
	for(var i=0, v=params.items.length; i<v; i++){
		var row = Ti.UI.createTableViewRow({
			text_value : params.items[i],
			is_empty_value : params.items[i] === theme.defaultIgnoreValue
		});
		
		var lbl = Ti.UI.createLabel({
			text: params.items[i],
			top: 10,
			left: 10,
			color: theme.textColor,
			font: theme.defaultFont
		});
		row.add(lbl);
		
		if(params.allow_multiple){
			if(params.items[i] !== theme.defaultIgnoreValue && params.value.indexOf(params.items[i]) > -1){
				row.hasCheck = true;
				lbl.color = '#324F85';
			}
		}
		else{
			if(params.items[i] === params.value){
				row.hasCheck = true;
				selectedRow = row;
				lbl.color = '#324F85';
			}
		}
		
		rows.push(row);
	}
	
	var main_scrollView = new ui.ScrollView({
		contentWidth: 'auto',
		contentHeight: 'auto',
		top: isAndroid ? 50 : 0,
		showVerticalScrollIndicator: true,
		showHorizontalScrollIndicator: true,
		scrollType: 'vertical',
		layout:'vertical',
		scrollsToTop:true
	});
	self.add(main_scrollView);
	
	var items_table = Ti.UI.createTableView({
		data : rows,
		height:rows.length * theme.tableDefaultHeight,
		top: 10,
		bottom:10,
		borderColor: theme.tableBorderColor,
		minRowHeight:theme.tableDefaultHeight,
		borderRadius: theme.defaultBorderRadius,
		left: 10,
		right:10,
		backgroundColor: theme.tableBackgroundColor,
		scrollable:false,
		footerView : Ti.UI.createView({height:0})
	}); 
	main_scrollView.add(items_table);
	
	items_table.addEventListener('click', function(e){
		if(params.allow_multiple){
			if(e.row.is_empty_value){
				for(var i=0; i<items_table.data[0].rows.length; i++){
					items_table.data[0].rows[i].hasCheck = false;
				}
			}
			else{
				e.row.hasCheck = !e.row.hasCheck;
			}
		}
		else{
			if(selectedRow !== null){
				selectedRow.children[0].color = theme.textColor;
				selectedRow.hasCheck = false;
			}
			selectedRow = e.row;
			selectedRow.hasCheck = true;
			selectedRow.children[0].color = '#324F85';
			
			params.selectedValue = selectedRow.children[0].text;
			params.label.text = selectedRow.children[0].text;
		}
	});
	
	self.addEventListener('focus', function(e){
		require('/lib/analytics').trackScreen({ screenName : 'Items Picker' });
			
		require('/lib/analytics').trackEvent({
			category : 'items picker',
			action : self.title,
			label : null,
			value : null
		});
	});
	
	self.addEventListener('close', function(e){
		if(params.allow_multiple){
			var selected = [];
			for (var i = 0, v = items_table.data[0].rows.length; i < v; i++) {
				if(items_table.data[0].rows[i].hasCheck){
					if(items_table.data[0].rows[i].children[0].text !== theme.defaultIgnoreValue){
						selected.push(items_table.data[0].rows[i].children[0].text.replace('|', ' ').replace(',', ' '));
					}
				}
			}
			if(!selected.length){
				if(params.allow_empty){
					params.selectedValue = theme.defaultIgnoreValue;
					params.label.text = theme.defaultIgnoreValue;
					params.label.full_text = undefined;
				}
			}
			else{
				params.selectedValue = selected.join(',');
				params.label.text = selected.join(',');
				params.label.full_text = params.selectedValue;
				if(params.label.text.length > 10){
					params.label.text = params.label.text.substr(0, 10) + '...';
				}
			}
		}
		if(params && params.callback){
			params.callback({
				value:params.selectedValue
			});
		}
	});
	return self;
}

module.exports = itemsPicker;