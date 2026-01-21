import { Hono } from 'hono';
import { NusaworkController } from '../controller/nusawork.controller';

const nusaworkRoute = new Hono();

nusaworkRoute.get('/sales', NusaworkController.comissionAccountManager);

export default nusaworkRoute;
