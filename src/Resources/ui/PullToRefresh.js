function PullToRefresh() {
	var theme = require('/ui/theme');
	
	formatDate = function() {
		var d = new Date;
		var month = d.getMonth() + 1;
		var datestr = d.getDate() + "/" + month + "/" + d.getFullYear();

		var minutes = d.getMinutes();
		if (minutes < 10) {
			minutes = "0" + minutes;
		}

		datestr += " " + d.getHours() + ":" + minutes;

		return datestr;
	}
	var puller = {
		_pulling : false,
		_reloading : false
	};

	puller._view = Ti.UI.createView({
		backgroundColor : theme.winBgColor,
		width : Ti.Platform.displayCaps.platformWidth,
		height : 60,
		top:0,
		bottom:5
	});

	puller._arrow = Ti.UI.createView({
		backgroundImage : theme.images.pullArrow,
		width : 30,
		height : 30,
		bottom : 20,
		left : 20
	});
	puller._view.add(puller._arrow);

	puller._status = Ti.UI.createLabel({
		text : 'Pull down to refresh...',
		left : 55,
		width : 220,
		bottom : 35,
		height : 'auto',
		color : '#000',
		textAlign : Ti.UI.TEXT_ALIGNMENT_CENTER,
		font : {
			fontSize : 13,
			fontWeight : 'bold'
		}
	});
	puller._view.add(puller._status);

	puller._lastUpdate = Ti.UI.createLabel({
		text : 'Last Updated: ' + formatDate(),
		left : 55,
		width : 220,
		bottom : 15,
		height : 15,
		height : 'auto',
		color : '#000',
		textAlign : Ti.UI.TEXT_ALIGNMENT_CENTER,
		font : {
			fontSize : 12
		}
	});
	puller._view.add(puller._lastUpdate);

	puller._activityIndicator = Titanium.UI.createActivityIndicator({
		left : 20,
		bottom : 13,
		width : 30,
		height : 30,
		style : Titanium.UI.iPhone.ActivityIndicatorStyle.DARK
	});
	puller._view.add(puller._activityIndicator);

	puller.scroll = function(e) {
		var offset = e.contentOffset.y;
		if (offset <= -65.0 && !puller._pulling && !puller._reloading) {
			var t = Ti.UI.create2DMatrix();
			t = t.rotate(-180);
			puller._pulling = true;
			puller._arrow.animate({
				transform : t,
				duration : 180
			});
			puller._status.text = 'Release to refresh...';
		} else if ((offset > -65.0 && offset < 0) && puller._pulling && !puller._reloading) {
			puller._pulling = false;
			var t = Ti.UI.create2DMatrix();
			puller._arrow.animate({
				transform : t,
				duration : 180
			});
			puller._status.text = 'Pull down to refresh...';
		}
	};

	puller.begin = function(e, tableView, loadingCallback) {
		if (puller._pulling && !puller._reloading) {
			puller._reloading = true;
			puller._pulling = false;
			puller._arrow.hide();
			puller._activityIndicator.show();
			puller._status.text = 'Refreshing...';
			tableView.setContentInsets({ top : 60 }, {animated : true});
			puller._arrow.transform = Ti.UI.create2DMatrix();
			loadingCallback();
		}
	};

	puller.end = function(tableView, callback) {
		callback();
		puller._reloading = false;
		puller._lastUpdate.text = 'Last Updated: ' + formatDate();
		puller._status.text = 'Pull down to refresh...';
		puller._activityIndicator.hide();
		puller._arrow.show();
		tableView.setContentInsets({ top : 0 }, {animated : true}); 
	};
	return puller;
};

module.exports = PullToRefresh;
