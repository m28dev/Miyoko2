import React from 'react';
import ReactDOM from 'react-dom';
import Rekognition from 'aws-sdk/clients/rekognition';
import DynamoDB from 'aws-sdk/clients/dynamodb';
import MiyokoModal from './MiyokoModal.js';
import './styles/MiyokoEye.css';

let defaultState = {
    informationTitle: 'あなたの顔が映っていますか？',
    information: '「受付」ボタンを押してください',
    videoStyle: 'cameraActive',
    canvasStyle: 'cameraInactive',
    kaoBytes: null,
    isModalOpen: false,
    isComplete: false,
    spinStyle: 'none'
};

class MiyokoEye extends React.Component {

    constructor(props) {
        super(props);
        this.state = defaultState;
        this.localStream = null;
        this.closeModal = this.closeModal.bind(this);
        this.backToStart = this.backToStart.bind(this);
    }

    startVideo() {
        //console.log('video start');
        const localVideo = ReactDOM.findDOMNode(this.refs.localVideo);

        window.navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false }).then(stream => {
            this.localStream = stream;
            localVideo.srcObject = this.localStream;
        }).catch(err => {
            console.error(err);
            this.setState({
                informationTitle: 'Error:',
                information: 'カメラの起動に失敗しました' });
            return;
        });
    }

    stopVideo() {
        //console.log('video stop');
        const localVideo = ReactDOM.findDOMNode(this.refs.localVideo);

        if (this.localStream != null) {
            for (const track of this.localStream.getTracks()) {
                track.stop();
            }
            this.localStream = null;
            localVideo.pause();
            localVideo.srcObject = null;
        }
    }

    /** 
     * video要素が追加されたらカメラからの映像取得を開始する
     */
    componentDidMount() {
        this.startVideo();
    }

    /**
     * 受付ボタンの処理。
     * カメラに映った内容をキャプチャし、Amazon Rekognitionへ問い合わせる。
     * 初見の人物には登録を促す。
     */
    uketuke() {
        // なうろぉでぃんぐ
        this.setState({ spinStyle: 'spin' });

        // カメラに映った内容をcanvasへキャプチャ
        const canvas = ReactDOM.findDOMNode(this.refs.canvas);
        const localVideo = ReactDOM.findDOMNode(this.refs.localVideo);

        canvas.width = localVideo.videoWidth;
        canvas.height = localVideo.videoHeight;

        const ctx = canvas.getContext('2d');

        ctx.drawImage(localVideo, 0, 0);

        // 顔を認識
        const reader = new FileReader();
        new Promise(resolve => {
            // canvasの内容からjpgを生成
            canvas.toBlob((blob) => { resolve(blob); }, "image/jpeg");
        }).then((blob) => {
            // 生成されたjpgを読み込み
            return new Promise(resolve => {
                reader.onload = () => {
                    resolve();
                }
                reader.readAsArrayBuffer(blob);
            });
        }).then(() => {
            // Amazon Rekognitionへ問い合わせる
            const params = {
                CollectionId: "miyoko-test",
                FaceMatchThreshold: 90,
                Image: {
                    Bytes: reader.result
                },
                MaxFaces: 1
            };

            const rekognition = new Rekognition();

            return new Promise((resolve, reject) => {
                rekognition.searchFacesByImage(params, (err, data) => {
                    if (err) {
                        reject(new Error(err));
                    } else {
                        resolve(data);
                    }
                })
            });
        }).then((data) => {
            // 検出した顔を囲む
            const boundingBox = data.SearchedFaceBoundingBox;
            ctx.beginPath();
            ctx.strokeStyle = '#00FF00';
            ctx.lineWidth = 4;
            const x = canvas.width * boundingBox.Left;
            const y = canvas.height * boundingBox.Top;
            const w = canvas.width * boundingBox.Width;
            const h = canvas.height * boundingBox.Height;
            ctx.strokeRect(x, y, w, h);

            // 顔の判定分岐
            if (data.FaceMatches.length == 0) {
                // 知らない顔はモーダルウインドウ側で登録してもらう
                this.setState({
                    videoStyle: 'cameraInactive',
                    canvasStyle: 'cameraActive',
                    kaoBytes: reader.result,
                    isModalOpen: true,
                });
            } else {
                // 知ってる顔なのでDynamoDBから情報を取得する
                const docClient = new DynamoDB.DocumentClient();
                const params = {
                    TableName: 'miyokoMemory',
                    Key: {
                        'faceId': data.FaceMatches[0].Face.FaceId
                    }
                };
                docClient.get(params, (err, data) => {
                    if (err) {
                        // TODO ロールバックが必要なので、rekognitionで登録した顔を削除する
                        reject(new Error(err));
                    } else {
                        // 「ようこそ」してカメラを停止
                        this.setState({
                            informationTitle: 'ようこそ。',
                            information: `${data.Item.department} | ${data.Item.name} さん。`,
                            videoStyle: 'cameraInactive',
                            canvasStyle: 'cameraActive',
                            isComplete: true,
                            spinStyle: 'none'
                        }, this.stopVideo);
                    }
                });
            }
        }).catch((err) => {
            console.log(err);
            this.backToStart({
                informationTitle: 'エラーが発生しました。',
                information: 'お手数ですが、もう一度おねがいします。'
            });
        });
    }

    closeModal(name, department) {
        this.setState({
            informationTitle: 'ようこそ。',
            information: `${department} | ${name} さん。`,
            isModalOpen: false,
            isComplete: true,
            spinStyle: 'none'
        });
    }

    backToStart(newState = {}) {
        this.setState(Object.assign({}, defaultState, newState), () => {
            this.stopVideo();
            this.startVideo();
        });
    }

    render() {
        return (
            <div>
                <MiyokoModal
                    kaoBytes={this.state.kaoBytes}
                    isModalOpen={this.state.isModalOpen}
                    handleCloseModal={this.closeModal}
                    handleBackToStart={this.backToStart}
                />
                <div className="camera">
                    <div className={this.state.spinStyle}>認識中...</div>
                    <video ref="localVideo" autoPlay className={this.state.videoStyle}></video>
                    <canvas ref="canvas" className={this.state.canvasStyle}></canvas>
                </div>
                <p className="information">{this.state.informationTitle}</p>
                <p className="information2">{this.state.information}</p>
                {(() => {
                    if (!this.state.isComplete) {
                        return <button className="btn uketuke" onClick={() => this.uketuke()}>受付</button>
                    } else {
                        return <button className="btn kanryo" onClick={() => this.backToStart()}>完了</button>
                    }
                })()}
            </div>
        );
    }
}

export default MiyokoEye;
