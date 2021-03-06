var db = require('./db')
var template = require('./template')
var path = require('path');
var qs = require('querystring');
var url = require('url');
var sanitizeHtml = require('sanitize-html');

exports.home = function (request, response) {
    db.query('SELECT * FROM topic', function (error, topics) {
        var title = 'WELCOME';
        var description = 'make coding with node.js!!';
        var list = template.List(topics);
        var html = template.HTML(title, list, description,
            `<a href="/create">CREATE</a>`);
        response.writeHead(200);
        response.end(html);
    });
}

exports.page = function (request, response) {
    var _url = request.url;
    var queryData = url.parse(_url, true).query;
    var pathname = url.parse(_url, true).pathname;
    db.query('SELECT * FROM topic', function (error, topics) {
        if (error) { throw error };
        var filterID = path.parse(queryData.id).base;
        db.query('SELECT * FROM topic LEFT JOIN  author ON topic.author_id=author.id WHERE topic.id=?', [filterID], function (error2, topic) {
            if (error2) { throw error2 };
            var sanitizeTitle = sanitizeHtml(topic[0].title);
            var sanitizeDescription = sanitizeHtml(topic[0].description, { allowedTags: ['h1'] });
            var list = template.List(topics);
            var html = template.HTML(sanitizeTitle, list,
                `${sanitizeDescription}
                <n><h3>by ${topic[0].name}</h3>`,
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

exports.create = function (request, response) {
    db.query('SELECT * FROM topic', function (error, topics) {
        db.query('SELECT * FROM author', function (error2, authors) {
            var description = `
            <form action="/create_process" method="post">
            <p><input name="title" type="text" placeholder="title"></p>
            <p><textarea name="description" placeholder="description"></textarea></p>
            <p>${template.authorSelect(authors)}</p>
            <p><input type="submit"></p>
            </form>
            `;
            var list = template.List(topics);
            var html = template.HTML('CREATE', list, description,
                `<a href="/create">CREATE</a>`);
            response.writeHead(200);
            response.end(html);
        });
    });
}

exports.create_process = function (request, response) {
    var body = "";
    request.on('data', function (data) {
        body = body + data;
    });
    request.on('end', function () {
        var post = qs.parse(body);
        db.query(`INSERT INTO topic (title,description,created,author_id) VALUES(?,?,?,?)`, [post.title, post.description, '2018-01-01 12:10:11', post.author_id],
            function (error, result) {
                if (error) { throw error };
                response.writeHead(302, { Location: `/?id=${result.insertId}` });
                response.end();
            }
        )
    });
}

exports.update = function (request, response) {
    var _url = request.url;
    var queryData = url.parse(_url, true).query;
    var pathname = url.parse(_url, true).pathname;
    db.query('SELECT * FROM topic', function (error, topics) {
        if (error) { throw error };
        db.query('SELECT * FROM author', function (error2, authors) {
            if (error2) { throw error2 };
            db.query(`SELECT * FROM topic WHERE id=?`, [queryData.id], function (error3, topic) {
                if (error3) { throw error3 };
                var list = template.List(topics);
                var html = template.HTML('UPDATE', list, `
                <form action="/update_process" method="post">
                <input type="hidden" name="id" value="${topic[0].id}">
                <p><input name="title" type="text" placeholder="title" value="${sanitizeHtml(topic[0].title)}"></p>
                <p><textarea name="description" placeholder="description">${sanitizeHtml(topic[0].description)}</textarea></p>
                <p>${template.authorSelect(authors, topic[0].author_id)}</p>
                <p><input type="submit"></p>
                </form>
                `,
                    `<a href="/create">CREATE</a>`);
                response.writeHead(200);
                response.end(html);
            });
        });
    });
}
exports.update_process = function (request, response) {
    var body = "";
    request.on('data', function (data) {
        body = body + data;
    });
    request.on('end', function () {
        var post = qs.parse(body);
        db.query('UPDATE topic SET title=?, description=?, author_id=? WHERE id=?', [post.title, post.description, post.author_id, post.id], function (error, result) {
            if (error) { throw error };
            response.writeHead(302, { Location: `/?id=${post.id}` });
            response.end();
        });
    });
}

exports.delete_process = function (request, response) {
    var body = "";
    request.on('data', function (data) {
        body = body + data;
    });
    request.on('end', function () {
        var post = qs.parse(body);
        db.query('DELETE FROM topic WHERE id=?', [post.id], function (error, result) {
            if (error) { throw error };
            response.writeHead(302, { Location: '/' });
            response.end();
        });
    });

}