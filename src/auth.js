const express = require('express');
const router = express.Router();
module.exports = router;

const crypto = require('crypto');
const db = require('./db');
const _ = require('./translations')._;

const hashIterationCount = 600000;
const keyLength = 32;
const digestMethod = 'sha256';

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
passport.use(new LocalStrategy((username, password, done) => {
	db.get(`select * from users where username = ?;`, username, (err, row) => {
		if (err) {
			return done(err);
		}
		if (!row) {
			return done(null, false, { 'message': _('incorrect-username') });
		}

		crypto.pbkdf2(password, row['salt'], hashIterationCount, keyLength, digestMethod, (err, password_hash) => {
			if (err) {
				return done(err);
			}
			if (!crypto.timingSafeEqual(row['password_hash'], password_hash)) {
				return done(null, false, { 'message': _('incorrect-password') });
			}
			// passed
			return done(null, row);
		});
	});
}));

passport.serializeUser((user, done) => {
	done(null, { id: user['id'], username: user['username'] });
});

passport.deserializeUser((user, done) => {
	db.get(`select * from users where id = ?;`, user['id'], (err, row) => {
		if (err) {
			done(err);
		} else if (row === undefined) {
			done(null, false);
		} else {
			done(null, row);
		}
	});
});

router.post('/login/password', passport.authenticate('local', {
	'successRedirect': '/',
	'failureRedirect': '/'
}));

router.post('/logout', function (req, res, next) {
	req.logout((err) => {
		if (err) {
			return next(err);
		}
		res.redirect('/');
	});
});

router.post('/signup', (req, res, next) => {
	const salt = crypto.randomBytes(16);
	crypto.pbkdf2(req.body['password'], salt, hashIterationCount, keyLength, digestMethod, (err, hash) => {
		if (err) {
			return next(err);
		}
		db.run(`insert into users (username, password_hash, salt, is_admin)
			values (?, ?, ?, false);`,
			[req.body['username'], hash, salt],
			(err) => {
				if (err) {
					return next(err);
				}
				res.redirect('/');
			}
		);
	});
});
