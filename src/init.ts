import { createConnection, TextDocuments, ProposedFeatures, InitializeParams, TextDocumentSyncKind, InitializeResult } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import CspellApi from "./cspell";
export const connection = createConnection(ProposedFeatures.all);
export const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);
export const cspell = new CspellApi();

connection.onInitialize(async (_: InitializeParams) => {
    try {
        await cspell.setup();
    } catch (error) {
        if (error instanceof Error) {
            connection.console.error('Error: ' + error.message);
            connection.console.error('Stack trace:' + error.stack);
        }
        else connection.console.error('Unknown error:' + error);
    }

    const result: InitializeResult = {
        capabilities: {
            textDocumentSync: TextDocumentSyncKind.Incremental,
            codeActionProvider: true,
            diagnosticProvider: {
                interFileDependencies: false,
                workspaceDiagnostics: false 
            },
            executeCommandProvider: {
                commands: ['addToUserSettings']
            }
        }
    };

    return result;
});
