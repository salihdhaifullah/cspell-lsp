import assert from 'assert';
import { readFileSync } from 'fs';
import path from 'path';
import { TextEdit } from 'vscode-languageserver';
import { DiagnosticSeverity } from 'vscode-languageserver';
import { CodeActionKind } from 'vscode-languageserver';
import { CodeAction } from 'vscode-languageserver';
import { TextDocumentSyncKind } from 'vscode-languageserver';
import LanguageClient from "./lsp-client";

const client = new LanguageClient(
    'cspell',
    process.env.PWD!,
    'CSpell LSP Test Client',
    {
        command: 'node',
        args: ['dist/server.js', '--stdio']
    },
    {
        initializationOptions: {
            home: process.env.PWD!
        }
    }
);

export default async function TestLsp() {
    await client.start();

    if (!client.initializeResult) throw new Error("no initialize result");

    console.log("Client is ready");

    initializationTest();
    await PushDiagnosticsTest();
    await ChangeContentTest();
    await PullDiagnosticsTest();
    await CodeActionsTest();
    await ExecuteCodeActionTest();
    await ExecuteCommendTest();


    await client.stop();
    console.log("All tests passed and client stopped");
}


function initializationTest() {
    const { capabilities } = client.initializeResult!

    assert.strictEqual(capabilities.textDocumentSync, TextDocumentSyncKind.Incremental, 'TextDocumentSync should be incremental (2)');
    assert.strictEqual(capabilities.codeActionProvider, true, 'CodeActionProvider should be enabled (true)');

    assert.strictEqual(
        capabilities.diagnosticProvider?.identifier,
        'cspell',
        'DiagnosticProvider identifier should be "cspell"'
    );
    assert.strictEqual(
        capabilities.diagnosticProvider?.interFileDependencies,
        false,
        'DiagnosticProvider interFileDependencies should be false'
    );
    assert.strictEqual(
        capabilities.diagnosticProvider?.workspaceDiagnostics,
        true,
        'DiagnosticProvider workspaceDiagnostics should be true'
    );

    assert.strictEqual(
        capabilities.executeCommandProvider?.commands.includes('cspell/addToUserSettings'),
        true,
        'ExecuteCommandProvider should include "cspell/addToUserSettings"'
    );

    console.log("All initialization tests passed");
}


async function OpenBuffer() {
    const testFilePath = path.join(process.env.PWD!, "test/test3.txt");
    const testDocumentText = readFileSync(testFilePath, 'utf8');

    const testDocumentUri = `file://${testFilePath}`; // Create the URI from the file path

    await client.sendNotification('textDocument/didOpen', {
        textDocument: {
            uri: testDocumentUri,
            languageId: 'plaintext',
            version: 1,
            text: testDocumentText
        }
    });
}

async function sleep(time: number) {
    return await new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(null)
        }, time);
    });
}
async function PushDiagnosticsTest() {
    await OpenBuffer();
    await sleep(2000);

    console.log(client.push_diagnostics)
    assert(Array.isArray(client.push_diagnostics), 'Diagnostics should be an array.');
    assert(client.push_diagnostics.length === 1, 'No diagnostics received.');

    assert.strictEqual(client.push_diagnostics[0].severity, DiagnosticSeverity.Warning, 'Expected severity to be Warning.');
    assert.strictEqual(client.push_diagnostics[0].message, '"typao": Unknown word.', 'Unexpected diagnostic message.');
    assert(client.push_diagnostics[0].data.suggestions, 'Expected suggestions to be present.');
    assert.strictEqual(client.push_diagnostics[0].data.suggestions.length, 8, 'Expected 8 suggestions for "typao".');

    console.log('push diagnostics passed');
}

async function ChangeContentTest() {
    const testFilePath = path.join(process.env.PWD!, "test/test3.txt");
    const testDocumentText = readFileSync(testFilePath, 'utf8').replace('typao', 'typo'); // Change the misspelled word

    const testDocumentUri = `file://${testFilePath}`; // Create the URI from the file path

    client.sendNotification('textDocument/didChange', {
        textDocument: {
            uri: testDocumentUri,
            version: 2
        },
        contentChanges: [{
            text: testDocumentText
        }]
    });

    await sleep(2000);
    assert(Array.isArray(client.push_diagnostics), 'Diagnostics should be an array.');
    assert(client.push_diagnostics.length === 0, 'There should be no diagnostics after correction.');

    console.log('Change content test passed');
}

async function PullDiagnosticsTest() {
    const testFilePath = path.join(process.env.PWD!, "test/test3.txt");
    const testDocumentUri = `file://${testFilePath}`;

    const testDocumentText = readFileSync(testFilePath, 'utf8')

    await client.sendNotification('textDocument/didChange', {
        textDocument: {
            uri: testDocumentUri,
            version: 3
        },
        contentChanges: [{
            text: testDocumentText
        }]
    });

    const params = {
        textDocument: {
            uri: testDocumentUri
        }
    };

    const diagnostics = (await client.sendRequest('textDocument/diagnostic', params)).items;

    assert(Array.isArray(diagnostics), 'Diagnostics should be an array.');
    assert(diagnostics.length === 1, 'No diagnostics received.');

    assert.strictEqual(diagnostics[0].severity, DiagnosticSeverity.Warning, 'Expected severity to be Warning.');
    assert.strictEqual(diagnostics[0].message, '"typao": Unknown word.', 'Unexpected diagnostic message.');
    assert(diagnostics[0].data.suggestions, 'Expected suggestions to be present.');
    assert.strictEqual(diagnostics[0].data.suggestions.length, 8, 'Expected 8 suggestions for "typao".');

    console.log('Pull diagnostics test passed');
}


