import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './BuscarCarta.css';

export default function BuscarCartas() {
  const [nombre, setNombre] = useState('');
  const [cartas, setCartas] = useState([]);
  const [loading, setLoading] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  const buscarCartas = async () => {
    setLoading(true);
    setCartas([]);
    try {
      const res = await fetch(`${apiUrl}/cartas?nombre=${encodeURIComponent(nombre)}`);
      const data = await res.json();

      if (data.length === 1) {
        navigate(`/carta/${data[0].id}`);
      } else {
        setCartas(data);
      }
    } catch (err) {
      console.error('Error al buscar cartas:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <h1>Buscar Carta Pokémon</h1>

      <div className="search-container">
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: Pikachu o 6/12"
          className="search-input"
        />
        <button onClick={buscarCartas} className="search-button">Buscar</button>
      </div>

      {loading && <p>Buscando cartas...</p>}

      <div className="cartas-grid">
        {!loading && cartas.length === 0 && <p>No hay resultados</p>}

        {cartas.map((carta) => (
          <div key={carta.id} className="carta-item" onClick={() => navigate(`/carta/${carta.id}`)} style={{ cursor: 'pointer' }}>
            <h2>{carta.nombre}</h2>
            <img src={carta.imagenGrande || carta.imagenPequena} alt={carta.nombre} height="200" />
            <p><strong>Número:</strong> {carta.numero}</p>
            <p><strong>Set:</strong> {carta.set}</p>
            <p><strong>Serie:</strong> {carta.serie}</p>
            <p><strong>Rareza:</strong> {carta.rareza}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
