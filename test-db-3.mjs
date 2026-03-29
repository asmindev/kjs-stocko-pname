import { OdooSessionManager } from './src/lib/sessionManager.js'
import { getAllInventoryIdsByType } from './src/app/admin/dashboard/services/actions.js'

async function main() {
  const odoo = await OdooSessionManager.getClient(1, "admin@example.com") // Or whatever session credentials
  const ids = await getAllInventoryIdsByType(odoo, "annual");
  console.log('Annual IDs:', ids)
}
main()
