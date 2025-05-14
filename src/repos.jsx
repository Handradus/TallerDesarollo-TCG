import React, { useEffect, useState } from 'react'

function GitHubRepos() {
  const [repos, setRepos] = useState([])

  useEffect(() => {
    fetch("https://api.github.com/users/handradus/repos")
      .then((res) => res.json())
      .then((data) => setRepos(data))
      .catch((err) => console.error('Error al cargar repos:', err))
  }, [])

  return (
    <section>
      <h2>Proyectos en GitHub</h2>
      <ul>
        {repos.map((repo) => (
          <li key={repo.id}>
            <a href={repo.html_url} target="_blank" rel="noreferrer">
              {repo.name}
            </a>
            <p>{repo.description}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default GitHubRepos
