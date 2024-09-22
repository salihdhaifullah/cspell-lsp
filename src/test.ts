import { readFileSync } from "fs";
import { assert } from "console";
import CspellApi from "./cspell"
import path from "path";



async function init() {
    const cspell = await new CspellApi().setup(process.env.PWD!);
    testSuggestions(cspell)
    testDiagnostics(cspell)
}

async function testSuggestions(cspell: CspellApi) { 
    const filepath = path.join(process.env.PWD!, "test.txt");
    const text = readFileSync(filepath, 'utf8');  
    const issues = await cspell.checkSpelling({ uri: filepath, text: text, languageId: "plaintext" }) 
   
    assert(issues[0].suggestions !== undefined, `no suggestions found for ${issues[0].text}`)
    assert(issues[1].suggestions !== undefined, `no suggestions found for ${issues[1].text}`)
    assert(issues[2].suggestions !== undefined, `no suggestions found for ${issues[2].text}`)

    assert(issues[0].suggestions?.length === 8, `suggestions are not 8 for ${issues[0].text}`)
    assert(issues[1].suggestions?.length === 8, `suggestions are not 8 for ${issues[1].text}`)
    assert(issues[2].suggestions?.length === 8, `suggestions are not 8 for ${issues[2].text}`)
}

async function testDiagnostics(cspell: CspellApi) {
    const filepath = path.join(process.env.PWD!, "test.txt");
    const text = readFileSync(filepath, 'utf8');  
    let issues = await cspell.checkSpelling({ uri: filepath, text: text, languageId: "plaintext" }) 

    assert(issues.length === 3, `Expected 3 spelling issues, but found ${issues.length}`);

    assert(issues[0].text === "hellx", `Expected first issue to be "hellx", but found "${issues[0].text}"`);

    assert(issues[1].text === "abcx", `Expected second issue to be "abcx", but found "${issues[1].text}"`);

    assert(issues[2].text === "dowq", `Expected third issue to be "dowq", but found "${issues[2].text}"`);

    await cspell.addWordToWhiteList("hellx")

    issues = await cspell.checkSpelling({ uri: filepath, text: text, languageId: "typescript" })

    assert(issues.length === 2, `Expected 2 spelling issues, but found ${issues.length}`);

    assert(issues[0].text === "abcx", `Expected first issue to be "abcx", but found "${issues[0].text}"`);

    assert(issues[1].text === "dowq", `Expected second issue to be "dowq", but found "${issues[1].text}"`);

    await cspell.addWordToWhiteList("abcx")

    issues = await cspell.checkSpelling({ uri: filepath, text: text, languageId: "typescript" })

    assert(issues.length === 1, `Expected 1 spelling issue, but found ${issues.length}`);

    assert(issues[0].text === "dowq", `Expected the remaining issue to be "dowq", but found "${issues[0].text}"`);

    await cspell.addWordToWhiteList("dowq")

    issues = await cspell.checkSpelling({ uri: filepath, text: text, languageId: "typescript" })

    assert(issues.length === 0, `Expected no spelling issues, but found ${issues.length}`);
}

init()
