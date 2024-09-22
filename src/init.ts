import { createConnection, TextDocuments, ProposedFeatures, InitializeParams, TextDocumentSyncKind, InitializeResult } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import CspellApi from "./cspell";
import { lstatSync } from 'fs';

export const connection = createConnection(ProposedFeatures.all);
export const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);
export const cspell = new CspellApi();

function readHome(options?: any) {
    if (options !== undefined && typeof options.home === "string") {
        const stats = lstatSync(options.home).isDirectory() 
        if (!stats) throw new Error("home argument is not a valid directory")
    } else throw new Error("unspecified home path")

    return options.home as string;
}

connection.onInitialize(async (parmas: InitializeParams) => {
    try {
        const home = readHome(parmas.initializationOptions)
        await cspell.setup(home);
    } catch (error) {
        if (error instanceof Error) {
            connection.console.error('Error: ' + error.message);
            connection.console.error('Stack trace:' + error.stack);
        }
        else connection.console.error('Unknown error:' + error);
        
        process.exit(1);
    }

    const result: InitializeResult = {
        capabilities: {
            textDocumentSync: TextDocumentSyncKind.Incremental,
            codeActionProvider: true,
            diagnosticProvider: {
                identifier: "cspell",
                interFileDependencies: false,
                workspaceDiagnostics: true 
            },
            executeCommandProvider: {
                commands: ['cspell/addToUserSettings']
            }
        }
    };

    return result;
});
