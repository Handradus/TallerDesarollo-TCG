import { useState } from 'react';

function App() {
  const [nombre, setNombre] = useState('');
  const [cartas, setCartas] = useState([]);
  const [loading, setLoading] = useState(false);

const buscarCartas = async () => {
  setLoading(true);
  try {
    const res = await fetch(`http://localhost:3000/api/cartas?nombre=${encodeURIComponent(nombre)}`);
    const data = await res.json();
    setCartas(data);
  } catch (err) {
    console.error('Error al buscar cartas:', err);
  } finally {
    setLoading(false);
  }
};

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial' }}>
      <h1>Buscar Carta Pokémon</h1>
      <input
        type="text"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder="Ej: Pikachu o 6/12"
      />
      <button onClick={buscarCartas} style={{ marginLeft: '1rem' }}>
        Buscar
      </button>

      {loading && <p>Buscando cartas...</p>}

      <div style={{ marginTop: '2rem' }}>
        {cartas.length === 0 && !loading && <p>No hay resultados</p>}
        {cartas.map((carta) => (
      <div key={carta.id} style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '1rem', borderRadius: '8px' }}>
        <h2>{carta.nombre}</h2>
        <img src={carta.imagenGrande || carta.imagenPequena} alt={carta.nombre} height="200" />
        <p><strong>Número:</strong> {carta.numero}</p>
        <p><strong>Set:</strong> {carta.set}</p>
        <p><strong>Serie:</strong> {carta.serie}</p>
        <p><strong>Rareza:</strong> {carta.rareza}</p>
        <p><strong>Tipo:</strong> {carta.tipos?.join(', ') || '—'}</p>
        <p><strong>Ilustrador:</strong> {carta.ilustrador || 'Desconocido'}</p>
        <p><strong>Precio normal:</strong> {carta.precioNormal ? `$${carta.precioNormal}` : 'No disponible'}</p>
        <p><strong>Precio holofoil:</strong> {carta.precioHolofoil ? `$${carta.precioHolofoil}` : 'No disponible'}</p>
      </div>
    ))}

      </div>
    </div>
  );
}

export default App;
