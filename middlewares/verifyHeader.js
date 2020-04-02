function verifyHeader(req, res, next) {
  if(req.path.indexOf('/download') > -1){
  	next();
  }else{
	  console.log("headersssssssssss",req.headers);
	  if (!req.headers.authorization) {
	    return res.status(401).send('Unauthorized request');
	  }
	  var access_token = req.headers.authorization.split(' ')[1];
	  if (!access_token) {
	    return res.status(401).send('Unauthorized request');
	  } 
	  next();
  }
}

module.exports = verifyHeader;