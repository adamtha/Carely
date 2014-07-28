var _ = require('/lib/underscore'),
	theme = require('/ui/theme');

/*
 * Wrapper for Titanium UI components.  This wrapper provides a few pieces of critical
 * functionality, currently missing from Titanium UI objects:
 * - The ability to safely extend components with new members
 * - Rudimentary resource management and object lifecycle handling
 * 
 * Caveat Number One:
 * Not all Titanium UI objects are perfectly wrappable.  Some still need to be used directly,
 * notably TableViews and TableViewRows, since they contain LOTS of magic - like purple, sparkly 
 * unicorn magic.  If you need a TableView, it's best to have it as a child of a Component-ized 
 * view, and work with the TableView directly.
 * 
 * Caveat Number Two:
 * This is not an Appcelerator-supported API - this is one approach to accomplishing the goals of
 * best-practice UI development.  This Component wrapper can be considered an advanced use of the
 * Titanium API, and should only be used by developers who are already knowledgeable about the core
 * Titanium JavaScript APIs.
 * 
 */
function Component(/*Titanium Proxy Object*/ tiView) {
	this.viewProxy = tiView;
}

//Wrappers for common Titanium view construction functions
Component.prototype.add = function(tiChildView) {
	var v = tiChildView.viewProxy||tiChildView;
	this.viewProxy.add(v);
};
Component.prototype.remove = function(tiChildView) {
	var v = tiChildView.viewProxy||tiChildView;
	this.viewProxy.remove(v);
};
Component.prototype.open = function(args) {
	if (this.viewProxy.open) {
		this.viewProxy.open(args||{animated:false});
	}
};
Component.prototype.close = function(args) {
	if (this.viewProxy.close) {
		this.viewProxy.close(args||{animated:false});
	}
};
Component.prototype.animate = function(args,callback) {
	this.viewProxy.animate(args,callback||function(){});
};

//Getter/Setter for the wrapped Titanium view proxy object
Component.prototype.get = function(key) {
	return this.viewProxy[key];
};
Component.prototype.set = function(key,value) {
	this.viewProxy[key] = value;
};

//Event Handling
Component.prototype.addEventListener = function(event,callback) {
	switch (event) {
		case 'location':
			this.globalHandlers.location = callback;
			Ti.Geolocation.addEventListener('location', this.globalHandlers.location);
			break;
		case 'orientationchange':
			this.globalHandlers.orientationchange = callback;
			Ti.Gesture.addEventListener('orientationchange', this.globalHandlers.orientationchange);
			break;
		default:
			this.viewProxy.addEventListener(event,callback);
			break;
	}
};
Component.prototype.fireEvent = function(event,data) {
	this.viewProxy.fireEvent(event,data||{});
};

//This should be overridden by any Components which wish to execute custom 
//clean up logic, to release their child components, etc.
Component.prototype.onDestroy = function() {};

//Clean up resources used by this Component
Component.prototype.release = function() {
	//force cleanup on proxy
	this.viewProxy = null;
	
	//run custom cleanup logic
	this.onDestroy();
};

//adding to public interface
exports.Component = Component;


//sugared/shortened Titanium UI object constructors - many common ones included, add/remove as needed
exports.TabGroup = function(args) {
	return Ti.UI.createTabGroup(args);
};
exports.Tab = function(args) {
	return Ti.UI.createTab(args);
};
exports.Window = function(args) {
	return Ti.UI.createWindow(args);
};
exports.View = function(args) {
	return Ti.UI.createView(args);
};
exports.ViewTransparent = function() {
	return Ti.UI.createView({
		height:1,
		backgroundColor:'transparent'
	});
};
exports.ScrollView = function(args) {
    return Ti.UI.createScrollView(args);
};
exports.ScrollableView = function(args) {
	return Ti.UI.createScrollableView(args);
};
exports.TextArea = function(args) {
	return Ti.UI.createTextArea(args);
};
exports.Switch = function(args) {
	return Ti.UI.createSwitch(args);
};

//create a button with a localized title
exports.Button = function() {
	if (typeof arguments[0] === 'string') {
		return Ti.UI.createButton(_.mixin({
			title:L(arguments[0], arguments[0])
		},arguments[1]||{}));
	}
	else {
		return Ti.UI.createButton(arguments[0]);
	}
};

//create an image with more intelligent defaults
exports.ImageView = function(img,args) {
	return Ti.UI.createImageView(_.extend({
		image:img,
		height:'auto',
		width:'auto'
	},args||{}));
};

exports.ImageViewBordered = function(img, viewArgs, clickname) {
	var _viewShadow = Ti.UI.createView(_.extend({
		backgroundImage : theme.images.dropShadow,
	},viewArgs||{}));
	var _image = Ti.UI.createImageView({
		image:img,
		top:1,
		bottom:1,
		left:1,
		right:1,
		height:Ti.UI.FILL,
		width:Ti.UI.FILL,
		borderColor:'#fff',
		backgroundColor:'#fff'
	});
	_viewShadow.add(_image);
	
	if(clickname){
		_viewShadow.clickName = clickname;
		_image.clickName = clickname;
	}
	
	return _viewShadow;
};

//label with intelligent defaults, and built in localization
var osname = Ti.Platform.osname;
exports.Label = function(text, args) {
	return Ti.UI.createLabel(_.extend({
		text:L(text,text),
		color:'#000',
		height:'auto',
		width:'auto',
		font: {
			fontFamily: (osname === 'android') ? 'Droid Sans' : 'Helvetica Neue',
			fontSize: 14
		}
	},args||{}));
};