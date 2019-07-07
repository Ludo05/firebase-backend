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