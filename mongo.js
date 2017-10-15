"use strict";

const mongoose    = require("mongoose").connect("mongodb://localhost:27017/test");
const express     = require("express");
const bodyParser  = require("body-parser");
const path        = require("path");
const app         = express();
const PORT        = 3000;

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({"extended": true}));

const api = express.Router();
app.use("/mongo/", api);

const db = mongoose.connection;
db.on("error", () => {console.log("Не могу подключиться к серверу")});
db.once("open", () => {
  console.log("Соединение установлено");
  let UserSchema = mongoose.Schema({
    name: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 15
    }
  });
  let TaskSchema = mongoose.Schema({
    name: {
      type: String,
      required: true,
      minlength: [1, "Invalid name"],
      maxlength: [15, "Too big name"]
    },
    definition: {
      type: String,
      minlength: [5, "Too small definition"],
      maxlength: [25, "Too big definition"]
    },
    status: {
      type: String,
      required: true,
      enum: ["Opened", "Closed"],
      default: "Opened"
    },
    user: {
      type: String,
      required: false,
      minlength: [1, "Invalid name"],
      maxlength: [15, "Too big name"]
    },
    deadline: {
      type: Date,
      required: true,
      default: Date.now
    }
  });
  TaskSchema.virtual("url").get(function(){return "/tasks/" + this._id});

  let User = mongoose.model("UserModel", UserSchema);
  let Task = mongoose.model("TaskModel", TaskSchema);

  // Отображаем страницу пользователей по дефолту, по клике на кнопку переносим на задачи
  api.get("/users/", (req, res) => {
    User.find({})
      .then(result => {
        res.render("users.ejs", {
          result: result
        });
      })
      .catch(err => {
        console.log("Не могу выполнить поиск по пользователям");
        throw err;
      });
  });

// Добавляем нового пользователя
  api.post("/users/", (req, res) => {
    let name = req.body.name;
    User.create({name: name})
      .then(() => {
        console.log("Добавление нового документа прошло успешно");
        res.redirect("/api/users");
      })
      .catch(err => {
        console.log("Не могу вставить документ");
        throw err;
      })
  });

// Удаляем пользователя
  api.delete("/users/:_id", (req, res) => {
    let id = req.params._id;
    User.remove({_id: id})
      .then(() => {
        console.log("Удаление документа прошло успешно");
        res.end();
      })
      .catch(err => {
        console.log("Не могу удалить документ");
        throw err
      })
  });

// Изменяем пользователя: ERROR UserModel validation failed
  api.post("/users/:_id", (req, res) => {
    let id = req.params._id;
    console.log(id);
    let newName = req.body.newName;
    console.log(newName);
    User.update({_id: id}, {$set: {name: newName}})
      .then(() => {
        console.log("Изменение документа прошло успешно");
        res.end();
      })
      .catch(err => {
        console.log("Не могу изменить документ");
        throw err;
      })
  });

// Отображаем список задач
  api.get("/tasks/", (req, res) => {
    Task.find().sort({deadline: -1})
      .then(result => {
        res.render("tasks.ejs", {
          result: result
        });
      })
      .catch(err => {
        console.log("Не могу выполнить поиск по задачам");
        throw err;
      })
  });

// Отображаем задачу
  api.get("/tasks/:_id", (req, res) => {
    let id = req.params._id;
    Task.findOne({_id: id})
      .then(result => {
        res.render("task.ejs", {
          result: result
        });
      })
      .catch(err => {
        console.log("Не могу найти задачу");
        throw err;
      })
  });

// Закрываем задачу
  api.put("/tasks/:_id", (req, res) => {
    let id = req.params._id;
    let status = req.body.status;
    Task.update({_id: id}, {$set: {status: status}})
      .then(() => {
        console.log("Изменение документа прошло успешно");
        res.end();
      })
      .catch(err => {
        console.log("Не могу изменить документ");
        throw err;
      })
  });

// Удаляем задачу
  api.delete("/tasks/:_id", (req, res) => {
    let id = req.params._id;
    Task.remove({_id: id})
      .then(() => {
        console.log("Удаление документа прошло успешно");
        res.end();
      })
      .catch(err => {
        console.log("Не могу удалить документ");
        throw err
      })
  });

// Добавляем новую задачу
  api.post("/tasks/", (req, res) => {
    let name = req.body.name;
    let definition = req.body.definition;
    let status = req.body.status;
    let userName = req.body.userName;
    let deadline = req.body.deadline;

    Task.create({name: name}, {definition: definition}, {status: status}, {user: userName}, {deadline: deadline})
      .then(() => {
        console.log("Добавление нового документа прошло успешно");
        res.redirect("/api/tasks");
      })
      .catch(err => {
        console.log("Не могу вставить документ");
        throw err;
      })
  });


// Обработчики ошибок
  let badRequest = (req, res) => {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Bad Request');
  };

  let notFound = (req, res) => {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Not Found');
  };
 app.use(badRequest);
  app.use(notFound);

  app.listen(PORT);
});

