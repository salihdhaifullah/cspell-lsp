import fs from "fs";
const res = fs.readdirSync("./src");
console.log("hello world", res);

// const isProduction = process.env.NODE_ENV === 'production'

// const templateHtml = isProduction
    // ? await fs.readFile('./dist/client/index.html', 'utf-8')
    // : ''



// // need to serve static dist
// async function RenderHtml(url) {
//     try {
//         let template
//         let render
//         if (!isProduction) {
//             // Always read fresh template in development
//             template = await fs.readFile('./index.html', 'utf-8')
//             const { createServer } = await import('vite')
//             const vite = await createServer({
//                 server: { middlewareMode: true },
//                 appType: 'custom',
//                 base
//             })
//             template = await vite.transformIndexHtml(url, template)
//             render = (await vite.ssrLoadModule('/src/entry-server.tsx')).render
//         } else {
//             template = templateHtml
//             render = (await import('./dist/server/entry-server.js')).render
//         }

//         const rendered = await render(url, ssrManifest)

//         const html = template
//             .replace(`<!--app-head-->`, rendered.head ?? '')
//             .replace(`<!--app-html-->`, rendered.html ?? '')

//         return html
//     } catch (e) {
//         vite?.ssrFixStacktrace(e)
//         console.log(e.stack)
//     }
// }

// await RenderHtml("/")
