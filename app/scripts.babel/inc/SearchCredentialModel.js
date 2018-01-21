/**
 * Observable search credential model.
 * 
 * @param {SearchCredential} credential Optional initial credential.
 */
function SearchCredentialModel(credential) {
    this.id = null;
	this.codename = '';
	this.username = '';
	this.password = '';
	if (credential) {
		this.update(credential);
	}
};
/**
 * Update the credential model.
 * 
 * @param {SearchCredential} credential
 */
SearchCredentialModel.prototype.update = function(credential) {
	this.id = credential.id;
	this.codename = credential.codename;
	this.username = credential.username;
	this.password = credential.password;
}

/**
 * Recreate credential definition from the model.
 */
SearchCredentialModel.prototype.getCredential = function() {
	let credential = {};
	credential.id = this.id;
	credential.codename    = this.codename;
	credential.username = this.username;
	credential.password = this.password;
	return credential;
}

export default SearchCredentialModel