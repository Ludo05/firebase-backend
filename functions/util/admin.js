const admin = require('firebase-admin');
const serviceAccount = require('./social-media');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://social-backend-452e5.firebaseio.com"
});

const db = admin.firestore();

module.exports = {db, admin};