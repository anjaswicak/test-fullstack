const express = require('express');
const userCtrl = require('../controllers/userController');
const postCtrl = require('../controllers/postController');
const followCtrl = require('../controllers/followController');

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ ok: true, message: 'API up' });
});

// Users CRUD
// router.get('/api/users', userCtrl.list);
router.post('/api/register', userCtrl.register); //done
router.post('/api/login', userCtrl.login); //done
router.post('/api/refresh', userCtrl.refresh); //bonus
router.post('/api/logout', userCtrl.logout); //optional
router.get('/api/users/:id/suggested', userCtrl.listWithStats); //optional

// create Post/Feed
router.post('/api/posts', postCtrl.create); // done

// Follow system
router.post('/api/follow/:userid', followCtrl.follow); //done
router.post('/api/unfollow/:userid', followCtrl.unfollow); //done
router.get('/api/users/:id/following', followCtrl.listFollowing);
router.get('/api/users/:id/followers', followCtrl.listFollowers);
router.get('/api/feed', followCtrl.feed);

module.exports = router;
