const firebase = require("firebase");
const {admin, db} = require('../util/admin');
const config = require('../util/config');
const {validateData, reduceUserDetails} = require('../helpers');

firebase.initializeApp(config);
exports.signUp = (req, res) => {
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handler: req.body.handler,
    };

     const {errors, valid} = validateData(newUser);

     const img = 'noimage.png';

     if(!valid) return res.status(400).json(errors);
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
            userImg: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${img}?alt=media`,
            userId: userId
        };
        return db.doc(`/users/${newUser.handler}`).set(addUser)
    }).then(() => {
        return res.status(201).json({token: tokenCredential});
    }).catch(err => {
            console.log(`${err}`);
            return res.status(500).json({ general: 'Something went wrong, please try again'})

    });
};

exports.login = (req,res) => {
    const userCreds = {
        email: req.body.email,
        password: req.body.password
    };

    //TODO Add validation

    firebase.auth().signInWithEmailAndPassword(userCreds.email,userCreds.password).then(data => {
        return data.user.getIdToken();
    }).then( token => {
        return res.json({token})
    }).catch( err => res.status(402).json(err.code))

};

exports.uploadImage = (req,res) => {
    const BusBoy = require('busboy');
    const path = require('path');
    const os = require('os');
    const fs = require('fs');

    let imageFileName;
    let imgToBeUploaded = {};

    const busboy = new BusBoy({headers: req.headers});
    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {

        // console.log(mimetype);
        // if (mimetype !== "image/png" || mimetype !== "image/jpg") {
        //     return res.status(400).json({error: 'Please upload a image'});
        // }


        const imgExtension = filename.split('.')[filename.split('.').length - 1];
        imageFileName = `${Math.round(Math.random() * 1000000) + 4}.${imgExtension}`;
        const filePath = path.join(os.tmpdir(), imageFileName);
        imgToBeUploaded = {filePath, mimetype};
        file.pipe(fs.createWriteStream(filePath));
    });

        busboy.on('finish', () => {
            admin.storage().bucket().upload(imgToBeUploaded.filePath, {
                resumable: false,
                metadata: {
                    metadata: {
                        contentType: imgToBeUploaded.mimetype
                    }
                }
            }).then(() => {
                const userImg = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`;
                return db.doc(`/users/${req.user.handler}`).update({userImg: userImg})
            }).then(() => res.json({message: 'Image uploaded.'}))
                .catch(err => res.status(500).json({error: err.code}))
        });
    busboy.end(req.rawBody);
};

exports.addUserDetails = (req,res) => {
    let userDeatils = reduceUserDetails(req.body);

    db.doc(`/users/${req.user.handler}`).update(userDeatils)
        .then( () =>
        res.status(200).json({message: 'Added successfully'}))
        .catch( err =>
        res.status(500).json({error: err.code}));

};

exports.getAuthenticatedUser = (req,res) => {
  let resData = {};

  db.doc(`/users/${req.user.handler}`).get()
      .then(doc => {
          if(doc.exists){
              resData.credentials = doc.data();
              return db.collection('likes').where('handler', '==', req.user.handler ).get();
          }
      })
      .then(data => {
          resData.likes = [];
          data.forEach(doc => {
              resData.likes.push(doc.data());
          })
          return db.collection('notifications ').where('recipient', '==', req.user.handler).limit(10).get()
      })
      .then(data => {
          resData.notifications = [];
              data.forEach( doc => {
                  resData.notifications.push({
                        recipient: doc.data().recipient,
                        sender: doc.data().sender,
                        read: doc.data().read,
                        postId: doc.data().postId,
                        type: doc.data().type,
                        created: doc.data().created,
                        notfication : doc.id,
                  })
              });
          return res.json(resData)
      })
      .catch( err => res.status(400).json({error: err}));
};

exports.markNotificationRead = (req, res) => {
 let batch = db.batch();
 req.body.forEach( notificationId => {
     const notification = db.doc(`notifications/${notificationId}`);
     batch.update(notification, {read: true})
 });
     batch
     .commit()
     .then( () => {
         return res.json({message: 'Notification marked read'})
     })
     .catch( err => {
         return res.status(500).json({error: err})
     })
};

exports.getUserDetails = (req,res) => {
    const user = {};
 db.doc(`/users/${req.params.handler}`).get()
     .then( doc => {
         if(!doc.exists){
             return res.status(400).json({error: 'user doesn\'t exist'});
         }

         user.data = doc.data();
         return db.collection('posts').where('user', '==', req.params.handler).get()


     }).then( data => {
        user.posts = [];
        data.forEach( doc => {
            console.log(doc.data());
            user.posts.push({
                body: doc.data().body,
                user: doc.data().user,
                created: doc.data().created,
                likeCount: doc.data().likeCount,
                userImg: doc.data().userImg,
                commentCount: doc.data().commentCount,
                postId: doc.id,
            })
        })
    }).then( () => {
          return res.status(200).json(user)
    }).catch( err => {
     console.log(err);
     return res.status(400).json({ error: err})
 })
};
