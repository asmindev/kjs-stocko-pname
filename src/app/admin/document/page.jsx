export const dynamic = "force-dynamic";
import React from "react";
import { getDocuments } from "./actions";
import DocumentsTable from "./components/TableColumn";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function page() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.is_admin) {
        return (
            <div>
                <h1>Access Denied</h1>
                <p>You do not have permission to view this page.</p>
            </div>
        );
    }
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
