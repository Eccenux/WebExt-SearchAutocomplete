'use strict';

import {getI18n} from './inc/I18nHelper';

window.app = {};
window.angularApp = angular.module('app', []);
window.angularApp.filter('i18n', function() {
		return function(input) {
			return getI18n(input);
		};
	})
;

import {initEngineController} from './inc/EngineController'
window.angularApp.controller('EngineController', initEngineController);

/*
import {initCredentialController} from './inc/CredentialController'
window.angularApp.controller('CredentialController', initCredentialController);
*/