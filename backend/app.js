const express = require("express");
const path = require("path");
const {open} = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todo.db");

let db = null;

const initializeDBAndServer = async () => {
    try {
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database,
        });

        app.listen(3000, () => {
            console.log("Server Running at http://localhost:3000/");
        });
    } catch (e) {
        console.log(`DB Error: ${e.message}`);
        process.exit(1);
    }
};
initializeDBAndServer();

const convertDBTodo = (dbTodo) => {
    return {
        id: dbTodo.id,
        todo: dbTodo.todo,
        completed: dbTodo.completed === 1,
    };
};

// API 1 GET AII TODOS

app.get("/todos/", async(request, response) => {
    const query = `
    SELECT id, title AS todo, completed FROM todo;
    `;
    const todos = await db.all(query);
    response.send(todos.map(convertDBTodo));
});

//API 2 ADD TODO

app.post(["/todos", "/todos/"], async(request, response) => {
    const {todo} = request.body;

    if (!todo) {
        response.status(400);
        response.send("Todo is required");
        return;
    }

    const query = `
    INSERT INTO todo(title)
    VALUES(?);
    `;
    await db.run(query, todo);
    response.send("Todo Successfully Added");
});

//API 3 GET SINGLE TODO

app.get(["/todos/:id", "/todos/:id/"], async(request, response) => {
    const {id} = request.params;
    const query = `
    SELECT id, title AS todo, completed FROM todo
    WHERE id = ?;
    `;

    const todo = await db.get(query, id);
    if (!todo) {
        response.status(404);
        response.send("Todo Not Found");
        return;
    }
    response.send(convertDBTodo(todo));
});

//API 4 UPDATE TODO

app.put(["/todos/:id", "/todos/:id/"], async(request, response) => {
    const {id} = request.params;
    const {todo, completed} = request.body;

    const completedValue = completed ? 1 : 0;

    const query = `
    UPDATE todo
    SET title = ?,
    completed = ?
    WHERE id = ?;
    `;
    await db.run(query, todo, completedValue, id);
    response.send("Todo Updated Successfully");
});

//API DELETE TODO

app.delete(["/todos/:id", "/todos/:id/"], async(request, response) => {
    const {id} = request.params;

    const query = `
    DELETE FROM todo
    WHERE id = ?;
    `;

    await db.run(query, id);
    response.send("Todo Deleted Successfully");
});

module.exports = app;