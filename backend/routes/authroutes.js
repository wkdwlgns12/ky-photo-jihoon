const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

router.post('/register', async (req,res)=>{
  try{
    const { email, password, displayName } = req.body;
    if (!email || !password) return res.status(400).json({message:'email/password required'});
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'Email exists' });
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hash, displayName });
    res.status(201).json({ user: { _id:user._id, email:user.email, displayName:user.displayName, role:user.role } });
  }catch(e){ res.status(500).json({ message:'register failed', error:e.message }); }
});

router.post('/login', async (req,res)=>{
  try{
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message:'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message:'Invalid credentials' });
    const token = jwt.sign({ _id:user._id, email:user.email, role:user.role }, process.env.JWT_SECRET, { expiresIn:'7d' });
    res.json({ token, user: { _id:user._id, email:user.email, displayName:user.displayName, role:user.role } });
  }catch(e){ res.status(500).json({ message:'login failed', error:e.message }); }
});

router.get('/me', async (req,res)=>{
  try{
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ message:'Unauthorized' });
    const token = auth.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ user: { _id:decoded._id, email:decoded.email, role:decoded.role } });
  }catch(e){ res.status(401).json({ message:'Unauthorized' }); }
});

router.post('/logout', (req,res)=> res.json({ ok:true }));
module.exports = router;
