import express, { Request, Response, NextFunction } from 'express';
const router = express.Router();
module.exports = router;

import crypto from 'crypto';
import db from './db';
const _ = require('./translations')._;

const hashIterationCount = 600000;
const keyLength = 32;
const digestMethod = 'sha256';

import passport from 'passport';
import passportLocal from 'passport-local';
const LocalStrategy = passportLocal.Strategy;
passport.use(new LocalStrategy((username, password, done) => {
	db.get(`select * from users where username = ?;`, username, (err, row: { 'id': number, 'username': string, 'password_hash': Buffer, 'salt': Buffer, 'is_admin': boolean }) => {
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

passport.serializeUser((user: Express.User, done) => {
	done(null, { id: user['id'], username: user['username'] });
});

passport.deserializeUser((user: Express.User, done) => {
	db.get(`select * from users where id = ?;`, user['id'], (err, row: { 'id': number, 'username': string, 'password_hash': Buffer, 'salt': Buffer, 'is_admin': boolean }) => {
		if (err) {
			done(err);
		} else if (!row) {
			done(null, false);
		} else {
			done(null, row);
		}
	});
});

router.post('/login/password', passport.authenticate('local', {
	'failureRedirect': '/',
	'failureMessage': true,
	'successRedirect': '/'
}));

router.post('/logout',
	(req, res, next) => {
		req.logout((err) => {
			if (err) {
				return next(err);
			}
			res.redirect('/');
		});
	}
);

router.post('/signup',
	(req, res, next) => {
		if (!req.body.hasOwnProperty('username') || !req.body.hasOwnProperty('password')) {
			req.session.messages = [_('missing-username-or-password')];
			res.redirect('/signup');
			return;
		}
		const username = req.body['username'];
		const password = req.body['password'];
		if (username === '' || password === '') {
			req.session.messages = [_('missing-username-or-password')];
			res.redirect('/signup');
			return;
		}
		db.get(`select * from users where username = ?;`, username, (err, row) => {
			if (err) {
				return next(err);
			}
			if (row) {
				req.session.messages = [_('username-already-exists')];
				res.redirect('/signup');
				return;
			}
			if (password.length < 8) {
				req.session.messages = [_('password-too-short')];
				res.redirect('/signup');
				return;
			}
			const salt = crypto.randomBytes(16);
			crypto.pbkdf2(password, salt, hashIterationCount, keyLength, digestMethod, (err, hash) => {
				if (err) {
					return next(err);
				}
				db.run(`insert into users (username, password_hash, salt, is_admin)
					values (?, ?, ?, false);`,
					[username, hash, salt],
					(err) => {
						if (err) {
							return next(err);
						}
						res.redirect('/');
					}
				);
			});
		});
	}
);
