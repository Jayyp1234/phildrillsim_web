
import React, { useState } from 'react';
import { Modal, Button, Form, Alert, Image, Spinner } from 'react-bootstrap';
import * as XLSX from 'xlsx';
import sampleImage from '../assets/excel.png'; // Adjust the path to your sample image

const UploadModal = ({ show, handleClose, onDataLoaded}) => {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDataProcessed, setIsDataProcessed] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleFileSelect = (e) => {
    setFile(e.target.files[0]);
    setIsDataProcessed(false);
    setErrorMessage('');
  };

  const handleProcessFile = () => {
    if (!file) {
      setErrorMessage('Please select a file to upload.');
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();
    const fileExtension = file.name.split('.').pop().toLowerCase();

    if (fileExtension === 'csv') {
      reader.onload = (e) => {
        const text = e.target.result;
        processCSV(text);
      };
      reader.readAsText(file);
    } else if (fileExtension === 'xlsx') {
      reader.onload = (e) => {
        const data = e.target.result;
        processXLSX(data);
      };
      reader.readAsArrayBuffer(file);
    } else {
      setErrorMessage('Unsupported file format. Please upload a CSV or XLSX file.');
      setIsProcessing(false);
    }
  };

  const processCSV = (data) => {
    try{
        const rows = data.split('\n').map(row => row.split(','));
        if (rows.length > 0) {
          const [north, east, tvd] = rows[1];
          const surfaceLocation = { north, east, tvd };
          const targets = rows.slice(2).map(([north, east, tvd]) => ({ north, east, tvd }));
          onDataLoaded(surfaceLocation, targets);
          setIsDataProcessed(true);
        } else {
          setErrorMessage('The CSV file is empty.');
        }
    }
    finally {
        setIsProcessing(false);
    }
  };

  const processXLSX = (data) => {
    try{
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
        if (jsonData.length > 0) {
          const [north, east, tvd] = jsonData[1];
          const surfaceLocation = { north, east, tvd };
          const targets = jsonData.slice(2).map(([north, east, tvd]) => ({ north, east, tvd }));
          onDataLoaded(surfaceLocation, targets);
          setIsDataProcessed(true);
        } else {
          setErrorMessage('The XLSX file is empty.');
        }
    }
    finally {
        setIsProcessing(false);
    }
    
  };

  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Upload Your Data</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group controlId="fileUpload" className="mb-3">
            <Form.Label>Select CSV or XLSX File</Form.Label>
            <Form.Control type="file" accept=".csv, .xlsx" onChange={handleFileSelect} />
          </Form.Group>

          {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

          {isDataProcessed && (
            <Alert variant="success">Data processed successfully!</Alert>
          )}

          <div className="d-grid gap-2">
            <Button
              variant="primary"
              onClick={handleProcessFile}
              disabled={isProcessing || isDataProcessed}
            >
              {isProcessing ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Processing...
                </>
              ) : (
                'Upload and Process'
              )}
            </Button>

        

            <span>View Sample Data </span>
            {/* Display the image in the modal */}
            <Image src={sampleImage} alt="Sample Data" fluid />
          </div>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default UploadModal;
