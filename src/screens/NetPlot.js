import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import * as XLSX from 'xlsx'; 

const MyWebView = ({ northing, easting, tvd, onZoom, plotType, xAxisLabel, yAxisLabel }) => {
  const [zoomedCoordinates, setZoomedCoordinates] = useState(null); // State to store zoomed coordinates

  // Data configuration for the 3D plot
  const data3D = [
    {
      x: northing,
      y: easting,
      z: tvd,
      mode: 'lines+markers',
      marker: {
        size: 5,
        color: 'rgb(0, 0, 255)', // Blue color for markers
      },
      line: {
        color: 'rgb(0, 0, 255)', // Blue color for lines
        width: 3,
        shape: 'spline', // Smooth curve shape
      },
      type: 'scatter3d', // Specifies a 3D scatter plot
    },
  ];

  // Layout configuration for the 3D plot
  const layout3D = {
    title: 'Well Path Trajectory',
    scene: {
      xaxis: { title: 'Northing (ft)' }, // Label for the X-axis
      yaxis: { title: 'Easting (ft)' },  // Label for the Y-axis
      zaxis: { title: 'TVD (ft)', autorange: 'reversed' }, // Label for the Z-axis with reversed range
    },
    margin: {
      l: 0,
      r: 0,
      b: 0,
      t: 0,
    },
    hovermode: 'closest', // Hover mode to display information for the closest point
  };

  // Data configuration for the 2D plot
  const data2D = [
    {
      x: easting, // X-axis data from the easting array
      y: northing, // Y-axis data from the northing array
      mode: 'lines+markers',
      marker: {
        size: 5,
        color: 'rgb(255, 0, 0)', // Red color for markers
      },
      line: {
        color: 'rgb(255, 0, 0)', // Red color for lines
        width: 3,
      },
      type: 'scatter', // Specifies a 2D scatter plot
    },
  ];

  // Layout configuration for the 2D plot
  const layout2D = {
    title: `2D Plot: ${yAxisLabel} vs ${xAxisLabel}`, // Dynamic title based on provided labels
    xaxis: { title: `${xAxisLabel} (ft)` }, // Label for the X-axis
    yaxis: { title: `${yAxisLabel} (ft)` }, // Label for the Y-axis
    margin: {
      l: 40,
      r: 30,
      b: 30,
      t: 30,
    },
    hovermode: 'closest', // Hover mode to display information for the closest point
  };

  // Function to handle zoom events in the plot (only for 3D plots)
  const handleRelayout = (eventData) => {
    if (plotType === '3D' && eventData['scene.camera']) {
      const camera = eventData['scene.camera'];
      console.log("Camera Position:", camera);
      
      // Find the closest point to the camera's eye position
      const closestPoint = findClosestZoomPoint(camera.eye, { northing, easting, tvd });
      const nextInLine = pointsNextInLine(closestPoint, { northing, easting, tvd });

      // Calculate the interval between the closest point and the next point in line
      const zoomedInterval = calculateDistance(closestPoint, nextInLine);
      console.log("Zoomed Interval:", zoomedInterval);

      // Update the state with the zoomed coordinates
      setZoomedCoordinates({ closestPoint, nextInLine, zoomedInterval });

      // Trigger the onZoom callback with the calculated zoom data
      if (onZoom) onZoom({ closestPoint, nextInLine, zoomedInterval });
    }
  };

  // Function to calculate the distance between two points in 3D space
  function calculateDistance(pointA, pointB) {
    return Math.sqrt(
      Math.pow(pointA[0] - pointB[0], 2) +
      Math.pow(pointA[1] - pointB[1], 2) +
      Math.pow(pointA[2] - pointB[2], 2)
    );
  }
  
  // Function to find the closest point to the camera's eye position
  function findClosestZoomPoint(cameraEye, points) {
    let closestPoint = null;
    let minDistance = Infinity;
    const eyeArray = [cameraEye.x, cameraEye.y, cameraEye.z];
  
    // Iterate through all points to find the closest one to the camera's eye
    for (let i = 0; i < points.northing.length; i++) {
      const point = [points.northing[i], points.easting[i], points.tvd[i]];
      const distance = calculateDistance(eyeArray, point);
      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = point;
      }
    }
    return closestPoint;
  }
  
  // Function to find the point that is next in line after the closest point
  function pointsNextInLine(point1, points) {
    let closestPoint = null;
    let minDistance = Infinity;
    for (let i = 0; i < points.northing.length; i++) {
      const point = [points.northing[i], points.easting[i], points.tvd[i]];
      const distance = calculateDistance(point1, point);
      if (distance < minDistance && distance !== 0) { // Ensure it's not the same point
        minDistance = distance;
        closestPoint = point;
      }
    }
    return closestPoint;
  }

  return (
    <Plot
      data={plotType === '3D' ? data3D : data2D} // Choose the appropriate data set based on plot type
      layout={plotType === '3D' ? layout3D : layout2D} // Choose the appropriate layout based on plot type
      style={{ width: '100%', height: '100%' }} // Set the plot to take up full width and height
      onRelayout={handleRelayout} // Attach the zoom event handler only for 3D plots
    />
  );
};

