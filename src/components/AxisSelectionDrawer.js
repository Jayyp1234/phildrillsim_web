import React, { useState } from 'react';

const Dropdown = ({ label, data, onSelect }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedValue, setSelectedValue] = useState(null);

  const handleSelect = (item) => {
    setSelectedValue(item);
    onSelect(item);
    setShowDropdown(false);
  };

  return (
    <div style={styles.dropdownContainer}>
      <label style={styles.dropdownLabel}>{label}</label>
      <div style={styles.dropdownButton} onClick={() => setShowDropdown(!showDropdown)}>
        {selectedValue ? selectedValue.label : 'Select an option'}
      </div>
      {showDropdown && (
        <div style={styles.dropdownMenu}>
          {data.map(item => (
            <div
              key={item.value}
              style={styles.dropdownItem}
              onClick={() => handleSelect(item)}
            >
              {item.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const AxisSelectionDrawer = ({ visible, onClose, onSelect }) => {
  const [xAxis, setXAxis] = useState(null);
  const [yAxis, setYAxis] = useState(null);

  const availableAxes = [
    { label: 'MD (ft)', value: 'MD' },
    { label: 'Inc (°)', value: 'Inc' },
    { label: 'Azi (°)', value: 'Azi' },
    { label: 'North (ft)', value: 'North' },
    { label: 'East (ft)', value: 'East' },
    { label: 'TVD (ft)', value: 'TVD' },
    { label: 'RF', value: 'RF' },
    { label: 'DLS', value: 'DLS' },
    { label: 'Dogleg', value: 'Dogleg' },
  ];

  const handleContinue = () => {
    if (xAxis && yAxis) {
      onSelect(xAxis, yAxis);
    } else {
      alert("Please select both X and Y axes.");
    }
  };

  return visible ? (
    <div style={styles.modalContainer}>
      <div style={styles.drawerContainer}>
        <h4 style={styles.headerText}>2D Plot Configuration</h4>

        <Dropdown
          label="Select X-Axis"
          data={availableAxes}
          onSelect={(item) => setXAxis(item)}
        />

        <Dropdown
          label="Select Y-Axis"
          data={availableAxes}
          onSelect={(item) => setYAxis(item)}
        />

        <div style={styles.buttonContainer}>
          <button style={styles.buttonClose} onClick={onClose}>
            Close
          </button>
          <button style={styles.buttonContinue} onClick={handleContinue}>
            Continue
          </button>
        </div>
      </div>
    </div>
  ) : null;
};

const styles = {
  modalContainer: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  drawerContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '400px',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  dropdownContainer: {
    marginBottom: 20,
  },
  dropdownLabel: {
    marginBottom: 5,
    fontSize: 16,
    color: '#333',
  },
  dropdownButton: {
    padding: 10,
    borderWidth: 1,
    borderRadius: 5,
    borderColor: '#ccc',
    backgroundColor: '#f9f9f9',
    cursor: 'pointer',
  },
  dropdownMenu: {
    border: '1px solid #ccc',
    backgroundColor: '#fff',
    position: 'absolute',
    zIndex: 1000,
    marginTop: 5,
    borderRadius: 5,
    width: '100%',
  },
  dropdownItem: {
    padding: 10,
    cursor: 'pointer',
    borderBottom: '1px solid #ddd',
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  buttonClose: {
    backgroundColor: 'red',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 8,
    color: '#fff',
    cursor: 'pointer',
    flex: 1,
    textAlign: 'center',
  },
  buttonContinue: {
    backgroundColor: 'blue',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 8,
    color: '#fff',
    cursor: 'pointer',
    flex: 1,
    textAlign: 'center',
  },
};

export default AxisSelectionDrawer;
