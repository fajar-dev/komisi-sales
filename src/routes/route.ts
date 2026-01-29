import { Hono } from 'hono';
import { CommissionController } from '../controller/commission.controller';
import { AuthController } from '../controller/auth.controller';

import { authMiddleware } from '../middleware/auth.middleware';

const route = new Hono();

const authController = new AuthController();
route.post('/auth/login', (c) => authController.login(c));
route.post('/auth/refresh', (c) => authController.refresh(c));
route.get('/auth/me', (c) => authController.me(c));
route.post('/auth/logout', (c) => authController.logout(c));


route.get('internal/commission', authMiddleware, (c) => new CommissionController().internalCommission(c));
route.get('implementator/commission', authMiddleware, (c) => new CommissionController().implementatorCommission(c));
route.get('manager/commission', authMiddleware, (c) => new CommissionController().managerCommission(c));

export default route;
