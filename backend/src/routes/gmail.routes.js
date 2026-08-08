import express from 'express';
import { syncAndStoreEmails, getSyncStatusForUser } from '../controllers/gmail.controller.js'
import {protect} from '../middlewares/authjwt.js'

const router = express.Router();

router.post('/sync', protect, syncAndStoreEmails);
router.get('/sync/status', protect, getSyncStatusForUser);

export default router;
