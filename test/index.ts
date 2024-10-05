import { writeFileSync } from "fs";
import CspellTest from "./cspell_test";
import TestLsp from "./lsp_test";
import path from "path";

async function init() {
    await CspellTest()
    await TestLsp()
}


init().finally(() => {
    writeFileSync(path.join(process.env.PWD!, ".cspell"), "")
});
