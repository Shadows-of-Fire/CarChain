import React from 'react';
import {
  Nav,
  NavLink,
  Bars,
  NavMenu,
} from './NavbarElements';

const Navbar = () => {
  return (
    <>
      <Nav>
        <NavLink to='/'>
          <h1>Car-Chain</h1>
        </NavLink>
        <Bars />
        <NavMenu>
          <NavLink to='/' activeStyle>
            Home
          </NavLink>
          <NavLink to='/manufacturer' activeStyle>
            Cars
          </NavLink>
          <NavLink to='/buyer' activeStyle>
            Buyer
          </NavLink>
          <NavLink to='/bank' activeStyle>
            Bank
          </NavLink>
          <NavLink to='/insurance' activeStyle>
            Insurance
          </NavLink>
          <NavLink to='/states' activeStyle>
            States
          </NavLink>
          <NavLink to='/dealer' activeStyle>
            Dealer
          </NavLink>
          {/* Second Nav */}
          {/* <NavBtnLink to='/sign-in'>Sign In</NavBtnLink> */}
        </NavMenu>

      </Nav>
    </>
  );
};

export default Navbar;