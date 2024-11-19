import { Router } from 'express';
import { getTasks } from '../controllers/taskController';

const router: Router = Router();

router.get('/', getTasks);

export default router;
