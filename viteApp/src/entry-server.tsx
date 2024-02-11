import React from 'react'
import ReactDOMServer from 'react-dom/server'
import { Props } from '.'
import StaticRouter from '../staticRouter'

export function render(url: string, props: Props<unknown>) {
  const Page = StaticRouter(url, props)

  const html = ReactDOMServer.renderToString(
    <React.StrictMode>
      {Page}
    </React.StrictMode>
  )
  return { html, head: "" }
}
