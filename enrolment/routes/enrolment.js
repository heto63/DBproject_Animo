var express = require('express');
var router=express.Router();

var mysql=require('mysql')
var pool=mysql.createPool({
    connectionLimit: 5,
    host: 'localhost',
    user: 'root',
    database:'student_table',
    password:'1234'
});

//강의 목록 출력
router.get('/',function(req,res,next){

  pool.getConnection(function(err,connection){
    var sqlForSelectList="select * from course_info as c natural join course_time as t where c.학정번호= t.학정번호;";
    var sqlOverlapList="select distinct ct2.학정번호,ct2.강의시간1,ct2.강의시간2,ct2.강의시간3 from course_time as ct,course_time as ct2, registered_course as c where (ct.학정번호=c.학정번호 and c.학번=? and (((ct.강의시간1<>'no' and ct.강의시간1 in(ct2.강의시간1,ct2.강의시간2,ct2.강의시간3))  or (ct.강의시간2<>'no' and ct.강의시간2 in(ct2.강의시간1,ct2.강의시간2,ct2.강의시간3)) or( ct.강의시간3<>'no' and ct.강의시간3 in(ct2.강의시간1,ct2.강의시간2,ct2.강의시간3)))));"

    var 학번=2017722001;
    var params=[학번];

    connection.query(sqlForSelectList,function(err,rows){
        if(err) console.error("err: "+err);
    //    console.log("rows: "+JSON.stringify(rows));
    connection.query(sqlOverlapList,params,function(err,overlaplist){
      if(err) console.error("err: "+err);

      res.render('enrolment',{title:'수강신청', rows:rows,overlaplist:overlaplist});
      console.log("중복 과목:"+JSON.stringify(overlaplist));

        connection.release();

          });
      });
  });
});

//강의 추가
router.post('/',function(req,res,next){

  var add_course_num=req.body.add_course_num;
  var add_stu_num=2017722001;
  var over_data=[add_stu_num,add_course_num];
  var add_datas=[add_course_num,add_stu_num];
  var time_datas=[add_course_num,add_course_num,add_stu_num];

// 중복
  var overlap="select * from registered_course as c where 학정번호 in (select 학정번호 from registered_course as c2 where c2.학번=? and c2.학정번호=?);"
//시간 겹침
  var timeoverlap="select * from registered_course as c where 학정번호 in (select ct2.학정번호 from course_time as ct,course_time as ct2 natural join registered_course as c where (ct.학정번호=? and  ((ct.강의시간1<>'no' and ct.강의시간1 in(ct2.강의시간1,ct2.강의시간2,ct2.강의시간3)) or (ct.강의시간2<>'no' and ct.강의시간2 in(ct2.강의시간1,ct2.강의시간2,ct2.강의시간3)) or (ct.강의시간3<>'no' and ct.강의시간3  in(ct2.강의시간1,ct2.강의시간2,ct2.강의시간3)))) and ct2.학정번호<>? and c.학번=?);"
//학점 초과
  var numover="select * from credit where exists(select * from credit as cre, course_info as ci where cre.학번=? and ci.학정번호=? and (cre.학점+ci.학점 <= 24));"
//삽입
  var sqlForInsertBoard="insert into registered_course (학정번호,학번) values(?,?);"
//가상테이블 생성
  var makecredit="create view credit as select c.학번, sum(ci.학점) as 학점 from registered_course as c join course_info as ci where c.학정번호=ci.학정번호 group by c.학번;"

  console.log("학정번호: "+add_course_num);

  pool.getConnection(function(err,connection)
  {

  connection.query(overlap,over_data,function(err,overrow){
    console.log("overrow: "+JSON.stringify(overrow));

    if(overrow.length==0){
///////////////////////////////////////////////////////////
    connection.query(timeoverlap,time_datas,function(err,timerow){
        console.log("timerow: "+JSON.stringify(timerow));
        if(timerow.length==0){
//////////////////////////////////////////////////////
  //          connection.query(makecredit,function(err,make){
  //              console.log("numrow:"+JSON.stringify(make));
                connection.query(numover,over_data,function(err,numrow){
                if(numrow.length==0){
                  res.send("<script>alert('<수강신청 불가> 학점이 초과되었습니다.');window.history.back();</script>");
      /////////////////////////////////////////////////////////
                }
                else {
                  connection.query(sqlForInsertBoard,add_datas,function(err,rows){
                    if(err) console.error("err: "+err);

                        res.send("<script>alert('수강신청이 완료되었습니다.');window.history.back();</script>");
                      connection.release();
                    });
              }

            });
       //});
////////////////////////////////////////////////////////////
       }
        else
        {
          res.send("<script>alert('<수강신청 불가> 강의시간이 겹치는 과목입니다.');window.history.back();</script>");
        }

    });
  ///////////////////////////////////////////////////////
    }
    else
    {
      res.send("<script>alert('<수강신청 불가> 중복되는 과목입니다.');window.history.back();</script>");
    }

    });
});
///////////////////////////////////////////////////////
});

//수강신청 목록 출력
router.get('/basket',function(req,res,next){

    pool.getConnection(function(err,connection){

  var list_course_num=2017722001;
  var params=[list_course_num];
  //수강 신청 목록 출력
  var sqlForlistReg="select * from registered_course as c natural join course_time as ct natural join course_info as ci where c.학정번호= ct.학정번호 and c.학정번호=ci.학정번호 and c.학번=?;"
  //총 학점
  var sqltotal="select sum(학점) as 총점 from registered_course as c join course_info as ci where c.학정번호=ci.학정번호 and c.학번=?;"
  //교양 총 학점
  var sqlgyo="select sum(학점) as 교총점 from registered_course as c join course_info as ci where c.학정번호=ci.학정번호 and c.학번=? and ci.구분 like '%교%';"
  //전공 총 학점
  var sqlj="select sum(학점) as 전총점 from registered_course as c join course_info as ci where c.학정번호=ci.학정번호 and c.학번=? and ci.구분 like '%전%';"
  connection.query(sqlForlistReg,params,function(err,Regrows){

            if(err) console.error("err: "+err);

          //  if(err) console.error("err: "+err);
          //  console.log("rows: "+JSON.stringify(Regrows));
            //res.render('basket',{title:'수강신청 현황',Regrows:Regrows});

              connection.query(sqltotal,params,function(err,now){
                connection.query(sqlgyo,params,function(err,now1){
                  connection.query(sqlj,params,function(err,now2){
                res.render('basket',{title:'수강신청 현황',Regrows:Regrows,now:now,now1:now1,now2:now2});
          //  connection.release();

            console.log("now: "+JSON.stringify(now));
            console.log("now: "+JSON.stringify(now1));
            console.log("now: "+JSON.stringify(now2));

              connection.release();
          });
          });
          });

      });
    });
});

//수강 강의 삭제
router.post('/basket',function(req,res,next){

  var del_course_num=req.body.del_course_num;
  var del_stu_num=2017722001;
  var del_datas=[del_stu_num,del_course_num];

  console.log("학정번호: "+del_course_num);

  pool.getConnection(function(err,connection)
  {
    var sqlFordeleteBoard="delete from registered_course where 학번=? and 학정번호=?;"

    connection.query(sqlFordeleteBoard,del_datas,function(err,result){
          if(err) console.error("err: "+err);

          if(result.affectedRows==0)
          {
            res.send("<script>alert('<수강삭제 불가> 없는 과목입니다.');window.history.back();</script>");
          }
          else
          {
            res.send("<script>alert('수강삭제가 완료되었습니다.');window.history.back();</script>");
          }
          connection.release();
        });
    });
});

module.exports=router;
