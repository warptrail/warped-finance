const express = require('express');
const { getAllGroups } = require('../db/queries/q-groups');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const groups = await getAllGroups();
    res.status(200).json(groups);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

module.exports = router;
