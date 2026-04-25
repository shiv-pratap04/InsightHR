require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const { connectDB } = require('./config/db');
const { configurePassport } = require('./config/passport');

const authRoutes = require('./routes/authRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const taskRoutes = require('./routes/taskRoutes');
const performanceRoutes = require('./routes/performanceRoutes');
const mlRoutes = require('./routes/mlRoutes');
const alertRoutes = require('./routes/alertRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

configurePassport();
app.use(passport.initialize());

app.use(helmet());
app.use(morgan('dev'));
app.use(
  cors({
    origin: clientUrl,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (req, res) => {
  res.json({ ok: true, explanation: 'InsightHR API is running.' });
});

app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/ml', mlRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/settings', settingsRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Not found' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    success: false,
    message: err.message || 'Server error',
    explanation: 'Unexpected failure — check logs and inputs.',
  });
});

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`InsightHR server listening on port ${PORT}`);
    });
  })
  .catch((e) => {
    console.error('DB connection failed', e);
    process.exit(1);
  });
