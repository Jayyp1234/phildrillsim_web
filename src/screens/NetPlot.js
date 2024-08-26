import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';

const MyWebView = ({ northing, easting, tvd, onZoom }) => {
  const data = [
    {
      x: northing,
      y: easting,
      z: tvd,
      mode: 'lines+markers',
      marker: {
        size: 5,
        color: 'rgb(0, 0, 255)',
      },
      line: {
        color: 'rgb(0, 0, 255)',
        width: 3,
        shape: 'spline',
      },
      type: 'scatter3d',
    },
  ];

  const layout = {
    title: 'Well Path Trajectory',
    scene: {
      xaxis: { title: 'Northing (ft)' },
      yaxis: { title: 'Easting (ft)' },
      zaxis: { title: 'TVD (ft)', autorange: 'reversed' },
    },
    margin: {
      l: 0,
      r: 0,
      b: 0,
      t: 0,
    },
    hovermode: 'closest',
  };

  const handleRelayout = (eventData) => {
    if (eventData['scene.zaxis.range']) {
      const tvdRange = eventData['scene.zaxis.range'];
      console.log(`Zoomed TVD range: Lower = ${tvdRange[0]}, Upper = ${tvdRange[1]}`);
      if (onZoom) onZoom(tvdRange);
    }
  };

  return (
    <Plot
      data={data}
      layout={layout}
      style={{ width: '100%', height: '100%' }}
      onRelayout={handleRelayout} // Attach the zoom event handler
    />
  );
};

const NetPlots = () => {
  const [loading, setLoading] = useState(true);
  const [interpolatedData, setInterpolatedData] = useState([]);

  useEffect(() => {
    const storedData = localStorage.getItem('interpolatedData');
    if (storedData) {
      setInterpolatedData(JSON.parse(storedData));
      setLoading(false);
    }
  }, []);

  const northing = interpolatedData.map((target) => target.north);
  const easting = interpolatedData.map((target) => target.east);
  const tvd = interpolatedData.map((target) => target.tvd);

  const handleZoom = (tvdRange) => {
    console.log('Zoom event triggered:', tvdRange);
  };

  return (
    <div style={styles.container}>
      {loading ? (
        <div style={styles.loader}>
          <div className="spinner-border text-primary" role="status">
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      ) : (
        <MyWebView northing={northing} easting={easting} tvd={tvd} onZoom={handleZoom} />
      )}
    </div>
  );
};

const styles = {
  container: {
    position: 'relative',
    width: '100%',
    height: 'calc(100vh - 90px)',
    backgroundColor: '#fff',
  },
  loader: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 1,
  },
};

export default NetPlots;
