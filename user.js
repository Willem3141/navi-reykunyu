var fs = require('fs');
var users = JSON.parse(fs.readFileSync('users.json'));

function findUser(username, password) {
	for (let i = 0; i < users.length; i++) {
		const user = users[i];
		if (user.username === username && user.password === password) {
			let u = {...user};
			delete u['password']
			u['id'] = i;
			return u;
		}
	}
	return null;
}

module.exports = {
	findUser: findUser,
	users: users
};

