declare module 'express-session' {
	interface SessionData {
		messages: string[];
	}
}

declare global {
	namespace Express {
		interface User {
			is_admin: boolean;
		}
	}
}

export {};
