const express = require("express");
const { open } = require("sqlite");
const path = require("path");
const sqlite3 = require("sqlite3");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const databasePath = path.join(__dirname, "./tasks.db");

const app = express();
app.use(express.json());

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server running at http://localhost:3000")
    );
  } catch (error) {
    console.log(`db error ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();


app.post("/login/", async (request, response) => {
  const { username, password_hash } = request.body;
  const getUser = `
    SELECT
    *
    FROM 
    users
    WHERE
    username = '${username}';`;
  const returnedUser = await db.get(getUser);

  if (returnedUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const matchPassword = await bcrypt.compare(password_hash, returnedUser.password);
    if (matchPassword !== true) {
      response.status(400);
      response.send("Invalid password");
    } else {
      const payload = { username: username };
      jwtToken = jwt.sign(payload, "akhil");
      response.send({ jwtToken });
    }
  }
});

const authenticate = (request, response, next) => {
  let jwtToken;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "akhil", async (error, payload) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        next();
      }
    });
  }
};

const convertDbObject = (dbObject) => {
  return {
    id:dbObject.id ,
  title:dbObject.title,
  description:dbObject.description,
  status:dbObject.status ,
  assigneeId:dbObject.assignee_id,
  createdAt:dbObject.created_at,
  updatedAt:dbObject.updated_at 
  };
};

app.get("/tasks", authenticate, async (request, response) => {
  const getTasks = `
    SELECT
    *
    FROM
    tasks`;
  const returnedTasks = await db.all(getTasks);
  response.send(returnedTasks.map((each) => convertDbObject(each)));
});

app.get("/tasks/:id", authenticate, async (request, response) => {
  const { id } = request.params;
  const getTask = `
  SELECT
  *
  FROM
  tasks
  WHERE
  id = '${id}';`;
  const returnedTask = await db.get(getTask);
  response.send({
    id:id ,
  title:returnedTask["title"],
  description:returnedTask["description"],
  status:returnedTask["status"] ,
  assigneeId:returnedTask["assignee_id"],
  createdAt:returnedTask["created_at"],
  updatedAt:returnedTask["updated_at"] 
  });
});

app.post("/tasks", authenticate, async (request, response) => {
  const { id , title,description,status,assigneeId,createdAt,updatedAt} = request.body;
  const addTask = `
  INSERT INTO district(id , title,description,status,assignee_id,created_at,updated_at)
  VALUES('${id}', '${title}', '${description}', '${status}', '${assigneeId}', '${createdAt}', '${updatedAt}');`;
  addedTask = await db.run(addTask);
  response.send("Task Successfully Added");
});

app.delete(
  "/tasks/:id",
  authenticate,
  async (request, response) => {
    const { id } = request.params;
    const deleteTask = `
    DELETE FROM tasks
    WHERE id = '${id}';`;
    const deletedTask = await db.run(deleteTask);
    response.send("Task Removed");
  }
);

app.put("/tasks/:id", authenticate, async (request, response) => {
  const { id } = request.params;
  const { title,description,status,assigneeId,createdAt,updatedAt} = request.body;
  const updateTask = `
  UPDATE tasks
  SET
  title = '${title}',
  description='${description}',status='${status}',assignee_ad='${assigneeId}',created_at='${createdAt}',updated_at='${updatedAt}'
  WHERE 
  id = '${id}';`;
  const updatedTask = await db.run(updateTask);
  response.send("Task Details Updated");
});