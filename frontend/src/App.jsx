// src/App.jsx
import React from 'react';
import HangmanGame from './assets/components/HangmanGame';

import './index.css'; // Import Tailwind CSS

const App = () => {
  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center">
      <HangmanGame />
    </div>
  );
};

export default App;
