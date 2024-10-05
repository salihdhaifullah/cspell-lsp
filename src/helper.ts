import { CodeAction, CodeActionKind, CodeActionParams, Diagnostic, DiagnosticSeverity, DocumentDiagnosticReport, DocumentDiagnosticReportKind, ExecuteCommandParams, TextEdit } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { connection, documents, cspell } from './init';
import { lstatSync } from 'fs';


export async function refreshDiagnostics(uri: string) {
    const document = documents.get(uri);
    if (!document) throw new Error(`error document ${uri} not found`);

    const diagnostics = await validateTextDocument(document)
    await connection.sendDiagnostics({ uri, diagnostics: [] })
    await connection.sendDiagnostics({ uri, diagnostics: diagnostics })
}

export async function addToUserSettings(word: string, uri: string) {
    await cspell.addWordToWhiteList(word);
    await refreshDiagnostics(uri);
};


export async function validateTextDocument(textDocument: TextDocument): Promise<Diagnostic[]> {
    const issues = await cspell.checkSpelling({ uri: textDocument.uri, languageId: textDocument.languageId, text: textDocument.getText() })
    const diagnostics: Diagnostic[] = [];

    for (const issue of issues) {
        const diagnostic: Diagnostic = {
            severity: DiagnosticSeverity.Warning,
            range: {
                start: textDocument.positionAt(issue.offset),
                end: textDocument.positionAt(issue.offset + (issue?.length || 0))
            },
            message: `"${issue.text}": Unknown word.`,
            data: { suggestions: issue.suggestions, word: issue.text },
            source: 'cspell'
        };

        diagnostics.push(diagnostic);
    }

    return diagnostics;
}


export async function getPullDiagnostics(uri: string) {
    const document = documents.get(uri);
    if (!document) throw new Error(`error document ${uri} not found`);

    const diagnostics = {
        kind: DocumentDiagnosticReportKind.Full,
        items: await validateTextDocument(document)
    } satisfies DocumentDiagnosticReport;

    return diagnostics;
}

export function getCodeActions(params: CodeActionParams) {
    const diagnostics = params.context.diagnostics[0];
    if (!diagnostics.data) throw new Error('Invalid diagnostics: "data" is undefined or missing.');
    const diagnosticsData = diagnostics.data;

    if (typeof diagnosticsData.word !== 'string') throw new Error('Invalid data: "word" must be a string.');

    if (!Array.isArray(diagnosticsData.suggestions) || !diagnosticsData.suggestions.every(s => typeof s === 'string'))
        throw new Error('Invalid data: "suggestions" must be an array of strings.');


    const codeActions: CodeAction[] = [];
    for (const suggestion of (diagnosticsData.suggestions)) {
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
        title: `Add: "${diagnosticsData.word}" to user settings`,
        kind: CodeActionKind.QuickFix,
        command: {
            title: "add word to user settings",
            command: 'cspell/addToUserSettings',
            arguments: [{ word: diagnosticsData.word, uri: params.textDocument.uri }]
        }
    });

    return codeActions;
}

export async function addToUserSettingsCommend(params: ExecuteCommandParams) {
    if (params?.arguments === undefined || params.arguments[0] === undefined
        || typeof (params.arguments[0].word) !== "string" || typeof (params.arguments[0].uri) !== "string")
        throw new Error("missing arguments for command cspell/addToUserSettings");

    await addToUserSettings(params.arguments[0].word, params.arguments[0].uri)

}
export function ReadHome(options?: any) {
    if (options === undefined || typeof options?.home !== "string") throw new Error("unspecified home path");

    const stats = lstatSync(options.home).isDirectory();

    if (!stats) throw new Error("home argument is not a valid directory")

    return options.home as string;
}


export function HandleError(error: unknown): never {
    if (error instanceof Error) {
        connection.console.error('Error: ' + error.message);
        connection.console.error('Stack trace: ' + error.stack);
    }
    else connection.console.error('Unknown error: ' + error);

    process.exit(1);
}
