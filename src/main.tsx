import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/index.css'

const themeKey = 'ai-notes-theme'
const savedTheme = localStorage.getItem(themeKey)
const initialTheme =
  savedTheme === 'dark' || savedTheme === 'light'
    ? savedTheme
    : window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
const isDark = initialTheme === 'dark'
document.documentElement.classList.toggle('dark', isDark)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
