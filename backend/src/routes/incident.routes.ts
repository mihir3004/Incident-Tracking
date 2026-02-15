import { Router } from 'express';
import { createIncident, getIncidents, updateIncident, deleteIncident, bulkAction, getAnalytics } from '../controllers/incident.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

router.post('/bulk', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), bulkAction);
router.get('/analytics', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), getAnalytics);

router.post('/', authenticate, upload.single('evidence'), createIncident);
router.get('/', authenticate, getIncidents);
router.patch('/:id', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), updateIncident);
router.delete('/:id', authenticate, authorize(['SUPER_ADMIN']), deleteIncident);

export default router;
