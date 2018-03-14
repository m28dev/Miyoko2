import React, { Component } from 'react';
import AWS from 'aws-sdk/global';
import Login from './Login.js';
import MiyokoEye from './MiyokoEye';
import './styles/App.css';

class App extends Component {

    constructor() {
        super();

        // リージョンをバージニアに固定
        AWS.config.update({
            region: 'us-east-1'
        });

        this.state = {
            isLogon: false
        }

        this.setAWSCredential = this.setAWSCredential.bind(this);
    }

    /**
     * Google Sign-In とフェデレーション
     * @param {string} ID Token 
     */
    setAWSCredential(idToken) {
        AWS.config.credentials = new AWS.CognitoIdentityCredentials({
            IdentityPoolId: process.env.POOL_ID,
            Logins: {
                'accounts.google.com': idToken
            }
        });
        this.setState({ isLogon: true });
    }

    render() {
        let contents = <MiyokoEye />
        if (this.state.isLogon !== true) {
            contents = <Login onSetAWSCredential={this.setAWSCredential} />
        }

        return (
            <div className="App">{contents}</div>
        );
    }
}

export default App;
