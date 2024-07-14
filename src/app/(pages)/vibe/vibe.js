import React from "react";

class Vibe extends React.Component {

  CONSTANTS() {
    return {
        scenarios: {
            "p": {
                name: "Pessimistic",
                scalingFactor: 0.5
            },
            "r": {
                name: "Realistic",
                scalingFactor: 1.0
            },
            "o": {
                name: "Optimistic",
                scalingFactor: 1.5
            }
        }
    }
  } 

  getConfig() {
    return {
        years: {
            default: 5,
            value: 5,
            name: "Years",
            description: "Simulation number of years"
        },
        scenario: {
            default: "r",
            value: "r",
            name: "Scenario",
            description: "Simulation scenario (Pessimistic, Realistic, Optimistic)"
        }        
    }
  } 

  getAssumptions() {

  }

  constructor(props) {
    super(props);


    this.state = { text: "Welcome!" };
  }

//   componentWillMount() {
//     this.setState({
//       text: "GeeksforGeeks",
//     });
//   }

  render() {
    return <h1>{this.state.text}</h1>;
  }
}

export default Vibe;