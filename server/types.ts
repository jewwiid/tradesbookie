import 'express-session';

declare module 'express-session' {
  interface SessionData {
    installerId?: number;
    installerAuthenticated?: boolean;
    passport?: any;
    authAction?: string;
  }
}