import React, { Component } from 'react';
import './styles/Login.css';

class Login extends Component {

    constructor() {
        super()
        this.updateSigninStatus = this.updateSigninStatus.bind(this);
    }

    /**
     * CognitoとIDフェデレーションする
     * @param {boolean} isSignedIn
     */
    updateSigninStatus(isSignedIn) {
        // console.log(isSignedIn);
        if (isSignedIn) {
            const idToken = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token;
            this.props.onSetAWSCredential(idToken);
        }
    }

    componentDidMount() {
        // Google API Client Libraries を定義
        const gapijs = document.createElement('script');
        gapijs.src = 'https://apis.google.com/js/api:platform.js';

        // ロードが終わった後の処理を定義
        gapijs.onload = () => {
            // console.log('gapi loaded');
            gapi.load('auth2', () => {
                // GoogleAuthオブジェクトを初期化
                gapi.auth2.init({
                    client_id: process.env.CLIENT_ID,
                    scope: 'openid email profile'
                }).then(gAuth => {
                    // ボタンのデザインはおまかせしたい
                    gapi.signin2.render('my-signin2', {
                        'width': 400,
                        'height': 100,
                        'longtitle': true,
                        'theme': 'dark',
                        'onsuccess': user => { this.updateSigninStatus(user.isSignedIn()); },
                        'onfailure': err => { console.log(err); } // TODO
                    });
                });
            });

        };

        // Google API Client Libraries をロード
        document.body.appendChild(gapijs);
    }

    render() {
        return (
            <div id="login-box">
                <div id="my-signin2"></div>
            </div>
        );
    }
}

export default Login;
