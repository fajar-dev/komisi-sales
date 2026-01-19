import { Hono } from 'hono'
import { PORT } from './config/config';
import { checkConnection } from './config/database';
import { IsService } from './service/is.service.';

const app = new Hono()
checkConnection()

app.get('/', async (c) => {
  const accountManager = await IsService.getAccountManager()
  return c.json({ message: 'Sync IS to Nusacontact', accountManager })
});


// Start server
export default {
  port: PORT,
  fetch: app.fetch,
};

console.log(`🚀 Server running on http://localhost:${PORT}`);