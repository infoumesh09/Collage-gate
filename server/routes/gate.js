const express = require('express');
const router = express.Router();
const gateController = require('../controllers/gateController');

router.post('/validate-qr', gateController.validateQR);
router.post('/process-face', gateController.processFace);
router.post('/process-plate', gateController.processPlate);
router.post('/update-entry', gateController.updateEntry);
router.post('/update-exit', gateController.updateExit);

module.exports = router;