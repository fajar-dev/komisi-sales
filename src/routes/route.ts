import { Hono } from 'hono';
import { CommissionController } from '../controller/commission.controller';

const route = new Hono();

route.get('/employee', (c) => c.text('Hello World'));
route.get('internal/am/invoice', CommissionController.amNusaworkInvoice);
route.get('internal/am/chart', CommissionController.amNusaworkCommissionChart);

export default route;
