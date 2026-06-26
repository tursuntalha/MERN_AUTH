const express = require('express')
const router = express.Router()
const { requireAuth } = require('../middleware/authMiddleware')
const adminGuard = require('../middleware/adminGuard')
const { getUsers, revokeSessions, getAuditLogs } = require('../controllers/adminController')

router.use(requireAuth, adminGuard)

router.get('/users', getUsers)
router.get('/audit', getAuditLogs)
router.delete('/sessions/:userId', revokeSessions)

module.exports = router
