import { Hono } from 'hono';
import { CommissionController } from '../controller/commission.controller';
import { AuthController } from '../controller/auth.controller';

import { authMiddleware } from '../middleware/auth.middleware';
import { EmployeeController } from '../controller/employee.controller';

const route = new Hono();

const authController = new AuthController();
route.post('/auth/login', (c) => authController.login(c));
route.post('/auth/refresh', (c) => authController.refresh(c));
route.get('/auth/me', (c) => authController.me(c));
route.post('/auth/logout', (c) => authController.logout(c));


import { hierarchyMiddleware } from '../middleware/hierarchy.middleware';

route.get('internal/:id/commission', authMiddleware, hierarchyMiddleware, (c) => new CommissionController().internalCommission(c));
route.get('implementator/:id/commission', authMiddleware, hierarchyMiddleware, (c) => new CommissionController().implementatorCommission(c));
route.get('manager/:id/commission', authMiddleware, hierarchyMiddleware, (c) => new CommissionController().managerCommission(c));


route.get('employee/:id', authMiddleware, (c) => new EmployeeController().getEmployeeByEmployeeId(c));
route.get('employee/:id/hierarchy', (c) => new EmployeeController().getEmployeeHierarchy(c));


export default route;
