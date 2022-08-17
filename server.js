const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
const MongoClient = require('mongodb').MongoClient;
app.set('view engine', 'ejs');

var db;
var 총게시물갯수;
MongoClient.connect('mongodb+srv://song0726:song033634120@cluster0.jkh1uqu.mongodb.net/?retryWrites=true&w=majority', { useUnifiedTopology: true }, function (에러, client) {
   if (에러)
      return console.log(에러);

   db = client.db('todoapp');

   app.listen(8080, function () {
      console.log('listening on 8080');
   });
});


app.get('/pet', function (req, res) {
   res.send('펫용품을 볼 수 있은 페이지입니다.');
});

app.get('/beauty', function (req, res) {
   res.send('뷰티용품 쇼핑 페이지임');
});

app.get('/', function (req, res) {
   res.sendFile(__dirname + '/index.html');
});

app.get('/write', function (req, res) {
   res.sendFile(__dirname + '/write.html');
});

app.post('/add', function (req, res) {
   res.send('전송완료~');
   db.collection('count').findOne({ name: '게시물갯수' }, function (에러, 결과) {
      console.log(결과.totalPost);
      총게시물갯수 = 결과.totalPost;

      db.collection('post').insertOne({ _id: 총게시물갯수 + 1, title: req.body.title, content: req.body.content }, function (에러, 결과) {
         console.log('저장완료');

         db.collection('count').updateOne({ name: '게시물갯수' }, { $inc: { totalPost: 1 } }, function (에러, 결과) {
            if (에러)
               return console.log(에러);
         })
      });
   });
});


app.get('/list', function (req, res) {
   db.collection('post').find().toArray(function (에러, 결과) {
      // console.log(결과);
      res.render('list.ejs', { posts: 결과 });
   });
});

app.delete('/delete', function (req, res) {
   console.log(req.body);
   req.body._id = parseInt(req.body._id);
   db.collection('post').deleteOne(req.body, function (에러, 결과) {
      console.log('삭제완료');
      res.status(200).send({ message : '성공했습니다.'});
   })
});