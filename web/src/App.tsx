import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout, Dashboard } from '@/components';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          {/* 未来可以添加更多路由 */}
          {/* <Route path="/history" element={<HistoryPage />} /> */}
          {/* <Route path="/settings" element={<SettingsPage />} /> */}
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
