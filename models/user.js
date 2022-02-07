import mongoose from "mongoose";


const userSchema = new mongoose.Schema({
    name: String,
    password: String,
    mail: String,
    pokedex: Array,
    badges: Array
})

const User = mongoose.model('User', userSchema)

export default User;