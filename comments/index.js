const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { randomBytes} = require('crypto')
const axios = require("axios");

const app = express();
app.use(bodyParser.json());
app.use(cors());
const commentsByPostId = {}

app.get('/posts/:id/comments', (req, res) => {
    res.send(commentsByPostId[req.params.id] || [])
});

app.post('/posts/:id/comments', async (req, res) => {
    const commentId = randomBytes(4).toString('hex');
    const { content } = req.body;
    const comments = commentsByPostId[req.params.id] || [];

    comments.push({
        id: commentId,
        status: 'pending',
        content,
    });

    commentsByPostId[req.params.id] = comments;

    await axios.post('http://localhost:4005/events', {
        type: 'CommentCreated',
        data: {
            id: commentId,
            content,
            postId: req.params.id,
            status: 'pending',
        }
    })

    res.status(201).send(comments);
});

app.post('/events', (req, res) => {
    const {type, data} = req.body;
    console.log('Received Event', type);

    if (type === 'CommentModerated') {
        const {postId, id, status, content} = data;
        const comments = commentsByPostId[postId];
        const comment = comments.find((comment) => comment.id === id);

        comment.status = status;

        axios.post('http://localhost:4005', {
            type: 'CommentUpdated',
            data: {
                id,
                postId,
                status,
                comment,
                content
            }
        })
    }

    res.send({})
})

app.listen(4001, () => {
    console.log('Listening on 4001');
});