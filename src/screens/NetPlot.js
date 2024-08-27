import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';

const MyWebView = ({ northing, easting, tvd, onZoom, plotType, xAxisLabel, yAxisLabel }) => {
  console.log('xData', northing);
  console.log('yData', easting);

  const data3D = [
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

  const layout3D = {
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

  const data2D = [
    {
      x: easting, // Assuming you want to use northing for X-axis
      y: northing, // Assuming you want to use easting for Y-axis
      mode: 'lines+markers',
      marker: {
        size: 5,
        color: 'rgb(255, 0, 0)',
      },
      line: {
        color: 'rgb(255, 0, 0)',
        width: 3,
      },
      type: 'scatter',
    },
  ];

  const layout2D = {
    title: `2D Plot: ${yAxisLabel} vs ${xAxisLabel}`,
    xaxis: { title: `${xAxisLabel} (ft)` },
    yaxis: { title: `${yAxisLabel} (ft)` },
    margin: {
      l: 40,
      r: 30,
      b: 30,
      t: 30,
    },
    hovermode: 'closest',
  };

  const handleRelayout = (eventData) => {
    if (plotType === '3D' && eventData['scene.zaxis.range']) {
      const tvdRange = eventData['scene.zaxis.range'];
      console.log(`Zoomed TVD range: Lower = ${tvdRange[0]}, Upper = ${tvdRange[1]}`);
      if (onZoom) onZoom(tvdRange);
    }
  };

  return (
    <Plot
      data={plotType === '3D' ? data3D : data2D}
      layout={plotType === '3D' ? layout3D : layout2D}
      style={{ width: '100%', height: '100%' }}
      onRelayout={handleRelayout} // Attach the zoom event handler only for 3D
    />
  );
};

const NetPlots = () => {
  const [loading, setLoading] = useState(true);
  const [interpolatedData, setInterpolatedData] = useState([]);
  const [interpolatedmiaData, setInterpolatedmiaData] = useState([]);
  const [plotType, setPlotType] = useState('3D'); // Default to 3D
  const [xAxisLabel, setXAxisLabel] = useState('');
  const [yAxisLabel, setYAxisLabel] = useState('');
  const [xData, setXData] = useState([]);
  const [yData, setYData] = useState([]);

  useEffect(() => {
    const storedData = localStorage.getItem('interpolatedData');
    const storedData2 = localStorage.getItem('interpolatedmiaData');
    const storedPlotType = localStorage.getItem('plot_type');
    const storedXAxisLabel = localStorage.getItem('x_axis_label');
    const storedYAxisLabel = localStorage.getItem('y_axis_label');

    if (storedPlotType) {
      setPlotType(storedPlotType);
    }

    if (storedData && storedXAxisLabel && storedYAxisLabel) {
      const parsedData = JSON.parse(storedData);
      const parsedData2 = JSON.parse(storedData2);

      setInterpolatedData(parsedData);
      setInterpolatedmiaData(parsedData2);
      setXAxisLabel(storedXAxisLabel);
      setYAxisLabel(storedYAxisLabel);

      const extractAxisData = (data, axisLabel) => {
        return data.map(item => parseFloat(item[axisLabel]));
      };

      setXData(extractAxisData(parsedData2, storedXAxisLabel.toLowerCase()));
      setYData(extractAxisData(parsedData2, storedYAxisLabel.toLowerCase()));

      setLoading(false);
    }
  }, []);

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
        <MyWebView
          northing={plotType === '3D' ? interpolatedData.map(item => parseFloat(item.north)) : xData}
          easting={plotType === '3D' ? interpolatedData.map(item => parseFloat(item.east)) : yData}
          tvd={interpolatedData.map(item => parseFloat(item.tvd))}
          onZoom={handleZoom}
          plotType={plotType} // Pass the plot type to the component
          xAxisLabel={xAxisLabel}
          yAxisLabel={yAxisLabel}
        />
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
