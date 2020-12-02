var express = require('express');
var router = express.Router();

var mysql = require('mysql')
var pool = mysql.createPool({
    connectionlimit : 5,
    host: 'localhost',
    user: 'root',
    database : 'student_table',
    password : 'xodn7062@'
});

router.get('/', function (req, res, next) {

    pool.getConnection(function (err, connection) {
        var sqlForSelct = "select 학번, 학정번호, 수강시기 from student_grade";
        //교양 전공 구분
        var division = "create view division as select 학정번호, t.교양전공구분 from course_info as i join course_type as t on i.구분 = t.상세구분";
        //전공 평균
        var sqlJ = "select 수강시기, avg(평점) as 전공 from student_grade as s join grade_score as g on s.성적 = g.등급 join division as d on s.학정번호 = d.학정번호 group by d.교양전공구분, s.학번, s.수강시기 having d.교양전공구분 = \"전공\"";
        //교양 평균
        var sqlG = "select 수강시기, avg(평점) as 교양 from student_grade as s join grade_score as g on s.성적 = g.등급 join division as d on s.학정번호 = d.학정번호 group by d.교양전공구분, s.학번, s.수강시기 having d.교양전공구분 = \"교양\"";
        //전체 평균
        var sqlA = "select 수강시기, avg(평점) as 전체 from student_grade as s join grade_score as g on s.성적 = g.등급 join division as d on s.학정번호 = d.학정번호 group by d.교양전공구분, s.학번, s.수강시기";
        connection.query(sqlForSelct, function (err, rows) {
            if (err) console.error(err);

            connection.query(sqlJ, function (err, values) {
                if (err) console.error(err);

                connection.query(sqlG, function (err, datas) {
                    if (err) console.error(err);

                    connection.query(sqlA, function (err, rows) {
                        if (err) console.error(err);

                        res.render('result', { title: '성적', rows: rows, datas:datas, values:values});

                        connection.release();
                    });
                });
            });
        });
    });
});

module.exports = router;
