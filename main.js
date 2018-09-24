var http = require('http');
var fs = require('fs');
var url = require('url');
var qs = require('querystring');
var template = require('./lib/template.js')
var path = require('path');
var sanitizeHtml = require('sanitize-html');
var mysql = require('mysql');
var db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password:'123456',
    database:'nodejs'
});
db.connect();

var app = http.createServer(function (request, response) {
    var _url = request.url;
    var queryData = url.parse(_url, true).query;
    var pathname = url.parse(_url, true).pathname;

    if (pathname === '/') {
        if (queryData.id === undefined) {
            db.query('SELECT * FROM topic', function (error, topics) {
                var title = 'WELCOME';
                var description = 'make coding with node.js!!';
                var list = template.List(topics);
                var html = template.HTML(title, list, description,
                    `<a href="/create">CREATE</a>`);
                response.writeHead(200);
                response.end(html);
            });
        } else {
            db.query('SELECT * FROM topic', function (error, topics) {
                var filterID = path.parse(queryData.id).base;
                db.query('SELECT * FROM topic WHERE id=?',[filterID], function (error2, topic) {
                    var sanitizeTitle = sanitizeHtml(topic[0].title);
                    var sanitizeDescription = sanitizeHtml(topic[0].description, { allowedTags: ['h1'] });
                    var list = template.List(topics);
                    var html = template.HTML(sanitizeTitle, list, sanitizeDescription,
                        `<a href="/create">CREATE</a>
                        <a href="/update?id=${queryData.id}">UPDATE</a>
                        <form action="/delete_process" method="post">
                        <input type="hidden" name="id" value="${queryData.id}">
                        <input type="submit" value="delete">
                        </form>`);
                    response.writeHead(200);
                    response.end(html);
                });
            });

        }
    } else if (pathname === '/create') {
        fs.readdir('./data', function (error, filelist) {
            var description = `
            <form action="/create_process" method="post">
            <p><input name="title" type="text" placeholder="title"></p>
            <p><textarea name="description" placeholder="description"></textarea></p>
            <p><input type="submit"></p>
            </form>
            `;
            var list = template.List(filelist);
            var html = template.HTML('CREATE', list, description,
                `<a href="/create">CREATE</a>`);
            response.writeHead(200);
            response.end(html);
        });
    } else if (pathname === '/create_process') {
        var body = "";
        request.on('data', function (data) {
            body = body + data;
        });
        request.on('end', function () {
            var post = qs.parse(body);
            var title = post.title;
            var description = post.description;
            fs.writeFile(`data/${title}`, description, 'utf8', function (err) {
                response.writeHead(302, { Location: `/?id=${title}` });
                response.end();
            });
        });
    } else if (pathname === '/update') {
        fs.readdir('./data', function (error, filelist) {
            var title = queryData.id;
            var list = template.List(filelist);
            var filterID = path.parse(queryData.id).base;
            fs.readFile(`data/${filterID}`, 'utf8', function (err, description) {
                var html = template.HTML('UPDATE', list, `
                <form action="/update_process" method="post">
                <input type="hidden" name="id" value="${title}">
                <p><input name="title" type="text" placeholder="title" value="${title}"></p>
                <p><textarea name="description" placeholder="description">${description}</textarea></p>
                <p><input type="submit"></p>
                </form>
                `,
                    `<a href="/create">CREATE</a>`);
                response.writeHead(200);
                response.end(html);
            });
        });
    } else if (pathname === '/update_process') {
        var body = "";
        request.on('data', function (data) {
            body = body + data;
        });
        request.on('end', function () {
            var post = qs.parse(body);
            var id = post.id;
            var title = post.title;
            var description = post.description;
            fs.rename(`data/${id}`, `data/${title}`, function (error) {
                fs.writeFile(`data/${title}`, description, 'utf8', function (err) {
                    response.writeHead(302, { Location: `/?id=${title}` });
                    response.end();
                });
            });
        });
    } else if (pathname === '/delete_process') {
        var body = "";
        request.on('data', function (data) {
            body = body + data;
        });
        request.on('end', function () {
            var post = qs.parse(body);
            var id = post.id;
            var filterID = path.parse(id).base;
            fs.unlink(`data/${filterID}`, function (error) {
                response.writeHead(302, { Location: `/` });
                response.end();
            });
        });
    } else {
        response.writeHead(404);
        response.end('not found');
    }
});

app.listen(3000);
