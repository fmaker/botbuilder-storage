const util = require('util')

import { BotStorage } from "./BotStorage";
import {
    IBotStorageDataHash,
    IFirestoreBotStorageSettings,
} from "../types";

// function toDatastore(obj: any, nonIndexed: any) {
//     nonIndexed = nonIndexed || [];
//     const results: any = [];
//     Object.keys(obj).forEach((k) => {
//         if (obj[k] === undefined) {
//             return;
//         }
//         results.push({
//             name: k,
//             value: obj[k],
//             excludeFromIndexes: nonIndexed.indexOf(k) !== -1
//         });
//     });
//     return results;
// }

export class FirestoreBotStorage extends BotStorage {
    constructor(collection: any, public settings: IFirestoreBotStorageSettings) {
        super(collection, settings)
        const { kind } = settings || {} as IFirestoreBotStorageSettings;
        if (!collection) { // || (typeof (kind) === "undefined")) {
            throw new Error("Invalid constructor arguments for the FirestoreBotStorage class. FirestoreBotStorage");
        }

        const firestore = collection.firestore
        this.getDataFunction = (data: IBotStorageDataHash, entry: any, resolve: any, reject: any) => {

            // Store data into firestore using entry key as id
            firestore.runTransaction(trans => {
                const docRef = collection.doc(entry.key)
                return trans.get(docRef)
                    .then(doc => {
                        data = doc.data()
                        console.debug("GET KEY: ", entry.key, "DATA: ", data)
                        return Promise.resolve()
                    })
            })
                .then(result => {
                    // console.log("Transaction success!")
                    resolve()
                })
                .catch(err => {
                    console.log("Transaction failure: ", err)
                    reject()
                })

        }


        this.saveDataFunction = ((entry: any, resolve: any, reject: any) => {
            const { key, data, hash, type, lastModified, expireAt } = entry;
            const dataObj = {
                state: JSON.stringify({
                    data,
                    hash,
                    type,
                    lastModified,
                    expireAt
                }),
                key
            }

            console.debug("SAVE KEY: ", key, " DATA (", typeof dataObj, "): ", JSON.stringify(dataObj))

            // Store data into firestore using entry key as id
            firestore.runTransaction(trans => {
                let dataObj: IBotStorageDataHash

                const doc = collection.doc(key)
                trans.set(doc, dataObj)
                return Promise.resolve()
            })
                .then(result => {
                    // console.log("Transaction success!")
                    resolve()
                })
                .catch(err => {
                    console.log("Transaction failure: ", err)
                    reject()
                })

        })
    }

}