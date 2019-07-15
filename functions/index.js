const functions = require('firebase-functions');
const { getAllPosts, createAPost, getPost, commentOnPost, unlikePost, likePost, deletePost} = require('./handlers/posts');
const { signUp, login, uploadImage, addUserDetails, getAuthenticatedUser} = require('./handlers/users');
const express = require('express');
const  FBAuth  = require('./util/FBAuth');
const cors = require('cors');


const app = express();
app.use(cors());

app.post('/create', FBAuth, createAPost);
app.get('/posts', getAllPosts);
app.get('/posts/:postId', getPost);
app.post('/post/:postId/comment', FBAuth, commentOnPost);
app.delete('/post/:postId', FBAuth, deletePost);
app.get('/post/:postId/like', FBAuth, likePost);
app.get('/post/:postId/unlike', FBAuth, unlikePost);

app.post('/signup', signUp);
app.post('/login', login);
app.post('/user/image', FBAuth, uploadImage );
app.post('/user/details', FBAuth, addUserDetails);
app.get('/user ', FBAuth, getAuthenticatedUser);

exports.api = functions.https.onRequest(app);
