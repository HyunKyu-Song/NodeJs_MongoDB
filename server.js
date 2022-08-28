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

require('dotenv').config();

var db;

MongoClient.connect(process.env.DB_URL, { useUnifiedTopology: true }, function (에러, client) {
   if (에러)
      return console.log(에러);

   db = client.db('todoapp');

   app.listen(process.env.PORT, function () {
      console.log('listening on 8080');
   });
});


app.get('/', function (req, res) {
   res.render('index.ejs');
});

app.get('/write', function (req, res) {
   res.render('write.ejs');
});


app.get('/list', function (req, res) {
   db.collection('post').find().toArray(function (에러, 결과) {
      // console.log(결과);
      res.render('list.ejs', { posts: 결과 });
   });
});


app.get('/detail/:id', function (요청, 응답) {
   db.collection('post').findOne({ _id: parseInt(요청.params.id) }, function (에러, 결과) {
      // console.log(결과);
      응답.render('detail.ejs', { data: 결과 });
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
   // failureRedirect: '/fail'
   failureRedirect: '/login'
}), function (req, res) {
   res.redirect('/')
});


app.get('/logout', function (req, res, next) {
   req.logout(function (err) {
      if (err) {
         return next(err);
      }
      res.send("<script>alert('로그아웃 완료');window.location.replace('/')</script>");
   });
});


app.get('/mypage', login_ok, function (req, res) {
   console.log(req.user);
   res.render('mypage.ejs', { user_data: req.user });
});

//미들웨어 만들어 사용
//미들웨어는 모든 요청과 응답 중간에 실행됨
//req.user은 로그인 후 세션이 생기면 항상 존재함
function login_ok(req, res, next) {
   if (req.user) {
      next();  //통과했다는 뜻
   }
   else {
      res.send("<script>alert('로그인 해주세요.');window.location.replace('/login')</script>");
      // res.write("<script>alert('Please Login')</script>");
      // res.write("<script>window.location.replace('/login')</script>");
      // res.redirect('/login');
      // res.send('로그인 안 했음');
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


app.post('/register', function(req, res){
   db.collection('login').insertOne({user_id : req.body.user_id, user_pw : req.body.user_pw}, function(err, result){
      // res.redirect('/');
      res.send("<script>alert('회원가입 완료');window.location.replace('/')</script>");
   });
});


app.post('/add', function (req, res) {
   // res.send('전송완료~');
   db.collection('count').findOne({ name: '게시물갯수' }, function (err, result) {
      console.log(result.totalPost);
      var 총게시물갯수 = result.totalPost;

      db.collection('post').insertOne({ _id: 총게시물갯수 + 1, 작성자 : req.user._id, title: req.body.title, content: req.body.content }, function (err, result) {
         console.log('저장완료');

         db.collection('count').updateOne({ name: '게시물갯수' }, { $inc: { totalPost: 1 } }, function (err, result) {
            if (err)
               return console.log(err);
         });
         res.redirect('/list');
      });
   });
});


app.delete('/delete', function (req, res) {
   // console.log(req.body);
   // console.log(req.body.작성자);
   req.body._id = parseInt(req.body._id);

   var del_data = { _id : req.body._id, 작성자 : req.user._id};
   db.collection('post').deleteOne(del_data, function (err, result) {
      // console.log(del_data);
      if(req.body.작성자 == req.user._id){
         res.status(200).send({ message: '성공했습니다.' });
      }
      else{
         res.status(400).send({ message: '권한이 없음.' });
      }
      // console.log('삭제완료');
   })
});


app.get('/search', (req, res) => {
   // console.log(req.query);
   var 검색조건 = [
      {
         $search: {
            index: 'titleSearch',
            text: {
               query: req.query.value,
               path: 'title'  // 제목날짜 둘다 찾고 싶으면 ['제목', '날짜']
            }
         }
      },
      { $sort : {_id : 1} } //오름차순 정렬, 내림차순 정렬은 -1
   ]
   db.collection('post').aggregate(검색조건).toArray((err, result) => {
      res.render('search.ejs', { data: result });
      // console.log(result);
   });
});

app.get('/edit/:a', login_ok, function (req, res) {
   db.collection('post').findOne({ _id: parseInt(req.params.a) }, function (err, result) {
      // console.log(`${result.작성자}`);
      // console.log(`${req.user._id}`);

      if(`${result.작성자}` === `${req.user._id}`){
         res.render('edit.ejs', { data_edit: result });
         console.log('같음');
      }
      else{
         res.send("<script>alert('권한이 없습니다.');window.location.replace('/list')</script>");
         // res.write("<script>alert('Not authorized')</script>");
         // res.write("<script>window.location.replace('/list')</script>");
         console.log('다름');
      }
   });
})


app.put('/edit', function (req, res) {
   db.collection('post').updateOne({ _id: parseInt(req.body.id) }, { $set: { title: req.body.title, content: req.body.content } }, function (err, result) {
      res.send("<script>alert('수정 완료');window.location.replace('/list')</script>");
      // res.write("<script>alert('Update Complete')</script>");
      // res.write("<script>window.location.replace('/list')</script>");
      // console.log('수정완료~');
      // res.redirect('/list');
   });
});


// app.use('/shop', require('./routes/shop.js'));
// app.use('/board/sub', require('./routes/board.js'));


let multer = require('multer');
var storage = multer.diskStorage({
   destination : function(req, file, cb){
      cb(null, './public/image')
   },
   filename : function(req, file, cb){
      cb(null, file.originalname)
   }
});

var upload = multer({storage : storage});

app.get('/upload', function(req, res){
   res.render('upload.ejs');
});

app.post('/upload', upload.single('profile'), function(req, res){
   res.send('업로드 완료');
});

app.get('/image/:imageName', function(req, res){
   res.sendFile(__dirname + '/public/image/' + req.params.imageName);
})

