// WellPlanContext.js
import React, { createContext, useState, useContext } from 'react';

const WellPlanContext = createContext();

export const useWellPlan = () => useContext(WellPlanContext);

export const WellPlanProvider = ({ children }) => {
  const [wellPlanData, setWellPlanData] = useState({
    surfaceLocation: null,
    targets: [],
    kopValue: '',
    interval: 0,
  });

  return (
    <WellPlanContext.Provider value={{ wellPlanData, setWellPlanData }}>
      {children}
    </WellPlanContext.Provider>
  );
};
