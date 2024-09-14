import { readFileSync } from "fs";
import { assert } from "console";
import CspellApi from "./cspell"


async function init() {
    const cspell = await new CspellApi().setup();
    testSuggestions(cspell)
    testDiagnostics(cspell)
}

async function testSuggestions(cspell: CspellApi) { 
    const path = "/home/salih/Desktop/progrims/cspell-lsp/src/server.ts";
    const text = readFileSync(path, 'utf8');  // Read the content of the file as a string
    let issues = await cspell.checkSpelling({ uri: path, text: text, languageId: "typescript" })  // Check for spelling issues in the TypeScript file
   
    assert(issues[0].suggestions !== undefined, `no suggestions found for ${issues[0].text}`)
    assert(issues[1].suggestions !== undefined, `no suggestions found for ${issues[1].text}`)
    assert(issues[2].suggestions !== undefined, `no suggestions found for ${issues[2].text}`)

    assert(issues[0].suggestions?.length === 8, `suggestions are not 8 for ${issues[0].text}`)
    assert(issues[1].suggestions?.length === 8, `suggestions are not 8 for ${issues[1].text}`)
    assert(issues[2].suggestions?.length === 8, `suggestions are not 8 for ${issues[2].text}`)
}

async function testDiagnostics(cspell: CspellApi) {
    const path = "/home/salih/Desktop/progrims/cspell-lsp/src/server.ts";
    const text = readFileSync(path, 'utf8');  // Read the content of the file as a string
    let issues = await cspell.checkSpelling({ uri: path, text: text, languageId: "typescript" })  // Check for spelling issues in the TypeScript file

    assert(issues.length === 3, `Expected 3 spelling issues, but found ${issues.length}`);

    assert(issues[0].text === "hellx", `Expected first issue to be "hellx", but found "${issues[0].text}"`);

    assert(issues[1].text === "abcx", `Expected second issue to be "abcx", but found "${issues[1].text}"`);

    assert(issues[2].text === "fucx", `Expected third issue to be "fucx", but found "${issues[2].text}"`);

    await cspell.addWordToWhiteList("hellx")

    issues = await cspell.checkSpelling({ uri: path, text: text, languageId: "typescript" })

    assert(issues.length === 2, `Expected 2 spelling issues, but found ${issues.length}`);

    assert(issues[0].text === "abcx", `Expected first issue to be "abcx", but found "${issues[0].text}"`);

    assert(issues[1].text === "fucx", `Expected second issue to be "fucx", but found "${issues[1].text}"`);

    await cspell.addWordToWhiteList("abcx")

    issues = await cspell.checkSpelling({ uri: path, text: text, languageId: "typescript" })

    assert(issues.length === 1, `Expected 1 spelling issue, but found ${issues.length}`);

    assert(issues[0].text === "fucx", `Expected the remaining issue to be "fucx", but found "${issues[0].text}"`);

    await cspell.addWordToWhiteList("fucx")

    issues = await cspell.checkSpelling({ uri: path, text: text, languageId: "typescript" })

    assert(issues.length === 0, `Expected no spelling issues, but found ${issues.length}`);
}
// write test for suggestions
init()
