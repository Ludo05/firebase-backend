const admin = require('./admin');

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
            console.log(decode);
            return db.collection('users')
                .where('userId', '==', req.user.uid)
                .limit(1)
                .get()
        }).then( data => {
        req.user.handler = data.docs[0].data().handler;
        return next();
    }).catch( err => {
        console.log(err.code);
        return res.status(400).json({error: err.code})
    })
};
