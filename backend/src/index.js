import dotenv from "dotenv"
dotenv.config({
  path: process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env.development'
});

import connect from "./db/connectDB.js"
import app from "./app.js"

connect()
    .then(() => {
        app.listen(process.env.PORT || 5000, () => {
            console.log(`⚙️  Server is running at port : ${process.env.PORT}`)
        })
    })
    .catch((err) => {
        console.log("MONGO db connection failed !!! ", err)
    })



