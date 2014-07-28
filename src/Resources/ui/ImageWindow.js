function ImageWindow(_image) {
	var _ = require('/lib/underscore'), 
		theme = require('/ui/theme'), 
		ui = require('/ui/components'),
		moment = require('/lib/date/moment');
	
	var isAndroid = Ti.Platform.osname === 'android';
	
	var self = Ti.UI.createWindow({
		title : 'Details',
		barColor:theme.barColor,
		navBarHidden : isAndroid,
		backgroundColor: '#000',
		orientationModes : [Ti.UI.PORTRAIT],
		translucent:true
	});
	
	var options_dialog = {
		cancel:1
	};
	
	if(isAndroid) {
		options_dialog.buttonNames = ['Save To Gallery', 'Cancel'];
		options_dialog.selectedIndex = 1;
	}
	else{
		options_dialog.options = ['Save To Gallery', 'Cancel'];
	}
	var _dialog = Ti.UI.createOptionDialog(options_dialog);
	_dialog.addEventListener('click', function(dialogEvent){
		if(this.clickTime && (new Date() - this.clickTime < 1000)){
			return false;
		}
		this.clickTime = new Date();
		
		if(dialogEvent.index === 0){
			Ti.Media.saveToPhotoGallery(img.toImage());
		}
	});
	
	if(isAndroid) {
	}
	else{
		var action = Ti.UI.createButton({
			systemButton:Ti.UI.iPhone.SystemButton.ACTION
		});
		action.addEventListener('click', function(e){
			if(this.clickTime && (new Date() - this.clickTime < 1000)){
				return false;
			}
			this.clickTime = new Date();
			
			_dialog.show();
		});
		self.rightNavButton = action;
	}
	
	var main_scrollView = Ti.UI.createScrollView({
		contentWidth: 'auto',
		contentHeight: 'auto',
		top: 0,
		showVerticalScrollIndicator: true,
		showHorizontalScrollIndicator: true,
		width:'auto',
		height:'auto',
		maxZoomScale:2,
		minZoomScale:1,
		zoomScale:1,
		currentScale:1
	});
	main_scrollView.addEventListener('scale', function(e){
		this.currentScale = e.scale;
	});
	self.add(main_scrollView);

	var img = Ti.UI.createImageView({
		image : _image,
		height : 'auto',
		//width : Ti.UI.SIZE,
		centerL: {y:Ti.Platform.displayCaps.platformHeight/2,x:Ti.Platform.displayCaps.platformWidth/2},
		zoomScale: false,
		hires : true
	});
	
	img.addEventListener('doubletap', function(e){
		//var t = Ti.UI.create2DMatrix();
		if(!this.zoomScale){
			//var t = Ti.UI.create2DMatrix({scale:2.0});
			//this.animate({transform:t.scale(2.0), center:{y:e.y, x:e.x},duration:500});
			
			main_scrollView.setCenter({y:e.y, x:e.x});
			main_scrollView.zoomScale = main_scrollView.maxZoomScale;
		}
		else{
			//this.animate({transform:t, center:this.centerL,duration:500});
			
			main_scrollView.setCenter(this.centerL);
			main_scrollView.zoomScale = main_scrollView.minZoomScale;
		}
		this.zoomScale = !this.zoomScale;
		
		// if(main_scrollView.zoomScale > main_scrollView.minZoomScale){
			// main_scrollView.setCenter(this.centerL);
			// main_scrollView.zoomScale = main_scrollView.minZoomScale;
		// }
		// else{
			// //main_scrollView.scrollTo(e.x, e.y);
			// main_scrollView.setCenter({y:e.y, x:e.x});
			// main_scrollView.zoomScale = main_scrollView.maxZoomScale;
		// }
	});
	img.addEventListener('singletap', function(e){
		if(hiddenBars === true){
			self.showNavBar({animated:true});
			hiddenBars = false;
			hideBars();
		}
		else{
			self.hideNavBar({animated:true});
			hiddenBars = true;
		}
	});
	main_scrollView.add(img);
	
	var hiddenBars = false;
	function hideBars(){
		setTimeout(function(){
			self.hideNavBar({animated:true});
			hiddenBars = true;
		}, 5000);
	}
	
	hideBars();
	
	self.addEventListener('focus', function(e){
		if(Ti.App.Properties.getBool('carely_goToHome', false) === true){
			require('/ui/MasterWindow').getNavGroup().close(this, {animated:false});
		}
		else{
			require('/lib/analytics').trackScreen({ screenName : self.title });
		}
	});
	
	self.addEventListener('open', function(e){
		if(Ti.App.Properties.getBool('carely_goToHome', false) === true){
			require('/ui/MasterWindow').getNavGroup().close(this, {animated:false});
		}
	});
	
	return self;
}

module.exports = ImageWindow;
