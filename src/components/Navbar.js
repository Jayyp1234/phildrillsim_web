import React from 'react';
import { NavLink } from 'react-router-dom';
import { Navbar, Nav } from 'react-bootstrap';
import logo from '../assets/logo.png'; // Adjust the path to your logo image

const NavigationBar = () => {
  return (
    <Navbar expand="sm" className="justify-content-between">
      <Navbar.Brand href="/" className="d-flex px-3 align-items-center">
        <img src={logo} alt="Brand Logo" height="40" className="me-2" />
      </Navbar.Brand>
      <Navbar.Toggle aria-controls="basic-navbar-nav" />
      <Navbar.Collapse id="basic-navbar-nav" className="justify-content-center">
        <Nav className="mx-auto">
          <NavLink
            to="/"
            className="nav-link mx-3"
            activeClassName="active"
            exact
          >
            Targets
          </NavLink>
          <NavLink
            to="/well-path"
            className="nav-link mx-3"
            activeClassName="active"
          >
           Well Path
          </NavLink>
          <NavLink
            to="/net-plots"
            className="nav-link  mx-3"
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
