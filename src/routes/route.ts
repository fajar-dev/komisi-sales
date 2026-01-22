import { Hono } from 'hono';
import { CommissionController } from '../controller/commission.controller';

const route = new Hono();

route.get('/employee', (c) => c.text('Hello World'));
route.get('nusawork/am/invoice', CommissionController.amNusaworkInvoice);

// route.get('nusawork/am/chart', NusaworkController.commissionAccountManagerChart);
// route.get('nusawork/sm', NusaworkController.comissionSalesManager);

export default route;
