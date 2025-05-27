import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import GitHubRepos from './repos.jsx'

function App() {
  return (
    <div className="layout">
      <aside className="sidebar">
        <img src={`${import.meta.env.BASE_URL}tan_yo_perfil.jpg`} alt="Foto de perfil" />


        <h3>Humberto Andrades Daza</h3>
        <p>Desarrollador Web</p>
        <ul>
          <li><a href="https://github.com/Handradus" target="_blank">GitHub</a></li>
          <li><a href="https://linkedin.com/in/humberto-andrades" target="_blank">LinkedIn</a></li>
        </ul>
      </aside>

      <GitHubRepos />
    

      <main className="main-content">
        
        <footer>
          <p>Contacto: humberto.andrades2201@alumnos.ubiobio.cl</p>
        </footer>
      </main>
    </div>
  )
}

export default App
