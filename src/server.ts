import { Diagnostic, DocumentDiagnosticReportKind, type DocumentDiagnosticReport, CodeActionParams, CodeAction, CodeActionKind, TextEdit } from 'vscode-languageserver/node';
import { connection, documents } from './init';
import { addToUserSettings, validateTextDocument } from './helper';

connection.onExecuteCommand(async (params) => {
    const { command, arguments: args } = params;

    if (command === 'cspell/addToUserSettings') {
        if (args === undefined || args[0] === undefined || typeof (args[0].word) !== "string" || typeof (args[0].uri) !== "string") {
            connection.console.error("missing arguments for command cspell/addToUserSettings");
            process.exit(1);
        } 
        await addToUserSettings(args[0].word, args[0].uri)
    }
});

connection.onCodeAction((params: CodeActionParams): CodeAction[] => {
    const codeActions: CodeAction[] = [];
    for (const suggestion of (params.context.diagnostics[0].data.suggestions as string[])) {
        codeActions.push({
            title: suggestion,
            kind: CodeActionKind.QuickFix,
            edit: {
                changes: {
                    [params.textDocument.uri]: [
                        TextEdit.replace(params.context.diagnostics[0].range, suggestion)
                    ]
                }
            }
        })
    }


    codeActions.push({
        title: `Add: "${params.context.diagnostics[0].data.word}" to user settings`,
        kind: CodeActionKind.QuickFix,
        command: {
            title: "add word to user settings",
            command: 'cspell/addToUserSettings',
            arguments: [{ word: params.context.diagnostics[0].data.word, uri: params.textDocument.uri }]
        }
    });

    return codeActions;
});

async function getDiagnostics(uri: string) {
    const document = documents.get(uri);
    const diagnostics = { kind: DocumentDiagnosticReportKind.Full, items: [] as Diagnostic[] } satisfies DocumentDiagnosticReport;

    if (document) diagnostics.items = await validateTextDocument(document)
    else { 
        connection.console.error(`error document ${uri} not found`);
        process.exit(1);
    }

    return diagnostics;
}

connection.languages.diagnostics.on(async (params) => await getDiagnostics(params.textDocument.uri));


documents.listen(connection);
connection.listen();
