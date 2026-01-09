import express from "express"
import cors from "cors"
import cookieParser from 'cookie-parser';

const app = express()

const allowedOrigin = process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' ? 'https://money-mirror.xyz' : 'http://localhost:5173');

app.use(cookieParser());
app.use(cors({
    origin: allowedOrigin, 
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