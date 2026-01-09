import express from 'express';
import { syncAndStoreEmails } from '../controllers/gmail.controller.js'
import {protect} from '../middlewares/authjwt.js'

const router = express.Router();

router.post('/sync', protect, syncAndStoreEmails); 

export default router;
