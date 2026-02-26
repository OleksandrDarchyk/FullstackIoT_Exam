import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const local = "http://localhost:5233";
const prod = "https://API_DOMAIN"; // TODO: Replace with the Fly.io API base URL once deployed.

export const BASE_URL = import.meta.env.PROD ? prod : local;

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>,
)