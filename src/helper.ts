import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { connection, documents, cspell } from './init';


export async function refreshDiagnostics(uri: string) {
    const document = documents.get(uri);
    if (!document) {
        connection.console.error(`error document ${uri} not found`)
        process.exit(1);
    }

    const diagnostics = await validateTextDocument(document)
    await connection.sendDiagnostics({ uri, diagnostics: [] })
    await connection.sendDiagnostics({ uri, diagnostics: diagnostics })
}

export async function addToUserSettings(word: string, uri: string) {
    try {
        await cspell.addWordToWhiteList(word);
        await refreshDiagnostics(uri);
    } catch (error) {
        if (error instanceof Error) {
            connection.console.error('Error: ' + error.message);
            connection.console.error('Stack trace: ' + error.stack);
        }
        else connection.console.error('Unknown error: ' + error);

        process.exit(1);
    }
};


export async function validateTextDocument(textDocument: TextDocument): Promise<Diagnostic[]> {
    try {
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

    } catch (error) {
        if (error instanceof Error) {
            connection.console.error('Error: ' + error.message);
            connection.console.error('Stack trace: ' + error.stack);
        }
        else connection.console.error('Unknown error: ' + error);

        process.exit(1);
    }
}
