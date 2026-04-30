import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './Routes';
import Navbar from './Navbar';
import PageLayout from './components/PageLayout';

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <PageLayout>
        <AppRoutes />
      </PageLayout>
    </BrowserRouter>
  );
}

export default App;
