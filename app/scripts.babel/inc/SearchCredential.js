function SearchCredential(credential) {
	this.codename = '';
	this.username = '';
	this.password = '';
	// set fields
	if (typeof credential === 'object') {
		const fields = ['codename', 'username', 'password'];
		for (let index = 0; index < fields.length; index++) {
			const key = fields[index];
			if (typeof credential[key] === 'string') {
				this[key] = credential[key];
			}
		}
	}
}

export default SearchCredential;