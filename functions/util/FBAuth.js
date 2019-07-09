const {admin, db} = require('./admin');

module.exports = (req,res,next) => {
    let idToken;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer ')){
        idToken = req.headers.authorization.split('Bearer ')[1];
    } else {
        return res.status(403).json({error: 'Unauthorizted'})
    }
    admin.auth().verifyIdToken(idToken)
        .then(decode => {
            req.user = decode;
            console.log(`ISSS THIS WHAT YOU WANNNTTTT${decode }`);
            return db.collection('users')
                .where('userId', '==', req.user.uid)
                .limit(1)
                .get()
        }).then( data => {
        req.user.handler = data.docs[0].data().handler;
        req.user.userImg = data.docs[0].data().userImg;
        return next();
    }).catch( err => {
        console.log(`djfjfjfjf ${err.message}`);
        return res.status(500).json({error: err.message})
    })
};
