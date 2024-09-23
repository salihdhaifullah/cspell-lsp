import * as cspell from 'cspell-lib';
import { join } from "path"
import { appendFileSync, openSync, readFileSync } from 'fs';

interface ICheckSpellingArgs {
    uri: string;
    text: string;
    languageId: string;
}

export default class CspellApi {
    private whiteList: string[] = [];
    private path: string;
    private settings: cspell.CSpellUserSettings;

    constructor() { }

    private createFileIfNotExists() {
        try {
            openSync(this.path, 'wx');
        } catch (error) {
            if (error.code !== 'EEXIST') throw error;
        }
    }

    private getWhiteListPath(home: string) {
        this.path = join(home, ".cspell");
    }


    private initWhiteList() {
        const fileContent = readFileSync(this.path, 'utf8');
        this.whiteList = fileContent.split("\n").map(v => v.trim()).filter(v => v.length > 0);
    }


    private async loadSettings() {
        await cspell.clearCachedFiles()
        const settings = await cspell.getGlobalSettingsAsync()

        settings.words = this.whiteList;
        settings.enabledFileTypes = { "*": true };
        settings.enableFiletypes = ["*"];
        settings.numSuggestions = 8;
        settings.suggestionsTimeout = 1000;
        settings.noConfigSearch = true;
        settings.allowCompoundWords = true;
        settings.maxDuplicateProblems = 10000;
        
        this.settings = settings;
    }

    public async checkSpelling(textDocument: ICheckSpellingArgs) {
        const docs: cspell.Document = { uri: textDocument.uri, text: textDocument.text, languageId: textDocument.languageId, locale: 'en' };

        const result = await cspell.spellCheckDocument(docs, {generateSuggestions: true}, this.settings)

        return result.issues;
    }

    public async addWordToWhiteList(word: string) {
        this.whiteList.push(word);
        appendFileSync(this.path, `${word}\n`);

        await this.loadSettings()
    }

    public async setup(home: string) {
        this.getWhiteListPath(home);
        this.createFileIfNotExists();
        this.initWhiteList();
        await this.loadSettings();
   
        return this;
    }
}
