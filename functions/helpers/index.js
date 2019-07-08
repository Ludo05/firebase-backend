const isEmpty = email => email.trim() === '';

const isEmail = email => {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
   return !!email.match(re);
};

exports.validateData = (data) => {
    let errors = {};

    if (isEmpty(data.email)) {
        errors.email = 'Please add a Email.';
    } else if (!isEmail(data.email)) {
        errors.email = 'Add valid email'
    }

    if (isEmpty(data.password)) errors.password = 'Please add a password';
    if (isEmpty(data.confirmPassword)) errors.password = 'Please add a password';
    if (isEmpty(data.handler)) errors.password = 'Please add a username';

    return {
        errors,
        valid:  Object.keys(errors).length === 0

}
};


exports.reduceUserDetails = (data) => {
    let userDetails = {};

    if(!isEmpty(data.bio.trim())) userDetails.bio = data.bio;
    if(!isEmpty(data.website.trim())) {
        if(data.website.trim().substring(0,4) !== 'http'){
            userDetails.website = `http://${data.website.trim()}`;
        } else {
            userDetails.website = data.website;
        }
    }
    if(!isEmpty(data.location.trim())) userDetails.location = data.location;

    return userDetails
};