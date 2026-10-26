import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { enableDesktopAuth } from "./desktop-auth.js";

const params = new URLSearchParams(window.location.search);

if (params.get("embed") === "uni") {
  document.documentElement.dataset.unico = "true";
  enableDesktopAuth();
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
