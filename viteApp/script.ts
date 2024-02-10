import { render } from './src/entry-server.jsx'

let template = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="/public/entry-client.css" />
    <title>Vite + React + TS</title>
    <!--app-head-->
  </head>
  <body>
    <div id="root"><!--app-html--></div>
    <script type="module" src="/public/entry-client.js"></script>
    <script>
        const events = new EventSource("/events")
        events.addEventListener("reload", e => {
          window.location.reload()
        })
    </script>
  </body>
</html>
`

// need to serve static dist
function RenderHtml(url: string) {
  try {
    const rendered = render(url)

    const html = template
      .replace(`<!--app-head-->`, rendered.head ?? '')
      .replace(`<!--app-html-->`, rendered.html ?? '')

    return html
  } catch (e) {
    console.log(e.stack)
  }
}

globalThis["RenderHtml"] = RenderHtml
