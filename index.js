const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const fs = require('fs');
const multer = require('multer');

app.use(express.static('public'));

// Configure body parser
app.use(bodyParser.urlencoded({ extended: false }));

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/'); // Specify the destination folder for uploaded files
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname); // Use a unique filename
    }
});

const upload = multer({
    storage: storage,
    limits: {
      fileSize: 1024 * 1024 * 50 // Limit file size to 50MB
    }
});

// Serve the form page
app.get('/sendemail', function (req, res) {
    res.sendFile(path.join(__dirname, 'public/Form.html'));
});
app.get('/thankyou', function (req, res) {
    res.sendFile(path.join(__dirname, 'public/thankyou.html'));
});
// Handle the form submission and sending emails
app.post('/sendemail', upload.single('persons_fileUpload'), (req, res) => {
    const { persons_name, persons_email, persons_subject, persons_message } = req.body;

    try {
        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: '', // Use your Gmail address
                pass: '', // Use your app password
            },
        });

        var mailOptions = {
            from: '', // Use your Gmail address
            to: persons_email,
            subject: persons_subject,
            text: persons_message,
            attachments: [],
        };

        if (req.file) {
            mailOptions.attachments.push({
                filename: req.file.originalname,
                content: req.file.buffer,
            });
        }

        // Send the email
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
                res.status(500).send('An error occurred while sending the email.');
            } else {
                console.log('Email Sent: ' + info.response);
                res.redirect('/thankyou');
            }

            // Write form data to JSON file
            var response = {
                name: persons_name,
                email: persons_email,
                subject: persons_subject,
                message: persons_message,
                fileUpload: {
                    filename: req.file ? req.file.originalname : null,
                    content: req.file ? req.file.buffer.toString('base64') : null 
                }
            };
            var datajson = JSON.stringify(response);
            fs.writeFileSync('./data.json', datajson);
            
            // Read and parse data.json
            var parsed = JSON.parse(fs.readFileSync('./data.json', 'utf-8'));
            console.log(parsed.email);
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send('An error occurred while sending the email.');
    }
});

// Start the server
app.listen(8080, function () {
    console.log('Listening on port 8080');
});
