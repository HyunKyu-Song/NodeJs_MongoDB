const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended : true}));
const MongoClient = require('mongodb').MongoClient;
app.set('view engine', 'ejs');

var db;
var a;
var b;
MongoClient.connect('mongodb+srv://song0726:song033634120@cluster0.jkh1uqu.mongodb.net/?retryWrites=true&w=majority', { useUnifiedTopology: true } ,function(에러, client){
  if(에러){
    return console.log(에러);
  }

  db = client.db('todoapp');

  app.post('/add', function(req, res){
    res.send('전송완료~');
    a = req.body.title;
    b = req.body.content;

    db.collection('post').insertOne({title : a, content : b}, function(에러, 결과){
      console.log('저장완료');
    });
  });


  app.listen(8080, function(){
    console.log('listening on 8080');
  });
});



app.get('/pet', function(req, res){
  res.send('펫용품을 볼 수 있은 페이지입니다.');
});

app.get('/beauty', function(req, res){
  res.send('뷰티용품 쇼핑 페이지임');
});

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.get('/write', function(req, res){
  res.sendFile(__dirname + '/write.html');
});

app.get('/list', function(req, res){
  res.render('list.ejs');
});



// app.post('/add', function(req, res){
//   res.send('전송완료~');
//   a = req.body.title;
//   b = req.body.content;
// })


// app.post('/add', function(req, res){
//   res.send('전송완료~');
//   console.log(req.body.title);
//   console.log(req.body.content);
// });