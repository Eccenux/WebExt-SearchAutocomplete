'use strict';

import SearchCredential from './SearchCredential.js';
import SearchCredentialModel from './SearchCredentialModel.js';

const credentialEditor = document.getElementById('credential-editor');

import {getI18n} from '../inc/I18nHelper';

/**
 * Load credentials from storage.
 */
function loadCredentials() {
	if (typeof browser != 'undefined') {
		browser.storage.local.get('credentials')
		.then(function(result){
			if (!('credentials' in result) || !Array.isArray(result.credentials)) {
				console.warn('Credentials are not an array!', result);
			} else {
				prepareCredentials(result.credentials);
			}
			// seem to be required here (probably due to using promises when loading data)
			app.CredentialController.$apply();
		}, function(failReason) {
			console.log('failReason', failReason);
		})
	// in-browser testing examples
	} else {
		prepareCredentials([{
			codename : 'Just a test',
			username : 'tester',
			password : '123'
		}]);
	}
}

/**
 * Prepare a list of credentials.
 */
function prepareCredentials(credentials) {
	console.log('prepareCredentials: ', credentials);
	credentialEditor.style.display = 'none';
	app.CredentialController.credentials.length = 0;
	for (let e = 0; e < credentials.length; e++) {
		let credential = new SearchCredential(credentials[e]);
		app.CredentialController.credentials.push(credential);
	}
}

/**
 * Load credential for editing.
 * @param {SearchCredential} credential
 */
function editCredential(credential, index) {
	console.log('editCredential: ', credential, index);
	credential.id = index;
	app.CredentialController.currentCredential.update(credential);
	//app.CredentialController.$apply();
	credentialEditor.style.display = 'block';
}
/**
 * Prepare new credential editor.
 */
function addCredential() {
	let credential = new SearchCredential();
	app.CredentialController.currentCredential.update(credential);
	credentialEditor.style.display = 'block';
};

/**
 * Save changes to credential.
 * @param {SearchCredentialModel} currentCredential
 */
function saveCredential(currentCredential) {
	console.log('saved:', currentCredential.id, currentCredential);
	let credential = new SearchCredential(currentCredential.getCredential());
	if (typeof currentCredential.id === 'number') {
		credential.id = currentCredential.id;
		app.CredentialController.credentials[credential.id] = credential;
	} else {
		credential.id = app.CredentialController.credentials.length;
		app.CredentialController.credentials.push(credential);
	}
	//app.CredentialController.$apply();
	credentialEditor.style.display = 'none';
}

/**
 * Force saving as a new credential.
 * @param {SearchCredentialModel} currentCredential
 */
function saveCredentialCopy(currentCredential) {
	currentCredential.id = null;
	saveCredential(currentCredential);
	credentialEditor.style.display = 'none';
}

/**
 * Store changes into browser memory
 */
function storeChanges() {
	if (confirm(getI18n('options.confirmPermanentStorage'))) {
		browser.storage.local.set({
			'credentials': app.CredentialController.credentials
		});
	}
}
/**
 * Undo all changes and reload from storage
 */
function undoChanges() {
	if (confirm(getI18n('options.confirmReloadFromStorage'))) {
		loadCredentials();
	}
}

function initCredentialController($scope) {
	app.CredentialController = $scope;

	$scope.currentCredential = new SearchCredentialModel();
	$scope.credentials = [];

	$scope.editCredential = editCredential;
	$scope.saveCredential = saveCredential;
	$scope.saveCredentialCopy = saveCredentialCopy;

	$scope.storeChanges = storeChanges;
	$scope.undoChanges = undoChanges;

	$scope.addData = function(action){
		action.data.push({key:'', value:''});
	};
	$scope.removeData = function(action, index){
		action.data.splice(index, 1);
	};

	$scope.addCredential = addCredential;
	$scope.removeCredential = function(credential, index){
		$scope.credentials.splice(index, 1);
	};
	$scope.undoCredentialChanges = function(){
		credentialEditor.style.display = 'none';
	};
	
	loadCredentials();
}

export {
	initCredentialController,
};