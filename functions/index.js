const functions = require('firebase-functions');
const { getAllPosts, createAPost } = require('./handlers/posts');
const { signUp, login, uploadImage, addUserDetails } = require('./handlers/users');
const express = require('express');
const  FBAuth  = require('./util/FBAuth');

const app = express();

app.post('/create', FBAuth, createAPost);
app.get('/posts', getAllPosts);
app.post('/user/image', FBAuth, uploadImage );
app.post('/user/details', FBAuth, addUserDetails);

app.post('/signUp', signUp);
app.post('/login', login);
exports.api = functions.https.onRequest(app);
