import { Hono } from 'hono';
import { NusaworkController } from '../controller/nusawork.controller';

const nusaworkRoute = new Hono();

nusaworkRoute.get('/commission', NusaworkController.comissionAccountManager);

export default nusaworkRoute;
