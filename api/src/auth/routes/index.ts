import { Router } from 'express';
import login from './login';
import callback from './callback';
import refresh from './refresh-token';
import session from './session';
import logout from './logout';

const auth = Router();

auth.use(login);
auth.use(callback);
auth.use(refresh);
auth.use(session);
auth.use(logout);

export default auth;
