import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import tituloWebImg from '../assets/tituloWeb.png';
import '../css/Landing.css'; // Optional: Can add specific styles or reuse global ones

export default function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Si el usuario ya está autenticado, redirigir al buscador
    if (!loading && user) {
      navigate('/buscar');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="landing-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="landing-container" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '80vh',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <div className="landing-content" style={{
        background: 'white',
        padding: '3rem',
        borderRadius: '16px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        maxWidth: '500px',
        width: '100%'
      }}>
        <img 
          src={tituloWebImg} 
          alt="Cartateca" 
          style={{ width: '100%', maxWidth: '300px', marginBottom: '2rem' }} 
        />
        <h1 style={{ color: '#2d3748', marginBottom: '1rem', fontSize: '1.8rem' }}>
          ¡Bienvenido a Cartateca!
        </h1>
        <p style={{ color: '#4a5568', marginBottom: '2rem', lineHeight: '1.6' }}>
          Para mantener la calidad de nuestra comunidad y evitar tráfico no deseado, requerimos que inicies sesión para buscar, coleccionar o ver el mercadillo.
        </p>
        
      </div>
    </div>
  );
}
