import { Hono } from 'hono';
import { CommissionController } from '../controller/commission.controller';

const route = new Hono();

route.get('internal/:id/commission', CommissionController.internalCommission);
route.get('implementator/:id/commission', CommissionController.implementatorCommission);
export default route;
