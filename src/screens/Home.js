import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UploadModal from '../components/UploadModal';
import { Modal, Button, Form } from 'react-bootstrap';
import { setWellPlanData } from '../store/wellDataSlice';
import { useDispatch } from 'react-redux';

const Home = () => {
  const [surfaceLocation, setSurfaceLocation] = useState({ north: '', east: '', tvd: '' });
  const [targets, setTargets] = useState([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [isKOPManual, setIsKOPManual] = useState(false); 
  const [kopValue, setKOPValue] = useState('');
  const [interval, setInterval] = useState(10);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const dispatch = useDispatch()
  const navigation = useNavigate();
  const handleAddTarget = () => {
    setTargets([...targets, { north: '', east: '', tvd: '' }]);
  };

  const calculateKOP = ({ x, y, tvd, buildRate = 2 }) => {
    const hd = Math.sqrt(x ** 2 + y ** 2);
    const md = Math.sqrt(tvd ** 2 + hd ** 2);
    const inclinationAngle = Math.atan(hd / tvd) * (180 / Math.PI);
    const mdInclined = (inclinationAngle / buildRate) * 100;
    return md - mdInclined;
  };

  const kopParameters = {
    x: Number(surfaceLocation.east) - (targets.length > 0 ? Number(targets[0].east) : 0),
    y: Number(surfaceLocation.north) - (targets.length > 0? Number(targets[0].north) : 0),
    tvd: Number(targets.length > 0 ? targets[0].tvd : 0),
  };

  const kop = kopValue == null || kopValue.trim() === '' ? calculateKOP(kopParameters).toFixed(2) : kopValue;

  const combinedLocations = [
    surfaceLocation,
    { east: surfaceLocation.east, north: surfaceLocation.north, tvd: kop },
    ...targets,
  ];

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
          east: interpolatedEast.toFixed(2)
        });
      }
    }
    
    const lastPoint = dataPoints[dataPoints.length - 1];
    result.push({
      tvd: lastPoint.tvd,
      north: lastPoint.north,
      east: lastPoint.east
    });

    return result;
  };

  const interpolatedData = interpolateData(combinedLocations, interval);

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

        const measuredDepth = Math.sqrt(deltaN ** 2 + deltaE ** 2 + deltaTVD ** 2);
        const horizontalDisplacement = Math.sqrt(deltaN ** 2 + deltaE ** 2);
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

  const miaResults = calculateMIAforLocations(interpolatedData);

  const handleRemoveTarget = (index) => {
    const updatedTargets = targets.filter((_, i) => i !== index);
    setTargets(updatedTargets);
  };

  const handleTargetChange = (index, key, value) => {
    const updatedTargets = [...targets];
    updatedTargets[index][key] = value;
    setTargets(updatedTargets);
  };

  const handlePlan = () => {
    if (surfaceLocation.north.toString() === '0' || surfaceLocation.east.toString() === '0' || surfaceLocation.tvd.toString() === '0') {
      
    }
    else if (!surfaceLocation.north || !surfaceLocation.east || !surfaceLocation.tvd) {
      alert("Please fill in all Surface Location fields.");
      return;
    }
  
    if (targets.length === 0) {
      alert("Please add at least one Target Location.");
      return;
    }
  
    let atLeastOneTargetFilled = false;
  
    for (let i = 0; i < targets.length; i++) {
      const targetNorthStr = String(targets[i].north);
      const targetEastStr = String(targets[i].east);
      const targetTvdStr = String(targets[i].tvd);
    
      if (targetNorthStr !== '' && targetEastStr !== '' && targetTvdStr !== '') {
        atLeastOneTargetFilled = true;
      } else if (targetNorthStr === '' || targetEastStr === '' || targetTvdStr === '') {
        alert(`Please fill in all fields for Target ${i + 1}.`);
        return;
      }
    }
    
  
    if (!atLeastOneTargetFilled) {
      alert("Please ensure at least one Target Location is completely filled.");
      return;
    }
    setIsDrawerVisible(true);
  };

  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };

  const handleDataLoaded = (newSurfaceLocation, newTargets) => {
    setSurfaceLocation(newSurfaceLocation);
    setTargets(newTargets);
  };

  const toggleDrawer = () => {
    setIsDrawerVisible(!isDrawerVisible);
  };

  const handleContinue = () => {
    const finalKopValue = kopValue || calculateKOP(kopParameters).toFixed(2);
    dispatch(setWellPlanData({
      surfaceLocation,
      targets,
      kopValue: finalKopValue,
      interval,
    }))
    navigation('/well-path');
    setDrawerVisible(false);
  };

  return (
    <div className="container mt-1">
      <div className='d-flex align-items-center justify-content-between mb-4'>
          <h2 className="text-left m3-4">Directional Survey</h2>
          <button className="btn btn-outline-primary " onClick={toggleModal}>
            <i className="fa fa-cloud-upload"></i> Upload Target Data
          </button>
      </div>
      <UploadModal show={isModalVisible} handleClose={toggleModal} onDataLoaded={handleDataLoaded}/>
      <div className="row mb-3">
        <div className="col">
          <div className="form-group">
            <label>Surface Location</label>
            <input 
              type="number" 
              className="form-control text-center" 
              value={surfaceLocation.north}
              onChange={(e) => setSurfaceLocation({ ...surfaceLocation, north: e.target.value })}
              placeholder="North (ft)" 
            />
          </div>
        </div>
        <div className="col">
          <div className="form-group">
            <input 
              type="number" 
              className="form-control text-center mt-4" 
              value={surfaceLocation.east}
              onChange={(e) => setSurfaceLocation({ ...surfaceLocation, east: e.target.value })}
              placeholder="East (ft)" 
            />
          </div>
        </div>
        <div className="col">
          <div className="form-group">
            <input 
              type="number" 
              className="form-control text-center mt-4" 
              value={surfaceLocation.tvd}
              onChange={(e) => setSurfaceLocation({ ...surfaceLocation, tvd: e.target.value })}
              placeholder="TVD (ft)" 
            />
          </div>
        </div>
      </div>

      {targets.map((target, index) => (
        <div key={index} className="row mb-3 align-items-center">
          <div className="col">
            <div className="form-group">
              <label>Target {index + 1}</label>
              <input 
                type="number" 
                className="form-control text-center" 
                value={target.north}
                onChange={(e) => handleTargetChange(index, 'north', e.target.value)}
                placeholder="North (ft)" 
              />
            </div>
          </div>
          <div className="col">
            <div className="form-group">
              <input 
                type="number" 
                className="form-control text-center mt-4" 
                value={target.east}
                onChange={(e) => handleTargetChange(index, 'east', e.target.value)}
                placeholder="East (ft)" 
              />
            </div>
          </div>
          <div className="col">
            <div className="form-group">
              <input 
                type="number" 
                className="form-control text-center mt-4" 
                value={target.tvd}
                onChange={(e) => handleTargetChange(index, 'tvd', e.target.value)}
                placeholder="TVD (ft)" 
              />
            </div>
          </div>
          <div className="col-auto">
            <button className="btn btn-danger mt-4" onClick={() => handleRemoveTarget(index)}>
              <i className="fa fa-trash"></i>
            </button>
          </div>
        </div>
      ))}

      <div className="row mb-3">
        <div className="col">
          <div className="form-group d-flex align-items-center">
            <label className="me-2">Input Manual KOP?</label>
            <input 
              className="form-check-input" 
              type="checkbox" 
              id="kopSwitch" 
              checked={isKOPManual} 
              onChange={(e) => setIsKOPManual(e.target.checked)} 
            />
          </div>
        </div>
        {isKOPManual && (
          <div className="col">
            <input 
              type="number" 
              className="form-control text-center" 
              value={kopValue} 
              onChange={(e) => setKOPValue(e.target.value)} 
              placeholder="10" 
            />
          </div>
        )}
      </div>

      <div className="row mb-3 justify-content-center">
        <div className="col-md-6 text-center">
          <button className="btn btn-outline-primary w-100" onClick={handleAddTarget}>
            Add Target
          </button>
        </div>
      </div>

      <div className="row justify-content-center">
        <div className="col-md-6 text-center">
          <button className="btn btn-primary w-100" onClick={handlePlan}>
            Generate Data
          </button>
        </div>
      </div>
       {/* Depth Interval Modal */}
       <Modal show={isDrawerVisible} onHide={toggleDrawer} centered>
        <Modal.Header closeButton>
          <Modal.Title>Enter Depth Interval</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Depth Interval (ft)</Form.Label>
              <Form.Control
                type="number"
                placeholder="Enter Depth Interval"
                value={interval}
                onChange={(e) => setInterval(Number(e.target.value))}
              />
            </Form.Group>
            <div className="d-flex justify-content-between">
              <Button variant="danger" onClick={toggleDrawer}>
                Close
              </Button>
              <Button variant="primary" onClick={handleContinue}>
                Continue
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default Home;
