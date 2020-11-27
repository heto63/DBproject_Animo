var express = require('express');
var router=express.Router();

router.get('/',function(req,res,next){
res.render('enrolment',{title:'수강 신청'});
});

module.exports=router;
