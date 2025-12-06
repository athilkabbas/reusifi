import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'
import reportWebVitals from './reportWebVitals'
import Provider from './context/provider'
import { ConfigProvider } from 'antd'

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
  <ConfigProvider
    theme={{
      token: {
        fontFamily:
          'Geist, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
        fontFamilyCode:
          'Geist Mono, source-code-pro, Menlo, Monaco, Consolas, "Courier New", monospace',
      },
    }}
  >
    <Provider>
      <App />
    </Provider>
  </ConfigProvider>
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
