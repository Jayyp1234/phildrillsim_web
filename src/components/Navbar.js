import React from 'react';
import { NavLink } from 'react-router-dom';
import { Navbar, Nav } from 'react-bootstrap';
import logo from '../assets/logo.png'; // Adjust the path to your logo image

const NavigationBar = () => {
  return (
    <Navbar expand="sm" className="justify-content-between">
      {/* Brand logo with link to the home page */}
      <Navbar.Brand href="/" className="d-flex px-3 align-items-center">
        <img src={logo} alt="Brand Logo" height="40" className="me-2" />
      </Navbar.Brand>
      
      {/* Toggle button for mobile view */}
      <Navbar.Toggle aria-controls="basic-navbar-nav" />
      
      {/* Navigation links */}
      <Navbar.Collapse id="basic-navbar-nav" className="justify-content-center">
        <Nav className="mx-auto">
          {/* Link to the Targets page */}
          <NavLink
            to="/"
            className="nav-link mx-3"
            activeClassName="active"
            exact
          >
            Targets
          </NavLink>
          
          {/* Link to the Well Path page */}
          <NavLink
            to="/well-path"
            className="nav-link mx-3"
            activeClassName="active"
          >
           Well Path
          </NavLink>
          
          {/* Link to the Plots page */}
          <NavLink
            to="/net-plots"
            className="nav-link mx-3"
            activeClassName="active"
          >
            Plots
          </NavLink>
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  );
};

export default NavigationBar;
