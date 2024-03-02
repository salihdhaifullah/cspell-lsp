import { render } from './src/entry-server.jsx'
import { Props } from './src/index.js'

const GetTemplate = (head: string, app: string, props: string) => {
return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="/public/entry-client.css" />
    <title>Vite + React + TS</title>
    ${head}
  </head>
  <body>
    <div id="root">${app}</div>
    <script type="module" src="/public/entry-client.js"></script>
    <script>
        const events = new EventSource("/events")
        events.addEventListener("reload", e => {
          window.location.reload()
        })
    </script>
      <script>
        window["Props"] = ${props};
      </script>
  </body>
</html>
`
}

function RenderHtml(url: string, propsJson: string) {
  const props = JSON.parse(propsJson) as Props<unknown>
  const rendered = render(url, props)
  const html = GetTemplate(rendered.head, rendered.html, propsJson)
  console.warn(`content length is ${html.length}`)
  return html
}

globalThis["RenderHtml"] = RenderHtml
