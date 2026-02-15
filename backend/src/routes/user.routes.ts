import { Router } from 'express';
import { getUsers, updateUser, deleteUser, getAuditLogs, getAssignees } from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get('/assignees', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), getAssignees);
router.get('/', authenticate, authorize(['SUPER_ADMIN']), getUsers);
router.patch('/:id', authenticate, authorize(['SUPER_ADMIN']), updateUser);
router.delete('/:id', authenticate, authorize(['SUPER_ADMIN']), deleteUser);
router.get('/logs', authenticate, authorize(['SUPER_ADMIN']), getAuditLogs);

export default router;
