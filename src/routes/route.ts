import { Hono } from 'hono';
import { CommissionController } from '../controller/commission.controller';
import { AuthController } from '../controller/auth.controller';

import { authMiddleware } from '../middleware/auth.middleware';
import { EmployeeController } from '../controller/employee.controller';

const route = new Hono();

const authController = new AuthController();
route.post('/auth/google', (c) => authController.google(c));
route.post('/auth/login', (c) => authController.login(c));
route.post('/auth/refresh', (c) => authController.refresh(c));
route.get('/auth/me', (c) => authController.me(c));
route.post('/auth/logout', (c) => authController.logout(c));


import { hierarchyMiddleware } from '../middleware/hierarchy.middleware';
import { SnapshotController } from '../controller/snapshot.controller';
import { AdditionalController } from '../controller/additional.controller';

route.get('/additional', (c) => new AdditionalController().getPeriod(c));

route.get('/sales/:id/commission', authMiddleware, hierarchyMiddleware, (c) => new CommissionController().salesCommission(c));
route.get('/implementator/:id/commission', authMiddleware, hierarchyMiddleware, (c) => new CommissionController().implementatorCommission(c));
route.get('/manager/:id/commission', authMiddleware, hierarchyMiddleware, (c) => new CommissionController().managerCommission(c));

route.get('/sales/:id/invoice', (c) => new SnapshotController().salesInvoice(c));
route.get('/implementator/:id/invoice', (c) => new SnapshotController().implementatorInvoice(c));
route.get('/manager/:id/team', (c) => new SnapshotController().managerTeamCommission(c));

route.get('/employee/:id', authMiddleware, (c) => new EmployeeController().getEmployeeByEmployeeId(c));
route.get('/employee/:id/hierarchy', (c) => new EmployeeController().getEmployeeHierarchy(c));


export default route;
