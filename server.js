const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Schemas and Models (moved to top)
const photoSchema = new mongoose.Schema({
  id: String,
  src: String,
  alt: String
});
const projectSchema = new mongoose.Schema({
  id: String,
  title: String,
  contentEn: String,
  contentHi: String,
  photo: String
});

const Photo = mongoose.model('Photo', photoSchema, 'photos');
const Project = mongoose.model('Project', projectSchema, 'projects');

// MongoDB connection
mongoose.connect('mongodb+srv://rasnauser:rasnauser432112@rasnango.wswd993.mongodb.net/?retryWrites=true&w=majority&appName=RasnaNGO', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// OTP storage (in-memory, use Redis for production)
const otps = new Map();

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'rasnasevasansthan@gmail.com',
    pass: 'rasnaseva99' // Replace with actual app-specific password
  }
});

// Generate and send OTP
app.post('/api/send-otp', async (req, res) => {
  const { email } = req.body;
  if (email !== 'rasnasevasansthan@gmail.com') {
    return res.status(400).json({ error: 'Invalid email' });
  }
  const otp = crypto.randomInt(1000, 9999).toString();
  otps.set(email, { code: otp, expires: Date.now() + 5 * 60 * 1000 }); // 5 min expiry
  try {
    await transporter.sendMail({
      from: 'rasnasevasansthan@gmail.com',
      to: email,
      subject: 'Admin Login OTP',
      text: `Your OTP is ${otp}. It expires in 5 minutes.`
    });
    res.json({ message: 'OTP sent' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// Verify OTP
app.post('/api/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  const storedOtp = otps.get(email);
  if (!storedOtp || storedOtp.code !== otp || Date.now() > storedOtp.expires) {
    return res.status(400).json({ error: 'Invalid or expired OTP' });
  }
  otps.delete(email);
  res.json({ message: 'OTP verified' });
});

// Add photo
app.post('/api/photos', async (req, res) => {
  const { id, src, alt } = req.body;
  try {
    const photo = new Photo({ id, src, alt });
    await photo.save();
    res.json({ message: 'Photo added', photo });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add photo' });
  }
});

// Delete photo
app.delete('/api/photos/:id', async (req, res) => {
  try {
    await Photo.deleteOne({ id: req.params.id });
    res.json({ message: 'Photo deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

// Add project
app.post('/api/projects', async (req, res) => {
  const { id, title, contentEn, contentHi, photo } = req.body;
  try {
    const project = new Project({ id, title, contentEn, contentHi, photo });
    await project.save();
    res.json({ message: 'Project added', project });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add project' });
  }
});

// Delete project
app.delete('/api/projects/:id', async (req, res) => {
  try {
    await Project.deleteOne({ id: req.params.id });
    res.json({ message: 'Project deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// Get photos
app.get('/api/photos', async (req, res) => {
  try {
    console.log('Fetching photos...');
    const photos = await Photo.find().sort({ _id: -1 });
    console.log('Photos fetched:', photos);
    if (photos.length === 0) {
      console.log('No photos found in the collection.');
    }
    res.json(photos);
  } catch (error) {
    console.error('Error fetching photos:', error);
    res.status(500).json({ error: 'Failed to fetch photos' });
  }
});

// Get projects
app.get('/api/projects', async (req, res) => {
  try {
    const projects = await Project.find().sort({ _id: -1 });
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));