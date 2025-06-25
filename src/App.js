// src/App.jsx
import React, { useState, useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import CollectionList from './components/CollectionList';
import AddItemForm from './components/AddItemForm';
import EditItemForm from './components/EditItemForm';
import ArmyBuilder from './components/ArmyBuilder';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  const [collection, setCollection] = useState([]);
  const [armyList, setArmyList] = useState([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('wh40kCollection')) || [];
    setCollection(stored);
  }, []);

  useEffect(() => {
    localStorage.setItem('wh40kCollection', JSON.stringify(collection));
  }, [collection]);

  useEffect(() => {
    const storedArmy = JSON.parse(localStorage.getItem('wh40kArmyList')) || [];
    setArmyList(storedArmy);
  }, []);

  useEffect(() => {
    localStorage.setItem('wh40kArmyList', JSON.stringify(armyList));
  }, [armyList]);

  return (
    <div className="App container-fluid py-4 bg-light">
      <h1 className="text-center mb-4 text-primary">WH40K Collection Manager</h1>
      <Routes>
        <Route path="/" element={<CollectionList collection={collection} setCollection={setCollection} />} />
        <Route path="/add" element={<AddItemForm setCollection={setCollection} />} />
        <Route path="/edit/:id" element={<EditItemForm collection={collection} setCollection={setCollection} />} />
        <Route path="/army-builder" element={<ArmyBuilder collection={collection} armyList={armyList} setArmyList={setArmyList} />} />
      </Routes>
    </div>
  );
}

export default App;
