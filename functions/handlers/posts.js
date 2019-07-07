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
        created: formatted
    };

    db.collection('posts').add(Post)
        .then( doc => {
            res.json(` User created with id of ${doc.id}`);})
        .catch( err => {
            res.status(500).json({error: err});
            console.log(err)
        })
};