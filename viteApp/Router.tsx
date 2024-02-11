import React from 'react'
import { Props } from './src'

const routes = {
    "/": import("./src/App"),
    "/login": import("./src/Login")
}

const Router = async (url: string, props: Props<unknown>) => {
const Page = (await routes[url]).default
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

export default Router
