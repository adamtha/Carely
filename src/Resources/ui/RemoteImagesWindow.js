function RemoteImagesWindow(params){
	var _ = require('/lib/underscore'),
		theme = require('/ui/theme'), 
		ui = require('/ui/components');

	var isAndroid = Ti.Platform.osname === 'android';
	
	var self = Ti.UI.createWindow({
		title : params.title,
		navBarHidden : isAndroid,
		backgroundColor: theme.winBgColor,
		orientationModes : [Ti.UI.PORTRAIT],
		modal:true
	});
	
	var selectedImage = null, _more = true, _updating = false;
	
	if(isAndroid){
	}
	else{
		self.barColor = theme.barColor;
		
		var cancelButton = Ti.UI.createButton({
			title : L('cancel', 'Cancel'),
			style : Ti.UI.iPhone.SystemButtonStyle.BORDERED
		});

		cancelButton.addEventListener('click', function() {
			if(this.clickTime && (new Date() - this.clickTime < 1000)){
				return false;
			}
			this.clickTime = new Date();
			
			self.close();
			
			require('/lib/analytics').trackEvent({
				category : 'remote images',
				action : 'cancel',
				label : search.value,
				value : null
			});
		});

		self.leftNavButton = cancelButton;
		
		var action = Ti.UI.createButton({
			title:'Use',
			enabled:false
		});
		action.addEventListener('click', function(e){
			if(this.clickTime && (new Date() - this.clickTime < 1000)){
				return false;
			}
			this.clickTime = new Date();
			
			require('/lib/analytics').trackEvent({
				category : 'remote images',
				action : 'use',
				label : search.value,
				value : (selectedImage !== null && selectedImage.original_image !== null) ? selectedImage.original_image : null
			});
			if(selectedImage !== null && selectedImage.original_image !== null){
				
				var img = Ti.UI.createImageView({
					top:0,
					left:-1000,
					image:Ti.Network.decodeURIComponent(selectedImage.original_image),
					hires:true
				});
				img.addEventListener('load', function(loadEvent){
					var _photo = img.toImage();
				
					self.remove(img);
					
					var ImageFactory = require('ti.imagefactory');
					//_photo = ImageFactory.imageAsResized(_photo, { width:_photo.width, height:_photo.height});
					_photo = ImageFactory.compress(_photo, 0.75);
					
					params.photo.applyProperties({
						image : Ti.Network.decodeURIComponent(selectedImage.original_image),
						onlineSavedPhoto:_photo
					});
					//Ti.Media.saveToPhotoGallery(params.photo.onlineSavedPhoto);
					
					self.close();
				});
				self.add(img);
			}
		});
		self.rightNavButton = action;
	}
		
	var search = Ti.UI.createSearchBar({
		top:0,
		autocapitalization:Ti.UI.TEXT_AUTOCAPITALIZATION_NONE,
		autocorrect:false,
		barColor:theme.barColor,
		hintText:'e.g. donate blood',
		showCancel:false,
		softKeyboardOnFocus:true,
		height:43,
		width:'auto',
		touchEnabled:true,
		value:params.query
	});
	search.addEventListener('cancel', function(e){
		this.blur();
	});
	search.addEventListener('return', function(e){
		this.blur();
		if(this.value !== '' && this.value.length > 0){
			searchImages(this.value);
		}
	});
	self.add(search);
	
	var main_scrollView = new ui.ScrollView({
		contentWidth: 'auto',
		contentHeight: 'auto',
		top: isAndroid ? 50 : 43,
		showVerticalScrollIndicator: true,
		showHorizontalScrollIndicator: false,
		scrollType: 'vertical'
	});
	self.add(main_scrollView);
	
	main_scrollView.addEventListener('click', function(e){
		search.blur();
	});
	
	var _current_y = 0;
	main_scrollView.addEventListener('scroll', function(e){
		_current_y = e.y + 43;
	});
	
	var act_Ind = Titanium.UI.createActivityIndicator({
		left : '45%',
		top : 100,
		height : 'auto',
		width : 'auto',
		style : Titanium.UI.iPhone.ActivityIndicatorStyle.DARK,
		isShowing:false
	});
	act_Ind.show();
	
	var rows = 0, columns = 0, thumbPadding = 5, rowPosition = 2, rowPositionReset = 2, padding = 5, columnPosition = 15, numOfImagesInWidth=4;
	var imgSize = (300 - (numOfImagesInWidth * padding)) / numOfImagesInWidth;
	var imageUrls = [], imageViews = [];
	
	function waitMillis(_millis){
		var date = new Date(),
			currDate = null;
		do{
			currDate = new Date();
		}while(currDate-date < _millis);
	}
	
	function searchImages(_value){
		if(imageUrls.length > 0){
			return;
		}
		
		rows = 0;
		columns = 0;
		rowPosition = rowPositionReset;
		columnPosition = 15;
		
		//clear main_scrollView
		while(imageViews.length > 0){
			main_scrollView.remove(imageViews.pop());
			waitMillis(10);
		}
		
		imageUrls.push(0);

		main_scrollView.add(act_Ind);
		act_Ind.isShowing = true;
		
		main_scrollView.fireEvent('data.refresh');
		
		require('/lib/analytics').trackEvent({
			category : 'remote images',
			action : 'search',
			label : _value,
			value : null
		});
	}
	
	function handleImageClick(e){
		if(!e.canAnimate){
			return false;
		}
		
		e.isSelected = !e.isSelected;
		if (e.isSelected === true) {
			e.animate({
				top : _current_y + 50,
				left : 60,
				width : 200,
				height : 200,
				zIndex : 10
			}, function(){
				selectedImage = e;
				self.rightNavButton.enabled = true;
			});
		} else {
			e.animate({
				top : e.absTop,
				left : e.absLeft,
				width : imgSize,
				height : imgSize,
				zIndex : 0
			}, function(){
				selectedImage = null;
				self.rightNavButton.enabled = false;
			});
		}
	}
	
	function AddImages(_images){
		require('/lib/analytics').trackEvent({
			category : 'remote images',
			action : 'images',
			label : search.value,
			value : _images.length
		});
		
		if(_images.length > 0){
			if(act_Ind.isShowing === true){
				act_Ind.isShowing = false;
				main_scrollView.remove(act_Ind);
			}
			
			for (var i = 0; i < _images.length; i++) {
				
				if (columns % numOfImagesInWidth == 0 && rows !== 0) {
					columnPosition += imgSize + thumbPadding;
					rowPosition = rowPositionReset;
				}
				var img = Ti.UI.createImageView({
					//image:_images[i].tbUrl,
					image:_images[i].tbUrl,
					original_image:_images[i].url,
					width : imgSize,
					height : imgSize,
					left : rowPosition,
					absLeft:rowPosition,
					top : columnPosition,
					absTop:columnPosition,
					borderColor:theme.winBgColor,
					backgroundColor : 'transparent',
					borderWidth:0,
					isSelected: false,
					zIndex:0,
					hires:true,
					canAnimate:true
				});
				imageViews.push(img);
				main_scrollView.add(img);
				
				img.addEventListener('singletap', function(e){
					if(e){
						e.cancelBubble = true;
					}
					
					require('/lib/analytics').trackEvent({
						category : 'remote images',
						action : 'click',
						label : this.original_image,
						value : this.isSelected ? 1 : 0
					});
					
					if(selectedImage !== null && selectedImage !== this){
						selectedImage.animate({top:selectedImage.absTop, left:selectedImage.absLeft, width:imgSize, height:imgSize, zIndex:0}, function(){
							selectedImage.isSelected = false;
							selectedImage = null;
							handleImageClick(this);
						});
					}
					else{
						handleImageClick(this);
					}
				});

				columns++;
				rows++;
				rowPosition += imgSize + padding;
			}
		}
	}
	
	var request = Ti.Network.createHTTPClient({
		autoEncodeUrl:false,
		autoRedirect:false,
		onload : function(e){
			var response = JSON.parse(this.responseText);
			if(response.responseData && response.responseData.results && response.responseData.results.length > 0){
				if(response.responseData.cursor && response.responseData.cursor.currentPageIndex === 0 && response.responseData.cursor.pages && response.responseData.cursor.pages.length > 1){
					for(var v=response.responseData.cursor.pages.length - 1; v > 0; v--){
						if(response.responseData.cursor.pages[v].start){
							imageUrls.push(parseInt(response.responseData.cursor.pages[v].start));
						}
					}
				}
				
				AddImages(response.responseData.results);
			}
			_updating = false;
			main_scrollView.fireEvent('data.refresh');
		},
		onerror: function(e){
			main_scrollView.remove(act_Ind);
			if(e && e.error){
				Ti.UI.createAlertDialog({
					title : Ti.App.name,
					message : e.error,
					buttonNames : [L('ok', 'OK')]
				}).show();
			}
			_updating = false;
		}
	});
	
	// main_scrollView.addEventListener('scroll', function(e){
		// e.cancelBubble = true;
		// if(e.y > 0 && e.dragging === false && _more && !_updating){
			// main_scrollView.fireEvent('data.refresh');
		// }
	// });
	
	main_scrollView.addEventListener('data.refresh', function(e) {
		if (imageUrls.length > 0) {
			_updating = true;
			
			var _start = imageUrls.pop();
			//var imageUrl = 'http://ajax.googleapis.com/ajax/services/search/images?v=1.0&imgsz=icon&rsz=8&start=' + _start + '&q=' + Ti.Network.encodeURIComponent(search.value);
			var imageUrl = 'http://ajax.googleapis.com/ajax/services/search/images?v=1.0&rsz=8&start=' + _start + '&q=' + Ti.Network.encodeURIComponent(search.value);
			if (imageUrl !== null && imageUrl.length > 0) {
				request.open('GET', imageUrl);
				request.send();
			}
		}
		else{
			_updating = false;
			_more = false;
		}
	}); 
	
	search.fireEvent('return');
	
	self.addEventListener('focus', function(e){
		if(Ti.App.Properties.getBool('carely_goToHome', false) === true){
			require('/ui/MasterWindow').getNavGroup().close(this, {animated:false});
		}
		else{
			require('/lib/analytics').trackScreen({ screenName : 'Search Remote Images' });
			
			require('/lib/analytics').trackEvent({
				category : 'remote images',
				action : self.title,
				label : params ? params.query : null,
				value : null
			});
			
			if(params && params.query && params.query.length){
			}
			else{
				search.focus();
			}
		}
	});
	self.addEventListener('open', function(e){
		if(Ti.App.Properties.getBool('carely_goToHome', false) === true){
			require('/ui/MasterWindow').getNavGroup().close(this, {animated:false});
		}
	});
	
	return self;
}
module.exports = RemoteImagesWindow;