
import { BotStorage } from "./BotStorage";
import {
    IBotStorageDataHash,
    IFirestoreBotStorageSettings,
} from "../types";


function toDatastore(obj: any, nonIndexed: any) {
    nonIndexed = nonIndexed || [];
    const results: any = [];
    Object.keys(obj).forEach((k) => {
        if (obj[k] === undefined) {
            return;
        }
        results.push({
            name: k,
            value: obj[k],
            excludeFromIndexes: nonIndexed.indexOf(k) !== -1
        });
    });
    return results;
}

export class FirestoreBotStorage extends BotStorage {
    constructor(collection: any, public settings: IFirestoreBotStorageSettings) {
        super(collection, settings)
        const { kind } = settings || {} as IFirestoreBotStorageSettings;
        if (!collection) { // || (typeof (kind) === "undefined")) {
            throw new Error("Invalid constructor arguments for the FirestoreBotStorage class. FirestoreBotStorage");
        }
        // function fromDatastore(obj) {
        //     obj.id = obj[collection.KEY].id;
        //     return obj;
        // }
        this.getDataFunction = (data: IBotStorageDataHash, entry: any, resolve: any, reject: any) => {

            // let q = collection.createQuery(kind).filter('key', '=', entry.key)
            // collection.runQuery(q, (err, entities, nextQuery) => {
            let q = collection.where('key', '==', entry.key).get()
                .then(querySnapshot => {
                    const docs = querySnapshot.docs.map(doc => doc.data())
                    let item = docs[0]

                    // let item = entities.map(fromDatastore)[0];
                    // console.log("item", item)

                    var docData = "{}";
                    var hash;
                    if (item) {
                        docData = item.data;
                        hash = item.hash;
                    }
                    var hashKey = entry.type + "Hash";
                    data[entry.type] = JSON.parse(docData);
                    data[hashKey] = hash;
                    resolve();
                })
                .catch(err => {
                    reject(err);
                    return;
                })

        }


        this.saveDataFunction = ((entry: any, resolve: any, reject: any) => {
            // const { key, data, hash, type, lastModified, expireAt } = entry;
            const firestore = collection.firestore
            console.debug("RUN TRANSACTION")
            firestore.runTransaction(trans => {
                console.debug("Storing entry with key: ", entry.key)
                console.debug("Entry: ", entry)
                const doc = collection.doc(entry.key)
                trans.set(doc, entry)
                return Promise.resolve()
            })
                .then(result => {
                    console.log("Transaction success!")
                })
                .catch(err => {
                    console.log("Transaction failure: ", err)
                })

            // let q = collection.createQuery(kind).filter('key', '=', entry.key)
            // ds.runQuery(q, (err, entities, nextQuery) => {
            //     if (err) {
            //         reject(err);
            //         return;
            //     }
            //     // console.log("item.id", item)
            //     let taskEntity = {
            //         key: ds.key(kind),
            //         data: {
            //             key,
            //             data,
            //             hash,
            //             type,
            //             lastModified,
            //             expireAt
            //         },
            //     };
            //     let item = entities.map(fromDatastore)[0];

            //     if (item) {
            //         taskEntity.key = ds.key([kind, parseInt(item.id, 10)]);
            //     }

            //     ds.save(taskEntity, (err) => {
            //         if (err) {
            //             reject(err);
            //             return;
            //         }
            //         resolve()
            //     });


        })
    }

}