function getUri() {
    const testFilePath = path.join(process.env.PWD!, "test/test3.txt");
    const testDocumentUri = `file://${testFilePath}`; // Create the URI from the file path
    return testDocumentUri
}

async function getCodeActions() {
    const testFilePath = path.join(process.env.PWD!, "test/test3.txt");
    const testDocumentUri = `file://${testFilePath}`; // Create the URI from the file path

    const params = {
        textDocument: {
            uri: testDocumentUri
        },
        range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 34 }
        },
        context: {
            diagnostics: client.push_diagnostics,
        }
    };

    const codeActions = await client.sendRequest('textDocument/codeAction', params) as CodeAction[];

    return codeActions;
}

async function CodeActionsTest() {
    const codeActions = await getCodeActions();
    console.log(codeActions)
    assert(Array.isArray(codeActions), 'Code actions should be an array.');

    assert.strictEqual(codeActions.length, 9, 'Expected code actions to be 9');

    codeActions.forEach((action, index) => {
        assert(action.title, `Expected action at index ${index} to have a title.`);
        assert(action.kind, `Expected action at index ${index} to have a kind.`);

        assert.strictEqual(action.kind, CodeActionKind.QuickFix, `Expected action at index ${index} to be of kind "QuickFix".`);

        if (index < 8) {
            assert(action.edit, `Expected action at index ${index} to have an edit property.`);
            assert(action.edit.changes, `Expected action at index ${index} to have changes in edit property.`);
            assert(Object.keys(action.edit.changes).length > 0, `Expected action at index ${index} to have changes.`);
        }
    });

    const addToUserSettingsAction = codeActions[8];

    assert.strictEqual(addToUserSettingsAction.title, 'Add: "typao" to user settings');
    assert.strictEqual(addToUserSettingsAction.kind, CodeActionKind.QuickFix, `Expected addToUserSettingsAction to be of kind "QuickFix".`);
    assert(addToUserSettingsAction.command, 'Expected an action with a command.');
    assert.strictEqual(addToUserSettingsAction.command.title, 'add word to user settings', 'Expected an "Add to user settings" action to be present.');
    assert.strictEqual(addToUserSettingsAction.command.command, 'cspell/addToUserSettings', 'Expected the command to be "cspell/addToUserSettings".');
    assert.deepStrictEqual(addToUserSettingsAction.command.arguments![0], { word: 'typao', uri: getUri() }, 'Expected the correct arguments for "Add to user settings" action.');

    console.log('Code actions test passed');
}

async function ExecuteCodeActionTest() {
    const codeActions = await getCodeActions();

    const editAction = codeActions[0];

    const changes = editAction.edit?.changes!;

    const uri = Object.keys(changes)[0];
    const edits = changes[uri] as TextEdit[];

    const testFilePath = path.join(process.env.PWD!, "test/test3.txt");
    let testDocumentText = readFileSync(testFilePath, 'utf8');

    for (const edit of edits) {
        const start = edit.range.start.character;
        const end = edit.range.end.character;
        const replacementText = edit.newText;

        testDocumentText = testDocumentText.slice(0, start) + replacementText + testDocumentText.slice(end);
    }

    await client.sendNotification('textDocument/didChange', {
        textDocument: {
            uri: uri,
            version: 4
        },
        contentChanges: [{
            text: testDocumentText
        }]
    });

    const diagnostics = (await client.sendRequest('textDocument/diagnostic', { textDocument: { uri: uri } })).items;

    assert(Array.isArray(diagnostics), 'Diagnostics should be an array.');
    assert.strictEqual(diagnostics.length, 0, 'Expected no diagnostics after executing the code action.');

    console.log('Execute code action test passed!');
}

async function ExecuteCommendTest() {
    const testFilePath = path.join(process.env.PWD!, "test/test3.txt");
    const testDocumentUri = `file://${testFilePath}`; // Create the URI from the file path

    const testDocumentText = readFileSync(testFilePath, 'utf8');

    await client.sendNotification('textDocument/didChange', {
        textDocument: {
            uri: testDocumentUri,
            version: 5
        },
        contentChanges: [{
            text: testDocumentText
        }]
    });

    let params = {
        command: 'cspell/addToUserSettings',
        arguments: [{ uri: testDocumentUri, word: "helloax" }]
    };

    await client.sendRequest('workspace/executeCommand', params);

    const diagnostics = (await client.sendRequest('textDocument/diagnostic', { textDocument: { uri: testDocumentUri } })).items;

    assert(Array.isArray(diagnostics), 'Diagnostics should be an array.');
    assert(diagnostics.length === 1, 'should be one diagnostic');

    assert.strictEqual(diagnostics[0].severity, DiagnosticSeverity.Warning, 'Expected severity to be Warning.');
    assert.strictEqual(diagnostics[0].message, '"typao": Unknown word.', 'Unexpected diagnostic message.');
    assert(diagnostics[0].data.suggestions, 'Expected suggestions to be present.');
    assert.strictEqual(diagnostics[0].data.suggestions.length, 8, 'Expected 8 suggestions for "typao".');

    const codeActions = await getCodeActions();

    params = {
        command: codeActions[8].command?.command!,
        arguments: codeActions[8].command?.arguments as any
    };

    await client.sendRequest('workspace/executeCommand', params);

    await sleep(2000);

    assert(Array.isArray(client.push_diagnostics), 'Diagnostics should be an array.');
    // @ts-ignore
    assert(client.push_diagnostics.length === 0, 'There should be no push diagnostics after calling add to user settings commend');

    console.log('Execute commend test passed');
}
