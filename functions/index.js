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
   return  db.doc(`/posts/${snapshot.data().postId}`).get()
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
      .catch(err => console.log(err))
});


exports.createNotificationOnComment = functions.firestore.document('comments/{id}')
.onCreate( snapshot => {
   return  db.doc(`/posts/${snapshot.data().postId}`).get()
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
       .catch(err => console.log(err))
});

exports.deleteNotificationOnUnlike = functions.firestore.document('likes/{id}')
    .onDelete( snapshot => {
     return  db.doc(`/notifications/${snapshot.id}`)
            .delete()
            .catch( err =>  console.log(err))
    });

exports.onUserImageChange = functions.firestore.document('users/{userId}')
.onUpdate( change => {
    if(change.before.data().userImg !== change.after.data().userImg) {
        let batch = db.batch();
        return db.collection('posts').where('user', '==', change.before.data().user).get()
            .then(data => {
                data.forEach(doc => {
                    const post = db.doc(`/posts/${doc.id}`);
                    batch.update(post, {userImg: change.after.data().userImg});
                });
                return batch.commit()
            })
    }
});


exports.onPostDelete = functions.firestore.document('post/{postId}')
.onDelete((snapshot, context) =>  {
    const postId = context.params.postId;
    const batch = db.batch();
    return db.collection('comments').where( 'postId' ,'==', postId).get()
        .then( data => {
            data.forEach( doc => {
                batch.delete(db.doc(`/comments/${doc.id}`))
            });
            return db.collection('likes').where('postId', '==', postId).get()
        })
        .then( data => {
            data.forEach( doc => {
                batch.delete(db.doc(`/likes/${doc.id}`))
            });
            return db.collection('notifications').where('postId', '==', postId).get()
        })
        .then( data => {
            data.forEach( doc => {
                batch.delete(db.doc(`/notifcations/${doc.id}`))
            });
            return batch.commit()
        })
        .catch( err => console.log(err))
});