import { Routes, Route } from 'react-router-dom';
import MenuPostList from './components/menu/MenuPostList';
import MenuPostDetail from './components/menu/MenuPostDetail';

function App() {
  return (
    <Routes>
      <Route path="/menu" element={<MenuPostList posts={sampleMenuPosts} />} />
      <Route path="/menu/:id" element={<MenuPostDetail />} />
      {/* ... other routes ... */}
    </Routes>
  );
}

export default App; 