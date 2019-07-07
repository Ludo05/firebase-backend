const functions = require('firebase-functions');
const { getAllPosts, createAPost } = require('./handlers/posts');
const { signUp, login, uploadImage } = require('./handlers/users');
const express = require('express');
const  FBAuth  = require('./util/FBAuth');

const app = express();

app.post('/create', FBAuth, createAPost);
app.get('/posts', getAllPosts);
app.post('/signUp', signUp);
app.post('/login', login);
app.post('/user/image', FBAuth, uploadImage );
exports.api = functions.https.onRequest(app);
