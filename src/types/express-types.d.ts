declare module 'express-session' {
	interface SessionData {
		messages: string[];
	}
}

declare global {
	namespace Express {
		interface Request {
			args?: { [name: string]: any };
		}
		interface User {
			id: number;
			username: string;
			is_admin: boolean;
		}
	}
}

export {};
