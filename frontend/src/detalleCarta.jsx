import './detalleCarta.css';
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

export default function CartaDetalle() {
  const { id } = useParams();
  const [carta, setCarta] = useState({});
  const [mostrarModal, setMostrarModal] = useState(false);
  const [cargandoTiendas, setCargandoTiendas] = useState(false);
  const [hasFetchedTiendas, setHasFetchedTiendas] = useState(false); // 🆕 Nuevo estado
  const apiUrl = import.meta.env.VITE_API_URL;

  // Cargar datos de la carta
  useEffect(() => {
    fetch(`${apiUrl}/cartas/${id}`)
      .then(res => res.json())
      .then(data => {
        setCarta(data);
        setHasFetchedTiendas(false); // 🆕 Reiniciar bandera al cambiar carta
      })
      .catch(err => console.error("❌ Error al obtener carta:", err));
  }, [id]);

  // Cargar datos de tiendas solo una vez
  useEffect(() => {
    if (!hasFetchedTiendas && carta && carta.id) {
      setCargandoTiendas(true);
      fetch(`${apiUrl}/cartas/${id}/tiendas`)
        .then(res => res.json())
        .then(tiendas => {
          setCarta(prev => ({
            ...prev,
            tiendasDisponibles: tiendas
          }));
          setHasFetchedTiendas(true); // 🆕 Marcar como ya buscado
        })
        .catch(err => console.error("❌ Error al obtener tiendas:", err))
        .finally(() => setCargandoTiendas(false));
    }
  }, [carta, hasFetchedTiendas, id]);

  if (!carta || !carta.nombre) {
    return <p style={{ color: "white" }}>Cargando carta...</p>;
  }

  return (
    <div className="detalle-container" style={{ backgroundColor: '#111', color: 'white', minHeight: '100vh', padding: '20px' }}>
      <h1>{carta.nombre}</h1>

      <img
        src={carta.imagenPequena}
        alt={carta.nombre}
        onClick={() => setMostrarModal(true)}
        className="detalle-img-pequena"
      />

      <div className="detalle-info">
        <p><strong>Número:</strong> {carta.numero}/{carta.printedTotal}</p>
        <p><strong>Set:</strong> {carta.set}</p>
        <p><strong>Serie:</strong> {carta.serie}</p>
        <p><strong>Rareza:</strong> {carta.rareza}</p>
      </div>

      {cargandoTiendas && (
        <p style={{ color: "white" }}>Buscando disponibilidad en tiendas...</p>
      )}

      {carta.tiendasDisponibles && (
        <div className="detalle-tiendas">
          <h3>Disponibilidad en tiendas:</h3>
          <ul>
            {Object.entries(carta.tiendasDisponibles).map(([nombreTienda, info]) => (
              <li key={nombreTienda}>
                {info.url ? (
                  <>
                    <a href={info.url} target="_blank" rel="noopener noreferrer">
                      {nombreTienda} 🛒
                    </a>{" "}
                    {info.verificada ? "✅ Verificada" : "⚠️ No verificada"}
                  </>
                ) : (
                  <>
                    {nombreTienda} ❌ Sin stock
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {mostrarModal && (
        <div className="modal-overlay" onClick={() => setMostrarModal(false)}>
          <img src={carta.imagenGrande} alt="Carta en grande" className="modal-img-grande" />
        </div>
      )}
    </div>
  );
}