const NetPlots = () => {
  const [loading, setLoading] = useState(true); // State to manage loading status
  const [interpolatedData, setInterpolatedData] = useState([]); // State to store interpolated data
  const [interpolatedmiaData, setInterpolatedmiaData] = useState([]); // State to store MIA data
  const [plotType, setPlotType] = useState('3D'); // State to store plot type, default is 3D
  const [xAxisLabel, setXAxisLabel] = useState(''); // State to store X-axis label
  const [yAxisLabel, setYAxisLabel] = useState(''); // State to store Y-axis label
  const [xData, setXData] = useState([]); // State to store X-axis data
  const [yData, setYData] = useState([]); // State to store Y-axis data
  const [isOffCanvasOpen, setIsOffCanvasOpen] = useState(false); // State to manage off-canvas menu visibility
  
  // Effect to load data from localStorage when the component mounts
  useEffect(() => {
    const storedData = localStorage.getItem('interpolatedData');
    const storedData2 = localStorage.getItem('interpolatedmiaData');
    const storedPlotType = localStorage.getItem('plot_type');
    const storedXAxisLabel = localStorage.getItem('x_axis_label');
    const storedYAxisLabel = localStorage.getItem('y_axis_label');

    // If plot type is stored, set it in state
    if (storedPlotType) {
      setPlotType(storedPlotType);
    }

    // If the data and labels are stored, parse and set them in state
    if (storedData && storedXAxisLabel && storedYAxisLabel) {
      const parsedData = JSON.parse(storedData);
      const parsedData2 = JSON.parse(storedData2);

      setInterpolatedData(parsedData);
      setInterpolatedmiaData(parsedData2);
      setXAxisLabel(storedXAxisLabel);
      setYAxisLabel(storedYAxisLabel);

      // Function to extract specific axis data from the MIA data
      const extractAxisData = (data, axisLabel) => {
        return data.map(item => parseFloat(item[axisLabel]));
      };

      setXData(extractAxisData(parsedData2, storedXAxisLabel.toLowerCase()));
      setYData(extractAxisData(parsedData2, storedYAxisLabel.toLowerCase()));

      setLoading(false); // Set loading to false after data is loaded
    }
  }, []);

  // Function to handle zoom events
  const handleZoom = (tvdRange) => {
    console.log('Zoom event triggered:', tvdRange);
  };

  // Function to handle streaming data (placeholder for actual implementation)
  const handleStreamingData = () => {
    console.log("Streaming data...");
    setIsOffCanvasOpen(false); // Close the off-canvas after loading the data
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
        <>
          <MyWebView
            northing={plotType === '3D' ? interpolatedData.map(item => parseFloat(item.north)) : xData}
            easting={plotType === '3D' ? interpolatedData.map(item => parseFloat(item.east)) : yData}
            tvd={interpolatedData.map(item => parseFloat(item.tvd))}
            onZoom={handleZoom}
            plotType={plotType} // Pass the plot type to the component
            xAxisLabel={xAxisLabel}
            yAxisLabel={yAxisLabel}
          />

          {/* Floating Button for Streaming Data */}
          <button
            style={styles.floatingButton}
            onClick={() => setIsOffCanvasOpen(true)}
          >
            Streaming Data
          </button>

          {/* Off-Canvas Menu */}
          <div style={{ ...styles.offCanvas, transform: isOffCanvasOpen ? 'translateX(0)' : 'translateX(100%)' }}>
            <h2 style={styles.offCanvasHeader}>Streaming Data</h2>
            <div style={styles.dataSection}>
              {plotType === '3D' ? (
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th scope="col">Northing</th>
                      <th scope="col">Easting</th>
                      <th scope="col">TVD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {xData.map((northing, index) => (
                      <tr key={index}>
                        <td>{northing}</td>
                        <td>{yData[index]}</td>
                        <td>{interpolatedData.map(item => parseFloat(item.tvd))[index]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th scope="col">{xAxisLabel}</th>
                      <th scope="col">{yAxisLabel}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {xData.map((xValue, index) => (
                      <tr key={index}>
                        <td>{xValue}</td>
                        <td>{yData[index]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <button style={styles.loadButton} onClick={handleStreamingData}>
              Download Data
            </button>
            <button style={styles.closeButton} onClick={() => setIsOffCanvasOpen(false)}>
              Close
            </button>
          </div>
        </>
      )}
    </div>
  );
};

const styles = {
  container: {
    position: 'relative',
    width: '100%',
    height: 'calc(100vh - 90px)', // Full height minus some offset for navbar or header
    backgroundColor: '#fff',
  },
  loader: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 1, // Ensure the loader is above other content
  },
  floatingButton: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    width: '180px',
    height: '40px',
    fontSize: '16px',
    cursor: 'pointer',
    boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.3)',
    zIndex: 1000, // Ensure the button is above other content
  },
  offCanvas: {
    position: 'fixed',
    top: 0,
    right: 0,
    width: '300px',
    height: '100%',
    backgroundColor: '#f8f9fa',
    boxShadow: '-2px 0px 10px rgba(0, 0, 0, 0.3)',
    padding: '20px',
    zIndex: 1000, // Ensure the off-canvas is above other content
    transition: 'transform 0.3s ease-in-out', // Smooth transition for the off-canvas
  },
  offCanvasHeader: {
    fontSize: '24px',
    marginBottom: '20px', // Space between the header and content
  },
  loadButton: {
    display: 'block',
    width: '100%',
    padding: '10px',
    marginBottom: '10px',
    backgroundColor: '#28a745',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  closeButton: {
    display: 'block',
    width: '100%',
    padding: '10px',
    backgroundColor: '#dc3545',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  dataSection: {
    marginTop: '20px',
    marginBottom: '20px',
    height: 650, // Fixed height with scrollable content
    overflowY: 'scroll', // Enable vertical scrolling
  },
};

export default NetPlots;
