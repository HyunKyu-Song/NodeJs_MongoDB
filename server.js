const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
const MongoClient = require('mongodb').MongoClient;
app.set('view engine', 'ejs');
app.use('/public', express.static('public'));

const methodOverride = require('method-override');
const { render } = require('ejs');
app.use(methodOverride('_method'));


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
   res.render('index.ejs');
});

app.get('/write', function (req, res) {
   res.render('write.ejs');
});

app.post('/add', function (req, res) {
   // res.send('전송완료~');
   db.collection('count').findOne({ name: '게시물갯수' }, function (에러, 결과) {
      console.log(결과.totalPost);
      총게시물갯수 = 결과.totalPost;

      db.collection('post').insertOne({ _id: 총게시물갯수 + 1, title: req.body.title, content: req.body.content }, function (에러, 결과) {
         console.log('저장완료');

         db.collection('count').updateOne({ name: '게시물갯수' }, { $inc: { totalPost: 1 } }, function (에러, 결과) {
            if (에러)
               return console.log(에러);
         });
         res.redirect('/list');
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
      res.status(200).send({ message: '성공했습니다.' });
   })
});

app.get('/detail/:id', function (요청, 응답) {
   db.collection('post').findOne({ _id: parseInt(요청.params.id) }, function (에러, 결과) {
      // console.log(결과);
      응답.render('detail.ejs', { data: 결과 });
   });
});

app.get('/edit/:a', function (req, res) {
   db.collection('post').findOne({ _id: parseInt(req.params.a) }, function (err, result) {
      console.log(result);
      res.render('edit.ejs', { data_edit: result });
   });
})

app.put('/edit', function (req, res) {
   db.collection('post').updateOne({ _id: parseInt(req.body.id) }, { $set: { title: req.body.title, content: req.body.content } }, function (err, result) {
      console.log('수정완료~');
      res.redirect('/list');
   });
});


const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');

app.use(session({ secret: '비밀코드', resave: true, saveUninitialized: false }));
app.use(passport.initialize()); //미들웨어로 모든 요청과 응답 중간에 실행됨
app.use(passport.session()); //미들웨어로 모든 요청과 응답 중간에 실행됨


app.get('/login', function (req, res) {
   res.render('login.ejs');
});

app.post('/login', passport.authenticate('local', {
   failureRedirect: '/fail'
}), function (req, res) {
   res.redirect('/')
});


app.get('/logout', function (req, res, next) {
   req.logout(function (err) {
      if (err) {
         return next(err);
      }
      res.redirect('/');
   });
});


app.get('/mypage', login_ok, function (req, res) {
   console.log(req.user);
   res.render('mypage.ejs', { user_data: req.user })
})

//미들웨어 만들어 사용
//미들웨어는 모든 요청과 응답 중간에 실행됨
//req.user은 로그인 후 세션이 생기면 항상 존재함
function login_ok(req, res, next) {
   if (req.user) {
      next();  //통과했다는 뜻
   }
   else {
      res.send('로그인 안 했음');
   }
}


passport.use(new LocalStrategy({
   usernameField: 'user_id',
   passwordField: 'user_pw',
   session: true,
   passReqToCallback: false,
}, function (입력한아이디, 입력한비번, done) {
   console.log(입력한아이디, 입력한비번);
   db.collection('login').findOne({ user_id: 입력한아이디 }, function (에러, 결과) {
      if (에러) return done(에러)

      if (!결과) return done(null, false, { message: '존재하지않는 아이디요' })
      if (입력한비번 == 결과.user_pw) {
         return done(null, 결과)
      } else {
         return done(null, false, { message: '비번틀렸어요' })
      }
   })
}));

passport.serializeUser(function (user, done) {
   done(null, user.user_id)
});

// user.user_id가 아이디 부분에 들아감
passport.deserializeUser(function (아이디, done) {
   db.collection('login').findOne({ user_id: 아이디 }, function (err, result) {
      done(null, result)
   })
}); 