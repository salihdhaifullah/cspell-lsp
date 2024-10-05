import * as cp from 'child_process';
import * as rpc from 'vscode-jsonrpc/node';
import { Diagnostic, InitializeParams, InitializeResult } from 'vscode-languageserver/node';

interface ServerOptions {
    command: string;
    args: string[];
}

interface ClientOptions {
    initializationOptions: {
        home: string;
    };
}

export default class LanguageClient {
    private childProcess: cp.ChildProcess;
    private connection: rpc.MessageConnection;
    private notificationHandlers: Map<string, (params: any) => void>;

    public initializeResult: InitializeResult;
    public push_diagnostics: Diagnostic[];

    constructor(public id: string, public rootUri: string, public name: string, public serverOptions: ServerOptions, public clientOptions: ClientOptions) {
        this.childProcess = cp.spawn(this.serverOptions.command, this.serverOptions.args)

        if (this.childProcess.stdout === null || this.childProcess.stdin === null || this.childProcess.stderr === null) throw new Error("invalid child proccess")

        this.childProcess.stdout.on('data', (data) => {
            console.log(`[Server Output] ${data.toString()}`);
        });

        this.childProcess.stderr.on('data', (data) => {
            console.error(`[Server Error] ${data.toString()}`);
        });

        this.connection = rpc.createMessageConnection(
            new rpc.StreamMessageReader(this.childProcess.stdout),
            new rpc.StreamMessageWriter(this.childProcess.stdin)
        );

        this.connection.listen();
        this.setupListeners();
        this.notificationHandlers = new Map();
        this.push_diagnostics = [];
    }

    private setupListeners() {
        this.connection.onNotification((method, params) => {
            console.log(`Notification received: ${method}`, params);
            const handler = this.notificationHandlers.get(method);

            if (method === "textDocument/publishDiagnostics") {
                // @ts-ignore
                this.push_diagnostics = params.diagnostics;
                return;
            }

            if (handler) {
                console.log("calling the handler " + method)
                handler(params);
            }
        });

        this.childProcess.on('error', (error) => {
            console.error('Error starting the language server:', error);
        });

        this.childProcess.on('exit', (code) => {
            console.log(`Language server exited with code: ${code}`);
        });
    }

    async start() {
        const initParams: InitializeParams = {
            processId: process.pid,
            rootUri: this.rootUri,
            initializationOptions: this.clientOptions.initializationOptions,
            capabilities: {
                textDocument: {
                    synchronization: {
                        willSave: true,
                        willSaveWaitUntil: true,
                        didSave: true,
                    },
                    completion: {
                        dynamicRegistration: true,
                    },
                    hover: {
                        dynamicRegistration: true,
                    },
                    signatureHelp: {
                        dynamicRegistration: true,
                    },
                    references: {
                        dynamicRegistration: true,
                    },
                    definition: {
                        dynamicRegistration: true,
                    },
                    typeDefinition: {
                        dynamicRegistration: true,
                    },
                    implementation: {
                        dynamicRegistration: true,
                    },
                    documentSymbol: {
                        dynamicRegistration: true,
                    },
                    codeAction: {
                        dynamicRegistration: true,
                    },
                },
                workspace: {
                    applyEdit: true,
                    workspaceEdit: {
                        documentChanges: true,
                    },
                },
            }
        };

        this.initializeResult = await this.connection.sendRequest('initialize', initParams) as InitializeResult;
        await this.connection.sendNotification('initialized');
    }

    async sendNotification(method: string, params?: any) {
        await this.connection.sendNotification(method, params);
    }

    async sendRequest(method: string, params?: any): Promise<any> {
        return await this.connection.sendRequest(method, params);
    }

    async stop() {
        await this.connection.sendRequest('shutdown');
        await this.connection.sendNotification('exit');
        this.connection.dispose();
        this.childProcess.kill();
        console.log("Language server stopped.");
    }

    onNotification(method: string, handler: (params: any) => void) {
        this.notificationHandlers.set(method, handler);
    }
}
