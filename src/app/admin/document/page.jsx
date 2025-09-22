import React from "react";
import { getDocuments } from "./actions";
import DocumentsTable from "./components/TableColumn";

export default async function page() {
    const documents = await getDocuments();
    return (
        <>
            <div>
                <h1 className="text-2xl font-bold">Documents</h1>
                <p className="text-sm text-muted-foreground">
                    List of all documents has posted di Odoo.
                </p>
            </div>
            <DocumentsTable documents={documents.documents} />
        </>
    );
}
