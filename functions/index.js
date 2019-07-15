const functions = require('firebase-functions');
const { getAllPosts, createAPost, getPost, commentOnPost, unlikePost, likePost, deletePost} = require('./handlers/posts');
const { signUp, login, uploadImage, addUserDetails, getAuthenticatedUser, markNotificationRead, getUserDetails} = require('./handlers/users');
const express = require('express');
const  FBAuth  = require('./util/FBAuth');
const cors = require('cors');
const { db } = require('./util/admin');


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
app.get('/user', FBAuth, getAuthenticatedUser);
app.get('/user/:handler', getUserDetails);
app.get('/notification', FBAuth, markNotificationRead);

exports.api = functions.https.onRequest(app);

exports.createNotificationOnLike = functions.firestore.document('likes/{id}')
.onCreate(snapshot => {
    db.doc(`/posts/${snapshot.data().postId}`).get()
        .then(doc => {
            if (doc.exists) {
                return db.doc(`/notifications/${snapshot.id}`).set({
                    createdAt: new Date().toISOString(),
                    recipient: doc.data().handler,
                    sender: snapshot.data().handler,
                    type: 'like',
                    read: false,
                    postId: doc.id
                });
            }
        })
        .then(() => {
            return;
        }).catch(err => {
        console.log(err);
        return;
    })
});


exports.createNotificationOnComment = functions.firestore.document('comments/{id}')
.onCreate( snapshot => {
    db.doc(`/posts/${snapshot.data().postId}`).get()
        .then(doc => {
            if (doc.exists) {
                return db.doc(`/notifications/${snapshot.id}`).set({
                    createdAt: new Date().toISOString(),
                    recipient: doc.data().handler,
                    sender: snapshot.data().handler,
                    type: 'comment',
                    read: false,
                    postId: doc.id
                });
            }
        })
        .then(() => {
            return;
        }).catch(err => {
        console.log(err);
        return;
    })
});

exports.deleteNotificationOnUnlike = functions.firestore.document('likes/{id}')
    .onDelete( snapshot => {
        db.doc(`/notifications/${snapshot.id}`)
            .delete()
            .then( () => {
                return;
            })
            .catch( err => {
                console.log(err);
                return;
            })
    });