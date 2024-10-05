#!/usr/bin/env node
import { CodeActionParams } from 'vscode-languageserver/node';
import { connection, documents } from './init';
import { addToUserSettingsCommend, getCodeActions, getPullDiagnostics, HandleError, refreshDiagnostics } from './helper';

let supportPullDiagnostics = false;

documents.onDidChangeContent(async (arg) => {
    if (supportPullDiagnostics) return;
    try {
        await refreshDiagnostics(arg.document.uri);
    } catch (error) {
        HandleError(error)
    }
});

documents.onDidOpen(async (arg) => {
    if (supportPullDiagnostics) return;
    try {
        await refreshDiagnostics(arg.document.uri);
    } catch (error) {
        HandleError(error)
    }
});

connection.onExecuteCommand(async (params) => {
    try {
        await addToUserSettingsCommend(params)
    } catch (error) {
        HandleError(error)
    }
});

connection.languages.diagnostics.on(async (params) => {
    try {
        supportPullDiagnostics = true;
        return await getPullDiagnostics(params.textDocument.uri)
    } catch (error) {
        HandleError(error)
    }
});

connection.onCodeAction((params: CodeActionParams) => {
    try {
        return getCodeActions(params)
    } catch (error) {
        HandleError(error)
    }
});

documents.listen(connection);
connection.listen();
