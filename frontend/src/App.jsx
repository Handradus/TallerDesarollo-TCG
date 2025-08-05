import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './Routes';
import Navbar from './Navbar';

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
