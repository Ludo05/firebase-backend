const functions = require('firebase-functions');
const { getAllPosts, createAPost, getPost, commentOnPost, unlikePost, likePost} = require('./handlers/posts');
const { signUp, login, uploadImage, addUserDetails, getAuthenticatedUser} = require('./handlers/users');
const express = require('express');
const  FBAuth  = require('./util/FBAuth');

const app = express();

app.post('/create', FBAuth, createAPost);
app.get('/posts', getAllPosts);
app.get('/posts/:postId', getPost);
app.post('/post/:postId/comment', FBAuth, commentOnPost);
//TODO deleste post
//TODO like post
app.get('/post/:postId/like', FBAuth, likePost)
app.get('/post/:postId/unlike', FBAuth, unlikePost)
//TODO unlike post

app.post('/signUp', signUp);
app.post('/login', login);
app.post('/user/image', FBAuth, uploadImage );
app.post('/user/details', FBAuth, addUserDetails);
app.get('/user ', FBAuth, getAuthenticatedUser);

exports.api = functions.https.onRequest(app);
