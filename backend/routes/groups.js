const express = require('express');
const {
  getAllGroups,
  getGroupsAndCategories,
} = require('../db/queries/q-groups');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const groups = await getAllGroups();
    res.status(200).json(groups);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

router.get('/groups-and-categories', async (req, res) => {
  try {
    const data = await getGroupsAndCategories();
    res.json(data);
  } catch (err) {
    console.error('Error fetching groups and categories', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
