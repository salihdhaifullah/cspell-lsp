import './index.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { Props } from '.'
import Router from '../Router'


const props = window["Props"] as Props<unknown>
const Page = await Router(window.location.pathname, props)

ReactDOM.hydrateRoot(
  document.getElementById('root') as HTMLElement,
  <React.StrictMode>
    {Page}
  </React.StrictMode>
)
