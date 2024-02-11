import React from 'react'
import { Props } from './src'
import App from './src/App'
import Login from './src/Login'

const routes = {
    "/": App,
    "/login": Login
}

const StaticRouter = (url: string, props: Props<unknown>) => {
const Page = routes[url]
  return (
    <div>
        {Page ? <Page {...props}/> : (
            <h1>
                Not Found
            </h1>
        )}
    </div>
  )
}

export default StaticRouter
