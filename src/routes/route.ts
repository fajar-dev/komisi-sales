import { Hono } from 'hono';
import { CommissionController } from '../controller/commission.controller';

const route = new Hono();

route.get('internal/commission', CommissionController.internalCommission);
route.get('implementator/commission', CommissionController.implementatorCommission);
route.get('manager/commission', CommissionController.managerCommission);

export default route;
