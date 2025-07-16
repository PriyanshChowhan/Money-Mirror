import express from "express"
import cors from "cors"
import cookieParser from 'cookie-parser';

const app = express()

app.use(cookieParser());
app.use(cors({
    origin:'http://localhost:5173', 
    credentials : true
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))


import authRoutes from './routes/auth.routes.js';
import gmailRoutes from './routes/gmail.routes.js';
import insightRoutes from './routes/insight.routes.js';
import transactionRoutes from "./routes/transaction.routes.js";


app.use('/api/auth', authRoutes);
app.use('/api/gmail', gmailRoutes);
app.use('/api/insights', insightRoutes);
app.use('/api/transactions', transactionRoutes);

export default app