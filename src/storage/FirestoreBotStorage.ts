
import { BotStorage } from "./BotStorage";
import {
    IBotStorageDataHash,
    IGDatastoreBotStorageSettings,
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
    constructor(ds: any, public settings: IGDatastoreBotStorageSettings) {
        super(ds, settings)
        const { kind } = settings || {} as IGDatastoreBotStorageSettings;
        if (!ds || (typeof (kind) === "undefined")) {
            throw new Error("Invalid constructor arguments for the GDataStoreBotStorage class. GDataStoreBotStorage");
        }
        function fromDatastore(obj) {
            obj.id = obj[ds.KEY].id;
            return obj;
        }
        this.getDataFunction = (data: IBotStorageDataHash, entry: any, resolve: any, reject: any) => {

            let q = ds.createQuery(kind).filter('key', '=', entry.key)
            ds.runQuery(q, (err, entities, nextQuery) => {
                if (err) {
                    reject(err);
                    return;
                }


                let item = entities.map(fromDatastore)[0];
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
            });

        }


        this.saveDataFunction = (entry: any, resolve: any, reject: any) => {
            const { key, data, hash, type, lastModified, expireAt } = entry;
            const transaction = ds.transaction();

            let q = ds.createQuery(kind).filter('key', '=', entry.key)
            ds.runQuery(q, (err, entities, nextQuery) => {
                if (err) {
                    reject(err);
                    return;
                }
                // console.log("item.id", item)
                let taskEntity = {
                    key: ds.key(kind),
                    data: {
                        key,
                        data,
                        hash,
                        type,
                        lastModified,
                        expireAt
                    },
                };
                let item = entities.map(fromDatastore)[0];

                if (item) {
                    taskEntity.key = ds.key([kind, parseInt(item.id, 10)]);
                }

                ds.save(taskEntity, (err) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve()
                });


            })
        }
    }

}