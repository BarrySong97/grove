/**
 * @purpose Bootstraps the React application into the Vite root element.
 * @role    Frontend entrypoint that mounts App under React StrictMode.
 * @deps    React, ReactDOM, src/app/App.tsx, src/index.css
 * @gotcha  Keep this file thin; app composition belongs in docs/modules/app/README.md
 */
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app/App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
