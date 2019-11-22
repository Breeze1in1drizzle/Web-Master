// 'use strict'
// Node中无需指定package com.tedu.xuezi

// 导入其他的包 import mysql
let mysql = require('mysql')    // 通过使用变量获取mysql包的返回值

// 使用第三方包提供的函数和对象
// 创建数据库连接池
let pool = mysql.createPool({
    host:               '127.0.0.1',
    port:               '3306',     // 端口的''可加可不加，即写成3306也可
    user:               'root',
    password:           '',
    database:           'xz',
    connectionLimit:    10          // 连接池大小
})
// {}表示对象

/**小测试：使用连接池查询数据库中的数据 */
// // let sql = "SELECT * FROM xz_user "
// // let sql = "SELECT * FROM xz_user WHERE uid=200"
// let sql = "INSERT INTO xz_user(uid, uname, upwd, email, phone) VALUES(NULL, 'king', '999', 'king@tedu.cn', '13509999999')";
// // Java:    result = pool.query(sql)
// // 等待数据库返回结果：一个服务员为多顾客提供服务，顾客需等待。（多线程）
// pool.query(sql, function(err, result, metadata){
//     if(err){
//         throw err
//     }
//     // console.log(err)
//     console.log(result)
//     // console.log(metadata)
//     console.log('1数据库查询执行完成')
// })
// // 单线程不会等待任何人     查完数据库回调：异步

// console.log('2脚本执行完毕')


// 导入第三方模块：express，创建基于Node.js的Web服务器
let express = require('express')

// 调用第三方模块提供的功能
let server = express()

// 运行Web服务器监听特定的端口
let port = 5050     // 9876
server.listen(port, function(){
    console.log('服务器启动成功，正在监听端口：', port)
})


/*********************************************/
/********************后台API*************************/
/*********************************************/


// 使用Express提供的中间件：处理POST请求中的主体数据，保存在req.body属性中
// application/x-www-form-urlencoded类型的请求数据      
server.use(express.urlencoded({
    extended: false     // 是否使用扩展工具解析请求主体
}))

/**
 * 1.2商品详情
 */
// 异步回调方式进行处理
server.get('/product/detail', function(req, res){
    // 接受客户端提交的请求数据 lid
    let lid = req.query.lid     // request.query.(这里是需要的参数，对应浏览器)
    if(!lid){
        res.json({})
        return 
    }
    // 查询数据库
    let output = {details:{}, family:{}}        // 设置为null，方便后续判断是否为空对象ture or false
    let detailsLoaded = false   // 笔记本详情加载完成了吗？
    let familyLoaded = false    // 型号信息加载完成了吗？
    // 查询1：根据笔记本的编号查询到对应的型号编号，据此查询出型号的信息
    let sql = 'SELECT fid, fname FROM xz_laptop_family WHERE fid=(SELECT family_id FROM xz_laptop WHERE lid=?)';
    pool.query(sql, [lid], function(err, result){      // 回调函数（异步）
        // 规格？
        if(err){
            throw err
        }
        if(result.length>0){    // 根据笔记本的编号查询到了对应的型号对象
            output.family = result[0]
            // 根据型号编号，查询属于该编号的笔记本编号和规格
            let sql = 'SELECT lid, spec FROM xz_laptop WHERE family_id=?';
            pool.query(sql, [output.family.fid], function(err, result){
                if(err){
                    throw err
                }
                output.family.laptopList = result   // laptopList是数组类型，所以不是result[0]
                familyLoaded = true     // 至此，笔记本型号，以及该型号下的所有笔记本加载完成
                // 向客户端输出响应消息——只有笔记本信息已经获得到才输出
                if(detailsLoaded){       // 如果笔记本详情也加载完成，则执行输出
                    res.json(output)
                }
            })
        }else{
            familyLoaded = true     // 型号加载完成——没有找到
            if(detailsLoaded){
                res.json(output)
            }
        }
    })
    // 查询2：根据笔记本编号查询笔记本信息
    let sql2 = 'SELECT * FROM xz_laptop WHERE lid=?';
    pool.query(sql2, [lid], function(err, result){
        if(err){
            throw err
        }
        if(result.length>0){        // 查询到了笔记本详情
            output.details = result[0]
            // 根据笔记本编号，获取属于该笔记本图片
            let sql = 'SELECT * FROM xz_laptop_pic WHERE laptop_id=?';
            pool.query(sql, [lid], function(err, result){
                if(err){
                    throw err
                }
                output.details.picList = result
                // 向客户端输出响应消息——只有笔记本型号已经获得到才输出
                detailsLoaded = true
                if(familyLoaded){       // 如果型号信息加载完成，则执行输出 
                    res.json(output)
                }
            })
        }else{      // 未查询到笔记本详情
            detailsLoaded = true
            if(familyLoaded){
                res.json(output)
            }
        }
    })
})


