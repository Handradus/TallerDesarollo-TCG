import React, { useEffect, useState } from 'react'
import './Modal.css' // Esto es opcional, puedes meter el CSS donde quieras

function GitHubRepos() {
  const [repos, setRepos] = useState([])
  const [repoActivo, setRepoActivo] = useState(null)

  const reposDestacados = [
    "SoftwareAsambleas",
    "SSOO_Tarea_1",
    "demo-react"
  ]

  useEffect(() => {
    fetch("https://api.github.com/users/handradus/repos")
      .then((res) => res.json())
      .then((data) => {
        const filtrados = data.filter(repo =>
          reposDestacados.includes(repo.name)
        )
        setRepos(filtrados)
      })
      .catch((err) => console.error('Error al cargar repos:', err))
  }, [])

  return (
    <section>
      <h2>Proyectos en GitHub</h2>
      <ul>
        {repos.map((repo) => (
          <li key={repo.id}>
            <button className="repo-button" onClick={() => setRepoActivo(repo)}>
              {repo.name}
            </button>
          </li>
        ))}
      </ul>

      {/* Modal */}
      {repoActivo && (
        <div className="modal-overlay" onClick={() => setRepoActivo(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{repoActivo.name}</h3>
            <p>{repoActivo.description}</p>
            <a href={repoActivo.html_url} target="_blank" rel="noreferrer">
              Ver en GitHub
            </a>
            <br />
            <button onClick={() => setRepoActivo(null)}>Cerrar</button>
          </div>
        </div>
      )}
    </section>
  )
}

export default GitHubRepos
