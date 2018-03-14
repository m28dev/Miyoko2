import React from 'react';
import Rekognition from 'aws-sdk/clients/rekognition';
import DynamoDB from 'aws-sdk/clients/dynamodb';
import './styles/MiyokoModal.css';

/**
 * Rekognitionに登録
 */
const rekognitionRegister = (kaoBytes) => {
    return new Promise((resolve, reject) => {
        const params = {
            CollectionId: "miyoko-test",
            Image: {
                Bytes: kaoBytes
            }
        };

        const rekognition = new Rekognition();
        rekognition.indexFaces(params, (err, data) => {
            if (err) {
                console.log(err, err.stack);
                reject(new Error(err))
            } else {
                resolve(data);
            }
        });
    });
}

/**
 * DynamoDBに登録
 * @param {Object} data - AWS.Rekognition.IndexFaces()の成功レスポンス
 */
const dynamoDbRegister = (visitorInfo) => {
    return new Promise((resolve, reject) => {
        const params = {
            TableName: 'miyokoMemory',
            Item: {
                'faceId': visitorInfo.data.FaceRecords[0].Face.FaceId,
                'name': visitorInfo.visitorName,
                'department': visitorInfo.visitorDept
            }
        };

        const docClient = new DynamoDB.DocumentClient();
        docClient.put(params, (err, data) => {
            if (err) {
                reject(new Error(err));
            } else {
                resolve(data);
            }
        });
    });
}

/**
 * Stateless Functions
 * @param {*} param0 - 顔のblobデータ、モーダルのフラグ
 */
const MiyokoModal = ({ kaoBytes, isModalOpen, handleCloseModal, handleBackToStart }) => {

    const registerVisitor = async (event) => {
        event.preventDefault();

        const visitorInfo = {
            visitorName: event.target.visitorName.value,
            visitorDept: event.target.visitorDept.value,
        }

        visitorInfo.data = await rekognitionRegister(kaoBytes);
        await dynamoDbRegister(visitorInfo);
        handleCloseModal(visitorInfo.visitorName, visitorInfo.visitorDept);
    }

    if (isModalOpen === false) {
        return null;
    } else {
        return (
            <div id="dialog">
                <form id="form-box" onSubmit={registerVisitor}>
                    <div className="items">
                        <div className="item-box">
                            <label htmlFor="visitorName" className="form-label">名前</label>
                            <input type="text" name="visitorName" required />
                        </div>
                        <div className="item-box">
                            <label htmlFor="visitorDept" className="form-label">所属</label>
                            <input type="text" name="visitorDept" required />
                        </div>
                    </div>
                    <div className="buttons">
                        <input className="cancel" type="button" onClick={ () => handleBackToStart() } value="キャンセル" />
                        <button className="ok">OK</button>
                    </div>
                </form>
            </div>
        );
    }
}

export default MiyokoModal;