/**
 * 1.5首页数据
 */
server.get('/index', function(req, res){
    
})





/**
 * 2.1用户注册
 */
server.post('/user/register', function(req, res){
    // 读取客户端提交的请求数据
    // console.log('BODY: ', req.body)
    let n = req.body.uname
    let p = req.body.upwd
    let m = req.body.email
    let h = req.body.phone

    if(!n){
        res.json( {code:401, msg:'uname required'} )    // 9:50
        return 
    }
    if(!p){
        res.json( {code:402, msg:'upwd required'} )
        return 
    }
    if(!m){
        res.json( {code:403, msg:'email required'} )
        return 
    }
    if(!h){
        res.json( {code:404, msg:'phone required'} )
        return 
    }
    // 执行数据库操作——SELECT
    let sql1 = 'SELECT uid FROM xz_user WHERE uname=? OR email=? OR phone=?';
    pool.query(sql1, [n, m, h], function(err, result){
        if(err){
            throw err
        }
        if(result.length>0){
            res.json( {code:500, msg:'user already exists'} )
            return 
        }
        // 执行数据库操作——INSERT
        let sql2 = 'INSERT INTO xz_user(uname, upwd, email, phone) VALUES(?, ?, ?, ?)';
        pool.query(sql2, [n, p, m, h], function(err, result){        // 这里的数组[n, p, m, h]??
            if(err){
                throw err
            }
            // 向客户端输出响应消息——返回数据中附加了新增的用户自增编号
            res.json( {code:200, msg:'register succ', uid:result.insertId} )
        })

    })
 
    
})



/**
 * 2.3用户检索
 */
server.get('/user/detail', function(req, res){      // request, response
    // console.log('服务器接收到一个请求：')
    // console.log(req)
    // res.send('Hello, world!')

    // 读取客户端请求消息传来的请求数据 uid
    // QueryString 查询字符串，一个地址后面可以用?起头查询字符串，用于向服务器查询
    // 比如：http://127.0.0.1:5050/user/detail?uid=1
    // console.log(req.query)
    let uid = req.query.uid
    if(!uid){   // json字符串得用双引号
        // 这个if处理客户端未提交uid的情形
        // let data = {myName:'华师大'}
        res.json( /*data*/  {} )        // 把JS数据转换为JSON格式字符串，并发送给客户端 
        /**
         * java内没有转json的程序，需要第三方包，相对这里更复杂
         */
    }


    // 向数据库查询执行uid的用户记录
    let sql = 'SELECT uid, uname, email, phone, avatar, user_name, gender FROM xz_user WHERE uid=?';
    // [uid]根据上面的?数量来决定，页面传了多少个参数，[uid]数组就有多少个元素
    pool.query(sql, [uid], function(err, result){
        if(err){
            throw err;
        }
        // 查询到的数据发送给客户端
        if(result.length>0){    // 根据uid查询到了用户记录
            res.json(result[0])
        }else{      // 根据uid没有查询到用户记录
            res.json({})
        }
    })

    // 查询到的数据发送给客户端

})

