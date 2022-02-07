import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import upload from 'express-fileupload';
import session from 'express-session';
import fs from 'fs';
import User from './models/user.js';
import db from "./config.js";
import axios from 'axios';

function rnd(max) {
    return Math.floor(Math.random() * max) +1;
}

const app = express();
app.use(session({
    secret: 'keyboard cat',
    cookie: { maxAge: 100000000000000 },
    resave: false,
    saveUninitialized: true
}));

mongoose.connect(db, err =>{
    if(err){
        console.error('error' + err);
    }else{
        console.log('connected at mongoDb');
    }
});

app.use(upload({
    createParentPath: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('./assets'));


app.listen(8000, () => {
    console.log("le serveur demmare");
});

app.get('/', async (req, res) =>{
    const user = await User.findOne({ _id: req.session.userid });
    if(user){
        res.render('./user/listCards.twig',{
            pokedex: user.pokedex,
            user: user,
            badges: user.badges
        })
    }else {
        res.redirect('/connect')
        
    }
    
})

app.get('/addCard', async (req, res) => {
    const user = await User.findOne({ _id: req.session.userid });
    let pokeindex;
    let r = 0;

    while(true){
        let pokemonExist = false;
        r = rnd(151);

        if (user.pokedex.length === 0) {
            pokeindex = r;
            break;
        }

        if (user.pokedex.length === 151) res.redirect('/');

        for (let i = 0; i < user.pokedex.length; i++){
            if(user.pokedex[i].index === r) {
                pokemonExist = true;
            }
        }

        if (!pokemonExist) {
            pokeindex = r;
            break
        }
    }
    

    const poke = await axios.get('https://pokeapi.co/api/v2/pokemon/'+pokeindex)

    let pokemon ={
        id: poke.data.id,
        index: pokeindex,
        name: poke.data.name,
        type: poke.data.types[0].type.name + (poke.data.types[1] == undefined ? "" : '-' + poke.data.types[1].type.name),
        img: poke.data.sprites.front_default
    }
    user.pokedex.push(pokemon);

    if(user.pokedex.length%18 === 0){
        if(user.badges.length <8){
            await user.badges.push(user.badges.length +1);
        }
    }

    if (user.pokedex.length === 151) {
        await user.badges.push("Best trainer");
    }
    
    User.updateOne({ _id: req.session.userid }, { badges: user.badges }, (error, user) => {
        if(error){
            console.log(error);
            res.status(404);
        }
    })

    User.updateOne({ _id: req.session.userid }, { pokedex: user.pokedex } , (error, user) => {
        if(error){
            console.log(error);
            res.status(404);
        }else {
            res.redirect('/')
        }
    })
})

app.get('/updateCard/:id', async (req, res) =>{
   const user = await User.findOne({ _id: req.session.userid })
   const index = user.pokedex.findIndex(pokedex => pokedex.id == req.params.id);
   res.render('./user/addCard.twig',{
       pokeid: user.pokedex[index].id,
       action: "/updateCard"
   })
})

app.post('/updateCard/:id', async (req, res) =>{
    const card = await User.findOne({ _id: req.session.userid });    
    const index = card.pokedex.findIndex(pokedex => pokedex.id == req.params.id);

    card.pokedex[index].id = Date.now();
    card.pokedex[index].name = req.body.name;
    card.pokedex[index].type = req.body.type;

    User.updateOne({ _id: req.session.userid }, { pokedex: card.pokedex } , (error, user) => {
        if(error){
            console.log(error);
            res.status(404);
        }else{
            res.redirect('/')
        }
    })  
})

app.get('/deleteCard/:id', async (req, res) =>{
    const card = await User.findOne({ _id: req.session.userid });    
    const index = card.pokedex.findIndex(pokedex => pokedex.id == req.params.id);
    card.pokedex.splice(index, 1);
    await card.save();

    res.redirect('/');
})

app.get ('/addUser', async (req, res)=> {
    res.render('./user/addUser.twig', {

    })
})

app.post('/addUser', async (req, res) => {
    const user = new User(req.body)
    user.save()
    res.redirect('/')
})

app.get('/connect', async (req, res) => {
    res.render('./user/connect.twig', {
       action: "/connect",
    })
})

app.post('/connect', async (req, res) => {
    let obj ={
        name: req.body.name,
        password: req.body.password,
    }
    const user = await User.findOne(obj);
    if(user){
        req.session.userid = user._id
    }

    res.redirect('/')
})