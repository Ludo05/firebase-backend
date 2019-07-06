const isEmpty = require ("./helpers");
const isEmail = require ("./helpers");

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const firebase = require('firebase');

const serviceAccount = require("../../../Downloads/social-media");



const firebaseConfig = {
apiKey: "AIzaSyBR00qOQlybkX3Z3ObVNHo8YLWSYTyZ8nY",
    authDomain: "social-backend-452e5.firebaseapp.com",
    databaseURL: "https://social-backend-452e5.firebaseio.com",
    projectId: "social-backend-452e5",
    storageBucket: "social-backend-452e5.appspot.com",
    messagingSenderId: "1035207571811",
    appId: "1:1035207571811:web:3deea53866c1afdb"
};

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://social-backend-452e5.firebaseio.com"
});
const app = express();
const db = admin.firestore();
firebase.initializeApp(firebaseConfig);

app.get('/posts', (req, res) => {
 db.collection('posts').orderBy('created','desc').get()
     .then( data => {
      let posts = [];
      data.forEach( doc =>{
       posts.push({
        screamId: doc.id,
        user: doc.data().user,
        body: doc.data().body,
        created: doc.data().created
       });
      });
      return res.json(posts);
     })
});

const FBAuth = (req,res,next) => {
    let idToken;
if(req.headers.authorization && req.headers.authorization.startsWith('Bearer ')){
        idToken = req.headers.authorization.split('Bearer ')[1];
    } else {
    return res.status(403).json({error: 'Unauthorizted'})
}
    admin.auth().verifyIdToken(idToken)
        .then(decode => {
            req.user = decode;
            console.log(decode);
            return db.collection('users')
                .where('userId', '==', req.user.uid)
                .limit(1)
                .get()
        }).then( data => {
            req.user.handler = data.docs[0].data().handler
            return next();
    })
};
app.post('/create', FBAuth,(req, res) => {
 const date = new Date();
 const formatted = `${date.getDate()}:${date.getMonth() + 1}:${date.getFullYear()}`;
 const Post = {
  user: req.body.user,
  body: req.body.body,
  created: formatted
 };

 db.collection('posts').add(Post)
     .then( doc => {
      res.json(` User created with id of ${doc.id}`);})
     .catch( err => {
      res.status(500).json({error: err});
      console.log(err)
     })
});

app.post('/signUp', (req, res) => {
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handler: req.body.handler,
    };

    let errors = {};

    if (isEmpty.isEmpty(newUser.email)) {
         errors.email = 'Please add a Email.';
    } else if (!isEmail.isEmail(newUser.email)){
        errors.email = 'Add valid email'
    }

    if(isEmpty.isEmpty(newUser.password)) errors.password = 'Please add a password';
    if(isEmpty.isEmpty(newUser.confirmPassword)) errors.password = 'Please add a password';
    if(isEmpty.isEmpty(newUser.handler)) errors.password = 'Please add a username';

    if(Object.keys(errors) > 0 ) return res.status(400).json(errors);

    //TODO Add errors for password
    let tokenCredential, userId;
    db.doc(`/users/${newUser.handler}`).get()
        .then(doc => {
            if (doc.exists) {
                return res.status(400).json({handler: 'error'})
            } else {
                return firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password)
            }
        }).then(data => {
            userId = data.user.uid;
        return data.user.getIdToken();
    }).then(token => {
        tokenCredential = token;
        const addUser = {
            handler: newUser.handler,
            email: newUser.email,
            created: new Date().toISOString(),
            userId: userId
        };
        return db.doc(`/users/${newUser.handler}`).set(addUser)
    }).then(() => {
        return res.status(201).json({token: tokenCredential});
    }).catch(err => {
                if(err.code === 'auth/email-already-in-use'){
                    return res.status(400).json({Error: 'email already in use'});
                } else {
                    console.log(`${err}`);
                    return res.status(400).json({error: err.code})
                }
    });
});

    app.post('/login', (req,res) => {
        const userCreds = {
            email: req.body.email,
            password: req.body.password
        };

        //TODO Add validation

        firebase.auth().signInWithEmailAndPassword(userCreds.email,userCreds.password).then(data => {
            return data.user.getIdToken();
        }).then( token => {
            return res.json({token})
        }).catch( err => res.status(400).json(err.code))

    })





exports.api = functions.https.onRequest(app);
