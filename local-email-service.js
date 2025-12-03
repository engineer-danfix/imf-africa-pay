const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs').promises;

// Load environment variables from local file
require('dotenv').config({ path: '.env.local' });

// ... rest of the code remains the same ...