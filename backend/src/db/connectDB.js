import mongoose from "mongoose";

const connect = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/moneymirror`)
        console.log(`MongoDB connected DB HOST : ${connectionInstance.connection.host}`)
    }
    catch (error) {
        console.log("MongoDB connection failed", error)
        process.exit(1)
    }
}

export default connect

