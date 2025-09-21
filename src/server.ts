import express, { Request, Response } from 'express';

const app = express();
app.use(express.json());

export interface Post {
    id: number;
    title: string;
    content: string;
    authorId: number;
    createdAt: Date;
    published: boolean;
}


export let users = [
    { id: 1, name: "Thiago", email: "flamengodecoracao@gmail.com", senha: "flamengo123", age: 30, role: "admin" },
    { id: 2, name: "Gabriel Costa", email: "mgm@gmail.com", senha: "paulaodasolda123", age: 22, role: "user" },
    { id: 3, name: "Maria Vitoria", email: "mavi@gmail.com", senha: "euaindaamominhaex", age: 19, role: "user" }
];

export let posts: Post[] = [];




// USERS

// 2
app.get('/users/age-range', (req, res) => {
    const { min, max } = req.query;

    if (!min || !max) {
        res.status(400).send({ message: "Parâmetros 'min' e 'max' são obrigatórios." });
    } else {
        const minAge = Number(min);
        const maxAge = Number(max);

        if (isNaN(minAge) || isNaN(maxAge)) {
            res.status(400).send({ message: "Parâmetros de idade devem ser números." });
        } else {
            const usersFound = users.filter(user => user.age >= minAge && user.age <= maxAge);
            res.status(200).send(usersFound);
        }
    }
});

// 1
app.get('/users/:id', (req, res) => {
    const idToSearch = Number(req.params.id);

    if (isNaN(idToSearch)) {
        res.status(400).send({ message: "ID inválido, deve ser um número." });
    } else {
        const user = users.find(user => user.id === idToSearch);

        if (user) {
            res.status(200).send(user);
        } else {
            res.status(404).send({ message: "Utilizador não encontrado" });
        }
    }
});


// 4
app.put('/users/:id', (req, res) => {
    const idToUpdate = Number(req.params.id);
    const { name, email, role, age } = req.body;

    if (isNaN(idToUpdate)) {
        res.status(400).send({ message: "ID inválido, deve ser um número." });
    } else if (!name || !email || !role || age === undefined) {
        res.status(400).send({ message: "Para atualizar, todos os campos (name, email, role, age) são obrigatórios." });
    } else if (typeof name !== 'string' || typeof email !== 'string' || typeof role !== 'string' || typeof age !== 'number') {
        res.status(400).send({ message: "Tipos de dados inválidos. Verifique os campos enviados." });
    } else {
        const userIndex = users.findIndex(user => user.id === idToUpdate);

        if (userIndex === -1) {
            res.status(404).send({ message: "Utilizador não encontrado" });
        } else {
            const emailOwner = users.find(user => user.email.toLowerCase() === email.toLowerCase());
            if (emailOwner && emailOwner.id !== idToUpdate) {
                res.status(409).send({ message: "E-mail já está em uso por outro utilizador." });
            } else {
                const updatedUser = {
                    ...users[userIndex],
                    name: name,
                    email: email.toLowerCase(),
                    role: role,
                    age: age
                };
                users[userIndex] = updatedUser;
                res.status(200).send({ message: "Utilizador atualizado com sucesso!", user: updatedUser });
            }
        }
    }
});

// 7
app.delete('/users/cleanup-inactive', (req, res) => {
    const { confirm } = req.query;

    if (confirm !== 'true') {
        res.status(400).send({ message: "Parâmetro 'confirm=true' é obrigatório para executar a limpeza." });
    } else {
        const authorIds = new Set(posts.map(post => post.authorId));

        const inactiveUsers = users.filter(user => user.role !== 'admin' && !authorIds.has(user.id));
        
        if (inactiveUsers.length > 0) {
            users = users.filter(user => user.role === 'admin' || authorIds.has(user.id));
        }

        res.status(200).send({
            message: "Limpeza de utilizadores inativos concluída.",
            removedUsers: inactiveUsers
        });
    }
});


// POSTS

// 3
app.post('/posts', (req, res) => {
    const { title, content, authorId } = req.body;

    if (!title || !content || !authorId) {
        res.status(400).send({ message: "É necessário preencher todos os campos" });
    } else if (title.length < 3) {
        res.status(400).send({ message: "O título deve conter pelo menos 3 caracteres" });
    } else if (content.length < 10) {
        res.status(400).send({ message: "Conteúdo deve ter pelo menos 10 caracteres" });
    } else {
        const authorExists = users.find(user => user.id === authorId);

        if (!authorExists) {
            res.status(404).send({ message: `Autor com id ${authorId} não foi encontrado.` });
        } else {
            const newPost: Post = {
                id: posts.length + 1, 
                title: title,
                content: content,
                authorId: authorId,
                createdAt: new Date(),
                published: false,
            };
            posts.push(newPost);
            res.status(201).send({ message: "Post criado com sucesso!", post: newPost });
        }
    }
});

// 5
app.patch('/posts/:id', (req , res) => {
    const idToUpdate = Number(req.params.id);
    const dataToUpdate = req.body;

    if (isNaN(idToUpdate)) {
        res.status(400).send({ message: "ID do post inválido, deve ser um número." });
    } else {
        const postIndex = posts.findIndex(post => post.id === idToUpdate);

        if (postIndex === -1) {
            res.status(404).send({ message: "Post não encontrado" });
        } else {

            const forbiddenKeys = ['id', 'authorId', 'createdAt'];
            let hasForbiddenKey = false;
            for (let i = 0; i < forbiddenKeys.length; i++) {
                const key = forbiddenKeys[i];
                if (key in dataToUpdate) {
                    res.status(400).send({ message: `Não é permitido alterar o campo '${key}'.` });
                    hasForbiddenKey = true;
                    break;
                }
            }

            if (!hasForbiddenKey) {
                posts[postIndex] = { ...posts[postIndex], ...dataToUpdate };
                res.status(200).send({ message: "Post atualizado com sucesso!", post: posts[postIndex] });
            }
        }
    }
});

// 6
app.delete('/posts/:id', (req, res) => {
    const idToDelete = Number(req.params.id);
    const userId = Number(req.headers['user-id']); 

    if (isNaN(idToDelete)) {
        res.status(400).send({ message: "ID do post inválido, deve ser um número." });
    } else if (isNaN(userId)) {
        res.status(400).send({ message: "Header 'User-Id' é obrigatório e deve ser um número." });
    } else {
        const postIndex = posts.findIndex(post => post.id === idToDelete);
        const user = users.find(user => user.id === userId);

        if (postIndex === -1) {
            res.status(404).send({ message: "Post não encontrado." });
        } else if (!user) {
            res.status(404).send({ message: "Utilizador da requisição não encontrado." });
        } else {
            const postToDelete = posts[postIndex];

            if (postToDelete.authorId !== userId && user.role !== 'admin') {
                res.status(403).send({ message: "Ação não autorizada. Apenas o autor ou um admin pode apagar este post." });
            } else {
                posts.splice(postIndex, 1);
                res.status(200).send({ message: "Post apagado com sucesso." });
            }
        }
    }
});



app.listen(3003, () => {
    console.log('Servidor rodando na porta 3003');
});

