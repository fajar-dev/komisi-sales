import { Hono } from 'hono'
import { PORT } from './config/config';
import { checkConnection } from './config/database';
import { Nusawork } from './service/nusawork.service';
import { IsService } from './service/is.service.';

const app = new Hono()
checkConnection()

app.get('/', async (c) => {
  // const accountManager = await Nusawork.getAccountManager()
  // return c.json(accountManager)

  // const products = await IsService.getProducts()
  // return c.json(products)

  // const customerServices = await IsService.getCustomerServicesByAccountManager('0202560')
  // return c.json(customerServices)

  const invoice = await IsService.getInvoiceNusawork('0202428', '2025-01-01', '2025-12-31',  'solo')
  return c.json(invoice)
});


// Start server
export default {
  port: PORT,
  fetch: app.fetch,
};

console.log(`🚀 Server running on http://localhost:${PORT}`);