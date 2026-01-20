import { Hono } from 'hono'
import { PORT } from './config/config';
import { checkConnection } from './config/database';
import { Nusawork } from './service/nusawork.service';
import { IsService } from './service/is.service.';

import route from './routes/route';

const app = new Hono()
checkConnection()

app.route('/nusawork', route);

export default {
  port: PORT,
  fetch: app.fetch,
};

console.log(`🚀 Server running on http://localhost:${PORT}`);