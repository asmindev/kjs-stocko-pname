import { NextResponse } from 'next/server';
import OdooSessionManager from '../../odoo/index.js';

export async function GET() {
    try {
        const odoo = new OdooSessionManager({ 
            email: 'fachmi.maasy@technoindo.com', 
            password: 'Aldev@r08919'
        });
        await odoo.connect();
        const locs = await odoo.getInventoryLocations();
        return NextResponse.json({ success: true, locs: locs.slice(0, 5) });
    } catch (e) {
        return NextResponse.json({ success: false, error: e.message, stack: e.stack });
    }
}
