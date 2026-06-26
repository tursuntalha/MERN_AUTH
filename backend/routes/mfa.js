const express = require('express')
const router = express.Router()
const { requireAuth } = require('../middleware/authMiddleware')
const { setupMfa, verifyMfaSetup, disableMfa } = require('../controllers/mfaController')

router.post('/setup', requireAuth, setupMfa)
router.post('/verify', requireAuth, verifyMfaSetup)
router.post('/disable', requireAuth, disableMfa)

module.exports = router
