/**
 * Summary statistics cards component
 */
export function SummaryStats({ systemQty, scannedQty, diffQty, currentTotal }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-50 rounded-lg p-3 text-center">
                <div className="text-xs text-muted-foreground">Qty Sistem</div>
                <div className="text-xl font-bold">{systemQty}</div>
            </div>

            <div className="bg-blue-50 rounded-lg p-3 text-center">
                <div className="text-xs text-muted-foreground">Scan Odoo</div>
                <div className="text-xl font-bold text-blue-600">
                    {scannedQty}
                </div>
            </div>

            <div className="bg-green-50 rounded-lg p-3 text-center">
                <div className="text-xs text-muted-foreground">
                    Selisih (Diff)
                </div>
                <div className="text-xl font-bold text-green-600">
                    {diffQty || 0}
                </div>
            </div>

            <div className="bg-indigo-50 rounded-lg p-3 text-center border border-indigo-100">
                <div className="text-xs font-semibold text-indigo-800">
                    TOTAL SAAT INI
                </div>
                <div className="text-2xl font-black text-indigo-700">
                    {currentTotal}
                </div>
            </div>
        </div>
    );
}
