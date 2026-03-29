import OdooSessionManager from './src/app/odoo/index.js';

async function main() {
    const odoo = new OdooSessionManager();
    const locs = await odoo.getInventoryLocations();
    console.log(JSON.stringify(locs.slice(0, 5), null, 2));
}

main().catch(console.error);
