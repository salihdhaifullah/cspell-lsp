import { createConnection, TextDocuments, ProposedFeatures, InitializeParams, TextDocumentSyncKind, InitializeResult } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import CspellApi from "./cspell";
import {HandleError, ReadHome} from "./helper";

export const connection = createConnection(ProposedFeatures.all);
export const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);
export const cspell = new CspellApi();

connection.onInitialize(async (parmas: InitializeParams) => {
    try {
        const home = ReadHome(parmas.initializationOptions)
        await cspell.setup(home);
    } catch (error) {
        HandleError(error)
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
