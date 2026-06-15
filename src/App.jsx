import { ThemeProvider } from './theme/ThemeProvider';
import { AnalyzerPage } from './pages/AnalyzerPage';

export default function App() {
  return (
    <ThemeProvider>
      <AnalyzerPage />
    </ThemeProvider>
  );
}
