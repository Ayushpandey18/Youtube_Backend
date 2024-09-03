import  mongoose from "mongoose";
import { DB_name } from "../constants.js";
const connect_db=async ()=>{
    try {
        const connectionInstance=await mongoose.connect(`${process.env.MONGODB_URL}/${DB_name}`);
        console.log("\nMongo Db connected:",connectionInstance.connection.host);
    } catch (err) {
        console.log("Error:",err);
        process.exit(1);
    }
}
export default connect_db;