import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AxisSelectionDrawer from '../components/AxisSelectionDrawer'; // Component for selecting axes in 2D plot
import { useSelector } from 'react-redux'; // To access Redux state

const WellPlanScreen = () => {
  // Local state to manage the visibility of various elements
  const [showWellPath, setShowWellPath] = useState(false);
  const [showXYZPath, setShowXYZPath] = useState(false);
  const [showCurvature, setShowCurvature] = useState(false);
  const [showBuildWalk, setShowBuildWalk] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false); // State to manage the visibility of the AxisSelectionDrawer
  const navigate = useNavigate(); // Hook to navigate between routes
  
  // Accessing well plan data from the Redux store
  const wellPlanManager = useSelector(state => state.wellPlanManager);
  const wellPlanData = wellPlanManager?.data;
  const { surfaceLocation, targets, kopValue, interval } = wellPlanData || {};

  // If no well plan data is available, display a message
  if (!surfaceLocation || !targets || targets.length === 0) {
    return (
      <div style={styles.noDataContainer}>
        <p style={styles.noDataText}>No target data passed.</p>
      </div>
    );
  }

  // Function to calculate the Kick-Off Point (KOP) value
  const calculateKOP = ({ x, y, tvd, buildRate = 2 }) => {
    const hd = Math.sqrt(x ** 2 + y ** 2); // Horizontal distance
    const md = Math.sqrt(tvd ** 2 + hd ** 2); // Measured depth
    const inclinationAngle = Math.atan(hd / tvd) * (180 / Math.PI); // Inclination angle in degrees
    const mdInclined = (inclinationAngle / buildRate) * 100; // Inclined measured depth
    return md - mdInclined; // Final KOP value
  };

  // Parameters needed to calculate KOP
  const kopParameters = {
    x: Number(surfaceLocation.east) - Number(targets[0].east),
    y: Number(surfaceLocation.north) - Number(targets[0].north),
    tvd: Number(targets[0].tvd),
  };

  // Determine the KOP value (either manual input or calculated)
  const kop = kopValue == null || kopValue.trim() === '' ? calculateKOP(kopParameters).toFixed(2) : kopValue;

  // Combine surface location and target locations into a single list
  const combinedLocations = [
    surfaceLocation,
    { east: surfaceLocation.east, north: surfaceLocation.north, tvd: kop },
    ...targets,
  ];

  // Function to interpolate data points based on the given interval
  const interpolateData = (dataPoints, interval) => {
    const result = [];
    for (let i = 0; i < dataPoints.length - 1; i++) {
      const startPoint = dataPoints[i];
      const endPoint = dataPoints[i + 1];
      
      const startTVD = parseFloat(startPoint.tvd);
      const endTVD = parseFloat(endPoint.tvd);
      
      const startNorth = parseFloat(startPoint.north);
      const endNorth = parseFloat(endPoint.north);
      
      const startEast = parseFloat(startPoint.east);
      const endEast = parseFloat(endPoint.east);
      
      const numberOfSteps = Math.floor((endTVD - startTVD) / interval);
      
      for (let j = 0; j <= numberOfSteps; j++) {
        const currentTVD = startTVD + j * interval;
        const interpolationFactor = (currentTVD - startTVD) / (endTVD - startTVD);
        
        const interpolatedNorth = startNorth + interpolationFactor * (endNorth - startNorth);
        const interpolatedEast = startEast + interpolationFactor * (endEast - startEast);
        
        result.push({
          tvd: currentTVD.toFixed(2),
          north: interpolatedNorth.toFixed(2),
          east: interpolatedEast.toFixed(2),
        });
      }
    }
    const lastPoint = dataPoints[dataPoints.length - 1];
    result.push({
      tvd: lastPoint.tvd,
      north: lastPoint.north,
      east: lastPoint.east,
    });

    return result;
  };

  // Generate interpolated data for the well path
  const interpolatedData = interpolateData(combinedLocations, interval);

  // Function to calculate Measured Depth, Inclination, and Azimuth (MIA) for each location
  const calculateMIAforLocations = (locations) => {
    const results = [];

    for (let i = 0; i < locations.length; i++) {
      const current = locations[i];

      if (i === 0) {
        results.push({
          measuredDepth: Math.sqrt(current.north ** 2 + current.east ** 2 + current.tvd ** 2),
          inclination: 0,
          azimuth: 0,
          north: current.north,
          east: current.east,
          tvd: current.tvd,
          rf: 0,
          dls: 0,
          dogleg: 0,
        });
      } else {
        const previous = locations[i - 1];

        const deltaN = current.north - previous.north;
        const deltaE = current.east - previous.east;
        const deltaTVD = current.tvd - previous.tvd;
        
        const horizontalDisplacement = Math.sqrt(deltaN ** 2 + deltaE ** 2);
        const measuredDepth = Math.sqrt(deltaN ** 2 + deltaE ** 2 + deltaTVD ** 2);
        const inclination = Math.atan2(horizontalDisplacement, deltaTVD) * (180 / Math.PI);

        let azimuth = Math.atan2(deltaE, deltaN) * (180 / Math.PI);
        if (azimuth < 0) {
          azimuth += 360;
        }

        const rf = 1 / Math.tan(inclination * (Math.PI / 180));
        const dls = Math.sqrt((inclination ** 2) + (azimuth ** 2)) / measuredDepth;
        const dogleg = Math.atan2(dls, rf) * (180 / Math.PI);

        results.push({
          measuredDepth,
          inclination,
          azimuth,
          north: current.north,
          east: current.east,
          tvd: current.tvd,
          rf,
          dls,
          dogleg,
        });
      }
    }

    return results;
  };

  // Calculate MIA results based on the interpolated data
  const miaResults = calculateMIAforLocations(interpolatedData);

  // Function to convert MIA results to CSV format
  const convertToCSV = (miaResults) => {
    if (!Array.isArray(miaResults) || miaResults.length === 0) {
      console.error("miaResults is not a valid array or is empty.");
      return '';
    }
  
    const header = 'Point,MD (ft),Inclination (°),Azimuth (°)\n';
    const csvRows = miaResults.map((mia, index) => {
      return `${index + 1},${mia.measuredDepth.toFixed(2)},${mia.inclination.toFixed(2)},${mia.azimuth.toFixed(2)}`;
    });
    return header + csvRows.join('\n');
  };
  
  // Function to export MIA results as a CSV file
  const handleExport = (miaResults) => {
    const csvData = convertToCSV(miaResults);
    if (csvData) {
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'MIA_Results.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      console.error("No CSV data to export.");
    }
  };

  // Function to handle plotting a 2D graph
  const handlePlot2D = () => {
    setDrawerVisible(true);
  };

  // Function to handle axis selection for 2D plotting
  const handleAxisSelection = (xAxis, yAxis) => {
    setDrawerVisible(false);

    // Store the interpolated data in local storage
    localStorage.setItem('interpolatedData', JSON.stringify(interpolatedData));
    localStorage.setItem('interpolatedmiaData', JSON.stringify(miaResults));
    localStorage.setItem('plot_type', '2D');
    localStorage.setItem('x_axis_label', xAxis.value);
    localStorage.setItem('y_axis_label', yAxis.value);

    // Navigate to the 2D plot route
    navigate('/net-plots');
  };

  // Function to handle plotting a full 3D well path
  const handlePlot3DFull = () => {
    if (!surfaceLocation.north || !surfaceLocation.east) {
      alert("Validation Error: Please fill in all Surface Location fields.");
      return;
    }
  
    if (targets.length === 0) {
      alert("Validation Error: Please add at least one Target Location.");
      return;
    }

    // Store the interpolated data in local storage
    localStorage.setItem('interpolatedData', JSON.stringify(interpolatedData));
    localStorage.setItem('interpolatedmiaData', JSON.stringify(miaResults));
    localStorage.setItem('plot_type', '3D');

    // Navigate to the 3D plot route
    navigate('/net-plots');
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerContainer}>
        <h3 style={styles.headerText}></h3>
        <button onClick={() => handleExport(miaResults)} style={styles.exportButton}>
          Export MIA
        </button>
      </div>
      <div className='row'>
        <div className='col-md-6' style={{ height: 400, overflowY: 'scroll' }}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeader}>
                <th style={styles.headerText}>Location</th>
                <th style={styles.headerText}>N (ft)</th>
                <th style={styles.headerText}>E (ft)</th>
                <th style={styles.headerText}>TVD (ft)</th>
              </tr>
            </thead>
            <tbody>
              <tr style={styles.tableRow}>
                <td style={styles.rowTitle}>Surface Location</td>
                <td style={styles.rowText}>{Number(surfaceLocation.north).toFixed(2)}</td>
                <td style={styles.rowText}>{Number(surfaceLocation.east).toFixed(2)}</td>
                <td style={styles.rowText}>{Number(surfaceLocation.tvd).toFixed(2)}</td>
              </tr>
              <tr style={styles.tableRow}>
                <td style={styles.rowTitle}>KOP</td>
                <td style={styles.rowText}>{Number(surfaceLocation.north).toFixed(2)}</td>
                <td style={styles.rowText}>{Number(surfaceLocation.east).toFixed(2)}</td>
                <td style={styles.rowText}>{Number(kop).toFixed(2)}</td>
              </tr>
              {targets.map((target, index) => (
                <tr style={styles.tableRow} key={index}>
                  <td style={styles.rowTitle}>Target {index + 1}</td>
                  <td style={styles.rowText}>{Number(target.north).toFixed(2)}</td>
                  <td style={styles.rowText}>{Number(target.east).toFixed(2)}</td>
                  <td style={styles.rowText}>{Number(target.tvd).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className='col-md-6' style={{ overflow: 'auto', maxHeight: 400 }}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeader}>
                {showWellPath && <th style={styles.headerText}>MD (ft)</th>}
                {showWellPath && <th style={styles.headerText}>Inc (°)</th>}
                {showWellPath && <th style={styles.headerText}>Azi (°)</th>}
                {showXYZPath && <th style={styles.headerText}>North (ft)</th>}
                {showXYZPath && <th style={styles.headerText}>East (ft)</th>}
                {showXYZPath && <th style={styles.headerText}>TVD (ft)</th>}
                {showCurvature && <th style={styles.headerText}>RF</th>}
                {showBuildWalk && <th style={styles.headerText}>DLS</th>}
                {showBuildWalk && <th style={styles.headerText}>Dogleg</th>}
              </tr>
            </thead>
            <tbody>
              {miaResults.map((mia, index) => (
                <tr style={styles.tableRow} key={index}>
                  {showWellPath && <td style={styles.rowValue}>{mia.measuredDepth.toFixed(2)}</td>}
                  {showWellPath && <td style={styles.rowValue}>{mia.inclination.toFixed(2)}</td>}
                  {showWellPath && <td style={styles.rowValue}>{mia.azimuth.toFixed(2)}</td>}
                  {showXYZPath && <td style={styles.rowValue}>{mia.north}</td>}
                  {showXYZPath && <td style={styles.rowValue}>{mia.east}</td>}
                  {showXYZPath && <td style={styles.rowValue}>{mia.tvd}</td>}
                  {showCurvature && <td style={styles.rowValue}>{mia.rf.toFixed(2)}</td>}
                  {showBuildWalk && <td style={styles.rowValue}>{mia.dls.toFixed(2)}</td>}
                  {showBuildWalk && <td style={styles.rowValue}>{mia.dogleg.toFixed(2)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={styles.controlPanel}>
        <h4 style={styles.controlPanelHeader}>Control Panel</h4>
        <div style={styles.controlItem}>
          <label style={styles.controlLabel}>Well Path</label>
          <input type="checkbox" checked={showWellPath} onChange={() => setShowWellPath(!showWellPath)} />
        </div>
        <div style={styles.controlItem}>
          <label style={styles.controlLabel}>XYZ Path</label>
          <input type="checkbox" checked={showXYZPath} onChange={() => setShowXYZPath(!showXYZPath)} />
        </div>
        <div style={styles.controlItem}>
          <label style={styles.controlLabel}>Curvature</label>
          <input type="checkbox" checked={showCurvature} onChange={() => setShowCurvature(!showCurvature)} />
        </div>
        <div style={styles.controlItem}>
          <label style={styles.controlLabel}>BuildWalk</label>
          <input type="checkbox" checked={showBuildWalk} onChange={() => setShowBuildWalk(!showBuildWalk)} />
        </div>
      </div>

      <AxisSelectionDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        onSelect={handleAxisSelection}
      />
      
      <div style={styles.buttonRow}>
        <button style={styles.plotButton2D} onClick={handlePlot2D}>
          Plot 2D Graph
        </button>
        <button style={styles.plotButton3D} onClick={handlePlot3DFull}>
          Plot Full 3D Well Path
        </button>
      </div>
    </div>
  );
};

const styles = {
  headerContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  exportButton: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    color: '#fff',
    cursor: 'pointer',
  },
  containersection: {
    marginVertical: 16,
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    borderColor: '#ccc',
    borderWidth: 1,
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
  },
  koplabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  kopoutputBox: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    textAlign: 'center',
    color: '#fff',
  },
  container: {
    padding: 16,
    backgroundColor: '#fff',
    width: '100%',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 16,
  },
  table: {
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    width: '100%',
    display: 'table',
  },
  tableContainer: {
    marginVertical: 20,
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    display: 'flex',
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  controlPanel: {
    marginVertical: 16,
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    borderColor: '#ccc',
    borderWidth: 1,
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
  },
  controlPanelHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  controlItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  controlLabel: {
    fontSize: 16,
  },
  buttonRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginVertical: 16,
  },
  plotButton2D: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 8,
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold',
    cursor: 'pointer',
    paddingTop:8,
    paddingBottom:8,
  },
  plotButton3D: {
    flex: 1,
    backgroundColor: '#FF6347',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 8,
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  headerText: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    padding: '8px 16px',
  },
  tableRow: {
    display: 'flex',
    flexDirection: 'row',
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    padding: '8px 0',
  },
  rowTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    padding: '8px 16px',
    textAlign: 'left',
    backgroundColor: '#e6e6e6',
    borderRight: '1px solid #ccc',
  },
  rowText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    padding: '8px 16px',
    textAlign: 'center',
    borderRight: '1px solid #ccc',
  },
  rowValue: {
    flex: 1,
    fontSize: 14,
    padding: '8px 16px',
    textAlign: 'center',
    color: '#333',
  },
  noDataContainer: {
    display: 'flex',
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
  },
  noDataText: {
    color: 'white',
    fontSize: 18,
  },
};

export default WellPlanScreen;
