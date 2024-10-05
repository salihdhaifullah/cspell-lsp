import { readFileSync } from "fs";
import CspellApi from "../src/cspell";
import path from "path";
import assert from 'assert';

export default async function CspellTest() {
    const cspell = await new CspellApi().setup(process.env.PWD!);
    await testSuggestions(cspell);
    await testDiagnostics(cspell);
    await testSameRepeatedDiagnostics(cspell);
}

async function testSuggestions(cspell: CspellApi) {
    const filepath = path.join(process.env.PWD!, "test/test.txt");
    const text = readFileSync(filepath, 'utf8');
    const issues = await cspell.checkSpelling({ uri: filepath, text: text, languageId: "plaintext" });

    issues.forEach((issue, index) => {
        assert(issue.suggestions !== undefined, `No suggestions found for "${issue.text}" at index ${index}`);
        assert(Array.isArray(issue.suggestions) && issue.suggestions.length === 8, 
            `Expected 8 suggestions for "${issue.text}", but found ${issue.suggestions.length}`);
    });
}

async function testDiagnostics(cspell: CspellApi) {
    const filepath = path.join(process.env.PWD!, "test/test.txt");
    const text = readFileSync(filepath, 'utf8');
    
    let issues = await cspell.checkSpelling({ uri: filepath, text: text, languageId: "plaintext" });

    assert.strictEqual(issues.length, 3, `Expected 3 spelling issues, but found ${issues.length}`);
    assert.strictEqual(issues[0].text, "hellx", `Expected first issue to be "hellx", but found "${issues[0].text}"`);
    assert.strictEqual(issues[1].text, "abcx", `Expected second issue to be "abcx", but found "${issues[1].text}"`);
    assert.strictEqual(issues[2].text, "dowq", `Expected third issue to be "dowq", but found "${issues[2].text}"`);

    await cspell.addWordToWhiteList("hellx");
    issues = await cspell.checkSpelling({ uri: filepath, text: text, languageId: "plaintext" });

    assert.strictEqual(issues.length, 2, `Expected 2 spelling issues, but found ${issues.length}`);
    assert.strictEqual(issues[0].text, "abcx", `Expected first issue to be "abcx", but found "${issues[0].text}"`);
    assert.strictEqual(issues[1].text, "dowq", `Expected second issue to be "dowq", but found "${issues[1].text}"`);

    await cspell.addWordToWhiteList("abcx");
    issues = await cspell.checkSpelling({ uri: filepath, text: text, languageId: "plaintext" });

    assert.strictEqual(issues.length, 1, `Expected 1 spelling issue, but found ${issues.length}`);
    assert.strictEqual(issues[0].text, "dowq", `Expected the remaining issue to be "dowq", but found "${issues[0].text}"`);

    await cspell.addWordToWhiteList("dowq");
    issues = await cspell.checkSpelling({ uri: filepath, text: text, languageId: "plaintext" });

    assert.strictEqual(issues.length, 0, `Expected no spelling issues, but found ${issues.length}`);
}

async function testSameRepeatedDiagnostics(cspell: CspellApi) {
    const filepath = path.join(process.env.PWD!, "test/test2.txt");
    const text = readFileSync(filepath, 'utf8');
    let issues = await cspell.checkSpelling({ uri: filepath, text: text, languageId: "plaintext" });

    assert.strictEqual(issues.length, 22, `Expected 22 spelling issues, but found ${issues.length}`);
    
    issues.forEach((issue, index) => {
        assert.strictEqual(issue.text, "helscs", `Expected word at index ${index} to be "helscs", but found "${issue.text}"`);
    });

    await cspell.addWordToWhiteList("helscs");
    issues = await cspell.checkSpelling({ uri: filepath, text: text, languageId: "plaintext" });

    assert.strictEqual(issues.length, 0, `Expected no spelling issues, but found ${issues.length}`);
}
