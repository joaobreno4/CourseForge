const jsonServer = require('json-server');
const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();

server.use(middlewares);

// GET /courses/search?name=term
server.get('/courses/search', (req, res) => {
  const { name } = req.query;
  const db = router.db.getState();
  const results = name
    ? db.courses.filter((c) =>
        c.name.toLowerCase().includes(name.toLowerCase())
      )
    : db.courses;
  res.json(results);
});

server.use(router);
server.listen(3000, () => {
  console.log('JSON Server running at http://localhost:3000');
});
