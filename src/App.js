// src/App.js
import React from 'react';
import {Provider} from 'react-redux'
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Home from './screens/Home';
import WellPlanScreen from './screens/WellPath';
import NetPlots from './screens/NetPlot';
import NavigationBar from './components/Navbar';

import { WellPlanProvider } from './context/WellPathContext';
import './App.css';
import store from './store';

function App() {
  return (
    <>
      <Provider store={store}>
      <Router>
      <NavigationBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/well-path" element={<WellPlanScreen />} />
        <Route path="/net-plots" element={<NetPlots />} />
        
      </Routes>
    </Router>
      </Provider>
    </>
  );
}

export default App;
