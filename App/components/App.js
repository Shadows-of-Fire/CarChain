import React from 'react';
import "./App.css";
import Home from './Home';
import Buyer from './Buyer';
import Seller from './Seller';
import Manufactuerer from './Manufacturer';
import Insurance from './Insurance';
import States from './States';
import Bank from './Bank';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import Navbar from './NavBar';

function App(){
  return(
    <div>
      <Router>
        <Navbar />
        <Switch>
          <Route path="/" exact component={Home}/>
          <Route path="/manufacturer" component={Manufactuerer}/>
          <Route path="/dealer" component={Seller}/>
          <Route path="/buyer" component={Buyer}/>
          <Route path="/Insurance" component={Insurance}/>
          <Route path="/Bank" component={Bank}/>
          <Route path="/States" component={States}/>
        </Switch>
      </Router>
    </div>
  );
}


export default App;
