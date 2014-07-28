var Model = require('/lib/model/model'),
	Cloud = require('ti.cloud');

Cloud.debug = Model.debug;
if(Model.user_session){
	Cloud.sessionId = Model.user_session;
}

module.exports = {
	loginAccount:function(accountId, accountType, accountToken, _cb){
		Cloud.SocialIntegrations.externalAccountLogin({
			id:accountId,
			type:accountType,
			token:accountToken
		}, _cb ? _cb : Model.eventDefaultCallback);
		
		require('/lib/analytics').trackEvent({
			category : 'user',
			action : 'login',
			label : accountType,
			value : null
		});
	},
	linkAccount:function(accountId, accountType, accountToken, _cb){
		Cloud.SocialIntegrations.externalAccountLink({
			id:accountId,
			type:accountType,
			token:accountToken
		}, _cb ? _cb : Model.eventDefaultCallback);
		
		require('/lib/analytics').trackEvent({
			category : 'user',
			action : 'link social',
			label : accountType,
			value : null
		});
	},
	unlinkAccount:function(accountId, accountType, _cb){
		Cloud.SocialIntegrations.externalAccountUnlink({
			id:accountId,
			type:accountType,
		}, _cb ? _cb : Model.eventDefaultCallback);
		
		require('/lib/analytics').trackEvent({
			category : 'user',
			action : 'unlink social',
			label : accountType,
			value : null
		});
	},
	searchFacebookFriends : function(_cb){
		Cloud.SocialIntegrations.searchFacebookFriends(_cb ? _cb : Model.eventDefaultCallback);
		
		require('/lib/analytics').trackEvent({
			category : 'user',
			action : 'search facebook friends',
			label : null,
			value : null
		});
	}
};