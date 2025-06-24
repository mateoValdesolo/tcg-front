import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './styles/main.css'

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
    <GoogleOAuthProvider clientId="846892188674-16ukbs2f4klvau3jsuit9cq1uqdsm0ue.apps.googleusercontent.com">
        <App />
    </GoogleOAuthProvider>
)