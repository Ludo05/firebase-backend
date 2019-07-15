const  {db} = require('../util/admin');
exports.getAllPosts = (req, res) => {
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
};

exports.createAPost = (req, res) => {
    const date = new Date();
    const formatted = `${date.getDate()}:${date.getMonth() + 1}:${date.getFullYear()}`;
    const Post = {
        user: req.user.handler,
        body: req.body.body,
        created: formatted,
        userImg: req.user.userImg,
        likeCount: 0,
        commentCount: 0
    };
    db.collection('posts').add(Post)
        .then( doc => {
            const resPost = Post;
            resPost.postId = doc.id;
            res.json(resPost)})
        .catch( err => {
            res.status(500).json({error: err});
            console.log(err)
        })
};

exports.getPost = (req,res) => {

    let postData = {};

    db.doc(`/posts/${req.params.postId}`).get()
        .then(doc => {
            if(!doc.exists){
                return res.status(400).json({error: 'post doesnt exist'})
            }
            //returns information from db.doc inside doc.data()
            postData = doc.data();
            postData.postId = doc.id;
            return db.collection('comments')
                .where('postId', '==', req.params.postId).get()
        }).then( data => {
        postData.comments = [];
        data.forEach( doc => {
            postData.comments.push(doc.data())
        });
        return res.json(postData)
    }).catch(err => res.status(400).json({error: err.code}))
};

exports.commentOnPost = (req,res) => {
    if(req.body.body.trim() === '') return res.status(400).json({error: 'Must not be empty'});

    const newComment = {
        body: req.body.body,
        created: new Date().toISOString(),
        postId: req.params.postId,
        handler: req.user.handler,
        userImg: req.user.userImg
    };

    db.doc(`/posts/${req.params.postId}`).get()
        .then( doc => {
            if(!doc.exists){
                return res.status(400).json({error: 'Post not found'})
            }
            return db.collection('comments').add(newComment)
        })
        .then(() => {
            return res.json(newComment)
        })
        .catch( err => res.status(500).json({errors: err.code}))
};


exports.likePost = (req,res) => {
    const likeDocument = db.collection('likes').where('handler', '==', req.user.handler)
        .where('postId', '==', req.params.postId).limit(1);

    const postDocmuent = db.doc(`/posts/${req.params.postId}`);

    let postData = {};

    postDocmuent.get().then(data => {
        if(data.exists){
           postData = data.data();
           postData.postId = data.id;
           return likeDocument.get();
        } else {
            return  res.status(404).json({ error: 'Went wrong'})
        }
    }).then( data => {
        if(data.empty){
            return db.collection('likes').add({
                postId: req.params.postId,
                handler: res.user.handler
            })
                .then( () => {
                postData.likeCount++
                    return postDocmuent.update({likeCount: postData.likeCount})
            })
                .then(() => res.json(postData))
        } else {
            return  res.status(400).json({error: 'post already liked'})
        }
    }).catch(err  => res.status(400).json({error: err.code}))
};


exports.unlikePost = (req,res) => {
    const likeDocument = db.collection('likes').where('handler', '==', req.user.handler)
        .where('postId', '==', req.params.postId).limit(1);

    const postDocmuent = db.doc(`/posts/${req.params.postId}`);

    let postData = {};

    postDocmuent.get().then(data => {
        if(data.exists){
            postData = data.data();
            postData.postId = data.id;
            return likeDocument.get();
        } else {
            return  res.status(404).json({ error: 'Went wrong'})
        }
    }).then( data => {
        if(data.empty){
            return  res.status(400).json({error: 'post not liked'})
        } else {
            return db.collection(`likes/${data.docs[0].id}`).delete()
                .then(() => {
                    postData.likeCount--;
                    return postDocmuent.update({likeCount: postData.likeCount})
                        .then(() => {
                            res.json(postData)
                        })
                })
        }
    }).catch(err  => res.status(400).json({error: err.code}))

};

exports.deletePost = (req, res) => {
   const document = db.doc(`/post/${req.params.postId}`);
   document.get()
       .then( doc => {
           if(!doc.exists){
               return res.status(400).json({error: 'Post does not exist.'})
           }
           if(doc.data().handler !== req.user.handler) {
               return res.status(403).json({error: 'Unauthorzied'})
           } else {
                return document.delete();
           }
       }).then( () => {
           res.status(200).json({success: `document ${document.created} deleted`})
   })
       .catch( err => res.status(400).json({error: err}))

};
